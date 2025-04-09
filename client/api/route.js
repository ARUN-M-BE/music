import ImageKit from "imagekit";

const imagekit = new ImageKit({
        urlEndpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT,
        publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY,
        privateKey: import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY,
});

export async function GET(request){
        return ReactResponse.json(imagekit.getAuthenticationParameters() );
}

export async function DELETE({url, request, params}, ReactResponse,){
        const urlObj = new URL(url);
        const fileId = urlObj.pathname.split("/").pop();
        const response = await imagekit.deleteFile(fileId);
        return ReactResponse.json({success: true, response});
        
}

// export async function POST({url, request, params}, ReactResponse){
//         const urlObj = new URL(url);
//         const fileId = urlObj.pathname.split("/").pop();
//         const file = await request.formData();
//         const fileName = file.get("fileName");
//         const response = await imagekit.upload({
//                 file: file,
//                 fileName: fileName,
//                 folder: "test",
//                 isPrivateFile: false,
//         });
//         return ReactResponse.json({success: true, response});

//         // const response = await imagekit.upload({
//         //         file: file,
//         //         fileName: fileName,
//         //         folder: "test",
//         //         isPrivateFile: false,
//         // });
//         // return ReactResponse.json({success: true, response});
// }




