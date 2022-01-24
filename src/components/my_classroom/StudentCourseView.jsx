import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Link,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@material-ui/core";
import { ThemeProvider } from "@material-ui/core/styles";
import { ChevronLeft } from "@material-ui/icons";
import { MyClassroomTheme } from "../../themes.js";
import MainNavBar from "../MainNavBar.jsx";
import { useHistory } from "react-router-dom";
import firebase from "../../app/config/firebaseConfig.js";
import { WatchLater, MenuBook } from "@material-ui/icons";
import StudentUpload from "./StudentUpload.jsx";
import QuestionSetCard from "./question_set_display/QuestionSetCard.jsx";
import { useAuth } from "../../app/contexts/AuthContext.js";
import { Document, Page } from "react-pdf/dist/esm/entry.webpack";
import { ZoomControl } from "../../app/utils/utils.js";
import { pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const options = {
  cMapUrl: "cmaps/",
  cMapPacked: true,
};

function restrictUnauthorizedAccess(user, history, instructors, students) {
  const isInstructor = instructors?.some(
    (instructor) => instructor.id === user.uid
  );

  const isStudent = students?.some((student) => student.id === user.uid);

  if (instructors && students) {
    if (isInstructor || isStudent) {
      return;
    } else {
      history.push("/access_restricted");
    }
  }
}

export default function StudentCourseView({ match }) {
  const { currentUser } = useAuth();

  const history = useHistory();
  const courseID = match.params.courseID;

  const [selectedModuleIndex, setSelectedModuleIndex] = useState(-1);
  const [selectedItemIndex, setSelectedItemIndex] = useState(-1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedQuestionSet, setSelectedQuestionSet] = useState(null);
  const [selectedStudentUpload, setSelectedStudentUpload] = useState(null);
  const [courseInfo, setCourseInfo] = useState({});
  const { modules } = courseInfo;

  //fetch course information from firestore on mount
  useEffect(() => {
    const unsubscribe = fetchCourseInfo(courseID, setCourseInfo);
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (selectedModuleIndex < 0) return;
    if (selectedItemIndex < 0) return;
    setSelectedItem(modules[selectedModuleIndex].content[selectedItemIndex]);
    // eslint-disable-next-line
  }, [courseInfo]);

  useEffect(() => {
    if (!selectedItem) return;
    selectedItem.itemType === "question set" &&
      fetchQuestionSet(selectedItem.docRef, setSelectedQuestionSet);

    selectedItem.itemType !== "question set" && setSelectedQuestionSet(null);

    if (selectedItem.itemType === "student upload")
      fetchStudentUpload(
        courseID,
        selectedItem.assignmentID,
        setSelectedStudentUpload
      );
    if (selectedItem.itemType !== "student upload")
      setSelectedStudentUpload(null);
    // eslint-disable-next-line
  }, [selectedItem]);

  restrictUnauthorizedAccess(
    currentUser,
    history,
    courseInfo.instructors,
    courseInfo.students
  );

  return (
    <ThemeProvider theme={MyClassroomTheme}>
      <div className="course-view-background">
        <MainNavBar />
        <Box className="flex-row display-area-full">
          <Box className="course-content-menu ">
            <Button
              startIcon={<ChevronLeft />}
              onClick={() => history.push("/classroom")}
            >
              BACK TO COURSES
            </Button>
            <Typography variant="h5" className="course-title">
              {courseInfo.title}
            </Typography>
            {modules?.map((module, moduleIndex) => (
              <List key={moduleIndex}>
                <ListItem style={{ paddingBottom: "0" }} divider={true}>
                  <ListItemText secondary={module.title} />
                </ListItem>

                {module.content?.map((item, itemIndex) => (
                  <ListItem
                    key={itemIndex}
                    button
                    selected={
                      moduleIndex === selectedModuleIndex &&
                      itemIndex === selectedItemIndex
                    }
                    onClick={() => {
                      setSelectedModuleIndex(moduleIndex);
                      setSelectedItemIndex(itemIndex);
                      setSelectedItem(modules[moduleIndex].content[itemIndex]);
                    }}
                  >
                    <Box className="content-type-icon">
                      {item.contentType === "resource" && (
                        <MenuBook color="disabled" />
                      )}
                      {item.contentType === "assignment" && (
                        <WatchLater color="disabled" />
                      )}
                    </Box>
                    <ListItemText
                      primary={
                        item.title?.slice(0, 30) || item.name?.slice(0, 30)
                      }
                      secondary={
                        item.contentType === "assignment" && (
                          <AssignmentTimeSettings item={item} />
                        )
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ))}
          </Box>

          <Box className="flex-center-all item-display-area">
            <DisplayedItem
              courseInfo={courseInfo}
              currentUser={currentUser}
              selectedItem={selectedItem}
              selectedQuestionSet={selectedQuestionSet}
              selectedStudentUpload={selectedStudentUpload}
            />
          </Box>
        </Box>
      </div>
    </ThemeProvider>
  );
}

function AssignmentTimeSettings({ item }) {
  if (!item.hasOpenDate && !item.hasDueDate) return null;
  if (item.hasOpenDate && !item.hasDueDate)
    return "open " + parseDate(item.open) + " at " + parseTime(item.open);
  if (!item.hasOpenDate && item.hasDueDate)
    return "due " + parseDate(item.due) + " at " + parseTime(item.due);
  if (item.hasOpenDate && item.hasDueDate)
    return (
      <>
        {"open " + parseDate(item.open) + " at " + parseTime(item.open)}
        <br />
        {"due " + parseDate(item.due) + " at " + parseTime(item.due)}
      </>
    );
}

function parseDate(timestamp) {
  const format = {
    day: "numeric",
    month: "short",
  };
  return new Date(timestamp.seconds * 1000).toLocaleDateString("en-US", format);
}

function parseTime(timestamp) {
  const format = {
    hour: "numeric",
    minute: "numeric",
  };
  return new Date(timestamp.seconds * 1000).toLocaleTimeString("en-US", format);
}

function getFileExtension(selectedItem) {
  if (!selectedItem) return null;

  const { itemType } = selectedItem;
  const filenameArr =
    itemType === "document" ? selectedItem?.name.split(".").slice(-1) : null;

  if (!filenameArr) return null;

  const fileExtension = filenameArr[0];
  return fileExtension;
}

function DisplayedItem({
  courseInfo,
  currentUser,
  selectedItem,
  selectedQuestionSet,
  selectedStudentUpload,
}) {
  const [numPages, setNumPages] = useState(null);
  const [zoom, setZoom] = useState(1);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  if (!selectedItem)
    return (
      <Typography color="textSecondary">(select an item to display)</Typography>
    );

  const { itemType } = selectedItem;

  const currentTime = new Date().getTime() / 1000; // current date in seconds since Jan 1, 1970 (Javascript convention)
  const hasOpenDate = selectedItem?.hasOpenDate;
  const hasDueDate = selectedItem?.hasDueDate;
  const open = selectedItem?.open?.seconds || null; // assigment open date
  const due = selectedItem?.due?.seconds || null; // assigment due date

  const beforeOpen = hasOpenDate ? currentTime < open : false;
  const pastDue = hasDueDate ? currentTime > due : false;

  if (beforeOpen)
    return (
      <Typography color="textSecondary">
        The assignment will be open{" "}
        {parseDate(selectedItem.open) + " at " + parseTime(selectedItem.open)}
      </Typography>
    );

  // if (pastDue)
  //   return (
  //     <Typography color="textSecondary">
  //       The assignment due date has passed
  //     </Typography>
  //   );

  const fileExtension = getFileExtension(selectedItem);

  switch (itemType) {
    case "document":
      if (!fileExtension)
        return (
          <Typography color="textSecondary">error reading document</Typography>
        );
      if (fileExtension === "pdf")
        return (
          <Box
            maxHeight="80vh"
            className="relative overflow-auto flex justify-center"
            style={{ bottom: "3vh" }}
          >
            <Document
              file={selectedItem.url}
              onLoadSuccess={onDocumentLoadSuccess}
              options={options}
            >
              {Array.from(new Array(numPages), (element, index) => (
                <Page
                  className="relative padding-light flex-justify-center"
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  scale={zoom}
                >
                  <Typography
                    className="absolute pdf-page-annotation"
                    variant="caption"
                    color="textSecondary"
                  >
                    page {index + 1} of {numPages}
                  </Typography>
                </Page>
              ))}
            </Document>
            <ZoomControl zoom={zoom} setZoom={setZoom} />
          </Box>
        );
      if (fileExtension === "nb")
        return (
          <Box className="flex column justify-center">
            <Typography color="textSecondary" variant="subtitle1">
              Mathematica file (click link to download)
            </Typography>

            <Typography variant="h6">
              <Link
                href={getPublicUrl(selectedItem.url)}
                rel="noreferrer"
                target="_blank"
              >
                {selectedItem.name}
              </Link>
            </Typography>
            <Box maxWidth="500px">
              <Typography
                variant="caption"
                style={{ wordWrap: "break-word" }}
                color="textSecondary"
              >
                {getPublicUrl(selectedItem.url)}
              </Typography>
            </Box>
          </Box>
        );
      break;
    case "link":
      return (
        <iframe
          title="Embedded Link Media"
          width="90%"
          height="90%"
          src={selectedItem.url}
          frameBorder="0"
          allow="accelerometer; gyroscope; fullscreen; clipboard-write; clipboard-read; encrypted-media;"
        ></iframe>
      );
    case "image":
      return (
        <img height="80%" src={selectedItem.url} alt={selectedItem.name} />
      );
    case "question set":
      if (!selectedQuestionSet || selectedQuestionSet?.questions?.length === 0)
        return null;
      return (
        <QuestionSetCard
          assignmentID={selectedItem.assignmentID}
          assignmentInfo={selectedItem}
          collection="courses"
          courseID={courseInfo.id}
          pastDue={pastDue}
          questionSet={selectedQuestionSet}
          userID={currentUser.uid}
          userDisplayName={currentUser.displayName}
        />
      );
    case "student upload":
      return (
        <StudentUpload
          assignmentID={selectedItem.assignmentID}
          courseID={courseInfo.id}
          pastDue={pastDue}
          uploadInfo={selectedStudentUpload}
          userID={currentUser.uid}
        />
      );
    default:
      return (
        <Typography color="textSecondary">
          an error occurred - please contact your instructor
        </Typography>
      );
  }
}

function fetchCourseInfo(courseID, setCourseInfo) {
  const ref = firebase.firestore().collection("courses").doc(courseID);
  ref.onSnapshot((doc) =>
    setCourseInfo({
      id: doc.id,
      title: doc.data().title,
      instructorIDs: doc.data().instructorIDs,
      students: doc.data().students,
      modules: doc.data().modules,
    })
  );
}

async function fetchStudentUpload(
  courseID,
  assignmentID,
  setSelectedStudentUpload
) {
  const assignmentRef = firebase
    .firestore()
    .collection("courses")
    .doc(courseID)
    .collection("assignments")
    .doc(assignmentID);

  const fetchedItem = await assignmentRef.get();
  setSelectedStudentUpload({
    id: fetchedItem.id,
    title: fetchedItem.data().title,
    instructions: fetchedItem.data().instructions,
    accept: fetchedItem.data().accept,
    totalPossiblePoints: fetchedItem.data().totalPossiblePoints,
  });
}

async function fetchQuestionSet(docRef, setSelectedQuestionSet) {
  const fetchedItem = await firebase.firestore().doc(docRef).get();
  setSelectedQuestionSet({
    id: fetchedItem.id,
    title: fetchedItem.data()?.title,
    questions: fetchedItem.data()?.questions,
    totalPossiblePoints: fetchedItem.data()?.totalPossiblePoints,
  });
}

function getPublicUrl(url) {
  const urlArr = url.split("?");
  const baseUrl = urlArr[0];
  const trimmedUrl = baseUrl
    .slice(16)
    .replaceAll("%2F", "/")
    .replace("/o", "")
    .replace("v0/b/", "");
  const publicUrl = "https://" + trimmedUrl;

  return publicUrl;
}
