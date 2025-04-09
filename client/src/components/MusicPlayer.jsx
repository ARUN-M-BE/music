import React, { useState, useEffect } from "react";
import { useStateValue } from "../context/stateProvider";
import { RiPlayListFill } from "react-icons/ri";
import { IoMusicalNote } from "react-icons/io5";
import { motion } from "framer-motion";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import { actionType } from "../context/reducer";
import { getAllSongs } from "../../api";
import { FiMaximize } from "react-icons/fi";

const MusicPlayer = () => {
  const [{ songPlaying, songIndex, allSongs }, dispatch] = useStateValue();
  const [isPlayList, setIsPlayList] = useState(false);
  const [miniPlayer, setMiniPlayer] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(songIndex || 0);


  if (!allSongs || allSongs.length === 0 || currentIndex === null) return null;

  const currentSong = allSongs[songIndex] || allSongs[currentIndex];

  const togglePlayer = () => {
    setMiniPlayer((prev) => !prev);
  };

  const closeMusicPlayer = () => {
    setMiniPlayer(false);
    setIsPlayList(false);
  };

  const nextTrack = () => {
    setCurrentIndex((prev) => (prev + 1) % allSongs.length);
  };

  const previousTrack = () => {
    setCurrentIndex((prev) => (prev === 0 ? allSongs.length - 1 : prev - 1));
  };
  

  return (
    <div className="w-full flex items-center gap-3">
      <div
        className={`w-full items-center gap-3 p-4 ${
          miniPlayer ? "absolute top-40" : "flex relative"
        }`}
      >
        <img
          src={currentSong?.imageURL}
          className="w-40 h-20 object-cover rounded-md"
          alt={currentSong?.name}
        />

        <div className="flex items-start flex-col">
          <p className="text-xl text-headingColor font-semibold">
            {currentSong?.name.length > 20
              ? currentSong?.name.slice(0, 20)
              : currentSong?.name}{" "}
            <span className="text-base">({currentSong?.album})</span>
          </p>
          <p className="text-textColor">
            {currentSong?.artist}{" "}
            <span className="text-sm text-textColor font-semibold">
              ({currentSong?.category})
            </span>
          </p>
          <motion.i
            whileTap={{ scale: 0.8 }}
            onClick={() => setIsPlayList(!isPlayList)}
          >
            <RiPlayListFill className="text-textColor hover:text-headingColor text-3xl cursor-pointer" />
          </motion.i>
        </div>

        <div className="flex-1">
          <AudioPlayer
            src={currentSong?.songURL}
            autoPlay={true}
            showSkipControls
            onClickNext={nextTrack}
            onClickPrevious={previousTrack}
            onPlay={() => console.log("is playing")}
          />
        </div>
        {!miniPlayer && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed right-4 bottom-25 z-50"
          >
            <button
              onClick={() => setMiniPlayer(true)}
              className="p-3 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 transition duration-300"
            >
              <FiMaximize className="text-2xl" />
            </button>
          </motion.div>
        )}
      </div>

      {isPlayList && <PlayListCard setCurrentIndex={setCurrentIndex} />}

      {miniPlayer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed right-2 bottom-2"
        >
          <div className="w-40 h-40 rounded-full flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-full bg-red-600 blur-xl animate-pulse"></div>
            <img
              onClick={togglePlayer}
              src={currentSong?.imageURL}
              className="z-50 w-32 h-32 rounded-full object-cover cursor-pointer"
              alt={currentSong?.name}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export const PlayListCard = ({ setCurrentIndex }) => {
  const [{ allSongs, songIndex, songPlaying }, dispatch] = useStateValue();

  useEffect(() => {
    if (!allSongs || allSongs.length === 0) {
      getAllSongs().then((data) => {
        dispatch({
          type: actionType.SET_ALL_SONGS,
          allSongs: data.data,
        });
      });
    }
  }, []);

  const setCurrentPlaySong = (index) => {
    if (!songPlaying) {
      dispatch({
        type: actionType.SET_SONG_PLAYING,
        songPlaying: true,
      });
    }

    if (songIndex !== index) {
      dispatch({
        type: actionType.SET_SONG_INDEX,
        songIndex: index,
      });
      setCurrentIndex(index); // Update local index
    }
  };

  return (
    <div className="absolute left-4 bottom-24 gap-2 py-2 w-350 max-w-[350px] h-510 max-h-[510px] flex flex-col overflow-y-scroll scrollbar-thin rounded-md shadow-md bg-primary">
    {allSongs && allSongs.length > 0 ? (
      allSongs.map((music, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, translateX: -50 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className={`group w-full p-4 hover:bg-card flex gap-3 items-center cursor-pointer ${
            music?._id === allSongs[songIndex]?._id ? "bg-card" : "bg-transparent"
          }`}
          onClick={() => setCurrentPlaySong(index)}
        >
          <IoMusicalNote className="text-textColor group-hover:text-headingColor text-2xl cursor-pointer" />

          <div className="flex items-start flex-col">
            <p className="text-lg text-headingColor font-semibold">
              {music?.name.length > 20
                ? music?.name.slice(0, 20)
                : music?.name}{" "}
              <span className="text-base">({music?.album})</span>
            </p>
            <p className="text-textColor">
              {music?.artist}{" "}
              <span className="text-sm text-textColor font-semibold">
                ({music?.category})
              </span>
            </p>
          </div>
        </motion.div>
      ))
    ) : (
      <p className="text-center text-textColor">No songs available</p>
    )}
  </div>
  );
};

export default MusicPlayer;
