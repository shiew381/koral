import React, { useState, useEffect } from "react";
import { Box } from "@material-ui/core";
import { ThemeProvider } from "@material-ui/core/styles";
import { Drawer } from "@material-ui/core";
import { List, ListItem, ListItemText } from "@material-ui/core";
import MainNavBar from "../MainNavBar.jsx";
import CoursesSubpage from "./CoursesSubpage.jsx";
import { useAuth } from "../../app/contexts/AuthContext.js";
import QuestionsSubpage from "./QuestionsSubpage.jsx";
import LinksSubpage from "./LinksSubpage.jsx";
import DocumentsSubpage from "./DocumentsSubpage.jsx";
import firebase from "../../app/config/firebaseConfig.js";
import { initializeUser } from "../../app/initializeUser.js";
import { MyClassroomTheme } from "../../themes.js";

export default function MyClassroomPage() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const subpages = ["Courses", "Questions", "Documents", "Links"];
  const subpage = subpages[selectedIndex];
  const handleListItemClick = (event, index) => {
    setSelectedIndex(index);
  };

  const { currentUser, updateDisplayName } = useAuth();

  async function checkUserInitialization() {
    const userRef = firebase.firestore().collection("users");
    try {
      const fetchedUserInfo = await userRef
        .where("userID", "==", currentUser.uid)
        .get();
      if (fetchedUserInfo.empty) {
        console.log("Setting up user account...");

        await initializeUser(currentUser, updateDisplayName);

        console.log("Success! User account has been set up!");
      } else {
        console.log("User account already set up");
      }
    } catch (error) {
      console.log("there was an error initializing the user");
      console.log(error.message);
    }
  }

  useEffect(() => {
    const unsubscribe = checkUserInitialization();
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  return (
    <ThemeProvider theme={MyClassroomTheme}>
      <div className="page-background my-classroom-background">
        <MainNavBar />
        <Drawer variant="permanent">
          <List style={{ width: "160px" }} component="nav">
            <Box className="side-nav-spacer" />

            <ListItem>
              <ListItemText primary="MY CLASSROOM" />
            </ListItem>
            {subpages.map((subpage, index) => (
              <ListItem
                button
                key={`myClassroom${subpage}`}
                selected={selectedIndex === index}
                style={
                  selectedIndex === index
                    ? { backgroundColor: "#E2F3F7" }
                    : null
                }
                onClick={(event) => handleListItemClick(event, index)}
              >
                <ListItemText
                  style={{ paddingLeft: "35px" }}
                  inset
                  primary={subpage}
                />
              </ListItem>
            ))}
          </List>
        </Drawer>
        {subpage === "" && (
          <CoursesSubpage
            subpage={subpage}
            userID={currentUser.uid}
            userDisplayName={currentUser.displayName}
            userEmail={currentUser.email}
          />
        )}
        {subpage === "Courses" && (
          <CoursesSubpage
            subpage={subpage}
            userID={currentUser.uid}
            userDisplayName={currentUser.displayName}
            userEmail={currentUser.email}
          />
        )}
        {subpage === "Questions" && (
          <QuestionsSubpage userID={currentUser.uid} />
        )}
        {subpage === "Documents" && (
          <DocumentsSubpage userID={currentUser.uid} />
        )}
        {subpage === "Links" && <LinksSubpage userID={currentUser.uid} />}
      </div>
    </ThemeProvider>
  );
}
