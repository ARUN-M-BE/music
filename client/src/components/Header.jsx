import React from "react";
import { Logo } from "../assets/image";
import { NavLink } from "react-router-dom";
import { isNotActiveStyle, isActiveStyle } from "../utils/style";

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
      </header>
    </>
  );
};

export default Header;
