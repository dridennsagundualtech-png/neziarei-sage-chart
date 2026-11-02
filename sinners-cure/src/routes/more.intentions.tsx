import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Trash2 } from "lucide-react";
import { Page } from "@/components/app-ui";
import { IntentionsBox } from "@/components/intentions-box";
import { useIntentions } from "@/lib/intentions";

export const Route = createFileRoute("/more/intentions")({
  head: () => ({
    meta: [
      { title: "Prayer Intentions — Sinner's Cure" },
      { name: "description", content: "A private list of prayer intentions, kept only on your phone." },
      { property: "og:title", content: "Prayer Intentions — Sinner's Cure" },
      { property: "og:description", content: "A private list of prayer intentions, kept only on your phone." },
    ],
  }),
  component: IntentionsPage,
});

function IntentionsPage() {
  const [list, setList] = useIntentions();
  return (
    <Page title="Intentions">
      <Link to="/more" className="-mt-2 mb-4 inline-flex min-h-11 items-center gap-1 text-primary">
        <ChevronLeft className="size-5" /> More
      </Link>
      <p className="mb-4 text-muted-foreground">Private to this phone. Mark an intention as answered to give thanks.</p>
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
                  onChange={(e) => setList((l) => l.map((x) => (x.id === i.id ? { ...x, answered: e.target.checked } : x)))}
                  aria-label="Answered"
                />
                <span className={i.answered ? "text-muted-foreground line-through" : ""}>{i.text}</span>
              </label>
              <button onClick={() => setList((l) => l.filter((x) => x.id !== i.id))} className="flex size-11 items-center justify-center text-muted-foreground" aria-label={`Delete ${i.text}`}>
                <Trash2 className="size-5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
