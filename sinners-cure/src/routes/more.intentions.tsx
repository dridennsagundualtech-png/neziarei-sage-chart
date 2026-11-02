import { createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { Page } from "@/components/app-ui";
import { IntentionsBox } from "@/components/intentions-box";
import { useIntentions } from "@/lib/intentions";
import { t } from "@/lib/lang";

export const Route = createFileRoute("/more/intentions")({
  component: IntentionsPage,
});

function IntentionsPage() {
  const [list, setList] = useIntentions();
  return (
    <Page
      back={{ to: "/more", label: t("More", "Iba pa") }}
      title={t("Prayer intentions", "Mga intensyon sa dasal")}
      subtitle={t(
        "Private to this phone. Tick an intention when it's answered, and give thanks.",
        "Pribado sa teleponong ito. Lagyan ng tsek ang intensyong natugunan na, at magpasalamat.",
      )}
    >
      <IntentionsBox />
      {list.length > 0 && (
        <ul className="card-surface divide-y overflow-hidden">
          {list.map((i) => (
            <li key={i.id} className="flex items-center gap-3 px-4 py-2">
              <label className="flex min-h-12 flex-1 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  className="size-6 shrink-0 accent-primary"
                  checked={!!i.answered}
                  onChange={(e) =>
                    setList((l) =>
                      l.map((x) => (x.id === i.id ? { ...x, answered: e.target.checked } : x)),
                    )
                  }
                  aria-label={t("Answered", "Natugunan na")}
                />
                <span className={i.answered ? "text-muted-foreground line-through" : ""}>
                  {i.text}
                </span>
              </label>
              <button
                onClick={() => setList((l) => l.filter((x) => x.id !== i.id))}
                className="flex size-11 items-center justify-center text-muted-foreground"
                aria-label={t(`Delete ${i.text}`, `Burahin ang ${i.text}`)}
              >
                <Trash2 className="size-5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
