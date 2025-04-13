import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import ReactDOM from 'react-dom/client'
import App from "./App";
// import ErrorBoundary from "./ErrorBoundary";
import { StateProvider } from "./context/StateProvider.jsx";
import { initialState } from "./context/InitialState";
import reducer from "./context/reducer";

// import "./index.css";

// const container = document.getElementById("root");
// const root = createRoot(container);

ReactDOM.createRoot(document.getElementById('root')).render(
   <React.StrictMode>
    <Router>
      <StateProvider initialState={initialState} reducer={reducer}>
        <App />
      </StateProvider>
    </Router>
  </React.StrictMode> 
);
