import React from "react";
import { NavLink } from "react-router-dom";
import { IoAdd } from "react-icons/io5";
import { useEffect } from "react";
import { getAllArtists } from "../../api";
import { actionType } from "../context/reducer";
import { useStateValue } from "../context/stateProvider";
import ArtistCard from "./ArtistCard";

const DashboardArtist = () => {
  const [{ allArtists }, dispatch] = useStateValue();

  useEffect(() => {
    if (!allArtists) {
      getAllArtists().then((data) => {
        dispatch({
          type: actionType.SET_ALL_ARTISTS,
          allArtists: data.data,
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
          
        </div>
        {/* Main content */}
        <div className="relative my-4 mx-2 w-full flex flex-col items-center justify-center rounded-md border border-gray-300">
          <div className="flex flex-wrap justify-center gap-4 my-4">
            {allArtists &&
              allArtists.map((artist, index) => (
                <ArtistCard key={index} data={artist} index={index} />
              ))}
          </div>
        </div>
      </div>
    </>
  );
};

export const ArtistContainer = ({ data }) => {
  return (
    <div className="flex items-center p-4 justify-center w-full h-full bg-primary shadow-lg gap-3 dark:bg-gray-700 dark:text-white rounded-lg">
      {data &&
        data.map((artist, index) => (
          <ArtistCard
            key={artist._id}
            data={artist}
            index={index}
            type="artist"
          />
        ))}
    </div>
  );
};

export default DashboardArtist;
