import ImageKit from "imagekit";
import dotenv from "dotenv";

dotenv.config();

const imagekit = new ImageKit({
  publicKey: import.meta.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: import.meta.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: import.meta.env.IMAGEKIT_URL_ENDPOINT,
});

export default imagekit;
