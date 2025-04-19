import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import { FaHeadphones, FaHeart, FaCode, FaMusic } from "react-icons/fa";
import { MdHighQuality } from "react-icons/md";
import { RiPlayListFill } from "react-icons/ri";

const About = () => {
  return (
    <div className="w-full min-h-screen flex flex-col items-center bg-primary dark:bg-gray-900 dark:text-white">
      <Header />
      <main className="@container w-full max-w-7xl mt-[60px] mb-16 px-4 md:px-6 py-4 flex flex-col items-center">
        {/* Main content */}
        <div className="relative my-4 md:my-6 w-full flex flex-col items-center justify-center rounded-md border border-gray-300">
          <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900 text-white p-6">
            {/* Hero Section */}
            <section className="max-w-6xl mx-auto py-12 md:py-20">
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300">
                  Good-Music
                </h1>
                <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
                  Where Music Meets Soul - Curated by Arun M
                </p>
              </div>

              {/* App Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                {[
                  {
                    icon: <FaHeadphones size={40} />,
                    title: "Immersive Audio",
                    desc: "Studio-quality sound with advanced audio processing",
                  },
                  {
                    icon: <RiPlayListFill size={40} />,
                    title: "Smart Playlists",
                    desc: "Upload your Own playlists that adapt to your mood",
                  },
                  {
                    icon: <MdHighQuality size={40} />,
                    title: "Lossless Quality",
                    desc: "Experience music the way artists intended",
                  },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="bg-gray-800 bg-opacity-50 p-6 rounded-xl hover:bg-purple-800 transition-all duration-300 hover:scale-105"
                  >
                    <div className="text-purple-400 mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-gray-300">{feature.desc}</p>
                  </div>
                ))}
              </div>

              {/* Creator Story */}
              <div className="bg-gray-800 bg-opacity-30 backdrop-blur-lg rounded-2xl p-8 md:p-12 mb-16 border border-purple-500 border-opacity-30">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                      <FaCode className="text-purple-400" /> The Creator's
                      Vision
                    </h2>
                    <p className="text-lg text-gray-300 mb-4">
                      Hi, I'm{" "}
                      <span className="text-purple-300 font-semibold">
                        Arun M
                      </span>
                      , a music enthusiast and developer who believes in the
                      transformative power of sound.
                    </p>
                    <p className="text-lg text-gray-300 mb-4">
                      Good-Music was born from countless nights of coding while
                      listening to music, realizing there should be an app that
                      understands both technology and the soul of music.
                    </p>
                    <p className="text-lg text-gray-300">
                      This isn't just another music player - it's a carefully
                      crafted experience designed for those who truly{" "}
                      <FaHeart className="inline text-pink-400" /> music.
                    </p>
                  </div>
                  <div className="flex-1">
                    <div className="bg-purple-900 bg-opacity-40 p-4 rounded-xl">
                      <div className="aspect-w-1 aspect-h-1 bg-gray-700 rounded-lg overflow-hidden">
                        {/* Placeholder for creator image or app screenshot */}
                        <div className="w-full h-full flex items-center justify-center">
                          <FaMusic
                            size={80}
                            className="text-purple-300 opacity-70"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tech Stack */}
              <div className="mb-16">
                <h2 className="text-3xl font-bold mb-8 text-center">
                  Powered By
                </h2>
                <div className="flex flex-wrap justify-center gap-6">
                  {[
                    "React",
                    "Node.js",
                    "Tailwind CSS",
                    "MongoDB",
                    "Audio Processing AI",
                    "Cloud Storage",
                  ].map((tech, index) => (
                    <div
                      key={index}
                      className="px-6 py-3 bg-gray-800 rounded-full text-purple-300 font-medium"
                    >
                      {tech}
                    </div>
                  ))}
                </div>
              </div>

              {/* Call to Action */}
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-6">
                  Ready to Experience Music Differently?
                </h2>
                <button className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-bold hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-purple-500/30">
                  Get Good-Music Now
                </button>
                <p className="mt-4 text-gray-400 text-sm">
                  Available on WebApp
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
