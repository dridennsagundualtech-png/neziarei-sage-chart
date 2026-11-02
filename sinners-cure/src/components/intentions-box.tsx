import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useIntentions } from "@/lib/intentions";
import { dateKey } from "@/lib/liturgy";

/** Offer intentions before praying. Stored privately on the phone. */
export function IntentionsBox() {
  const [list, setList] = useIntentions();
  const [text, setText] = useState("");
  const open = list.filter((i) => !i.answered);
  const add = () => {
    if (!text.trim()) return;
    setList((l) => [{ id: String(Date.now()), text: text.trim(), created: dateKey(new Date()) }, ...l]);
    setText("");
  };
  return (
    <div className="card-surface mb-4 p-4">
      <div className="flex items-baseline justify-between">
        <p className="font-semibold">I offer this prayer for…</p>
        <Link to="/more/intentions" className="text-primary">
          All
        </Link>
      </div>
      {open.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-6">
          {open.slice(0, 5).map((i) => (
            <li key={i.id}>{i.text}</li>
          ))}
        </ul>
      )}
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add an intention"
          className="min-h-12 min-w-0 flex-1 rounded-xl border border-input bg-background px-3"
          aria-label="New intention"
        />
        <button type="submit" className="flex size-12 items-center justify-center rounded-xl border bg-card" aria-label="Add intention">
          <Plus className="size-5" />
        </button>
      </form>
    </div>
  );
}
