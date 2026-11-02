"""Builds the offline Mass readings and saints calendar.

Source: https://github.com/jayarathina/Tamil-Catholic-Lectionary (public domain, Unlicense),
files MySQL/liturgy_lectionary_table_readings__list.sql and
MySQL/liturgy_lectionary_table_generalcalendar.sql. Only the reading citations and the
General Roman Calendar are used; the citations are converted to English book names.

Writes:
  src/data/lectionary.json        dayID -> [[type, citation, spans], ...]
  src/data/general-calendar.json  [[month, day, name, type], ...]

A span is [BOOK, fromChapter, fromVerse, toChapter, toVerse] in the numbering of the
bundled Bibles (public/bible): Hebrew psalm numbers with the psalm title counted as a
verse (as in the Douay-Rheims and most lectionaries), Joel 4 chapters, Malachi 3.

Usage: python3 scripts/build-lectionary.py <path to Tamil-Catholic-Lectionary/MySQL>
"""

import json
import re
import sys
from pathlib import Path

SRC = Path(sys.argv[1])
OUT = Path(__file__).resolve().parent.parent / "src" / "data"

BOOKS = {
    "திபா": "PSA", "மத்": "MAT", "யோவா": "JHN", "லூக்": "LUK", "மாற்": "MRK", "எசா": "ISA",
    "திப": "ACT", "1கொரி": "1CO", "உரோ": "ROM", "2கொரி": "2CO", "எபி": "HEB", "எபே": "EPH",
    "தொநூ": "GEN", "1யோவா": "1JN", "திவெ": "REV", "எசே": "EZK", "1பேது": "1PE", "பிலி": "PHP",
    "2திமொ": "2TI", "எரே": "JER", "சீஞா": "SIR", "விப": "EXO", "யாக்": "JAS", "கலா": "GAL",
    "1அர": "1KI", "இச": "DEU", "கொலோ": "COL", "1தெச": "1TH", "1சாமு": "1SA", "சாஞா": "WIS",
    "2சாமு": "2SA", "1திமொ": "1TI", "ஓசே": "HOS", "தானி": "DAN", "தானி(இ)": "DAN+", "நீமொ": "PRO",
    "தோபி": "TOB", "ஆமோ": "AMO", "2அர": "2KI", "2தெச": "2TH", "மீக்": "MIC", "எண்": "NUM",
    "செக்": "ZEC", "யோவே": "JOL", "யோபு": "JOB", "2மக்": "2MA", "2குறி": "2CH", "லேவி": "LEV",
    "செப்": "ZEP", "யோனா": "JON", "1குறி": "1CH", "இபா": "SNG", "நீத": "JDG", "மலா": "MAL",
    "யோசு": "JOS", "யூதி": "JDT", "2பேது": "2PE", "பாரூ": "BAR", "சஉ": "ECC", "1மக்": "1MA",
    "நெகே": "NEH", "எஸ்ரா": "EZR", "புல": "LAM", "அப": "HAB", "ரூத்": "RUT", "பில": "PHM",
    "ஆகா": "HAG", "யூதா": "JUD", "நாகூ": "NAM", "2யோவா": "2JN", "3யோவா": "3JN", "தீத்": "TIT",
    "எஸ்(கி)": "EST+",
}
NAMES = {
    "GEN": "Genesis", "EXO": "Exodus", "LEV": "Leviticus", "NUM": "Numbers", "DEU": "Deuteronomy",
    "JOS": "Joshua", "JDG": "Judges", "RUT": "Ruth", "1SA": "1 Samuel", "2SA": "2 Samuel",
    "1KI": "1 Kings", "2KI": "2 Kings", "1CH": "1 Chronicles", "2CH": "2 Chronicles", "EZR": "Ezra",
    "NEH": "Nehemiah", "TOB": "Tobit", "JDT": "Judith", "EST": "Esther", "1MA": "1 Maccabees",
    "2MA": "2 Maccabees", "JOB": "Job", "PSA": "Psalm", "PRO": "Proverbs", "ECC": "Ecclesiastes",
    "SNG": "Song of Songs", "WIS": "Wisdom", "SIR": "Sirach", "ISA": "Isaiah", "JER": "Jeremiah",
    "LAM": "Lamentations", "BAR": "Baruch", "EZK": "Ezekiel", "DAN": "Daniel", "HOS": "Hosea",
    "JOL": "Joel", "AMO": "Amos", "JON": "Jonah", "MIC": "Micah", "NAM": "Nahum", "HAB": "Habakkuk",
    "ZEP": "Zephaniah", "HAG": "Haggai", "ZEC": "Zechariah", "MAL": "Malachi", "MAT": "Matthew",
    "MRK": "Mark", "LUK": "Luke", "JHN": "John", "ACT": "Acts", "ROM": "Romans", "1CO": "1 Corinthians",
    "2CO": "2 Corinthians", "GAL": "Galatians", "EPH": "Ephesians", "PHP": "Philippians",
    "COL": "Colossians", "1TH": "1 Thessalonians", "2TH": "2 Thessalonians", "1TI": "1 Timothy",
    "2TI": "2 Timothy", "TIT": "Titus", "PHM": "Philemon", "HEB": "Hebrews", "JAS": "James",
    "1PE": "1 Peter", "2PE": "2 Peter", "1JN": "1 John", "2JN": "2 John", "3JN": "3 John", "JUD": "Jude",
    "REV": "Revelation",
}
ONE_CHAPTER = {"PHM", "2JN", "3JN", "JUD"}
SEQUENCES = {
    "Victimae": "Victimae paschali laudes",
    "VeniSancteSpiritus": "Veni, Sancte Spiritus",
    "LaudaSion": "Lauda Sion",
    "StabatMater": "Stabat Mater",
}
# Verses the Douay-Rheims psalm counts beyond an English Bible without titles (KJV),
# by Hebrew psalm number. The Tamil lectionary numbers psalm verses without titles.
PSALM_OFFSET = [0, 1, 1, 2, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1,
                1, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 2, 2, 1, 2, 1, 0, 1, 1, 1, 2,
                1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 0,
                0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0]
# Greek Esther (Thursday, 1st week of Lent): Esther C:12, 14-16, 23-25 = Douay-Rheims 14:1, 3-5, 12-14.
SPECIAL = {
    "எஸ்(கி)4:17k-m,r-t": ["Esther C:12, 14-16, 23-25", [["EST", 14, 1, 14, 1], ["EST", 14, 3, 14, 5], ["EST", 14, 12, 14, 14]]],
}

PIECE = re.compile(r"^(?:(\d+):)?(\d+)([a-z]*)$")


def convert(book, c, v):
    """Tamil (English Bible) numbering -> numbering of the bundled Bibles."""
    if book == "PSA":
        return c, v + PSALM_OFFSET[c - 1]
    if book == "MAL" and c == 4:
        return 3, v + 18
    if book == "JOL":
        if c == 2 and v >= 28:
            return 3, v - 27
        if c == 3:
            return 4, v
    if book == "DAN+":  # Daniel additions (Song of the Three): 1:X = Daniel 3:X+23
        return 3, v + 23
    return c, v


def parse(ref):
    if ref in SPECIAL:
        return SPECIAL[ref]
    ref = ref.split("~")[0]
    m = re.match(r"^(\d?[^\d:]+?)(\d.*)$", ref)
    if not m or m.group(1) not in BOOKS:
        return None
    book, rest = BOOKS[m.group(1)], m.group(2)
    if book == "EST+":
        return None
    if ":" not in rest:
        if book not in ONE_CHAPTER:
            return None
        rest = "1:" + rest
    real = "DAN" if book == "DAN+" else book
    spans, parts = [], []
    chapter = None
    for token in re.split(r"[,.;]", rest):
        token = token.strip()
        if not token or re.fullmatch(r"[a-z]+", token):
            continue  # empty, or only more letters of the verse just listed
        pieces = token.split("-")
        points = []
        for p in pieces:
            if re.fullmatch(r"[a-z]+", p) and points:
                continue  # letter range inside one verse, e.g. 9a-c
            pm = PIECE.match(p)
            if not pm:
                return None
            if pm.group(1):
                chapter = int(pm.group(1))
            if chapter is None:
                return None
            points.append((chapter, int(pm.group(2)), pm.group(3)))
        (c1, v1, l1), (c2, v2, l2) = points[0], points[-1]
        c1, v1 = convert(book, c1, v1)
        c2, v2 = convert(book, c2, v2)
        if book == "PSA":
            l1 = l2 = ""
        spans.append([real, c1, v1, c2, v2])
        parts.append((c1, f"{v1}{l1}", c2, f"{v2}{l2}", len(points) > 1))
    if book == "PSA":  # without verse letters, stanzas like 10, 10-11 read as 10-11
        merged = []
        for part in parts:
            prev = merged[-1] if merged else None
            if prev and prev[2] == part[0] and int(part[1]) <= int(prev[3]):
                if (part[2], int(part[3])) > (prev[2], int(prev[3])):
                    merged[-1] = (prev[0], prev[1], part[2], part[3], True)
                continue
            merged.append(part)
        parts = merged
    # English citation text
    out, last_c = "", None
    for i, (c1, a, c2, b, is_range) in enumerate(parts):
        if i:
            out += "; " if c1 != last_c else ", "
        out += a if c1 == last_c else f"{c1}:{a}"
        if is_range:
            out += "-" + (b if c2 == c1 else f"{c2}:{b}")
        last_c = c2
    if real in ONE_CHAPTER:
        out = re.sub(r"(^|; )1:", r"\1", out)
    return [f"{NAMES[real]} {out}", spans]


def main():
    sql = (SRC / "liturgy_lectionary_table_readings__list.sql").read_text(encoding="utf8")
    rows = re.findall(r"\('((?:[^'\\]|\\.)*)', ([0-9.]+), '((?:[^'\\]|\\.)*)'\)", sql)
    lect, skipped = {}, []
    for day, typ, ref in rows:
        day = day.replace("\\'", "'")
        if day.startswith("IN ") or day.startswith("_") or "~Chrism" in day:
            continue
        major = typ.split(".")[0]
        if major in ("5", "9"):
            continue  # Gospel acclamations and pointers to the commons
        if major == "4":
            if ref in SEQUENCES:
                lect.setdefault(day, []).append([typ, SEQUENCES[ref], []])
            continue
        parsed = parse(ref)
        if not parsed:
            skipped.append((day, typ, ref))
            continue
        lect.setdefault(day, []).append([typ, parsed[0], parsed[1]])
    for v in lect.values():
        v.sort(key=lambda r: float(r[0]))
    (OUT / "lectionary.json").write_text(json.dumps(lect, ensure_ascii=False, separators=(",", ":")))

    cal_sql = (SRC / "liturgy_lectionary_table_generalcalendar.sql").read_text(encoding="utf8")
    cal = re.findall(r"\((\d+), (\d+), '((?:[^'\\]|\\.)*)', '(?:[^'\\]|\\.)*', '([A-Za-z-]+)'\)", cal_sql)
    general = [[int(m), int(d), name.replace("\\'", "'"), typ] for m, d, name, typ in cal]
    (OUT / "general-calendar.json").write_text(json.dumps(general, ensure_ascii=False, indent=0))
    print(f"{len(lect)} days of readings, {len(general)} calendar entries, skipped {len(skipped)}")
    for s in skipped:
        print("  skipped", s)


main()
