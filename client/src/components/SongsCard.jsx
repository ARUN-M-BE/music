import React from "react";
import { motion } from "framer-motion";
import { useStateValue } from "../context/stateProvider";
import { actionType } from "../context/reducer";
import { IoTrash, IoPlay } from "react-icons/io5";
import { deleteSong, getAllSongs } from "../../api";
import { baseURLL } from "../config/config";

const SongsCard = ({ data, index, type }) => {
  const [isDelete, setIsDelete] = React.useState(false);
  const [{ songPlaying, songIndex, user }, dispatch] = useStateValue();

  const showAlert = (alertType) => {
    dispatch({
      type: actionType.SET_ALERT_TYPE,
      AlertType: alertType,
    });
    setTimeout(() => {
      dispatch({
        type: actionType.SET_ALERT_TYPE,
        AlertType: null,
      });
    }, 3000);
  };

  const deleteFile = async (fileId, fileType) => {
    if (!fileId) return;
    try {
      const res = await fetch(`${baseURLL}api/media/delete/${fileId}`, {
        method: "DELETE",
      });
      const resData = await res.json();
      if (!resData.success) {
        throw new Error(`Failed to delete ${fileType}`);
      }
    } catch (err) {
      console.error(`Error deleting ${fileType}:`, err);
      throw err;
    }
  };

  const deleteObject = async (songData) => {
    try {
      setIsDelete(true);
      const fileDeletions = [];
      if (songData.fileId) fileDeletions.push(deleteFile(songData.fileId, "image"));
      if (songData.songId) fileDeletions.push(deleteFile(songData.songId, "audio"));

      if (fileDeletions.length > 0) {
        await Promise.allSettled(fileDeletions);
      }

      const dbRes = await deleteSong(songData._id);
      if (!dbRes?.data?.success) {
        throw new Error("Failed to delete from database");
      }

      const updated = await getAllSongs();
      dispatch({
        type: actionType.SET_ALL_SONGS,
        allSongs: updated?.data || updated?.songs || [],
      });

      showAlert("success");
    } catch (error) {
      console.error("Deletion error:", error);
      showAlert("error");
    } finally {
      setIsDelete(false);
    }
  };

  const addToContext = () => {
    if (!songPlaying) {
      dispatch({
        type: actionType.SET_SONG_PLAYING,
        songPlaying: true,
      });
    }
    dispatch({
      type: actionType.SET_SONG_INDEX,
      songIndex: index,
    });
  };

  const isCurrentPlaying = songIndex === index && songPlaying;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      onClick={addToContext}
      className={`relative w-44 min-w-[176px] p-3 cursor-pointer flex flex-col items-center justify-between rounded-xl backdrop-blur-md transition-all duration-300 group shadow-md hover:shadow-xl ${
        isCurrentPlaying
          ? "bg-red-500/10 border-2 border-red-500/50 dark:bg-red-900/20"
          : "bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700"
      }`}
    >
      {/* Artwork with Hover Overlay */}
      <div className="relative w-38 h-38 w-full aspect-square rounded-lg overflow-hidden shadow-inner">
        <img
          src={data.imageURL || "/default-song.png"}
          alt={data.name}
          className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://cdn-icons-png.flaticon.com/512/3844/3844724.png";
          }}
        />

        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 rounded-lg">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg"
          >
            <IoPlay className="text-2xl ml-1" />
          </motion.div>
        </div>

        {/* Category Tag */}
        {data.category && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-black/60 backdrop-blur-sm text-white uppercase tracking-wider">
            {data.category}
          </span>
        )}
      </div>

      {/* Song Information */}
      <div className="w-full flex flex-col items-start mt-3">
        <p className="text-sm font-bold text-gray-900 dark:text-white truncate w-full">
          {data.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-full mt-0.5">
          {data.artist}
        </p>
        {data.album && (
          <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate w-full mt-0.5">
            {data.album}
          </span>
        )}
      </div>

      {/* Superadmin Delete Trigger */}
      {(user?.user?.role === "admin" || user?.user?.role === "superadmin") && (
        <div className="w-full flex justify-end mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <motion.button
            whileTap={{ scale: 0.8 }}
            type="button"
            className="p-1.5 rounded-full bg-red-100 hover:bg-red-500 text-red-600 hover:text-white dark:bg-red-900/30 dark:hover:bg-red-600 dark:text-red-400 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsDelete(true);
            }}
          >
            <IoTrash className="text-sm" />
          </motion.button>
        </div>
      )}

      {/* Delete Confirmation Modal Overlay */}
      {isDelete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-20 rounded-xl bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-3 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-xs font-semibold text-white mb-3">
            Delete this song?
          </p>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 text-xs font-bold bg-red-600 text-white rounded-md hover:bg-red-700"
              onClick={() => deleteObject(data)}
            >
              Yes
            </button>
            <button
              className="px-3 py-1 text-xs font-bold bg-gray-600 text-white rounded-md hover:bg-gray-700"
              onClick={() => setIsDelete(false)}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SongsCard;
