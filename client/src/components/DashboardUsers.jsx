import React from 'react';
import { useStateValue } from '../context/stateProvider';
import { motion } from 'framer-motion';

const DashboardUsers = () => {
  const [{ allUsers }] = useStateValue();

  return (
    <>
      <div className="flex w-full p-4 items-center justify-center flex-col ">
        {/* filter */}
        <div className="relative w-full py-12 min-h-[400px] overflow-x-hidden my-4 flex flex-col items-center justify-start border p-4 border-gray-300 rounded-md gap-3">

          <div className="top-4 left-4 absolute">
            <p className="text-sm font-semibold">
              Count : <span className="text-xl font-bold text-textColor">{allUsers ? allUsers.length : 0}</span>
            </p>
          </div>

          {/* header */}
          <div className="flex w-full min-w-[750px] items-center justify-between">
            <p className="text-textColor text-sm font-semibold w-275 min-w-[160px] text-center">Image</p>
            <p className="text-textColor text-sm font-semibold w-275 min-w-[160px] text-center">Name</p>
            <p className="text-textColor text-sm font-semibold w-275 min-w-[160px] text-center">Email</p>
            <p className="text-textColor text-sm font-semibold w-275 min-w-[160px] text-center">Verified</p>
            <p className="text-textColor text-sm font-semibold w-275 min-w-[160px] text-center">Created</p>
            <p className="text-textColor text-sm font-semibold w-275 min-w-[160px] text-center">Role</p>
            <p className="text-textColor text-sm font-semibold w-275 min-w-[160px] text-center">Action</p>
          </div>

          {/* user cards */}
          <div className="w-full flex flex-col gap-2">
            {allUsers && allUsers.map((user, index) => (
              <DashboardUserCard key={user.id || index} data={user} index={index} />
            ))}
          </div>

        </div>
      </div>
    </>
  );
}

export const DashboardUserCard = ({ data, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative flex w-full items-center justify-between rounded-md py-4 bg-lightOverlay cursor-pointer hover:bg-card hover:shadow-md"
    >
      <div className="w-275 min-w-[160px] flex items-center justify-center">
        <img src={data.image} alt={data.name} className="w-10 h-10 rounded-md object-cover min-w-[40px] shadow-md" />
      </div>
      <p className="w-275 min-w-[160px] text-center">{data.name}</p>
      <p className="w-275 min-w-[160px] text-center">{data.email}</p>
      <p className="w-275 min-w-[160px] text-center">{data.verified ? "Yes" : "No"}</p>
      <p className="w-275 min-w-[160px] text-center">{data.createdAt ? data.createdAt.split('T')[0] : "-"}</p>
      <p className="w-275 min-w-[160px] text-center">{data.role}</p>
      <p className="w-275 min-w-[160px] text-center">
        {/* Action button example */}
        <button className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600">Delete</button>
      </p>
    </motion.div>
  );
}

export default DashboardUsers;
