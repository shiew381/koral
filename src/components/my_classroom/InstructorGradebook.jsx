import React, { useState, useEffect } from "react";
import {
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Fade,
  Link,
  Modal,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Typography,
} from "@material-ui/core";
import { Refresh, GetApp } from "@material-ui/icons";
import { CSVDownloader } from "react-papaparse";
import firebase from "../../app/config/firebaseConfig.js";
import { ZoomControl } from "../../app/utils/utils.js";
import QuestionSetCard from "./question_set_display/QuestionSetCard.jsx";
import { headerStyle, rowStyle } from "../../app/utils/stylingSnippets.js";
import { Document, Page } from "react-pdf/dist/esm/entry.webpack";
import { pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function InstructorGradebook({ courseID, modules }) {
  const allCourseContent = modules.map((module) => module.content).flat();
  const courseAssignments = allCourseContent.filter(
    (content) => content.contentType === "assignment"
  );

  const [selectedUploads, setSelectedUploads] = useState([]);
  const [gradeSummaries, setGradeSummaries] = useState([]);
  const [selectedUserID, setSelectedUserID] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState({});
  const [selectedQuestionSet, setSelectedQuestionSet] = useState(null);
  const [qSetPreviewOpen, setQSetPreviewOpen] = useState(false);
  const [studentUploadPrevOpen, setStudentUploadPrevOpen] = useState(false);
  const [assignmentGrade, setAssignmentGrade] = useState(null);

  const closeQSetPreview = () => {
    setQSetPreviewOpen(false);
    fetchGradeSummaries();
  };

  const closeStudentUploadPreview = () => {
    setStudentUploadPrevOpen(false);
  };

  useEffect(
    () => fetchGradeSummaries(),
    //eslint-disable-next-line
    []
  );

  function openStudentAssignment(assignment, studentID) {
    switch (assignment.itemType) {
      case "question set":
        fetchQuestionSet(assignment.docRef, setSelectedQuestionSet);
        break;
      case "student upload":
        fetchStudentUpload(assignment.assignmentID, studentID);
        break;
      default:
        break;
    }
  }

  async function fetchQuestionSet(docRef, setSelectedQuestionSet) {
    await firebase
      .firestore()
      .doc(docRef)
      .get()
      .then((doc) => setSelectedQuestionSet({ id: doc.id, ...doc.data() }))
      .then(() => setQSetPreviewOpen(true));
  }

  async function fetchStudentUpload(assignmentID, studentID) {
    await firebase
      .firestore()
      .collection("courses")
      .doc(courseID)
      .collection("assignments")
      .doc(assignmentID)
      .collection("uploads")
      .doc(studentID)
      .get()
      .then((doc) => setSelectedUploads(doc.data().files))
      .then(() => setStudentUploadPrevOpen(true));
  }

  async function fetchGradeSummaries() {
    const fetchedItems = [];
    await firebase
      .firestore()
      .collection("courses")
      .doc(courseID)
      .collection("grade_summaries")
      .get()
      .then((snapshot) =>
        snapshot.forEach((doc) =>
          fetchedItems.push({ userID: doc.id, ...doc.data() })
        )
      )
      .then(() => setGradeSummaries(fetchedItems));
  }

  function displayPointSummary(assignment, summary, studentID) {
    const asgmtGrade = summary[assignment.assignmentID];

    if (!asgmtGrade) return <Typography color="textSecondary">N/A</Typography>;
    else
      return (
        <Link
          className="hover-pointer"
          style={{ fontFamily: "Lato" }}
          onClick={() => {
            setSelectedUserID(studentID);
            setSelectedAssignment(assignment);
            setAssignmentGrade(asgmtGrade);
            openStudentAssignment(assignment, studentID);
          }}
        >
          {asgmtGrade.totalEarnedPoints} of {asgmtGrade.totalPossiblePoints}
        </Link>
      );
  }

  function getGradebook(courseAssignments, gradeSummaries) {
    let gradeBook = gradeSummaries.map((i) => new Object());

    for (let i = 0; i < gradeSummaries.length; i++) {
      const studentGradeSummary = gradeSummaries[i];
      gradeBook[i]["Student Name"] = studentGradeSummary.userDisplayName;

      for (let k = 0; k < courseAssignments.length; k++) {
        const title = courseAssignments[k].title;

        if (
          studentGradeSummary.hasOwnProperty(courseAssignments[k].assignmentID)
        ) {
          getAssignmentScore(
            gradeBook,
            i,
            title,
            studentGradeSummary,
            courseAssignments,
            k
          );
          continue;
        }

        gradeBook[i][title] = "N/A";
      }
    }

    return gradeBook;
  }

  return (
    <>
      <Box className="flex space-between margin-bottom-light">
        <Button
          style={{ color: "rgba(0, 0, 0, 0.54)" }}
          onClick={() => fetchGradeSummaries()}
          startIcon={<Refresh />}
        >
          Refresh
        </Button>
        <CSVDownloader
          data={getGradebook(courseAssignments, gradeSummaries)}
          filename={"Course Roster"}
          bom={true}
        >
          <Button
            component="label"
            style={{ color: "rgba(0, 0, 0, 0.54)" }}
            startIcon={<GetApp />}
          >
            Download Gradebook (.csv)
          </Button>
        </CSVDownloader>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell style={headerStyle}>Student Name</TableCell>
              {courseAssignments.map((assignment, index) => (
                <TableCell style={headerStyle} key={`assigment${index}`}>
                  {assignment.title}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {gradeSummaries?.map((summary, userIndex) => (
              <TableRow key={`userDisplayName${userIndex}`}>
                <TableCell style={rowStyle}>
                  {summary.userDisplayName}
                </TableCell>
                {courseAssignments?.map((assignment, assignmentIndex) => (
                  <TableCell
                    key={`assignment${assignmentIndex}`}
                    style={rowStyle}
                  >
                    {displayPointSummary(assignment, summary, summary.userID)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <StudentUploadPreview
        assignmentGrade={assignmentGrade}
        closeModal={closeStudentUploadPreview}
        courseID={courseID}
        gradeSummaries={gradeSummaries}
        previewOpen={studentUploadPrevOpen}
        selectedAssignment={selectedAssignment}
        selectedUploads={selectedUploads}
        selectedUserID={selectedUserID}
        setGradeSummaries={setGradeSummaries}
      />
      <QuestionSetModal
        assignmentGrade={assignmentGrade}
        closeModal={closeQSetPreview}
        courseID={courseID}
        gradeSummaries={gradeSummaries}
        previewOpen={qSetPreviewOpen}
        selectedAssignment={selectedAssignment}
        selectedQuestionSet={selectedQuestionSet}
        selectedUserID={selectedUserID}
        setAssignmentGrade={setAssignmentGrade}
        setGradeSummaries={setGradeSummaries}
      />
    </>
  );
}

function getAssignmentScore(
  gbook,
  i,
  title,
  studentGradeSummary,
  courseAssignments,
  k
) {
  gbook[i][title] =
    studentGradeSummary[courseAssignments[k].assignmentID].totalEarnedPoints +
    " of " +
    studentGradeSummary[courseAssignments[k].assignmentID].totalPossiblePoints;
}

function StudentUploadPreview({
  assignmentGrade,
  closeModal,
  courseID,
  gradeSummaries,
  previewOpen,
  selectedAssignment,
  selectedUploads,
  selectedUserID,
  setGradeSummaries,
}) {
  const totalEarnedPoints = assignmentGrade?.totalEarnedPoints;
  const totalPossiblePoints = assignmentGrade?.totalPossiblePoints;
  const [points, setPoints] = useState(totalEarnedPoints);
  const [imageURL, setImageURL] = useState("");
  const [documentURL, setDocumentURL] = useState("");
  const [numPages, setNumPages] = useState(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => setImageURL(""), [selectedAssignment]);
  useEffect(() => setDocumentURL(""), [selectedAssignment]);

  const options = {
    cMapUrl: "cmaps/",
    cMapPacked: true,
  };

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  function displaySelectedMedia(uploadInfo) {
    setDocumentURL("");
    setImageURL("");

    switch (uploadInfo.type) {
      case "image/png":
        setImageURL(uploadInfo.url);
        break;
      case "image/jpeg":
        setImageURL(uploadInfo.url);
        break;
      case "application/pdf":
        setDocumentURL(uploadInfo.url);
        break;
      default:
        break;
    }
  }

  const handlePointsChange = (event) => {
    setPoints(Number(event.target.value));
  };

  return (
    <Modal
      className="flex-center-all"
      open={previewOpen}
      onClose={closeModal}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
    >
      <Fade in={previewOpen}>
        <Box className="modal-form-v2 modal-common-styling flex-row">
          <Box
            minWidth="220px"
            minHeight="500px"
            className="flex-column padding-light"
            style={{ backgroundColor: "rgba(0,0,0,0.05)" }}
          >
            <Typography variant="h6" color="textSecondary">
              {selectedAssignment.title}
            </Typography>
            <Divider />

            <Typography
              variant="subtitle1"
              className="padding-left-light"
              style={{ marginTop: "20px" }}
            >
              Submitted Files
            </Typography>
            {selectedUploads.map((uploadInfo, index) => (
              <Link
                noWrap
                key={`upload${index}`}
                className="hover-pointer padding-left-light"
                style={{ fontFamily: "Lato" }}
                onClick={() => displaySelectedMedia(uploadInfo)}
              >
                {uploadInfo.name}
              </Link>
            ))}
            <Box
              className="flex align-center justify-end"
              style={{ marginTop: "50px", marginBottom: "15px" }}
            >
              <TextField
                inputProps={{
                  min: 0,
                  style: { width: "50px", padding: 5, textAlign: "center" },
                }}
                type="number"
                variant="outlined"
                defaultValue={totalEarnedPoints}
                onChange={handlePointsChange}
              />
              <Typography
                style={{ marginLeft: "6px", marginRight: "5px" }}
                display="inline"
              >
                / {totalPossiblePoints}
              </Typography>
              <Typography
                display="inline"
                variant="subtitle1"
                style={{ marginRight: "20px" }}
              >
                points
              </Typography>
            </Box>

            <Button
              type="button"
              variant="contained"
              color="primary"
              style={{
                width: "140px",
                alignSelf: "flex-end",
                marginRight: "16px",
              }}
              onClick={() => {
                updateStudentUploadGrade(
                  courseID,
                  selectedAssignment.assignmentID,
                  selectedUserID,
                  points,
                  gradeSummaries,
                  setGradeSummaries
                );
              }}
              disabled={totalEarnedPoints === points}
            >
              Update
            </Button>
          </Box>
          <Box className="margin-left-medium flex-center-all" minWidth="780px">
            {!documentURL && !imageURL && (
              <Typography color="textSecondary">
                please select a file to view
              </Typography>
            )}
            {documentURL && (
              <Box
                maxWidth="120vw"
                maxHeight="100%"
                className="overflow-auto flex justify-center"
              >
                <Document
                  file={documentURL}
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
            )}
            {imageURL && <img src={imageURL} width="80%" alt="" />}
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}

function QuestionSetModal({
  assignmentGrade,
  closeModal,
  courseID,
  gradeSummaries,
  previewOpen,
  selectedAssignment,
  selectedQuestionSet,
  selectedUserID,
  setAssignmentGrade,
  setGradeSummaries,
}) {
  const selectedAssignmentID = selectedAssignment?.assignmentID;
  const totalEarnedPoints = assignmentGrade?.totalEarnedPoints;
  const totalPossiblePoints = assignmentGrade?.totalPossiblePoints;
  const [confirmReset, setConfirmReset] = useState("");

  const handleConfirmReset = (event) => {
    setConfirmReset(() => event.target.value);
  };

  async function clearQuestionSetResponses() {
    const updatedSummaries = gradeSummaries.map((summary) =>
      selectedUserID === summary.userID
        ? deleteAssignmentScore(summary, selectedAssignmentID)
        : summary
    );

    await firebase
      .firestore()
      .collection("courses")
      .doc(courseID)
      .collection("grade_summaries")
      .doc(selectedUserID)
      .update({
        [selectedAssignmentID]: firebase.firestore.FieldValue.delete(),
      });

    await firebase
      .firestore()
      .collection("courses")
      .doc(courseID)
      .collection("assignments")
      .doc(selectedAssignmentID)
      .collection("results")
      .doc(selectedUserID)
      .delete()
      .then(() => {
        setGradeSummaries(updatedSummaries);
        closeModal();
      });
  }

  if (!selectedQuestionSet) return null;

  return (
    <Modal
      className="flex-center-all"
      open={previewOpen}
      onClose={closeModal}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
    >
      <Fade in={previewOpen}>
        <Box className="modal-form-v2 modal-common-styling flex-row">
          <Card
            style={{
              minWidth: "300px",
              height: "300px",
              marginRight: "20px",
            }}
          >
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                {selectedQuestionSet.title}
              </Typography>
              <Divider />

              <Typography style={{ marginBottom: "20px" }}>
                {`${totalEarnedPoints} / ${totalPossiblePoints}
                  points`}
              </Typography>

              <Typography
                style={{ marginBottom: "10px", width: "200px" }}
                color="textSecondary"
                variant="subtitle2"
              >
                To clear all saved responses to this student's question set,
                type <strong>reset</strong> into the field below
              </Typography>
              <TextField
                style={{ maxWidth: "100px", marginRight: "20px" }}
                inputProps={{
                  style: { padding: 8 },
                }}
                variant="outlined"
                placeholder="reset"
                onChange={handleConfirmReset}
              />
              <Button
                onClick={() => clearQuestionSetResponses()}
                color="primary"
                variant="contained"
                disabled={confirmReset !== "reset"}
              >
                RESET
              </Button>
            </CardContent>
          </Card>

          <QuestionSetCard
            assignmentGrade={assignmentGrade}
            assignmentID={selectedAssignment.assignmentID}
            collection="courses"
            courseID={courseID}
            instructorView
            questionSet={selectedQuestionSet}
            setAssignmentGrade={setAssignmentGrade}
            userID={selectedUserID}
          />
        </Box>
      </Fade>
    </Modal>
  );
}

async function updateStudentUploadGrade(
  courseID,
  assignmentID,
  userID,
  points,
  gradeSummaries,
  setGradeSummaries
) {
  const updatedSummaries = gradeSummaries.map((summary) =>
    userID === summary.userID
      ? updateAssignmentScore(summary, assignmentID, points)
      : summary
  );

  const gradeSummaryRef = firebase
    .firestore()
    .collection("courses")
    .doc(courseID)
    .collection("grade_summaries")
    .doc(userID);

  await gradeSummaryRef.update({
    [`${assignmentID}.totalEarnedPoints`]: points,
  });
  setGradeSummaries(updatedSummaries);
}

function deleteAssignmentScore(summary, assignmentID) {
  delete summary[assignmentID];
  return summary;
}

function updateAssignmentScore(summary, assignmentID, points) {
  summary[assignmentID].totalEarnedPoints = points;
  return summary;
}
