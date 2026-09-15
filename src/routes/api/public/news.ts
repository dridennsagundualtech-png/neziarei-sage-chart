import { createFileRoute } from "@tanstack/react-router";

const FEED_URL = "https://finance.yahoo.com/news/rssindex";

type Headline = {
  title: string;
  url: string;
  publishedAt: string | null;
};

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function readTag(item: string, tag: string) {
  const match = item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1].trim()) : "";
}

function parseFeed(xml: string): Headline[] {
  return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)]
    .map((match) => {
      const item = match[1];
      const title = readTag(item, "title").replace(/<[^>]+>/g, "").trim();
      const url = readTag(item, "link").trim();
      const published = readTag(item, "pubDate");
      const publishedAt = published && !Number.isNaN(Date.parse(published))
        ? new Date(published).toISOString()
        : null;
      return { title, url, publishedAt };
    })
    .filter((headline) => headline.title && /^https:\/\//.test(headline.url))
    .slice(0, 20);
}

export const Route = createFileRoute("/api/public/news")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const response = await fetch(FEED_URL, {
            headers: { "User-Agent": "ChartPilot News/1.0" },
          });

          if (!response.ok) {
            return Response.json(
              { headlines: [], error: "News is temporarily unavailable." },
              { status: 502 },
            );
          }

          const headlines = parseFeed(await response.text());
          return Response.json(
            { headlines },
            { headers: { "Cache-Control": "public, max-age=300, s-maxage=600" } },
          );
        } catch {
          return Response.json(
            { headlines: [], error: "News is temporarily unavailable." },
            { status: 502 },
          );
        }
      },
    },
  },
});