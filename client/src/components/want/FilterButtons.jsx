import React, { useEffect } from "react";
import { MdClearAll } from "react-icons/md";
import { motion } from "framer-motion";
import { useStateValue } from "../context/stateProvider";
import { actionType } from "../context/reducer";
// import { getAllArtist, getAllAlbums } from "../../api";

// Dummy filters for category and language
const filters = [
  { id: 1, name: "Pop", value: "pop" },
  { id: 2, name: "Hip-Hop", value: "hiphop" },
  { id: 3, name: "Jazz", value: "jazz" },
  { id: 4, name: "Rock", value: "rock" },
];

const filterByLanguage = [
  { id: 1, name: "English", value: "english" },
  { id: 2, name: "Tamil", value: "tamil" },
  { id: 3, name: "Hindi", value: "hindi" },
];

const Filter = ({ setFilteredSongs }) => {
  const [{ filterTerm, artists, allAlbums }, dispatch] = useStateValue();

  useEffect(() => {
    if (!artists) {
      getAllArtist().then((data) => {
        dispatch({ type: actionType.SET_ARTISTS, artists: data.data });
      });
    }

    if (!allAlbums) {
      getAllAlbums().then((data) => {
        dispatch({ type: actionType.SET_ALL_ALBUMNS, allAlbums: data.data });
      });
    }
  }, []);

  const updateFilter = (value) => {
    dispatch({
      type: actionType.SET_FILTER_TERM,
      filterTerm: value,
    });
  };

  const clearAllFilter = () => {
    setFilteredSongs(null);
    dispatch({ type: actionType.SET_ARTIST_FILTER, artistFilter: null });
    dispatch({ type: actionType.SET_LANGUAGE_FILTER, languageFilter: null });
    dispatch({ type: actionType.SET_ALBUM_FILTER, albumFilter: null });
    dispatch({ type: actionType.SET_FILTER_TERM, filterTerm: null });
  };

  return (
    <div className="w-full my-4 px-6 py-4 flex items-center justify-start md:justify-center gap-10 flex-wrap">
      <FilterButtons filterData={artists} flag="Artist" />

      <div className="flex items-center gap-6 mx-4">
        {filters.map((data) => (
          <p
            key={data.id}
            onClick={() => updateFilter(data.value)}
            className={`text-base ${
              data.value === filterTerm ? "font-semibold" : "font-normal"
            } text-textColor cursor-pointer hover:font-semibold transition-all duration-100 ease-in-out`}
          >
            {data.name}
          </p>
        ))}
      </div>

      <FilterButtons filterData={allAlbums} flag="Albums" />
      <FilterButtons filterData={filterByLanguage} flag="Language" />

      <motion.i
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileTap={{ scale: 0.75 }}
        onClick={clearAllFilter}
      >
        <MdClearAll className="text-textColor text-xl cursor-pointer" />
      </motion.i>
    </div>
  );
};

// Mini Filter Button Component
const FilterButtons = ({ filterData, flag }) => {
  const [, dispatch] = useStateValue();

  const handleClick = (value) => {
    switch (flag) {
      case "Artist":
        dispatch({ type: actionType.SET_ARTIST_FILTER, artistFilter: value });
        break;
      case "Albums":
        dispatch({ type: actionType.SET_ALBUM_FILTER, albumFilter: value });
        break;
      case "Language":
        dispatch({ type: actionType.SET_LANGUAGE_FILTER, languageFilter: value });
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex items-center gap-4">
      {filterData?.map((item) => (
        <p
          key={item.id || item.value}
          onClick={() => handleClick(item.name || item.value)}
          className="text-sm text-textColor hover:font-semibold cursor-pointer"
        >
          {item.name}
        </p>
      ))}
    </div>
  );
};

export default Filter;
