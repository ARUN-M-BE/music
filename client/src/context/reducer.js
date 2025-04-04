export const actionType = {
  SET_USER: "SET_USER",
  SET_ALL_USERS: "SET_ALL_USERS",
  SET_ALL_SONGS: "SET_ALL_SONGS",
  SET_ALL_ARTISTS: "SET_ALL_ARTISTS",
  SET_ALL_ALBUMS: "SET_ALL_ALBUMS",
  // filters
  SET_FILTER_TERM: "SET_FILTER_TERM",
  SET_FILTER_ALBUM: "SET_FILTER_ALBUM",
  SET_FILTER_ARTIST: "SET_FILTER_ARTIST",
  SET_FILTER_LANGUAGE: "SET_FILTER_LANGUAGE",
};

const reducer = (state, action) => {
  console.log(action);

  switch (action.type) {
    case actionType.SET_USER:
      return {
        ...state,
        user: action.user,
      };
    case actionType.SET_ALL_USERS:
      return {
        ...state,
        allUsers: action.allUsers,
      };
    case actionType.SET_ALL_SONGS:
      return {
        ...state,
        allSongs: action.allSongs,
      };
    case actionType.SET_ALL_ARTISTS:
      return {
        ...state,
        allArtists: action.allArtists,
      };
    case actionType.SET_ALL_ALBUMS:
      return {
        ...state,
        allAlbums: action.allAlbums,
      };

      // FILTeRS
    case actionType.SET_FILTER_TERM:
      return {
        ...state,
        filterTerm: action.filterTerm,
      };
    case actionType.SET_FILTER_ALBUM:
      return {
        ...state,
        filterAlbum: action.filterAlbum,
      };
    case actionType.SET_FILTER_ARTIST:
      return {
        ...state,
        filterArtist: action.filterArtist,
      };
    case actionType.SET_FILTER_LANGUAGE:
      return {
        ...state,
        filterLanguage: action.filterLanguage,
      };
      

    default:
      return state;
  }
};

export default reducer;
