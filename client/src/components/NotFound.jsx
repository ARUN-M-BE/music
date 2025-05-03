import React, { useEffect } from "react";
import { useStateValue } from "../context/stateProvider";
import { useNavigate } from "react-router-dom";
import { app } from "../config/firebase.config";
import { getAuth, sendEmailVerification } from "firebase/auth";

const NotFound = () => {
  const navigate = useNavigate();
  const [{ user }] = useStateValue();

  useEffect(() => {
    if (user) {
      if (user?.user?.email_verified === true) {
        navigate("/");
      }
    }
  }, [navigate, user]);

  const handleSignOut = async () => {
    try {
      const firebaseAuth = getAuth(app);
      firebaseAuth
        .signOut()
        .then(() => {
          window.localStorage.setItem("auth", "false");
        })
        .catch((e) => console.log(e));
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {/* <h1 className="text-4xl font-bold text-red-500">404</h1> */}
      {/* <h2>Email Not Verified</h2>
      <p className="text-xl mt-4">
        Please verify your email to access this page
      </p> */}
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/50 mb-4">
            <svg
              className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Awaiting Email Verification
          </h2>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This process might take a few minutes.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              Still waiting?
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              If you don't receive the email within 15 minutes, please:
            </p>
            <ol className="list-decimal list-inside text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1 text-left pl-4">
              <li>Check your spam/junk folder</li>
              <li>Ensure you entered the correct email address</li>
              <li>Contact our support team</li>
            </ol>
          </div>

          <div className="flex flex-col space-y-3">
            <button
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              onClick={() => {
                // Resend verification logic
                sendEmailVerification(auth.currentUser);
              }}
            >
              Verification
            </button>

            <button
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
              onClick={() => {
                // Open chat bot logic
                window.open("https://your-support-url.com/chat", "_blank");
              }}
            >
              Contact Admin Support
            </button>

            <button
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
              onClick={handleSignOut}
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
