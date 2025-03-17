import React from "react";
import { auth, googleProvider } from "./firebaseConfig";
import { signInWithPopup, signOut } from "firebase/auth";

const Auth = ({ user, setUser }) => {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setUser(null);
  };

  return (
    <div className="flex justify-between p-4 bg-gray-200">
      {user ? (
        <>
          <p>Welcome, {user.displayName}</p>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">
            Logout
          </button>
        </>
      ) : (
        <button onClick={handleLogin} className="bg-green-500 text-white px-4 py-2 rounded">
          Login with Google
        </button>
      )}
    </div>
  );
};

export default Auth;
