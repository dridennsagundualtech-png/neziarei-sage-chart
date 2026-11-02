import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { BeadPrayer } from "@/components/bead-prayer";
import { Page } from "@/components/app-ui";
import { chapletSteps } from "@/lib/steps";
import { useLocal } from "@/lib/storage";
import { t } from "@/lib/lang";

export const Route = createFileRoute("/prayers/chaplet")({
  component: ChapletPage,
});

function ChapletPage() {
  const steps = useMemo(() => chapletSteps(), []);
  const [index, setIndex] = useLocal<number>("sc.chaplet", 0);
  return (
    <Page
      back={{ to: "/prayers", label: t("Prayers", "Mga Dasal") }}
      title={t("Divine Mercy Chaplet", "Koronilya ng Banal na Awa")}
      subtitle={t("Jesus, I trust in You.", "Hesus, nananalig ako sa Iyo.")}
    >
      <BeadPrayer
        steps={steps}
        index={Math.min(index, steps.length)}
        onIndex={setIndex}
        doneLabel={t("Chaplet prayed", "Nadasal na ang Koronilya")}
        pathItem="chaplet"
        shareMessage={t(
          "I prayed the Divine Mercy Chaplet today. Jesus, I trust in You.",
          "Nadasal ko ngayon ang Koronilya ng Banal na Awa. Hesus, nananalig ako sa Iyo.",
        )}
      />
    </Page>
  );
}
