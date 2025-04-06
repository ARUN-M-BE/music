"use client";
// User Browser ----> Our Own server  ----> ImageKit Server
// User Browser ----> ImageKit Server

import React, { useRef, useEffect, useState } from "react";
import { IKContext, IKUpload } from "imagekitio-react";
import { useStateValue } from "../context/stateProvider";
import { actionType } from "../context/reducer";
import { BiCloudUpload } from "react-icons/bi";
import { MdDelete } from "react-icons/md";
import FillterButton from "./FillterButton";
import { getAllSongs, getAllAlbums, getAllArtists } from "../../api";
import { filterByLanguage, filter } from "../utils/FillterButton";

// ENV
const urlEndpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT;
const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;

const DashboardNewsong = () => {
  const ikUploadRef = useRef(null);
  const [SongName, setSongName] = useState("");
  const [songImageCover, setSongImageCover] = useState(null); // image URL
  const [imageFileId, setImageFileId] = useState(null); // needed for deletion
  const [imageProgress, setImageProgress] = useState(0);
  const [isImageLoad, setIsImageLoad] = useState(false);

  const [audioImageCover, setAudioImageCover] = useState(null); // image URL
  const [audioFileId, setAudioFileId] = useState(null);

  const [audioProgress, setAudioProgress] = useState(0);
  const [isAudioLoad, setIsAudioLoad] = useState(false);

  const [{ allArtists, allAlbums, allSongs }, dispatch] = useStateValue();

  const deleteFileObject = async (imageFileId, songImageCover) => {
    try {
      const response = await fetch("http://localhost:3001/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId: imageFileId, url: songImageCover }),
      });

      const result = await response.json();
    } catch (error) {
      console.error("Error deleting file:", error);
    }
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

      <div className="bg-card backdrop-blur-md w-50 h-50 rounded-md border-2 border-dotted border-gray-300 cursor-pointer relative">
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
              <div className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center gap-2 rounded-md">
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
    </div>
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
  const [uploadMessage, setUploadMessage] = useState(null); // string or null
  const [uploadStatus, setUploadStatus] = useState(null); // "success" or "error"

  return (
    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
      <div className="flex flex-col items-center justify-center">
        <BiCloudUpload className="text-3xl text-textColor" />
        <p className="text-base text-textColor font-semibold">
          Upload File{isImage ? " (Image)" : " (Audio)"}
        </p>
      </div>

      <IKContext
        publicKey={publicKey}
        urlEndpoint={urlEndpoint}
        authenticator={authenticator}
      >
        <IKUpload
          fileName="upload.jpg"
          folder={isImage ? "/images" : "/audios"}
          useUniqueFileName={true}
          tags={["SONG COVER", "AUDIO COVER"]}
          isPrivateFile={false}
          responseFields={["tags"]}
          // transformation={[{ h: 300, w: 400 }]}
          lqip={{ active: true, quality: 20 }}
          validateFile={(file) => file.size < 1000000}
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

            setUploadMessage("✅ Upload successful!");
            setUploadStatus("success");
          }}
          onError={(err) => {
            console.error("Upload failed:", err);
            isLoading(false);
            setProgress(0);
            updateState(null);
            updateStateId(null);
            setUploadMessage(
              `❌ Upload failed: ${err?.message || "Unknown error"}`
            );
            setUploadStatus("error");
          }}
          autoStart={false}
          useUniqueFileNamePerFolder={true}
          className="w-0 h-0 opacity-0"
          multiple={false}
        />
      </IKContext>
      {uploadMessage && (
        <p
          className={`text-sm mt-2 font-semibold ${
            uploadStatus === "success" ? "text-green-600" : "text-red-500"
          }`}
        >
          {uploadMessage}
        </p>
      )}
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
        {isImage
          ? "Max size: 1MB, Format: JPG/PNG"
          : "Max size: 10MB, Format: MP3/WAV"}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        {isImage
          ? "Recommended size: 300x300px"
          : "Recommended format: MP3/WAV"}
      </p>
    </label>
  );
};

export default DashboardNewsong;
