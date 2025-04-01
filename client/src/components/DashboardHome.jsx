import React, { useEffect } from "react";
import { useStateValue } from "../context/StateProvider";
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
    <>
      {/* <div className="w-40 h-auto bg-dark text-block p-4 rounded-lg shadow-md flex items-center justify-evenly flex-col gap-4">
        <div className="text-4xl">{icon}</div>
        <div className="text-2xl">{name}</div>
        <div className="text-lg">{count}</div>
      </div> */}

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 , delay: 0.2, type: "spring", stiffness: 150 }}
        class="flex flex-col justify-center items-center p-4 bg-white border border-gray-200 rounded-lg shadow-sm md:flex-row md:max-w-xl hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 "
      >
        <div class=" w-full h-40 md:h-auto md:w-auto text-4xl">{icon}</div>
        <div class="flex flex-col justify-center items-center p-4 leading-normal">
          <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {name}
          </h5>
          <h4 class="mb-3 text-3xl font-bold text-gray-700 dark:text-white">
            {count}
          </h4>
        </div>
      </motion.div>
    </>
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
          allSongs: data.data,
        });
      });
    }
  }, []);

  return (
    <>
      <div className="w-full h-[480px] p-6 flex items-center justify-center flex-wrap gap-5 dark:bg-gray-700 dark:text-white rounded-lg">
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
