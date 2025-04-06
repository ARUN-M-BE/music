import React from "react";
import { IoChevronDown } from "react-icons/io5";
import { motion } from "framer-motion";
import { useStateValue } from "../context/stateProvider";
import { actionType } from "../context/reducer";


const FillterButton = ({ flag, filterData }) => {
  const [filterName, setFilterName] = React.useState(null);
  const [filterMenu, setFilterMenu] = React.useState(null);

  const [{ filterArtist, filterAlbum, filterLanguage, filterTerm }, dispatch] =
    useStateValue();

  const updateFilterButton = (name) => {
    setFilterName(name);
    setFilterMenu(false);

    if (flag === "Artists") {
      dispatch({
        type: actionType.SET_FILTER_ARTIST,
        filterArtist: name,
      });
    }
    if (flag === "Albums") {
      dispatch({
        type: actionType.SET_FILTER_ALBUM,
        filterAlbum: name,
      });
    }
    if (flag === "Language") {
      dispatch({
        type: actionType.SET_FILTER_LANGUAGE,
        filterLanguage: name,
      });
    }
    if (flag === "Category") {
      dispatch({
        type: actionType.SET_FILTER_TERM,
        filterTerm: name,
      });
    }
  };

  return (
    <>
      <div className="border border-gray-300 rounded-md px-4 py-1 relative cursor-pointer hover:border-gray-400 flex items-center justify-center gap-2  ">
        <p
          className="text-base text-textColor font-semibold"
          onClick={() => {
            setFilterMenu(!filterMenu);
          }}
        >
          {!filterName && flag}
          {filterName && (
            <>
              {filterName.length > 15
                ? `${filterName.slice(0, 10)}...`
                : filterName}
            </>
          )}
        </p>
        <IoChevronDown
          className={`duration-170 ease-in-out transition-all  ${
            filterMenu ? "rotate-180" : "rotate-0"
          } `}
        />{" "}
        {filterData && filterMenu && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.2 }}
            className="w-48 z-50 backdrop-blur-sm max-h-44 overflow-y-scroll scrollbar-thin scrollbar-track-gray-400 scrollbar-thumb-gray-300 py-2 flex flex-col shadow-md rounded-md top-8 left-0 absolute dark:bg-gray-800 dark:hover:text-blue-300 border bg-transparent"
          >
            {filterData?.map((data) => (
              <div
                key={data.name}
                className="flex items-center gap-2 text-base text-textColor font-semibold px-4 py-1 hover:bg-gray-200 rounded-md cursor-pointer dark:bg-carddark dark:text-white dark:hover:bg-cardhoverdark  "
                onClick={() => updateFilterButton(data.name)}
              >
                {(flag === "Artists" || flag === "Albums") && (
                  <img
                    src={data.imageURL}
                    alt={data.name}
                    className="flex w-8 h-8 rounded-full object-cover mr-2"
                  />
                )}
                <p className="w-full">
                  {data.name.length > 15
                    ? `${data.name.slice(0, 15)}...`
                    : data.name}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </>
  );
};

export default FillterButton;
