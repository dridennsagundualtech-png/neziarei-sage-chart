/**
 * Catholic practices: the daily plan of life and the "Living the faith" guides.
 * CCC = Catechism of the Catholic Church; can. = Code of Canon Law (1983).
 * Guides are lists of blocks so they can be edited without touching the screens.
 */

export type PracticeId =
  | "offering"
  | "prayer"
  | "mass"
  | "readings"
  | "angelus"
  | "rosary"
  | "reading"
  | "visit"
  | "chaplet"
  | "aspirations"
  | "exam";

export interface Practice {
  id: PracticeId;
  title: string;
  when: string;
  detail: string;
  /** Where the practice happens in the app. */
  to?: string;
  /** Ticked by the app itself when you finish it there. */
  auto?: boolean;
}

/** In the order of a day. */
export const PRACTICES: Practice[] = [
  {
    id: "offering",
    title: "Morning offering",
    when: "On waking",
    detail:
      "Get up promptly when the alarm rings and offer God the whole day: work, joys and troubles.",
    to: "/prayers/morning",
  },
  {
    id: "prayer",
    title: "Mental prayer",
    when: "Morning or evening",
    detail: "Ten quiet minutes talking with God in your own words. Grow toward half an hour.",
    to: "/learn/prayer",
  },
  {
    id: "mass",
    title: "Holy Mass",
    when: "When you can",
    detail: "Go to Mass, on weekdays too if you can. If you can't, make a spiritual communion.",
    to: "/prayers/spiritual-communion",
  },
  {
    id: "readings",
    title: "Today's readings",
    when: "Any time",
    detail: "Read the Mass readings of the day.",
    to: "/mass",
    auto: true,
  },
  {
    id: "angelus",
    title: "Angelus at noon",
    when: "Noon",
    detail:
      "Stop for a minute at midday to remember the Incarnation. In Easter Time, the Regina Caeli.",
    to: "/prayers/angelus",
    auto: true,
  },
  {
    id: "rosary",
    title: "Holy Rosary",
    when: "Any time",
    detail: "Five decades with today's mysteries, or one decade if that's what you have time for.",
    to: "/rosary",
    auto: true,
  },
  {
    id: "reading",
    title: "Spiritual reading",
    when: "Any time",
    detail: "A few minutes of the Gospel, then a few pages of a good spiritual book.",
    to: "/bible",
  },
  {
    id: "visit",
    title: "Visit to the Blessed Sacrament",
    when: "Passing a church",
    detail: "Stop in a church, even for a minute, to greet Jesus in the tabernacle.",
  },
  {
    id: "chaplet",
    title: "Divine Mercy Chaplet",
    when: "3 in the afternoon",
    detail: "The hour of Christ's death, the hour of mercy.",
    to: "/prayers/chaplet",
    auto: true,
  },
  {
    id: "aspirations",
    title: "Short prayers",
    when: "Through the day",
    detail:
      "Little prayers between tasks: Jesus, I trust in you. My Lord and my God. Mother, help me.",
  },
  {
    id: "exam",
    title: "Examination of conscience",
    when: "Before sleep",
    detail: "Three minutes to look back on the day with God, say sorry, and make a resolution.",
    to: "/prayers/examen",
    auto: true,
  },
];

export const DEFAULT_PLAN: PracticeId[] = ["offering", "readings", "rosary", "prayer", "exam"];
export const practiceById = (id: string) => PRACTICES.find((p) => p.id === id);

export type GuideBlock =
  | { kind: "p"; text: string }
  | { kind: "h"; text: string }
  | { kind: "list"; items: string[]; ordered?: boolean }
  | { kind: "quote"; text: string; cite: string }
  | { kind: "note"; text: string }
  | { kind: "verses"; refs: string[] }
  | { kind: "links"; items: { label: string; to: string }[] };

export interface Guide {
  id: string;
  title: string;
  summary: string;
  blocks: GuideBlock[];
}

export const GUIDES: Guide[] = [
  {
    id: "plan-of-life",
    title: "A plan of life",
    summary: "Simple daily habits of prayer, as Saint Josemaría taught",
    blocks: [
      {
        kind: "p",
        text: "Saint Josemaría Escrivá, the founder of Opus Dei, taught that ordinary life is where most of us are called to become saints: our work, our family, our friendships, the chores no one sees. God is waiting for us there.",
      },
      {
        kind: "p",
        text: "To stay close to God in a busy day, he recommended a plan of life: a few fixed moments of prayer spread through the day, like the beams that hold up a house. They are not a test to pass or fail. They are appointments with Someone who loves you.",
      },
      { kind: "h", text: "The usual practices" },
      {
        kind: "list",
        items: [
          "Morning offering, getting up promptly when the alarm rings",
          "Mental prayer, ideally half an hour in the morning and again in the afternoon or evening",
          "Holy Mass and Communion, daily if possible",
          "The Angelus at noon",
          "The Rosary",
          "Spiritual reading: the Gospel and a good book",
          "A visit to the Blessed Sacrament",
          "Short prayers and acts of love through the day",
          "Examination of conscience before sleep",
          "Regular Confession, many people every week or two",
        ],
      },
      { kind: "h", text: "Start small" },
      {
        kind: "p",
        text: "Don't take on everything at once. Choose two or three practices you can keep every day, and add another when they feel natural. Faithfulness in small things matters more than an ambitious plan you drop after a week.",
      },
      {
        kind: "quote",
        text: "Sanctify your work, sanctify yourself in your work, and sanctify others through your work.",
        cite: "Saint Josemaría Escrivá",
      },
      { kind: "h", text: "The heroic minute" },
      {
        kind: "p",
        text: "He called the moment of getting up the heroic minute: rising when the alarm rings, without lingering, as the first small offering of the day. Some say one word as they get up: Serviam, I will serve.",
      },
      { kind: "h", text: "When you can't get to Mass" },
      {
        kind: "p",
        text: "You can make a spiritual communion: tell Jesus you believe he is present in the Eucharist and ask him to come into your heart. Saint Alphonsus Liguori's prayer is in the Prayers tab.",
      },
      {
        kind: "links",
        items: [
          { label: "Choose your practices", to: "/plan" },
          { label: "Spiritual Communion", to: "/prayers/spiritual-communion" },
        ],
      },
    ],
  },
  {
    id: "work",
    title: "Holiness in ordinary work",
    summary: "Turning work and chores into prayer",
    blocks: [
      {
        kind: "p",
        text: "Jesus spent about thirty years in Nazareth working with his hands before he preached his first sermon. Those hidden years were not wasted: they made ordinary work holy.",
      },
      {
        kind: "quote",
        text: "Whatsoever you do, do it from the heart, as to the Lord, and not to men.",
        cite: "Colossians 3:23",
      },
      { kind: "h", text: "In practice" },
      {
        kind: "list",
        items: [
          "Offer it. Before you start, tell God: this is for you.",
          "Do it well. Finish what you start, and take care over the last details.",
          "Serve. Think of the people your work helps, and help the person next to you.",
          "Keep God in mind. A short prayer as you begin a task or when the hour strikes.",
          "Offer the hard parts. Tiredness, dull tasks and difficult people can become small sacrifices joined to Christ's.",
          "Rest well. Sunday belongs to God and to your family.",
        ],
      },
      { kind: "h", text: "Pray with the Gospel" },
      {
        kind: "p",
        text: "Saint Josemaría suggested reading a short Gospel passage and putting yourself into the scene as one more person there. Watch Jesus, listen to him, and ask: Lord, what do you want me to do today?",
      },
      { kind: "links", items: [{ label: "Today's Gospel", to: "/mass" }] },
    ],
  },
  {
    id: "sin",
    title: "Mortal and venial sin",
    summary: "What the Church teaches, and how to return",
    blocks: [
      {
        kind: "p",
        text: "Sin is an offense against God and a wound to our own heart and to others (CCC 1849-1850). The Church distinguishes sins by how serious they are, not to frighten us, but so we know how to come back.",
      },
      { kind: "h", text: "Mortal sin" },
      {
        kind: "p",
        text: "A mortal sin turns us away from God and destroys the life of grace in the soul (CCC 1855). For a sin to be mortal, all three of these must be true (CCC 1857):",
      },
      {
        kind: "list",
        ordered: true,
        items: [
          "Grave matter: the act itself is seriously wrong, as the Ten Commandments spell out (CCC 1858).",
          "Full knowledge: you know it is seriously wrong (CCC 1859).",
          "Deliberate consent: you freely choose it (CCC 1859).",
        ],
      },
      {
        kind: "p",
        text: "If one of the three is missing, the sin is not mortal. Ignorance that isn't your fault, strong fear, habit or illness can lessen guilt (CCC 1735, 1860). Only God judges the heart, and a priest can help you understand your own situation.",
      },
      { kind: "h", text: "Examples of grave matter" },
      {
        kind: "list",
        items: [
          "Deliberately missing Mass on a Sunday or Holy Day of Obligation without a serious reason (CCC 2181)",
          "Murder, abortion and euthanasia (CCC 2268, 2271, 2277)",
          "Adultery, sexual relations outside marriage, and pornography (CCC 2380, 2353, 2354)",
          "Serious theft or fraud (CCC 2408-2409)",
          "Blasphemy, and sacrilege, especially against the Eucharist (CCC 2148, 2120)",
          "Receiving Communion while aware of mortal sin (CCC 1385)",
          "Perjury, and lies or slander that do serious harm (CCC 2152, 2484)",
          "Deliberately wishing serious harm on someone out of hatred (CCC 2303)",
          "Rejecting the faith: apostasy, heresy or schism (CCC 2089)",
        ],
      },
      { kind: "h", text: "Venial sin" },
      {
        kind: "p",
        text: "Venial sin is less serious: the matter is not grave, or it is grave but without full knowledge or full consent (CCC 1862). It doesn't cut us off from God, but it weakens love, and left alone it can lead to worse (CCC 1863). Impatience, small lies and careless prayer are common examples.",
      },
      {
        kind: "p",
        text: "Venial sins are forgiven through sincere sorrow, prayer, acts of charity and the Eucharist (CCC 1394, 1436). Confessing them is still strongly recommended, because it helps us grow (CCC 1458).",
      },
      { kind: "h", text: "If you have committed a mortal sin" },
      {
        kind: "list",
        items: [
          "Don't despair. There is no sin God will not forgive to someone who truly repents (CCC 982).",
          "Make an act of contrition straight away, out of love for God.",
          "Go to Confession as soon as you can. Mortal sins are confessed by kind and number (CCC 1456).",
          "Don't receive Communion before Confession. If there is a grave reason to receive and no chance to confess, make an act of perfect contrition and go to Confession as soon as possible (CCC 1457; can. 916).",
        ],
      },
      {
        kind: "quote",
        text: "If we confess our sins, he is faithful and just, to forgive us our sins and to cleanse us from all iniquity.",
        cite: "1 John 1:9",
      },
      {
        kind: "note",
        text: "If you worry all the time that everything is a mortal sin, that is called scrupulosity. Tell a priest. He can guide you, and you can trust his guidance.",
      },
      {
        kind: "links",
        items: [
          { label: "Confession guide", to: "/prayers/confession" },
          { label: "Examination of conscience", to: "/prayers/examen" },
        ],
      },
    ],
  },
  {
    id: "precepts",
    title: "Precepts of the Church",
    summary: "The five things every Catholic is asked to do",
    blocks: [
      {
        kind: "p",
        text: "The precepts are the minimum the Church asks of every Catholic, so that prayer and the moral life keep growing (CCC 2041).",
      },
      {
        kind: "list",
        ordered: true,
        items: [
          "Attend Mass on Sundays and Holy Days of Obligation, and rest from work that keeps you from worshipping God.",
          "Confess your sins at least once a year.",
          "Receive Holy Communion at least during the Easter season.",
          "Keep the days of fasting and abstinence set by the Church.",
          "Help provide for the needs of the Church, each according to their means.",
        ],
      },
      {
        kind: "p",
        text: "These are listed in CCC 2042-2043. Bishops' conferences can add others for their own country.",
      },
      {
        kind: "links",
        items: [
          { label: "Fasting and abstinence", to: "/learn/fasting" },
          { label: "Holy Days of Obligation", to: "/learn/holy-days" },
        ],
      },
    ],
  },
  {
    id: "fasting",
    title: "Fasting and abstinence",
    summary: "Who fasts, when, and why",
    blocks: [
      { kind: "h", text: "Days of fasting" },
      { kind: "p", text: "Ash Wednesday and Good Friday." },
      {
        kind: "p",
        text: "Fasting means one full meal, with up to two small meals that together are less than a full meal, and nothing in between. It binds Catholics from age 18 until the start of their 60th year (can. 1251-1252).",
      },
      { kind: "h", text: "Days of abstinence" },
      {
        kind: "p",
        text: "Ash Wednesday, Good Friday, and every Friday, especially the Fridays of Lent.",
      },
      {
        kind: "p",
        text: "Abstinence means no meat, from age 14 (can. 1252). On Fridays outside Lent, many bishops' conferences let you replace abstinence with another penance or work of charity, so check what your bishops ask. A Friday that is a solemnity is not a day of penance (can. 1251).",
      },
      { kind: "h", text: "Before Communion" },
      {
        kind: "p",
        text: "Take nothing but water and medicine for one hour before receiving Holy Communion (can. 919). The elderly and the sick are excused.",
      },
      { kind: "h", text: "Why fast" },
      {
        kind: "p",
        text: "Fasting frees us a little from ourselves so we have more room for God and for others. The Church joins it to prayer and almsgiving (CCC 1434, 1438). The sick, pregnant or nursing mothers and those doing heavy work are excused from fasting.",
      },
    ],
  },
  {
    id: "sacraments",
    title: "The seven sacraments",
    summary: "Christ's own ways of giving us his life",
    blocks: [
      {
        kind: "list",
        items: [
          "Baptism frees us from sin and makes us children of God and members of the Church (CCC 1213).",
          "Confirmation seals us with the Holy Spirit and strengthens us to witness to Christ (CCC 1285).",
          "The Eucharist is Christ's own Body and Blood, the source and summit of the Christian life (CCC 1324).",
          "Penance, or Confession, forgives our sins and reconciles us with God and the Church (CCC 1422).",
          "Anointing of the Sick gives strength, peace and courage to the seriously ill and the elderly (CCC 1520).",
          "Holy Orders consecrates bishops, priests and deacons to serve the Church in Christ's name (CCC 1536).",
          "Matrimony is the lifelong covenant of a man and a woman, a sign of Christ's love for the Church (CCC 1601).",
        ],
      },
      {
        kind: "p",
        text: "Baptism, Confirmation and the Eucharist are the sacraments of initiation; Penance and Anointing are sacraments of healing; Holy Orders and Matrimony are at the service of communion (CCC 1211-1212).",
      },
    ],
  },
  {
    id: "holy-days",
    title: "Holy Days of Obligation",
    summary: "The days besides Sunday when Catholics go to Mass",
    blocks: [
      {
        kind: "p",
        text: "Every Sunday is a day of obligation: it is the day of the Resurrection (CCC 2177, 2180).",
      },
      { kind: "p", text: "The Church's universal law adds these days (can. 1246):" },
      {
        kind: "list",
        items: [
          "Christmas, December 25",
          "Mary, Mother of God, January 1",
          "The Epiphany",
          "The Ascension",
          "Corpus Christi",
          "Saint Joseph, March 19",
          "Saints Peter and Paul, June 29",
          "The Assumption, August 15",
          "All Saints, November 1",
          "The Immaculate Conception, December 8",
        ],
      },
      {
        kind: "p",
        text: "Each bishops' conference may move some of these to a Sunday or lift the obligation. In the United States they are January 1, the Ascension where it is kept on a Thursday, August 15, November 1, December 8 and December 25. In the Philippines they are January 1, December 8 and December 25. Your parish can tell you for certain.",
      },
    ],
  },
  {
    id: "everyday",
    title: "Everyday Catholic practices",
    summary: "Small habits that keep faith in the day, and the works of mercy",
    blocks: [
      {
        kind: "list",
        items: [
          "The Sign of the Cross when you wake, before meals, before a journey, when you pass a church.",
          "Holy water on entering a church, and at home, as a reminder of your baptism.",
          "Grace before and after meals.",
          "The Angelus at noon, or the Regina Caeli in Easter Time.",
          "Night prayer, or Morning and Evening Prayer from the Liturgy of the Hours.",
          "Time in Eucharistic Adoration.",
          "A small home altar: a crucifix, an image of Mary, a candle, the Bible.",
          "Sacramentals such as the rosary, medals and the scapular, used with faith (CCC 1667-1670).",
          "Parents blessing their children with the Sign of the Cross.",
          "Praying for the dead and visiting their graves, especially in November.",
          "Fridays as small days of penance, in memory of Good Friday.",
        ],
      },
      { kind: "h", text: "Corporal works of mercy" },
      {
        kind: "list",
        items: [
          "Feed the hungry",
          "Give drink to the thirsty",
          "Clothe the naked",
          "Shelter the homeless",
          "Visit the sick",
          "Visit the imprisoned",
          "Bury the dead",
        ],
      },
      { kind: "h", text: "Spiritual works of mercy" },
      {
        kind: "list",
        items: [
          "Instruct the ignorant",
          "Counsel the doubtful",
          "Admonish sinners",
          "Bear wrongs patiently",
          "Forgive offenses willingly",
          "Comfort the afflicted",
          "Pray for the living and the dead",
        ],
      },
      {
        kind: "p",
        text: "The works of mercy are charitable actions by which we help our neighbor in body and soul (CCC 2447).",
      },
    ],
  },
  {
    id: "verses",
    title: "Scripture for daily life",
    summary: "Verses to carry into work, family and rest",
    blocks: [
      {
        kind: "verses",
        refs: [
          "Colossians 3:23",
          "1 Thessalonians 5:17",
          "Matthew 6:33",
          "Philippians 4:13",
          "John 15:5",
          "Luke 1:38",
          "Psalm 51:3",
          "Matthew 11:28",
          "Romans 12:1",
          "Proverbs 16:3",
          "Mark 2:17",
        ],
      },
    ],
  },
  {
    id: "prayer",
    title: "How to pray",
    summary: "A simple way to begin mental prayer",
    blocks: [
      {
        kind: "quote",
        text: "Contemplative prayer in my opinion is nothing else than a close sharing between friends; it means taking time frequently to be alone with him who we know loves us.",
        cite: "Saint Teresa of Jesus, quoted in CCC 2709",
      },
      {
        kind: "list",
        ordered: true,
        items: [
          "Find a quiet place and a fixed time. Ten minutes is a good start.",
          "Put yourself in God's presence. You can use the prayer Before Mental Prayer.",
          "Read a few lines of the Gospel or a spiritual book, slowly.",
          "Talk to Jesus about it and about your life: thank him, ask, say sorry, and listen.",
          "End with one small, concrete resolution for today.",
          "Thank him, and finish with a short prayer to Mary.",
        ],
      },
      {
        kind: "p",
        text: "Distractions will come. Gently come back. Staying faithful when prayer feels dry is itself a gift to God (CCC 2729-2731).",
      },
      {
        kind: "links",
        items: [
          { label: "Before Mental Prayer", to: "/prayers/before-prayer" },
          { label: "Today's Gospel", to: "/mass" },
        ],
      },
    ],
  },
];

export const guideById = (id: string) => GUIDES.find((g) => g.id === id);

/** Questions for the night examination. Short, in the spirit of a daily plan of life. */
export const NIGHT_EXAM: string[] = [
  "Did I offer my day to God when I woke up?",
  "Did I keep my times of prayer, or push them aside?",
  "Did I work well and finish what I started?",
  "How did I treat the people at home and at work? Was I patient, kind and fair?",
  "Did I speak badly of anyone, or lie?",
  "Did I guard my eyes, my thoughts and my words?",
  "Did I give in to laziness, gluttony or wasting time?",
  "Where did I see God's hand today, and did I thank him?",
];
