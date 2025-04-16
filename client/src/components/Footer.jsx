import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white py-8 w-full h-full bottom-0 top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center border-b border-gray-700 pb-6 mb-6">
          {/* Logo and Name */}
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            {/* Replace with your actual logo */}
            <div className="bg-white rounded-full w-10 h-10 flex items-center justify-center text-black font-bold">
              GM
            </div>
            <span className="text-lg font-semibold"> Good Music</span>
          </div>

          {/* Navigation Links */}
          <div className="flex space-x-6 text-sm">
            <Link to="/about" className="hover:underline border-r border-gray-700 pr-4">
              About
            </Link>
            <Link to="/projects" className="hover:underline border-r border-gray-700 pr-4">
              Projects
            </Link>
            <Link to="/contact" className="hover:underline">
              Contact
            </Link>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="text-center text-sm text-gray-400">
          &copy; {currentYear} <Link to="https://arunm.pages.dev">Arun M</Link> . All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
