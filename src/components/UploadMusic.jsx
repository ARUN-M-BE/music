import React, { useState } from "react";
import { storage, db, auth } from "./firebaseConfig";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useDropzone } from "react-dropzone";

const UploadMusic = ({ onUpload }) => {
  const [uploading, setUploading] = useState(false);

  const onDrop = async (acceptedFiles) => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please log in to upload music.");
      return;
    }

    const file = acceptedFiles[0];

    if (!file || !file.type.startsWith("audio/")) {
      alert("Invalid file type. Please upload a valid audio file.");
      return;
    }

    const filePath = `music/${user.uid}/${file.name}`; // Correct file path format
    const storageRef = ref(storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploading(true);
    uploadTask.on(
      "state_changed",
      null,
      (error) => {
        console.error("Upload Error:", error);
        alert("File upload failed.");
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        console.log("✅ File Uploaded Successfully: ", url);

        try {
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

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "audio/mpeg": [".mp3"],
      "audio/wav": [".wav"],
      "audio/ogg": [".ogg"],
    },
    onDrop,
  });

  return (
    <div {...getRootProps()} className="border p-4 text-center cursor-pointer">
      <input {...getInputProps()} />
      {uploading ? <p>Uploading...</p> : <p>Drag & drop a music file or click to upload</p>}
    </div>
  );
};

export default UploadMusic;
