import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";
// import ErrorBoundary from "./ErrorBoundary";
import { StateProvider } from "./context/stateProvider";
import { initialState } from "./context/InitialState";
import reducer from "./context/reducer";
// import "./index.css";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
   <React.StrictMode>
   {/* //  <ErrorBoundary> 
     <BrowserRouter>  */}
    <Router>
      <StateProvider initialState={initialState} reducer={reducer}>
        <App />
      </StateProvider>
    </Router>
    {/* </BrowserRouter>
    // </ErrorBoundary>*/}
  </React.StrictMode> 
);
