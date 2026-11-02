# Writes src/data/verses.ts with exact Douay-Rheims text from public/bible/drc.
# Usage: python3 scripts/build-verses.py . src/data/verses.ts
import json, sys, re
ROOT = sys.argv[1]
V = [
 ("Mark 2:17", "MRK", 2, 17, 17, "Christ is the physician of sinners. Bring him the wound you usually hide."),
 ("Colossians 3:23", "COL", 3, 23, 23, "Offer your work to God and do it well, even the parts no one will see."),
 ("1 Thessalonians 5:17", "1TH", 5, 17, 17, "Turn small moments into prayer: Jesus, I trust in you."),
 ("Matthew 6:33", "MAT", 6, 33, 33, "Put God first today: prayer and his will before worry."),
 ("Philippians 4:13", "PHP", 4, 13, 13, "Face today's hardest task with Christ, not alone."),
 ("John 15:5", "JHN", 15, 5, 5, "Before each task, ask for his help in a few words."),
 ("Luke 1:38", "LUK", 1, 38, 38, "Say yes to God in the small things he asks of you today."),
 ("Psalm 51:3", "PSA", 51, 3, 3, "Tonight, look back on the day honestly and return to God."),
 ("Matthew 11:28", "MAT", 11, 28, 28, "When you are tired, stop for a moment and rest in him."),
 ("Romans 12:1", "ROM", 12, 1, 1, "Offer him the whole day: work, family and whatever you suffer."),
 ("Proverbs 16:3", "PRO", 16, 3, 3, "Before you start, commit your plans to the Lord."),
 ("Matthew 9:13", "MAT", 9, 13, 13, "Jesus came for sinners, and that includes you. Let him find you today."),
 ("1 Timothy 1:15", "1TI", 1, 15, 15, "Even the saints called themselves sinners. Humility is the door to mercy."),
 ("John 3:16", "JHN", 3, 16, 16, "God's love comes first. You don't have to earn it."),
 ("Psalm 23:1", "PSA", 23, 1, 1, "Whatever you lack today, you are not alone."),
 ("Psalm 46:11", "PSA", 46, 11, 11, "Find five minutes of silence today and spend them with God."),
 ("Lamentations 3:22-23", "LAM", 3, 22, 23, "Today is a new start. His mercy is new this morning too."),
 ("1 John 1:9", "1JN", 1, 9, 9, "If something weighs on your conscience, plan when you will go to Confession."),
 ("Luke 15:7", "LUK", 15, 7, 7, "No one is beyond return. Pray for someone who has drifted from God."),
 ("Isaiah 1:18", "ISA", 1, 18, 18, "Bring God the sin you are most ashamed of. It is not too big for him."),
 ("Micah 6:8", "MIC", 6, 8, 8, "Be fair, be kind, and walk with God in the next thing you do."),
 ("Matthew 5:8", "MAT", 5, 8, 8, "Guard your eyes and your heart today."),
 ("Matthew 25:40", "MAT", 25, 40, 40, "Do one hidden act of kindness for someone who can't repay you."),
 ("John 14:27", "JHN", 14, 27, 27, "Before you react in anger, pause and ask for his peace."),
 ("Proverbs 3:5", "PRO", 3, 5, 5, "Trust God with what you can't control."),
 ("Psalm 27:1", "PSA", 27, 1, 1, "Name your fear in prayer and hand it over to him."),
 ("Isaiah 41:10", "ISA", 41, 10, 10, "Whatever you face today, he is beside you."),
 ("Joshua 1:9", "JOS", 1, 9, 9, "Do the brave thing you have been putting off."),
 ("1 Corinthians 13:4", "1CO", 13, 4, 4, "Be patient with one person who tests you today."),
 ("Galatians 6:9", "GAL", 6, 9, 9, "Keep going in the good you have started, even if no one notices."),
 ("James 1:22", "JAS", 1, 22, 22, "Choose one line of today's Gospel and live it."),
 ("Luke 9:23", "LUK", 9, 23, 23, "Accept today's small cross without complaining."),
 ("Ephesians 4:32", "EPH", 4, 32, 32, "Forgive someone in your heart today, even before they ask."),
 ("Psalm 118:24", "PSA", 118, 24, 24, "Before you sleep, thank God for three things from today."),
 ("1 Peter 5:7", "1PE", 5, 7, 7, "Give him the worry you keep picking back up."),
 ("Matthew 6:34", "MAT", 6, 34, 34, "Do today's duty well and leave tomorrow to God."),
 ("John 6:35", "JHN", 6, 35, 35, "If you can't get to Mass, make a spiritual communion."),
 ("Psalm 119:105", "PSA", 119, 105, 105, "Read a page of the Gospel today and let it light your next step."),
 ("Romans 8:28", "ROM", 8, 28, 28, "Look for God's hand even in what went wrong today."),
 ("Philippians 4:6", "PHP", 4, 6, 6, "Turn your worry into a prayer, then thank him."),
 ("Hebrews 4:16", "HEB", 4, 16, 16, "Ask boldly. God wants to help you."),
 ("Matthew 5:44", "MAT", 5, 44, 44, "Pray by name for someone who has hurt you."),
 ("2 Corinthians 12:9", "2CO", 12, 9, 9, "Your weakness is where his grace works. Don't hide it from him."),
 ("Revelation 3:20", "REV", 3, 20, 20, "Open the door: say a short prayer right now."),
 ("John 8:11", "JHN", 8, 11, 11, "Receive his mercy, then change one thing."),
 ("Luke 23:42-43", "LUK", 23, 42, 43, "It is never too late to turn to him."),
 ("Ezekiel 36:26", "EZK", 36, 26, 26, "Ask God to soften the place in your heart that has grown hard."),
 ("Psalm 103:12", "PSA", 103, 12, 12, "Confessed sins are gone. Don't carry what God has taken away."),
 ("Isaiah 43:1", "ISA", 43, 1, 1, "You belong to God. Let that steady you today."),
 ("Psalm 34:9", "PSA", 34, 9, 9, "Taste and see: give God one quiet moment today and notice his goodness."),
]
out = []
for ref, b, c, v1, v2, apply in V:
    book = json.load(open(f"{ROOT}/public/bible/drc/{b}.json"))
    text = " ".join(book[c-1][v-1] for v in range(v1, v2+1))
    # Excerpts: drop psalm titles, Hebrew letter headings and the narrator's closing words.
    for cut in ("A psalm for David. ", "The psalm of David before he was anointed. ", "Heth. "):
        text = text.replace(cut, "")
    text = text.replace(" And the angel departed from her.", "")
    out.append((ref, f"{b}.{c}.{v1}" + (f"-{v2}" if v2 != v1 else ""), text, apply))
    print(ref, "|", text)
if len(sys.argv) > 2:
    with open(sys.argv[2], "w") as f:
        f.write('/**\n * Daily verses, one per day in rotation (day of the year modulo the list length).\n')
        f.write(' * `key` is BOOK.ch.v (or BOOK.ch.v-v2) in the bundled Bibles; `text` is the Douay-Rheims,\n')
        f.write(' * shown until the chosen translation loads. `apply`: a way to live the verse today\n')
        f.write(' * (Tagalog versions in verses.tl.ts, used when the app is in Tagalog).\n */\n')
        f.write('import { TL } from "@/lib/lang";\nimport { VERSE_APPLY_TL } from "./verses.tl";\n\n')
        f.write('export interface DailyVerse {\n  ref: string;\n  key: string;\n  text: string;\n  apply: string;\n}\n\n')
        f.write('const VERSES_EN: DailyVerse[] = [\n')
        for ref, key, text, apply in out:
            f.write('  { ref: %s, key: %s, text: %s, apply: %s },\n' % (json.dumps(ref), json.dumps(key), json.dumps(text, ensure_ascii=False), json.dumps(apply)))
        f.write('];\n\n')
        f.write('export const VERSES: DailyVerse[] = TL\n  ? VERSES_EN.map((v) => ({ ...v, apply: VERSE_APPLY_TL[v.key] ?? v.apply }))\n  : VERSES_EN;\n')
