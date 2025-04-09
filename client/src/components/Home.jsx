import React from "react";
import Header from "./Header";
import { useState } from "react";
import { useEffect } from "react";
import { getAllSongs } from "../../api";
import { actionType } from "../context/reducer";
import { useStateValue } from "../context/stateProvider";
import SongsCard from "./SongsCard";


const Home = () => {
  const [SongFilter, setSongFilter] = useState("");
  const [isFocus, setIsFocus] = useState(false);
  const [{ allSongs }, dispatch] = useStateValue();

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
      <div className="w-full h-auto flex flex-col items-center justify-center bg-primary dark:bg-gray-900 dark:text-white">
        <Header />
        <div className="w-full p-4 flex flex-col items-center justify-center">
        {/* Main content */}
        <div className="relative my-4 mx-2 w-full flex flex-col items-center justify-center rounded-md border border-gray-300">
            <div className="flex flex-wrap justify-center gap-4 my-4">
                {allSongs &&
                    allSongs.map((song, index) => (
                        <SongsCard key={index} data={song} index={index} />
                    ))}
            </div>
        </div>
      </div>
      </div>
      
    </>
  );
};

export const SongsContainer = ({data}) => {
  return (
    <div className="flex items-center p-4 justify-center w-full bg-primary shadow-lg gap-3 dark:bg-gray-700 dark:text-white rounded-lg">
       {data && data.map((song,index) => (
      <SongsCard key={song._id} data={song} index={index} type="song" />
    )
    )}
    </div>
  );
}

export default Home;
