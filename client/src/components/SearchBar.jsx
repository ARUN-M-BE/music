import React, { useState } from "react";
import { IoSearch, IoClose } from "react-icons/io5";
import { useStateValue } from "../context/stateProvider";
import { actionType } from "../context/reducer";

const SearchBar = () => {
  const [isFocus, setIsFocus] = useState(false);
  const [{ allSongs }, dispatch] = useStateValue();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (value) => {
    setSearchTerm(value);
    
    if (value === "") {
      dispatch({
        type: actionType.SET_FILTERED_SONGS,
        filteredSongs: null,
      });
      return;
    }

    const filtered = allSongs.filter(song => 
      song.name.toLowerCase().includes(value.toLowerCase()) ||
      song.artist.toLowerCase().includes(value.toLowerCase()) ||
      song.album.toLowerCase().includes(value.toLowerCase()) ||
      song.language.toLowerCase().includes(value.toLowerCase()) ||
      song.category.toLowerCase().includes(value.toLowerCase())
    );

    dispatch({
      type: actionType.SET_FILTERED_SONGS,
      filteredSongs: filtered,
    });
  };

  const clearSearch = () => {
    setSearchTerm("");
    dispatch({
      type: actionType.SET_FILTERED_SONGS,
      filteredSongs: null,
    });
  };

  return (
    <div className="w-100 my-4 h-24 flex items-center justify-center">
      <div className="w-full md:w-2/3 bg-gradient-to-b from-cyan-500 to-blue-500 shadow-lg rounded-full flex items-center px-4 py-2">
        <IoSearch className="text-xl text-textColor mr-2" />
        <input
          type="text"
          value={searchTerm}
          className={`w-full h-full bg-gradient-to-b from-cyan-500 to-blue-500 text-textColor border-none outline-none placeholder-gray-500 ${
            isFocus ? "border-gray-50" : "border-gray-300"
          } dark:border-green-50 dark:text-white placeholder:dark:text-white dark:shadow-white`}
          placeholder="Search songs..."
          onChange={(e) => handleSearch(e.target.value)}
          onBlur={() => setIsFocus(false)}
          onFocus={() => setIsFocus(true)}
        />
        {searchTerm && (
          <button onClick={clearSearch} className="text-textColor hover:text-white transition-all">
            <IoClose className="text-xl" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;