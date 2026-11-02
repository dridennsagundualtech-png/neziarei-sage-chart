// Converts a scrollmapper Bible JSON (https://github.com/scrollmapper/bible_databases,
// formats/json/DRC.json or CPDV.json, both public domain) into one file per book:
//   public/bible/<id>/<BOOK>.json = [[verse 1, verse 2, ...], ...]  (chapter N at index N-1)
// Numbering follows the Mass lectionary: Hebrew psalm numbers, Joel 4 chapters, Malachi 3.
// Usage: node scripts/build-bible.mjs <source.json> <drc|cpdv>
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [src, id] = process.argv.slice(2);
if (!src || !id) throw new Error("usage: build-bible.mjs <source.json> <id>");

const NAMES = {
  Genesis: "GEN", Exodus: "EXO", Leviticus: "LEV", Numbers: "NUM", Deuteronomy: "DEU", Joshua: "JOS",
  Judges: "JDG", Ruth: "RUT", "I Samuel": "1SA", "II Samuel": "2SA", "I Kings": "1KI", "II Kings": "2KI",
  "I Chronicles": "1CH", "II Chronicles": "2CH", Ezra: "EZR", Nehemiah: "NEH", Tobit: "TOB", Judith: "JDT",
  Esther: "EST", "I Maccabees": "1MA", "II Maccabees": "2MA", Job: "JOB", Psalms: "PSA", Proverbs: "PRO",
  Ecclesiastes: "ECC", "Song of Solomon": "SNG", Wisdom: "WIS", Sirach: "SIR", Isaiah: "ISA", Jeremiah: "JER",
  Lamentations: "LAM", Baruch: "BAR", Ezekiel: "EZK", Daniel: "DAN", Hosea: "HOS", Joel: "JOL", Amos: "AMO",
  Obadiah: "OBA", Jonah: "JON", Micah: "MIC", Nahum: "NAM", Habakkuk: "HAB", Zephaniah: "ZEP", Haggai: "HAG",
  Zechariah: "ZEC", Malachi: "MAL", Matthew: "MAT", Mark: "MRK", Luke: "LUK", John: "JHN", Acts: "ACT",
  Romans: "ROM", "I Corinthians": "1CO", "II Corinthians": "2CO", Galatians: "GAL", Ephesians: "EPH",
  Philippians: "PHP", Colossians: "COL", "I Thessalonians": "1TH", "II Thessalonians": "2TH", "I Timothy": "1TI",
  "II Timothy": "2TI", Titus: "TIT", Philemon: "PHM", Hebrews: "HEB", James: "JAS", "I Peter": "1PE",
  "II Peter": "2PE", "I John": "1JN", "II John": "2JN", "III John": "3JN", Jude: "JUD", "Revelation of John": "REV",
};

/** Vulgate psalm (chapter, verse) -> Hebrew numbering used by the lectionary. */
function psalm(c, v) {
  if (c <= 8 || c >= 148) return [c, v];
  if (c === 9) return v <= 21 ? [9, v] : [10, v - 21];
  if (c <= 112) return [c + 1, v];
  if (c === 113) return v <= 8 ? [114, v] : [115, v - 8];
  if (c === 114) return [116, v];
  if (c === 115) return [116, v + 9];
  if (c <= 145) return [c + 1, v];
  if (c === 146) return [147, v];
  return [147, v + 11]; // 147
}
const MAP = {
  PSA: psalm,
  JOL: (c, v) => (c === 2 && v >= 28 ? [3, v - 27] : c === 3 ? [4, v] : [c, v]),
  MAL: (c, v) => (c === 4 ? [3, v + 18] : [c, v]),
};

const HEBREW_LETTER = /^(Aleph|Beth|Gimel|Daleth|He|Vau|Zain|Heth|Teth|Jod|Caph|Lamed|Mem|Nun|Samech|Ain|Phe|Sade|Coph|Res|Sin|Shin|Tau)\.\s+/;
const data = JSON.parse(readFileSync(src, "utf8"));
const out = join("public", "bible", id);
mkdirSync(out, { recursive: true });
let count = 0;
for (const book of data.books) {
  const code = NAMES[book.name];
  if (!code) continue; // skips 1-2 Esdras, Prayer of Manasses, Laodiceans
  const map = MAP[code] ?? ((c, v) => [c, v]);
  const chapters = [];
  for (const ch of book.chapters) {
    for (const vs of ch.verses) {
      const [c, v] = map(ch.chapter, vs.verse);
      chapters[c - 1] ??= [];
      // Lamentations is an acrostic; the Douay-Rheims prints the Hebrew letter before each verse.
      chapters[c - 1][v - 1] = vs.text.trim().replace(HEBREW_LETTER, "");
    }
  }
  for (let i = 0; i < chapters.length; i++) {
    chapters[i] ??= [];
    for (let j = 0; j < chapters[i].length; j++) chapters[i][j] ??= "";
  }
  writeFileSync(join(out, `${code}.json`), JSON.stringify(chapters));
  count++;
}
console.log(`${id}: wrote ${count} books to ${out}`);
