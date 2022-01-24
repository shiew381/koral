import React, { useEffect, useState } from "react";
import { Field } from "formik";
import {
  IconButton,
  Checkbox,
  Radio,
  Button,
  CircularProgress,
  Box,
  Typography,
  Divider,
  TextField,
  Link,
} from "@material-ui/core";
import {
  Delete,
  Star,
  StarHalf,
  StarBorder,
  CloudUpload,
} from "@material-ui/icons";
import {
  alphabet,
  extractDate,
  makeReadable,
} from "../../../app/utils/utils.js";
import { parseHTMLandTeX } from "../../../app/utils/customParsers.js";
import {
  multipleChoiceRadioStyling,
  questionDividerB,
} from "../../../app/utils/stylingSnippets.js";
import {
  LaTeXPallette,
  LaTeXDisplayBox,
} from "../../../app/utils/LaTeXPallette.jsx";
import {
  WordOrPhraseField,
  FreeResponseField,
} from "../../../app/utils/CustomInputFields.jsx";
import FileUpload from "../../../app/utils/FileUpload.js";
import firebase from "../../../app/config/firebaseConfig.js";
import Alert from "@material-ui/lab/Alert";
import PreviewImage from "../../preview_modals/PreviewImage.jsx";
import PreviewPDF from "../../preview_modals/PreviewPDF.jsx";

export function MultipleChoice({
  assignmentGrade,
  assignmentID,
  assignmentInfo,
  courseID,
  currentQuestion,
  instructorView,
  isMultipart,
  isSubmitting,
  partIndex,
  pastDue,
  responseHistory,
  setAssignmentGrade,
  setSubmittedPart,
  userID,
  values,
}) {
  const studentView = !instructorView;
  const answeredCorrectly = assignmentInfo?.hideCorrectStatus
    ? false
    : responseHistory?.answeredCorrectly;
  const numCorrectChoices = currentQuestion?.answerChoices?.reduce(
    (acc, cur) => (cur.isCorrect === true ? ++acc : acc),
    0
  );

  const attemptsAllowed = currentQuestion.attemptsAllowed || 1;
  const attemptsUsed = responseHistory?.attemptsUsed || 0;
  const attemptsExhausted = assignmentInfo?.unlimitedAttempts
    ? false
    : attemptsUsed >= attemptsAllowed;

  const disabled =
    attemptsExhausted || answeredCorrectly || instructorView || pastDue;

  // const timestampArr = responseHistory?.timestamps;
  // const lastSubmitted = Array.isArray(timestampArr)
  //   ? extractDate(timestampArr[timestampArr.length - 1].toDate())
  //   : null;

  const responseArr = responseHistory?.responses;
  const lastResponse = Array.isArray(responseArr)
    ? responseArr[responseArr.length - 1]
    : null;

  const multipartValues = values?.parts ? values?.parts[partIndex] : null;

  const responseValue = isMultipart
    ? multipartValues?.response
    : values?.response || [];

  const responseChanged = detectChange();

  function detectChange() {
    if (numCorrectChoices === 1) {
      if (responseValue?.length === 0) return false;
      else return lastResponse ? lastResponse !== responseValue : true;
    }
    if (numCorrectChoices > 1) {
      if (responseValue?.length === 0) return false;
      const lastResponseArr = lastResponse ? Object.values(lastResponse) : null;
      if (!lastResponseArr) return true;
      if (lastResponseArr?.length !== responseValue?.length) return true;
      const sortedResponseString = lastResponseArr.sort().join("");
      const sortedValuesString = responseValue?.sort().join("");
      return sortedResponseString !== sortedValuesString;
    } else return false;
  }

  const responseFieldname = isMultipart
    ? `parts.${partIndex}.response`
    : "response";

  return (
    <>
      <QuestionHeader
        assignmentGrade={assignmentGrade}
        assignmentID={assignmentID}
        assignmentInfo={assignmentInfo}
        courseID={courseID}
        currentQuestion={currentQuestion}
        instructorView={instructorView}
        isMultipart={isMultipart}
        partIndex={partIndex}
        responseHistory={responseHistory}
        setAssignmentGrade={setAssignmentGrade}
        userID={userID}
      />
      <Box minHeight="68%">
        <Prompt prompt={currentQuestion.prompt} />
        <Divider style={questionDividerB} />
        <Box className="padding-horizontal-medium">
          {currentQuestion.answerChoices.map((element, choiceIndex) => (
            <Box
              key={`ans${choiceIndex}`}
              className="flex-row padding-vertical-light"
            >
              {numCorrectChoices === 1 && (
                <Field
                  name={responseFieldname}
                  type="radio"
                  value={`${choiceIndex}`}
                  color="primary"
                  as={Radio}
                  disabled={disabled}
                  style={multipleChoiceRadioStyling}
                />
              )}
              {numCorrectChoices > 1 && (
                <Field
                  name={responseFieldname}
                  type="checkbox"
                  value={`${choiceIndex}`}
                  color="primary"
                  as={Checkbox}
                  disabled={disabled}
                  style={multipleChoiceRadioStyling}
                />
              )}

              <Typography variant="subtitle1">
                {parseHTMLandTeX(element.answerChoice)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box className="flex-column text-align-center submit-response">
        <AttemptsCounter
          assignmentInfo={assignmentInfo}
          currentQuestion={currentQuestion}
          responseHistory={responseHistory}
        />
        {studentView && (
          <SubmitResponseButton
            assignmentInfo={assignmentInfo}
            currentQuestion={currentQuestion}
            disabled={disabled}
            isMultipart={isMultipart}
            isSubmitting={isSubmitting}
            partIndex={partIndex}
            responseChanged={responseChanged}
            responseHistory={responseHistory}
            setSubmittedPart={setSubmittedPart}
          />
        )}
      </Box>
      {/* {lastResponse && (
        <Box className="absolute" style={{ right: "0px" }}>
          <Typography align="right" style={{ paddingRight: "40px" }}>
            last submitted: {lastSubmitted}
          </Typography>
        </Box>
      )} */}
    </>
  );
}

export function ShortAnswer({
  assignmentGrade,
  assignmentID,
  assignmentInfo,
  courseID,
  currentQuestion,
  instructorView,
  isMultipart,
  isSubmitting,
  partIndex,
  pastDue,
  responseHistory,
  setFieldValue,
  setAssignmentGrade,
  setSubmittedPart,
  userID,
  values,
}) {
  const [numberPalletteOpen, setNumberPalletteOpen] = useState(false);
  const [unitPalletteOpen, setUnitPalletteOpen] = useState(false);

  const subtype = currentQuestion.subtype;
  const studentView = !instructorView;
  const answeredCorrectly = assignmentInfo?.hideCorrectStatus
    ? false
    : responseHistory?.answeredCorrectly;

  const attemptsAllowed = currentQuestion.attemptsAllowed || 1;
  const attemptsUsed = responseHistory?.attemptsUsed || 0;
  const attemptsExhausted = assignmentInfo?.unlimitedAttempts
    ? false
    : attemptsUsed >= attemptsAllowed;

  const disabled =
    attemptsExhausted || answeredCorrectly || instructorView || pastDue;

  // const timestampArr = responseHistory?.timestamps;
  // const lastSubmitted = Array.isArray(timestampArr)
  //   ? extractDate(timestampArr[timestampArr.length - 1].toDate())
  //   : null;

  const responseArr = responseHistory?.responses;
  const lastResponse = Array.isArray(responseArr)
    ? responseArr[responseArr.length - 1]
    : null;

  const wordOrPhraseFieldname = isMultipart
    ? `parts.${partIndex}.response.wordOrPhrase`
    : "response.wordOrPhrase";

  const numberFieldname = isMultipart
    ? `parts.${partIndex}.response.number`
    : "response.number";

  const unitFieldname = isMultipart
    ? `parts.${partIndex}.response.unit`
    : "response.unit";

  const multipartValues = values?.parts ? values?.parts[partIndex] : null;

  const wordOrPhraseValue = isMultipart
    ? multipartValues?.response?.wordOrPhrase
    : values?.response?.wordOrPhrase || "";

  const numberValue = isMultipart
    ? multipartValues?.response?.number
    : values?.response?.number;

  const unitValue = isMultipart
    ? multipartValues?.response?.unit
    : values?.response?.unit;

  const responseChanged = detectChange();

  function detectChange() {
    switch (subtype) {
      case "wordOrPhrase":
        if (!lastResponse && wordOrPhraseValue === "") return false;
        return lastResponse ? lastResponse !== wordOrPhraseValue : true;
      case "number":
      case "symbolic":
      case "vector":
        if (!lastResponse && numberValue === "") return false;
        return lastResponse ? lastResponse.number !== numberValue : true;
      case "measurement":
      case "vector with unit":
        if (!lastResponse && numberValue === "" && unitValue === "")
          return false;
        return lastResponse
          ? lastResponse.number !== numberValue ||
              lastResponse.unit !== unitValue
          : true;
      default:
        return true;
    }
  }

  return (
    <>
      <QuestionHeader
        assignmentGrade={assignmentGrade}
        assignmentID={assignmentID}
        assignmentInfo={assignmentInfo}
        courseID={courseID}
        currentQuestion={currentQuestion}
        instructorView={instructorView}
        isMultipart={isMultipart}
        partIndex={partIndex}
        responseHistory={responseHistory}
        setAssignmentGrade={setAssignmentGrade}
        userID={userID}
      />
      <Box minHeight="68%">
        <Prompt prompt={currentQuestion.prompt} />
        <Divider style={questionDividerB} />
        {subtype === "wordOrPhrase" && (
          <Box className="flex-justify-center padding-heavy">
            <Field
              name={wordOrPhraseFieldname}
              as={WordOrPhraseField}
              disabled={disabled}
            />
          </Box>
        )}
        {(subtype === "number" ||
          subtype === "symbolic" ||
          subtype === "vector" ||
          subtype === "vector symbolic") && (
          <Box className="flex-center-all padding-top-heavy">
            <Box className="flex padding-x-light">
              <LaTeXDisplayBox
                value={numberValue}
                placeholder={getPlaceholder(subtype)}
              />
              {studentView && (
                <LaTeXPallette
                  fieldname={numberFieldname}
                  value={numberValue}
                  setFieldValue={setFieldValue}
                  palletteOpen={numberPalletteOpen}
                  setPalletteOpen={setNumberPalletteOpen}
                />
              )}
            </Box>
          </Box>
        )}
        {(subtype === "measurement" || subtype === "vector with unit") && (
          <Box className="flex-center-all padding-top-heavy">
            <Box className="flex padding-x-light">
              <LaTeXDisplayBox
                value={numberValue}
                placeholder={getPlaceholder(subtype)}
              />
              {studentView && (
                <LaTeXPallette
                  fieldname={numberFieldname}
                  value={numberValue}
                  setFieldValue={setFieldValue}
                  palletteOpen={numberPalletteOpen}
                  setPalletteOpen={setNumberPalletteOpen}
                />
              )}
            </Box>
            <Box className="flex padding-x-light">
              <LaTeXDisplayBox value={unitValue} placeholder="unit" />
              {studentView && (
                <LaTeXPallette
                  fieldname={unitFieldname}
                  value={unitValue}
                  setFieldValue={setFieldValue}
                  palletteOpen={unitPalletteOpen}
                  setPalletteOpen={setUnitPalletteOpen}
                />
              )}
            </Box>
          </Box>
        )}
      </Box>
      {/* {lastResponse && (
        <Typography align="right" style={{ marginRight: "35px" }}>
          last saved: {lastSubmitted}
        </Typography>
      )} */}
      <Box className="flex-column text-align-center submit-response">
        <AttemptsCounter
          assignmentInfo={assignmentInfo}
          currentQuestion={currentQuestion}
          responseHistory={responseHistory}
        />
        {studentView && (
          <SubmitResponseButton
            assignmentInfo={assignmentInfo}
            currentQuestion={currentQuestion}
            disabled={disabled}
            isMultipart={isMultipart}
            isSubmitting={isSubmitting}
            partIndex={partIndex}
            responseHistory={responseHistory}
            responseChanged={responseChanged}
            setSubmittedPart={setSubmittedPart}
          />
        )}
      </Box>
    </>
  );
}

export function FreeResponse({
  assignmentGrade,
  assignmentID,
  courseID,
  currentQuestion,
  instructorView,
  isMultipart,
  isSubmitting,
  partIndex,
  pastDue,
  responseHistory,
  setAssignmentGrade,
  setSubmittedPart,
  userID,
  values,
}) {
  const studentView = !instructorView;
  const lastSaved = extractDate(responseHistory?.lastTimestamp?.toDate());
  const lastResponse = responseHistory?.lastResponse || "";
  const characterlimit = currentQuestion.characterLimit;

  const multipartValues = values?.parts ? values?.parts[partIndex] : null;

  const charactersUsed = isMultipart
    ? multipartValues?.response?.length || 0
    : values.response?.length || 0;

  const charactersRemaining = characterlimit - charactersUsed;

  const disabled = instructorView || pastDue;

  const currentResponse = isMultipart
    ? multipartValues?.response || ""
    : values?.response || "";

  const responseChanged = detectChange();

  function detectChange() {
    if (lastResponse === currentResponse) return false;
    else return true;
  }

  return (
    <>
      <QuestionHeader
        assignmentGrade={assignmentGrade}
        assignmentID={assignmentID}
        courseID={courseID}
        currentQuestion={currentQuestion}
        instructorView={instructorView}
        isMultipart={isMultipart}
        partIndex={partIndex}
        responseHistory={responseHistory}
        setAssignmentGrade={setAssignmentGrade}
        userID={userID}
      />
      <Box minHeight="74%">
        <Prompt prompt={currentQuestion.prompt} />
        <Divider style={questionDividerB} />
        {!instructorView && (
          <Box width="90%" className="margin-auto">
            <Field
              name={isMultipart ? `parts.${partIndex}.response` : "response"}
              as={FreeResponseField}
              disabled={disabled}
              characterlimit={characterlimit}
            />
            <Typography className="padding-vertical-light" align="right">
              {`characters remaining: ${charactersRemaining} / ${characterlimit}`}
            </Typography>
            {lastSaved && (
              <Typography align="right">last saved: {lastSaved}</Typography>
            )}
            {!lastSaved && (
              <Typography align="right" color="textSecondary">
                (no response saved)
              </Typography>
            )}
          </Box>
        )}

        {instructorView && (
          <Box padding="15px">
            {lastResponse ? (
              <Typography>{lastResponse}</Typography>
            ) : (
              <Typography color="textSecondary">
                (no response submitted)
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {studentView && (
        <Box className="submit-response">
          <SaveResponseButton
            isMultipart={isMultipart}
            isSubmitting={isSubmitting}
            disabled={disabled}
            partIndex={partIndex}
            responseHistory={responseHistory}
            responseChanged={responseChanged}
            setSubmittedPart={setSubmittedPart}
            values={values}
          />
        </Box>
      )}
    </>
  );
}

export function TitleCard({ currentQuestion }) {
  return (
    <>
      <Title title={currentQuestion.title} />
      <Body body={currentQuestion.body} />
    </>
  );
}

export function Upload({
  assignmentGrade,
  assignmentID,
  collection,
  courseID,
  currentQuestion,
  instructorView,
  isMultipart,
  partIndex,
  pastDue,
  questionSet,
  responseHistory,
  setAssignmentGrade,
  userID,
}) {
  // no support yet for multipart
  const [file, setFile] = useState(null);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const acceptedFileTypes = currentQuestion?.accept;
  const [url, setUrl] = useState("");

  const studentView = !instructorView;
  const lastUpload = responseHistory?.lastUpload;
  const upload_key = isMultipart
    ? `${currentQuestion.id}_${alphabet[partIndex]}_upload`
    : `${currentQuestion.id}_upload`;

  const [previewImageOpen, setPreviewImageOpen] = useState(false);
  const openImagePreview = () => {
    setPreviewImageOpen(true);
  };
  const closeImagePreview = () => {
    setPreviewImageOpen(false);
  };

  const [previewPDFOpen, setPreviewPDFOpen] = useState(false);
  const openPDFPreview = () => {
    setPreviewPDFOpen(true);
  };
  const closePDFPreview = () => {
    setPreviewPDFOpen(false);
  };

  const handleSelectFile = (e) => {
    let selected = e.target.files[0];
    if (selected && acceptedFileTypes.includes(selected.type)) {
      setFile(selected);
      setError(false);
      setErrorMessage("");
    } else {
      setFile(null);
      setError(true);
      setErrorMessage("The file type is not accepted");
    }
  };

  const uploadRef =
    collection === "my_responses"
      ? firebase
          .firestore()
          .collection("user_questions")
          .doc(userID)
          .collection("my_responses")
          .doc(questionSet.id)
      : firebase
          .firestore()
          .collection("courses")
          .doc(courseID)
          .collection("assignments")
          .doc(assignmentID)
          .collection("results")
          .doc(userID);

  async function deleteUpload() {
    const uploadStorageRef =
      collection === "my_responses"
        ? firebase
            .storage()
            .ref()
            .child(`users/${userID}/questionSetUploads/${lastUpload.name}`)
        : firebase
            .storage()
            .ref()
            .child(
              `courses/${courseID}/student_uploads/${assignmentID}/${lastUpload.name}`
            );

    try {
      await uploadStorageRef.delete();
    } catch (error) {
      console.log("an error -unable to delete the image");
    }

    try {
      await uploadRef.update({
        [upload_key]: firebase.firestore.FieldValue.delete(),
      });
    } catch (error) {
      console.log("an error occurred - unable to delete the image");
    }
  }

  return (
    <>
      <PreviewImage
        open={previewImageOpen}
        handleOpen={openImagePreview}
        handleClose={closeImagePreview}
        url={url}
      />
      <PreviewPDF
        open={previewPDFOpen}
        handleOpen={openPDFPreview}
        handleClose={closePDFPreview}
        url={url}
      />
      <QuestionHeader
        assignmentGrade={assignmentGrade}
        assignmentID={assignmentID}
        courseID={courseID}
        currentQuestion={currentQuestion}
        instructorView={instructorView}
        isMultipart={isMultipart}
        partIndex={partIndex}
        responseHistory={responseHistory}
        setAssignmentGrade={setAssignmentGrade}
        userID={userID}
      />
      <Box minHeight="74%">
        <Prompt prompt={currentQuestion.prompt} />
        <Divider style={questionDividerB} />
        {lastUpload && (
          <Box height="200px" className="flex-center-all row">
            <Box className="flex-column" style={{ marginRight: "50px" }}>
              <Link
                variant="subtitle1"
                className="hover-pointer"
                onClick={() => {
                  if (
                    lastUpload.type === "image/png" ||
                    lastUpload.type === "image/jpeg"
                  ) {
                    setUrl(lastUpload.url);
                    openImagePreview();
                  }
                  if (lastUpload.type === "application/pdf") {
                    setUrl(lastUpload.url);
                    openPDFPreview();
                  }
                }}
              >
                {lastUpload.name}
              </Link>

              <Typography variant="subtitle2" color="textSecondary">
                uploaded {extractDate(lastUpload.uploaded.toDate())}
              </Typography>
              <Typography variant="subtitle2" color="textSecondary">
                size: {(lastUpload.size / 1000000).toFixed(2)} MB
              </Typography>
            </Box>
            {studentView && (
              <Box>
                <IconButton align="top">
                  <Delete onClick={() => deleteUpload()} />
                </IconButton>
              </Box>
            )}
          </Box>
        )}
        {!lastUpload && (
          <Box className="flex-center-all column full-width padding-top-medium">
            <Typography color="textSecondary" style={{ margin: "20px" }}>
              (no file uploaded)
            </Typography>
            {studentView && (
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUpload />}
                disabled={pastDue}
              >
                Upload
                <input type="file" hidden onChange={handleSelectFile} />
              </Button>
            )}

            <Box padding={1}>
              {error && <Alert severity="warning">{errorMessage}</Alert>}
              {file && <Typography>{file.name}</Typography>}
              {file && (
                <FileUpload
                  category="questionSetUpload"
                  file={file}
                  setFile={setFile}
                  storagePath={
                    collection === "my_responses"
                      ? `users/${userID}/questionSetUploads/${file.name}`
                      : `courses/${courseID}/student_uploads/${assignmentID}/${file.name}`
                  }
                  firestoreRef={uploadRef}
                  upload_key={upload_key}
                />
              )}
            </Box>
            <Typography variant="subtitle2" color="textSecondary">
              accepted file types: {makeReadable(acceptedFileTypes)}
            </Typography>
          </Box>
        )}
      </Box>
    </>
  );
}

export function InfoCard({ currentQuestion, isMultipart, partIndex }) {
  return (
    <>
      <QuestionHeader
        currentQuestion={currentQuestion}
        isMultipart={isMultipart}
        partIndex={partIndex}
      />
      <Info info={currentQuestion.info} />
    </>
  );
}

function PartLabel({ partIndex }) {
  return (
    <Typography
      display="inline"
      variant="h6"
      style={{ marginLeft: "10px", marginRight: "25px" }}
    >{`PART ${alphabet[partIndex]}`}</Typography>
  );
}

function Prompt({ prompt }) {
  return (
    <Box minHeight="20%" className="padding-horizontal-medium">
      <Typography>{parseHTMLandTeX(prompt)}</Typography>
    </Box>
  );
}

function Title({ title }) {
  return (
    <Box height="30%" className="padding-top-heavy text-align-center">
      <Typography variant="h5">{title}</Typography>
    </Box>
  );
}

function Body({ body }) {
  return (
    <Box height="50%" className="text-align-center">
      <Typography>{parseHTMLandTeX(body)}</Typography>
    </Box>
  );
}

function Info({ info }) {
  return (
    <Box height="50%" className="padding-horizontal-medium">
      <Typography>{parseHTMLandTeX(info)}</Typography>
    </Box>
  );
}

function AttemptsCounter({ assignmentInfo, currentQuestion, responseHistory }) {
  const attemptsAllowed = currentQuestion.attemptsAllowed || 1;
  const attemptsUsed = responseHistory?.attemptsUsed || 0;
  if (assignmentInfo?.unlimitedAttempts) return null;
  return (
    <Typography variant="subtitle1" color="textSecondary" align="center">
      {attemptsUsed} of {attemptsAllowed} attempts
    </Typography>
  );
}

function QuestionHeader({
  assignmentGrade,
  assignmentID,
  assignmentInfo,
  courseID,
  currentQuestion,
  instructorView,
  isMultipart,
  partIndex,
  responseHistory,
  setAssignmentGrade,
  userID,
}) {
  const answeredCorrectly = responseHistory?.answeredCorrectly || false;
  const hideCorrectStatus = assignmentInfo?.hideCorrectStatus || false;

  return (
    <Box
      className="flex space-between align-center padding-bottom-light"
      style={{
        marginLeft: "20px",
        marginRight: "20px",
        marginBottom: "20px",
      }}
    >
      <Box>
        {isMultipart && <PartLabel partIndex={partIndex} />}
        <Typography display="inline" variant="subtitle2" color="textSecondary">
          {currentQuestion.type}
        </Typography>
      </Box>
      <Box className="flex align-center">
        {responseHistory?.attemptsUsed > 0 && !hideCorrectStatus && (
          <CorrectStatus
            answeredCorrectly={answeredCorrectly}
            isMultipart={isMultipart}
          />
        )}
        {!hideCorrectStatus && (
          <PointsDisplay
            assignmentGrade={assignmentGrade}
            assignmentID={assignmentID}
            courseID={courseID}
            currentQuestion={currentQuestion}
            instructorView={instructorView}
            isMultipart={isMultipart}
            partIndex={partIndex}
            responseHistory={responseHistory}
            setAssignmentGrade={setAssignmentGrade}
            userID={userID}
          />
        )}
      </Box>
    </Box>
  );
}

function CorrectStatus({ answeredCorrectly }) {
  return (
    <Box>
      {answeredCorrectly === true && (
        <Typography
          variant="subtitle2"
          className="flex align-center"
          color="primary"
        >
          <Star />
          CORRECT
        </Typography>
      )}

      {answeredCorrectly === false && (
        <Typography
          variant="subtitle2"
          className="flex align-center"
          style={{ color: "#E2973C" }}
        >
          <StarBorder />
          INCORRECT
        </Typography>
      )}

      {answeredCorrectly === "partial" && (
        <Typography
          variant="subtitle2"
          className="flex align-center"
          style={{ color: "#E2973C" }}
        >
          <StarHalf />
          PARTIAL
        </Typography>
      )}
    </Box>
  );
}

function PointsDisplay({
  assignmentGrade,
  assignmentID,
  courseID,
  currentQuestion,
  instructorView,
  isMultipart,
  partIndex,
  responseHistory,
  setAssignmentGrade,
  userID,
}) {
  //reminder: check that higher lever components are passing down partIndex

  const possiblePoints = currentQuestion.possiblePoints;
  const earnedPoints = responseHistory?.earnedPoints || 0;
  const [points, setPoints] = useState(earnedPoints);

  const changePoints = (event) => {
    setPoints(Number(event.target.value));
  };
  useEffect(() => setPoints(earnedPoints), [earnedPoints]);

  if (currentQuestion.type === "info card") return null;

  function countTotalEarnedPoints(updatedSubmissionHistory) {
    if (!updatedSubmissionHistory) return;
    const propertiesArr = Object.keys(updatedSubmissionHistory);
    const earnedPointsKeys = propertiesArr.filter(
      (el) => el.slice(-12) === "earnedPoints"
    );
    const earnedPointsArr = [];
    earnedPointsKeys.forEach((key) =>
      earnedPointsArr.push(updatedSubmissionHistory[key])
    );
    const totalEarnedPoints = earnedPointsArr.reduce((acc, cur) => acc + cur);
    return totalEarnedPoints;
  }

  const submissionHistoryRef = firebase
    .firestore()
    .collection("courses")
    .doc(courseID)
    .collection("assignments")
    .doc(assignmentID)
    .collection("results")
    .doc(userID);

  const gradeSummaryRef = firebase
    .firestore()
    .collection("courses")
    .doc(courseID)
    .collection("grade_summaries")
    .doc(userID);

  async function updatePoints() {
    const earnedPointsKey = isMultipart
      ? `${currentQuestion.id}_${alphabet[partIndex]}_earnedPoints`
      : `${currentQuestion.id}_earnedPoints`;
    await submissionHistoryRef
      .update({
        [earnedPointsKey]: points,
      })
      .then(() => updateGradeSummary());
  }

  async function updateGradeSummary() {
    await submissionHistoryRef.get().then(async (doc) => {
      const newTotalEarnedPoints = countTotalEarnedPoints(doc.data());
      const newAssignmentGrade = {
        assignmentType: "question set",
        totalEarnedPoints: newTotalEarnedPoints,
        totalPossiblePoints: assignmentGrade.totalPossiblePoints,
      };
      setAssignmentGrade(() => newAssignmentGrade);
      await gradeSummaryRef.update({ [assignmentID]: newAssignmentGrade });
    });
  }

  return instructorView ? (
    <span className="flex align-center" style={{ marginLeft: "10px" }}>
      <TextField
        variant="outlined"
        type="number"
        value={points}
        onChange={changePoints}
        inputProps={{ min: 0, style: { padding: 4, textAlign: "center" } }}
        style={{ width: "45px" }}
      />
      <Typography
        variant="subtitle1"
        color="textSecondary"
        style={{ marginLeft: "5px", marginRight: "20px" }}
      >{` / ${possiblePoints} points`}</Typography>
      <Button
        disabled={points === earnedPoints}
        variant="contained"
        color="primary"
        onClick={() => updatePoints()}
      >
        UPDATE
      </Button>
    </span>
  ) : (
    <Typography
      variant="subtitle2"
      color="textSecondary"
      style={{ marginLeft: "10px" }}
    >{`${earnedPoints} / ${possiblePoints} points`}</Typography>
  );
}

function SubmitResponseButton({
  disabled,
  isMultipart,
  isSubmitting,
  partIndex,
  responseChanged,
  setSubmittedPart,
}) {
  return (
    <Box className="flex align-center">
      <Button
        fullWidth
        style={{ marginTop: "5px" }}
        type="submit"
        variant="contained"
        color="primary"
        disabled={disabled || !responseChanged}
        onClick={() => {
          if (isMultipart) setSubmittedPart(partIndex);
        }}
      >
        {isSubmitting ? <CircularProgress size={25} /> : "Submit"}
      </Button>
    </Box>
  );
}

function SaveResponseButton({
  disabled,
  isMultipart,
  isSubmitting,
  partIndex,
  responseChanged,
  setSubmittedPart,
}) {
  return (
    <Button
      fullWidth
      type="submit"
      style={{ marginTop: "5px" }}
      variant="contained"
      color="primary"
      disabled={disabled || !responseChanged}
      onClick={() => {
        if (isMultipart) setSubmittedPart(partIndex);
      }}
    >
      {isSubmitting ? <CircularProgress size={25} /> : "Save"}
    </Button>
  );
}

function getPlaceholder(subtype) {
  switch (subtype) {
    case "number":
    case "measurement":
      return "number";
    case "vector":
    case "vector symbolic":
    case "vector with unit":
      return "vector";
    case "symbolic":
      return "expression";
    default:
      return "response";
  }
}
