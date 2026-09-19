import React from "react";
import { FcGoogle } from "react-icons/fc";
import { app } from "../config/firebase.config";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useStateValue } from "../context/stateProvider";
import { actionType } from "../context/reducer";
import { validateUser } from "../../api";
import { Bg } from "../assets/others";

const Login = ({ setAuth }) => {
  const firebaseAuth = getAuth(app);
  const provider = new GoogleAuthProvider();
  const navigate = useNavigate();
  const [{ user }, dispatch] = useStateValue();

  const loginWithGoogle = async () => {
    try {
      const userCred = await signInWithPopup(firebaseAuth, provider);
      if (userCred) {
        setAuth(true);
        window.localStorage.setItem("auth", "true");

        const token = await userCred.user.getIdToken();
        const data = await validateUser(token);
        
        dispatch({
          type: actionType.SET_USER,
          user: data?.user || data,
        });

        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      setAuth(false);
      window.localStorage.setItem("auth", "false");
      dispatch({
        type: actionType.SET_USER,
        user: null,
      });
    }
  };

  return (
    <div className="relative w-screen h-screen flex items-center justify-center">
      <video
        src={Bg}
        type="video/mp4"
        autoPlay
        muted
        loop
        className="w-full h-full object-cover"
      />
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
        </div>
      </div>
    </div>
  );
};

export default Login;
