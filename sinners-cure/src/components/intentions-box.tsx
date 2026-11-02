import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useIntentions } from "@/lib/intentions";
import { dateKey } from "@/lib/liturgy";
import { t } from "@/lib/lang";

/** Offer intentions before praying. Stored privately on the phone. */
export function IntentionsBox() {
  const [list, setList] = useIntentions();
  const [text, setText] = useState("");
  const open = list.filter((i) => !i.answered);
  const add = () => {
    if (!text.trim()) return;
    setList((l) => [
      { id: String(Date.now()), text: text.trim(), created: dateKey(new Date()) },
      ...l,
    ]);
    setText("");
  };
  return (
    <div className="card-surface mb-4 p-4">
      <div className="flex items-baseline justify-between">
        <p className="font-semibold">
          {t("I offer this prayer for", "Iniaalay ko ang dasal na ito para sa")}
        </p>
        <Link to="/more/intentions" className="min-h-11 text-muted-foreground">
          {t("All intentions", "Lahat ng intensyon")}
        </Link>
      </div>
      {open.length > 0 && (
        <ul className="mt-1 space-y-1">
          {open.slice(0, 5).map((i) => (
            <li key={i.id} className="font-serif text-[1.15rem]">
              {i.text}
            </li>
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
          placeholder={t("A person or a need", "Isang tao o pangangailangan")}
          className="min-h-12 min-w-0 flex-1 rounded-xl border border-input bg-background px-3"
          aria-label={t("New intention", "Bagong intensyon")}
        />
        <button
          type="submit"
          className="flex size-12 items-center justify-center rounded-xl bg-secondary"
          aria-label={t("Add intention", "Idagdag ang intensyon")}
        >
          <Plus className="size-5" aria-hidden />
        </button>
      </form>
    </div>
  );
}
