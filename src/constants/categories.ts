export interface MusicCategory {
  name: string;
  color: string;
  group?: string;
}

export const MUSIC_CATEGORIES: MusicCategory[] = [
  // Mainstream
  { name: "Pop", color: "from-pink-600 to-rose-700", group: "Mainstream" },
  { name: "Rock", color: "from-orange-600 to-amber-700", group: "Mainstream" },
  { name: "Hip Hop", color: "from-purple-600 to-indigo-800", group: "Mainstream" },
  { name: "R&B", color: "from-blue-600 to-cyan-800", group: "Mainstream" },
  { name: "Electronic", color: "from-emerald-600 to-teal-800", group: "Mainstream" },
  { name: "Dance", color: "from-fuchsia-600 to-purple-800", group: "Mainstream" },

  // Rock genres
  { name: "Alternative Rock", color: "from-red-600 to-rose-800", group: "Rock" },
  { name: "Indie Rock", color: "from-orange-500 to-red-700", group: "Rock" },
  { name: "Hard Rock", color: "from-gray-600 to-slate-900", group: "Rock" },
  { name: "Heavy Metal", color: "from-zinc-700 to-black", group: "Rock" },
  { name: "Punk Rock", color: "from-rose-700 to-red-900", group: "Rock" },
  { name: "Progressive Rock", color: "from-indigo-600 to-blue-900", group: "Rock" },
  { name: "Grunge", color: "from-stone-600 to-neutral-900", group: "Rock" },

  // Hip Hop
  { name: "Rap", color: "from-violet-600 to-purple-900", group: "Hip Hop" },
  { name: "Trap", color: "from-purple-700 to-fuchsia-900", group: "Hip Hop" },
  { name: "Drill", color: "from-slate-700 to-gray-950", group: "Hip Hop" },
  { name: "Old School Hip Hop", color: "from-amber-600 to-orange-900", group: "Hip Hop" },
  { name: "Conscious Hip Hop", color: "from-green-600 to-emerald-900", group: "Hip Hop" },
  { name: "Lo-Fi Hip Hop", color: "from-indigo-500 to-violet-800", group: "Hip Hop" },

  // Electronic
  { name: "EDM", color: "from-cyan-500 to-blue-800", group: "Electronic" },
  { name: "House", color: "from-teal-500 to-emerald-800", group: "Electronic" },
  { name: "Techno", color: "from-blue-700 to-indigo-950", group: "Electronic" },
  { name: "Trance", color: "from-violet-600 to-indigo-900", group: "Electronic" },
  { name: "Dubstep", color: "from-lime-600 to-green-900", group: "Electronic" },
  { name: "Drum and Bass", color: "from-sky-600 to-blue-950", group: "Electronic" },
  { name: "Ambient", color: "from-cyan-600 to-teal-900", group: "Electronic" },
  { name: "Synthwave", color: "from-fuchsia-600 to-indigo-900", group: "Electronic" },
  { name: "Disco", color: "from-pink-500 to-purple-800", group: "Electronic" },

  // R&B and Soul
  { name: "Contemporary R&B", color: "from-blue-600 to-indigo-900", group: "R&B and Soul" },
  { name: "Neo Soul", color: "from-amber-600 to-yellow-900", group: "R&B and Soul" },
  { name: "Soul", color: "from-orange-600 to-red-900", group: "R&B and Soul" },
  { name: "Funk", color: "from-yellow-600 to-orange-900", group: "R&B and Soul" },
  { name: "Motown", color: "from-rose-600 to-pink-900", group: "R&B and Soul" },

  // Jazz and Blues
  { name: "Jazz", color: "from-yellow-600 to-orange-800", group: "Jazz and Blues" },
  { name: "Smooth Jazz", color: "from-sky-600 to-indigo-800", group: "Jazz and Blues" },
  { name: "Bebop", color: "from-purple-600 to-blue-900", group: "Jazz and Blues" },
  { name: "Blues", color: "from-blue-800 to-slate-950", group: "Jazz and Blues" },
  { name: "Soul Jazz", color: "from-amber-700 to-red-900", group: "Jazz and Blues" },
  { name: "Swing", color: "from-orange-500 to-amber-900", group: "Jazz and Blues" },

  // Indian genres
  { name: "Indian Classical", color: "from-orange-600 to-amber-900", group: "Indian" },
  { name: "Carnatic", color: "from-orange-500 to-red-800", group: "Indian" },
  { name: "Hindustani Classical", color: "from-yellow-600 to-orange-900", group: "Indian" },
  { name: "Tamil Film Songs", color: "from-rose-600 to-pink-900", group: "Indian" },
  { name: "Tamil Indie", color: "from-purple-600 to-violet-900", group: "Indian" },
  { name: "Bollywood", color: "from-pink-600 to-red-900", group: "Indian" },
  { name: "Indian Pop", color: "from-fuchsia-600 to-purple-900", group: "Indian" },
  { name: "Bhangra", color: "from-yellow-500 to-orange-800", group: "Indian" },
  { name: "Punjabi", color: "from-orange-500 to-red-800", group: "Indian" },
  { name: "Telugu Songs", color: "from-red-600 to-orange-900", group: "Indian" },
  { name: "Malayalam Songs", color: "from-green-600 to-teal-900", group: "Indian" },
  { name: "Kannada Songs", color: "from-amber-600 to-yellow-900", group: "Indian" },
  { name: "Devotional", color: "from-yellow-500 to-orange-800", group: "Indian" },
  { name: "Ghazal", color: "from-indigo-600 to-purple-900", group: "Indian" },
  { name: "Qawwali", color: "from-emerald-600 to-green-900", group: "Indian" },

  // Other world genres
  { name: "Country", color: "from-amber-700 to-yellow-950", group: "World" },
  { name: "Folk", color: "from-green-600 to-lime-900", group: "World" },
  { name: "Reggae", color: "from-green-500 to-yellow-800", group: "World" },
  { name: "Latin", color: "from-red-600 to-orange-800", group: "World" },
  { name: "Afrobeats", color: "from-yellow-600 to-green-900", group: "World" },
  { name: "K-Pop", color: "from-pink-500 to-violet-900", group: "World" },
  { name: "J-Pop", color: "from-rose-500 to-pink-900", group: "World" },
  { name: "Gospel", color: "from-blue-600 to-indigo-900", group: "World" },
  { name: "Opera", color: "from-purple-700 to-slate-950", group: "World" },
  { name: "Classical", color: "from-stone-500 to-zinc-900", group: "World" },

  // Mood and listening styles
  { name: "Acoustic", color: "from-lime-600 to-green-900", group: "Mood & Style" },
  { name: "Instrumental", color: "from-teal-600 to-cyan-900", group: "Mood & Style" },
  { name: "Lo-Fi", color: "from-indigo-500 to-purple-900", group: "Mood & Style" },
  { name: "Chillout", color: "from-cyan-500 to-blue-900", group: "Mood & Style" },
  { name: "Meditation", color: "from-emerald-500 to-teal-900", group: "Mood & Style" },
  { name: "Soundtracks", color: "from-violet-600 to-indigo-950", group: "Mood & Style" },
  { name: "Anime", color: "from-pink-600 to-purple-900", group: "Mood & Style" },
  { name: "Christmas", color: "from-red-600 to-green-900", group: "Mood & Style" },
  { name: "Kids Music", color: "from-yellow-500 to-pink-800", group: "Mood & Style" },
];

export const GENRE_NAMES = MUSIC_CATEGORIES.map((c) => c.name);

