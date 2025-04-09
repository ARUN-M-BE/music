import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useStateValue } from "../context/stateProvider";
import { actionType } from "../context/reducer";
import { IoTrash } from "react-icons/io5";
import { deleteSong, getAllSongs } from "../../api";

const SongsCard = ({ data, index, type }) => {
  const [isDelete, setIsDelete] = React.useState(false);
  const [{ songPlaying, songIndex, user }, dispatch] = useStateValue();
  const deleteObject = async (data) => {
    try {
      setIsDelete(true); // Show loading state
  
      // 1. Prepare file deletion promises (only if both ID and URL exist)
      const fileDeletions = [];
      
      if (data.fileId && data.imageURL) {
        fileDeletions.push(deleteFile(data.fileId, data.imageURL, 'image'));
      }
      
      if (data.songId && data.songURL) {
        fileDeletions.push(deleteFile(data.songId, data.songURL, 'audio'));
      }
  
      // 2. Execute file deletions if any
      if (fileDeletions.length > 0) {
        const fileResults = await Promise.allSettled(fileDeletions);
        const failedDeletions = fileResults.filter(r => r.status === 'rejected');
        
        if (failedDeletions.length > 0) {
          console.error('Failed file deletions:', failedDeletions);
          throw new Error('Failed to delete some files');
        }
      }
  
      // 3. Delete database record
      const dbResult = await deleteSong(data._id);
      if (!dbResult?.data?.success) {
        throw new Error('Database deletion failed');
      }
  
      // 4. Refresh data
      const { data: updatedSongs } = await getAllSongs();
      dispatch({
        type: actionType.SET_ALL_SONGS,
        allSongs: updatedSongs,
      });
  
      // 5. Show success
      dispatch({
        type: actionType.SET_ALERT_TYPE,
        AlertType: "success",
        message: "Successfully deleted song"
      });
  
    } catch (error) {
      console.error("Deletion error:", error);
      dispatch({
        type: actionType.SET_ALERT_TYPE,
        AlertType: "error",
        message: error.message || "Deletion failed"
      });
    } finally {
      setIsDelete(false);
      const timer = setTimeout(() => {
        dispatch({ type: actionType.SET_ALERT_TYPE, AlertType: null });
      }, 3000);
      return () => clearTimeout(timer);
    }
  };
  
  const deleteFile = async (fileId, fileURL, fileType) => {
    try {
      // Validate parameters
      if (!fileId || !fileURL) {
        throw new Error(`Missing ${fileType} file parameters`);
      }
  
      const response = await fetch(`${baseUrl2}delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          fileId,
          fileURL,
          fileType // Helps backend identify file location
        }),
      });
  
      const result = await response.json();
  
      if (!response.ok || !result.success) {
        throw new Error(result.message || `${fileType} deletion failed`);
      }
  
      return result;
    } catch (error) {
      console.error(`Error deleting ${fileType} file:`, error);
      throw error;
    }
  };
  const addToContext = () => {
   if (!songPlaying) {
    dispatch({
      type: actionType.SET_SONG_PLAYING,
      songPlaying: true ,
    });
  }
  if(songIndex !== index){
    dispatch({
      type: actionType.SET_SONG_INDEX,
      songIndex: index,
    });
   }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.5,
          delay: 0.2,
          type: "spring",
          stiffness: 150,
          damping: 10,
        }}
        onClick={addToContext}
        className="realtive w-40 min-w-[210px] px-2 py-4 cursor-pointer flex flex-col items-center justify-center bg-card hover:bg-cardhover rounded-lg backdrop-blur-lg shadow-lg shadow-gray-300 dark:shadow-gray-500 dark:bg-carddark dark:hover:bg-cardhoverdark"
      >
        <div className="w-40 min-w-[160px] h-40 min-h[160px] rounded-lg drop-shadow-lg overflow-hidden relative ">
          <motion.img
            whileHover={{ scale: 1.05 }}
            src={data.imageURL}
            alt={data.name}
            className="w-full h-full rounded-lg object-cover"
          />
        </div>
        <div className="flex flex-col items-center justify-center">
          <p className="text-base text-textColor font-semibold mt-2">
            {data.name.length > 15 ? `${data.name.slice(0, 10)}...` : data.name}
          </p>
          <p className="block text-sm text-gray-400 my-1 font-semibold">
            {data.artist.length > 20
              ? `${data.artist.slice(0, 20)}...`
              : data.artist}
          </p>
          <p className="text-sm text-textColor font-semibold">{data?.album}</p>
        </div>
        <div className="w-full absolute bottom-2 right-2 flex items-center justify-between px-4 ">
          {user?.user?.role === "admin" && (
            <motion.button
              whileTap={{ scale: 0.75 }}
              type="button"
              className="text-sm font-bold text-[12px] px-2 py-1 uppercase text-black drop-shadow-md bg-red-100 hover:bg-red-500 rounded-lg "
              onClick={(e) => {
                e.stopPropagation();
                setIsDelete(true);
              }}
            >
              <IoTrash />
            </motion.button>
          )}
        </div>
        {isDelete && (
          <motion.div
            className="absolute inset-0 backdrop-blur-md bg-bgCardOverlay flex flex-col items-center justify-center px-4 py-2 "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.5 } }}
          >
            <p className="text-lg text-center text-textColor font-semibold">
              Are you sure you want to delete this?
            </p>
            <div className="flex items-center justify-center gap-4 mt-2">
              <motion.button
                whileTap={{ scale: 0.75 }}
                type="button"
                className="text-sm font-bold text-[12px] px-2 py-1 uppercase text-black drop-shadow-md bg-red-100 hover:bg-red-500 rounded-lg  "
                onClick={() => deleteObject(data)}
              >
                Yes
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.75 }}
                type="button"
                className="text-sm font-bold text-[12px] px-2 py-1 uppercase text-black drop-shadow-md bg-green-100 hover:bg-green-500 rounded-lg "
                onClick={() => setIsDelete(false)}
              >
                No
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </>
  );
};

export default SongsCard;
