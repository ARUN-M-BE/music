import React,{ useState } from "react";
import { motion } from "framer-motion";
import { useStateValue } from "../context/stateProvider";
import { actionType } from "../context/reducer";
import { IoTrash } from "react-icons/io5";
import { deleteArtist, getAllArtists } from "../../api";

const ArtistCard = ({ data, index }) => {
  const [isDelete, setIsDelete] = useState(false);
  const [{ allArtists, AlertType }, dispatch] = useStateValue();
  const deleteObject = async (data) => {
    try {
      setIsDelete(true); // Show loading state
  
      // First delete the associated image file if it exists
      if (data.imageURL && data.fileId) {
        await deleteFileImage(data.fileId, data.imageURL);
      }
  
      // Then delete the database record
      const deleteResponse = await deleteArtist(data._id);
      if (!deleteResponse?.data) {
        throw new Error("Failed to delete artist record");
      }
  
      // Refresh the artists list
      const artistsData = await getAllArtists();
      dispatch({
        type: actionType.SET_ALL_ARTISTS,
        allArtists: artistsData.data,
      });
  
      dispatch({
        type: actionType.SET_ALERT_TYPE,
        AlertType: "success",
      });
    } catch (error) {
      console.error("Deletion failed:", error);
      dispatch({
        type: actionType.SET_ALERT_TYPE,
        AlertType: "error",
      });
    } finally {
      setIsDelete(false);
      // Clear alert after 3 seconds
      const timer = setTimeout(() => {
        dispatch({
          type: actionType.SET_ALERT_TYPE,
          AlertType: null,
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  };
  
  const deleteFileImage = async (fileId, fileURL) => {
    try {
      if (!fileURL || !fileId) {
        console.warn("Missing fileURL or fileId");
        return;
      }
  
      const response = await fetch("https://g-music-pvze.onrender.com/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId: fileId,
          url: fileURL,
        }),
      });
  
      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  };
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          delay: 0.2,
          type: "spring",
          stiffness: 150,
          damping: 10,
        }}
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
            {data.name.length > 20 ? `${data.name.slice(0, 20)}...` : data.name}
          </p>
         
        </div>
        <div className="w-full absolute bottom-2 right-2 flex items-center justify-between px-4 ">
          <motion.i whileTap={{scale:0.75}} className="text-base text-red-400 hover:text-red-600 drop-shadow-md "
          onClick={() => setIsDelete(true)}>
            <IoTrash />
          </motion.i>
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

export default ArtistCard;
