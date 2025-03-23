import React from "react";
import { FcGoogle } from "react-icons/fc";
import { app } from "../config/firebase.config";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Login = ({ setAuth }) => {
  const firebaseAuth = getAuth(app);
  const provider = new GoogleAuthProvider();
  const navigate = useNavigate();

  const loginWithGoogle = async () => {
    await signInWithPopup(firebaseAuth, provider).then((userCred) => {
      if (userCred) {
        setAuth(true);
        window.localStorage.setItem("auth", true);

        navigate("/", { replace: true });

        firebaseAuth.onAuthStateChanged((user) => {
          if (user) {
            user.getIdToken().then((token) => {
              window.localStorage.setItem("token", token);
            });
          } else {
            setAuth(false);
            window.localStorage.setItem("auth", false);
            navigate("/login");
          }
        });
      }
    });
  };

  return (
    <div className="relative w-screen h-screen flex items-center justify-center">
      <div className="absolute inset-0 bg-darkOverlay flex items-center justify-center p-4">
        <div className="w-full md:w-[375px] p-6 bg-lightOverlay shadow-2xl rounded-md backdrop-blur-md flex flex-col items-center justify-center">
          <button
            className="flex items-center justify-center gap-3 px-5 py-3 rounded-md bg-cardOverlay cursor-pointer hover:bg-card hover:shadow-lg transition-all duration-200 ease-in-out"
            onClick={loginWithGoogle}
          >
            <FcGoogle className="text-3xl" />
            <span className="text-lg font-semibold text-dark">
              Login with Google
            </span>
          </button>
          <p className="text-dark text-center mt-3">or</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
