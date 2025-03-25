import React from "react";
import { Logo } from "../assets/image";
import { NavLink } from "react-router-dom";
import { isNotActiveStyle, isActiveStyle } from "../utils/style";
import { FaCrown } from "react-icons/fa";

const Header = () => {
  return (
    <>
      <header className="flex items-center w-full p-4 md:py-2 md:px-6 bg-amber-100 shadow-md fixed top-0 z-50 backdrop-blur-md transition-all duration-200 ease-in-out">
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
              <img src="" className="w-12 min-w-[44px] object-cover rounded-full shadow-lg " alt="" />
              <div className="flex flex-col">
                    <p className="text-textColor text-lg hover:text-headingColor font-semibold">Username</p>
                    <p className="flex items-center gap-2 text-xa text-gray-400 font-normal">Premium. <FaCrown className="text-sm -ml-1 text-black" /></p>
                    <p></p>
              </div>
        </div>
      </header>
    </>
  );
};

export default Header;
