import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useMemo } from "react";
import { BeadPrayer } from "@/components/bead-prayer";
import { Page } from "@/components/app-ui";
import { chapletSteps } from "@/lib/steps";
import { useLocal } from "@/lib/storage";

export const Route = createFileRoute("/prayers/chaplet")({
  head: () => ({
    meta: [
      { title: "Divine Mercy Chaplet — Sinner's Cure" },
      { name: "description", content: "Pray the Chaplet of Divine Mercy on the beads, one prayer at a time." },
      { property: "og:title", content: "Divine Mercy Chaplet — Sinner's Cure" },
      { property: "og:description", content: "Pray the Chaplet of Divine Mercy on the beads, one prayer at a time." },
    ],
  }),
  component: ChapletPage,
});

function ChapletPage() {
  const steps = useMemo(() => chapletSteps(), []);
  const [index, setIndex] = useLocal<number>("sc.chaplet", 0);
  return (
    <Page eyebrow="Jesus, I trust in You" title="Divine Mercy Chaplet">
      <Link to="/prayers" className="-mt-2 mb-4 inline-flex min-h-11 items-center gap-1 text-primary">
        <ChevronLeft className="size-5" /> All prayers
      </Link>
      <BeadPrayer steps={steps} index={Math.min(index, steps.length)} onIndex={setIndex} doneLabel="Chaplet complete" pathItem="prayer" shareMessage="I prayed the Divine Mercy Chaplet today. Jesus, I trust in You. — Sinner's Cure" />
    </Page>
  );
}
