// User Browser ----> Our Own server  ----> ImageKit Server
// User Browser ----> ImageKit Server
import React from 'react'
// import { ImagekitUpload } from 'imagekitio-react'
import ImagekitUpload from './ImagekitUpload'


const Upload = () => {
  return (
    <>
        <div className="flex flex-col items-center justify-center h-screen">
            
            <ImagekitUpload />
            <button className="bg-blue-500 text-white px-4 py-2 rounded">
            Upload
            </button>
        </div>
    </>
  )
}

export default Upload