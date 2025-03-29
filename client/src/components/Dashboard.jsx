import React from "react";
import Header from "./Header";
import { NavLink } from "react-router-dom";
import { IoHome } from "react-icons/io5";
import { isActiveStyle, isNotActiveStyle } from "../utils/style";
import { Routes, Route } from "react-router-dom";
import DashboardHome from "./DashboardHome";
import DashboardUsers from "./DashboardUsers";
import DashboardSongs from "./DashboardSongs";
import DashboardArtist from "./DashboardArtist";
import DashboardAlbum from "./DashboardAlbum";

function Dashboard() {
  return (
    <>
      <div className="w-full h-auto bg-primary flex flex-col items-center justify-center shadow-2xl">
        <Header />

        <div className="w-[60%] my-2 p-4 flex items-center justify-evenly">
          <NavLink
            to={"/dashboard/home"}
            className={({ isActive }) =>
              isActive ? isActiveStyle : isNotActiveStyle
            }
          >
            <IoHome className="text-2xl text-textColor"></IoHome>
          </NavLink>
          <NavLink
            to={"/dashboard/users"}
            className={({ isActive }) =>
              isActive ? isActiveStyle : isNotActiveStyle
            }
          >
            Users
          </NavLink>
          <NavLink
            to={"/dashboard/songs"}
            className={({ isActive }) =>
              isActive ? isActiveStyle : isNotActiveStyle
            }
          >
            Songs
          </NavLink>
          <NavLink
            to={"/dashboard/artist"}
            className={({ isActive }) =>
              isActive ? isActiveStyle : isNotActiveStyle
            }
          >
            Artists
          </NavLink>
          <NavLink
            to={"/dashboard/album"}
            className={({ isActive }) =>
              isActive ? isActiveStyle : isNotActiveStyle
            }
          >
            Albums
          </NavLink>
        </div>

        <div className="my-4 w-full p-4">
          <Routes>
            <Route path="/home" element={<DashboardHome />} />
            <Route path="/users" element={<DashboardUsers />} />
            <Route path="/songs" element={<DashboardSongs />} />
            <Route path="/artist" element={<DashboardArtist />} />
            <Route path="/album" element={<DashboardAlbum />} />
            <Route path="/NewSong" element={<DashboardHome />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
