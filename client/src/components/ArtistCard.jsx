import React,{ useState } from "react";
import { motion } from "framer-motion";
import { useStateValue } from "../context/stateProvider";
import { actionType } from "../context/reducer";
import { IoTrash } from "react-icons/io5";
import { deleteArtist, getAllArtists } from "../../api";

const ArtistCard = ({ data, index }) => {
  const [isDelete, setIsDelete] = useState(false);
  const [{ allArtists, AlertType }, dispatch] = useStateValue();
  const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000/"

  const showAlert = (type) => {
    dispatch({
      type: actionType.SET_ALERT_TYPE,
      AlertType: type,
    });
    const timer = setTimeout(() => {
      dispatch({
        type: actionType.SET_ALERT_TYPE,
        AlertType: null,
      });
    }, 3000);
  };

  const deleteImage = async (fileId, data) => {
    console.log("Delete function triggered", { fileId, data });
  
    try {
      if (!fileId || !data?._id) {
        console.warn("Missing fileId or album _id");
        return;
      }
  
      // Step 1: Delete image file from server
      const res = await fetch(
      `${baseURL}api/media/delete/${fileId}`,
        {
          method: "DELETE",
        }
      );
  
      const result = await res.json();
  
      if (!res.ok || !result.success) {
        throw new Error("Failed to delete image from server");
      }
  
      console.log("Image deleted successfully:", result);
  
      // Step 2: Delete album document using _id
      const deleteRes = await fetch(
        `${baseURL}api/artists/delete/${data._id}`,
        {
          method: "DELETE",
        }
      );
  
      const deleteResult = await deleteRes.json();
  
      if (!deleteRes.ok || !deleteResult.success) {
        throw new Error("Failed to delete album record");
      }
  
      console.log("Album deleted successfully:", deleteResult);
  
      // Step 3: Refresh albums list
      const artistData = await getAllArtists();
      dispatch({
        type: actionType.SET_ALL_ARTISTS,
        allArtists: artistData.data,
      });
  
      showAlert("success");
      setTimeout(() => showAlert(null), 3000);
    } catch (error) {
      console.error("Error deleting album:", error.message);
      showAlert("error");
      setTimeout(() => showAlert(null), 3000);
    } finally {
      setIsDelete(false);
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
                onClick={() => deleteImage(data.fileId, data)}
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
