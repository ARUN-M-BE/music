import React, { useEffect, useState } from "react";
import "./styles/App.css";
import { Route, Routes } from "react-router-dom";
import { About, Contact, Dashboard, Home, Login, Musics } from "./components";
import { app } from "./config/firebase.config";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { validateUser } from "../api";
import { useStateValue } from "./context/stateProvider";
import { actionType } from "./context/reducer";
import MusicPlayer from "./components/MusicPlayer";
import { motion } from "framer-motion";


const App = () => {
  const firebaseAuth = getAuth(app);
  const provider = new GoogleAuthProvider();
  const navigate = useNavigate();
  const [{ user, songPlayer }, dispatch] = useStateValue();

  const [auth, setAuth] = useState(
    window.localStorage.getItem("auth") === "true"
  );

  useEffect(() => {
    firebaseAuth.onAuthStateChanged((userCred) => {
      if (userCred) {
        userCred.getIdToken().then((token) => {
          validateUser(token).then((data) => {
            dispatch({
              type: actionType.SET_USER,
              user: data,
            });
          });
        });
        navigate( "/", { replace: true });
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
      <AnimatePresence mode="wait">
        <div className="bg-primary h-auto min-w-[680px] justify-center flex items-center dark:bg-gray-900 dark:text-white">
          <Routes>
            <Route path="/*" element={<Home />} />
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="/Contact" element={<Contact />} />
            <Route path="/About" element={<About />} />
            <Route path="/Musics" element={<Musics />} />
            <Route path="/login" element={<Login setAuth={setAuth} />} />
          </Routes>

          {/* {songPlayer && ( */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className={`fixed min-w-[700px] h-30 inset-x-0 bottom-0 z-50 bg-primary dark:bg-gray-800 dark:text-white flex items-center justify-center `}
            >
              <MusicPlayer />
            </motion.div>
          {/* )} */}
        </div>
      </AnimatePresence>
    </>
  );
};


export default App;
