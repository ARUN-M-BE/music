import React from "react";
import { createRoot } from "react-dom/client";
import ReactDOM from "react-dom";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";
// import ErrorBoundary from "./ErrorBoundary";
import "./index.css";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <React.StrictMode>
    {/* <ErrorBoundary> */}
      <Router>
        <App />
      </Router>
    {/* </ErrorBoundary> */}
  </React.StrictMode>
);
