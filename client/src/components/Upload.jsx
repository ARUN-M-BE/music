import React, { useState } from "react";

const Upload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedAudio, setUploadedAudio] = useState(null);
  const [fileId, setFileId] = useState(null); // Added fileId state

  const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000/"

  const handleFileChange = (e) => {
    if (e.target.files.length === 0) return;
    const file = e.target.files[0];
    const isImage = file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/gif";
    const isAudio = file.type === "audio/mpeg" || file.type === "audio/mp3" ; // Assuming mp3 for audio
    if (!isImage && !isAudio) {
      alert("Please select a valid image or audio file (jpeg, png, gif, mp3).");
      return;
    }
    if (isImage) {
      setUploadedImage(URL.createObjectURL(file));
    }
    if (isAudio) {
      setUploadedImage(URL.createObjectURL(file));
    }

    
    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit.");
      return;
    }


    setSelectedFile(file);
  };

  const isImage = selectedFile && selectedFile.type.startsWith("image/");
  const isAudio = selectedFile && selectedFile.type.startsWith("audio/");


  const uploadImage = async () => {
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("fileId", selectedFile.fileId);
    formData.append("folder", isImage ? "/images" : "/audios");

    const res = await fetch(
      `${baseURL}api/media/upload`,
      {
        method: "POST",
        body: formData,

      }
    );

    const data = await res.json();
    if (data.success) {
      {isImage ? setUploadedImage(data.imageURL) : setUploadedAudio(data.songURL)}; // Set the uploaded image or audio URL
      setFileId(data.fileId); // Store fileId
      
      console.log(data);
      alert("Upload success!");
    }
  };

  const deleteImage = async () => {
    if (!fileId) return;

    const res = await fetch(
      `${baseURL}api/media/delete/${fileId}`,
      {
        method: "DELETE",
      }
    );

    const data = await res.json();
    if (data.success) {
      console.log(data);
      {isImage ? setUploadedImage(null) : setUploadedAudio(null)}; // Reset the uploaded image or audio URL
      setFileId(null); // Reset fileI
      alert("Image deleted!");
    }
  };

  return (
    <>
      <div className="p-4 flex items-center justify-center w-50 h-50">
        <input
          type="file"
          onChange={handleFileChange}
          folder={isImage ? "/images" : "/audios"}
          tags={["SONG COVER", "AUDIO COVER"]}
          className="file-input file-input-bordered file-input-primary w-full max-w-xs"
          accept="image/jpeg, image/png, image/gif, audio/mpeg, audio/mp3"
          
        />
        <button onClick={uploadImage} className="btn">
          Upload
        </button>

        {uploadedImage && (
          <div>
            <h3>Uploaded Image:</h3>
            {isImage ? <img src={uploadedImage} alt={fileId} width="200" /> : <audio controls src={uploadedAudio} alt={fileId} />}
            {/* <img src={isImage? uploadedImage : uploadedAudio} alt={fileId} width="200" /> */}
            <button onClick={deleteImage} className="btn-delete  ">
              Delete
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Upload;
