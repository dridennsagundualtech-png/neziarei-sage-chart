import { createFileRoute } from "@tanstack/react-router";

const FEED_URLS = [
  "https://finance.yahoo.com/news/rssindex",
  "https://feeds.content.dowjones.io/public/rss/mw_topstories",
  "https://www.cnbc.com/id/100003114/device/rss/rss.html",
];

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
  return decodeXml(match?.[1]?.trim() ?? "");
}

function parseFeed(xml: string): Headline[] {
  return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)]
    .map((match) => {
      const item = match[1] ?? "";
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
        for (const url of FEED_URLS) {
          try {
            const response = await fetch(url, {
              headers: { "User-Agent": "Mozilla/5.0 (compatible; ChartPilot News/1.0)" },
            });
            if (!response.ok) continue;
            const headlines = parseFeed(await response.text());
            if (!headlines.length) continue;
            return Response.json(
              { headlines },
              { headers: { "Cache-Control": "public, max-age=300, s-maxage=600" } },
            );
          } catch {
            // try next source
          }
        }
        // Soft failure: the ticker shows its fallback message instead of an error.
        return Response.json(
          { headlines: [], error: "News is temporarily unavailable." },
          { headers: { "Cache-Control": "public, max-age=60" } },
        );
      },
    },
  },
});