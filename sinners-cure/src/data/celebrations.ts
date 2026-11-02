/**
 * What each day's Mass is about, in plain words.
 * DAY_TEXT: by day code (calendar.ts) or by the celebration's name in general-calendar.json.
 * SAINT_TEXT: feasts and obligatory memorials of saints, by name.
 * seasonText(): the fallback for ordinary days of each season.
 * Tagalog versions live in celebrations.tl.ts and are used when the app is in Tagalog.
 */
import { TL } from "@/lib/lang";
import { DAY_TEXT_TL, SAINT_TEXT_TL, seasonTextTl } from "./celebrations.tl";

const DAY_TEXT_EN: Record<string, string> = {
  // Christmas
  "Nativity of the Lord":
    "The Word became flesh and dwelt among us. God's Son is born of the Virgin Mary in Bethlehem, poor and small, so that we might share his divine life.",
  "CW01-HolyFamily":
    "Jesus grew up in a family, with Mary and Joseph, in an ordinary home in Nazareth. The Church holds up their love, faith and work as a pattern for every family.",
  "Blessed Virgin Mary, the Mother of God":
    "On the eighth day of Christmas we honor Mary as Mother of God, because the child she bore is truly God. The year begins under her care, and the Church prays for peace.",
  "CW02-0Sun":
    "Christmas joy continues. John's Gospel proclaims that the eternal Word, through whom all things were made, has come to live among us.",
  "CW03-Epiphany":
    "The Magi follow a star to worship the newborn King. Christ is revealed to all the nations, not only to Israel: he came for everyone.",
  "CW04-Baptism":
    "Jesus is baptized by John in the Jordan, the Spirit descends, and the Father says, This is my beloved Son. Christmas Time ends, and we remember our own baptism.",
  "Presentation of the Lord":
    "Forty days after Christmas, Mary and Joseph bring Jesus to the Temple. Old Simeon takes him in his arms and calls him a light for the nations. Candles are blessed today.",
  // Lent and Holy Week
  "LW00-3Wed":
    "Lent begins. Ashes on the forehead remind us that we are dust and called to repent and believe in the Gospel. A day of fasting and abstinence.",
  "LW04-0Sun":
    "Laetare, rejoice: halfway through Lent, rose vestments and joyful words remind us that Easter is near.",
  "LW06-0Sun":
    "Jesus enters Jerusalem to the shouts of Hosanna, and within days he is crucified. We carry palms and hear the whole Passion. Holy Week begins.",
  "LW06-4Thu":
    "At the Last Supper Jesus gives us the Eucharist and the priesthood, and washes his disciples' feet. After Mass we keep watch with him, as he asked in the garden.",
  "LW06-5Fri":
    "Jesus dies on the Cross for our sins. There is no Mass today. We hear the Passion, venerate the Cross, and receive Communion kept from Holy Thursday. A day of fasting and abstinence.",
  "LW06-6Sat":
    "Christ lies in the tomb and the Church waits in silence. After dark the Easter Vigil begins with the new fire and the Easter candle: Christ is risen.",
  // Easter
  "EW01-0Sun":
    "He is risen! Jesus has conquered sin and death. Easter is the greatest feast of the year and the reason we gather every Sunday.",
  "EW02-0Sun":
    "The risen Jesus breathes the Holy Spirit on the apostles and gives them power to forgive sins. Thomas doubts, then believes. Saint John Paul II named this Divine Mercy Sunday.",
  "EW07-Ascension":
    "Forty days after Easter, Jesus returns to the Father. He sends his disciples to all the world and promises to be with us always.",
  "EW08-Pentecost":
    "The Holy Spirit comes upon Mary and the apostles like wind and fire. The Church is born and begins to speak to every nation. Easter Time ends today.",
  // After Pentecost
  "OW00-Trinity":
    "One God in three Persons: Father, Son and Holy Spirit. We do not solve this mystery; we are invited to live in it, as children of a God who is love.",
  "OW00-CorpusChristi":
    "We give thanks for the Eucharist: Jesus truly present, Body, Blood, soul and divinity, under the appearance of bread and wine. Many parishes hold a procession today.",
  "OW00-SacredHeart":
    "We honor the Heart of Jesus, pierced on the Cross, as the sign of his love for each person. Jesus said: Learn of me, because I am meek and humble of heart.",
  "OW00-ImmaculateHeart":
    "The day after the Sacred Heart, we honor the heart of Mary, who kept all these things and pondered them in her heart.",
  "OW00-MaryMotherofChurch":
    "The day after Pentecost, we honor Mary as Mother of the Church. At the Cross Jesus gave her to the beloved disciple, and to all of us.",
  "OW34-0Sun":
    "The last Sunday of the Church's year. Christ is King, but his throne is the Cross and his rule is love. Next Sunday, Advent begins.",
  "AW03-0Sun":
    "Gaudete, rejoice: the Lord is near. Rose vestments and a lighter mood in the middle of Advent.",
  // Fixed solemnities and feasts of the Lord
  "Saint Joseph Husband of the Blessed Virgin Mary":
    "Joseph, a just man and a carpenter, protected Mary and Jesus and taught Jesus his trade. He is patron of the universal Church, of fathers and of workers.",
  "Annunciation of the Lord":
    "The angel Gabriel announces to Mary that she will bear the Son of God, and she answers: Be it done to me according to thy word. Nine months before Christmas, God becomes man.",
  "Birth of Saint John the Baptist":
    "John is born to the elderly Elizabeth and Zechariah. He will prepare the way for Jesus. His father, struck dumb, speaks again to praise God.",
  "Saints Peter and Paul, Apostles":
    "The two pillars of the Church in Rome: Peter the fisherman, the rock on which Christ built his Church, and Paul, the persecutor who became the Apostle to the nations. Both died as martyrs in Rome.",
  "Transfiguration of the Lord":
    "On the mountain, Jesus' face shines like the sun before Peter, James and John, and the Father says, This is my beloved Son; hear ye him. A glimpse of glory before the Cross.",
  "Assumption of the Blessed Virgin Mary":
    "At the end of her earthly life Mary was taken up body and soul into heaven. Where she has gone, we hope to follow.",
  "Exaltation of the Holy Cross":
    "We honor the Cross on which Christ saved the world: once a sign of shame, now the sign of God's love.",
  "All Saints":
    "We celebrate all the saints in heaven, known and unknown, ordinary people made holy by God's grace. The Beatitudes show the way they walked, and invite us to follow.",
  "All Souls":
    "We pray for all who have died and are being purified before they see God. Our prayers and the Mass can help them. Many visit the graves of their loved ones today.",
  "Dedication of the Lateran basilica":
    "The Lateran Basilica is the cathedral of Rome, the Pope's own church and the mother of all churches. Its feast reminds us that we ourselves are God's temple.",
  "Immaculate Conception of the Blessed Virgin Mary":
    "From the first moment of her life, Mary was kept free from original sin by the grace of Christ, to be a fitting mother for God's Son.",
  "Visitation of the Blessed Virgin Mary":
    "Mary hurries to visit her cousin Elizabeth, carrying Jesus within her. John leaps in Elizabeth's womb, and Mary sings the Magnificat.",
  "Birth of the Blessed Virgin Mary":
    "The birthday of the Mother of God. Her birth was the dawn before the coming of Christ.",
  "Presentation of the Blessed Virgin Mary":
    "Tradition tells that Mary was brought to the Temple as a child and gave herself wholly to God.",
};

const SAINT_TEXT_EN: Record<string, string> = {
  "Saints Basil the Great and Gregory Nazianzen, bishops and doctors":
    "Two friends and bishops of the 4th century who defended the faith that Jesus is truly God and taught the Church to speak rightly of the Trinity.",
  "Saint Anthony of Egypt, abbot":
    "He gave away his inheritance and went into the desert to pray, becoming the father of monks.",
  "Saint Agnes, virgin and martyr":
    "A young girl of Rome, martyred around the year 304 rather than give up her consecration to Christ.",
  "Saint Francis de Sales, bishop and doctor":
    "Bishop of Geneva and patron of writers, who taught that holiness is for everyone, in every walk of life, through gentleness and love.",
  "The Conversion of Saint Paul, apostle":
    "On the road to Damascus the persecutor Saul met the risen Jesus and became Paul, the Apostle to the nations. No one is too far gone for grace.",
  "Saints Timothy and Titus, bishops":
    "Companions of Saint Paul, whom he left to lead the young churches of Ephesus and Crete.",
  "Saint Thomas Aquinas, priest and doctor":
    "Dominican priest and Doctor of the Church whose writings unite faith and reason. He wrote the hymns sung at Corpus Christi.",
  "Saint John Bosco, priest":
    "A priest of Turin who gave his life to poor and abandoned boys, forming them through reason, faith and kindness.",
  "Saint Agatha, virgin and martyr":
    "A young woman of Sicily, martyred in the 3rd century for her faith.",
  "Saints Paul Miki and companions, martyrs":
    "Twenty-six Catholics, Japanese and missionaries, crucified at Nagasaki in 1597. Paul Miki forgave his executioners from the cross.",
  "Saint Scholastica, virgin": "Sister of Saint Benedict and a nun devoted to prayer.",
  "Saints Cyril, monk, and Methodius, bishop":
    "Brothers who brought the Gospel to the Slavic peoples, translating the Scriptures and the liturgy into their language.",
  "Chair of Saint Peter, apostle":
    "A feast of the mission Christ gave to Peter and his successors: to strengthen their brothers in faith and keep the Church one.",
  "Saint Polycarp, bishop and martyr":
    "Bishop of Smyrna and a disciple of the Apostle John, burned at the stake around the year 155.",
  "Saints Perpetua and Felicity, martyrs":
    "A young noblewoman and her servant, both young mothers, martyred together at Carthage in 203.",
  "Saint John Baptist de la Salle, priest":
    "Priest and founder of the Brothers of the Christian Schools, patron of teachers.",
  "Saint Mark the Evangelist":
    "Author of the second Gospel and companion of Peter and Paul. His Gospel tells the Good News briefly and urgently.",
  "Saint Catherine of Siena, virgin and doctor of the Church":
    "A Dominican laywoman, mystic and Doctor of the Church who worked for peace and urged the Pope to return to Rome.",
  "Saint Athanasius, bishop and doctor":
    "Bishop of Alexandria, exiled five times for defending the faith that Jesus is true God.",
  "Saints Philip and James, Apostles":
    "Two of the Twelve. Philip asked Jesus to show them the Father; James, called the Less, led the Church in Jerusalem.",
  "Saint Matthias the Apostle":
    "Chosen by lot to take the place of Judas among the Twelve, as a witness to the Resurrection.",
  "Saint Philip Neri, priest":
    "A joyful priest of Rome, known for his humor and his care for young people and penitents.",
  "Saint Justin Martyr":
    "A philosopher who found the truth in Christ, explained the faith to pagans, and was martyred in Rome around 165.",
  "Saints Charles Lwanga and companions, martyrs":
    "Young Christians of Uganda, martyred in 1886 for their faith and their purity.",
  "Saint Boniface, bishop and martyr":
    "English monk and bishop who brought the Gospel to the German peoples and was martyred in 754.",
  "Saint Barnabas the Apostle":
    "A generous early disciple who sold his field for the Church, vouched for Paul and went with him on mission. His name means son of consolation.",
  "Saint Anthony of Padua, priest and doctor":
    "Franciscan preacher and Doctor of the Church, loved for his preaching and his care for the poor. Many ask his help to find what is lost.",
  "Saint Aloysius Gonzaga, religious":
    "A young Jesuit who gave up a noble inheritance and died at 23 after nursing plague victims in Rome.",
  "Saint Irenaeus, bishop and martyr":
    "Bishop of Lyon in the 2nd century, who defended the faith handed down from the apostles.",
  "Saint Thomas the Apostle":
    "The apostle who doubted, then knelt before the risen Jesus and said: My Lord and my God.",
  "Saint Benedict, abbot":
    "Father of monks in the West. His Rule of prayer and work shaped Europe for centuries.",
  "Saint Bonaventure, bishop and doctor":
    "Franciscan theologian, bishop and Doctor of the Church who wrote of the soul's ascent to God.",
  "Saint Mary Magdalene":
    "The first witness of the Resurrection, sent by the risen Lord to tell the disciples. She is called the Apostle to the Apostles.",
  "Saint James, apostle":
    "Son of Zebedee and brother of John, the first of the Twelve to die as a martyr.",
  "Saints Joachim and Anne":
    "The parents of the Virgin Mary and grandparents of Jesus, patrons of grandparents.",
  "Saints Martha, Mary and Lazarus":
    "Friends of Jesus at Bethany who welcomed him into their home. Jesus raised Lazarus from the dead.",
  "Saint Ignatius of Loyola, priest":
    "A wounded soldier who became a priest, founded the Jesuits and wrote the Spiritual Exercises, teaching how to find God in all things.",
  "Saint Alphonsus Maria de Liguori, bishop and doctor of the Church":
    "Bishop, moral theologian and Doctor of the Church, a gentle confessor and founder of the Redemptorists.",
  "Saint Jean Vianney (the Curé of Ars), priest":
    "A humble parish priest in France who spent long hours every day hearing confessions. Patron of parish priests.",
  "Saint Dominic, priest":
    "Founder of the Order of Preachers, who preached the Gospel in poverty and is linked by tradition with the Rosary.",
  "Saint Lawrence, deacon and martyr":
    "Deacon of Rome martyred in 258. Asked to hand over the Church's treasures, he brought the poor.",
  "Saint Clare, virgin":
    "Follower of Saint Francis and founder of the Poor Clares, who lived in prayer and poverty.",
  "Saint Maximilian Mary Kolbe, priest and martyr":
    "Franciscan priest who offered his life in place of a stranger, a husband and father, at Auschwitz in 1941.",
  "Saint Bernard of Clairvaux, abbot and doctor of the Church":
    "Cistercian abbot and Doctor of the Church, a great preacher of the love of God and of Mary.",
  "Saint Pius X, pope":
    "Pope who encouraged frequent Holy Communion and allowed children to receive it from the age of reason.",
  "Queenship of Blessed Virgin Mary":
    "A week after the Assumption, we honor Mary as Queen of heaven and earth, crowned by her Son.",
  "Saint Bartholomew the Apostle":
    "One of the Twelve, often identified with Nathanael, of whom Jesus said: Behold an Israelite indeed, in whom there is no guile.",
  "Saint Monica":
    "Mother of Saint Augustine, who prayed with tears for many years for her son's conversion.",
  "Saint Augustine of Hippo, bishop and doctor of the Church":
    "Bishop of Hippo and Doctor of the Church, converted after a restless youth. He wrote that our heart is restless until it rests in God.",
  "The Beheading of Saint John the Baptist, martyr":
    "John was beheaded for telling King Herod the truth about his marriage. He prepared the way for Christ in life and in death.",
  "Saint Gregory the Great, pope and doctor":
    "Pope and Doctor of the Church who sent missionaries to England and called himself the servant of the servants of God.",
  "Saint John Chrysostom, bishop and doctor":
    "Archbishop of Constantinople, called Golden Mouth for his preaching, exiled for speaking against corruption.",
  "Our Lady of Sorrows":
    "The day after the Holy Cross, we stand with Mary at the foot of the Cross and remember her sorrows.",
  "Saints Cornelius, pope, and Cyprian, bishop, martyrs":
    "A pope and a bishop of Carthage, both martyred in the 3rd century, who worked to welcome back sinners who repented.",
  "Saint Andrew Kim Taegon, priest, and Paul Chong Hasang and companions, martyrs":
    "The martyrs of Korea, killed in the 1800s. Andrew Kim Taegon was the first Korean priest.",
  "Saint Matthew the Evangelist, Apostle, Evangelist":
    "A tax collector whom Jesus called with two words: Follow me. He left everything and wrote the first Gospel.",
  "Saint Pio of Pietrelcina (Padre Pio), priest":
    "Capuchin friar who bore the wounds of Christ and spent long hours in the confessional.",
  "Saint Vincent de Paul, priest":
    "Priest and apostle of charity in France, founder of the Vincentians and, with Saint Louise de Marillac, the Daughters of Charity.",
  "Saints Michael, Gabriel and Raphael, Archangels":
    "The archangels God sends to defend, to announce and to heal.",
  "Saint Jerome, priest and doctor":
    "Priest and Doctor of the Church who translated the Bible into Latin. He wrote that ignorance of Scripture is ignorance of Christ.",
  "Saint Thérèse of the Child Jesus, virgin and doctor":
    "Carmelite nun and Doctor of the Church who taught the little way: doing small things with great love.",
  "Guardian Angels": "God gives each of us an angel to guard and guide us.",
  "Saint Francis of Assisi":
    "He embraced poverty to follow Christ, rebuilt the Church, and loved all of God's creation.",
  "Our Lady of the Rosary":
    "A day to honor Mary through the Rosary, first kept in thanksgiving for the victory at Lepanto in 1571.",
  "Saint Teresa of Jesus, virgin and doctor":
    "Carmelite reformer, mystic and Doctor of the Church, who taught that prayer is friendship with God.",
  "Saint Ignatius of Antioch, bishop and martyr":
    "Bishop of Antioch, taken to Rome and martyred around 107. On the way he wrote letters to the churches about the Eucharist and unity.",
  "Saint Luke the Evangelist":
    "Author of the third Gospel and the Acts of the Apostles, the evangelist of God's mercy.",
  "Saint Simon and Saint Jude, apostles":
    "Two of the Twelve. Saint Jude is invoked in desperate cases.",
  "Saint Charles Borromeo, bishop":
    "Archbishop of Milan who renewed the Church after the Council of Trent and cared for the sick during the plague.",
  "Saint Leo the Great, pope and doctor":
    "Pope and Doctor of the Church who taught that Christ is true God and true man, and faced Attila to protect Rome.",
  "Saint Martin of Tours, bishop":
    "A soldier who cut his cloak in half for a beggar, then dreamed it was Christ. He became a monk and bishop.",
  "Saint Josaphat, bishop and martyr":
    "Archbishop of the Eastern Catholic Church who worked for unity with Rome and was martyred in 1623.",
  "Saint Elizabeth of Hungary, religious":
    "A princess who used her wealth to care for the poor and sick.",
  "Presentation of the Blessed Virgin Mary":
    "Tradition tells that Mary was brought to the Temple as a child and gave herself wholly to God.",
  "Saint Cecilia": "Roman virgin and martyr, patron of music.",
  "Saint Andrew Dung-Lac and his companions, martyrs":
    "The martyrs of Vietnam, killed between the 17th and 19th centuries.",
  "Saint Andrew the Apostle":
    "Brother of Peter and the first called among the apostles, who brought his brother to Jesus.",
  "Saint Francis Xavier, priest": "Jesuit missionary to India and Japan, patron of the missions.",
  "Saint Ambrose, bishop and doctor":
    "Bishop of Milan and Doctor of the Church who baptized Saint Augustine.",
  "Saint Lucy of Syracuse, virgin and martyr":
    "Virgin and martyr of Syracuse in Sicily, around 304. Her name means light.",
  "Saint John of the Cross, priest and doctor":
    "Carmelite priest, mystic and Doctor of the Church, who wrote of the dark night that leads the soul to God.",
  "Saint Stephen, the first martyr":
    "The first martyr, stoned to death while praying for those who killed him.",
  "Saint John the Apostle and evangelist":
    "The beloved disciple, who leaned on Jesus' breast at the Last Supper, stood at the Cross and wrote the fourth Gospel.",
  "Holy Innocents, martyrs":
    "The baby boys of Bethlehem killed by King Herod. We pray for all children whose lives are in danger.",
  "Saint Joseph the Worker":
    "Joseph worked with his hands to support his family. Work is a way to become holy and to serve others.",
  "Our Lady of Lourdes":
    "In 1858 Mary appeared to Bernadette at Lourdes, calling herself the Immaculate Conception. Today is also the World Day of the Sick.",
  "Our Lady of Guadalupe":
    "In 1531 Mary appeared to Saint Juan Diego in Mexico and left her image on his cloak. She is patroness of the Americas.",
  "Saint Lorenzo Ruiz and companions, martyrs":
    "The first Filipino saint, martyred in Japan in 1637 with his companions. He said he would die a thousand times for God.",
};

export const DAY_TEXT: Record<string, string> = TL ? DAY_TEXT_TL : DAY_TEXT_EN;
export const SAINT_TEXT: Record<string, string> = TL ? SAINT_TEXT_TL : SAINT_TEXT_EN;

/** For ordinary days of each season. */
export function seasonText(code: string, date: Date): string {
  if (TL) return seasonTextTl(code, date);
  const p = code.slice(0, 2);
  const wk = Number(code.slice(2, 4));
  const sunday = date.getDay() === 0;
  if (p === "AW") {
    if (wk === 5)
      return "In the last days before Christmas, the readings tell the events that led to the birth of Jesus. The great O Antiphons are sung at Evening Prayer.";
    return sunday
      ? "Advent prepares us for Christ's coming: at Christmas, in our lives today, and at the end of time. Violet calls us to watchful, hopeful waiting."
      : "An Advent weekday. The prophets, especially Isaiah, stir up our longing for the Savior.";
  }
  if (p === "CW")
    return wk === 1
      ? "The Church keeps the eight days of Christmas as one long day of joy."
      : "Christmas Time. The Word was made flesh and dwelt among us, and the readings show who this child is.";
  if (p === "LW") {
    if (wk === 6) return "Holy Week. We walk with Jesus toward his Passion and death.";
    return sunday
      ? "A Sunday of Lent. Forty days of prayer, fasting and almsgiving lead us to renew our baptism at Easter."
      : "A weekday of Lent: a time for prayer, fasting and almsgiving, and a good time for Confession.";
  }
  if (p === "EW") {
    if (wk === 1)
      return "The eight days of Easter are celebrated as one great day of the Resurrection.";
    return sunday
      ? "A Sunday of Easter. For fifty days the Church sings Alleluia: Christ is risen."
      : "Easter Time. The first reading, from the Acts of the Apostles, shows the young Church living by the power of the risen Christ.";
  }
  return sunday
    ? "Every Sunday is a little Easter, the day the Lord rose. In Ordinary Time we follow Jesus' teaching and works week by week."
    : "A weekday in Ordinary Time. Green is the color of growth: holiness is lived in ordinary days, at work and at home.";
}
