import React, { useState } from "react";
import { Logo } from "../assets/image";
import { useNavigate, NavLink } from "react-router-dom";
import { isNotActiveStyle, isActiveStyle } from "../utils/style";
import { FaCrown } from "react-icons/fa";
import { useStateValue } from "../context/stateProvider";
import { app } from "../config/firebase.config";
import { getAuth } from "firebase/auth";
import { motion } from "framer-motion";

const Header = () => {
  const [{ user }] = useStateValue();
  const navigate = useNavigate();
  const [isMenu, setIsMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const logOut = () => {
    const firebaseAuth = getAuth(app);
    firebaseAuth
      .signOut()
      .then(() => {
        window.localStorage.setItem("auth", "false");
      })
      .catch((e) => console.error("Sign out error:", e));
    navigate("/login", { replace: true });
  };

  const isRoleAuthorized =
    user?.user?.role === "admin" ||
    user?.user?.role === "superadmin" ||
    user?.user?.role === "member";

  return (
    <header className="fixed top-0 z-50 flex flex-wrap items-center justify-between w-full px-4 py-3 tracking-wide bg-dark shadow-md bg-opacity-90 backdrop-blur-md transition-all duration-200 ease-in-out dark:bg-gray-900 dark:text-white md:py-2 md:px-6 lg:px-14">
      {/* Brand Logo */}
      <div className="flex items-center">
        <NavLink to="/" className="text-3xl tracking-wide flex items-center gap-2">
          <img src={Logo} alt="Logo" className="w-12 h-12 object-contain" />
        </NavLink>
      </div>

      {/* Mobile Menu Hamburger Button */}
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

      {/* Mobile Drawer */}
      <div
        className={`lg:hidden w-full fixed left-0 bg-gray-900 bg-opacity-95 backdrop-blur-lg transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? "top-16 h-[calc(100vh-4rem)]" : "top-[-100vh] h-0"
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg text-lg font-medium ${
                  isActive ? "bg-red-500 text-white" : "text-gray-200 hover:bg-gray-800"
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
                  isActive ? "bg-red-500 text-white" : "text-gray-200 hover:bg-gray-800"
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              Musics
            </NavLink>
            <NavLink
              to="/About"
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg text-lg font-medium ${
                  isActive ? "bg-red-500 text-white" : "text-gray-200 hover:bg-gray-800"
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </NavLink>
            <NavLink
              to="/Contact"
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg text-lg font-medium ${
                  isActive ? "bg-red-500 text-white" : "text-gray-200 hover:bg-gray-800"
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </NavLink>
          </div>

          {user ? (
            <div className="mt-8 pt-6 border-t border-gray-700">
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={user?.user?.imageURL || "/default-avatar.png"}
                  className="w-12 h-12 min-w-[44px] object-cover rounded-full shadow-lg"
                  alt="profile"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <p className="text-lg font-semibold text-white">
                    {user?.user?.name}
                  </p>
                  <p className="flex items-center gap-1 text-sm text-yellow-400">
                    <FaCrown className="text-sm" /> Member
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
                {isRoleAuthorized && (
                  <NavLink
                    to="/dashboard"
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
          ) : null}
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden w-full lg:flex lg:items-center lg:w-auto">
        <div className="items-center flex-1 justify-center text-base list-reset lg:flex gap-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `inline-block px-4 py-2 rounded-md transition ${
                isActive ? isActiveStyle : isNotActiveStyle
              }`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/Musics"
            className={({ isActive }) =>
              `inline-block px-4 py-2 rounded-md transition ${
                isActive ? isActiveStyle : isNotActiveStyle
              }`
            }
          >
            Musics
          </NavLink>
          <NavLink
            to="/About"
            className={({ isActive }) =>
              `inline-block px-4 py-2 rounded-md transition ${
                isActive ? isActiveStyle : isNotActiveStyle
              }`
            }
          >
            About
          </NavLink>
          <NavLink
            to="/Contact"
            className={({ isActive }) =>
              `inline-block px-4 py-2 rounded-md transition ${
                isActive ? isActiveStyle : isNotActiveStyle
              }`
            }
          >
            Contact
          </NavLink>
        </div>
      </div>

      {/* Desktop User Menu Dropdown */}
      {user ? (
        <div
          className="hidden lg:flex items-center ml-auto cursor-pointer gap-3 relative py-2"
          onMouseEnter={() => setIsMenu(true)}
          onMouseLeave={() => setIsMenu(false)}
        >
          <img
            src={user?.user?.imageURL || "/default-avatar.png"}
            className="w-10 h-10 object-cover rounded-full shadow-lg border-2 border-red-500"
            alt="profile"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col">
            <p className="text-gray-900 dark:text-white text-sm font-bold">
              {user?.user?.name}
            </p>
            <p className="flex items-center gap-1 text-xs text-yellow-500 font-semibold">
              <FaCrown className="text-xs" /> Member
            </p>
          </div>

          {isMenu && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="absolute z-50 top-14 right-0 w-48 p-2 bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col gap-1 text-gray-800 dark:text-gray-200"
            >
              <NavLink
                to="/Profile"
                className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-sm font-medium transition"
              >
                Profile
              </NavLink>

              {isRoleAuthorized && (
                <NavLink
                  to="/dashboard"
                  className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-sm font-medium transition"
                >
                  Dashboard
                </NavLink>
              )}
              <hr className="border-gray-200 dark:border-gray-700 my-1" />
              <button
                className="w-full text-left px-3 py-2 hover:bg-red-500/10 text-red-600 dark:text-red-400 rounded-md text-sm font-semibold transition"
                onClick={logOut}
              >
                Sign Out
              </button>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="hidden lg:flex items-center gap-4">
          <NavLink
            to="/login"
            className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition"
          >
            Login
          </NavLink>
        </div>
      )}
    </header>
  );
};

export default Header;
