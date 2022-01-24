import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import WelcomePage from "../components/WelcomePage.jsx";
import { AuthProvider } from "./contexts/AuthContext.js";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Switch>
          <Route path="/" exact component={WelcomePage} />
          {/* <PrivateRoute path="/classroom" exact component={MyClassroomPage} /> */}
          {/* <PrivateRoute
            path="/classroom/courses/:courseID"
            exact
            component={StudentCourseView}
          /> */}
          {/* <PrivateRoute
            path="/classroom/courses/:courseID/dashboard"
            exact
            component={InstructorCourseView}
          /> */}
          {/* <PrivateRoute path="/content" exact component={MyContentPage} /> */}
          {/* <PrivateRoute path="/community" exact component={CommunityPage} /> */}
          {/* <PrivateRoute path="/shop" exact component={ShopPage} /> */}
          {/* <PrivateRoute path="/my_profile" exact component={MyProfilePage} /> */}
          {/* <Route path="/access_restricted" component={AccessRestricted} /> */}
          {/* <Route path="/emailer" component={Emailer} /> */}
        </Switch>
      </AuthProvider>
    </Router>
  );
}
