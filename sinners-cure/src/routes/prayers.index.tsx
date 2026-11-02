import { createFileRoute, Link } from "@tanstack/react-router";
import { BookHeart, CircleDot, HeartHandshake, ListChecks, Moon } from "lucide-react";
import { List, Page, Row, Section } from "@/components/app-ui";
import { PRAYERS } from "@/data/prayers";
import { GUIDES } from "@/data/practices";
import { t } from "@/lib/lang";

export const Route = createFileRoute("/prayers/")({
  component: PrayersPage,
});

const GROUP_ORDER = ["Essential", "Daily", "Marian", "Eucharist", "Protection", "For the dead"];
const GROUP_TITLE: Record<string, string> = {
  Essential: t("Essential prayers", "Mga pangunahing dasal"),
  Daily: t("Through the day", "Sa buong araw"),
  Marian: t("Marian", "Kay Maria"),
  Eucharist: t("Eucharist", "Eukaristiya"),
  Protection: t("Protection", "Proteksyon"),
  "For the dead": t("For the dead", "Para sa mga yumao"),
};

function PrayersPage() {
  const groups = [...new Set(PRAYERS.filter((p) => p.listed).map((p) => p.group ?? "Other"))].sort(
    (a, b) => ((GROUP_ORDER.indexOf(a) + 99) % 99) - ((GROUP_ORDER.indexOf(b) + 99) % 99),
  );
  return (
    <Page
      title={t("Prayers", "Mga Dasal")}
      subtitle={t(
        "Pray step by step, and learn how to live the faith day to day.",
        "Magdasal nang hakbang-hakbang, at matutong isabuhay ang pananampalataya araw-araw.",
      )}
    >
      <List>
        <Link to="/prayers/chaplet" className="block">
          <Row
            icon={<CircleDot className="size-5" aria-hidden />}
            title={t("Divine Mercy Chaplet", "Koronilya ng Banal na Awa")}
            detail={t("On the beads, one prayer at a time", "Sa butil, isang dasal bawat isa")}
          />
        </Link>
        <Link to="/prayers/confession" className="block">
          <Row
            icon={<HeartHandshake className="size-5" aria-hidden />}
            title={t("Going to Confession", "Pangungumpisal")}
            detail={t(
              "How to confess, and an examination of conscience",
              "Paano mangumpisal, at pagsusuri ng budhi",
            )}
          />
        </Link>
        <Link to="/prayers/examen" className="block">
          <Row
            icon={<Moon className="size-5" aria-hidden />}
            title={t("Night examination", "Pagsusuri sa gabi")}
            detail={t(
              "Three minutes with God before you sleep",
              "Tatlong minuto kasama ang Diyos bago matulog",
            )}
          />
        </Link>
        <Link to="/plan" className="block">
          <Row
            icon={<ListChecks className="size-5" aria-hidden />}
            title={t("Your plan of life", "Iyong plano ng buhay")}
            detail={t(
              "Choose the daily practices you want to keep",
              "Piliin ang mga gawaing espirituwal na gusto mong gawin araw-araw",
            )}
          />
        </Link>
      </List>

      <Section title={t("Living the faith", "Pagsasabuhay ng pananampalataya")}>
        <List>
          {GUIDES.map((g) => (
            <Link key={g.id} to="/learn/$id" params={{ id: g.id }} className="block">
              <Row title={g.title} detail={g.summary} />
            </Link>
          ))}
        </List>
      </Section>

      {groups.map((g) => (
        <Section key={g} title={GROUP_TITLE[g] ?? g}>
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
        <BookHeart className="size-5" aria-hidden />{" "}
        {t("The Rosary has its own tab below.", "May sariling tab sa ibaba ang Rosaryo.")}
      </p>
    </Page>
  );
}
