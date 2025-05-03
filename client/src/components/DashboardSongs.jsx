import React from "react";
import { NavLink } from "react-router-dom";
import { IoAdd } from "react-icons/io5";
import { useEffect } from "react";
import { getAllSongs } from "../../api";
import { actionType } from "../context/reducer";
import { useStateValue } from "../context/stateProvider";
import SongsCard from "./SongsCard";
import SearchBar from "./SearchBar";

const DashboardSongs = () => {
  const [{ allSongs, filteredSongs }, dispatch] = useStateValue();

  useEffect(() => {
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
      <div className="w-full p-4 flex flex-col items-center justify-center">
        <div className="flex w-full items-center justify-center gap-20">
          <NavLink
            to={"/dashboard/newSong"}
            className="bg-gradient-to-t from-cyan-500 to-blue-500 text-2xl flex items-center justify-center px-3 py-2 border border-gray-300 hover:border-gray-500 rounded-full cursor-pointer"
          >
            <IoAdd />
          </NavLink>
          <SearchBar />
        </div>
        {/* Main content */}
        <div className="relative my-4 mx-2 w-full flex flex-col items-center justify-center rounded-md border border-gray-300">
          {/* Display search results count if filtered */}
          {filteredSongs && (
            <div className="w-full p-2 text-center bg-blue-100 dark:bg-gray-600">
              Found {filteredSongs.length} result
              {filteredSongs.length !== 1 ? "s" : ""}
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-4 my-4">
            {/* Display filtered songs if they exist, otherwise display all songs */}
            {(filteredSongs ? filteredSongs : allSongs)?.map((song, index) => (
              <SongsCard key={song._id} data={song} index={index} />
            ))}

            {/* Show message when no results found */}
            {filteredSongs && filteredSongs.length === 0 && (
              <div className="w-full text-center py-8 text-gray-500 dark:text-gray-300">
                No songs found matching your search
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export const SongsContainer = ({ data }) => {
  return (
    <div className="flex items-center p-4 justify-center w-full bg-primary shadow-lg gap-3 dark:bg-gray-700 dark:text-white rounded-lg">
      {data &&
        data.map((song, index) => (
          <SongsCard key={song._id} data={song} index={index} type="song" />
        ))}
    </div>
  );
};

export default DashboardSongs;
