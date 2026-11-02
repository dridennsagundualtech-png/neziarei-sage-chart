/**
 * Daily verses. One is chosen per day by rotating through the list
 * (day of the year modulo list length). Add as many as you like.
 */
export interface DailyVerse {
  text: string;
  ref: string;
}

export const VERSES: DailyVerse[] = [
  { text: "The Lord ruleth me: and I shall want nothing.", ref: "Psalm 23:1" },
  { text: "For God so loved the world, as to give his only begotten Son; that whosoever believeth in him, may not perish, but may have life everlasting.", ref: "John 3:16" },
  { text: "Come to me, all you that labour, and are burdened, and I will refresh you.", ref: "Matthew 11:28" },
  { text: "Be still and see that I am God.", ref: "Psalm 46:11" },
  { text: "I can do all things in him who strengtheneth me.", ref: "Philippians 4:13" },
  { text: "Behold the handmaid of the Lord; be it done to me according to thy word.", ref: "Luke 1:38" },
  { text: "Cast thy care upon the Lord, and he shall sustain thee.", ref: "Psalm 55:23" },
  { text: "I am the way, and the truth, and the life. No man cometh to the Father, but by me.", ref: "John 14:6" },
  { text: "Create a clean heart in me, O God: and renew a right spirit within my bowels.", ref: "Psalm 51:12" },
  { text: "Charity is patient, is kind: charity envieth not, dealeth not perversely; is not puffed up.", ref: "1 Corinthians 13:4" },
  { text: "Blessed are the clean of heart: for they shall see God.", ref: "Matthew 5:8" },
  { text: "And the light shineth in darkness, and the darkness did not comprehend it.", ref: "John 1:5" },
  { text: "Have confidence in the Lord with all thy heart, and lean not upon thy own prudence.", ref: "Proverbs 3:5" },
  { text: "Peace I leave with you, my peace I give unto you.", ref: "John 14:27" },
  { text: "The Lord is my light and my salvation, whom shall I fear?", ref: "Psalm 27:1" },
  { text: "Behold, I stand at the gate, and knock.", ref: "Revelation 3:20" },
];
