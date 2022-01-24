import React from "react";
import { Box, Typography, Button } from "@material-ui/core";
import { Card, CardMedia } from "@material-ui/core";
import EditCourseTitleAndDescription from "./EditCourseTitleAndDescription";
import ManageCourseInstructors from "./ManageCourseInstructors";
import UploadCourseImage from "./UploadCourseImage";
import firebase from "../../app/config/firebaseConfig.js";
import DeleteIcon from "@material-ui/icons/Delete";

async function deleteCoursePicture(courseID, filename) {
  const pictureStorageRef = firebase
    .storage()
    .ref()
    .child(`courses/${courseID}/course_picture/${filename}`);

  const pictureFirestoreRef = firebase
    .firestore()
    .collection("courses")
    .doc(courseID);

  try {
    await pictureStorageRef.delete();
  } catch (error) {
    console.log(error.message);
  }
  try {
    await pictureFirestoreRef.update({
      coursePicture: firebase.firestore.FieldValue.delete(),
    });
  } catch (error) {
    console.log(error.message);
  }
}

function getInstructorNames(instructors) {
  if (instructors.length === 1) return instructors[0].name;

  if (instructors.length === 2)
    return `${instructors[0].name} and ${instructors[1].name}`;

  if (instructors.length > 2)
    return `${instructors[0].name}, ${instructors[1].name}, and others`;
}

export default function CourseDetails({
  availableTo,
  description,
  courseID,
  courseCode,
  created,
  coursePicture,
  instructors,
  title,
}) {
  return (
    <>
      <Box>
        <Card>
          {typeof coursePicture !== "undefined" ? (
            <CardMedia className="course-image" image={coursePicture.url} />
          ) : (
            <CardMedia
              className="course-image"
              image={process.env.REACT_APP_DEFAULT_COURSE_IMAGE}
            />
          )}
        </Card>
      </Box>
      <Box>
        <Box className="padding-bottom-light">
          <Box className="course-title-row">
            <Typography display="inline" variant="h5">
              {title}
            </Typography>

            <EditCourseTitleAndDescription
              courseID={courseID}
              title={title}
              description={description}
            />
          </Box>
          <Box className="flex course-description">
            <Typography variant="subtitle2" color="textSecondary">
              {description}
            </Typography>
          </Box>
        </Box>

        <Box className="info-row">
          <Box className="info-property">
            <Typography align="right">instructors: </Typography>
          </Box>
          <Box className="info-value">
            <Typography align="left">
              {instructors?.length > 0 && getInstructorNames(instructors)}
            </Typography>
          </Box>
          <ManageCourseInstructors courseID={courseID} courseTitle={title} />
        </Box>
        <Box className="info-row">
          <Box className="info-property">
            <Typography align="right">available to: </Typography>
          </Box>
          <Box className="info-value">
            {availableTo === "" ? (
              <Typography color="textSecondary">none selected</Typography>
            ) : (
              <Typography>{availableTo}</Typography>
            )}
          </Box>
        </Box>
        <Box className="info-row">
          <Box className="info-property">
            <Typography align="right">course code: </Typography>
          </Box>
          <Box className="info-value">
            <Typography>{courseCode}</Typography>
          </Box>
        </Box>
        <Box className="info-row">
          <Box className="info-property">
            <Typography align="right">created: </Typography>
          </Box>
          <Box className="info-value">
            <Typography>{created}</Typography>
          </Box>
        </Box>
        <Box className="info-row">
          <Box className="info-property">
            <Typography align="right">picture: </Typography>
          </Box>
          <Box className="info-value">
            {coursePicture ? (
              <Typography>{coursePicture.name}</Typography>
            ) : (
              <Typography color="textSecondary">
                sea-shells.png (placeholder)
              </Typography>
            )}
          </Box>
          <Box>
            {coursePicture ? (
              <Button
                style={{ color: "rgba(0, 0, 0, 0.54)" }}
                startIcon={<DeleteIcon />}
                onClick={() =>
                  deleteCoursePicture(courseID, coursePicture.name)
                }
              >
                Remove
              </Button>
            ) : (
              <UploadCourseImage courseID={courseID} />
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
}
