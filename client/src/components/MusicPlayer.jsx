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
import { FiMusic } from "react-icons/fi";

const MusicPlayer = () => {
  const [{ songPlaying, songIndex, allSongs }, dispatch] = useStateValue();
  const [isPlayList, setIsPlayList] = useState(false);
  const [miniPlayer, setMiniPlayer] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(songIndex || 0);
  const [isPlaying, setIsPlaying] = useState(true); // Should sync with your audio player state
  const [groupHover, setGroupHover] = useState(false); // For hover detection

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
        <div className="flex flex-col md:flex-row items-center gap-3 p-3 md:p-4 bg-transparent dark:bg-transparent dark:backdrop-blur-lg backdrop-blur-lg rounded-lg shadow-md">
          {/* Song Image */}
          <div className="relative flex-shrink-0">
            <img
              src={currentSong?.imageURL}
              className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-md"
              alt={currentSong?.name}
            />
          </div>

          {/* Song Info */}
          <div className="flex-1 min-w-0 w-full p-2 mb-16">
            <div className="flex items-center justify-between gap-2">
              <div className="overflow-hidden">
                <h2 className="text-md md:text-lg font-bold text-gray-800 dark:text-white">
                  {currentSong?.name}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentSong?.artist}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                {/* Mini Player Toggle */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMiniPlayer(true)}
                  className="text-gray-600 dark:text-gray-300 hover:text-red-500 transition-colors"
                >
                  <FiMinimize className="text-lg" />
                </motion.button>

                {/* Playlist Button */}
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => setIsPlayList(!isPlayList)}
                >
                  <RiPlayListFill className="text-2xl text-gray-600 dark:text-gray-300 hover:text-red-500 transition-colors" />
                </motion.button>
              </div>
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
              />
            </div>
          </div>
        </div>
      </div>

      {/* Playlist - Second Design */}
      {isPlayList && (
        <div className="mt-3 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-white"></h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            <PlayListCard setCurrentIndex={setCurrentIndex} />
          </div>
        </div>
      )}

      {/* Mini Player */}
      {miniPlayer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            }}
          transition={{
            opacity: { duration: 0.3 },
            scale: { duration: 0.3 },
            boxShadow: {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
              repeatType: "reverse",
            },
          }}
          className="fixed right-4 bottom-4 z-50"
        >
          <div className="relative group">
            {/* Album Art with Beat Animation */}
            <motion.div
              animate={{
                scale: isPlaying ? [1, 1.05, 1] : 1,
                rotate: isPlaying ? [0, 1, -1, 0] : 0,
              }}
              transition={{
                scale: {
                  duration: 0.5,
                  repeat: Infinity,
                  repeatType: "loop",
                },
                rotate: {
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "mirror",
                },
              }}
              className="w-24 h-24 rounded-full overflow-hidden shadow-lg relative bg-gradient-to-br from-red-500 to-pink-500"
            >
              <img
                src={currentSong?.imageURL}
                className="relative w-full h-full object-cover"
                alt={currentSong?.name}
              />

              {/* Pulsing Ring Effect */}
              {isPlaying && (
                <motion.div
                  animate={{
                    scale: [1, 1.2],
                    opacity: [0.7, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                  className="absolute inset-0 border-2 border-red-400 rounded-full"
                />
              )}

              {/* Maximize Button */}
              <button
                onClick={() => setMiniPlayer(false)}
                className="absolute inset-0 flex items-center justify-center bg-transperant bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300"
              >
                <FiMaximize className="text-white text-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </motion.div>

            {/* Now Playing Info */}
            <motion.div
              initial={{ x: 10, opacity: 0 }}
              animate={{
                x: isPlaying ? [0, 5, 0] : 0,
                opacity: groupHover ? 1 : 0,
              }}
              transition={{
                x: {
                  duration: 0.5,
                  repeat: Infinity,
                  repeatType: "mirror",
                },
              }}
              className="absolute left-full ml-3 bg-transparent dark:backdrop-blur-lg dark:bg-transparent p-3 rounded-lg shadow-xl backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90 w-48"
            >
              <p className="text-sm font-bold truncate text-gray-800 dark:text-white">
                {currentSong?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2">
                {currentSong?.artist}
              </p>
              <div className="w-full">
                <AudioPlayer
                  src={currentSong?.songURL}
                  volume={0.8}
                  layout="stacked"
                  showSkipControls={false}
                  showJumpControls={false}
                  customProgressBarSection={[]}
                  customControlsSection={["MAIN_CONTROLS", "VOLUME_CONTROLS"]}
                />
              </div>

              {/* Visualizer Effect */}
              {isPlaying && (
                <div className="flex items-center justify-center gap-1 mt-2 h-4">
                  {[1, 2, 3, 2, 1].map((height, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: [height * 4, height * 8, height * 4],
                        backgroundColor: [
                          "#ef4444",
                          "#f97316",
                          "#eab308",
                          "#f97316",
                          "#ef4444",
                        ],
                      }}
                      transition={{
                        duration: 0.5 + i * 0.1,
                        repeat: Infinity,
                        repeatType: "reverse",
                      }}
                      className="w-1 rounded-full bg-red-500"
                    />
                  ))}
                </div>
              )}
            </motion.div>
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
    <div className="absolute left-4 bottom-24 gap-2 py-2 w-[350px] max-w-[350px] h-[510px] max-h-[510px] flex flex-col overflow-y-auto scrollbar-thin rounded-md shadow-md bg-transparent dark:bg-transparent backdrop-blur-lg dark:backdrop-blur-lg">
      {allSongs && allSongs.length > 0 ? (
        allSongs.map((song, index) => (
          <motion.div
            key={song._id || index}
            initial={{ opacity: 0, translateX: -20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            onClick={() => setCurrentIndex(index)}
            className={`p-3 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${
              index === index
                ? "bg-red-100 dark:bg-gray-700"
                : "hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <div className="relative flex-shrink-0">
              <img
                src={song.imageURL || "/default-song.png"}
                className="w-12 h-12 object-cover rounded-md"
                alt={song.name || "Unknown song"}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/default-song.png";
                }}
              />
              {index === index && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-md">
                  <FiMusic className="text-white animate-pulse" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-gray-800 dark:text-white">
                {song.name || "Unknown Song"}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                  {song.artist || "Unknown Artist"}
                </p>
                {song.album && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    • {song.album}
                  </span>
                )}
              </div>
              {song.category && (
                <span className="text-[10px] px-1 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded mt-1 inline-block">
                  {song.category}
                </span>
              )}
            </div>
          </motion.div>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <FiMusic className="text-4xl mb-2" />
          <p className="text-center">No songs available</p>
          <p className="text-sm mt-1">Add some music to get started</p>
        </div>
      )}
    </div>
  );
};

export default MusicPlayer;
