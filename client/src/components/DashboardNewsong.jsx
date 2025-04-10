"use client";
// User Browser ----> Our Own server  ----> ImageKit Server
// User Browser ----> ImageKit Server

import React, { useEffect, useState } from "react";
import { IKContext, IKUpload } from "imagekitio-react";
import { useStateValue } from "../context/stateProvider";
import { actionType } from "../context/reducer";
import { BiCloudUpload } from "react-icons/bi";
import { MdDelete } from "react-icons/md";
import FillterButton from "./FillterButton";
import {
  getAllSongs,
  getAllAlbums,
  getAllArtists,
  saveNewSong,
  saveNewAlbum,
  saveNewArtist,
} from "../../api";
import { filterByLanguage, filter } from "../utils/FillterButton";

// import AlertSuccess from "./AlertSuccess";
// import AlertError from "./AlertError";

import { motion } from "framer-motion";

// ENV
const urlEndpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT;
const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;

const DashboardNewsong = () => {
  const [SongName, setSongName] = useState("");
  const [songImageCover, setSongImageCover] = useState(null); // image URL
  const [imageFileId, setImageFileId] = useState(null);
  const [imageProgress, setImageProgress] = useState(0);
  const [isImageLoad, setIsImageLoad] = useState(false);

  const [audioImageCover, setAudioImageCover] = useState(null); // image URL
  const [audioFileId, setAudioFileId] = useState(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [isAudioLoad, setIsAudioLoad] = useState(false);

  const [artistImageCover, setArtistImageCover] = useState(null); // image URL
  const [artistFileId, setArtistFileId] = useState(null);
  const [artistProgress, setArtistProgress] = useState(0);
  const [isArtistLoad, setIsArtistLoad] = useState(false);
  const [artistName, setArtistName] = useState("");
  const [twetter, setTwetter] = useState("");
  const [instagram, setInstagram] = useState("");

  const [albumImageCover, setAlbumImageCover] = useState(null); // image URL
  const [albumFileId, setAlbumFileId] = useState(null);
  const [albumProgress, setAlbumProgress] = useState(0);
  const [isAlbumLoad, setIsAlbumLoad] = useState(false);
  const [albumName, setAlbumName] = useState("");

  const [
    {
      allArtists,
      allAlbums,
      allSongs,
      filterArtist,
      filterAlbum,
      filterLanguage,
      filterTerm,
    },
    dispatch,
  ] = useStateValue();

  const deleteFileObject = async (
    imageFileId,
    songImageCover,
    audioFileId,
    audioImageCover
  ) => {
    try {
      const response = await fetch("https://g-music-pvze.onrender.com/api/v1/files/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId: imageFileId ? imageFileId : audioFileId,
          url: songImageCover ? songImageCover : audioImageCover,
        }),
      });
      const result = await response.json();
      dispatch({
        type: actionType.SET_ALERT_TYPE,
        AlertType: "success",
      });

      const timer = setTimeout(() => {
        dispatch({
          type: actionType.SET_ALERT_TYPE,
          AlertType: null,
        });
      }, 3000);

      return () => clearTimeout(timer);
    } catch (error) {
      dispatch({
        type: actionType.SET_ALERT_TYPE,
        AlertType: "error",
      });

      const timer = setTimeout(() => {
        dispatch({
          type: actionType.SET_ALERT_TYPE,
          AlertType: null,
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  };

  const deleteFileImage = async (
    artistFileId,
    artistImageCover,
    albumFileId,
    albumImageCover
  ) => {
    try {
      const response = await fetch(`${baseUrl2}delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId: artistFileId ? artistFileId : albumFileId,
          url: artistImageCover ? artistImageCover : albumImageCover,
        }),
      });
      const result = await response.json();
      // console.log(response);
      dispatch({
        type: actionType.SET_ALERT_TYPE,
        AlertType: "success",
      });

      const timer = setTimeout(() => {
        dispatch({
          type: actionType.SET_ALERT_TYPE,
          AlertType: null,
        });
      }, 3000);

      return () => clearTimeout(timer);
    } catch (error) {
      // console.error("Error deleting file:", error);
      dispatch({
        type: actionType.SET_ALERT_TYPE,
        AlertType: "error",
      });

      const timer = setTimeout(() => {
        dispatch({
          type: actionType.SET_ALERT_TYPE,
          AlertType: null,
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  };

  const saveSong = async () => {
    if (
      !songImageCover ||
      !audioImageCover ||
      !SongName ||
      !filterAlbum ||
      !filterArtist ||
      !filterLanguage ||
      !filterTerm
    ) {
      dispatch({
        type: actionType.SET_ALERT_TYPE,
        AlertType: "error",
      });
      return;
    }

    setIsAudioLoad(true);
    setIsImageLoad(true);

    const data = {
      name: SongName,
      imageURL: songImageCover,
      songURL: audioImageCover,
      album: filterAlbum,
      artist: filterArtist,
      language: filterLanguage,
      category: filterTerm,
      songId: audioFileId,
      fileId: imageFileId,
    };

    console.log(data);

    try {
      await saveNewSong(data);
      const songsData = await getAllSongs();
      dispatch({
        type: actionType.SET_ALL_SONGS,
        allSongs: songsData.songs,
      });

      dispatch({
        type: actionType.SET_ALERT_TYPE,
        AlertType: "success",
      });
      const timer = setTimeout(() => {
        dispatch({
          type: actionType.SET_ALERT_TYPE,
          AlertType: null,
        });
      }, 3000);

      // Reset states
      setSongName("");
      setSongImageCover(null);
      setAudioImageCover(null);
      setImageFileId(null);
      setAudioFileId(null);
      setImageProgress(0);
      setAudioProgress(0);
      setIsImageLoad(false);
      setIsAudioLoad(false);
      dispatch({ type: actionType.SET_FILTER_ARTIST, filterArtist: null });
      dispatch({ type: actionType.SET_FILTER_ALBUM, filterAlbum: null });
      dispatch({ type: actionType.SET_FILTER_LANGUAGE, filterLanguage: null });
      dispatch({ type: actionType.SET_FILTER_TERM, filterTerm: null });
      return () => clearTimeout(timer);
    } catch (error) {
      dispatch({
        type: actionType.SET_ALERT_TYPE,
        AlertType: "error",
      });
      const timer = setTimeout(() => {
        dispatch({
          type: actionType.SET_ALERT_TYPE,
          AlertType: null,
        });
      }, 3000);
    } finally {
      setIsImageLoad(false);
      setIsAudioLoad(false);
    }
    return () => clearTimeout(timer);
  };
  const saveAlbum = async () => {
    if (!albumImageCover || !albumName) {
      dispatch({
        type: actionType.SET_ALERT_TYPE,
        AlertType: "error",
      });
      return;
    }

    setIsAlbumLoad(true);

    const data = {
      name: albumName,
      imageURL: albumImageCover,
      fileId: albumFileId,
    };

    try {
      await saveNewAlbum(data);
      const albumData = await getAllAlbums();
      dispatch({
        type: actionType.SET_ALL_ALBUMS,
        allAlbums: albumData.albums,
      });

      dispatch({
        type: actionType.SET_ALERT_TYPE,
        AlertType: "success",
      });
      const timer = setTimeout(() => {
        dispatch({
          type: actionType.SET_ALERT_TYPE,
          AlertType: null,
        });
      }, 3000);

      // Reset states
      setAlbumName("");
      setAlbumImageCover(null);
      setAlbumFileId(null);
      setIsAlbumLoad(null);
      return () => clearTimeout(timer);
    } catch (error) {
      dispatch({
        type: actionType.SET_ALERT_TYPE,
        AlertType: "error",
      });
      const timer = setTimeout(() => {
        dispatch({
          type: actionType.SET_ALERT_TYPE,
          AlertType: null,
        });
      }, 3000);
    } finally {
      setIsAlbumLoad(false);
    }
    return () => clearTimeout(timer);
  };

  const saveArtist = async () => {
    if (!artistImageCover || !artistName || !twetter || !instagram) {
      dispatch({
        type: actionType.SET_ALERT_TYPE,
        AlertType: "error",
      });
      return;
    }

    setIsArtistLoad(true);

    const data = {
      name: artistName,
      imageURL: artistImageCover,
      twetter: `https://twitter.com/${twetter}`,
      instagram: `https://www.instagram.com/${instagram}`,
      fileId: artistFileId,
    };

    try {
      await saveNewArtist(data);
      const artistData = await getAllArtists();
      dispatch({
        type: actionType.SET_ALL_ARTISTS,
        allArtists: artistData.artist,
      });

      dispatch({
        type: actionType.SET_ALERT_TYPE,
        AlertType: "success",
      });
      const timer = setTimeout(() => {
        dispatch({
          type: actionType.SET_ALERT_TYPE,
          AlertType: null,
        });
      }, 3000);

      // Reset states
      setArtistName("");
      setArtistImageCover(null);
      setArtistFileId(null);
      setIsArtistLoad(null);
      setTwetter("");
      setInstagram("");
      return () => clearTimeout(timer);
    } catch (error) {
      dispatch({
        type: actionType.SET_ALERT_TYPE,
        AlertType: "error",
      });
      const timer = setTimeout(() => {
        dispatch({
          type: actionType.SET_ALERT_TYPE,
          AlertType: null,
        });
      }, 3000);
    } finally {
      setIsArtistLoad(false);
    }
    return () => clearTimeout(timer);
  };

  useEffect(() => {
    if (!allArtists) {
      getAllArtists().then((data) => {
        dispatch({
          type: actionType.SET_ALL_ARTISTS,
          allArtists: data.artist,
        });
      });
    }
    if (!allAlbums) {
      // In your useEffect:
      getAllAlbums().then((data) => {
        dispatch({
          type: actionType.SET_ALL_ALBUMS,
          allAlbums: data.album,
        });
      });
    }
    if (!allSongs) {
      getAllSongs().then((data) => {
        dispatch({
          type: actionType.SET_ALL_SONGS,
          allSongs: data.songs,
        });
      });
    }
  }, []);

  return (
    <div className="w-full p-4 flex flex-col items-center justify-center border border-gray-400 rounded gap-4">
      <input
        type="text"
        placeholder="Enter Song Name..."
        value={SongName}
        onChange={(e) => setSongName(e.target.value.toUpperCase())}
        className="shadow-sm outline-none border rounded-md bg-transparent duration-150 transition-all ease-in-out text-base text-textColor font-semibold p-3 w-full dark:text-white dark:border-green-50"
      />

      <div className="flex w-full justify-around flex-wrap items-center gap-4">
        <FillterButton flag={"Artists"} filterData={allArtists} />
        <FillterButton flag={"Albums"} filterData={allAlbums} />
        <FillterButton flag={"Language"} filterData={filterByLanguage} />
        <FillterButton flag={"Category"} filterData={filter} />
      </div>
      <div className="flex w-full justify-around flex-wrap items-center gap-4">
        {/* Song Image */}
        <div className="bg-card backdrop-blur-md w-100 h-100 rounded-md border-2 border-dotted border-gray-300 cursor-pointer relative">
          {isImageLoad && <Fileload progress={imageProgress} />}

          {!isImageLoad && (
            <>
              {!songImageCover ? (
                <FileUpLoading
                  updateState={setSongImageCover}
                  updateStateId={setImageFileId}
                  setProgress={setImageProgress}
                  isLoading={setIsImageLoad}
                  isImage={true}
                />
              ) : (
                <div className="w-full h-full relative overflow-hidden flex items-center justify-center gap-2 rounded-md">
                  <img
                    src={songImageCover}
                    alt="song"
                    className="w-full h-full object-cover rounded-md"
                  />
                  <button
                    // onClick={() => deleteFileObject(songImageCover,true) }
                    onClick={() =>
                      deleteFileObject(imageFileId)
                        .then(() => {
                          setSongImageCover(null);
                          setImageFileId(null);
                          setIsImageLoad(false);
                          setImageProgress(0);
                        })
                        .catch((error) => console.error(error))
                    }
                    className="absolute top-2 right-2 p-2 bg-white dark:bg-black rounded-full shadow hover:bg-red-100 transition"
                  >
                    <MdDelete className="text-red-600 text-xl" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        {/* AUDIO UPLOAD */}
        <div className="bg-card backdrop-blur-md w-100 h-100 rounded-md border-2 border-dotted border-gray-300 cursor-pointer relative">
          {isAudioLoad && <Fileload progress={audioProgress} />}

          {!isAudioLoad && (
            <>
              {!audioImageCover ? (
                <FileUpLoading
                  updateState={setAudioImageCover}
                  updateStateId={setAudioFileId}
                  setProgress={setAudioProgress}
                  isLoading={setIsAudioLoad}
                  isImage={false}
                />
              ) : (
                <div className="w-full h-full relative overflow-hidden flex items-center justify-center gap-2 rounded-md">
                  <audio
                    src={audioImageCover}
                    alt="song"
                    controls
                    className=""
                  ></audio>
                  <button
                    onClick={() =>
                      deleteFileObject(audioFileId)
                        .then(() => {
                          setAudioImageCover(null);
                          setAudioFileId(null);
                          setIsAudioLoad(false);
                          setAudioProgress(0);
                        })
                        .catch((error) => console.error(error))
                    }
                    className="absolute top-2 right-2 p-2 bg-white dark:bg-black rounded-full shadow hover:bg-red-100 transition"
                  >
                    <MdDelete className="text-red-600 text-xl" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div className="flex items-center justify-center w-80 p-4 ">
        {isImageLoad || isAudioLoad ? (
          <DisableButton />
        ) : (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="submit"
            onClick={saveSong}
            className="bg-blue-500 hover:bg-primaryhover dark:bg-primarydark text-white font-semibold py-1 px-4 rounded-md shadow-lg"
          >
            Save Song
          </motion.button>
        )}
      </div>

      {/* Artist Details */}

      <p className="text-lg text-textColor font-semibold mt-2">
        Artist Details
      </p>

      <div className="flex w-full justify-around flex-wrap items-center gap-4">
        {/* Artist Image */}
        <div className="bg-card backdrop-blur-md w-100 h-100 rounded-md border-2 border-dotted border-gray-300 cursor-pointer relative">
          {isArtistLoad && <Fileload progress={artistProgress} />}

          {!isArtistLoad && (
            <>
              {!artistImageCover ? (
                <FileUpLoading
                  updateState={setArtistImageCover}
                  updateStateId={setArtistFileId}
                  setProgress={setArtistProgress}
                  isLoading={setIsArtistLoad}
                  isImage={true}
                />
              ) : (
                <div className="w-full h-full relative overflow-hidden flex items-center justify-center gap-2 rounded-md">
                  <img
                    src={artistImageCover}
                    alt="song"
                    className="w-full h-full object-cover rounded-md"
                  />
                  <button
                    // onClick={() => deleteFileObject(songImageCover,true) }
                    onClick={() =>
                      deleteFileImage(artistFileId)
                        .then(() => {
                          setArtistImageCover(null);
                          setArtistFileId(null);
                          setIsArtistLoad(false);
                          setArtistProgress(0);
                        })
                        .catch((error) => console.error(error))
                    }
                    className="absolute top-2 right-2 p-2 bg-white dark:bg-black rounded-full shadow hover:bg-red-100 transition"
                  >
                    <MdDelete className="text-red-600 text-xl" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        <input
          type="text"
          transform="capitalize"
          placeholder="Enter Artist Name..."
          value={artistName}
          onChange={(e) => setArtistName(e.target.value.toUpperCase())}
          className="shadow-sm outline-none border rounded-md bg-transparent duration-150 transition-all ease-in-out text-base text-textColor font-semibold p-3 w-full dark:text-white dark:border-green-50 text-uppercase "
        />
        <div className="w-full bg-gray-300 flex items-center p-3 rounded-md border dark:bg-transparent border-gray-300 dark:border-green-50 ">
          <p className="text-base text-textColor font-semibold">
            www.twitter.com/
          </p>
          <input
            type="text"
            placeholder="Enter Twetter ID..."
            value={twetter}
            onChange={(e) => setTwetter(e.target.value)}
            className="outline-none rounded-md bg-transparent duration-150 transition-all ease-in-out text-base text-textColor font-semibold  w-full dark:text-white "
          />
        </div>

        <div className="w-full  bg-gray-300 flex items-center p-3 rounded-md border dark:bg-transparent border-gray-300 dark:border-green-50 ">
          <p className="text-base text-textColor font-semibold">
            www.instagram.com/
          </p>
          <input
            type="text"
            placeholder="Enter Instagram URL..."
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            className="outline-none rounded-md bg-transparent duration-150 transition-all ease-in-out text-base text-textColor font-semibold  w-full dark:text-white "
          />
        </div>
      </div>
      <div className="flex items-center justify-center w-80 p-4 ">
        {isArtistLoad ? (
          <DisableButton />
        ) : (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="submit"
            onClick={saveArtist}
            className="bg-blue-500 hover:bg-primaryhover dark:bg-primarydark text-white font-semibold py-1 px-4 rounded-md shadow-lg"
          >
            Save Aritst
          </motion.button>
        )}
      </div>

      {/* Album Details */}
      <p className="text-lg text-textColor font-semibold mt-2">Album Details</p>

      <div className="flex w-full justify-around flex-wrap items-center gap-4">
        {/* Artist Image */}
        <div className="bg-card backdrop-blur-md w-100 h-100 rounded-md border-2 border-dotted border-gray-300 cursor-pointer relative">
          {isAlbumLoad && <Fileload progress={albumProgress} />}

          {!isAlbumLoad && (
            <>
              {!albumImageCover ? (
                <FileUpLoading
                  updateState={setAlbumImageCover}
                  updateStateId={setAlbumFileId}
                  setProgress={setAlbumProgress}
                  isLoading={setIsAlbumLoad}
                  isImage={true}
                />
              ) : (
                <div className="w-full h-full relative overflow-hidden flex items-center justify-center gap-2 rounded-md">
                  <img
                    src={albumImageCover}
                    alt="song"
                    className="w-full h-full object-cover rounded-md"
                  />
                  <button
                    // onClick={() => deleteFileObject(songImageCover,true) }
                    onClick={() =>
                      deleteFileImage(albumFileId)
                        .then(() => {
                          setAlbumImageCover(null);
                          setAlbumFileId(null);
                          setIsAlbumLoad(false);
                          setAlbumProgress(0);
                        })
                        .catch((error) => console.error(error))
                    }
                    className="absolute top-2 right-2 p-2 bg-white dark:bg-black rounded-full shadow hover:bg-red-100 transition"
                  >
                    <MdDelete className="text-red-600 text-xl" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <input
          type="text"
          transform="capitalize"
          placeholder="Enter Album Name..."
          value={albumName}
          onChange={(e) => setAlbumName(e.target.value.toUpperCase())}
          className="shadow-sm outline-none border rounded-md bg-transparent duration-150 transition-all ease-in-out text-base text-textColor font-semibold p-3 w-full dark:text-white dark:border-green-50"
        />
      </div>
      <div className="flex items-center justify-center w-80 h-50 p-4 ">
        {isAlbumLoad ? (
          <DisableButton />
        ) : (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="submit"
            onClick={saveAlbum}
            className="bg-blue-500 hover:bg-primaryhover dark:bg-primarydark text-white font-semibold py-1 px-4 rounded-md shadow-lg"
          >
            Save Album
          </motion.button>
        )}
      </div>
    </div>
  );
};
export const FileUpLoading = ({
  updateState,
  updateStateId,
  isLoading,
  setProgress,
  isImage,
}) => {
  const [, dispatch] = useStateValue();

  const handleSuccess = (res) => {
    setProgress(100);
    isLoading(false);
    updateState(res.url);
    updateStateId(res.fileId);
    dispatch({
      type: actionType.SET_ALERT_TYPE,
      AlertType: "success",
    });
    console.log(res);

    const timer = setTimeout(() => {
      dispatch({
        type: actionType.SET_ALERT_TYPE,
        AlertType: null,
      });
    }, 3000);
    return () => clearTimeout(timer);
  };

  const handleError = () => {
    isLoading(false);
    setProgress(0);
    updateState(null);
    updateStateId(null);
    dispatch({
      type: actionType.SET_ALERT_TYPE,
      AlertType: "error",
    });
    const timer = setTimeout(() => {
      dispatch({
        type: actionType.SET_ALERT_TYPE,
        AlertType: null,
      });
    }, 3000);
    return () => clearTimeout(timer);
  };
  return (
    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
      <div className="flex flex-col items-center justify-center">
        <BiCloudUpload className="text-3xl text-textColor" />
        <p className="text-base text-textColor font-semibold">
          Upload File{isImage ? " Image" : " Audio"}
        </p>
      </div>

      <IKContext
        publicKey={publicKey}
        urlEndpoint={urlEndpoint}
        authenticator={authenticator}
      >
        <IKUpload
          fileName={isImage ? "upload.jpg" : "upload.mp3"}
          folder={isImage ? "/images" : "/audios"}
          useUniqueFileName={true}
          tags={["SONG COVER", "AUDIO COVER"]}
          isPrivateFile={false}
          responseFields={["tags"]}
          onChange={() => {
            setProgress(0);
            isLoading(true);
            console.log("onChange");
          }}
          onUploadProgress={(event) => {
            const percent = Math.round((event.loaded / event.total) * 100);
            setProgress(percent);
          }}
          overwriteAITags={true}
          overwriteTags={true}
          onSuccess={handleSuccess}
          onError={handleError}
          className="w-0 h-0 opacity-0"
          multiple={false}

        />
      </IKContext>
    </label>
  );
};
export const DisableButton = () => {
  return (
    <button
      type="button"
      class="bg-indigo-500 flex items-center text-white active:bg-indigo-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 ease-linear transition-all duration-150"
      disabled
    >
      <svg
        class="size-5 animate-spin -ml-1 mr-3 h-5 w-5 text-white  "
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
          transform="rotate(-90 12 12)"
          transform-origin="12 12"
          transform-box="fill-box"
          style={{ transform: "rotate(-90deg)" }}
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      Uploading…
    </button>
  );
};
export const Fileload = ({ progress }) => (
  <div className="w-full h-full flex flex-col items-center justify-center">
    <div className="relative w-28 h-28 flex items-center justify-center">
      {/* Circular Spinner */}
      <svg
        className="absolute w-full h-full animate-spin text-blue-500"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-10"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth=".5"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        ></path>
      </svg>

      {/* Progress Text */}
      <div className="z-10 text-xl font-bold text-blue-600 dark:text-white">
        {Math.round(progress)}%
      </div>
    </div>

    {/* Optional: Status text */}
    <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
      Uploading...
    </p>
  </div>
);

const authenticator = async () => {
  const response = await fetch("https://g-music-pvze.onrender.com/auth");
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Auth error: ${error}`);
  }
  return response.json(); // { signature, token, expire }
};

export default DashboardNewsong;
