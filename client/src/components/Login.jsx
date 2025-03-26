import React from "react";
import { FcGoogle } from "react-icons/fc";
import { app } from "../config/firebase.config";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useStateValue } from "../context/stateProvider";
import { actionType } from "../context/reducer";
import { Bg } from "../assets/others";

const Login = ({ setAuth }) => {
  const firebaseAuth = getAuth(app);
  const provider = new GoogleAuthProvider();
  const navigate = useNavigate();
  const [{user}, dispatch] = useStateValue();

  const loginWithGoogle = async () => {
    await signInWithPopup(firebaseAuth, provider).then((userCred) => {
      if (userCred) {
        setAuth(true);
        window.localStorage.setItem("auth", "true");

        firebaseAuth.onAuthStateChanged((userCerd) => {
          if (userCerd) {
            userCerd.getIdToken().then((token) => {
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
            dispatch({
              type: actionType.SET_USER,
              user: null,
            });
            navigate("/login");
          }
        });
      }
    });
  };

  return (
    <div className="relative w-screen h-screen flex items-center justify-center">
      <video src={Bg}
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
