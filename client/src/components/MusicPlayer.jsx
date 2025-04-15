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
import { FiMinimize } from "react-icons/fi";

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
    <div className="w-full">
      {/* Main Player */}
      <div className={`w-full mb-4 ${miniPlayer ? "hidden" : "block"}`}>
        <div className="flex  flex-col md:flex-row items-center gap-3 p-3 md:p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          {/* Song Image */}
          <div className="relative flex-shrink-0">
            <img
              src={currentSong?.imageURL}
              className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-md"
              alt={currentSong?.name}
            />
            {/* Mini Player Toggle - Mobile Only */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMiniPlayer(true)}
              className="md:hidden absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg"
            >
              <FiMinimize className="text-sm" />
            </motion.button>
          </div>

          {/* Song Info */}
          <div className="flex-1 min-w-0 text-center md:text-left">
            <div className="flex items-center justify-between gap-2">
              <div className="overflow-hidden">
                <p className="text-md md:text-lg font-semibold text-gray-800 dark:text-white truncate">
                  {currentSong?.name}
                  <span className="text-sm text-gray-500 dark:text-gray-300 ml-1">
                    ({currentSong?.album})
                  </span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentSong?.artist}
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    ({currentSong?.category})
                  </span>
                </p>
              </div>

              {/* Playlist Button */}
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => setIsPlayList(!isPlayList)}
                className="flex-shrink-0 ml-2"
              >
                <RiPlayListFill className="text-2xl text-gray-600 dark:text-gray-300 hover:text-red-500 transition-colors" />
              </motion.button>
            </div>

            {/* Audio Player */}
            <div className="mt-2 w-full">
              <AudioPlayer
                src={currentSong?.songURL}
                autoPlay={true}
                showSkipControls
                onClickNext={nextTrack}
                onClickPrevious={previousTrack}
                layout="stacked-reverse"
                customAdditionalControls={[
                  <button
                    onClick={() => setMiniPlayer(true)}
                    className="hidden md:block text-gray-600 dark:text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <FiMinimize />
                  </button>,
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Playlist */}
      {isPlayList && (
        <div className="mt-3">
          <PlayListCard setCurrentIndex={setCurrentIndex} />
        </div>
      )}

      {/* Mini Player */}
      {miniPlayer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed right-4 bottom-4 z-50"
        >
          <div className="relative group">
            {/* Album Art with Pulse Effect */}
            <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg relative">
              <div className="absolute inset-0 bg-red-500 opacity-20 rounded-full animate-pulse"></div>
              <img
                src={currentSong?.imageURL}
                className="relative w-full h-full object-cover cursor-pointer"
                alt={currentSong?.name}
                onClick={() => setMiniPlayer(false)}
              />
                <FiMaximize className="absolut -z-10" />
            </div>

            {/* Mini Controls */}
            {/* <div className="absolute -top-2 -right-2 flex items-center gap-1"> */}

            {/* </div> */}

            {/* Now Playing Info (Appears on hover) */}
            <div className="absolute left-full ml-2 bg-white dark:bg-gray-800 p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity w-40">
              <p className="text-sm font-medium truncate">
                {currentSong?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {currentSong?.artist}
              </p>
            </div>
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
              music?._id === allSongs[songIndex]?._id
                ? "bg-card"
                : "bg-transparent"
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
