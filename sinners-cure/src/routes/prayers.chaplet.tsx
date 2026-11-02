import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { BeadPrayer } from "@/components/bead-prayer";
import { Page } from "@/components/app-ui";
import { chapletSteps } from "@/lib/steps";
import { useLocal } from "@/lib/storage";

export const Route = createFileRoute("/prayers/chaplet")({
  component: ChapletPage,
});

function ChapletPage() {
  const steps = useMemo(() => chapletSteps(), []);
  const [index, setIndex] = useLocal<number>("sc.chaplet", 0);
  return (
    <Page
      back={{ to: "/prayers", label: "Prayers" }}
      title="Divine Mercy Chaplet"
      subtitle="Jesus, I trust in You."
    >
      <BeadPrayer
        steps={steps}
        index={Math.min(index, steps.length)}
        onIndex={setIndex}
        doneLabel="Chaplet prayed"
        pathItem="chaplet"
        shareMessage="I prayed the Divine Mercy Chaplet today. Jesus, I trust in You."
      />
    </Page>
  );
}
