import React from "react";
import Header from "./Header";

const Home = () => {
  return (
    <>
      <div className="w-full h-auto flex flex-col items-center justify-center bg-primary dark:bg-gray-900 dark:text-white">
        <Header />
      </div>
    </>
  );
};

export default Home;
