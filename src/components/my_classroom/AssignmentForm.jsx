import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  MenuItem,
  Radio,
  Select,
  TextField,
  Typography,
} from "@material-ui/core";
import { Formik, Field, Form } from "formik";
import "date-fns";
import DateFnsUtils from "@date-io/date-fns";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import { KeyboardTimePicker } from "@material-ui/pickers";
import { KeyboardDatePicker } from "@material-ui/pickers";
import { updateCourseModuleContent } from "../../app/firestoreClient.js";
import firebase from "../../app/config/firebaseConfig.js";
import { generateRandomCode } from "../../app/utils/utils.js";

const SelectItem = (props) => <Select variant="outlined" {...props} />;

export default function AssignmentForm({
  userID,
  courseID,
  modules,
  moduleIndex,
  content,
  contentIndex,
  closeAssignmentForm,
  item,
  edit,
}) {
  const [questionSets, setQuestionSets] = useState([]);
  const [sharedQuestionSets, setSharedQuestionSets] = useState([]);
  const add = !edit;

  function addModuleAssignment(tidiedValues) {
    const updatedModules = modules.map((element, index) => {
      if (index === moduleIndex) {
        element.content.push(tidiedValues);
      }
      return element;
    });
    updateCourseModuleContent(courseID, updatedModules);
  }

  function updateModuleAssignment(tidiedValues) {
    const updatedContent = content.map((item, index) =>
      index === contentIndex ? tidiedValues : item
    );
    const updatedModules = modules.map((module, index) => {
      if (index === moduleIndex) {
        module.content = updatedContent;
      }
      return module;
    });
    updateCourseModuleContent(courseID, updatedModules);
  }

  function addAssignmentSummary(courseID, values) {
    const courseRef = firebase
      .firestore()
      .collection("courses")
      .doc(courseID)
      .collection("assignments")
      .doc(values.assignmentID);
    courseRef.set(values);
  }

  function fetchMyQuestionSets() {
    const ref = firebase
      .firestore()
      .collection("user_questions")
      .doc(userID)
      .collection("my_question_sets");

    ref.onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      querySnapshot.forEach((doc) => {
        if (doc.data().type !== "Folder") {
          fetchedItems.push({
            id: doc.id,
            title: doc.data().title,
          });
        }
      });
      setQuestionSets((prevState) => fetchedItems);
    });
  }

  function fetchMySharedQuestionSets() {
    const ref = firebase
      .firestore()
      .collection("user_questions")
      .doc(userID)
      .collection("shared_question_sets");
    ref.onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      querySnapshot.forEach((doc) => {
        doc.data()?.questionSets.forEach((questionSet) => {
          fetchedItems.push({
            id: doc.id,
            sharedQSetID: questionSet.id,
            title: questionSet.title,
          });
        });
      });

      setSharedQuestionSets((prevState) => fetchedItems);
    });
  }

  useEffect(() => {
    const unsubscribe = fetchMyQuestionSets();
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const unsubscribe = fetchMySharedQuestionSets();
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  return (
    <Formik
      initialValues={pickInitialValues(item, edit)}
      enableReinitialize
      onSubmit={async (values, { setSubmitting, resetForm }) => {
        setSubmitting(true);
        await new Promise((r) => setTimeout(r, 800));
        const tidiedValues = tidy(values, edit);

        if (add) tidiedValues.assignmentID = generateRandomCode(20);
        if (add) addModuleAssignment(tidiedValues);
        if (edit) tidiedValues.assignmentID = values.assignmentID;
        if (edit) updateModuleAssignment(tidiedValues);

        addAssignmentSummary(courseID, tidiedValues);
        setSubmitting(false);
        closeAssignmentForm();
      }}
    >
      {({ values, isSubmitting, dirty, handleChange, setFieldValue }) => (
        <Form autoComplete="off">
          <Typography
            style={{ marginBottom: "5px" }}
            variant="h5"
            color="primary"
          >
            {edit ? "Update Assignment" : "Add Assignment"}
          </Typography>

          {!edit && (
            <Typography variant="subtitle1" style={{ marginTop: "10px" }}>
              ASSIGNMENT SELECTION
            </Typography>
          )}

          {edit && values.itemType === "question set" && (
            <>
              <Typography display="inline" variant="h6">
                {values.title}
              </Typography>
              <Typography
                color="textSecondary"
                display="inline"
                style={{ marginLeft: "20px", marginRight: "20px" }}
              >
                |
              </Typography>
              <Typography display="inline" variant="subtitle1" color="primary">
                question set
              </Typography>
            </>
          )}

          {edit && values.itemType === "student upload" && (
            <Box style={{ marginBottom: "10px" }}>
              <Typography display="inline" variant="h6">
                {values.title}
              </Typography>
              <Typography
                color="textSecondary"
                display="inline"
                style={{ marginLeft: "20px", marginRight: "20px" }}
              >
                |
              </Typography>
              <Typography display="inline" variant="subtitle1" color="primary">
                student upload
              </Typography>
            </Box>
          )}

          {!edit && (
            <Box className="flex-align-center">
              <Field
                name="itemType"
                type="radio"
                value="student upload"
                color="primary"
                as={Radio}
                onChange={(e) => {
                  handleChange(e);
                  setFieldValue("id", "placeholder");
                  setFieldValue("title", "");
                  setFieldValue("docRef", "");
                  setFieldValue("instructions", "");
                }}
              />
              <Typography>student upload</Typography>
            </Box>
          )}

          {values.itemType === "student upload" && (
            <Box className="flex padding-horizontal-medium padding-bottom-light">
              <Field
                name="totalPossiblePoints"
                variant="outlined"
                type="number"
                as={TextField}
                inputProps={{
                  min: 0,
                  style: { width: "50px", padding: 5, textAlign: "center" },
                }}
              />
              <Typography style={{ marginLeft: "10px" }}>points</Typography>
            </Box>
          )}

          {values.itemType === "student upload" && (
            <>
              <Box className="padding-horizontal-medium padding-bottom-light">
                <Field
                  fullWidth
                  name="title"
                  variant="filled"
                  placeholder="title (required)"
                  as={TextField}
                />
              </Box>
              <Box className="padding-horizontal-medium padding-bottom-light">
                <Field
                  fullWidth
                  name="instructions"
                  variant="filled"
                  placeholder="instructions"
                  as={TextField}
                  multiline
                  rows={5}
                />
              </Box>
            </>
          )}

          {values.itemType === "student upload" && (
            <Box className="choose-file-type">
              <Typography color="textSecondary">
                choose which file types to accept
              </Typography>
            </Box>
          )}

          {values.itemType === "student upload" && (
            <Box className="flex-column padding-left-heavy">
              <Box display="flex" alignItems="center">
                <Field
                  name="accept"
                  color="primary"
                  value="application/pdf"
                  as={Checkbox}
                  checked={values.accept.includes("application/pdf")}
                />

                <Typography display="inline">PDF</Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <Field
                  name="accept"
                  value="image/png"
                  color="primary"
                  as={Checkbox}
                  checked={values.accept.includes("image/png")}
                />
                <Typography display="inline">PNG (image)</Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <Field
                  name="accept"
                  value="image/jpeg"
                  color="primary"
                  as={Checkbox}
                  checked={values.accept.includes("image/jpeg")}
                />
                <Typography display="inline">JPEG (image)</Typography>
              </Box>
            </Box>
          )}

          {!edit && (
            <Box className="flex-align-center">
              <Field
                name="itemType"
                type="radio"
                value="question set"
                color="primary"
                as={Radio}
                onChange={(e) => {
                  handleChange(e);
                  setFieldValue("id", "placeholder");
                  setFieldValue("title", "");
                  setFieldValue("accept", []);
                  setFieldValue("docRef", "");
                  setFieldValue("instructions", "");
                }}
              />
              <Typography>question set</Typography>
            </Box>
          )}

          {values.itemType === "question set" && !edit && (
            <Box
              className="select-module-item"
              style={{ marginBottom: "10px" }}
            >
              <Field name="id" as={SelectItem}>
                <MenuItem value="placeholder" disabled>
                  <Typography color="textSecondary">
                    select a question set
                  </Typography>
                </MenuItem>
                {questionSets.map((questionSet) => (
                  <MenuItem
                    key={questionSet.id}
                    value={questionSet.id}
                    onClick={() => {
                      setFieldValue(
                        "docRef",
                        `user_questions/${userID}/my_question_sets/${questionSet.id}`
                      );
                      setFieldValue("title", questionSet.title);
                    }}
                  >
                    {questionSet.title.slice(0, 30)}
                  </MenuItem>
                ))}
                {sharedQuestionSets.map((sharedQuestionSet) => (
                  <MenuItem
                    key={sharedQuestionSet.sharedQSetID}
                    value={sharedQuestionSet.sharedQSetID}
                    onClick={() => {
                      setFieldValue(
                        "docRef",
                        `user_questions/${sharedQuestionSet.id}/my_question_sets/${sharedQuestionSet.sharedQSetID}`
                      );
                      setFieldValue("title", sharedQuestionSet.title);
                    }}
                  >
                    {sharedQuestionSet.title.slice(0, 30)}
                  </MenuItem>
                ))}
              </Field>
            </Box>
          )}

          {values.itemType === "question set" && values.id !== "placeholder" && (
            <>
              <Typography color="primary" style={{ marginLeft: "10px" }}>
                options
              </Typography>
              <Box className="flex-align-center">
                <Field name="unlimitedAttempts" type="checkbox" as={Checkbox} />
                <Typography>remove attempt limits</Typography>
              </Box>

              <Box className="flex-align-center">
                <Field
                  name="hideSolutions"
                  type="checkbox"
                  as={Checkbox}
                  disabled={!values.hasDueDate}
                  checked={values.hideSolutions}
                />
                <Typography
                  color={values.hasDueDate ? "inherit" : "textSecondary"}
                >
                  hide solutions before due date
                </Typography>{" "}
                {!values.hasDueDate && (
                  <Typography style={{ marginLeft: "10px" }} color="primary">
                    (set due date to enable)
                  </Typography>
                )}
              </Box>
              <Box className="flex-align-center">
                <Field
                  name="hideCorrectStatus"
                  type="checkbox"
                  as={Checkbox}
                  disabled={!values.hasDueDate}
                  checked={values.hideCorrectStatus}
                />
                <Typography
                  color={values.hasDueDate ? "inherit" : "textSecondary"}
                >
                  hide scoring feedback before due date
                </Typography>{" "}
                {!values.hasDueDate && (
                  <Typography style={{ marginLeft: "10px" }} color="primary">
                    (set due date to enable)
                  </Typography>
                )}
              </Box>
            </>
          )}
          <Typography variant="subtitle1" style={{ marginTop: "10px" }}>
            OPEN / DUE DATE SETTINGS
          </Typography>
          <TimeSettingsMessage
            due={values.due}
            hasOpenDate={values.hasOpenDate}
            hasDueDate={values.hasDueDate}
            open={values.open}
          />
          <Box className="flex-align-center">
            <Field
              name="hasOpenDate"
              type="checkbox"
              color="primary"
              as={Checkbox}
            />
            <Typography>set open date</Typography>
          </Box>

          {values.hasOpenDate && (
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
              <Box
                display="flex"
                width={350}
                style={{ marginLeft: "20px" }}
                justifyContent="space-between"
              >
                <Box width={180}>
                  <KeyboardDatePicker
                    margin="normal"
                    disableToolbar
                    variant="inline"
                    format="MM/dd/yyyy"
                    value={values.open}
                    onChange={(value) => setFieldValue("open", value)}
                    KeyboardButtonProps={{
                      "aria-label": "change date",
                    }}
                  />
                </Box>
                <Box width={130}>
                  <KeyboardTimePicker
                    margin="normal"
                    value={values.open}
                    onChange={(value) => setFieldValue("open", value)}
                    KeyboardButtonProps={{
                      "aria-label": "change time",
                    }}
                  />
                </Box>
              </Box>
            </MuiPickersUtilsProvider>
          )}

          <Box className="flex-align-center">
            <Field
              name="hasDueDate"
              type="checkbox"
              color="primary"
              as={Checkbox}
              onClick={() => {
                values.hasDueDate && setFieldValue("hideSolutions", false);
                values.hasDueDate && setFieldValue("hideCorrectStatus", false);
              }}
            />
            <Typography>set due date</Typography>
          </Box>

          {values.hasDueDate && (
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
              <Box
                display="flex"
                width={350}
                style={{ marginLeft: "20px" }}
                justifyContent="space-between"
              >
                <Box width={180}>
                  <KeyboardDatePicker
                    margin="normal"
                    disableToolbar
                    variant="inline"
                    format="MM/dd/yyyy"
                    value={values.due}
                    onChange={(value) => setFieldValue("due", value)}
                    KeyboardButtonProps={{
                      "aria-label": "change date",
                    }}
                  />
                </Box>
                <Box width={130}>
                  <KeyboardTimePicker
                    margin="normal"
                    value={values.due}
                    onChange={(value) => setFieldValue("due", value)}
                    KeyboardButtonProps={{
                      "aria-label": "change time",
                    }}
                  />
                </Box>
              </Box>
            </MuiPickersUtilsProvider>
          )}

          <Box className="flex justify-end padding-top-medium">
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={
                !dirty ||
                isSubmitting ||
                values.itemType === "" ||
                (values.itemType === "question set" &&
                  values.id === "placeholder") ||
                (values.itemType === "student upload" && !values.title) ||
                (values.itemType === "student upload" &&
                  values.accept.length < 1)
              }
            >
              {!isSubmitting && add && "ADD"}
              {!isSubmitting && edit && "UPDATE"}
              {isSubmitting && <CircularProgress size={25} />}
            </Button>
          </Box>
          {/* <pre>{JSON.stringify(values, null, 2)}</pre> */}
        </Form>
      )}
    </Formik>
  );
}

function getIDFromDocRef(docRef) {
  if (!docRef) return;
  if (docRef) {
    const docRefArray = docRef.split("/");
    return docRefArray[docRefArray.length - 1];
  }
}

function pickInitialValues(item, edit) {
  if (!edit)
    return {
      id: "placeholder",
      contentType: "assignment",
      itemType: "",
      title: "",
      instructions: "",
      accept: [],
      docRef: "",
      unlimitedAttempts: false,
      hideSolutions: false,
      hideCorrectStatus: false,
      hasOpenDate: false,
      hasDueDate: false,
      open: new Date(),
      due: new Date(),
      totalPossiblePoints: 0,
    };
  if (edit)
    return {
      id: getIDFromDocRef(item.docRef) || "placeholder",
      contentType: "assignment",
      itemType: item.itemType || "",
      title: item.title || "",
      instructions: item.instructions || "",
      accept: item.accept || [],
      docRef: item.docRef || "",
      unlimitedAttempts: item.unlimitedAttempts || false,
      hideSolutions: item.hideSolutions || false,
      hideCorrectStatus: item.hideCorrectStatus || false,
      hasOpenDate: item.hasOpenDate || false,
      hasDueDate: item.hasDueDate || false,
      open: item.open?.toDate() || new Date(),
      due: item.due?.toDate() || new Date(),
      totalPossiblePoints: item.totalPossiblePoints || 0,
      assignmentID: item.assignmentID,
    };
}

function tidy(values) {
  if (values.itemType === "question set")
    return {
      contentType: values.contentType,
      itemType: values.itemType,
      title: values.title,
      docRef: values.docRef,
      unlimitedAttempts: values.unlimitedAttempts || false,
      hideSolutions: values.hideSolutions || false,
      hideCorrectStatus: values.hideCorrectStatus || false,
      hasOpenDate: values.hasOpenDate || false,
      hasDueDate: values.hasDueDate || false,
      open: values.hasOpenDate ? values.open : null,
      due: values.hasDueDate ? values.due : null,
    };

  if (values.itemType === "student upload")
    return {
      contentType: values.contentType,
      itemType: values.itemType,
      title: values.title,
      instructions: values.instructions,
      accept: values.accept,
      totalPossiblePoints: values.totalPossiblePoints,
      hasOpenDate: values.hasOpenDate || false,
      hasDueDate: values.hasDueDate || false,
      open: values.hasOpenDate ? values.open : null,
      due: values.hasDueDate ? values.due : null,
    };
  return values;
}

function TimeSettingsMessage({ due, hasOpenDate, hasDueDate, open }) {
  const dateFormat = { year: "numeric", month: "short", day: "numeric" };
  const timeFormat = { hour: "2-digit", minute: "2-digit" };
  if (!hasOpenDate && !hasDueDate)
    return (
      <Typography color="textSecondary" variant="subtitle2">
        assignment always open (default)
      </Typography>
    );

  if (hasOpenDate && !hasDueDate)
    return (
      <Typography color="textSecondary" variant="subtitle2">
        assignment open starting {open.toLocaleDateString("en-US", dateFormat)}{" "}
        at {open.toLocaleTimeString("en-US", timeFormat)}
      </Typography>
    );

  if (!hasOpenDate && hasDueDate)
    return (
      <Typography color="textSecondary" variant="subtitle2">
        assignment due {due.toLocaleDateString("en-US", dateFormat)} at{" "}
        {due.toLocaleTimeString("en-US", timeFormat)}
      </Typography>
    );

  if (hasOpenDate && hasDueDate)
    return (
      <Typography color="textSecondary" variant="subtitle2">
        assignment open {open.toLocaleDateString("en-US", dateFormat)} at{" "}
        {open.toLocaleTimeString("en-US", timeFormat)} , due{" "}
        {due.toLocaleDateString("en-US", dateFormat)} at{" "}
        {due.toLocaleTimeString("en-US", timeFormat)}
      </Typography>
    );

  return (
    <Typography color="textSecondary" variant="subtitle2">
      "an error occurred"
    </Typography>
  );
}
