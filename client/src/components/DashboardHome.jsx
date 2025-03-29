import React, { useEffect } from "react";
import { useStateValue } from '../context/StateProvider';
import { getAllUsers } from '../../api';
import { actionType } from "../context/reducer";

export const DashboardCard = ({ icon, name, count }) => {
  return (
    <div className="w-40 h-auto bg-dark text-block p-4 rounded-lg shadow-md flex items-center justify-evenly flex-col gap-4">
      <div className="text-4xl">{icon}</div>
      <div className="text-2xl">{name}</div>
      <div className="text-lg">{count}</div>
    </div>
  );
};

const DashboardHome = () => {
  const [{ allUsers, allAlbums, allArtists, allSongs }, dispatch] = useStateValue();

  useEffect(() => {
    if (!allUsers) {
      getAllUsers().then((data) => {
        dispatch({
          type: actionType.SET_ALL_USERS,
          allUsers: data.data,
        });
      });
    }
  }, []);

  return (
    <>
      <div className="w-full p-6 flex items-center justify-center flex-wrap gap-5">
        <DashboardCard icon="👤" name="Users" count={allUsers ? allUsers.length : 0} />
        <DashboardCard icon="🎵" name="Songs" count={allSongs ? allSongs.length : 0} />
        <DashboardCard icon="👨‍🎤" name="Artists" count={allArtists ? allArtists.length : 0} />
        <DashboardCard icon="💽" name="Albums" count={allAlbums ? allAlbums.length : 0} />
      </div>
    </>
  );
};

export default DashboardHome;
