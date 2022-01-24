import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Typography,
} from "@material-ui/core";
import AddQuestionSet from "./AddQuestionSet.jsx";
import CreateFolderInQuestionSetCollection from "./CreateFolderInQuestionSetCollection.jsx";
import MyQuestionSets from "./MyQuestionSets.jsx";
import MyLibrary from "./MyLibrary.jsx";
import Libraries from "./Libraries.jsx";
import BrowseLibraries from "./BrowseLibraries.jsx";
import {
  deleteQuestionSet,
  addQuestionSetToFolder,
  removeQuestionSetFromFolder,
  updateQuestionSetFolderProperties,
} from "../../app/firestoreClient.js";
import firebase from "../../app/config/firebaseConfig.js";
import {
  capitalizeFirstLetter,
  artificialDelay,
} from "../../app/utils/utils.js";
import { TreeView, TreeItem } from "@material-ui/lab";
import {
  ChevronRight,
  Clear,
  ExpandMore,
  Folder,
  MenuBook,
} from "@material-ui/icons";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

export default function QuestionSubpage({
  userDisplayName,
  userEmail,
  userID,
  userPermissions,
}) {
  const [view, setView] = useState("");
  const [myQuestionSets, setMyQuestionSets] = useState([]);
  const [sharedWithMe, setSharedWithMe] = useState([]);
  const [selectedQuestionSet, setSelectedQuestionSet] = useState({});
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedTreeItemData, setSelectedTreeItemData] = useState({});
  const [selected, setSelected] = useState([]);
  const [permissionRequests, setPermissionRequests] = useState([]);

  const questionSets = [...myQuestionSets, ...sharedWithMe];
  const authorizedEditor = userPermissions?.includes("editQuestionLibraries");

  const deleteFolder = (folder) => {
    if (folder?.children) {
      folder.children.forEach((qSet) => {
        deleteQuestionSet(qSet.id, userID);
      });
    }
    deleteQuestionSet(folder.id, userID);
  };

  const handleClose = () => {
    setConfirmDeleteOpen(false);
  };

  const deleteSelectedTreeItem = () => {
    artificialDelay(500).then(() => {
      deleteTreeNode(selectedTreeItemData);
    });
    setSelectedTreeItemData({});
    setConfirmDeleteOpen(false);
  };

  const getTreeItemsFromData = (treeItems) => {
    return treeItems.map((treeItemData, index) => {
      let children = undefined;
      if (treeItemData.children && treeItemData.children?.length > 0) {
        children = getTreeItemsFromData(treeItemData.children);
      }
      return (
        <Draggable
          key={treeItemData.title}
          draggableId={treeItemData.id}
          index={index}
          style={{ paddingTop: "10px", paddingBottom: "10px" }}
        >
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
            >
              <TreeItem
                key={treeItemData.id}
                nodeId={treeItemData.id}
                label={
                  <div>
                    {treeItemData.title}
                    <IconButton style={{ float: "right", padding: "5px" }}>
                      <Clear
                        style={{
                          height: "15px",
                          width: "15px",
                          marginRight: "5px",
                        }}
                        onClick={() => {
                          setConfirmDeleteOpen(true);
                          setSelectedTreeItemData(treeItemData);
                        }}
                      />
                    </IconButton>
                  </div>
                }
                icon={treeItemData?.type === "Folder" ? <Folder /> : null}
                children={children}
                onClick={() => {
                  if (treeItemData?.type !== "Folder")
                    displayQuestionSetNew(treeItemData);
                }}
                style={{ paddingTop: "5px", marginTop: "5px" }}
              />
            </div>
          )}
        </Draggable>
      );
    });
  };

  function deleteTreeNode(treeItemData) {
    if (treeItemData?.type === "Folder") {
      deleteFolder(treeItemData);
      return;
    }
    treeItemData?.parentID
      ? removeQuestionSetFromFolder(treeItemData.id, treeItemData.parentID)
      : handleDeleteQuestionSet(
          myQuestionSets.find((qSet) => qSet.id === treeItemData.id)
        );
  }

  function onHover(event) {
    console.log("hover" + JSON.stringify(event));
  }

  function onDragEnd(result) {
    const { combine, destination, draggableId, source } = result;

    const notReordered =
      destination?.droppableId === source?.droppableId &&
      destination?.index === source?.index - 1;

    if (!destination && !combine) return;
    if (notReordered) return;

    // Prevent ability to add a folder to a folder
    if (
      myQuestionSets.find(
        (qSet) => qSet.id === draggableId && qSet?.type === "Folder"
      )
    ) {
      return;
    }

    // Check if Dropped into folder
    if (
      combine &&
      myQuestionSets.find(
        (qSet) => qSet?.type === "Folder" && qSet.id === combine.draggableId
      )
    ) {
      addQuestionSetToFolder(
        userID,
        draggableId,
        combine.draggableId,
        myQuestionSets.find((qSet) => qSet.id === draggableId).title
      );
      updateQuestionSetFolderProperties(
        userID,
        draggableId,
        true,
        combine.draggableId,
        myQuestionSets.find((qSet) => qSet.id === combine.draggableId).title
      );
      return;
    }

    //Moved to root, remove isChild status and parent props
    if (myQuestionSets.find((qSet) => qSet.id === draggableId)?.isChild) {
      removeQuestionSetFromFolder(
        userID,
        draggableId,
        myQuestionSets.find((qSet) => qSet.id === draggableId).parentID, //Folder ID
        myQuestionSets.find((qSet) => qSet.id === draggableId).title
      );
      updateQuestionSetFolderProperties(userID, draggableId, false);
      return;
    }
  }

  const handleSelect = (event, nodeIds) => {
    setSelected(nodeIds);
  };

  const DataTreeView = ({ treeItems }) => {
    return (
      <DragDropContext onDragEnd={onDragEnd} onDragUpdate={onHover}>
        <TreeView
          style={{ marginLeft: "10px" }}
          selected={selected}
          onNodeSelect={handleSelect}
          defaultCollapseIcon={<ExpandMore />}
          defaultExpandIcon={<ChevronRight />}
        >
          <Droppable droppableId="droppable" isCombineEnabled>
            {(provided, snapshot) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {getTreeItemsFromData(treeItems)}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </TreeView>
      </DragDropContext>
    );
  };

  function sortChildrenByTitle(doc) {
    return doc.data()?.children?.sort((a, b) => {
      let x = a.title.toLowerCase();
      let y = b.title.toLowerCase();
      if (x < y) {
        return -1;
      }
      if (x > y) {
        return 1;
      }
      return 0;
    });
  }

  function fetchMyQuestionSets() {
    const ref = firebase
      .firestore()
      .collection("user_questions")
      .doc(userID)
      .collection("my_question_sets")
      .orderBy("title");
    ref.onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      querySnapshot.forEach((doc) => {
        fetchedItems.push({
          id: doc.id,
          title: doc.data().title,
          questions: doc.data().questions,
          shared: false,
          parent: doc.data()?.parent,
          parentID: doc.data()?.parentID,
          parentTitle: doc.data()?.parentTitle,
          children: sortChildrenByTitle(doc),
          isChild: doc.data()?.isChild,
          type: doc.data()?.type,
        });
      });
      setMyQuestionSets((prevState) => fetchedItems);
    });
  }

  function fetchSharedQuestionSetRefs() {
    const sharedRef = firebase
      .firestore()
      .collection("user_questions")
      .doc(userID)
      .collection("shared_question_sets");
    sharedRef.onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      querySnapshot.forEach((doc) => {
        fetchedItems.push({
          id: doc.id,
          ...doc.data(),
          shared: true,
        });
      });
      setSharedWithMe((prevState) => fetchedItems);
    });
  }

  async function fetchSharedQuestionSet(questionSet) {
    const { ownerID, questionSetID } = questionSet;
    const ownerQSetRef = firebase
      .firestore()
      .collection("user_questions")
      .doc(ownerID)
      .collection("my_question_sets")
      .doc(questionSetID);
    const snapshot = await ownerQSetRef.get();
    setSelectedQuestionSet(() => ({ ...snapshot.data(), shared: true }));
  }

  function displayQuestionSetNew(questionSet) {
    const { shared } = questionSet;
    setView("my question sets");
    if (shared) fetchSharedQuestionSet(questionSet);
    if (!shared) setSelectedQuestionSet(questionSet);
  }

  function handleDeleteQuestionSet(questionSet) {
    if (questionSet.id === selectedQuestionSet.id) setSelectedQuestionSet(null);
    if (questionSet?.parentID) {
      removeQuestionSetFromFolder(
        userID,
        questionSet.id,
        questionSet.parentID,
        questionSet.title
      );
    }
    deleteQuestionSet(questionSet.id, userID);
  }

  async function fetchPermissionRequests() {
    // const fetchedItems = [];
    const ref = firebase.firestore().collection("permission_requests");

    ref.onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      querySnapshot.forEach((doc) => {
        fetchedItems.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setPermissionRequests((prevState) => fetchedItems);
    });
  }

  useEffect(() => {
    const unsubscribe = setSelectedQuestionSet(() =>
      selectedQuestionSet
        ? myQuestionSets.find((qSet) => qSet.id === selectedQuestionSet.id)
        : null
    );

    return unsubscribe;
    // eslint-disable-next-line
  }, [myQuestionSets]);

  useEffect(() => {
    const unsubscribe = fetchMyQuestionSets();
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const unsubscribe = fetchSharedQuestionSetRefs();
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  // useEffect(() => fetchPermissionRequests(), []);
  useEffect(() => {
    const unsubscribe = fetchPermissionRequests();
    return unsubscribe;
  }, []);

  return (
    <Box className="display-area flex-column">
      <QuestionSubpageHeader view={view} />
      {authorizedEditor && (
        <PendingRequests permissionRequests={permissionRequests} />
      )}

      {view === "my question sets" && selectedQuestionSet?.id && (
        <MyQuestionSets
          selectedQuestionSet={selectedQuestionSet}
          setSelectedQuestionSet={setSelectedQuestionSet}
          userID={userID}
          userPermissions={userPermissions}
        />
      )}
      {view === "my library" && <MyLibrary userID={userID} />}
      {view === "edit question libraries" && <Libraries />}

      <Box
        width="700px"
        style={{ marginTop: "20px", backgroundColor: "rgba(245,245,245,0.5)" }}
      >
        <Box className="flex-center-all padding-light">
          <AddQuestionSet userID={userID} />
          <VerticalSpacerLight />
          <CreateFolderInQuestionSetCollection userID={userID} />
          <VerticalSpacer />
          <Button
            type="button"
            onClick={() => setView("my library")}
            startIcon={<MenuBook />}
          >
            My Library
          </Button>
          <VerticalSpacerLight />
          {!authorizedEditor && (
            <BrowseLibraries
              permissionRequests={permissionRequests}
              userDisplayName={userDisplayName}
              userEmail={userEmail}
              userID={userID}
              userPermissions={userPermissions}
            />
          )}

          {authorizedEditor && (
            <Button
              type="button"
              onClick={() => setView("edit question libraries")}
              startIcon={<AppIcon />}
            >
              {process.env.REACT_APP_NAME} Library
            </Button>
          )}
          <Divider />
        </Box>

        <DataTreeView
          treeItems={questionSets.filter((qSet) => !qSet?.isChild)}
        />
      </Box>
      <ConfirmQuestionSetDelete
        selectedTreeItemData={selectedTreeItemData}
        confirmDeleteOpen={confirmDeleteOpen}
        handleClose={handleClose}
        deleteSelectedTreeItem={deleteSelectedTreeItem}
      />
    </Box>
  );
}

function ConfirmQuestionSetDelete({
  selectedTreeItemData,
  confirmDeleteOpen,
  handleClose,
  deleteSelectedTreeItem,
}) {
  return (
    <Dialog open={confirmDeleteOpen} onClose={handleClose}>
      <DialogTitle id="alert-dialog-title">{`Delete ${
        selectedTreeItemData.type ? selectedTreeItemData.type : "Question Set"
      }`}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {selectedTreeItemData.type
            ? "This will delete the folder and all question sets within it.  "
            : "This will delete the question set.  "}
          Are you sure you want to continue?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={deleteSelectedTreeItem}
          color="warning"
          variant="contained"
          style={{ backgroundColor: "rgb(211, 47, 47)", color: "white" }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const AppIcon = () => (
  <img
    src={process.env.REACT_APP_LIBRARY_IMAGE}
    style={{
      width: "18px",
      verticalAlign: "bottom",
    }}
    alt="library"
  />
);

const VerticalSpacer = () => (
  <Typography
    display="inline"
    style={{ marginLeft: "25px", marginRight: "25px" }}
  >
    |
  </Typography>
);

const VerticalSpacerLight = () => (
  <Typography
    display="inline"
    style={{ marginLeft: "5px", marginRight: "5px", color: "lightgrey" }}
  >
    |
  </Typography>
);

function QuestionSubpageHeader({ view }) {
  return (
    <Box className="subpage-header">
      <Typography variant="h3" color="primary">
        {getHeaderText(view)}
      </Typography>
    </Box>
  );
}

function PendingRequests({ permissionRequests }) {
  const [viewOpen, setViewOpen] = useState(false);
  if (permissionRequests.length === 0) return null;

  if (!viewOpen)
    return (
      <Box className="flex-align-center padding-medium">
        <Typography style={{ marginRight: "10px" }}>
          {permissionRequests.length} pending library access{" "}
          {permissionRequests.length > 1 ? "requests" : "request"}
        </Typography>
        <Button variant="contained" onClick={() => setViewOpen(true)}>
          View
        </Button>
      </Box>
    );

  return (
    permissionRequests.length > 0 &&
    permissionRequests.map((request) => (
      <Box style={{ marginLeft: "10px" }}>
        <Typography variant="h6">
          {request?.userDisplayName} has requested access to{" "}
          {request?.libraryTitle} (ID: {request.libraryID})
        </Typography>

        <Typography>
          <em>request details</em>
        </Typography>
        <Typography>user email: {request?.userEmail}</Typography>
        <Typography>user id: {request?.userID}</Typography>
        <Typography>institution: {request?.institution}</Typography>
        <Typography>institution email: {request?.institutionEmail}</Typography>
        <Typography>
          requested:{" "}
          {new Date(request?.requested?.seconds * 1000)?.toLocaleString()}
        </Typography>
        <Box width="200px" style={{ marginTop: "5px", marginBottom: "20px" }}>
          <Button
            onClick={() => grantLibraryPermission(request)}
            variant="contained"
            fullWidth
          >
            Grant Access
          </Button>
        </Box>
      </Box>
    ))
  );
}

async function grantLibraryPermission(request) {
  const userID = request?.userID;
  const libraryID = request?.libraryID;
  console.log("hello");
  await firebase
    .firestore()
    .collection("users")
    .doc(userID)
    .update({
      permissions: firebase.firestore.FieldValue.arrayUnion(libraryID),
    })
    .then(() => deleteFulfilledPermissionRequest(request));
}

async function deleteFulfilledPermissionRequest(request) {
  await firebase
    .firestore()
    .collection("permission_requests")
    .doc(request.id)
    .delete();
}

function getHeaderText(view) {
  if (!view) return "Questions";
  switch (view) {
    case "my question sets":
      return "Question Set";
    case "my library":
      return "My Library";
    case "browse question libraries":
      return "Community Libraries";
    case "edit question libraries":
      return `${capitalizeFirstLetter(process.env.REACT_APP_NAME)} Libraries`;
    default:
      return "no header";
  }
}
