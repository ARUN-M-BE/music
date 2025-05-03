import React from "react";
import { useNavigate } from "react-router-dom";
import { useStateValue } from "../context/stateProvider";
import Header from "./Header";
import Footer from "./Footer";

const Profile = () => {
  const navigate = useNavigate();
  const [{ user }, dispatch] = useStateValue();

  if (!user) {
    return <div>Loading user data...</div>;
  }

  return (
    <>
      <div className="w-full min-h-screen flex flex-col items-center bg-gradient-to-br from-gray-800 to-purple-900 text-white">
        <Header />
        <main className="@container w-full max-w-7xl mt-[60px] mb-16 px-4 md:px-6 py-4 flex flex-col items-center">
          {user ? (
            <div className="max-w-md mx-auto mt-10 p-6 bg-gradient-to-t from-fuchsia-500 to-pink-400 text-black rounded-lg shadow-md">
              <h1 className="text-2xl font-bold mb-6 text-center">PROFILE</h1>
              <div className="flex flex-col items-center mb-6">
                <img
                  src={user?.user?.imageURL}
                  className="w-32 h-32 rounded-full object-cover mb-4"
                  alt="profile"
                  referrerPolicy="no-referrer"
                />
                <h2 className="text-xl font-semibold">
                  {user?.user?.name}
                </h2>
              </div>
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <p className="text-sm text-gray-700">Email</p>
                  <p className="font-medium">
                    {user?.user?.email}
                    {user?.user?.email_verified && (
                      <span className="ml-2 text-green-600 text-sm">
                        Verfied
                      </span>
                    )}
                  </p>
                </div>

                <div className="border-b pb-2">
                  <p className="text-sm text-gray-700">User ID</p>
                  <p className="font-medium">{user?.user?.user_id}</p>
                </div>

                <div className="border-b pb-2">
                  <p className="text-sm text-gray-700">Role</p>
                  <p className="font-medium capitalize">{user?.user?.role}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 pt-6 border-t border-gray-700"></div>
          )}
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Profile;
