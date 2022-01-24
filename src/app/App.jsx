import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import WelcomePage from "../components/WelcomePage.jsx";
import MyClassroomPage from "../components/my_classroom/MyClassroomPage.jsx";
import MyContentPage from "../components/my_content/MyContentPage.jsx";
import MyProfilePage from "../components/my_profile/MyProfilePage.jsx";
import StudentCourseView from "../components/my_classroom/StudentCourseView.jsx";
import InstructorCourseView from "../components/my_classroom/InstructorCourseView.jsx";
import AccessRestricted from "../components/AccessRestricted.jsx";
import { AuthProvider } from "./contexts/AuthContext.js";
import PrivateRoute from "./PrivateRoute.js";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Switch>
          <Route path="/" exact component={WelcomePage} />
          <PrivateRoute path="/classroom" exact component={MyClassroomPage} />
          <PrivateRoute
            path="/classroom/courses/:courseID"
            exact
            component={StudentCourseView}
          />
          <PrivateRoute
            path="/classroom/courses/:courseID/dashboard"
            exact
            component={InstructorCourseView}
          />
          <PrivateRoute path="/content" exact component={MyContentPage} />
          <PrivateRoute path="/my_profile" exact component={MyProfilePage} />
          <Route path="/access_restricted" component={AccessRestricted} />
        </Switch>
      </AuthProvider>
    </Router>
  );
}

export default App;
