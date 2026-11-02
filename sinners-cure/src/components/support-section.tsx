/**
 * "Give something back": no money, just tell people about Dualtech Training Center.
 * Shown on the Support page (More → Support) and on the About page.
 */
import { ExternalLink, Share2 } from "lucide-react";
import { Btn, btnClass } from "@/components/app-ui";
import { TL } from "@/lib/lang";
import { shareText } from "@/lib/share";

export const DUALTECH_FACEBOOK = "https://www.facebook.com/share/1A9yuvXo7G/";

const EN = {
  giveTitle: "If you want to give something back",
  giveText: [
    "I don't ask for money. If you feel like donating, please give in another way: tell people about Dualtech Training Center.",
    "Dualtech Training Center Foundation in Calamba, Laguna has been training young people since 1982, many of them from families who cannot afford college. Its dual training system joins classroom learning with real work in partner companies, so trainees learn a trade while gaining experience, and many are hired soon after they finish. More than 13,000 graduates now work in the Philippines and abroad.",
    "Today many young people need both a job and an education, and cannot afford to wait for one before the other. Dualtech bridges that gap. It forms more than skills: it forms character and faith. It did that for me.",
    "They need more trainees. If you know a young man or woman who is out of school, looking for work, or has lost their way, tell them about Dualtech. You might change their life the way it changed mine.",
  ],
  shareLabel: "Tell someone about Dualtech",
  pageLabel: "Dualtech on Facebook",
  shareMessage:
    "Do you know a young person who needs a job and an education but can't afford college? Dualtech Training Center Foundation in Calamba, Laguna has trained young people since 1982 through its dual training system: classroom learning plus real work in partner companies. More than 13,000 graduates now work in the Philippines and abroad. It changed my life, not just my skills but my faith. Find them on Facebook: https://www.facebook.com/share/1A9yuvXo7G/ — please share this with someone who needs it.",
};

const TL_TEXT: typeof EN = {
  giveTitle: "Kung nais mong magbigay",
  giveText: [
    "Hindi pera ang hinihiling ko. Kung nais mong mag-donate, magbigay sa ibang paraan: ipakilala sa iba ang Dualtech Training Center.",
    "Ang Dualtech Training Center Foundation sa Calamba, Laguna ay nagsasanay ng mga kabataan mula pa noong 1982, marami sa kanila ay mula sa pamilyang hindi kayang magpa-kolehiyo. Pinagsasama ng kanilang dual training system ang pag-aaral sa silid-aralan at tunay na trabaho sa mga partner na kompanya, kaya natututo ng hanapbuhay ang mga trainee habang nagkakaroon ng karanasan, at marami ang natatanggap sa trabaho pagkatapos nilang magtapos. Mahigit 13,000 na nagtapos ang nagtatrabaho na ngayon sa Pilipinas at sa ibang bansa.",
    "Ngayon, maraming kabataan ang nangangailangan ng trabaho at edukasyon nang sabay, at hindi nila kayang hintayin ang isa bago ang isa pa. Ang Dualtech ang tulay sa pagitan ng dalawa. Hindi lang kasanayan ang hinuhubog nito: hinuhubog din nito ang pagkatao at pananampalataya. Ginawa nito iyon sa akin.",
    "Kailangan nila ng mas maraming trainee. Kung may kilala kang kabataang lalaki o babae na hindi nakapag-aral, naghahanap ng trabaho, o naliligaw ng landas, ipakilala mo sa kanya ang Dualtech. Baka mabago mo ang buhay niya gaya ng pagbago nito sa buhay ko.",
  ],
  shareLabel: "Ipakilala ang Dualtech sa iba",
  pageLabel: "Dualtech sa Facebook",
  shareMessage:
    "May kilala ka bang kabataang nangangailangan ng trabaho at edukasyon pero hindi kayang magpa-kolehiyo? Ang Dualtech Training Center Foundation sa Calamba, Laguna ay nagsasanay ng mga kabataan mula pa noong 1982 sa pamamagitan ng dual training system: pag-aaral sa silid-aralan at tunay na trabaho sa mga partner na kompanya. Mahigit 13,000 na nagtapos ang nagtatrabaho na sa Pilipinas at sa ibang bansa. Binago nito ang buhay ko, hindi lang ang aking kakayahan kundi pati ang aking pananampalataya. Makikita sila sa Facebook: https://www.facebook.com/share/1A9yuvXo7G/ — pakibahagi ito sa taong nangangailangan.",
};

export function SupportSection({ heading = true }: { heading?: boolean }) {
  const c = TL ? TL_TEXT : EN;
  return (
    <section className="space-y-5">
      {heading && (
        <h2 className="pt-4 font-serif text-[1.5rem] font-semibold leading-tight">{c.giveTitle}</h2>
      )}
      {c.giveText.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <Btn className="w-full" onClick={() => shareText(c.shareMessage)}>
        <Share2 className="size-5" aria-hidden /> {c.shareLabel}
      </Btn>
      <a
        href={DUALTECH_FACEBOOK}
        target="_blank"
        rel="noreferrer"
        className={btnClass("outline", "w-full")}
      >
        <ExternalLink className="size-5" aria-hidden /> {c.pageLabel}
      </a>
    </section>
  );
}

export const supportTitle = () => (TL ? TL_TEXT : EN).giveTitle;
