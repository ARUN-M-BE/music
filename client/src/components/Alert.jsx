import React from "react";
import { BsEmojiWink } from "react-icons/bs";
import { motion } from "framer-motion";

const Alert = ({ type }) => {
  return (
    <motion.div
      className={`fixed top-12 right-12 p-4 rounded-md backdrop:blur-2xl flex items-center justify-center shadow-md 
    ${type === "success" ? "bg-green-500" : "bg-red-500"}
     `}
      initial={{ opacity: 0,transform : "translateX(100%)" }}
      animate={{ opacity: 1,transform : "translateX(0%)" }}
      exit={{ opacity: 0,transform : "translateX(100%)" }}
      transition={{ duration: 0.5 }}
      key={type}
      // onClick={() => {
      //   setTimeout(() => {
      //     // Add logic to remove the alert after a certain time
      //   }, 3000);
      // }}
    >
      {type === "success" && (
        <p className="text-black font-semibold flex items-center justify-center gap-2">
          <BsEmojiWink  /> Successfully
        </p>
      )}
      {type === "error" && (
        <p className="text-white font-semibold flex items-center justify-center gap-2">
          <BsEmojiWink /> Something went wrong !
        </p>
      )}
    </motion.div>
  );
};

export default Alert;
