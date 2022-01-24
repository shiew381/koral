import React from "react";
import { Box, Typography } from "@material-ui/core";
import { Accordion } from "@material-ui/core";
import { AccordionSummary, AccordionDetails } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import AddModule from "./AddModule.jsx";
import AddModuleContent from "./AddModuleContent.jsx";
import ContentCard from "./ContentCard.jsx";
import {
  deleteCourseModule,
  updateCourseModuleOrder,
  updateCourseModuleContentOrder,
} from "../../app/firestoreClient.js";
import EditModuleTitle from "./EditModuleTitle";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import DragIndicatorIcon from "@material-ui/icons/DragIndicator";

const CourseModulesStyles = makeStyles((theme) => ({
  moduleTitleBar: {
    backgroundColor: "#F0F0F0",
  },
  moduleHeader: {
    display: "flex",
    alignItems: "center",
    marginLeft: 40,
  },
  moduleTitle: {
    fontSize: theme.typography.pxToRem(15),
    fontWeight: theme.typography.fontWeightRegular,
  },
  moduleBody: {
    backgroundColor: "#F5F5F5",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
    paddingTop: 10,
    paddingBottom: 35,
  },
  editTitleContainer: {
    position: "absolute",
    left: 55,
    top: -48,
  },
  deleteButtonContainer: {
    position: "relative",
    top: 20,
  },
  deleteModuleButton: {
    backgroundColor: "transparent",
    border: "none",
    outline: "none",
    fontSize: "16px",
    color: "silver",
    "&:hover": {
      cursor: "pointer",
      color: "#79c2d3",
    },
  },
}));

export default function CourseModules({
  userID,
  courseID,
  modules,
  courseInfo,
  setCourseInfo,
}) {
  const classes = CourseModulesStyles();

  const onDragEnd = async (result) => {
    const { destination, source } = result;

    if (!destination) return;

    const notReordered =
      destination.droppableId === source.droppableId &&
      destination.index === source.index;

    if (notReordered) return;

    if (source.droppableId === "droppableModule") {
      const reorderedModules = generateReorderedModules(source, destination);
      await updateCourseModuleOrder(courseID, reorderedModules);
      return;
    }

    var { currentModuleIndex, reorderedContent } =
      generateReorderedModuleContents(destination, source);

    await updateCourseModuleContentOrder(
      courseID,
      currentModuleIndex,
      reorderedContent
    );
  };

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="droppableModule" type="QUESTIONS">
          {(provided, snapshot) => (
            <div ref={provided.innerRef}>
              {modules?.map((module, moduleIndex) => (
                <Draggable
                  key={module.title}
                  draggableId={module.title}
                  index={moduleIndex}
                >
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.draggableProps}>
                      <Accordion key={moduleIndex}>
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          className={classes.moduleTitleBar}
                          aria-controls="module-title-bar"
                        >
                          <span {...provided.dragHandleProps}>
                            <DragIndicatorIcon
                              fontSize="large"
                              id="draggable-dialog-title"
                              style={{
                                backgroundColor: "none",
                                cursor: "move",
                                color: "rgba(0,0,0,0.2)",
                              }}
                            />
                          </span>
                          <Box className={classes.moduleHeader}>
                            {module.title === "" ? (
                              <Typography
                                color="textSecondary"
                                className={classes.moduleTitle}
                              >
                                (no title entered)
                              </Typography>
                            ) : (
                              <Typography className={classes.heading}>
                                {module.title}
                              </Typography>
                            )}
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails
                          className={classes.moduleBody}
                          style={{ position: "relative" }}
                        >
                          <Box className={classes.editTitleContainer}>
                            <EditModuleTitle
                              courseID={courseID}
                              modules={modules}
                              moduleIndex={moduleIndex}
                            />
                          </Box>
                          {modules[moduleIndex].content.length === 0 && (
                            <Box height={80} />
                          )}
                          <Droppable
                            droppableId={`droppable${module.title}`}
                            type={`${moduleIndex}`}
                          >
                            {(provided, snapshot) => (
                              <div ref={provided.innerRef}>
                                {modules[moduleIndex]?.content?.map(
                                  (item, index) => {
                                    return (
                                      <Draggable
                                        key={`${moduleIndex}${index}`}
                                        draggableId={`${moduleIndex}${index}`}
                                        index={index}
                                      >
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className="flex whitesmoke"
                                          >
                                            <DragIndicatorIcon
                                              fontSize="large"
                                              id="draggable-dialog-title"
                                              style={{
                                                backgroundColor: "none",
                                                cursor: "move",
                                                color: "rgba(0,0,0,0.2)",
                                                float: "left",
                                                margin: "auto",
                                              }}
                                            />
                                            <ContentCard
                                              key={`item${index}`}
                                              userID={userID}
                                              courseID={courseID}
                                              item={item}
                                              modules={modules}
                                              moduleIndex={moduleIndex}
                                              content={
                                                modules[moduleIndex].content
                                              }
                                              contentIndex={index}
                                            />
                                          </div>
                                        )}
                                      </Draggable>
                                    );
                                  }
                                )}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                          <AddModuleContent
                            userID={userID}
                            courseID={courseID}
                            modules={modules}
                            moduleIndex={moduleIndex}
                          />
                          <Box className={classes.deleteButtonContainer}>
                            <button
                              className={classes.deleteModuleButton}
                              onClick={() => {
                                deleteCourseModule(module, courseID);
                              }}
                            >
                              <Typography variant="subtitle2">
                                DELETE MODULE
                              </Typography>
                            </button>
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <Box display="flex" justifyContent="center">
        <AddModule courseID={courseID} />
      </Box>
    </>
  );

  function generateReorderedModules(source, destination) {
    const reorderedModules = [...modules];
    const [removed] = reorderedModules.splice(source.index, 1);
    reorderedModules.splice(destination.index, 0, removed);

    let courseInfoDNDAntiFlicker = JSON.parse(JSON.stringify(courseInfo));
    courseInfoDNDAntiFlicker.modules = reorderedModules;
    setCourseInfo(() => courseInfoDNDAntiFlicker);
    return reorderedModules;
  }

  function generateReorderedModuleContents(destination, source) {
    let currentModule = destination.droppableId.replace("droppable", "");
    let currentModuleIndex = modules.findIndex(
      (module) => module.title === currentModule
    );

    const reorderedContent = [...modules[currentModuleIndex].content];
    const [removed] = reorderedContent.splice(source.index, 1);
    reorderedContent.splice(destination.index, 0, removed);

    let courseInfoDNDAntiFlicker = JSON.parse(JSON.stringify(courseInfo));
    courseInfoDNDAntiFlicker.modules[currentModuleIndex].content =
      reorderedContent;
    setCourseInfo(() => courseInfoDNDAntiFlicker);
    return { currentModuleIndex, reorderedContent };
  }
}
