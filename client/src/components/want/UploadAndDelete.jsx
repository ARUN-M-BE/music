import { useState } from "react";
import { baseURL } from "../config/config";


function UploadAndDelete() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const uploadImage = async () => {
    const formData = new FormData();
    formData.append("file", selectedFile);

    const res = await fetch(
      `${baseURL}api/media/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    if (data.success) {
      setUploadedImage(data.data); // Contains fileId and url
      alert("Upload success!");
    }
  };

  const deleteImage = async () => {
    if (!uploadedImage?.fileId) return;

    const res = await fetch(
      `${baseURL}api/media/delete/${uploadedImage.fileId}`,
      {
        method: "DELETE",
      }
    );

    const data = await res.json();
    if (data.success) {
      alert("Image deleted!");
      setUploadedImage(null);
    }
  };

  return (
    <div className="p-4">
      <input type="file" onChange={handleFileChange} />
      <button onClick={uploadImage} className="btn">
        Upload
      </button>

      {uploadedImage && (
        <div>
          <img src={uploadedImage.url} alt="Uploaded" width="200" />
          <button onClick={deleteImage} className="btn-delete">
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default UploadAndDelete;
