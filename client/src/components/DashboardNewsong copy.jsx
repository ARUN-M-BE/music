"use client"

// User Browser ----> Our Own server  ----> ImageKit Server
// User Browser ----> ImageKit Server

import React, { useRef, useEffect, useState } from "react";
import { IKContext, IKUpload } from "imagekitio-react";
import { useStateValue } from "../context/stateProvider";
import { actionType } from "../context/reducer";
import { BiCloudUpload } from "react-icons/bi";
import FillterButton from "./FillterButton";
import {
  getAllSongs,
  getAllAlbums,
  getAllArtists,
} from "../../api";
import { filterByLanguage, filter } from "../utils/FillterButton";

const urlEndpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT;
const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;

const DashboardNewsong = () => {
  const [SongName, setSongName] = useState("");
  const [songImageCover, setSongImageCover] = useState(null);
  const [imageProgress, setImageProgress] = useState(0);
  const [isImageLoad, setIsImageLoad] = useState(false);
  const [{ allArtists, allAlbums, allSongs }, dispath] = useStateValue();

  useEffect(() => {
    if (!allArtists) {
      getAllArtists().then((data) => {
        dispath({
          type: actionType.SET_ALL_ARTISTS,
          allArtists: data.artist,
        });
      });
    }
    if (!allAlbums) {
      getAllAlbums().then((data) => {
        dispath({
          type: actionType.SET_ALL_ALBUMS,
          allAlbums: data.album,
        });
      });
    }
    if (!allSongs) {
      getAllSongs().then((data) => {
        dispath({
          type: actionType.SET_ALL_SONGS,
          allSongs: data.songs,
        });
      });
    }
  }, []);

  return (
    <div className="w-full p-4 flex flex-col items-center justify-center border border-gray-300 rounded-md gap-6 bg-white dark:bg-zinc-900">
      {/* Song Name Input */}
      <input
        type="text"
        placeholder="Enter Song Name..."
        value={SongName}
        onChange={(e) => setSongName(e.target.value)}
        className="w-full p-3 border rounded-md text-sm outline-none dark:text-white dark:border-gray-600"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4 justify-around w-full">
        <FillterButton flag={"Artists"} filterData={allArtists} />
        <FillterButton flag={"Albums"} filterData={allAlbums} />
        <FillterButton flag={"Language"} filterData={filterByLanguage} />
        <FillterButton flag={"Category"} filterData={filter} />
      </div>

      {/* Image Upload Box */}
      <div className="w-full min-h-[300px] rounded-md border-2 border-dashed border-gray-400 flex items-center justify-center p-4 bg-zinc-100 dark:bg-zinc-800">
        {isImageLoad ? (
          <Fileload progress={imageProgress} />
        ) : songImageCover ? (
          <div className="w-full flex flex-col items-center justify-center gap-2">
            <img
              src={songImageCover}
              alt="uploaded"
              className="w-full max-h-[250px] object-cover rounded-md"
            />
            <p className="text-xs text-blue-600 break-words text-center mt-2 px-2">
              {songImageCover}
            </p>
            <button
              onClick={() => setSongImageCover(null)}
              className="text-sm text-red-600 hover:text-red-800 underline"
            >
              Remove Image
            </button>
          </div>
        ) : (
          <FileUpLoading
            updateState={setSongImageCover}
            setProgress={setImageProgress}
            isLoading={setIsImageLoad}
            isImage={true}
          />
        )}
      </div>
    </div>
  );
};

export const Fileload = ({ progress }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="absolute w-full h-full animate-spin text-red-600" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          ></path>
        </svg>
        <p className="text-lg text-white font-semibold z-10">{Math.round(progress)}%</p>
      </div>
    </div>
  );
};

const authenticator = async () => {
  try {
    const response = await fetch("http://localhost:3001/auth");

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Request failed with status ${response.status}: ${errorText}`
      );
    }

    const data = await response.json();
    const { signature, expire, token } = data;
    return { signature, expire, token };
  } catch (error) {
    throw new Error(`Authentication request failed: ${error.message}`);
  }
};

export const FileUpLoading = ({
  updateState,
  isLoading,
  setProgress,
  isImage,
}) => {

  return (
    <div
      className="flex flex-col items-center justify-center h-full cursor-pointer"
    >
      <div className="flex flex-col items-center justify-center">
        <BiCloudUpload className="text-4xl text-blue-500" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">
          Click to Upload {isImage ? "Image" : "Audio"}
        </p>
      </div>

      <IKContext
        publicKey={publicKey}
        urlEndpoint={urlEndpoint}
        authenticator={authenticator}
      >
        <IKUpload
          name="upload"
          fileName="upload.jpg"
          folder={isImage ? "/images" : "/audios"}
          useUniqueFileName={true}
          onChange={() => {
            setProgress(0);
            isLoading(true);
          }}
          onSuccess={(res) => {
            setProgress(100);
            isLoading(false);
            updateState(res.url);
          }}
          onError={(err) => {
            console.error("❌ Upload Error:", err);
            isLoading(false);
          }}
          className="w-0 h-0"
        />
      </IKContext>
    </div>
  );
};

export default DashboardNewsong;
const handleDelete = async () => {
  if (!imageFileId) return;

  try {
    const response = await fetch("http://localhost:3001/deleteFile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fileId: imageFileId }),
    });

    const result = await response.json();
    if (response.ok) {
      setSongImageCover(null);
      setImageFileId(null);
      setImageProgress(0);
    } else {
      console.error("Deletion failed:", result);
    }
  } catch (error) {
    console.error("Error deleting file:", error);
  }
};