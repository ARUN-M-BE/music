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

  SET_ALERT_TYPE: "SET_ALERT_TYPE",
  SET_SONG_PLAYING: "SET_SONG_PLAYING",
  SET_SONG_INDEX: "SET_SONG_INDEX",

  SET_ALL_SONGS: "SET_ALL_SONGS",
  SET_FILTERED_SONGS: "SET_FILTERED_SONGS",
  SET_SONG: "SET_SONG",
  SET_IS_SONG_PLAYING: "SET_IS_SONG_PLAYING",
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
    case actionType.SET_ALERT_TYPE:
      return {
        ...state,
        AlertType: action.AlertType,
      };
    case actionType.SET_SONG_PLAYING:
      return {
        ...state,
        songPlaying: action.songPlaying,
      };
    case actionType.SET_SONG_INDEX:
      return {
        ...state,
        songIndex: action.songIndex,
      };
    case actionType.SET_IS_PLAYLIST:
      return {
        ...state,
        isPlayList: action.isPlayList,
      };
      case actionType.SET_ALL_SONGS:
        return {
          ...state,
          allSongs: action.allSongs,
        };
      case actionType.SET_FILTERED_SONGS:
        return {
          ...state,
          filteredSongs: action.filteredSongs,
        };
      case actionType.SET_SONG:
        return {
          ...state,
          song: action.song,
        };
      case actionType.SET_IS_SONG_PLAYING:
        return {
          ...state,
          isSongPlaying: action.isSongPlaying,
        };

    default:
      return state;
  }
};

export default reducer;
