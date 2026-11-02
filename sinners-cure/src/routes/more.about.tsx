import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/app-ui";
import { SupportSection } from "@/components/support-section";
import { TL, t } from "@/lib/lang";

export const Route = createFileRoute("/more/about")({
  component: AboutPage,
});

const EN = {
  why: "Why I made this",
  story: [
    "When I enrolled at Dualtech Training Center, I was close to becoming an atheist. I had drifted so far from God that I was being drawn toward something even darker.",
    "Dualtech changed that. It changed how I think and what I value, but most of all, it was there that I found my way back to God.",
    "Everything started there. Every path I take now leads me back toward that same place, and toward helping it the way it helped me.",
    "This app is my small way of giving back. If you are far from God right now, the way I was, you are not too far. He came for sinners. That is why this app is called Sinner's Cure.",
  ],
  thanks: "Thank you",
  thanksText:
    "To my advisor, my mentors and my colleagues at Dualtech: thank you. You were patient with me, you believed in me, and you showed me God through the way you live and work. Whatever good this app does began with you.",
  verse:
    "They that are whole need not the physician: but they that are sick. I came not to call the just, but sinners to penance.",
  cite: "Luke 5:31–32",
  role: "Former student, Dualtech Training Center",
};

const TL_TEXT: typeof EN = {
  why: "Bakit ko ginawa ito",
  story: [
    "Nang mag-enroll ako sa Dualtech Training Center, halos isa na akong ateista. Napakalayo ko na sa Diyos na hinihila na ako patungo sa mas madilim pang bagay.",
    "Binago iyon ng Dualtech. Binago nito ang aking pag-iisip at ang mga bagay na pinahahalagahan ko, ngunit higit sa lahat, doon ko natagpuan ang daan pabalik sa Diyos.",
    "Doon nagsimula ang lahat. Ang bawat landas na tinatahak ko ngayon ay humahantong pabalik sa lugar na iyon, at sa pagtulong dito gaya ng pagtulong nito sa akin.",
    "Ang app na ito ay ang munti kong paraan ng pagbabalik ng utang na loob. Kung malayo ka sa Diyos ngayon, gaya ko noon, hindi ka pa huli. Dumating Siya para sa mga makasalanan. Kaya Sinner's Cure ang pangalan ng app na ito.",
  ],
  thanks: "Salamat",
  thanksText:
    "Sa aking advisor, mga mentor at mga kasamahan sa Dualtech: salamat po. Naging matiyaga kayo sa akin, naniwala kayo sa akin, at ipinakita ninyo sa akin ang Diyos sa paraan ng inyong pamumuhay at pagtatrabaho. Anumang kabutihang magagawa ng app na ito ay nagsimula sa inyo.",
  verse:
    "Hindi ang malulusog ang nangangailangan ng manggagamot, kundi ang mga maysakit. Hindi Ako naparito upang tawagin ang mga matuwid, kundi ang mga makasalanan upang magsisi.",
  cite: "Lucas 5:31–32",
  role: "Dating estudyante, Dualtech Training Center",
};

function AboutPage() {
  const c = TL ? TL_TEXT : EN;
  return (
    <Page back={{ to: "/more", label: t("More", "Iba pa") }} title={t("About", "Tungkol")}>
      <article className="space-y-5 text-[1.05rem] leading-relaxed">
        <h2 className="font-serif text-[1.5rem] font-semibold leading-tight">{c.why}</h2>

        {c.story.map((p) => (
          <p key={p}>{p}</p>
        ))}

        <h2 className="pt-4 font-serif text-[1.5rem] font-semibold leading-tight">{c.thanks}</h2>
        <p>{c.thanksText}</p>

        <SupportSection />

        <figure className="border-l-2 border-primary py-1 pl-4">
          <blockquote className="scripture italic">{c.verse}</blockquote>
          <figcaption className="mt-1 text-[0.95rem] text-muted-foreground">{c.cite}</figcaption>
        </figure>

        <p className="pt-2 font-serif text-[1.2rem]">
          DWS 12-12
          <span className="block font-sans text-[0.95rem] text-muted-foreground">{c.role}</span>
        </p>
      </article>
    </Page>
  );
}
