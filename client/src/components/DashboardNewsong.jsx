import React, { useRef, useEffect, useState } from "react";
// import {
//   getStorage,
//   ref,
//   uploadBytes,
//   getDownloadURL,
//   uploadBytesResumable,
// } from "firebase/storage";
import { useStateValue } from "../context/stateProvider";
import { actionType } from "../context/reducer";
// import { motion } from "framer-motion";
import { BiCloudUpload } from "react-icons/bi";
// import { MdDelete } from "react-icons/md";
// import { storage } from "../config/firebase.config";
import FillterButton from "./FillterButton";
import {
  getAllSongs,
  getAllAlbums,
  getAllArtists,
  //   saveNewAlbum,
  //   saveNewArtist,
  //   saveNewSong,
} from "../../api";
import { filterByLanguage, filter } from "../utils/FillterButton";
// import AlertSuccess from "./AlertSuccess";
// import AlertError from "./AlertError";

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
    <>
      <div className="w-full p-4 flex flex-col items-center justify-center border border-gray-400 rounded gap-4">
        <input
          type="text"
          placeholder="Enter Song Name..."
          value={SongName}
          onChange={(e) => setSongName(e.target.value)}
          className={`shadow-sm outline-none border rounded-md bg-transparent duration-150 transition-all ease-in-out text-base text-textColor font-semibold p-3 w-full dark:text-white dark:border-green-50 `}
        />
        <div className=" flex w-full justify-around flex-wrap items-center gap-4 ">
          <FillterButton flag={"Artists"} filterData={allArtists} />
          <FillterButton flag={"Albums"} filterData={allAlbums} />
          <FillterButton flag={"Language"} filterData={filterByLanguage} />
          <FillterButton flag={"Category"} filterData={filter} />
        </div>
        <div className="bg-card backdrop-blur-md w-full h-300 rounded-md border-2 border-dotted border-gray-300 cursor-pointer  ">
          {isImageLoad && <Fileload progress={imageProgress} />}
          {!isImageLoad && (
            <>
              {!songImageCover ? (
                <FileUpLoading
                  updateState={setSongImageCover}
                  setProgress={setImageProgress}
                  isLoading={setIsImageLoad}
                  isImage={true}
                />
              ) : (
                <div></div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export const Fileload = ({ progress }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-base text-textColor font-semibold">
          {Math.round(progress) > 0 && <> {`${Math.round(progress)}%`}</>}
        </p>
        <div className="w-20 h-20 min-w-[40px] bg-red-800 animate-ping rounded-full flex items-center justify-around relative ">
          <div className="absolute inset-0 rounded-full bg-red-900 blur-xl "></div>
        </div>
      </div>
    </div>
  );
};

export const FileUpLoading = ({
  updateState,
  setProgress,
  isLoading,
  isImage,
}) => {
    const uploadFile = (e) => {
        isLoading(true);
        const uploadFile = e.target.files[0];
        console.log(uploadFile);
        // if (!file) {
        //     alert("Please upload a file");
        //     return;
        // }
        isLoading(false);
        // const storage = getStorage();
        // const storageRef = ref(storage, `images/${file.name}`);
        // const uploadTask = uploadBytesResumable(storageRef, file);
        // uploadTask.on(
        //     "state_changed",
        //     (snapshot) => {
        //         const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        //         setImageProgress(progress);
        //         console.log("Upload is " + progress + "% done");
        //     },
        //     (error) => {
        //         alert("Error uploading file");
        //     },
        //     () => {
        //         getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
        //             setSongImageCover(downloadURL);
        //             isImageLoad(false);
        //             console.log("File available at", downloadURL);
        //         });
        //     }
        // );
    }
  return (
    <label>
      <div className="flex flex-col items-center justify-center h-full ">
        <div className="flex flex-col items-center justify-center curosr-pointer ">
          <p className="font-bold text-2xl">
            <BiCloudUpload className="text-3xl text-textColor" />
          </p>
          <p className="text-base text-textColor font-semibold">
            Upload File{isImage ? " an Image" : " an Audio"}
          </p>
        </div>
      </div>
        <input
            type="file"
            name="uploadFile"
            accept={isImage ? "image/*" : "audio/*"}
            onChange={(e) => {
            setProgress(0);
            isLoading(true);
            const uploadFile = e.target.files[0];
            
            // uploadFile(file);
            }}
            className="w-0 h-0"
        />
    </label>
  );
};

export default DashboardNewsong;
