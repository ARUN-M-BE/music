import React from "react";
import { motion } from "framer-motion";
import { useStateValue } from "../context/stateProvider";
import { actionType } from "../context/reducer";
import { IoTrash } from "react-icons/io5";

const ArtistCard = ({ data, index }) => {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
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
          <p className="block text-sm text-gray-400 my-1 font-semibold"></p>
           
          <p className="text-sm text-textColor font-semibold">{data?.album}</p>
        </div>
        <div className="w-full absolute bottom-2 right-2 flex items-center justify-between px-4 ">
          <motion.i whileTap={{scale:0.75}} className="text-base text-red-400 hover:text-red-600 drop-shadow-md ">
            <IoTrash />
          </motion.i>
        </div>
      </motion.div>
    </>
  );
};

export default ArtistCard;
