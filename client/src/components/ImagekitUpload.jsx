"use client";
import React from "react";
import { IKImage } from "imagekitio-next";

const urlEndpoint = process.env.VITE_IMAGEKIT_URL_ENDPOINT;
const publickey = process.env.VITE_IMAGEKIT_PUBLIC_KEY;

const authenticator =  async () => {
    try {
        const response = await fetch('http://localhost:3001/auth');

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Request failed with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const { signature, expire, token } = data;
        return { signature, expire, token };
    } catch (error) {
        throw new Error(`Authentication request failed: ${error.message}`);
    }
};

export default function ImagekitUpload() {
  return (
    <div className="App">
      <h1>ImageKit Next.js quick start</h1>
      <IKImage urlEndpoint={urlEndpoint} publickey={publickey} path="default-image.jpg" width={400} height={400} 
  loading="lazy" alt="Alt text" />
    </div>
  );
}