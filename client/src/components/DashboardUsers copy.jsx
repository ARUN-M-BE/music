import React, { useState } from "react";
import { useStateValue } from "../context/stateProvider";
import { motion } from "framer-motion";
import { ImBin } from "react-icons/im";
import { changingUserRole, getAllUsers, removeUser } from "../../api";
import { actionType } from "../context/reducer";
// import { FiEdit } from "react-icons/fi";

const DashboardUsers = () => {
  const [{ allUsers }] = useStateValue();

  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg dark:bg-gray-700 h-[480px]">
      <table className=" w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 items-center justify-center">
          <tr className="justify-center items-center text-center ">
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
  const [{ user, allUsers }, dispatch] = useStateValue();

  const [isUserRole, setisUserRole] = useState(false);
  const updateRole = (userId, role) => {
    setisUserRole(false);
    changingUserRole(userId, role).then((res) => {
      if (res) {
        getAllUsers().then((data) => {
          dispatch({
            type: actionType.SET_ALL_USERS,
            allUsers: data.data,
          });
        });
      }
    });
  };

  const deleteUser = (userId) => {
    removeUser(userId).then((res) => {
      if (res) {
        getAllUsers().then((data) => {
          dispatch({
            type: actionType.SET_ALL_USERS,
            allUsers: data.data,
          });
        });
      }
    });
  };
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: index * 0.2 }}
      className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 items-center justify-center"
    >
      {/* <td className="px-6 py-4">{index + 1}</td> */}
      <td className="px-6 py-4 flex-row flex justify-center items-center space-x-1">
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
      <td className="px-6 py-4 justify-center items-center text-center">
        {data.email_verified ? "Yes" : "No"}
      </td>
      <td className="px-6 py-4 justify-center items-center text-center">
        {data.createdAt ? data.createdAt.split("T")[0] : "-"}
      </td>
      <td className=" relative px-6 py-4 flex-row flex items-center gap-4 justify-center">
        <p className="text-base font-semibold text-gray-900 dark:text-white">
          {data.role}
        </p>
        {data._id !== user?.user._id && (
          <motion.p
            whileTap={{ scale: 0.75 }}
            onClick={() => setisUserRole(true)}
            className="text-[10px] font-semibold px-3 text-textColor text-center rounded-sm bg-purple-200 dark:text-black hover:text-red-500 cursor-pointer ease-in-out transition-all"
          >
            {data.role === "admin" ? "member" : "admin"}
          </motion.p>
        )}

        {isUserRole && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="absolute top-6 right-4 bottom-0 left-0 z-10 flex flex-col gap-2 items-start rounded-md shadow-xl"
          >
            <div className=" bg-white p-4 rounded-lg shadow-lg dark:bg-gray-600">
              <p className="text-[12px] font-semibold text-center text-gray-900 dark:text-white py-3">
                Are you sure{" "}
                <span>{data.role === "admin" ? "member" : "admin"}</span> ?
              </p>
              <div className="flex items-center gap-3 px-4">
                <motion.button
                  whileTap={{ scale: 0.75 }}
                  className="outline-none border-none text-[12px] px-4 py-1 rounded-md bg-blue-200 text-black dark:text-black"
                  onClick={() =>
                    updateRole(
                      data._id,
                      data.role === "admin" ? "member" : "admin"
                    )
                  }
                >
                  Yes
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.75 }}
                  className="outline-none border-none text-[12px] px-4 py-1 rounded-md bg-gray-200 text-black dark:text-black "
                  onClick={() => setisUserRole(false)}
                >
                  No
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </td>
      <td className="px-6 py-4">
        {/* <FiEdit className="p-2 text-block hover:bg-blue-600 cursor-pointer ease-in-out  text-4xl" /> */}
        {data._id !== user?.user._id && (
          <motion.div
            whileTap={{ scale: 0.75 }}
            className=" justify-center items-center flex "
            onClick={() => deleteUser(data._id)}
          >
            <ImBin className="text-red-400 hover:text-red-800 hover:bg-no-repeat dark:hover:text-red-200 p-2 cursor-pointer ease-in-out space-x-1 text-4xl" />
          </motion.div>
        )}
      </td>
    </motion.tr>
  );
};

export default DashboardUsers;
