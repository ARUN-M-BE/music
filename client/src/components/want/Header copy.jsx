import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaCrown } from "react-icons/fa";
import { motion } from "framer-motion";
import { getAuth } from "firebase/auth";
import { useStateValue } from "../context/stateProvider";
import { app } from "../config/firebase.config";
import {Logo} from "../assets/image"; // Update this path if needed

const Header = () => {
  const [{ user }] = useStateValue();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const logOut = () => {
    const firebaseAuth = getAuth(app);
    firebaseAuth
      .signOut()
      .then(() => {
        window.localStorage.setItem("auth", "false");
        navigate("/login", { replace: true });
      })
      .catch((e) => console.error(e));
  };

  return (
    <>
    <header className="bg-white border-gray-200 dark:bg-gray-900 shadow-md">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        {/* Logo */}
        <NavLink to="/" className="flex items-center space-x-3">
          <img src={Logo} className="h-8" alt="Logo" />
        </NavLink>

        {/* User Profile */}
        <div className="flex items-center md:order-2 space-x-3 md:space-x-0 relative">
          <button
            type="button"
            className="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="sr-only">Open user menu</span>
            <img
              className="w-8 h-8 rounded-full object-cover"
              src={user?.user?.imageURL || "/path-to-default-image.jpg"}
              alt="User"
              referrerPolicy="no-referrer"
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute z-50 right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-md"
            >
              <div className="px-4 py-3">
                <span className="block text-sm text-gray-900 dark:text-white">
                  {user?.user?.name || "Guest"}
                </span>
                <span className="block text-sm text-gray-500 dark:text-gray-400 items-center">
                  Premium Member <FaCrown className="text-sm ml-1 text-yellow-500" />
                </span>
              </div>
              <ul className="py-2">
                {user?.user?.role === "admin" && (
                  <li>
                    <NavLink
                      to="/dashboard/home"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      Dashboard
                    </NavLink>
                  </li>
                )}
                <li>
                  <NavLink
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Profile
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/favorites"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    My Favourites
                  </NavLink>
                </li>
                <li>
                  <button
                    onClick={logOut}
                    className="block w-full text-left px-4 py-2 text-sm text-red-500 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Sign Out
                  </button>
                </li>
              </ul>
            </motion.div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
          >
            <span className="sr-only">Open main menu</span>
            <svg
              className="w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 17 14"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M1 1h15M1 7h15M1 13h15"
              />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <div
          className={`${
            isMenuOpen ? "block" : "hidden"
          } items-center justify-between w-full md:flex md:w-auto md:order-1`}
        >
          <ul className="flex flex-col font-medium p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 md:flex-row md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 dark:border-gray-700">
            <li>
              <NavLink to="/home" className="text-gray-700 dark:text-gray-200">
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/Musics" className="text-gray-700 dark:text-gray-200">
                Musics
              </NavLink>
            </li>
            <li>
              <NavLink to="/Premium" className="text-gray-700 dark:text-gray-200">
                Premium
              </NavLink>
            </li>
            <li>
              <NavLink to="/Contact" className="text-gray-700 dark:text-gray-200">
                Contact
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </header>
    </>
  );
};

export default Header;

