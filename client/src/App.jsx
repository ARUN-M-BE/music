import React, { useEffect, useState } from "react";
import "./App.css";
import { Route, Routes } from "react-router-dom";
import { Dashboard ,Home, Login } from "./components";
import { app } from "./config/firebase.config";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { validateUser } from "../api";
import { useStateValue } from "./context/stateProvider";
import { actionType } from "./context/reducer";

const App = () => {
  const firebaseAuth = getAuth(app);
  const provider = new GoogleAuthProvider();
  const navigate = useNavigate();
  const [{ user }, dispatch] = useStateValue();

  const { auth, setAuth } = useState(
    false || window.localStorage.getItem("auth") === true
  );
  useEffect(() => {
    firebaseAuth.onAuthStateChanged((userCerd) => {
      if (userCerd) {
        userCerd.getIdToken().then((token) => {
          // console.log(token);
          // window.localStorage.setItem("token", token);
          validateUser(token).then((data) => {
            dispatch({
              type: actionType.SET_USER,
              user: data,
            });
          });
        });
        navigate("/", { replace: true });
      } else {
        setAuth(false);
        window.localStorage.setItem("auth", "false");
        dispatch({
          type: actionType.SET_USER,
          user: null,
        });
        navigate("/login");
      }
    });
  }, []);
  return (
    <>
      <AnimatePresence exitBeforeEnter>
        <div className="bg-primary h-auto min-w-[680px] justify-center flex items-center">
          <Routes>
            <Route path="/*" element={<Home />} />
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="/login" element={<Login setAuth={setAuth} />} />
          </Routes>
        </div>
      </AnimatePresence>
    </>
  );
};

export default App;
