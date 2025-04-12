import React from 'react'
// import { ImagekitUpload } from 'imagekitio-react'
// import ImagekitUpload from './ImagekitUpload'



const UploadAndDelete = () => {
  return (
    <>
        <div className="flex flex-col items-center justify-center w-30 h-30">
            
            <ImagekitUpload/>
            <button className="bg-blue-500 text-white px-4 py-2 rounded">
            Upload
            </button>
        </div>
    </>
  )
}


export default UploadAndDelete;