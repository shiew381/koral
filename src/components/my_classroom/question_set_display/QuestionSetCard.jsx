import React, { useState, useEffect } from "react";
import {
  Backdrop,
  Box,
  Button,
  Card,
  CircularProgress,
  Fade,
  Link,
  Modal,
  Typography,
} from "@material-ui/core";
import { Field, Formik, Form } from "formik";
import IconButton from "@material-ui/core/IconButton";
import { addReportProblem } from "../../../app/firestoreClient.js";
import {
  ChevronLeft,
  ChevronRight,
  ReportProblemOutlined,
} from "@material-ui/icons";
import {
  MultipleChoice,
  ShortAnswer,
  FreeResponse,
  TitleCard,
  Upload,
  InfoCard,
} from "./qSetDisplayCpnts.jsx";
import { pickInitialValues, tidyResponse } from "./qSetDisplayValues.js";
import { DescriptionField } from "../../../app/utils/CustomInputFields.jsx";
import { grade } from "./questionGrading.js";
import {
  saveResponse,
  fetchResponses,
  saveQuestionSetGradeSummary,
} from "../../../app/firestoreClient.js";
import { alphabet, renderQuestionSnippet } from "../../../app/utils/utils.js";
import { generateEarnedPointsID } from "./qSetDisplayUtils";
import PreviewPDF from "../../preview_modals/PreviewPDF.jsx";

export default function QuestionSetCard({
  assignmentGrade,
  assignmentID,
  assignmentInfo,
  collection,
  courseID,
  instructorView,
  pastDue,
  questionSet,
  setAssignmentGrade,
  userID,
  userDisplayName,
}) {
  const [qIndex, setQIndex] = useState(0);
  const [submittedPart, setSubmittedPart] = useState(-1);
  const [submissionHistory, setSubmissionHistory] = useState({});
  const currentQuestion = questionSet?.questions[qIndex];
  const questionID = currentQuestion?.id;

  const questionProps = {
    assignmentGrade: assignmentGrade,
    assignmentID: assignmentID,
    assignmentInfo: assignmentInfo,
    courseID: courseID,
    instructorView: instructorView,
    pastDue: pastDue,
    setAssignmentGrade: setAssignmentGrade,
    submissionHistory: submissionHistory,
    userID: userID,
  };

  useEffect(() => {
    setQIndex(0);
    const unsubscribe = fetchResponses(
      collection,
      courseID,
      assignmentID,
      userID,
      questionSet.id,
      setSubmissionHistory
    );
    return unsubscribe;
    // eslint-disable-next-line
  }, [questionSet]);

  return (
    <Formik
      enableReinitialize
      initialValues={pickInitialValues(currentQuestion, submissionHistory)}
      onSubmit={async (values, { setSubmitting }) => {
        setSubmitting(true);

        let submittedQuestion = getSubmittedQuestion();
        let submittedResponse = getSubmittedResponse(values);

        const responseGrade = await grade(submittedQuestion, submittedResponse);

        const tidiedResponse = tidyResponse(
          submittedPart,
          submittedQuestion,
          submittedResponse,
          responseGrade,
          submissionHistory
        );

        tidiedResponse.questionSetID = questionSet.id;
        tidiedResponse.questionSetTitle = questionSet.title;
        tidiedResponse.totalPossiblePoints = questionSet.totalPossiblePoints;

        tidiedResponse.totalEarnedPoints = sumEarnedPoints(
          tidiedResponse,
          submissionHistory
        );

        saveResponse(
          tidiedResponse,
          courseID,
          assignmentID,
          userID,
          questionSet.id,
          collection
        );

        saveQuestionSetGradeSummary(
          tidiedResponse,
          courseID,
          assignmentID,
          userID,
          userDisplayName
        );

        setSubmittedPart(-1);
        setSubmitting(false);
      }}
    >
      {({ values, isSubmitting, setFieldValue, resetForm }) => (
        <Form autoComplete="off">
          <Card
            className="question-set-display-card margin-auto relative"
            style={{ overflow: "auto" }}
          >
            {/* <Box className="absolute">
              <pre>{JSON.stringify(assignmentInfo, values, 2)}</pre>
            </Box> */}

            {currentQuestion?.type === "multiple choice" && (
              <MultipleChoice
                currentQuestion={currentQuestion}
                isSubmitting={isSubmitting}
                responseHistory={getResponseHistory(questionID, -1)}
                values={values}
                {...questionProps}
              />
            )}
            {currentQuestion?.type === "short answer" && (
              <ShortAnswer
                currentQuestion={currentQuestion}
                isSubmitting={isSubmitting}
                responseHistory={getResponseHistory(questionID, -1)}
                setFieldValue={setFieldValue}
                values={values}
                {...questionProps}
              />
            )}
            {currentQuestion?.type === "free response" && (
              <FreeResponse
                currentQuestion={currentQuestion}
                isSubmitting={isSubmitting}
                responseHistory={getResponseHistory(questionID, -1)}
                values={values}
                {...questionProps}
              />
            )}
            {currentQuestion?.type === "title card" && (
              <TitleCard currentQuestion={currentQuestion} />
            )}
            {currentQuestion?.type === "file upload" && (
              <Upload
                collection={collection}
                currentQuestion={currentQuestion}
                questionSet={questionSet}
                responseHistory={getResponseHistory(questionID, -1)}
                {...questionProps}
              />
            )}
            {currentQuestion?.type === "multipart" &&
              currentQuestion.parts.map((question, partIndex) => (
                <Box key={partIndex} style={{ paddingBottom: "120px" }}>
                  {question.type === "multiple choice" && (
                    <MultipleChoice
                      currentQuestion={{
                        id: currentQuestion.id,
                        ...question,
                      }}
                      isSubmitting={isSubmitting}
                      isMultipart
                      partIndex={partIndex}
                      responseHistory={getResponseHistory(
                        questionID,
                        partIndex
                      )}
                      setSubmittedPart={setSubmittedPart}
                      values={values}
                      {...questionProps}
                    />
                  )}
                  {question.type === "short answer" && (
                    <ShortAnswer
                      currentQuestion={{
                        id: currentQuestion.id,
                        ...question,
                      }}
                      isMultipart
                      isSubmitting={isSubmitting}
                      partIndex={partIndex}
                      responseHistory={getResponseHistory(
                        questionID,
                        partIndex
                      )}
                      setFieldValue={setFieldValue}
                      setSubmittedPart={setSubmittedPart}
                      values={values}
                      {...questionProps}
                    />
                  )}
                  {question.type === "free response" && (
                    <FreeResponse
                      currentQuestion={{
                        id: currentQuestion.id,
                        ...question,
                      }}
                      isMultipart
                      isSubmitting={isSubmitting}
                      partIndex={partIndex}
                      responseHistory={getResponseHistory(
                        questionID,
                        partIndex
                      )}
                      setSubmittedPart={setSubmittedPart}
                      values={values}
                      {...questionProps}
                    />
                  )}
                  {question.type === "info card" && (
                    <InfoCard
                      currentQuestion={question}
                      isMultipart
                      partIndex={partIndex}
                    />
                  )}
                  {question.type === "file upload" && (
                    <Upload
                      collection={collection}
                      currentQuestion={{
                        id: currentQuestion.id,
                        ...question,
                      }}
                      questionSet={questionSet}
                      isMultipart={true}
                      partIndex={partIndex}
                      responseHistory={getResponseHistory(
                        questionID,
                        partIndex
                      )}
                      {...questionProps}
                    />
                  )}
                </Box>
              ))}

            {currentQuestion?.type === "multipart" ? (
              <SolutionViewerMultipart
                assignmentInfo={assignmentInfo}
                currentQuestion={currentQuestion}
                getResponseHistory={getResponseHistory}
                pastDue={pastDue}
              />
            ) : (
              <SolutionViewer
                assignmentInfo={assignmentInfo}
                currentQuestion={currentQuestion}
                getResponseHistory={getResponseHistory}
                pastDue={pastDue}
              />
            )}
            <ReportAProblem currentQuestion={currentQuestion} userID={userID} />
            {pastDue && (
              <Box className="padding-light past-due">
                <Typography color="primary">
                  The assignment due date has passed.
                </Typography>
              </Box>
            )}
          </Card>
          <QuestionNavigator
            qIndex={qIndex}
            questionSet={questionSet}
            resetForm={resetForm}
            setQIndex={setQIndex}
          />
        </Form>
      )}
    </Formik>
  );

  function getResponseHistory(questionID, partIndex) {
    const multipartID = `${questionID}_${alphabet[partIndex]}`;
    if (partIndex < 0)
      return {
        answeredCorrectly:
          submissionHistory?.[`${questionID}_answeredCorrectly`] || false,
        attemptsUsed:
          submissionHistory?.[`${questionID}_responses`]?.length || 0,
        earnedPoints: submissionHistory?.[`${questionID}_earnedPoints`] || 0,
        timestamps: submissionHistory?.[`${questionID}_timestamps`],
        lastTimestamp: submissionHistory?.[`${questionID}_timestamp`],
        responses: submissionHistory?.[`${questionID}_responses`],
        lastResponse: submissionHistory?.[`${questionID}_response`] || false,
        lastUpload: submissionHistory?.[`${questionID}_upload`] || null,
      };
    else if (partIndex >= 0)
      return {
        answeredCorrectly:
          submissionHistory?.[`${multipartID}_answeredCorrectly`] || false,
        attemptsUsed:
          submissionHistory?.[`${multipartID}_responses`]?.length || 0,
        earnedPoints: submissionHistory?.[`${multipartID}_earnedPoints`] || 0,
        timestamps: submissionHistory?.[`${multipartID}_timestamps`],
        lastTimestamp: submissionHistory?.[`${multipartID}_timestamp`],
        responses: submissionHistory?.[`${multipartID}_responses`],
        lastResponse: submissionHistory?.[`${multipartID}_response`] || false,
        lastUpload: submissionHistory?.[`${multipartID}_upload`] || null,
      };
  }

  function getSubmittedQuestion() {
    if (currentQuestion.type !== "multipart") return currentQuestion;
    if (currentQuestion.type === "multipart")
      return {
        id: currentQuestion.id,
        ...currentQuestion.parts[submittedPart],
      };
  }

  function getSubmittedResponse(values) {
    return currentQuestion.type === "multipart"
      ? values.parts[submittedPart].response
      : values.response;
  }

  function attachPartLabel(question) {
    return question.parts.map(
      (part, index) => `${question.id}_${alphabet[index]}`
    );
  }

  function sumEarnedPoints(tidiedResponse, submissionHistory) {
    const questionIDs = questionSet.questions.map((question) =>
      question.type === "multipart" ? attachPartLabel(question) : question.id
    );

    const flattenedQuestionIDs = questionIDs.flat();

    const earnedPointsIDs = flattenedQuestionIDs.map((questionID) =>
      generateEarnedPointsID(questionID, -1)
    );

    const pointsArray = earnedPointsIDs.map((earnedPointsID) => {
      if (tidiedResponse[earnedPointsID]) {
        return tidiedResponse[earnedPointsID];
      } else if (submissionHistory && submissionHistory[earnedPointsID]) {
        return submissionHistory[earnedPointsID];
      } else return 0;
    });

    return pointsArray.reduce(
      (accumulatedPoints, points) => accumulatedPoints + points
    );
  }
}

export function SolutionViewer({
  assignmentInfo,
  currentQuestion,
  getResponseHistory,
  pastDue,
}) {
  const [url, setUrl] = useState("");
  const [previewPDFOpen, setPreviewPDFOpen] = useState(false);

  const openPDFPreview = () => {
    setPreviewPDFOpen(true);
  };
  const closePDFPreview = () => {
    setPreviewPDFOpen(false);
    setUrl("");
  };

  const responseHistory = getResponseHistory(currentQuestion?.id, -1);
  const showSolution = makeSolutionAvailable(
    currentQuestion,
    responseHistory,
    assignmentInfo,
    pastDue
  );

  if (!showSolution) return null;

  return (
    <>
      <PreviewPDF
        open={previewPDFOpen}
        handleOpen={openPDFPreview}
        handleClose={closePDFPreview}
        url={url}
      />
      <Link
        variant="subtitle1"
        className="hover-pointer absolute"
        style={
          currentQuestion.type === "free response"
            ? { right: "59px", top: "400px" }
            : { right: "59px", top: "385px" }
        }
        onClick={() => {
          if (currentQuestion.solution.type === "application/pdf") {
            setUrl(currentQuestion.solution.url);
            openPDFPreview();
          }
        }}
      >
        view solution
      </Link>
    </>
  );
}

function SolutionViewerMultipart({
  assignmentInfo,
  currentQuestion,
  getResponseHistory,
  pastDue,
}) {
  const [url, setUrl] = useState("");
  const [previewPDFOpen, setPreviewPDFOpen] = useState(false);
  const completedQuestions = [];
  const historyArr = [];

  const openPDFPreview = () => {
    setPreviewPDFOpen(true);
  };
  const closePDFPreview = () => {
    setPreviewPDFOpen(false);
    setUrl("");
  };

  const solutionExists = currentQuestion?.solution;
  const hasDueDate = assignmentInfo?.hasDueDate || false;
  const hideSolutions = assignmentInfo?.hideSolutions || false;

  if (!solutionExists) return null;
  if (hideSolutions && hasDueDate && !pastDue) return null;

  currentQuestion.parts.map((part, partIndex) =>
    historyArr.push(getResponseHistory(currentQuestion.id, partIndex) || false)
  );

  for (let i = 0; i < currentQuestion.parts.length; i++) {
    const answeredCorrectly = historyArr[i]?.answeredCorrectly;
    const attemptsExhausted =
      historyArr[i]?.attemptsUsed >= currentQuestion.parts[i]?.attemptsAllowed;
    const lastResponseExists = historyArr[i]?.lastResponse ? true : false;

    if (answeredCorrectly || attemptsExhausted || lastResponseExists) {
      completedQuestions.push(true);
    } else completedQuestions.push(false);
  }

  const allPartsCompleted = completedQuestions.every((part) => part === true);
  if (!allPartsCompleted) return null;

  return (
    <>
      <PreviewPDF
        open={previewPDFOpen}
        handleOpen={openPDFPreview}
        handleClose={closePDFPreview}
        url={url}
      />
      <Link
        variant="subtitle1"
        className="hover-pointer flex-justify-center relative"
        style={{ bottom: "50px" }}
        onClick={() => {
          if (currentQuestion.solution.type === "application/pdf") {
            setUrl(currentQuestion.solution.url);
            openPDFPreview();
          }
        }}
      >
        view solution
      </Link>
    </>
  );
}

function makeSolutionAvailable(
  currentQuestion,
  responseHistory,
  assignmentInfo,
  pastDue
) {
  const solutionExists = currentQuestion?.solution;
  const attemptsAllowed = currentQuestion?.attemptsAllowed || 1;
  const attemptsUsed = responseHistory?.attemptsUsed || 0;
  const attemptsExhausted = attemptsUsed >= attemptsAllowed;
  const answeredCorrectly = responseHistory?.answeredCorrectly || false;
  const lastResponse = responseHistory?.lastResponse || null;
  const hasDueDate = assignmentInfo?.hasDueDate || false;
  const hideSolutions = assignmentInfo?.hideSolutions || false;

  if (!solutionExists) return false;

  if (hideSolutions && hasDueDate && !pastDue) return false;

  if (currentQuestion.type === "free response" && lastResponse) return true;

  if (!attemptsExhausted && !answeredCorrectly) return false;

  return true;
}

function QuestionNavigator({ qIndex, questionSet, resetForm, setQIndex }) {
  return (
    <Box className="flex-column align-center">
      <Box className="relative progress-circles">
        {questionSet.questions.map((question, index) => (
          <svg
            key={index}
            onClick={() => setQIndex(index)}
            height="20"
            width="30"
            className="hover-pointer"
          >
            <circle
              cx="15"
              cy="10"
              r="8"
              stroke={
                index === qIndex ? "rgba(101,186,205,0.8)" : "transparent"
              }
              strokeWidth="2"
              fill="rgba(132,180,188,0.5)"
            />
          </svg>
        ))}
      </Box>
      <Box className="flex-row align-center">
        <IconButton
          onClick={() => {
            setQIndex((prevIndex) => qIndex - 1);
            resetForm();
          }}
          aria-label="previous question"
          disabled={qIndex < 1}
        >
          <ChevronLeft fontSize="default" />
        </IconButton>
        <Typography display="block" variant="subtitle2" color="textSecondary">
          QUESTION {qIndex + 1} OF {questionSet?.questions.length}
        </Typography>{" "}
        <IconButton
          onClick={() => {
            setQIndex((prevIndex) => qIndex + 1);
            resetForm();
          }}
          aria-label="next question"
          disabled={qIndex >= questionSet.questions.length - 1}
        >
          <ChevronRight fontSize="default" />
        </IconButton>
      </Box>
    </Box>
  );
}

function ReportAProblem({ currentQuestion, userID }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button
        className="report-a-problem"
        onClick={handleOpen}
        startIcon={<ReportProblemOutlined />}
        style={{
          color: "gray",
          position: "relative",
          bottom: "25px",
          left: "35px",
        }}
      >
        REPORT A PROBLEM
      </Button>
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
          <Box
            className="padding-medium modal-common-styling"
            style={{ minWidth: "400px", maxWidth: "500px" }}
          >
            <Typography variant="h5" color="primary">
              Report a Problem
            </Typography>
            <Formik
              initialValues={{
                question: currentQuestion,
                userID: userID,
                description: "",
              }}
              onSubmit={async (values, { setSubmitting }) => {
                setSubmitting(true);
                await addReportProblem(values);
                await new Promise((r) => setTimeout(r, 800));
                setSubmitting(false);
                handleClose();
              }}
            >
              {({ values, isSubmitting, dirty }) => (
                <Form autoComplete="off">
                  <Box className="flex-column report-a-problem">
                    <Typography>
                      {renderQuestionSnippet(currentQuestion)}
                    </Typography>
                    <Field
                      name="description"
                      as={DescriptionField}
                      style={{ marginTop: "10px" }}
                    />
                    <Box className="flex justify-end padding-tiny">
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={isSubmitting}
                        style={{ marginTop: "10px" }}
                      >
                        {isSubmitting ? (
                          <CircularProgress size={25} />
                        ) : (
                          "Submit"
                        )}
                      </Button>
                    </Box>
                  </Box>
                </Form>
              )}
            </Formik>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}
