import { createFileRoute, Link } from "@tanstack/react-router";
import { BookHeart, CircleDot, HeartHandshake, ListChecks, Moon } from "lucide-react";
import { List, Page, Row, Section } from "@/components/app-ui";
import { PRAYERS } from "@/data/prayers";
import { GUIDES } from "@/data/practices";

export const Route = createFileRoute("/prayers/")({
  component: PrayersPage,
});

const GROUP_ORDER = ["Essential", "Daily", "Marian", "Eucharist", "Protection", "For the dead"];

function PrayersPage() {
  const groups = [...new Set(PRAYERS.filter((p) => p.listed).map((p) => p.group ?? "Other"))].sort(
    (a, b) => ((GROUP_ORDER.indexOf(a) + 99) % 99) - ((GROUP_ORDER.indexOf(b) + 99) % 99),
  );
  return (
    <Page title="Prayers" subtitle="Pray step by step, and learn how to live the faith day to day.">
      <List>
        <Link to="/prayers/chaplet" className="block">
          <Row
            icon={<CircleDot className="size-5" aria-hidden />}
            title="Divine Mercy Chaplet"
            detail="On the beads, one prayer at a time"
          />
        </Link>
        <Link to="/prayers/confession" className="block">
          <Row
            icon={<HeartHandshake className="size-5" aria-hidden />}
            title="Going to Confession"
            detail="How to confess, and an examination of conscience"
          />
        </Link>
        <Link to="/prayers/examen" className="block">
          <Row
            icon={<Moon className="size-5" aria-hidden />}
            title="Night examination"
            detail="Three minutes with God before you sleep"
          />
        </Link>
        <Link to="/plan" className="block">
          <Row
            icon={<ListChecks className="size-5" aria-hidden />}
            title="Your plan of life"
            detail="Choose the daily practices you want to keep"
          />
        </Link>
      </List>

      <Section title="Living the faith">
        <List>
          {GUIDES.map((g) => (
            <Link key={g.id} to="/learn/$id" params={{ id: g.id }} className="block">
              <Row title={g.title} detail={g.summary} />
            </Link>
          ))}
        </List>
      </Section>

      {groups.map((g) => (
        <Section
          key={g}
          title={g === "Essential" ? "Essential prayers" : g === "Daily" ? "Through the day" : g}
        >
          <List>
            {PRAYERS.filter((p) => p.listed && (p.group ?? "Other") === g).map((p) => (
              <Link key={p.id} to="/prayers/$id" params={{ id: p.id }} className="block">
                <Row
                  title={<span className="font-serif text-[1.2rem] font-medium">{p.title}</span>}
                />
              </Link>
            ))}
          </List>
        </Section>
      ))}
      <p className="mt-8 flex items-center gap-2 text-[0.95rem] text-muted-foreground">
        <BookHeart className="size-5" aria-hidden /> The Rosary has its own tab below.
      </p>
    </Page>
  );
}
