import React, { useState, useEffect } from "react";
import { auth, db } from "./components/firebaseConfig";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import UploadMusic from "./components/UploadMusic";
import MusicPlayer from "./components/MusicPlayer";
import Auth from "./components/Auth";
import "./App.css";

const App = () => {
  const [user, setUser] = useState(null);
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    auth.onAuthStateChanged((user) => setUser(user));

    if (user) {
      // Ensure the query matches Firestore's indexing
      const q = query(collection(db, "music"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setTracks(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      });

      return () => unsubscribe();
    }
  }, [user]);


  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-gray-100 rounded-lg shadow-md">
      <Auth user={user} setUser={setUser} />
      {user ? (
        <>
          <h1 className="text-2xl font-bold text-center mb-4">Music Upload & Play</h1>
          {/* <UploadMusic /> */}
          {tracks.length > 0 && (
            <div className="mt-4">
              <h2 className="text-lg font-semibold">Your Playlist</h2>
              {tracks.map((track) => (
                <MusicPlayer key={track.id} track={track} />
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-center">Please login to upload and listen to music.</p>
      )}
    </div>
  );
};

export default App;
