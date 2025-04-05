import ImageKit from "imagekit";

const imagekit = new ImageKit({
        urlEndpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT,
        publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY,
        privateKey: import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY,
});

export async function GET(request){
        return NextResponce.json(imagekit.getAuthenticationParameters() );
}