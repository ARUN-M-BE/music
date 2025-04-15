import React from "react";
import Header from "./Header";
import { useState } from "react";
import { useEffect } from "react";
import { getAllSongs } from "../../api";
import { actionType } from "../context/reducer";
import { useStateValue } from "../context/stateProvider";
import SongsCard from "./SongsCard";
import HeaderSection from "./HeaderSection";

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
    <div className="w-full min-h-screen flex flex-col items-center bg-primary dark:bg-gray-900 dark:text-white">
      <Header />
      <main className="@container w-full max-w-7xl mt-[60px] mb-16 px-4 md:px-6 py-4 flex flex-col items-center">
        {/* header content - visible on all screens */}
        <HeaderSection />

        {/* Main content */}
        <div className="relative my-4 md:my-6 w-full flex flex-col items-center justify-center rounded-md border border-gray-300">
          <SongsContainer data={allSongs} />
        </div>
      </main>
    </div>
  );
};

export const SongsContainer = ({ data }) => {
  return (
    <div className=" w-full flex flex-col items-center justify-center p-4">
      <div className="flex flex-wrap justify-center gap-4 my-6 p-4 w-full">
        {data &&
          data.map((song, index) => (
            <SongsCard key={index} data={song} index={index} />
          ))}
      </div>
    </div>
  );
};

export default Home;
