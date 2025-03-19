import React, { useEffect, useState } from "react";
import "./App.css";
import { Route, Routes } from "react-router-dom";
import { Home, Login } from "./components";
import { app } from "./config/firebase.config";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const App = () => {

  const firebaseAuth = getAuth(app);
  const provider = new GoogleAuthProvider();
  const navigate = useNavigate();

  const { auth, setAuth } = useState(
    false || window.localStorage.getItem("auth") === true
  );
  useEffect(() => {
      firebaseAuth.onAuthStateChanged((userCerd) => {
        if (userCerd) {
          userCerd.getIdToken().then((token) => {
            window.localStorage.setItem("token", token);
          });
          navigate("/", { replace: true }); 
        } else {
          setAuth(false);
          window.localStorage.setItem("auth", "false");
          navigate("/login");
        }
      });
  }, []);
  return (
    <>
      <div className="bg-primary w-screen h-screen justify-center flex items-center">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login setAuth={setAuth}/>} />
        </Routes>
      </div>

      <h1 class="text-3xl font-bold underline">Hello world!</h1>
    </>
  );
};

export default App;
