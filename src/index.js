import React from "react";
import ReactDOM from "react-dom";
import App from "./app/App.jsx";
// import "katex/dist/katex.min.css";
// import "./css/suneditor.css";
// import "./css/styles.css";

// if (process.env.REACT_APP_PRODUCT === "koi") {
//   require("./css/styles-koi.css");
// } else {
//   require("./css/styles-koral.css");
// }

const rootElement = document.getElementById("root");

ReactDOM.render(<App />, rootElement);
