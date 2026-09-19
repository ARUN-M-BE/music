import React, { useEffect, useState } from "react";
import { useStateValue } from "../context/stateProvider";
import { getAllUsers, changingUserRole, removeUser } from "../../api";
import { actionType } from "../context/reducer";
import { motion } from "framer-motion";
import { MdDelete } from "react-icons/md";
import { FiUserCheck, FiUserX } from "react-icons/fi";

const DashboardUsers = () => {
  const [{ allUsers, user }, dispatch] = useStateValue();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!allUsers) {
      setLoading(true);
      getAllUsers()
        .then((data) => {
          if (data && data.data) {
            dispatch({
              type: actionType.SET_ALL_USERS,
              allUsers: data.data,
            });
          }
        })
        .finally(() => setLoading(false));
    }
  }, [allUsers, dispatch]);

  const handleRoleChange = async (userId, currentRole) => {
    const newRole = currentRole === "admin" ? "member" : "admin";
    const res = await changingUserRole(userId, newRole);
    if (res) {
      getAllUsers().then((data) => {
        if (data && data.data) {
          dispatch({
            type: actionType.SET_ALL_USERS,
            allUsers: data.data,
          });
        }
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      const res = await removeUser(userId);
      if (res) {
        getAllUsers().then((data) => {
          if (data && data.data) {
            dispatch({
              type: actionType.SET_ALL_USERS,
              allUsers: data.data,
            });
          }
        });
      }
    }
  };

  return (
    <div className="w-full p-4 flex flex-col items-center justify-center">
      <div className="relative w-full py-4 min-h-[400px] border border-gray-300 dark:border-gray-700 rounded-md bg-transparent backdrop-blur-md flex flex-col items-center justify-start gap-3 shadow-md">
        <div className="w-full flex items-center justify-between px-6 py-2 border-b border-gray-300 dark:border-gray-700">
          <p className="text-sm font-semibold text-textColor dark:text-gray-200">
            Total Users : <span className="text-base font-bold text-textColor dark:text-white">{allUsers?.length || 0}</span>
          </p>
        </div>

        {/* User List Header */}
        <div className="w-full min-w-[750px] flex items-center justify-between px-6 py-2 bg-lightOverlay dark:bg-gray-800 rounded-md">
          <p className="text-sm font-semibold text-textColor dark:text-gray-300 w-275 min-w-[160px] text-center">Image</p>
          <p className="text-sm font-semibold text-textColor dark:text-gray-300 w-275 min-w-[160px] text-center">Name</p>
          <p className="text-sm font-semibold text-textColor dark:text-gray-300 w-275 min-w-[160px] text-center">Email</p>
          <p className="text-sm font-semibold text-textColor dark:text-gray-300 w-275 min-w-[160px] text-center">Role</p>
          <p className="text-sm font-semibold text-textColor dark:text-gray-300 w-275 min-w-[160px] text-center">Action</p>
        </div>

        {/* User Rows */}
        {loading ? (
          <div className="py-8 text-textColor dark:text-gray-300 animate-pulse">Loading users...</div>
        ) : allUsers && allUsers.length > 0 ? (
          allUsers.map((userItem, i) => (
            <motion.div
              key={userItem._id || i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
              className="w-full min-w-[750px] flex items-center justify-between px-6 py-3 bg-cardOverlay dark:bg-gray-900 hover:bg-card dark:hover:bg-gray-800 rounded-md shadow-sm transition-all"
            >
              <div className="w-275 min-w-[160px] flex justify-center">
                <img
                  src={userItem.imageURL || "/default-avatar.png"}
                  alt={userItem.name}
                  className="w-10 h-10 object-cover rounded-full shadow-md"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                  }}
                />
              </div>
              <p className="text-sm font-semibold text-textColor dark:text-gray-200 w-275 min-w-[160px] text-center truncate">{userItem.name}</p>
              <p className="text-sm text-textColor dark:text-gray-400 w-275 min-w-[160px] text-center truncate">{userItem.email}</p>
              <div className="w-275 min-w-[160px] flex items-center justify-center gap-2">
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${userItem.role === "admin" ? "bg-red-500 text-white" : "bg-blue-500 text-white"}`}>
                  {userItem.role}
                </span>
                <button
                  onClick={() => handleRoleChange(userItem._id, userItem.role)}
                  className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition"
                  title="Toggle Role"
                >
                  {userItem.role === "admin" ? <FiUserX className="text-red-500" /> : <FiUserCheck className="text-green-500" />}
                </button>
              </div>
              <div className="w-275 min-w-[160px] flex justify-center">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => handleDeleteUser(userItem._id)}
                  className="p-2 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-800/60 text-red-600 dark:text-red-400 transition"
                  title="Delete User"
                >
                  <MdDelete className="text-lg" />
                </motion.button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-8 text-textColor dark:text-gray-400">No users found</div>
        )}
      </div>
    </div>
  );
};

export default DashboardUsers;
