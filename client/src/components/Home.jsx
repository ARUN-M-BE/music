import React from "react";
import Header from "./Header";
import HeaderSection from "./HeaderSection";
import Footer from "./Footer";
import { motion } from "framer-motion";
import {
  FaMusic,
  FaHeadphones,
  FaMicrophone,
  FaRegHeart,
} from "react-icons/fa";


const Home = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const featureCards = [
    {
      icon: <FaMusic className="text-3xl text-purple-500" />,
      title: "Curated Playlists",
      description:
        "Discover handpicked collections for every mood and occasion",
    },
    {
      icon: <FaHeadphones className="text-3xl text-blue-500" />,
      title: "Hi-Fi Audio",
      description:
        "Experience studio-quality sound with our advanced audio engine",
    },
    {
      icon: <FaMicrophone className="text-3xl text-pink-500" />,
      title: "Artist Focus",
      description: "Exclusive content from your favorite creators",
    },
  ];

  return (
    <div className="w-full min-h-screen flex flex-col items-center bg-gradient-to-br from-gray-800 to-purple-900 text-white dark:bg-gray-900 dark:text-white">
      <Header />
      <main className="@container w-full max-w-7xl px-4 md:px-6 py-4 flex flex-col items-center">
        <div className="h-[50px] w-full mt-[60px]"></div>
        {/* header content - visible on all screens */}
        <HeaderSection />

        {/* Main content */}
        <div className="relative my-4 md:my-6 w-full flex flex-col items-center justify-center rounded-md border border-gray-300">
          <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
            {/* Hero Section */}
            <motion.div
              className="relative w-full max-w-6xl mx-auto mb-16 p-8 md:p-12 rounded-2xl bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-gray-700 overflow-hidden"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative z-10">
                <motion.h1
                  className="text-4xl md:text-6xl font-bold text-white mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Discover Your{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300">
                    Sound
                  </span>
                </motion.h1>
                <motion.p
                  className="text-xl text-gray-300 mb-8 max-w-2xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Immerse yourself in a world of music tailored just for you.
                  Millions of songs at your fingertips.
                </motion.p>
                <motion.button
                  className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-purple-500/30 flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Start Listening Now
                  <FaHeadphones />
                </motion.button>
              </div>

              {/* Animated background elements */}
              <motion.div
                className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-purple-500/20 blur-xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>

            {/* Features Section */}
            <motion.div
              className="max-w-6xl mx-auto"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.h2
                className="text-3xl md:text-4xl font-bold text-white text-center mb-12"
                variants={itemVariants}
              >
                Why{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  Choose Us
                </span>
              </motion.h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                {featureCards.map((feature, index) => (
                  <motion.div
                    key={index}
                    className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 hover:border-purple-500 transition-all"
                    variants={itemVariants}
                    whileHover={{ y: -10 }}
                  >
                    <div className="mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-300">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Trending Now Section */}
            <motion.div
              className="max-w-6xl mx-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  Trending Now
                </h2>
                <button className="text-purple-400 hover:text-purple-300 flex items-center gap-1">
                  View All
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((item) => (
                  <motion.div
                    key={item}
                    className="bg-gray-800/50 rounded-lg overflow-hidden group"
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className=" aspect-square bg-gray-700 relative overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FaMusic className="text-4xl text-gray-500" />
                      </div>
                      <button className="absolute bottom-2 right-2 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <FaRegHeart />
                      </button>
                      
                    </div>
                    <div className="p-3">
                      <h3 className="text-white font-medium truncate">
                        Poplur{" "}
                        {item}
                      </h3>
                      <p className="text-gray-400 text-sm truncate">
                        Artist
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      {/* Footer content - visible on all screens */}
      <Footer />
    </div>
  );
};

export default Home;
