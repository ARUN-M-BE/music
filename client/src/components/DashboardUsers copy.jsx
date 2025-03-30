import React from "react";
import { useStateValue } from "../context/stateProvider";
import { motion } from "framer-motion";

const DashboardUsers = () => {
  const [{ allUsers }] = useStateValue();

  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
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
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
    >
      <td className="px-6 py-4 flex items-center space-x-1">
        <img
          className="w-10 h-10 rounded-full object-cover"
          src={data.image}
          alt={data.name}
        />
        <div>
          <p className="text-base font-semibold text-gray-900 dark:text-white">
            {data.name}
          </p>
          <p className="text-sm text-gray-500">{data.email}</p>
        </div>
      </td>
      <td className="px-6 py-4">{data.verified ? "Yes" : "No"}</td>
      <td className="px-6 py-4">
        {data.createdAt ? data.createdAt.split("T")[0] : "-"}
      </td>
      <td className="px-6 py-4">{data.role}</td>
      <td className="px-6 py-4">
        <button className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600">
          Delete
        </button>
      </td>
    </motion.tr>
  );
};

export default DashboardUsers;
