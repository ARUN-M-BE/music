import React from "react";
import Header from "./Header";
import HeaderSection from "./HeaderSection";
import Footer from "./Footer";

const Home = () => {


  return (
    <div className="w-full min-h-screen flex flex-col items-center bg-primary dark:bg-gray-900 dark:text-white">
      <Header />
      <main className="@container w-full max-w-7xl mt-[60px] mb-16 px-4 md:px-6 py-4 flex flex-col items-center">
        {/* header content - visible on all screens */}
        <HeaderSection />

        {/* Main content */}
        <div className="relative my-4 md:my-6 w-full flex flex-col items-center justify-center rounded-md border border-gray-300">
          <h3>body content</h3>
        </div>
      </main>
      {/* Footer content - visible on all screens */}
      <Footer/>
    </div>
  );
};

export default Home;