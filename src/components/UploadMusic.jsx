import React, { useState } from "react";
import { storage, db, auth } from "./firebaseConfig";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useDropzone } from "react-dropzone";

const UploadMusic = ({ onUpload }) => {
  const [uploading, setUploading] = useState(false);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Ensure user is authenticated before writing to Firestore
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to upload music.");
      return;
    }

    const storageRef = ref(storage, `music/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploading(true);
    uploadTask.on(
      "state_changed",
      null,
      (error) => console.error(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);

        // Save file details in Firestore under authenticated user
        await addDoc(collection(db, "music"), {
          userId: user.uid,  // Store the user ID
          name: file.name,
          url: url,
          createdAt: serverTimestamp(),
        });

        onUpload(url, file.name);
        setUploading(false);
      }
    );
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: "audio/*" });

  return (
    <div {...getRootProps()} className="border p-4 text-center cursor-pointer">
      <input {...getInputProps()} />
      {uploading ? <p>Uploading...</p> : <p>Drag & drop a music file or click to upload</p>}
    </div>
  );
};

export default UploadMusic;
