import React, { useState } from "react";
import { useStateValue } from "../context/stateProvider";
import { motion } from "framer-motion";
import { ImBin } from "react-icons/im";
// import { FiEdit } from "react-icons/fi";

const DashboardUsers = () => {
  const [{ allUsers }] = useStateValue();

  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 items-center justify-center">
          <tr>
            {/* <th scope="col" className="px-6 py-3">
              S.No
            </th> */}
            <th scope="col" className="px-6 py-3">
              Name
            </th>
            <th scope="col" className="px-6 py-3">
              Verified
            </th>
            <th scope="col" className="px-6 py-3">
              Created
            </th>
            <th scope="col" className="px-6 py-3">
              Role
            </th>
            <th scope="col" className="px-6 py-3">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {allUsers &&
            allUsers.map((user, index) => (
              <DashboardUserRow
                key={user.id || index}
                data={user}
                index={index}
              />
            ))}
        </tbody>
      </table>
    </div>
  );
};

const DashboardUserRow = ({ data, index }) => {
  const [{ user }] = useStateValue();
  
  const [isUserRoal, setisUserRoal] = useState(false);
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: index * 0.2 }}
      className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 items-center justify-center"
    >
      {/* <td className="px-6 py-4">{index + 1}</td> */}
      <td className="px-6 py-4 flex-row flex items-center space-x-1">
        <img
          className="w-10 h-10 rounded-full object-cover gap-2"
          referrerPolicy="no-referrer"
          src={data.imageURL}
          alt={data.name}
        />
        <div>
          <p className="text-base font-semibold text-gray-900 dark:text-white">
            {data.name}
          </p>
          <p className="text-sm text-gray-500">{data.email}</p>
        </div>
      </td>
      <td className="px-6 py-4">{data.email_verified ? "Yes" : "No"}</td>
      <td className="px-6 py-4">
        {data.createdAt ? data.createdAt.split("T")[0] : "-"}
      </td>
      <td className=" relative px-6 py-4 flex-row flex items-center gap-4">
        <p className="text-base font-semibold text-gray-900 dark:text-white">
          {data.role}
        </p>
        {data._id !== user?.user._id && (
          <motion.p
            whileTap={{ scale: 0.75 }}
            onClick={() => setisUserRoal(true)}
            className="text-[10px] font-semibold px-3 text-textColor text-center rounded-sm bg-purple-200 hover:shadow-md cursor-pointer ease-in-out transition-all"
          >
            {data.role === "admin" ? "Member" : "Admin"}
          </motion.p>
        )}
      </td>
      <td className="px-6 py-4">
        {/* <FiEdit className="p-2 text-block hover:bg-blue-600 cursor-pointer ease-in-out  text-4xl" /> */}
        <ImBin className="p-2 text-block hover:bg-red-600 cursor-pointer ease-in-out text-4xl space-x-1" />
      </td>
      {isUserRoal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: index * 0.2 }}
          className="absolute top-30 right-10 bottom-0 left-0 z-10 flex flex-col gap-2 items-start rounded-md shadow-xl"
        >
          <div className=" bg-white p-4 rounded-lg shadow-lg">
            <p className="text-2xl font-semibold text-center text-gray-900 dark:text-white">
              Are you sure{" "}
              <span>{data.role === "admin" ? "Member" : "Admin"}</span> ?
            </p>
            <div className="flex justify-between items-center gap-4 mt-4">
              <button className="w-1/2 p-2 bg-red-500 text-white rounded-lg">
                Yes
              </button>
              <button className="w-1/2 p-2 bg-green-500 text-white rounded-lg">
                No
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.tr>
  );
};

export default DashboardUsers;
