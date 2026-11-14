/**
 * Player feature — public contract.
 *
 * Owns playback state, the audio element, the queue and every transport
 * surface (bottom bar, mini player, queue drawer). Other features may only
 * read/mutate playback through `useMusicPlayer()`.
 */
export { MusicPlayerProvider, useMusicPlayer } from "./context/MusicPlayerContext";
export { MusicPlayer } from "./components/MusicPlayer";
export { MiniPlayer } from "./components/MiniPlayer";
export { QueueDrawer } from "./components/QueueDrawer";
