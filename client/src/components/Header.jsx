import React, { useState } from "react";
import { Logo } from "../assets/image";
import { useNavigate, NavLink } from "react-router-dom";
import { isNotActiveStyle, isActiveStyle } from "../utils/style";
import { FaCrown } from "react-icons/fa";
import { useStateValue } from "../context/stateProvider";
import { app } from "../config/firebase.config";
import { getAuth } from "firebase/auth";
import { motion } from "framer-motion";

const HeaderSection = () => {
  const [{ user }, dispatch] = useStateValue();
  const navigate = useNavigate();
  const [isMenu, setisMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const logOut = () => {
    const firebaseAuth = getAuth(app);
    firebaseAuth
      .signOut()
      .then(() => {
        window.localStorage.setItem("auth", "false");
      })
      .catch((e) => console.log(e));
    navigate("/login", { replace: true });
  };

  return (
    <header className="fixed top-0 z-50 flex flex-wrap items-center justify-between w-full px-4 py-5 tracking-wide bg-dark shadow-md bg-opacity-90 backdrop-blur-md transition-all duration-200 ease-in-out dark:bg-gray-900 dark:text-white md:py-2 md:px-6 lg:px-14">
      {/* Left nav */}
      <div className="flex items-center">
        <NavLink to="/" className="text-3xl tracking-wide">
          <img src={Logo} alt="Logo" className="w-16" />
        </NavLink>
      </div>

      {/* Mobile menu button */}
      <div className="block lg:hidden">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-black dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {mobileMenuOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`lg:hidden w-full fixed left-0 bg-gray-600 bg-opacity-95 backdrop-blur-lg transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? "top-20 h-[calc(100vh-5rem)]" : "top-[-100vh] h-0"
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto px-6 py-4">
          {/* Main Navigation */}
          <div className="space-y-4">
            <NavLink
              to="/home"
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg text-lg font-medium ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-gray-200 hover:bg-gray-800"
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </NavLink>
            <NavLink
              to="/Musics"
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg text-lg font-medium ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-gray-200 hover:bg-gray-800"
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              Musics
            </NavLink>
            {/* <NavLink
              to="/Premium"
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg text-lg font-medium ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-gray-200 hover:bg-gray-800"
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              Premium
            </NavLink> */}
            <NavLink
              to="/Contact"
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg text-lg font-medium ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-gray-200 hover:bg-gray-800"
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </NavLink>
            <NavLink
              to="/About"
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg text-lg font-medium ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-gray-200 hover:bg-gray-800"
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </NavLink>
          </div>

          {/* User Section */}
          {user ? (
            <div className="mt-8 pt-6 border-t border-gray-700">
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={user?.user?.imageURL}
                  className="w-12 h-12 min-w-[44px] object-cover rounded-full shadow-lg"
                  alt="profile"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <p className="text-lg font-semibold text-white">
                    {user?.user?.name}
                  </p>
                  <p className="flex items-center gap-1 text-sm text-yellow-400">
                    <FaCrown className="text-sm" /> Premium Member
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <NavLink
                  to="/Profile"
                  className="block px-4 py-3 text-lg font-medium text-gray-200 hover:bg-gray-800 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </NavLink>
                <NavLink
                  to="/favorites"
                  className="block px-4 py-3 text-lg font-medium text-gray-200 hover:bg-gray-800 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Favorites
                </NavLink>
                {user?.user?.role === "admin" && "superadmin" && (
                  <NavLink
                    to="/dashboard/home"
                    className="block px-4 py-3 text-lg font-medium text-gray-200 hover:bg-gray-800 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </NavLink>
                )}
                <button
                  onClick={() => {
                    logOut();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full px-4 py-3 text-lg font-medium text-left text-red-400 hover:bg-gray-800 rounded-lg"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-8 pt-6 border-t border-gray-700"></div>
          )}
        </div>
      </div>

      {/* Desktop menu */}
      <div className="hidden w-full lg:flex lg:items-center lg:w-auto">
        <div className="items-center flex-1 pt-6 justify-center text-lg lg:pt-0 list-reset lg:flex">
          <div className="mr-3">
            <NavLink
              to="/home"
              className={({ isActive }) =>
                `inline-block px-4 py-2 ${
                  isActive ? isActiveStyle : isNotActiveStyle
                }`
              }
            >
              Home
            </NavLink>
          </div>

          <div className="mr-3">
            <NavLink
              to="/Musics"
              className={({ isActive }) =>
                `inline-block px-4 py-2 ${
                  isActive ? isActiveStyle : isNotActiveStyle
                }`
              }
            >
              Musics
            </NavLink>
          </div>

          <div className="mr-3">
            <NavLink
              to="/About"
              className={({ isActive }) =>
                `inline-block px-4 py-2 ${
                  isActive ? isActiveStyle : isNotActiveStyle
                }`
              }
            >
              About
            </NavLink>
          </div>
          <div className="mr-3">
            <NavLink
              to="/Contact"
              className={({ isActive }) =>
                `inline-block px-4 py-2 ${
                  isActive ? isActiveStyle : isNotActiveStyle
                }`
              }
            >
              Contact
            </NavLink>
          </div>

          {/* Dropdown */}
          {/* <div
            className="relative inline-block"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <button
              className={`flex items-center p-2 rounded-md ${
                dropdownOpen
                  ? "text-headingColor"
                  : "text-textColor hover:text-headingColor"
              }`}
            >
              <span className="mr-4">More</span>
              <span
                className={`transition-transform duration-500 transform ${
                  dropdownOpen ? "-rotate-180" : ""
                }`}
              >
                <svg
                  className="w-4 h-4 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </span>
            </button>
          </div> */}
          {/* {isMenu && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 py-1 bg-white rounded-lg shadow-xl min-w-max dark:bg-gray-700"
            >
              <NavLink
                to="/Contact"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Contact
              </NavLink>
              <NavLink
                to="/about"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                About
              </NavLink>
              {user?.user?.role === "admin" && "superadmin" && (
                <NavLink
                  to="/dashboard/home"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Dashboard
                </NavLink>
              )}
              <hr className="border-gray-600" />
              <p
                className="text-base text-textColor hover:font-semibold duration-150 transition-all ease-in-out"
                onClick={logOut}
              >
                Sign Out
              </p>
            </motion.div>
          )} */}
        </div>
      </div>

      {/* Desktop User section */}
      {user ? (
        <div className="hidden lg:flex items-center ml-auto cursor-pointer gap-2 relative"
        onMouseEnter={() => setisMenu(true)}
            onMouseLeave={() => setisMenu(false)}>
          <img
            src={user?.user?.imageURL}
            className="w-12 h-12 min-w-[44px] object-cover rounded-full shadow-lg"
            alt="profile"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col">
            <p className="text-textColor text-lg hover:text-headingColor font-semibold">
              {user?.user?.name}
            </p>
            <p className="flex items-center gap-2 text-xs text-textColor font-normal">
              Premium Member.{" "}
              <FaCrown className="text-sm -ml-1 text-yellow-500" />
            </p>
          </div>
          
          {isMenu && (
            <motion.div
              onMouseEnter={() => setisMenu(true)}
              onMouseLeave={() => setisMenu(false)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute z-10 top-14 p-3 right-0 w-50 gap-2 bg-blue-100 shadow-lg rounded-lg backdrop-blur-sm flex flex-col dark:bg-gray-700 dark:text-white"
            >
              <NavLink to="/Profile">
                <p className="text-base text-textColor hover:font-semibold duration-150 transition-all ease-in-out">
                  Profile
                </p>
              </NavLink>
              <p className="text-base text-textColor hover:font-semibold duration-150 transition-all ease-in-out">
                My Favorites
              </p>
              
              {user?.user?.role === "admin" && "superadmin" && (
                <NavLink to="/dashboard/home">
                  <p className="text-base text-textColor hover:font-semibold duration-150 transition-all ease-in-out">
                    Dashboard
                  </p>
                </NavLink>
              )}
              <hr className="border-gray-600" />
              <p
                className="text-base text-textColor hover:font-semibold duration-150 transition-all ease-in-out"
                onClick={logOut}
              >
                Sign Out
              </p>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="hidden lg:flex items-center gap-4"></div>
      )}
    </header>
  );
};

export default HeaderSection;
