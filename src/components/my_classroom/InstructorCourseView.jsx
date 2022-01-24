import React, { useEffect, useState } from "react";
import { ThemeProvider } from "@material-ui/core/styles";
import { Box, Button, Divider } from "@material-ui/core";
import { Tabs, Tab } from "@material-ui/core";
import { ChevronLeft, People } from "@material-ui/icons";
import { MyClassroomTheme } from "../../themes.js";
import MainNavBar from "../MainNavBar.jsx";
import { useHistory } from "react-router-dom";
import firebase from "../../app/config/firebaseConfig.js";
import InstructorGradebook from "./InstructorGradebook.jsx";
import CourseDetails from "./CourseDetails.jsx";
import CourseModules from "./CourseModules.jsx";
import CourseRoster from "./CourseRoster.jsx";
import { useAuth } from "../../app/contexts/AuthContext.js";

function restrictUnauthorizedAccess(user, history, instructors) {
  const isInstructor = instructors?.some(
    (instructor) => instructor.id === user.uid
  );

  if (instructors && !isInstructor) {
    history.push("/access_restricted");
  }
}

export default function InstructorCourseView({ match }) {
  const { currentUser } = useAuth();
  const history = useHistory();
  const [courseInfo, setCourseInfo] = useState({});
  const [tabIndex, setTabIndex] = useState(0);
  const handleChange = (event, index) => {
    setTabIndex(index);
  };

  function fetchCourseInfo() {
    const ref = firebase
      .firestore()
      .collection("courses")
      .doc(match.params.courseID);

    ref.onSnapshot((doc) =>
      setCourseInfo({
        id: doc.id,
        courseCode: doc.data().courseCode,
        title: doc.data().title,
        coursePicture: doc.data().coursePicture,
        instructors: doc.data().instructors,
        students: doc.data().students,
        invitedStudents: doc.data().invitedStudents,
        availableTo: doc.data().availableTo,
        description: doc.data().description,
        modules: doc.data().modules,
        created: doc.data().created.toDate().toLocaleDateString(),
      })
    );
  }

  useEffect(() => {
    const unsubscribe = fetchCourseInfo();
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  restrictUnauthorizedAccess(currentUser, history, courseInfo.instructors);

  return (
    <ThemeProvider theme={MyClassroomTheme}>
      <div className="course-view-background">
        <MainNavBar />
        <Box className="flex-column display-area-full">
          <Box className="flex-align-center space-between padding-light">
            <Button
              startIcon={<ChevronLeft />}
              onClick={() => history.push("/classroom")}
            >
              BACK TO COURSES
            </Button>
            <Button
              startIcon={<People />}
              href={`/classroom/courses/${courseInfo.id}`}
              rel="noreferrer"
              target="_blank"
            >
              Student View
            </Button>
          </Box>
          <Box className="flex-center-all course-overview">
            <CourseDetails
              courseID={courseInfo.id}
              courseCode={courseInfo.courseCode}
              coursePicture={courseInfo.coursePicture}
              title={courseInfo.title}
              description={courseInfo.description}
              instructorNames={courseInfo.instructorNames}
              instructors={courseInfo.instructors}
              availableTo={courseInfo.availableTo}
              created={courseInfo.created}
            />
          </Box>
          <Box padding={2}>
            <Divider />
          </Box>

          <div className="course-management-tools">
            <Tabs
              orientation="vertical"
              value={tabIndex}
              onChange={handleChange}
              className="tool-selected"
            >
              <Tab
                label="Modules"
                disableRipple
                onClick={() => setTabIndex((prevIndex) => 0)}
              />
              <Tab
                label="Gradebook"
                disableRipple
                onClick={() => setTabIndex((prevIndex) => 1)}
              />
              <Tab
                label="Roster"
                disableRipple
                onClick={() => setTabIndex((prevIndex) => 2)}
              />
            </Tabs>
            {tabIndex === 0 && (
              <Box className="course-utils-display-area margin-x-auto">
                <CourseModules
                  userID={currentUser.uid}
                  courseID={courseInfo.id}
                  modules={courseInfo.modules}
                  courseInfo={courseInfo}
                  setCourseInfo={setCourseInfo}
                />
              </Box>
            )}
            {tabIndex === 1 && (
              <Box className="course-utils-display-area margin-x-auto">
                <InstructorGradebook
                  courseID={courseInfo.id}
                  modules={courseInfo.modules}
                  students={courseInfo.students}
                />
              </Box>
            )}
            {tabIndex === 2 && (
              <Box className="course-utils-display-area margin-x-auto">
                <CourseRoster
                  courseID={courseInfo.id}
                  courseTitle={courseInfo.title}
                  courseCode={courseInfo.courseCode}
                  students={courseInfo.students}
                  invitedStudents={courseInfo.invitedStudents}
                />
              </Box>
            )}
            {/* 
            <pre>{JSON.stringify(courseInfo.modules, null, 2)}</pre> */}
          </div>
        </Box>
      </div>
    </ThemeProvider>
  );
}
