import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Link } from "@material-ui/core";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import Alert from "@material-ui/lab/Alert";
import FileUpload from "../../app/utils/FileUpload.js";
import firebase from "../../app/config/firebaseConfig.js";
import DeleteIcon from "@material-ui/icons/Delete";
import PreviewImage from "../preview_modals/PreviewImage.jsx";
import PreviewPDF from "../preview_modals/PreviewPDF.jsx";
import { makeReadable } from "../../app/utils/utils.js";

export default function StudentUpload({
  assignmentID,
  courseID,
  pastDue,
  uploadInfo,
  userID,
}) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadHistory, setUploadHistory] = useState([]);
  const [url, setUrl] = useState("");
  const acceptedFileTypes = uploadInfo?.accept;

  const [previewImageOpen, setPreviewImageOpen] = useState(false);
  const handleOpenImagePreview = () => {
    setPreviewImageOpen(true);
  };
  const handleCloseImagePreview = () => {
    setPreviewImageOpen(false);
  };

  const [previewPDFOpen, setPreviewPDFOpen] = useState(false);
  const handleOpenPDFPreview = () => {
    setPreviewPDFOpen(true);
  };
  const handleClosePDFPreview = () => {
    setPreviewPDFOpen(false);
  };

  const studentUploadRef = firebase
    .firestore()
    .collection("courses")
    .doc(courseID)
    .collection("assignments")
    .doc(assignmentID)
    .collection("uploads")
    .doc(userID);

  const gradeSummariesRef = firebase
    .firestore()
    .collection("courses")
    .doc(courseID)
    .collection("grade_summaries")
    .doc(userID);

  const handleSelectFile = (e) => {
    let selected = e.target.files[0];
    if (selected && acceptedFileTypes.includes(selected.type)) {
      setFile(selected);
      setError(false);
      setErrorMessage("");
    } else {
      setFile(null);
      setError(true);
      setErrorMessage(generateErrorMessage(acceptedFileTypes));
    }
  };

  function fetchUploadedFiles() {
    studentUploadRef.onSnapshot((docSnapshot) => {
      setUploadHistory(() => docSnapshot.data()?.files);
    });
  }

  useEffect(() => {
    fetchUploadedFiles(); // eslint-disable-next-line
  }, [assignmentID]);

  useEffect(
    () => saveUploadGradeSummary, // eslint-disable-next-line
    [file]
  );

  async function saveUploadGradeSummary() {
    if (file) {
      await gradeSummariesRef.set(
        {
          [uploadInfo.id]: {
            assignmentType: "student upload",
            totalEarnedPoints: 0,
            totalPossiblePoints: uploadInfo.totalPossiblePoints || 0,
          },
        },
        { merge: true }
      );
    }
  }

  return (
    <Box className="flex-center-all column full-width full-height">
      <PreviewImage
        open={previewImageOpen}
        handleOpen={handleOpenImagePreview}
        handleClose={handleCloseImagePreview}
        url={url}
      />
      <PreviewPDF
        open={previewPDFOpen}
        handleOpen={handleOpenPDFPreview}
        handleClose={handleClosePDFPreview}
        url={url}
      />
      <Box width="400px">
        <Typography variant="h5" className="padding-light" display="inline">
          {uploadInfo?.title}
        </Typography>
        <Typography
          color="textSecondary"
          className="padding-light"
          display="inline"
        >
          ({uploadInfo?.totalPossiblePoints || 0} points)
        </Typography>
        <Typography className="padding-light">
          {uploadInfo?.instructions}
        </Typography>
      </Box>

      <Box className="padding-medium ">
        {uploadHistory && (
          <Typography
            className="padding-tiny"
            color="textSecondary"
            variant="h6"
          >
            Submitted Files
          </Typography>
        )}
        {uploadHistory &&
          uploadHistory.map((uploadInfo, index) => (
            <Box key={index} className="flex-align-center padding-tiny">
              <Box width="350px">
                <Typography noWrap color="primary">
                  <Link
                    onClick={() => {
                      if (
                        uploadInfo.type === "image/png" ||
                        uploadInfo.type === "image/jpeg"
                      ) {
                        setUrl(uploadInfo.url);
                        handleOpenImagePreview();
                      }
                      if (uploadInfo.type === "application/pdf") {
                        setUrl(uploadInfo.url);
                        handleOpenPDFPreview();
                      }
                    }}
                    className="hover-pointer"
                  >
                    {uploadInfo.name}
                  </Link>
                </Typography>
              </Box>
              <Box>
                <button
                  className="delete-button delete-file-icon hover-pointer"
                  onClick={() => {
                    deleteStudentUpload(
                      studentUploadRef,
                      courseID,
                      assignmentID,
                      uploadInfo
                    );
                  }}
                >
                  <DeleteIcon />
                </button>
              </Box>
            </Box>
          ))}
      </Box>

      <form autoComplete="off">
        <Button
          variant="contained"
          component="label"
          startIcon={<CloudUploadIcon />}
          disabled={pastDue}
        >
          Upload
          <input type="file" hidden onChange={handleSelectFile} />
        </Button>
      </form>

      <Box padding={1}>
        {error && <Alert severity="warning">{errorMessage}</Alert>}
        {file && <Typography>{file.name}</Typography>}
        {file && (
          <FileUpload
            category="studentUpload"
            file={file}
            setFile={setFile}
            storagePath={`courses/${courseID}/student_uploads/${assignmentID}/${file.name}`}
            firestoreRef={studentUploadRef}
          />
        )}
      </Box>
      <Typography variant="subtitle2" color="textSecondary">
        accepted file types: {makeReadable(acceptedFileTypes)}
      </Typography>
    </Box>
  );
}

function generateErrorMessage(types) {
  if (types.includes("image/jpeg") && types.includes("image/png")) {
    return "File must be an image (.jpeg or .png)";
  } else if (types.includes("image/jpeg")) {
    return "File must be an image (.jpeg)";
  } else if (types.includes("image/png")) {
    return "File must be an image(.png)";
  } else if (types.includes("application/pdf")) {
    return "File must be a PDF";
  }
}

async function deleteStudentUpload(
  studentUploadRef,
  courseID,
  assignmentID,
  uploadInfo
) {
  const fileName = uploadInfo.name;
  const studentUploadStorageRef = firebase
    .storage()
    .ref()
    .child(`courses/${courseID}/student_uploads/${assignmentID}/${fileName}`);

  try {
    await studentUploadStorageRef.delete();
  } catch (error) {
    console.log("an error -unable to delete the image");
  }

  try {
    await studentUploadRef.update({
      files: firebase.firestore.FieldValue.arrayRemove(uploadInfo),
    });
  } catch (error) {
    console.log("an error occurred - unable to delete the image");
  }
}
