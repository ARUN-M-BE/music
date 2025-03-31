import axios from "axios";

const baseUrl = "http://localhost:3000/";

export const validateUser = async (token) => {
  try {
    const res = await axios.get(`${baseUrl}api/users/login`, {
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    return res.data;
  } catch (error) {
    return error;
  }
};

export const getAllUsers = async (token) => {
  try {
    const res = await axios.get(`${baseUrl}api/users/getAll`);
    return res.data;
  } catch (error) {
    return null;
  }
};

export const getAllSongs = async (token) => {
  try {
    const res = await axios.get(`${baseUrl}api/songs/getAll`);
    return res.data;
  } catch (error) {
    return null;
  }
};

export const getAllArtists = async (token) => {
  try {
    const res = await axios.get(`${baseUrl}api/artists/getAll`);
    return res.data;
  } catch (error) {
    return null;
  }
};

export const getAllAlbums = async (token) => {
  try {
    const res = await axios.get(`${baseUrl}api/albums/getAll`);
    return res.data;
  } catch (error) {
    return null;
  }
};

export const changingUserRole = async (userId, role) => {
  try {
    const res = await axios.put(`${baseUrl}api/users/updateRole/${userId}`, {
      data: { role: role },
    });
    return res;
  } catch (error) {
    return null;
  }
};
