import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Page } from "@/components/app-ui";
import { guideById, type GuideBlock } from "@/data/practices";
import { VERSES } from "@/data/verses";
import { t } from "@/lib/lang";

export const Route = createFileRoute("/learn/$id")({
  loader: ({ params }) => {
    const g = guideById(params.id);
    if (!g) throw notFound();
    return g;
  },
  component: GuidePage,
});

function Block({ b }: { b: GuideBlock }) {
  switch (b.kind) {
    case "p":
      return <p>{b.text}</p>;
    case "h":
      return (
        <h2 className="pt-4 font-serif text-[1.45rem] font-semibold leading-tight">{b.text}</h2>
      );
    case "note":
      return <p className="rounded-xl bg-secondary p-4">{b.text}</p>;
    case "quote":
      return (
        <figure className="border-l-2 border-primary py-1 pl-4">
          <blockquote className="scripture italic">{b.text}</blockquote>
          <figcaption className="mt-1 text-[0.95rem] text-muted-foreground">{b.cite}</figcaption>
        </figure>
      );
    case "list": {
      const Tag = b.ordered ? "ol" : "ul";
      return (
        <Tag className="space-y-2.5">
          {b.items.map((item, i) => (
            <li key={item} className="flex gap-3">
              {b.ordered ? (
                <span className="w-5 shrink-0 text-right font-serif text-[1.15rem] text-rubric">
                  {i + 1}
                </span>
              ) : (
                <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-rubric" />
              )}
              <span>{item}</span>
            </li>
          ))}
        </Tag>
      );
    }
    case "verses":
      return (
        <ul className="space-y-6">
          {b.refs.map((ref) => {
            const v = VERSES.find((x) => x.ref === ref);
            if (!v) return null;
            return (
              <li key={ref}>
                <p className="scripture">“{v.text}”</p>
                <p className="mt-1 font-semibold text-primary">{v.ref}</p>
                <p className="mt-1">{v.apply}</p>
              </li>
            );
          })}
        </ul>
      );
    case "links":
      return (
        <div className="flex flex-col pt-2">
          {b.items.map((l) => (
            <a
              key={l.to}
              href={`#${l.to}`}
              className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary"
            >
              {l.label} <ChevronRight className="size-5" aria-hidden />
            </a>
          ))}
        </div>
      );
  }
}

function GuidePage() {
  const g = Route.useLoaderData();
  return (
    <Page
      back={{ to: "/prayers", label: t("Prayers", "Mga Dasal") }}
      title={g.title}
      subtitle={g.summary}
    >
      <div className="space-y-4 text-[1.05rem] leading-relaxed">
        {g.blocks.map((b, i) => (
          <Block key={i} b={b} />
        ))}
      </div>
      <p className="mt-10 text-[0.92rem] text-muted-foreground">
        {t(
          "CCC: Catechism of the Catholic Church. can.: Code of Canon Law. For your own situation, ask a priest.",
          "CCC: Katesismo ng Simbahang Katolika. can.: Kodigo ng Batas Kanoniko. Para sa sarili mong kalagayan, magtanong sa pari.",
        )}{" "}
        <Link to="/prayers" className="underline underline-offset-2">
          {t("All prayers and guides", "Lahat ng dasal at gabay")}
        </Link>
      </p>
    </Page>
  );
}
