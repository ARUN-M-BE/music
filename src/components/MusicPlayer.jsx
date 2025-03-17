import { useState, useRef } from "react";

const MusicPlayer = ({ track }) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  return (
    <div className="border p-4 mt-2 rounded-lg shadow bg-white">
      <h3 className="font-semibold">{track.name}</h3>
      <audio ref={audioRef} src={track.url} />
      <button onClick={togglePlay} className="bg-blue-500 text-white px-4 py-2 rounded mt-2">
        {playing ? "Pause" : "Play"}
      </button>
    </div>
  );
};

export default MusicPlayer;
