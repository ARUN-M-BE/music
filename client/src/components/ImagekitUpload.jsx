"use client";
import React from 'react'
import { IKContext, IKImage, IKUpload } from 'imagekitio-react';

const urlEndpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT;
const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;

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

const ImagekitUpload = () => {
  return (
    <div className="App">
    <h1>ImageKit React quick start</h1>
    <IKContext 
      publicKey={publicKey} 
      urlEndpoint={urlEndpoint} 
      authenticator={authenticator} 
    >
      <p>Upload an image</p>
      <IKUpload
        path={fileName ?"image/*" : "audio/*"}
        fileName={fileName}
        onError={onError}
        onSuccess={onSuccess}
      />
    </IKContext>
    {/* ...other SDK components added previously */}
  </div>
  )

}

const onError = (error) => {
  console.log("Error during upload:", error);
};

const onSuccess = (res) => {
  console.log("Upload Success:", res);
};

export default ImagekitUpload;