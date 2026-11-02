import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/app-ui";
import { SupportSection, supportTitle } from "@/components/support-section";
import { t } from "@/lib/lang";

export const Route = createFileRoute("/more/support")({
  component: SupportPage,
});

function SupportPage() {
  return (
    <Page back={{ to: "/more", label: t("More", "Iba pa") }} title={supportTitle()}>
      <div className="text-[1.05rem] leading-relaxed">
        <SupportSection heading={false} />
      </div>
    </Page>
  );
}
