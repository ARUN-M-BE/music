import React from "react";
import { Logo } from "../assets/image";
import { useNavigate, NavLink } from "react-router-dom";
import { isNotActiveStyle, isActiveStyle } from "../utils/style";
import { FaCrown } from "react-icons/fa";
import { useStateValue } from "../context/stateProvider";
import { app } from "../config/firebase.config";
import { getAuth } from "firebase/auth";
import { motion } from "framer-motion";
import { useState } from "react";

const Header = () => {
  const [{ user }, dispatch] = useStateValue();
  const navigate = useNavigate();
  const [isMenu, setisMenu] = useState(false);

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
    <>
      <header className="flex items-center w-full p-4 md:py-2 md:px-6 bg-dark shadow-md  top-0 z-50 backdrop-blur-md transition-all duration-200 ease-in-out">
        <NavLink to="/">
          <img src={Logo} alt="Logo" className=" w-16" />
        </NavLink>
        <ul className="flex items-center justify-center ml-7">
          <li className="mx-5 text-lg">
            <NavLink
              to={"/home"}
              className={({ isActive }) =>
                isActive ? isActiveStyle : isNotActiveStyle
              }
            >
              Home
            </NavLink>
          </li>
          <li className="mx-5 text-lg">
            <NavLink
              to={"/Musics"}
              className={({ isActive }) =>
                isActive ? isActiveStyle : isNotActiveStyle
              }
            >
              Musics
            </NavLink>
          </li>
          <li className="mx-5 text-lg">
            <NavLink
              to={"/Premium"}
              className={({ isActive }) =>
                isActive ? isActiveStyle : isNotActiveStyle
              }
            >
              Premium
            </NavLink>
          </li>
          <li className="mx-5 text-lg">
            <NavLink
              to={"/Contact"}
              className={({ isActive }) =>
                isActive ? isActiveStyle : isNotActiveStyle
              }
            >
              Contact
            </NavLink>
          </li>
        </ul>

        <div className="flex items-center ml-auto cursor-pointer gap-2 relative">
          <img
            src={user?.user?.imageURL}
            className="w-12 h-12 min-w-[44px] object-cover rounded-full shadow-lg "
            alt="profile"
            referrerPolicy="no-referrer"
          />
          <div 
          onMouseEnter={() => setisMenu(true)}
          onMouseLeave={() => setisMenu(true)}
          className="flex flex-col">
            <p className="text-textColor text-lg hover:text-headingColor font-semibold">
              {user?.user?.name}
            </p>
            <p className="flex items-center gap-2 text-xa text-textColor font-normal">
              Premium Member. <FaCrown className="text-sm -ml-1 text-yellow-500" />
            </p>
          </div>
          {isMenu && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute z-10 top-14 p-3 right-0 w-50 gap-2 bg-card shadow-lg rounded-lg backdrop-blur-sm flex flex-col"
            >
              <NavLink to={"/Profile"}>
                <p className="text-base text-textColor hover:font-semibold duration-150 transition-all ease-in-out">
                  Profile
                </p>
              </NavLink>
              {/* <NavLink to={"/Myfav"}> */}
                <p className="text-base text-textColor hover:font-semibold duration-150 transition-all ease-in-out">
                  My Favourites
                </p>
              {/* </NavLink> */}
              {/* <NavLink to={"/Signout"}> */}
                <hr />
                {
                  user?.user?.role === "admin" && (
                    <NavLink to={"/dashboard/home"}>
                      <p className="text-base text-textColor hover:font-semibold duration-150 transition-all ease-in-out">
                        Dashboard
                      </p>
                    </NavLink>
                  )
                }
                <p
                  className="text-base text-textColor hover:font-semibold duration-150 transition-all ease-in-out"
                  onClick={logOut}
                >
                  Sign Out
                </p>
              {/* </NavLink> */}
            </motion.div>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;
