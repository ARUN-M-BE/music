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
  const [imageFileId, setImageFileId] = useState(null); // needed for deletion
  const [imageProgress, setImageProgress] = useState(0);
  const [isImageLoad, setIsImageLoad] = useState(false);

  const [audioImageCover, setAudioImageCover] = useState(null); // image URL
  const [audioFileId, setAudioFileId] = useState(null);

  const [audioProgress, setAudioProgress] = useState(0);
  const [isAudioLoad, setIsAudioLoad] = useState(false);

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
      const response = await fetch("http://localhost:3001/delete", {
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
      console.log(response);
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const saveSong = () => {
    if (!songImageCover || !audioImageCover) {
      alert("Please upload both image and audio files.");
      return;
    }

    setIsAudioLoad(true);
    setIsImageLoad(true);

    const data = {
      name: SongName,
      imageURL: songImageCover,
      imageFileId: imageFileId,
      songURL: audioImageCover,
      songFileId: audioFileId,
      album: filterAlbum,
      artist: filterArtist,
      language: filterLanguage,
      category: filterTerm,
    };

    console.log("Sending data:", data); // ✅ Debug log

    saveNewSong(data).then((res) => {
      if (res) {
        alert("Song saved successfully!");
        getAllSongs().then((songs) => {
          dispatch({
            type: actionType.SET_ALL_SONGS,
            allSongs: songs.songs,
          });
        });
      } else {
        // alert("Failed to save song. Please check the inputs and try again.");
        console.log("Failed to save song. Please check the inputs and try again.");

      }
    });

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
    dispatch({ type: actionType.SET_FILTER_ARTIST, filterAlbum: null });
    dispatch({ type: actionType.SET_FILTER_ALBUM, filterArtist: null });
    dispatch({ type: actionType.SET_FILTER_LANGUAGE, filterLanguage: null });
    dispatch({ type: actionType.SET_FILTER_TERM, filterTerm: null });
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
        onChange={(e) => setSongName(e.target.value)}
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
      <div className="flex items-center justify-center w-24 p-4 ">
        {isImageLoad || isAudioLoad ? (
          <disableButton />
        ) : (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="submit"
            onClick={saveSong}
            className="bg-blue-500 hover:bg-primaryhover dark:bg-primarydark text-white font-semibold py-1 px-4 rounded-md shadow-lg"
          >
            Save
          </motion.button>
        )}
      </div>
    </div>
  );
};
export const disableButton = () => {
  return (
    <button disabled type="button" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 inline-flex items-center">
<svg aria-hidden="true" role="status" class="inline w-4 h-4 me-3 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
<path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
</svg>
Loading...
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
  const response = await fetch("http://localhost:3001/auth");
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Auth error: ${error}`);
  }
  return response.json(); // { signature, token, expire }
};

export const FileUpLoading = ({
  updateState,
  updateStateId,
  isLoading,
  setProgress,
  isImage,
}) => {
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
          // transformation={[{ h: 300, w: 400 }]}
          // lqip={{ active: true, quality: 20 }}
          // validateFile={(file) => file.size < 1000000}
          onChange={() => {
            setProgress(0);
            isLoading(true);
          }}
          onUploadProgress={(event) => {
            const percent = Math.round((event.loaded / event.total) * 100);
            setProgress(percent);
          }}
          overwriteAITags={true}
          overwriteTags={true}
          onSuccess={(res) => {
            setProgress(100);
            isLoading(false);
            updateState(res.url);
            updateStateId(res.fileId);
            console.log(res);
          }}
          onError={(err) => {
            console.error("Upload failed:", err);
            isLoading(false);
            setProgress(0);
            updateState(null);
            updateStateId(null);
          }}
          autoStart={false}
          useUniqueFileNamePerFolder={true}
          className="w-0 h-0 opacity-0"
          multiple={false}
        />
      </IKContext>
    </label>
  );
};

export default DashboardNewsong;
