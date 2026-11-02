/**
 * Rosary mysteries. Each set has exactly five mysteries:
 * { title, scripture (reference), fruit, meditation }.
 */
export type MysterySetId = "joyful" | "sorrowful" | "glorious" | "luminous";

export interface Mystery {
  title: string;
  scripture: string;
  fruit: string;
  meditation: string;
}

export interface MysterySet {
  id: MysterySetId;
  name: string;
  days: string;
  mysteries: Mystery[];
}

export const MYSTERY_SETS: Record<MysterySetId, MysterySet> = {
  joyful: {
    id: "joyful",
    name: "Joyful Mysteries",
    days: "Monday & Saturday",
    mysteries: [
      { title: "The Annunciation", scripture: "Luke 1:26-38", fruit: "Humility", meditation: "The angel Gabriel greets Mary, and she gives her free and humble yes to God. Let me say yes to God's will in the small things of this day." },
      { title: "The Visitation", scripture: "Luke 1:39-56", fruit: "Love of neighbor", meditation: "Mary hurries to serve her cousin Elizabeth, carrying Christ within her. Let me bring Christ to those who need help today." },
      { title: "The Nativity", scripture: "Luke 2:1-20", fruit: "Poverty of spirit", meditation: "The Son of God is born in a poor stable and laid in a manger. Let me find my riches in Him alone." },
      { title: "The Presentation in the Temple", scripture: "Luke 2:22-38", fruit: "Obedience", meditation: "Mary and Joseph offer the Child to the Father, as the Law commands. Simeon and Anna recognize the light of the nations." },
      { title: "The Finding of Jesus in the Temple", scripture: "Luke 2:41-52", fruit: "Joy in finding Jesus", meditation: "After three days of sorrow, Mary and Joseph find Jesus in His Father's house. When I lose Him through sin, let me seek Him again." },
    ],
  },
  sorrowful: {
    id: "sorrowful",
    name: "Sorrowful Mysteries",
    days: "Tuesday & Friday",
    mysteries: [
      { title: "The Agony in the Garden", scripture: "Matthew 26:36-46", fruit: "Sorrow for sin", meditation: "Jesus prays in anguish, sweating blood: not my will, but Thine be done. Let me watch and pray with Him." },
      { title: "The Scourging at the Pillar", scripture: "Mark 15:6-15", fruit: "Purity", meditation: "Our Lord is bound and scourged for our sins. By His wounds we are healed." },
      { title: "The Crowning with Thorns", scripture: "Matthew 27:27-31", fruit: "Courage", meditation: "The King of Kings is mocked and crowned with thorns. Let me not be ashamed of Him before others." },
      { title: "The Carrying of the Cross", scripture: "Luke 23:26-32", fruit: "Patience", meditation: "Jesus carries the heavy cross to Calvary and falls beneath its weight. Let me carry my daily cross with Him." },
      { title: "The Crucifixion and Death of Our Lord", scripture: "John 19:17-30", fruit: "Perseverance", meditation: "Jesus forgives His executioners, gives us His Mother, and gives up His spirit. It is finished: love has gone to the end." },
    ],
  },
  glorious: {
    id: "glorious",
    name: "Glorious Mysteries",
    days: "Wednesday & Sunday",
    mysteries: [
      { title: "The Resurrection", scripture: "Matthew 28:1-10", fruit: "Faith", meditation: "On the third day Jesus rises from the tomb, conquering sin and death. He is risen, as He said." },
      { title: "The Ascension", scripture: "Acts 1:6-11", fruit: "Hope", meditation: "Jesus ascends to the Father before the eyes of His disciples, promising to be with us always. Let me long for heaven." },
      { title: "The Descent of the Holy Spirit", scripture: "Acts 2:1-13", fruit: "Love of God", meditation: "The Holy Spirit comes upon Mary and the Apostles as tongues of fire. Come, Holy Spirit, fill my heart." },
      { title: "The Assumption of Mary", scripture: "Revelation 12:1", fruit: "Grace of a holy death", meditation: "At the end of her earthly life, Mary is taken body and soul into heavenly glory. She waits for us there." },
      { title: "The Coronation of Mary", scripture: "Revelation 12:1-6", fruit: "Trust in Mary's intercession", meditation: "Mary is crowned Queen of Heaven and Earth. Let me entrust myself to her motherly care." },
    ],
  },
  luminous: {
    id: "luminous",
    name: "Luminous Mysteries",
    days: "Thursday",
    mysteries: [
      { title: "The Baptism of Jesus", scripture: "Matthew 3:13-17", fruit: "Openness to the Holy Spirit", meditation: "The heavens open and the Father's voice proclaims: This is my beloved Son. Let me live my baptism faithfully." },
      { title: "The Wedding at Cana", scripture: "John 2:1-11", fruit: "To Jesus through Mary", meditation: "At Mary's request, Jesus works His first sign. Do whatever He tells you." },
      { title: "The Proclamation of the Kingdom", scripture: "Mark 1:14-15", fruit: "Repentance and trust in God", meditation: "Jesus calls all to conversion: the Kingdom of God is at hand. Repent and believe the Gospel." },
      { title: "The Transfiguration", scripture: "Matthew 17:1-8", fruit: "Desire for holiness", meditation: "On the mountain, Christ's face shines like the sun. This is my beloved Son; listen to Him." },
      { title: "The Institution of the Eucharist", scripture: "Matthew 26:26-29", fruit: "Adoration", meditation: "At the Last Supper Jesus gives us His Body and Blood. He remains with us in every tabernacle." },
    ],
  },
};

/** Sunday=0 … Saturday=6 */
const BY_WEEKDAY: MysterySetId[] = ["glorious", "joyful", "sorrowful", "glorious", "luminous", "sorrowful", "joyful"];

export function mysteriesForDate(date: Date): MysterySetId {
  return BY_WEEKDAY[date.getDay()] ?? "glorious";
}
