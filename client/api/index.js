import axios from "axios";

const baseUrl = "https://g-music-pvze.onrender.com/";

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

export const removeUser = async (userId) => {
  try {
    const res = await axios.delete(`${baseUrl}api/users/delete/${userId}`);
    return res;
  } catch (error) {
    return null;
  }
}

export const saveNewSong = async (data) => {
  try {
    const res = await axios.post(`${baseUrl}api/songs/save`, { ...data});
    return res.data.saveedSong;
  } catch (error) {
    console.error("saveNewSong error:", error.response?.data || error.message);
    return null;
  }
};
export const saveNewAlbum = async (data) => {
  try {
    const res = await axios.post(`${baseUrl}api/albums/save`, { ...data});
    return res.data.saveedAlbum;
  } catch (error) {
    console.error("saveNewAlbum error:", error.response?.data || error.message);
    return null;
  }
};

export const saveNewArtist = async (data) => {
  try {
    const res = await axios.post(`${baseUrl}api/artists/save`, { ...data});
    return res.data.saveedArtist;
  } catch (error) {
    console.error("saveNewArtist error:", error.response?.data || error.message);
    return null;
  }
};

export const deleteSong = async (songId) => {
  try {
    const res = await axios.delete(`${baseUrl}api/songs/delete/${songId}`);
    return res;
  } catch (error) {
    console.error("deleteSong error:", error.response?.data || error.message);
    return null;
  }
};

export const deleteAlbum = async (albumId) => {
  try {
    const res = await axios.delete(`${baseUrl}api/albums/delete/${albumId}`);
    return res;
  } catch (error) {
    console.error("deleteAlbum error:", error.response?.data || error.message);
    return null;
  }
};  

export const deleteArtist = async (artistId) => {
  try {
    const res = await axios.delete(`${baseUrl}api/artists/delete/${artistId}`);
    return res;
  } catch (error) {
    console.error("deleteArtist error:", error.response?.data || error.message);
    return null;
  }
};  