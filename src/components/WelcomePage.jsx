import React from "react";
import { Box } from "@material-ui/core";
import { ThemeProvider } from "@material-ui/core/styles";
import Login from "./user_authentication/login.jsx";

const { WelcomeTheme } = require("../themes.js");

export default function WelcomePage() {
  return (
    <ThemeProvider theme={WelcomeTheme}>
      <Box className="full-height full-width whitesmoke">
        <Box className="flex-center-all full-height column">
          <Box>
            <img
              width="280"
              src={process.env.REACT_APP_LOGO}
              alt={process.env.REACT_APP_NAME + " logo"}
            />
          </Box>
          <Box>
            <Login />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
