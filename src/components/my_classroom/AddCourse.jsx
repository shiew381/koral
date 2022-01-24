import React, { useState } from "react";
import { Formik, Form, Field } from "formik";
import { Box, Button, Fab, InputAdornment } from "@material-ui/core";
import { Radio, TextField, IconButton, Divider } from "@material-ui/core";
import { Typography, CircularProgress } from "@material-ui/core";
import { List, ListItem, ListItemText } from "@material-ui/core";
import { ListItemSecondaryAction } from "@material-ui/core";
import { Modal, Backdrop, Fade } from "@material-ui/core";
import { Search } from "@material-ui/icons";
import AddIcon from "@material-ui/icons/Add";
import CheckIcon from "@material-ui/icons/Check";
import LockIcon from "@material-ui/icons/Lock";
import { addCourse, getUserDisplayName } from "../../app/firestoreClient.js";
import firebase from "../../app/config/firebaseConfig.js";
import {
  generateRandomCode,
  makeSearchFriendly,
  capitalizeFirstLetter,
} from "../../app/utils/utils.js";

const CourseTitleField = (props) => (
  <TextField
    label="Title"
    id="course title"
    variant="filled"
    fullWidth
    {...props}
  />
);
const DescriptionField = (props) => (
  <TextField
    label="Description"
    id="course description"
    variant="filled"
    multiline
    rows={4}
    fullWidth
    {...props}
  />
);

const initialRole = {
  role: "",
};

const initialCourseInfo = {
  title: "",
  description: "",
  availableTo: "",
  courseCode: generateRandomCode(6),
  instructorNames_searchable: [],
  instructorIDs: [],
  instructors: [],
  students: [],
  invitedInstructors: [],
  invitedStudents: [],
};

async function addStudentToCourse(
  courseID,
  userID,
  userEmail,
  userDisplayName,
  setAddingCourse,
  handleClose
) {
  const ref = firebase.firestore().collection("courses").doc(courseID);
  setAddingCourse((prevState) => courseID);

  if (!userDisplayName) {
    userDisplayName = await getUserDisplayName(userID);
  }

  //Update Single Student Object
  await ref.update({
    students: firebase.firestore.FieldValue.arrayUnion({
      id: userID,
      email: userEmail,
      name: userDisplayName,
    }),
    studentEmails: firebase.firestore.FieldValue.arrayUnion(userEmail),
    studentIDs: firebase.firestore.FieldValue.arrayUnion(userID),
  });

  // Add minimal user info for grade_summaries collecion which is used in rendering the gradebook.
  await ref.collection("grade_summaries").doc(userID).set({
    userID: userID,
    userEmail: userEmail,
    userDisplayName: userDisplayName,
  });

  // Student is now active, remove any references from invitedStudents array.
  let courseDoc = await ref.get();
  let invitedStudents = courseDoc.data().invitedStudents;
  let invitedStudentMatch = {};

  if (invitedStudents) {
    invitedStudents.forEach((student) => {
      if (student.email === userEmail) {
        invitedStudentMatch = student;
      }
    });
  }

  await ref.update({
    invitedStudents:
      firebase.firestore.FieldValue.arrayRemove(invitedStudentMatch),
  });
  /////////////////////////////////////////////////////////////////////////////////

  setAddingCourse((prevState) => "");
  handleClose();
}

async function fetchCourses(
  searchTerm,
  userID,
  setFoundCourses,
  setSearchTerm
) {
  const searchTermArray = makeSearchFriendly(searchTerm);

  const ref = firebase.firestore().collection("courses");
  const fetchedItems = [];
  const queryCourseTitle = ref
    .where("title_searchable", "array-contains-any", searchTermArray)
    .get();

  const queryInstructorName = ref
    .where("instructorNames_searchable", "array-contains-any", searchTermArray)
    .get();
  const [courseTitleSnapshot, instructorNameSnapshot] = await Promise.all([
    queryCourseTitle,
    queryInstructorName,
  ]);

  courseTitleSnapshot.forEach((doc) =>
    fetchedItems.push({
      id: doc.id,
      title: doc.data().title,
      instructors: doc.data().instructors,
      instructorNames: extractInstructorNames(doc.data().instructors),
      instructorIDs: doc.data().instructorIDs,
      availableTo: doc.data().availableTo,
      courseCode: doc.data().courseCode,
      enrolled: doc.data().students?.some((student) => student.id === userID),
    })
  );
  instructorNameSnapshot.forEach((doc) =>
    fetchedItems.push({
      id: doc.id,
      title: doc.data().title,
      instructors: doc.data().instructors,
      instructorNames: extractInstructorNames(doc.data().instructors),
      instructorIDs: doc.data().instructorIDs,
      availableTo: doc.data().availableTo,
      courseCode: doc.data().courseCode,
      enrolled: doc.data().students?.some((student) => student.id === userID),
    })
  );
  setFoundCourses((prevCourses) => fetchedItems);
  setSearchTerm(searchTerm);
}

function extractInstructorNames(instructorsInfo) {
  if (!instructorsInfo) return "anonymous";
  if (!Array.isArray(instructorsInfo)) return "anonymous";
  const instructorNames = instructorsInfo?.map(
    (info) => info.name || "anonymous"
  );

  if (instructorNames?.length > 0) return instructorNames.join(",");
}

function tidy(rawValues, role, userID, userDisplayName, userEmail) {
  if (role === "instructor") {
    return {
      title: rawValues.title,
      title_searchable: makeSearchFriendly(rawValues.title),
      description: rawValues.description,
      availableTo: rawValues.availableTo,
      courseCode: rawValues.courseCode,
      instructors: [{ id: userID, name: userDisplayName, email: userEmail }],
      instructorNames_searchable: makeSearchFriendly(userDisplayName),
      instructorIDs: [userID],
      instructorEmails: [userEmail],
      students: [],
      invitedInstructors: [],
      invitedStudents: [],
      modules: [],
      created: firebase.firestore.Timestamp.now(),
      lastEdited: "",
    };
  }
}

export default function AddCourse({ userID, userDisplayName, userEmail }) {
  const [activeStep, setActiveStep] = useState(0);
  const [role, setRole] = useState("none");
  const [searchTerm, setSearchTerm] = useState("");
  const [foundCourses, setFoundCourses] = useState([]);
  const [addingCourse, setAddingCourse] = useState("");
  const [courseCode, setCourseCode] = useState("");

  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(true);
    setActiveStep((prevStep) => 0);
  };
  const handleClose = () => {
    setOpen(false);
    setActiveStep((prevStep) => -1);
    setRole((prevRole) => "none");
    setFoundCourses((prevCourses) => []);
    setSearchTerm("");
    setCourseCode(() => "");
  };

  const handleCourseCodeChange = (event) => {
    setCourseCode(event.target.value.trim());
  };

  function isInstructor(foundCourses, courseIndex, userID) {
    return foundCourses[courseIndex].instructorIDs?.includes(userID);
  }

  async function runSearch(event, values) {
    if (
      event.type === "click" ||
      (event.type === "keydown" && event.code === "Enter")
    ) {
      event.preventDefault();
      fetchCourses(values.searchTerm, userID, setFoundCourses, setSearchTerm);
    }
  }

  return (
    <>
      <Fab variant="extended" color="primary" onClick={handleOpen}>
        <AddIcon />
        ADD COURSE
      </Fab>

      <Modal
        className="flex-center-all"
        open={open}
        onClose={handleClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={open}>
          <Box className="modal-form-v1 modal-common-styling">
            {activeStep === 0 ? (
              <Box className="select-course-role">
                <Typography variant="h5" color="primary">
                  Select a role
                </Typography>
                <Formik
                  initialValues={initialRole}
                  onSubmit={async (values, { setSubmitting }) => {
                    setSubmitting(true);
                    await new Promise((r) => setTimeout(r, 400));
                    setRole((prevRole) => values.role);
                    setActiveStep((prevStep) => activeStep + 1);
                    setSubmitting(false);
                  }}
                >
                  {({ values, isSubmitting, dirty }) => (
                    <Form autoComplete="off">
                      <Box className="padding-light">
                        <Box className="flex-align-center">
                          <Field
                            name="role"
                            type="radio"
                            value="student"
                            color="primary"
                            as={Radio}
                          />
                          <Typography>Student</Typography>
                        </Box>
                        <Box className="flex-align-center">
                          <Field
                            name="role"
                            type="radio"
                            value="instructor"
                            color="primary"
                            as={Radio}
                          />
                          <Typography>Instructor</Typography>
                        </Box>
                      </Box>

                      <Box
                        marginTop={3}
                        display="flex"
                        justifyContent="flex-end"
                      >
                        <Button
                          type="submit"
                          color="primary"
                          variant="contained"
                          disabled={isSubmitting || !dirty}
                        >
                          NEXT
                        </Button>
                      </Box>
                    </Form>
                  )}
                </Formik>
              </Box>
            ) : null}

            {activeStep === 1 && role === "instructor" ? (
              <Box className="flex-column">
                <Typography variant="h5" color="primary">
                  Course Details
                </Typography>
                <Box className="padding-light">
                  <Typography variant="subtitle2">
                    Update course details and manage student invites
                  </Typography>
                  <Typography variant="subtitle2">
                    later inside the course dashboard.
                  </Typography>
                </Box>
                <Formik
                  initialValues={initialCourseInfo}
                  onSubmit={async (values, { setSubmitting }) => {
                    setSubmitting(true);
                    const tidiedValues = tidy(
                      values,
                      role,
                      userID,
                      userDisplayName,
                      userEmail
                    );
                    //Artificial delay to signal user that course info is being saved
                    await new Promise((r) => setTimeout(r, 800));
                    try {
                      addCourse(tidiedValues);
                    } catch (error) {
                      console.log(error.message);
                    }
                    setSubmitting(false);
                    handleClose();
                    setRole((prevRole) => "none");
                    setActiveStep((prevStep) => 0);
                  }}
                >
                  {({ values, isSubmitting, dirty }) => (
                    <Form autoComplete="off">
                      <Box className="flex-column course-title-and-description-fields">
                        <Field name="title" as={CourseTitleField} />
                        <Field name="description" as={DescriptionField} />
                      </Box>
                      <Box className="padding-light">
                        <Box className="share-with">
                          <Typography>Make the course available to:</Typography>
                        </Box>
                        <Box className="flex-align-center">
                          <Field
                            name="availableTo"
                            type="radio"
                            value="invited"
                            color="primary"
                            as={Radio}
                          />
                          <Typography>invited students only</Typography>
                        </Box>
                        <Box className="padding-left-heavy">
                          {values.availableTo === "invited" && (
                            <Box width="300px">
                              <Typography
                                display="inline"
                                color="textSecondary"
                              >
                                Students must enter the following code to
                                register for your course:
                              </Typography>
                              <Typography
                                color="primary"
                                variant="h6"
                                display="inline"
                              >
                                {" "}
                                {values.courseCode}
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        <Box className="flex-align-center">
                          <Field
                            name="availableTo"
                            type="radio"
                            value={process.env.REACT_APP_NAME}
                            color="primary"
                            as={Radio}
                          />
                          <Typography>
                            {capitalizeFirstLetter(process.env.REACT_APP_NAME)}
                          </Typography>
                        </Box>
                      </Box>
                      <Box className="padding-left-heavy">
                        {values.availableTo ===
                          process.env.REACT_APP_COMMUNITY_NAME && (
                          <Box width="300px">
                            <Typography display="inline" color="textSecondary">
                              Anyone from the{" "}
                              {capitalizeFirstLetter(
                                process.env.REACT_APP_NAME
                              )}{" "}
                              can discover and register for your course.
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      <Box className="flex space-between padding-top-medium">
                        <Button
                          onClick={() => {
                            setActiveStep((prevStep) => activeStep - 1);
                          }}
                          color="primary"
                          size="large"
                        >
                          BACK
                        </Button>

                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          disabled={isSubmitting || !dirty}
                        >
                          {isSubmitting ? (
                            <CircularProgress size={25} />
                          ) : (
                            "SAVE"
                          )}
                        </Button>
                      </Box>
                      {/* <pre>{JSON.stringify(values, null, 2)}</pre> */}
                    </Form>
                  )}
                </Formik>
              </Box>
            ) : null}
            {activeStep === 1 && role === "student" ? (
              <Box className=" find-course-form">
                <Typography
                  variant="h5"
                  color="primary"
                  className="find-course-header"
                >
                  Find a Course
                </Typography>

                <Formik
                  initialValues={{ searchTerm: searchTerm }}
                  onSubmit={async (values, { setSubmitting }) => {
                    setSubmitting(true);
                    const tidiedValues = tidy(
                      values,
                      role,
                      userID,
                      userDisplayName,
                      userEmail
                    );
                    //Artificial delay to signal user that course info is being saved
                    await new Promise((r) => setTimeout(r, 800));

                    try {
                      addCourse(tidiedValues);
                    } catch (error) {
                      console.log(error.message);
                    }
                    setSubmitting(false);
                    handleClose();
                    setRole((prevRole) => "none");
                    setActiveStep((prevStep) => 0);
                  }}
                >
                  {({ values, isSubmitting, dirty, handleChange }) => (
                    <Form autoComplete="off">
                      <TextField
                        name="searchTerm"
                        onKeyDown={(event) => runSearch(event, values)}
                        onChange={handleChange}
                        variant="outlined"
                        placeholder="course title or instructor"
                        className="course-search-field"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="search for a course"
                                edge="end"
                                onClick={(event) => runSearch(event, values)}
                              >
                                <Search />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Form>
                  )}
                </Formik>

                <Box className="found-course-list">
                  {foundCourses.length === 0 && searchTerm ? (
                    <Typography
                      color="textSecondary"
                      style={{ paddingTop: "30px" }}
                      align="center"
                    >
                      (no courses found)
                    </Typography>
                  ) : null}
                  {foundCourses.map((course, courseIndex) => (
                    <Box key={course.id}>
                      <List>
                        <ListItem alignItems="center">
                          <ListItemText
                            primary={course.title}
                            secondary={course.instructorNames}
                          />

                          <ListItemSecondaryAction className="add-selected-course">
                            {addingCourse !== course.id && course.enrolled ? (
                              <Button
                                aria-label="add selected course"
                                startIcon={<CheckIcon />}
                                disabled={true}
                              >
                                ENROLLED
                              </Button>
                            ) : null}

                            {addingCourse !== course.id &&
                            !course.enrolled &&
                            !isInstructor(foundCourses, courseIndex, userID) ? (
                              <Button
                                aria-label="add selected course"
                                style={{ position: "relative", left: "px" }}
                                startIcon={
                                  course.availableTo === "invited" &&
                                  course.courseCode !== courseCode ? (
                                    <LockIcon />
                                  ) : (
                                    <AddIcon />
                                  )
                                }
                                disabled={
                                  course.availableTo === "invited" &&
                                  course.courseCode !== courseCode
                                }
                                onClick={() => {
                                  addStudentToCourse(
                                    course.id,
                                    userID,
                                    userEmail,
                                    userDisplayName,
                                    setAddingCourse,
                                    handleClose
                                  );
                                }}
                              >
                                ADD
                              </Button>
                            ) : null}
                            {isInstructor(
                              foundCourses,
                              courseIndex,
                              userID
                            ) && (
                              <Box className="instructor-label-container">
                                <Typography className="instructor-label">
                                  instructor
                                </Typography>
                              </Box>
                            )}
                            {addingCourse === course.id ? (
                              <CircularProgress size={25} />
                            ) : null}
                          </ListItemSecondaryAction>
                        </ListItem>

                        {course.availableTo === "invited" &&
                        !course.enrolled &&
                        !isInstructor(foundCourses, courseIndex, userID) ? (
                          <Box className="padding-x-light">
                            <TextField
                              fullWidth
                              variant="outlined"
                              placeholder="enter course code to unlock"
                              name="enteredCourseCode"
                              onChange={handleCourseCodeChange}
                              autoComplete="off"
                            />
                          </Box>
                        ) : null}

                        <Divider style={{ marginTop: "15px" }} />
                      </List>
                    </Box>
                  ))}
                </Box>

                <Box className="flex back-to-select-role">
                  <Button
                    onClick={() => {
                      setActiveStep((prevStep) => activeStep - 1);
                      setFoundCourses(() => []);
                    }}
                    color="primary"
                    size="large"
                  >
                    BACK
                  </Button>
                </Box>
              </Box>
            ) : null}
          </Box>
        </Fade>
      </Modal>
    </>
  );
}
