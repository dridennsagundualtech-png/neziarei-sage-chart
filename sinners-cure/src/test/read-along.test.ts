import { describe, expect, it } from "vitest";
import { chunkText, chunksFrom, makeReading, offsetAt, prayerReading } from "@/lib/read-along";

describe("read-along", () => {
  const r = makeReading([
    "Luke 5.",
    "And it came to pass: when he was in a certain city, behold a man full of leprosy.",
    "Holy Mary, pray for us.\nMother of Christ\nMother of God.",
  ]);
  const chunks = chunkText(r.text);

  it("keeps every chunk's place in the text", () => {
    for (const c of chunks)
      expect(c.say.replace(/,/g, "")).toContain(
        r.text.slice(c.start, c.start + 4).replace(/,/g, ""),
      );
    expect(chunks.map((c) => c.say)).toEqual([
      "Luke 5.",
      "And it came to pass: when he was in a certain city, behold a man full of leprosy.",
      "Holy Mary, pray for us.",
      "Mother of Christ, Mother of God.",
    ]);
  });

  it("starts from a tapped word", () => {
    const from = chunksFrom(r.text, chunks, r.text.indexOf("rtain city"));
    expect(from[0]!.say).toBe("certain city, behold a man full of leprosy.");
    expect(from).toHaveLength(3);
  });

  it("moves through a sentence word by word", () => {
    const c = chunks[1]!;
    const words = [0, 1.5, 3, 4.9].map(
      (p) => r.text.slice(offsetAt(r.text, c, p, 5)).split(" ")[0],
    );
    expect(words[0]).toBe("And");
    expect(words[3]).toBe("leprosy.");
    expect(new Set(words).size).toBe(4);
  });

  it("reads prayers without ℣/℟ marks or rubrics, and finds each part", () => {
    const p = prayerReading(
      ["Angelus."],
      "V. The Angel of the Lord.\nR. And she conceived.\n\n(Pray three times.) Amen.",
    );
    expect(p.text).toBe("Angelus.\nThe Angel of the Lord.\nAnd she conceived.\n Amen.");
    expect(p.text.slice(p.at["0.0.0"]!)).toMatch(/^The Angel/);
    expect(p.text.slice(p.at["1.0.2"]!)).toMatch(/^ Amen/);
    expect(chunkText(p.text).map((c) => c.say)).toEqual([
      "Angelus.",
      "The Angel of the Lord.",
      "And she conceived.",
      "Amen.",
    ]);
  });
});
