/**
 * Confession guide. `steps` = how to go to confession.
 * `examination` = sections of questions; each question has a stable id.
 */
import { TL } from "@/lib/lang";

const CONFESSION_STEPS_EN = [
  "Pray to the Holy Spirit for light, then examine your conscience honestly.",
  "Enter the confessional. The priest greets you; make the Sign of the Cross.",
  'Say: "Bless me, Father, for I have sinned. It has been ___ since my last confession."',
  "Confess your sins plainly, including the number of times for serious sins.",
  "Listen to the priest's counsel and accept your penance.",
  "Pray the Act of Contrition.",
  'Receive absolution. The priest may say: "Give thanks to the Lord, for He is good." Answer: "His mercy endures forever."',
  "Go in peace and complete your penance soon.",
];

const CONFESSION_STEPS_TL = [
  "Manalangin sa Espiritu Santo upang liwanagan ka, at suriin nang tapat ang iyong budhi.",
  "Pumasok sa kumpisalan. Babatiin ka ng pari; mag-antanda ng Krus.",
  'Sabihin: "Basbasan Mo po ako, Padre, sapagkat ako ay nagkasala. ___ na po mula nang huli akong mangumpisal."',
  "Ikumpisal nang malinaw ang iyong mga kasalanan, kasama ang bilang ng beses para sa mabibigat na kasalanan.",
  "Pakinggan ang payo ng pari at tanggapin ang iyong penitensya.",
  "Dasalin ang Pagsisisi (Act of Contrition).",
  'Tanggapin ang absolusyon. Maaaring sabihin ng pari: "Magpasalamat tayo sa Panginoon, sapagkat Siya ay mabuti." Sagot: "Ang Kanyang awa ay magpakailanman."',
  "Humayo nang mapayapa at tapusin agad ang iyong penitensya.",
];

export const CONFESSION_STEPS = TL ? CONFESSION_STEPS_TL : CONFESSION_STEPS_EN;

export interface ExamSection {
  title: string;
  questions: { id: string; text: string }[];
}

const s = (prefix: string, title: string, qs: string[]): ExamSection => ({
  title,
  questions: qs.map((text, i) => ({ id: `${prefix}${i + 1}`, text })),
});

const EXAMINATION_EN: ExamSection[] = [
  s("c1", "1. I am the Lord your God; you shall not have strange gods before me", [
    "Have I neglected daily prayer?",
    "Have I doubted or denied the truths of the faith?",
    "Have I been involved in superstition, horoscopes, fortune-telling or the occult?",
    "Have I put money, work, pleasure or anything else before God?",
  ]),
  s("c2", "2. You shall not take the name of the Lord your God in vain", [
    "Have I used God's name or the name of Jesus carelessly or in anger?",
    "Have I cursed, or wished evil on others?",
    "Have I broken a promise or vow made to God?",
  ]),
  s("c3", "3. Remember to keep holy the Lord's Day", [
    "Have I missed Mass on Sunday or a Holy Day of Obligation through my own fault?",
    "Have I been distracted or irreverent at Mass?",
    "Have I done unnecessary work on Sunday, or kept others from resting?",
  ]),
  s("c4", "4. Honor your father and your mother", [
    "Have I disobeyed or disrespected my parents or lawful superiors?",
    "Have I neglected my duties to my spouse, children or family?",
    "Have I neglected elderly or sick family members?",
  ]),
  s("c5", "5. You shall not kill", [
    "Have I harmed anyone physically, or wished them harm?",
    "Have I held hatred or refused to forgive?",
    "Have I been involved in or encouraged abortion or euthanasia?",
    "Have I harmed my own health through drink, drugs or recklessness?",
    "Have I given scandal or led others into sin?",
  ]),
  s("c6", "6 & 9. You shall not commit adultery; you shall not covet your neighbor's wife", [
    "Have I been unfaithful in thought, word or deed?",
    "Have I looked at pornography or impure material?",
    "Have I entertained impure thoughts willingly?",
    "Have I been immodest in dress, speech or behavior?",
  ]),
  s("c7", "7 & 10. You shall not steal; you shall not covet your neighbor's goods", [
    "Have I stolen, or kept what belongs to another?",
    "Have I cheated, or failed to give an honest day's work?",
    "Have I been envious of others' possessions?",
    "Have I failed to help the poor according to my means?",
  ]),
  s("c8", "8. You shall not bear false witness against your neighbor", [
    "Have I lied?",
    "Have I gossiped, or damaged someone's good name?",
    "Have I judged others rashly?",
  ]),
  s("p", "Precepts of the Church", [
    "Have I confessed my sins at least once a year?",
    "Have I received Holy Communion at least during the Easter season?",
    "Have I received Communion in a state of serious sin?",
    "Have I kept the days of fasting and abstinence?",
    "Have I helped to provide for the needs of the Church?",
  ]),
];

const EXAMINATION_TL: ExamSection[] = [
  s(
    "c1",
    "1. Ako ang Panginoon mong Diyos; huwag kang magkakaroon ng ibang diyos maliban sa Akin",
    [
      "Pinabayaan ko ba ang pagdarasal araw-araw?",
      "Pinagdudahan o itinanggi ko ba ang mga katotohanan ng pananampalataya?",
      "Nakisangkot ba ako sa pamahiin, horoscope, panghuhula o okultismo?",
      "Inuna ko ba ang pera, trabaho, kasiyahan o anumang bagay bago ang Diyos?",
    ],
  ),
  s("c2", "2. Huwag mong babanggitin ang pangalan ng Diyos nang walang kabuluhan", [
    "Ginamit ko ba ang pangalan ng Diyos o ni Hesus nang pabaya o dahil sa galit?",
    "Nagmura ba ako, o nagnais ng masama sa iba?",
    "Sinira ko ba ang isang pangako o panata sa Diyos?",
  ]),
  s("c3", "3. Ipangilin mo ang araw ng Panginoon", [
    "Hindi ba ako nakapagsimba tuwing Linggo o pistang pangilin dahil sa sarili kong kapabayaan?",
    "Naging pabaya o walang galang ba ako sa Misa?",
    "Gumawa ba ako ng di-kailangang trabaho sa Linggo, o pinigilan ang iba na makapagpahinga?",
  ]),
  s("c4", "4. Igalang mo ang iyong ama at ina", [
    "Sumuway o nawalan ba ako ng paggalang sa aking mga magulang o nakatataas?",
    "Pinabayaan ko ba ang aking tungkulin sa aking asawa, mga anak o pamilya?",
    "Pinabayaan ko ba ang matatanda o maysakit sa aking pamilya?",
  ]),
  s("c5", "5. Huwag kang papatay", [
    "Nanakit ba ako ng kapwa, o nagnais na masaktan sila?",
    "Nagtanim ba ako ng galit o tumangging magpatawad?",
    "Nakisangkot o nanghikayat ba ako ng aborsyon o euthanasia?",
    "Sinira ko ba ang sarili kong kalusugan dahil sa alak, droga o kapabayaan?",
    "Naging masamang halimbawa ba ako o nagtulak sa iba sa kasalanan?",
  ]),
  s("c6", "6 at 9. Huwag kang makikiapid; huwag mong pagnanasaan ang asawa ng iyong kapwa", [
    "Naging taksil ba ako sa isip, salita o gawa?",
    "Tumingin ba ako ng pornograpiya o mahahalay na bagay?",
    "Kusa ko bang pinanatili sa isip ang mahahalay na kaisipan?",
    "Naging mahalay ba ako sa pananamit, pananalita o kilos?",
  ]),
  s("c7", "7 at 10. Huwag kang magnanakaw; huwag mong pagnanasaan ang ari-arian ng iyong kapwa", [
    "Nagnakaw ba ako, o nag-angkin ng hindi akin?",
    "Nandaya ba ako, o hindi nagtrabaho nang tapat?",
    "Nainggit ba ako sa ari-arian ng iba?",
    "Hindi ko ba tinulungan ang mahihirap ayon sa aking kakayahan?",
  ]),
  s("c8", "8. Huwag kang magsisinungaling o magbibintang sa iyong kapwa", [
    "Nagsinungaling ba ako?",
    "Nakipagtsismisan ba ako, o sinira ang pangalan ng iba?",
    "Hinusgahan ko ba ang iba nang padalos-dalos?",
  ]),
  s("p", "Mga Utos ng Simbahan", [
    "Nangumpisal ba ako kahit minsan sa isang taon?",
    "Nakinabang ba ako ng Banal na Komunyon kahit sa panahon ng Pasko ng Pagkabuhay?",
    "Nakinabang ba ako ng Komunyon habang may mabigat na kasalanan?",
    "Tinupad ko ba ang mga araw ng pag-aayuno at pangingilin sa karne?",
    "Tumulong ba ako sa mga pangangailangan ng Simbahan?",
  ]),
];

export const EXAMINATION: ExamSection[] = TL ? EXAMINATION_TL : EXAMINATION_EN;
