import React, { useState } from "react";
import { storage, db, auth } from "./firebaseConfig";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useDropzone } from "react-dropzone";

const UploadMusic = ({ onUpload }) => {
  const [uploading, setUploading] = useState(false);

  const onDrop = async (acceptedFiles) => {
    const user = auth.currentUser; // Ensure user is logged in
    if (!user) {
      alert("Please log in to upload music.");
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    const storageRef = ref(storage, `music/${user.uid}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploading(true);
    uploadTask.on(
      "state_changed",
      null,
      (error) => console.error("Upload Error:", error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);

        try {
          // Store metadata in Firestore
          await addDoc(collection(db, "music"), {
            userId: user.uid,
            name: file.name,
            url: url,
            createdAt: serverTimestamp(),
          });

          onUpload(url, file.name);
          setUploading(false);
        } catch (err) {
          console.error("Firestore Error:", err);
          alert("Failed to save data in Firestore.");
          setUploading(false);
        }
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
