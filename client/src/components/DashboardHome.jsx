import React, { useEffect } from "react";
import { useStateValue } from "../context/stateProvider";
import {
  getAllUsers,
  getAllAlbums,
  getAllArtists,
  getAllSongs,
} from "../../api";
import { actionType } from "../context/reducer";
import { FaUsers } from "react-icons/fa";
import { RiUserStarFill } from "react-icons/ri";
import { GiLoveSong, GiMusicalNotes } from "react-icons/gi";
import { motion } from "framer-motion";

export const DashboardCard = ({ icon, name, count }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        scale: 1.02,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 15,
        delay: 0.1,
      }}
      className="w-full max-w-[160px] md:aspect-square mx-1 my-2 md:my-4 md:mx-2 flex flex-col justify-center items-center p-3 md:p-4 bg-white border border-gray-200 rounded-lg md:rounded-xl shadow-xs hover:shadow-sm transition-all dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
    >
      {/* Icon Container */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400 }}
        className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 text-xl md:text-2xl mb-2 md:mb-3"
      >
        {icon}
      </motion.div>

      {/* Content Container */}
      <div className="text-center w-full">
        <h5 className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300 line-clamp-1">
          {name}
        </h5>
        <h4 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mt-1">
          {count}
        </h4>
      </div>
    </motion.div>
  );
};

const DashboardHome = () => {
  const [{ allUsers, allAlbums, allArtists, allSongs }, dispatch] =
    useStateValue();

  useEffect(() => {
    if (!allUsers) {
      getAllUsers().then((data) => {
        dispatch({
          type: actionType.SET_ALL_USERS,
          allUsers: data.data,
        });
      });
    }
    if (!allAlbums) {
      getAllAlbums().then((data) => {
        dispatch({
          type: actionType.SET_ALL_ALBUMS,
          allAlbums: data.data,
        });
      });
    }
    if (!allArtists) {
      getAllArtists().then((data) => {
        dispatch({
          type: actionType.SET_ALL_ARTISTS,
          allArtists: data.data,
        });
      });
    }
    if (!allSongs) {
      getAllSongs().then((data) => {
        dispatch({
          type: actionType.SET_ALL_SONGS,
          allSongs: data.songs,
        });
      });
    }
  }, []);

  return (
    <>
      <div className="w-full h-auto p-2 flex items-center justify-center flex-wrap dark:bg-gray-700 dark:text-white rounded-lg">
        <DashboardCard
          icon={<FaUsers className="text-4xl text-blue-700" />}
          name="Users"
          count={allUsers ? allUsers.length : 0}
        />
        <DashboardCard
          icon={<GiLoveSong className="text-4xl text-pink-500" />}
          name="Songs"
          count={allSongs ? allSongs.length : 0}
        />
        <DashboardCard
          icon={<RiUserStarFill className="text-4xl text-yellow-500" />}
          name="Artists"
          count={allArtists ? allArtists.length : 0}
        />
        <DashboardCard
          icon={<GiMusicalNotes className="text-4xl text-zinc-500" />}
          name="Albums"
          count={allAlbums ? allAlbums.length : 0}
        />
      </div>
    </>
  );
};

export default DashboardHome;