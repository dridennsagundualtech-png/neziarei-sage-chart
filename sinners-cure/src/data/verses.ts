/**
 * Daily verses, one per day in rotation (day of the year modulo the list length).
 * `key` is BOOK.ch.v (or BOOK.ch.v-v2) in the bundled Bibles; `text` is the Douay-Rheims,
 * shown until the chosen translation loads. `apply`: a way to live the verse today
 * (Tagalog versions in verses.tl.ts, used when the app is in Tagalog).
 */
import { TL } from "@/lib/lang";
import { VERSE_APPLY_TL } from "./verses.tl";

export interface DailyVerse {
  ref: string;
  key: string;
  text: string;
  apply: string;
}

const VERSES_EN: DailyVerse[] = [
  {
    ref: "Mark 2:17",
    key: "MRK.2.17",
    text: "Jesus hearing this, saith to them: They that are well have no need of a physician, but they that are sick. For I came not to call the just, but sinners.",
    apply: "Christ is the physician of sinners. Bring him the wound you usually hide.",
  },
  {
    ref: "Colossians 3:23",
    key: "COL.3.23",
    text: "Whatsoever you do, do it from the heart, as to the Lord, and not to men:",
    apply: "Offer your work to God and do it well, even the parts no one will see.",
  },
  {
    ref: "1 Thessalonians 5:17",
    key: "1TH.5.17",
    text: "Pray without ceasing.",
    apply: "Turn small moments into prayer: Jesus, I trust in you.",
  },
  {
    ref: "Matthew 6:33",
    key: "MAT.6.33",
    text: "Seek ye therefore first the kingdom of God, and his justice, and all these things shall be added unto you.",
    apply: "Put God first today: prayer and his will before worry.",
  },
  {
    ref: "Philippians 4:13",
    key: "PHP.4.13",
    text: "I can do all things in him who strengtheneth me.",
    apply: "Face today's hardest task with Christ, not alone.",
  },
  {
    ref: "John 15:5",
    key: "JHN.15.5",
    text: "I am the vine: you the branches. He that abideth in me, and I in him, the same beareth much fruit: for without me you can do nothing.",
    apply: "Before each task, ask for his help in a few words.",
  },
  {
    ref: "Luke 1:38",
    key: "LUK.1.38",
    text: "And Mary said: Behold the handmaid of the Lord: be it done to me according to thy word.",
    apply: "Say yes to God in the small things he asks of you today.",
  },
  {
    ref: "Psalm 51:3",
    key: "PSA.51.3",
    text: "Have mercy on me, O God, according to thy great mercy. And according to the multitude of thy tender mercies blot out my iniquity.",
    apply: "Tonight, look back on the day honestly and return to God.",
  },
  {
    ref: "Matthew 11:28",
    key: "MAT.11.28",
    text: "Come to me all you that labor and are burdened, and I will refresh you.",
    apply: "When you are tired, stop for a moment and rest in him.",
  },
  {
    ref: "Romans 12:1",
    key: "ROM.12.1",
    text: "I beseech you therefore, brethren, by the mercy of God, that you present your bodies a living sacrifice, holy, pleasing unto God, your reasonable service.",
    apply: "Offer him the whole day: work, family and whatever you suffer.",
  },
  {
    ref: "Proverbs 16:3",
    key: "PRO.16.3",
    text: "Lay open thy works to the Lord: and thy thoughts shall be directed.",
    apply: "Before you start, commit your plans to the Lord.",
  },
  {
    ref: "Matthew 9:13",
    key: "MAT.9.13",
    text: "Go then and learn what this meaneth, I will have mercy and not sacrifice. For I am not come to call the just, but sinners.",
    apply: "Jesus came for sinners, and that includes you. Let him find you today.",
  },
  {
    ref: "1 Timothy 1:15",
    key: "1TI.1.15",
    text: "A faithful saying, and worthy of all acceptation, that Christ Jesus came into the world to save sinners, of whom I am the chief.",
    apply: "Even the saints called themselves sinners. Humility is the door to mercy.",
  },
  {
    ref: "John 3:16",
    key: "JHN.3.16",
    text: "For God so loved the world, as to give his only begotten Son: that whosoever believeth in him may not perish, but may have life everlasting.",
    apply: "God's love comes first. You don't have to earn it.",
  },
  {
    ref: "Psalm 23:1",
    key: "PSA.23.1",
    text: "The Lord ruleth me: and I shall want nothing.",
    apply: "Whatever you lack today, you are not alone.",
  },
  {
    ref: "Psalm 46:11",
    key: "PSA.46.11",
    text: "Be still and see that I am God; I will be exalted among the nations, and I will be exalted in the earth.",
    apply: "Find five minutes of silence today and spend them with God.",
  },
  {
    ref: "Lamentations 3:22-23",
    key: "LAM.3.22-23",
    text: "The mercies of the Lord that we are not consumed: because his commiserations have not failed. They are new every morning, great is thy faithfulness.",
    apply: "Today is a new start. His mercy is new this morning too.",
  },
  {
    ref: "1 John 1:9",
    key: "1JN.1.9",
    text: "If we confess our sins, he is faithful and just, to forgive us our sins and to cleanse us from all iniquity.",
    apply: "If something weighs on your conscience, plan when you will go to Confession.",
  },
  {
    ref: "Luke 15:7",
    key: "LUK.15.7",
    text: "I say to you that even so there shall be joy in heaven upon one sinner that doth penance, more than upon ninety-nine just who need not penance.",
    apply: "No one is beyond return. Pray for someone who has drifted from God.",
  },
  {
    ref: "Isaiah 1:18",
    key: "ISA.1.18",
    text: "And then come, and accuse me, saith the Lord: if your sins be as scarlet, they shall be made as white as snow: and if they be red as crimson, they shall be white as wool.",
    apply: "Bring God the sin you are most ashamed of. It is not too big for him.",
  },
  {
    ref: "Micah 6:8",
    key: "MIC.6.8",
    text: "I will shew thee, O man, what is good, and what the Lord requireth of thee: Verily to do judgment, and to love mercy, and to walk solicitous with thy God.",
    apply: "Be fair, be kind, and walk with God in the next thing you do.",
  },
  {
    ref: "Matthew 5:8",
    key: "MAT.5.8",
    text: "Blessed are the clean of heart: they shall see God.",
    apply: "Guard your eyes and your heart today.",
  },
  {
    ref: "Matthew 25:40",
    key: "MAT.25.40",
    text: "And the king answering shall say to them: Amen I say to you, as long as you did it to one of these my least brethren, you did it to me.",
    apply: "Do one hidden act of kindness for someone who can't repay you.",
  },
  {
    ref: "John 14:27",
    key: "JHN.14.27",
    text: "Peace I leave with you: my peace I give unto you: not as the world giveth, do I give unto you. Let not your heart be troubled: nor let it be afraid.",
    apply: "Before you react in anger, pause and ask for his peace.",
  },
  {
    ref: "Proverbs 3:5",
    key: "PRO.3.5",
    text: "Have confidence in the Lord with all thy heart, and lean not upon thy own prudence.",
    apply: "Trust God with what you can't control.",
  },
  {
    ref: "Psalm 27:1",
    key: "PSA.27.1",
    text: "The Lord is my light and my salvation, whom shall I fear? The Lord is the protector of my life: of whom shall I be afraid?",
    apply: "Name your fear in prayer and hand it over to him.",
  },
  {
    ref: "Isaiah 41:10",
    key: "ISA.41.10",
    text: "Fear not, for I am with thee: turn not aside, for I am thy God: I have strengthened thee, and have helped thee, and the right hand of my just one hath upheld thee.",
    apply: "Whatever you face today, he is beside you.",
  },
  {
    ref: "Joshua 1:9",
    key: "JOS.1.9",
    text: "Behold I command thee, take courage, and be strong. Fear not, and be not dismayed: because the Lord thy God is with thee in all things whatsoever thou shalt go to.",
    apply: "Do the brave thing you have been putting off.",
  },
  {
    ref: "1 Corinthians 13:4",
    key: "1CO.13.4",
    text: "Charity is patient, is kind: charity envieth not, dealeth not perversely, is not puffed up,",
    apply: "Be patient with one person who tests you today.",
  },
  {
    ref: "Galatians 6:9",
    key: "GAL.6.9",
    text: "And in doing good, let us not fail. For in due time we shall reap, not failing.",
    apply: "Keep going in the good you have started, even if no one notices.",
  },
  {
    ref: "James 1:22",
    key: "JAS.1.22",
    text: "But be ye doers of the word and not hearers only, deceiving your own selves.",
    apply: "Choose one line of today's Gospel and live it.",
  },
  {
    ref: "Luke 9:23",
    key: "LUK.9.23",
    text: "And he said to all: If any man will come after me, let him deny himself and take up his cross daily and follow me.",
    apply: "Accept today's small cross without complaining.",
  },
  {
    ref: "Ephesians 4:32",
    key: "EPH.4.32",
    text: "And be ye kind one to another: merciful, forgiving one another, even as God hath forgiven you in Christ.",
    apply: "Forgive someone in your heart today, even before they ask.",
  },
  {
    ref: "Psalm 118:24",
    key: "PSA.118.24",
    text: "This is the day which the Lord hath made: let us be glad and rejoice therein.",
    apply: "Before you sleep, thank God for three things from today.",
  },
  {
    ref: "1 Peter 5:7",
    key: "1PE.5.7",
    text: "Casting all your care upon him, for he hath care of you.",
    apply: "Give him the worry you keep picking back up.",
  },
  {
    ref: "Matthew 6:34",
    key: "MAT.6.34",
    text: "Be not therefore solicitous for to morrow; for the morrow will be solicitous for itself. Sufficient for the day is the evil thereof.",
    apply: "Do today's duty well and leave tomorrow to God.",
  },
  {
    ref: "John 6:35",
    key: "JHN.6.35",
    text: "And Jesus said to them: I am the bread of life. He that cometh to me shall not hunger: and he that believeth in me shall never thirst.",
    apply: "If you can't get to Mass, make a spiritual communion.",
  },
  {
    ref: "Psalm 119:105",
    key: "PSA.119.105",
    text: "Thy word is a lamp to my feet, and a light to my paths.",
    apply: "Read a page of the Gospel today and let it light your next step.",
  },
  {
    ref: "Romans 8:28",
    key: "ROM.8.28",
    text: "And we know that to them that love God all things work together unto good: to such as, according to his purpose, are called to be saints.",
    apply: "Look for God's hand even in what went wrong today.",
  },
  {
    ref: "Philippians 4:6",
    key: "PHP.4.6",
    text: "Be nothing solicitous: but in every thing, by prayer and supplication, with thanksgiving, let your petitions be made known to God.",
    apply: "Turn your worry into a prayer, then thank him.",
  },
  {
    ref: "Hebrews 4:16",
    key: "HEB.4.16",
    text: "Let us go therefore with confidence to the throne of grace: that we may obtain mercy and find grace in seasonable aid.",
    apply: "Ask boldly. God wants to help you.",
  },
  {
    ref: "Matthew 5:44",
    key: "MAT.5.44",
    text: "But I say to you, Love your enemies: do good to them that hate you: and pray for them that persecute and calumniate you:",
    apply: "Pray by name for someone who has hurt you.",
  },
  {
    ref: "2 Corinthians 12:9",
    key: "2CO.12.9",
    text: "And he said to me: My grace is sufficient for thee: for power is made perfect in infirmity. Gladly therefore will I glory in my infirmities, that the power of Christ may dwell in me.",
    apply: "Your weakness is where his grace works. Don't hide it from him.",
  },
  {
    ref: "Revelation 3:20",
    key: "REV.3.20",
    text: "Behold, I stand at the gate and knock. If any man shall hear my voice and open to me the door, I will come in to him and will sup with him: and he with me.",
    apply: "Open the door: say a short prayer right now.",
  },
  {
    ref: "John 8:11",
    key: "JHN.8.11",
    text: "Who said: No man, Lord. And Jesus said: Neither will I condemn thee. Go, and now sin no more.",
    apply: "Receive his mercy, then change one thing.",
  },
  {
    ref: "Luke 23:42-43",
    key: "LUK.23.42-43",
    text: "And he said to Jesus: Lord, remember me when thou shalt come into thy kingdom. And Jesus said to him: Amen I say to thee: This day thou shalt be with me in paradise.",
    apply: "It is never too late to turn to him.",
  },
  {
    ref: "Ezekiel 36:26",
    key: "EZK.36.26",
    text: "And I will give you a new heart, and put a new spirit within you: and I will take away the stony heart out of your flesh, and will give you a heart of flesh.",
    apply: "Ask God to soften the place in your heart that has grown hard.",
  },
  {
    ref: "Psalm 103:12",
    key: "PSA.103.12",
    text: "As far as the east is from the west, so far hath he removed our iniquities from us.",
    apply: "Confessed sins are gone. Don't carry what God has taken away.",
  },
  {
    ref: "Isaiah 43:1",
    key: "ISA.43.1",
    text: "And now thus saith the Lord that created thee, O Jacob, and formed thee, O Israel: Fear not, for I have redeemed thee, and called thee by thy name: thou art mine.",
    apply: "You belong to God. Let that steady you today.",
  },
  {
    ref: "Psalm 34:9",
    key: "PSA.34.9",
    text: "O taste, and see that the Lord is sweet: blessed is the man that hopeth in him.",
    apply: "Taste and see: give God one quiet moment today and notice his goodness.",
  },
];

export const VERSES: DailyVerse[] = TL
  ? VERSES_EN.map((v) => ({ ...v, apply: VERSE_APPLY_TL[v.key] ?? v.apply }))
  : VERSES_EN;
