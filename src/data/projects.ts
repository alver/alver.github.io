export interface Project {
  title: string;
  desc: string;
  icon: string;
  url: string;
}

export const PROJECTS: Project[] = [
  {
    title: "Memory Ball Video Maker",
    desc: "Turn your photos into spinning memory-ball videos",
    icon: "◉",
    url: "https://alver.cc/memory-ball-video/",
  },
  {
    title: "Harry Potter TCG",
    desc: "Play the classic HP trading card game online",
    icon: "⚡",
    url: "https://alver.cc/hptcg-game/",
  },
  {
    title: "Lorcana TCG",
    desc: "Disney Lorcana card game tools",
    icon: "✦",
    url: "https://alver.cc/lorcana/",
  },
  {
    title: "Altered TCG",
    desc: "Altered card game companion",
    icon: "△",
    url: "https://alver.cc/altered/",
  },
  {
    title: "Legendary Encounters: The Matrix",
    desc: "Solo play of the Matrix deck-building board game",
    icon: "◎",
    url: "https://alver.cc/legendary_encounters_the_matrix/",
  },
  {
    title: "TRMNL GitHub Firmware",
    desc: "GitHub dashboard firmware for TRMNL e-ink displays",
    icon: "⌘",
    url: "https://github.com/alver/trmnl-github",
  },
];
