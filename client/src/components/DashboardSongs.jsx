import React from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  IoAdd,
  IoPlay,
  IoPause,
  IoTrash,
  IoVolumeHigh,
  IoVolumeMute,
  IoVolumeLow,
} from "react-icons/io5";
import { AiOutlineClear } from "react-icons/ai";
import { useState } from "react";
import { useEffect } from "react";
import { getAllSongs } from "../../api";
import { actionType } from "../context/reducer";
import { useStateValue } from "../context/stateProvider";
import SongsCard from "./SongsCard";

const DashboardSongs = () => {
  const [SongFilter, setSongFilter] = useState("");
  const [isFocus, setIsFocus] = useState(false);
  const [{ allSongs }, dispatch] = useStateValue();

  useEffect(() => {
    if (!allSongs) {
      getAllSongs().then((data) => {
        dispatch({
          type: actionType.SET_ALL_SONGS,
          allSongs: data.data,
        });
      });
    }
  }, []);
  return (
    <>
      <div className="w-full p-4 flex flex-col items-center justify-center">
        <div className="flex w-full items-center justify-center gap-20">
          <NavLink
            to={"/dashboard/newSong"}
            className="text-2xl flex items-center justify-center px-3 py-2 border border-gray-300 hover:border-gray-500 rounded-full cursor-pointer"
          >
            <IoAdd />
          </NavLink>
          <input
            type="text"
            placeholder="Search"
            className={`w-[52] px-4 py-2 border rounded-md bg-transparent outline-none duration-150 transition-all ease-in-out text-base text-textColor font-semibold ${
              isFocus ? "border-gray-50 shadow-md" : "border-gray-300"
            } dark:border-green-50 dark:text-white placeholder:dark:text-white dark:shadow-white`}
            value={SongFilter}
            onChange={(e) => setSongFilter(e.target.value)}
            onBlur={() => setIsFocus(false)}
            onFocus={() => setIsFocus(true)}
          />
          <i>
            <AiOutlineClear className="text-3xl text-textColor cursor-pointer" />
          </i>
        </div>
        {/* Main content */}
        <div className="relative my-4 mx-2 w-full rounded-md border border-gray-300">
            <SongsContainer data={allSongs} />
        </div>
      </div>
    </>
  );
};


export const SongsContainer = ({data}) => {
  return (
    <div className="flex flex-col items-center p-4 justify-center w-full h-full bg-primary shadow-lg gap-3 dark:bg-gray-700 dark:text-white rounded-lg">
       {data && data.map((song,index) => (
      <SongsCard key={song._id} data={song} index={index} />
    )
    )}
    </div>
  );
}


export default DashboardSongs;
