/**
 * Confession guide. `steps` = how to go to confession.
 * `examination` = sections of questions; each question has a stable id.
 */
export const CONFESSION_STEPS = [
  "Pray to the Holy Spirit for light, then examine your conscience honestly.",
  "Enter the confessional. The priest greets you; make the Sign of the Cross.",
  "Say: \"Bless me, Father, for I have sinned. It has been ___ since my last confession.\"",
  "Confess your sins plainly, including the number of times for serious sins.",
  "Listen to the priest's counsel and accept your penance.",
  "Pray the Act of Contrition.",
  "Receive absolution. The priest may say: \"Give thanks to the Lord, for He is good.\" Answer: \"His mercy endures forever.\"",
  "Go in peace and complete your penance soon.",
];

export interface ExamSection {
  title: string;
  questions: { id: string; text: string }[];
}

const s = (prefix: string, title: string, qs: string[]): ExamSection => ({
  title,
  questions: qs.map((text, i) => ({ id: `${prefix}${i + 1}`, text })),
});

export const EXAMINATION: ExamSection[] = [
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
