import { useQuery } from "@tanstack/react-query";
import { Newspaper } from "lucide-react";

type Headline = { title: string; url: string; publishedAt: string | null };

async function getHeadlines(): Promise<Headline[]> {
  const response = await fetch("/api/public/news");
  if (!response.ok) throw new Error("News is temporarily unavailable");
  const data = (await response.json()) as { headlines?: Headline[] };
  return data.headlines ?? [];
}

export function NewsPanel() {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["market-news"],
    queryFn: getHeadlines,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

  const status = isLoading
    ? "Loading the latest market headlines…"
    : isError || data.length === 0
      ? "Market headlines are temporarily unavailable."
      : null;
  const repeatedHeadlines = data.length ? [...data, ...data] : [];

  return (
    <section aria-label="Market news" className="flex min-h-12 overflow-hidden rounded-lg border border-border bg-card shadow-soft">
      <div className="relative z-10 flex shrink-0 items-center gap-2 border-r border-border bg-primary px-3 text-primary-foreground sm:px-4">
        <Newspaper aria-hidden="true" className="size-4" />
        <h2 className="font-display text-xs font-bold uppercase sm:text-sm">Market News</h2>
      </div>

      <div className="news-ticker group flex min-w-0 flex-1 items-center overflow-hidden">
        {status ? (
          <p className="px-4 text-sm text-muted-foreground" role="status">{status}</p>
        ) : (
          <div className="news-ticker-track flex w-max items-center py-3 group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]">
            {repeatedHeadlines.map((headline, index) => (
              <a
                key={`${headline.url}-${index}`}
                href={headline.url}
                target="_blank"
                rel="noreferrer"
                className="flex shrink-0 items-center text-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-none"
                tabIndex={index < data.length ? 0 : -1}
                aria-hidden={index >= data.length}
              >
                <span aria-hidden="true" className="mx-4 size-1.5 rounded-full bg-primary sm:mx-6" />
                <span>{headline.title}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
