/**
 * Prayer texts. Each prayer: { id, title, text }. Use "\n" for line breaks and
 * "\n\n" for paragraphs. Prayers with `listed: true` appear on the Prayers tab.
 */
export interface Prayer {
  id: string;
  title: string;
  text: string;
  listed?: boolean;
  group?: string;
}

export const P = {
  beforeRosary:
    "Queen of the Holy Rosary, you came to Fatima to reveal to the three shepherd children the treasures of grace hidden in the Rosary. Inspire my heart with a sincere love of this devotion, in order that by meditating on the Mysteries of our Redemption which are recalled in it, I may obtain peace for the world, the conversion of sinners, and the favor which I ask of you in this Rosary (mention your request). I ask it for the greater glory of God, for your own honor, and for the good of souls, especially for my own. Amen.",
  signOfCross: "In the name of the Father, and of the Son, and of the Holy Spirit. Amen.",
  creed:
    "I believe in God, the Father Almighty, Creator of Heaven and earth; and in Jesus Christ, His only Son, our Lord; who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died, and was buried. He descended into hell; on the third day He rose again from the dead; He ascended into Heaven, and is seated at the right hand of God the Father Almighty; from there He shall come to judge the living and the dead.\n\nI believe in the Holy Spirit, the holy Catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body, and life everlasting. Amen.",
  ourFather:
    "Our Father, who art in heaven, hallowed be Thy name; Thy kingdom come; Thy will be done on earth as it is in heaven.\n\nGive us this day our daily bread; and forgive us our trespasses as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.",
  hailMary:
    "Hail Mary, full of grace, the Lord is with thee. Blessed art thou among women, and blessed is the fruit of thy womb, Jesus.\n\nHoly Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.",
  gloryBe:
    "Glory be to the Father, and to the Son, and to the Holy Spirit. As it was in the beginning, is now, and ever shall be, world without end. Amen.",
  fatima:
    "O my Jesus, forgive us our sins, save us from the fires of hell, and lead all souls to Heaven, especially those who are in most need of Thy mercy.",
  hailHolyQueen:
    "Hail, holy Queen, Mother of Mercy, our life, our sweetness, and our hope. To thee do we cry, poor banished children of Eve. To thee do we send up our sighs, mourning and weeping in this valley of tears. Turn then, most gracious advocate, thine eyes of mercy toward us; and after this our exile, show unto us the blessed fruit of thy womb, Jesus. O clement, O loving, O sweet Virgin Mary.\n\nV. Pray for us, O holy Mother of God.\nR. That we may be made worthy of the promises of Christ.",
  rosaryClosing:
    "Let us pray. O God, whose only begotten Son, by His life, death, and resurrection, has purchased for us the rewards of eternal life, grant, we beseech Thee, that meditating upon these mysteries of the Most Holy Rosary of the Blessed Virgin Mary, we may imitate what they contain and obtain what they promise, through the same Christ our Lord. Amen.",
  memorare:
    "Remember, O most gracious Virgin Mary, that never was it known that anyone who fled to thy protection, implored thy help, or sought thine intercession was left unaided.\n\nInspired by this confidence, I fly unto thee, O Virgin of virgins, my Mother. To thee do I come, before thee I stand, sinful and sorrowful.\n\nO Mother of the Word Incarnate, despise not my petitions, but in thy mercy hear and answer me. Amen.",
  stMichael:
    "Saint Michael the Archangel, defend us in battle. Be our defense against the wickedness and snares of the devil. May God rebuke him, we humbly pray; and do thou, O Prince of the heavenly hosts, by the power of God, thrust into hell Satan and all the evil spirits who prowl about the world seeking the ruin of souls. Amen.",
  litany:
    "Lord, have mercy. Christ, have mercy. Lord, have mercy.\nChrist, hear us. Christ, graciously hear us.\n\nGod, the Father of heaven, have mercy on us.\nGod the Son, Redeemer of the world, have mercy on us.\nGod the Holy Spirit, have mercy on us.\nHoly Trinity, one God, have mercy on us.\n\nHoly Mary, pray for us.\nHoly Mother of God,\nHoly Virgin of virgins,\nMother of Christ,\nMother of the Church,\nMother of Mercy,\nMother of Divine Grace,\nMother of Hope,\nMother most pure,\nMother most chaste,\nMother inviolate,\nMother undefiled,\nMother most amiable,\nMother admirable,\nMother of good counsel,\nMother of our Creator,\nMother of our Savior,\nVirgin most prudent,\nVirgin most venerable,\nVirgin most renowned,\nVirgin most powerful,\nVirgin most merciful,\nVirgin most faithful,\nMirror of justice,\nSeat of wisdom,\nCause of our joy,\nSpiritual vessel,\nVessel of honor,\nSingular vessel of devotion,\nMystical rose,\nTower of David,\nTower of ivory,\nHouse of gold,\nArk of the covenant,\nGate of heaven,\nMorning star,\nHealth of the sick,\nRefuge of sinners,\nSolace of migrants,\nComfort of the afflicted,\nHelp of Christians,\nQueen of Angels,\nQueen of Patriarchs,\nQueen of Prophets,\nQueen of Apostles,\nQueen of Martyrs,\nQueen of Confessors,\nQueen of Virgins,\nQueen of all Saints,\nQueen conceived without original sin,\nQueen assumed into heaven,\nQueen of the most holy Rosary,\nQueen of families,\nQueen of peace, pray for us.\n\nLamb of God, who takes away the sins of the world, spare us, O Lord.\nLamb of God, who takes away the sins of the world, graciously hear us, O Lord.\nLamb of God, who takes away the sins of the world, have mercy on us.\n\nV. Pray for us, O holy Mother of God.\nR. That we may be made worthy of the promises of Christ.\n\nLet us pray. Grant, we beseech thee, O Lord God, that we, your servants, may enjoy perpetual health of mind and body; and by the glorious intercession of the Blessed Mary, ever Virgin, may be delivered from present sorrow, and obtain eternal joy. Through Christ our Lord. Amen.",
  chapletOpening:
    "You expired, Jesus, but the source of life gushed forth for souls, and the ocean of mercy opened up for the whole world. O Fount of Life, unfathomable Divine Mercy, envelop the whole world and empty Yourself out upon us.\n\nO Blood and Water, which gushed forth from the Heart of Jesus as a fountain of mercy for us, I trust in You! (three times)",
  eternalFather:
    "Eternal Father, I offer You the Body and Blood, Soul and Divinity of Your dearly beloved Son, our Lord Jesus Christ, in atonement for our sins and those of the whole world.",
  forTheSake: "For the sake of His sorrowful Passion, have mercy on us and on the whole world.",
  holyGod: "Holy God, Holy Mighty One, Holy Immortal One, have mercy on us and on the whole world.\n\n(Pray three times.)",
  chapletClosing:
    "Eternal God, in whom mercy is endless and the treasury of compassion inexhaustible, look kindly upon us and increase Your mercy in us, that in difficult moments we might not despair nor become despondent, but with great confidence submit ourselves to Your holy will, which is Love and Mercy itself. Amen.\n\nJesus, I trust in You.",
  actOfContrition:
    "O my God, I am heartily sorry for having offended Thee, and I detest all my sins because of Thy just punishments, but most of all because they offend Thee, my God, who art all good and deserving of all my love. I firmly resolve, with the help of Thy grace, to sin no more and to avoid the near occasion of sin. Amen.",
};

export const PRAYERS: Prayer[] = [
  { id: "our-father", title: "Our Father", text: P.ourFather, listed: true, group: "Essential" },
  { id: "hail-mary", title: "Hail Mary", text: P.hailMary, listed: true, group: "Essential" },
  { id: "glory-be", title: "Glory Be", text: P.gloryBe, listed: true, group: "Essential" },
  { id: "apostles-creed", title: "Apostles' Creed", text: P.creed, listed: true, group: "Essential" },
  {
    id: "angelus",
    title: "The Angelus",
    listed: true,
    group: "Marian",
    text:
      "V. The Angel of the Lord declared unto Mary,\nR. And she conceived of the Holy Spirit.\n\nHail Mary…\n\nV. Behold the handmaid of the Lord.\nR. Be it done unto me according to thy word.\n\nHail Mary…\n\nV. And the Word was made flesh,\nR. And dwelt among us.\n\nHail Mary…\n\nV. Pray for us, O holy Mother of God,\nR. That we may be made worthy of the promises of Christ.\n\nLet us pray. Pour forth, we beseech Thee, O Lord, Thy grace into our hearts; that we, to whom the Incarnation of Christ, Thy Son, was made known by the message of an angel, may by His Passion and Cross be brought to the glory of His Resurrection. Through the same Christ our Lord. Amen.",
  },
  { id: "memorare", title: "Memorare", text: P.memorare, listed: true, group: "Marian" },
  { id: "hail-holy-queen", title: "Hail, Holy Queen", text: P.hailHolyQueen, listed: true, group: "Marian" },
  { id: "litany-loreto", title: "Litany of Loreto", text: P.litany, listed: true, group: "Marian" },
  { id: "act-of-contrition", title: "Act of Contrition", text: P.actOfContrition, listed: true, group: "Daily" },
  {
    id: "morning",
    title: "Morning Offering",
    listed: true,
    group: "Daily",
    text:
      "O Jesus, through the Immaculate Heart of Mary, I offer You my prayers, works, joys, and sufferings of this day for all the intentions of Your Sacred Heart, in union with the Holy Sacrifice of the Mass throughout the world, in reparation for my sins, for the intentions of all my relatives and friends, and in particular for the intentions of the Holy Father. Amen.\n\nAngel of God, my guardian dear, to whom God's love commits me here, ever this day be at my side, to light and guard, to rule and guide. Amen.",
  },
  {
    id: "night",
    title: "Night Prayer",
    listed: true,
    group: "Daily",
    text:
      "O my God, at the end of this day I thank You most heartily for all the graces I have received from You. I am sorry that I have not made a better use of them. I am sorry for all the sins I have committed against You. Forgive me, O my God, and graciously protect me this night.\n\nBlessed Virgin Mary, my dear heavenly Mother, take me under your protection. Saint Joseph, my dear guardian angel, and all you saints of God, pray for me.\n\nInto Your hands, O Lord, I commend my spirit. Lord Jesus, receive my soul. Amen.",
  },
  {
    id: "grace-before",
    title: "Grace Before Meals",
    listed: true,
    group: "Daily",
    text: "Bless us, O Lord, and these Thy gifts, which we are about to receive from Thy bounty, through Christ our Lord. Amen.",
  },
  {
    id: "grace-after",
    title: "Grace After Meals",
    listed: true,
    group: "Daily",
    text:
      "We give Thee thanks, Almighty God, for all Thy benefits, who livest and reignest, world without end. Amen.\n\nMay the souls of the faithful departed, through the mercy of God, rest in peace. Amen.",
  },
  { id: "st-michael", title: "Prayer to St Michael", text: P.stMichael, listed: true, group: "Protection" },
];

export const prayerById = (id: string) => PRAYERS.find((p) => p.id === id);
