import React, { useState } from "react";
import {
  Backdrop,
  Box,
  Card,
  CardContent,
  CardActionArea,
  Fade,
  Modal,
  Typography,
} from "@material-ui/core";
import { WatchLater, MenuBook } from "@material-ui/icons";
import { deleteContentFromModule } from "../../app/firestoreClient.js";
import ResourceForm from "./ResourceForm.jsx";
import AssignmentForm from "./AssignmentForm.jsx";

export default function ContentCard({
  userID,
  courseID,
  item,
  modules,
  moduleIndex,
  content,
  contentIndex,
}) {
  const [assignmentFormOpen, setAssignmentFormOpen] = useState(false);
  const [resourceFormOpen, setResourceFormOpen] = useState(false);

  const closeResourceForm = () => {
    setResourceFormOpen(false);
  };

  const closeAssignmentForm = () => {
    setAssignmentFormOpen(false);
  };

  const openModuleContentEditor = () => {
    switch (item.contentType) {
      case "resource":
        setResourceFormOpen(true);
        break;
      case "assignment":
        setAssignmentFormOpen(true);
        break;
      default:
        break;
    }
  };

  return (
    <Card className="module-item-card">
      <Box display="flex">
        <CardActionArea onClick={openModuleContentEditor}>
          <CardContent>
            <Box className="flex align-top">
              <Box className="flex justify-center" minWidth="50px" pt="2px">
                {item.contentType === "assignment" && (
                  <WatchLater style={{ paddingTop: "2px" }} color="disabled" />
                )}
                {item.contentType === "resource" && (
                  <MenuBook color="disabled" />
                )}
              </Box>
              <Box minWidth="400px" maxWidth="520px">
                <Typography display="inline" variant="subtitle1">
                  {item.title || item.name}
                </Typography>
                <Typography
                  color="textSecondary"
                  display="inline"
                  style={{
                    marginLeft: "15px",
                    marginRight: "15px",
                  }}
                >
                  |
                </Typography>
                <Typography display="inline" color="primary">
                  {item.itemType}
                </Typography>

                {item.contentType === "assignment" && (
                  <TimeSettings
                    hasDueDate={item.hasDueDate}
                    hasOpenDate={item.hasOpenDate}
                    due={item.due}
                    open={item.due}
                  />
                )}
                {item.itemType === "link" && (
                  <Typography noWrap color="textSecondary">
                    {item.url}
                  </Typography>
                )}
              </Box>
            </Box>
          </CardContent>
        </CardActionArea>

        <Modal
          className="flex-center-all"
          open={resourceFormOpen}
          onClose={closeResourceForm}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{
            timeout: 500,
          }}
        >
          <Fade in={resourceFormOpen}>
            <Box
              className="modal-common-styling"
              style={{ padding: "40px", maxHeight: "80vh", minWidth: "500px" }}
            >
              <ResourceForm
                userID={userID}
                courseID={courseID}
                modules={modules}
                moduleIndex={moduleIndex}
                content={content}
                contentIndex={contentIndex}
                closeResourceForm={closeResourceForm}
                item={item}
                edit={true}
              />
            </Box>
          </Fade>
        </Modal>

        <Modal
          className="flex-center-all"
          open={assignmentFormOpen}
          onClose={closeAssignmentForm}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{
            timeout: 500,
          }}
        >
          <Fade in={assignmentFormOpen}>
            <Box
              className="modal-common-styling"
              style={{ padding: "40px", maxHeight: "80vh", minWidth: "500px" }}
            >
              <AssignmentForm
                userID={userID}
                courseID={courseID}
                modules={modules}
                moduleIndex={moduleIndex}
                content={content}
                contentIndex={contentIndex}
                closeAssignmentForm={closeAssignmentForm}
                item={item}
                edit={true}
              />
            </Box>
          </Fade>
        </Modal>

        <Box className="padding-x-light flex-align-center">
          <button
            className="delete-button padding-tiny hover-pointer-blue"
            onClick={() =>
              deleteContent(
                courseID,
                modules,
                moduleIndex,
                content,
                contentIndex
              )
            }
          >
            X
          </button>
        </Box>
      </Box>
    </Card>
  );
}

function deleteContent(courseID, modules, moduleIndex, content, contentIndex) {
  const updatedContent = content.filter(
    (element, index) => index !== contentIndex
  );
  const updatedModules = modules.map((element, index) => {
    if (index === moduleIndex) {
      element.content = updatedContent;
    }
    return element;
  });
  deleteContentFromModule(courseID, updatedModules);
}

function TimeSettings({ due, hasDueDate, hasOpenDate, open }) {
  if (!hasOpenDate && hasDueDate) {
    return (
      <Typography color="textSecondary">
        {"due " + parseDate(due) + " at " + parseTime(due)}
      </Typography>
    );
  }

  if (hasOpenDate && !hasDueDate) {
    return (
      <Typography color="textSecondary">
        {"open " + parseDate(open) + " at " + parseTime(open)}
      </Typography>
    );
  }

  if (hasOpenDate && hasDueDate) {
    return (
      <Typography color="textSecondary">
        {"open " +
          parseDate(open) +
          " at " +
          parseTime(open) +
          ", " +
          " due " +
          parseDate(due) +
          " at " +
          parseTime(due)}
      </Typography>
    );
  }

  if (!hasOpenDate && !hasDueDate) {
    return null;
  }
  return null;
}

function parseDate(seconds) {
  const ms = seconds * 1000;
  const format = {
    day: "numeric",
    month: "short",
  };
  return new Date(ms).toLocaleDateString("en-us", format);
}

function parseTime(seconds) {
  const ms = seconds * 1000;

  const format = {
    hour: "numeric",
    minute: "numeric",
  };
  return new Date(ms).toLocaleTimeString("en-US", format);
}
