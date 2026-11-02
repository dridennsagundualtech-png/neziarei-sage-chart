/**
 * Tagalog prayer texts, using the traditional wording said in Philippine parishes where
 * one exists. Keys match `P` and prayer ids in prayers.ts. Keep "V."/"R." line prefixes
 * (they render as ℣/℟) and "\n" / "\n\n" breaks as in the English file.
 */
import type { P as PEn } from "./prayers";

export const P_TL: Record<keyof typeof PEn, string> = {
  beforeRosary:
    "Reyna ng Kabanal-banalang Rosaryo, dumalaw ka sa Fatima upang ipakita sa tatlong batang pastol ang mga kayamanan ng grasyang nakatago sa Rosaryo. Pukawin mo sa aking puso ang tapat na pag-ibig sa debosyong ito, upang sa pagninilay sa mga Misteryo ng aming Pagkatubos na inaalala rito, ay makamtan ko ang kapayapaan ng mundo, ang pagbabalik-loob ng mga makasalanan, at ang biyayang hinihiling ko sa iyo sa Rosaryong ito (banggitin ang iyong kahilingan). Hinihiling ko ito sa lalong ikaluluwalhati ng Diyos, sa iyong karangalan, at sa ikabubuti ng mga kaluluwa, lalo na ng aking sarili. Amen.",
  signOfCross: "Sa ngalan ng Ama, at ng Anak, at ng Espiritu Santo. Amen.",
  creed:
    "Sumasampalataya ako sa Diyos Amang makapangyarihan sa lahat, na may gawa ng langit at lupa. Sumasampalataya ako kay Hesukristo, iisang Anak ng Diyos, Panginoon nating lahat. Nagkatawang-tao Siya lalang ng Espiritu Santo, ipinanganak ni Santa Mariang Birhen. Pinagpakasakit ni Poncio Pilato, ipinako sa krus, namatay, inilibing. Nanaog sa kinaroroonan ng mga yumao. Nang may ikatlong araw nabuhay na mag-uli. Umakyat sa langit. Naluluklok sa kanan ng Diyos Amang makapangyarihan sa lahat. Doon magmumulang paririto at huhukom sa nangabubuhay at nangamatay na tao.\n\nSumasampalataya naman ako sa Diyos Espiritu Santo, sa banal na Simbahang Katolika, sa kasamahan ng mga banal, sa kapatawaran ng mga kasalanan, sa pagkabuhay na mag-uli ng nangamatay na tao, at sa buhay na walang hanggan. Amen.",
  ourFather:
    "Ama namin, sumasalangit Ka. Sambahin ang ngalan Mo. Mapasaamin ang kaharian Mo. Sundin ang loob Mo, dito sa lupa para nang sa langit.\n\nBigyan Mo kami ngayon ng aming kakanin sa araw-araw. At patawarin Mo kami sa aming mga sala, para nang pagpapatawad namin sa nagkakasala sa amin. At huwag Mo kaming ipahintulot sa tukso, at iadya Mo kami sa lahat ng masama. Amen.",
  hailMary:
    "Aba Ginoong Maria, napupuno ka ng grasya, ang Panginoong Diyos ay sumasaiyo. Bukod kang pinagpala sa babaeng lahat, at pinagpala naman ang iyong anak na si Hesus.\n\nSanta Maria, Ina ng Diyos, ipanalangin mo kaming makasalanan, ngayon at kung kami ay mamamatay. Amen.",
  gloryBe:
    "Luwalhati sa Ama, at sa Anak, at sa Espiritu Santo. Kapara noong una, ngayon at magpakailanman, at magpasawalang hanggan. Amen.",
  fatima:
    "O Hesus ko, patawarin Mo ang aming mga kasalanan, iligtas Mo kami sa apoy ng impiyerno, at akayin Mo sa langit ang lahat ng kaluluwa, lalung-lalo na yaong mga lubhang nangangailangan ng Iyong awa.",
  hailHolyQueen:
    "Aba po, Santa Mariang Hari, Ina ng awa, ikaw ang kabuhayan at katamisan; aba pinananaligan ka namin. Ikaw nga ang tinatawagan namin, pinapanaw na taong anak ni Eva. Ikaw rin ang pinagbubuntunghiningahan namin sa aming pagtangis dini sa lupang bayang kahapis-hapis. Ay aba, pintakasi ka namin; ilingon mo sa amin ang mga mata mong maawain. At saka kung matapos yaring pagpanaw sa lupa, ipakita mo sa amin ang iyong anak na si Hesus. Santa Maria, Ina ng Diyos, maawain, maalam at matamis na Birhen.\n\nV. Ipanalangin mo kami, O Santang Ina ng Diyos.\nR. Nang kami'y maging dapat makinabang sa mga pangako ni Hesukristong Panginoon namin.",
  rosaryClosing:
    "Manalangin tayo. O Diyos, na ang bugtong na Anak, sa pamamagitan ng Kanyang buhay, kamatayan at muling pagkabuhay, ay nagkamit para sa amin ng gantimpala ng buhay na walang hanggan; ipagkaloob Mo, hinihiling namin, na sa pagninilay sa mga misteryong ito ng Kabanal-banalang Rosaryo ng Mahal na Birheng Maria, ay matularan namin ang nilalaman nito at makamtan ang ipinangangako nito, sa pamamagitan din ni Kristong aming Panginoon. Amen.",
  memorare:
    "Alalahanin mo, O lubhang maawaing Birheng Maria, na kailanma'y hindi narinig na pinabayaan mo ang sinumang dumulog sa iyong pagkalinga, humingi ng iyong saklolo, o nagsumamo ng iyong pamamagitan.\n\nSa pananalig na ito, lumalapit ako sa iyo, O Birhen ng mga birhen, aking Ina. Sa iyo ako dumudulog, sa harap mo ako nakatayo, makasalanan at nagsisisi.\n\nO Ina ng Salitang nagkatawang-tao, huwag mong ipagwalang-bahala ang aking mga dalangin, kundi sa iyong awa ay pakinggan mo at tugunin ako. Amen.",
  stMichael:
    "San Miguel Arkanghel, ipagtanggol mo kami sa labanan. Maging tanggulan ka namin laban sa kasamaan at mga patibong ng demonyo. Nawa'y sawayin siya ng Diyos, mapagpakumbaba naming idinadalangin; at ikaw, O Prinsipe ng mga hukbo ng langit, sa kapangyarihan ng Diyos, itapon mo sa impiyerno si Satanas at ang lahat ng masasamang espiritu na gumagala sa sanlibutan upang ipahamak ang mga kaluluwa. Amen.",
  litany:
    "Panginoon, maawa ka sa amin. Kristo, maawa ka sa amin. Panginoon, maawa ka sa amin.\nKristo, pakinggan mo kami. Kristo, pakapakinggan mo kami.\n\nDiyos Ama sa langit, maawa ka sa amin.\nDiyos Anak, na tumubos sa sanlibutan, maawa ka sa amin.\nDiyos Espiritu Santo, maawa ka sa amin.\nSantisima Trinidad, iisang Diyos, maawa ka sa amin.\n\nSanta Maria, ipanalangin mo kami.\nSantang Ina ng Diyos,\nSantang Birhen ng mga birhen,\nIna ni Kristo,\nIna ng Simbahan,\nIna ng Awa,\nIna ng grasya ng Diyos,\nIna ng Pag-asa,\nInang kalinis-linisan,\nInang kasakdal-sakdalan,\nInang walang bahid,\nInang walang dungis,\nInang kaibig-ibig,\nInang kahanga-hanga,\nIna ng mabuting payo,\nIna ng Lumikha,\nIna ng Mananakop,\nBirheng kapaham-pahaman,\nBirheng dapat igalang,\nBirheng dapat ipagbantog,\nBirheng makapangyarihan,\nBirheng maawain,\nBirheng matibay ang loob sa magaling,\nSalamin ng katarungan,\nLuklukan ng karunungan,\nSimula ng tuwa namin,\nSisidlan ng kabanalan,\nSisidlan ng bunyi,\nSisidlan ng mataos na pamimintuho,\nRosang bulaklak na di mapuspos ng bait ng tao,\nTore ni David,\nToreng garing,\nBahay na ginto,\nKaban ng tipan,\nPinto ng langit,\nTalang maliwanag,\nMapagpagaling sa mga maysakit,\nTakbuhan ng mga makasalanan,\nKaaliwan ng mga migrante,\nMapang-aliw sa mga nagdadalamhati,\nMapag-ampon sa mga Kristiyano,\nReyna ng mga Anghel,\nReyna ng mga Patriyarka,\nReyna ng mga Propeta,\nReyna ng mga Apostol,\nReyna ng mga Martir,\nReyna ng mga Kumpesor,\nReyna ng mga Birhen,\nReyna ng lahat ng mga Santo,\nReynang ipinaglihi na walang kasalanang orihinal,\nReynang iniakyat sa langit,\nReyna ng kasantu-santusang Rosaryo,\nReyna ng mga mag-anak,\nReyna ng kapayapaan, ipanalangin mo kami.\n\nKordero ng Diyos, na nag-aalis ng mga kasalanan ng sanlibutan, patawarin mo kami, Panginoon.\nKordero ng Diyos, na nag-aalis ng mga kasalanan ng sanlibutan, pakapakinggan mo kami, Panginoon.\nKordero ng Diyos, na nag-aalis ng mga kasalanan ng sanlibutan, maawa ka sa amin.\n\nV. Ipanalangin mo kami, O Santang Ina ng Diyos.\nR. Nang kami'y maging dapat makinabang sa mga pangako ni Hesukristong Panginoon namin.\n\nManalangin tayo. Ipagkaloob mo, hinihiling namin, Panginoong Diyos, na kaming iyong mga lingkod ay magtamasa ng walang patid na kalusugan ng isip at katawan; at sa maluwalhating pamamagitan ng Mahal na Birheng Maria, ay maligtas kami sa kasalukuyang kalungkutan at makamtan ang walang hanggang kagalakan. Sa pamamagitan ni Kristong aming Panginoon. Amen.",
  chapletOpening:
    "Namatay Ka, Hesus, ngunit bumukal ang batis ng buhay para sa mga kaluluwa, at nabuksan ang karagatan ng awa para sa buong mundo. O Bukal ng Buhay, di-masukat na Banal na Awa, yakapin Mo ang buong mundo at ibuhos Mo ang Iyong sarili sa amin.\n\nO Dugo at Tubig na bumukal mula sa Puso ni Hesus bilang bukal ng awa para sa amin, nananalig ako sa Iyo! (tatlong beses)",
  eternalFather:
    "Amang Walang Hanggan, iniaalay ko sa Iyo ang Katawan at Dugo, Kaluluwa at pagka-Diyos ng Iyong pinakamamahal na Anak, ang aming Panginoong Hesukristo, bilang pagbabayad-puri sa aming mga kasalanan at sa mga kasalanan ng buong mundo.",
  forTheSake:
    "Alang-alang sa Kanyang mapait na pagpapakasakit, kaawaan Mo kami at ang buong mundo.",
  holyGod:
    "Banal na Diyos, Banal na Makapangyarihan, Banal na Walang Kamatayan, kaawaan Mo kami at ang buong mundo.\n\n(Dasalin nang tatlong beses.)",
  chapletClosing:
    "Walang Hanggang Diyos, na ang awa ay walang katapusan at ang kayamanan ng habag ay di-mauubos, tunghayan Mo kami nang may kagandahang-loob at palaguin Mo ang Iyong awa sa amin, upang sa mahihirap na sandali ay hindi kami mawalan ng pag-asa o masiraan ng loob, kundi buong pagtitiwala kaming sumunod sa Iyong banal na kalooban, na siyang Pag-ibig at Awa mismo. Amen.\n\nHesus, nananalig ako sa Iyo.",
  actOfContrition:
    "Diyos ko, ikinalulungkot ko nang buong puso ang pagkakasala ko sa Iyo, at kinasusuklaman ko ang lahat ng aking kasalanan dahil sa Iyong makatarungang parusa, ngunit higit sa lahat dahil nasaktan Kita, Diyos ko, na lubos na mabuti at karapat-dapat sa buong pag-ibig ko. Matibay kong ipinapasya, sa tulong ng Iyong grasya, na hindi na magkakasala at iiwasan ang anumang magtutulak sa akin sa kasalanan. Amen.",
};

const ANGEL_OF_GOD =
  "Anghel ng Diyos, na aking tagatanod, na sa akin ay ipinagkatiwala ng pag-ibig ng Diyos, sa araw na ito ay samahan mo ako upang liwanagan, bantayan, pamahalaan at patnubayan. Amen.";

/** Tagalog titles and texts by prayer id. Text is omitted where it comes from P_TL. */
export const PRAYERS_TL: Record<string, { title: string; text?: string }> = {
  "our-father": { title: "Ama Namin" },
  "hail-mary": { title: "Aba Ginoong Maria" },
  "glory-be": { title: "Luwalhati" },
  "apostles-creed": { title: "Sumasampalataya" },
  angelus: {
    title: "Orasyon (Angelus)",
    text: "V. Binati ng Anghel ng Panginoon si Santa Maria,\nR. At siya'y naglihi lalang ng Espiritu Santo.\n\nAba Ginoong Maria…\n\nV. Narito ang alipin ng Panginoon.\nR. Maganap nawa sa akin ayon sa wika mo.\n\nAba Ginoong Maria…\n\nV. At ang Verbo ay nagkatawang-tao,\nR. At nakipamayan sa amin.\n\nAba Ginoong Maria…\n\nV. Ipanalangin mo kami, O Santang Ina ng Diyos,\nR. Nang kami'y maging dapat makinabang sa mga pangako ni Hesukristong Panginoon namin.\n\nManalangin tayo. Panginoon, hinihiling namin na ibuhos Mo ang Iyong grasya sa aming mga puso; upang kaming nakakilala sa pagkakatawang-tao ni Kristo na Iyong Anak sa pamamagitan ng balita ng anghel, sa pamamagitan ng Kanyang pagpapakasakit at krus ay papakinabangin Mo sa kaluwalhatian ng Kanyang muling pagkabuhay. Sa pamamagitan din ni Kristong aming Panginoon. Amen.",
  },
  memorare: { title: "Alalahanin Mo (Memorare)" },
  "hail-holy-queen": { title: "Aba Po, Santa Mariang Hari" },
  "litany-loreto": { title: "Litanya ng Mahal na Birhen" },
  "act-of-contrition": { title: "Pagsisisi" },
  morning: {
    title: "Pag-aalay sa Umaga",
    text:
      "O Hesus, sa pamamagitan ng Kalinis-linisang Puso ni Maria, iniaalay ko sa Iyo ang aking mga dasal, gawain, kagalakan at pagdurusa sa araw na ito, para sa lahat ng intensyon ng Iyong Kamahal-mahalang Puso, kaisa ng Banal na Sakripisyo ng Misa sa buong mundo, bilang pagbabayad-puri sa aking mga kasalanan, para sa mga intensyon ng lahat ng aking kamag-anak at kaibigan, at lalo na para sa mga intensyon ng Santo Papa. Amen.\n\n" +
      ANGEL_OF_GOD,
  },
  night: {
    title: "Dasal sa Gabi",
    text: "Diyos ko, sa pagtatapos ng araw na ito, buong puso akong nagpapasalamat sa Iyo sa lahat ng grasyang tinanggap ko mula sa Iyo. Ikinalulungkot kong hindi ko ito nagamit nang mas mabuti. Ikinalulungkot ko ang lahat ng kasalanang nagawa ko laban sa Iyo. Patawarin Mo ako, Diyos ko, at ingatan Mo ako ngayong gabi.\n\nMahal na Birheng Maria, aking mahal na Ina sa langit, kupkupin mo ako. San Jose, aking mahal na anghel na tagatanod, at kayong lahat na mga banal ng Diyos, ipanalangin ninyo ako.\n\nSa Iyong mga kamay, Panginoon, ipinagtatagubilin ko ang aking espiritu. Panginoong Hesus, tanggapin Mo ang aking kaluluwa. Amen.",
  },
  "grace-before": {
    title: "Dasal Bago Kumain",
    text: "Basbasan Mo kami, Panginoon, at ang mga biyaya Mong ito na aming tatanggapin mula sa Iyong kagandahang-loob, sa pamamagitan ni Kristong aming Panginoon. Amen.",
  },
  "grace-after": {
    title: "Dasal Pagkatapos Kumain",
    text: "Nagpapasalamat kami sa Iyo, Diyos na makapangyarihan sa lahat, sa lahat ng Iyong mga biyaya, Ikaw na nabubuhay at naghahari magpasawalang hanggan. Amen.\n\nNawa'y ang mga kaluluwa ng mga yumaong binyagan, sa awa ng Diyos, ay magpahinga sa kapayapaan. Amen.",
  },
  "regina-caeli": {
    title: "Reyna ng Langit (Regina Caeli)",
    text: "(Dinadasal kapalit ng Orasyon sa Panahon ng Pasko ng Pagkabuhay.)\n\nReyna ng Langit, magalak ka, aleluya.\nSapagkat ang iyong ipinaglihi, aleluya,\nay nabuhay na mag-uli, gaya ng Kanyang sinabi, aleluya.\nIpanalangin mo kami sa Diyos, aleluya.\n\nV. Magsaya ka at magalak, O Birheng Maria, aleluya.\nR. Sapagkat tunay na nabuhay na mag-uli ang Panginoon, aleluya.\n\nManalangin tayo. O Diyos, na nagbigay ng kagalakan sa sanlibutan sa pamamagitan ng muling pagkabuhay ng Iyong Anak, ang aming Panginoong Hesukristo, ipagkaloob Mo, hinihiling namin, na sa pamamagitan ng Birheng Maria, na Kanyang Ina, ay makamtan namin ang mga kagalakan ng buhay na walang hanggan. Sa pamamagitan din ni Kristong aming Panginoon. Amen.",
  },
  "spiritual-communion": {
    title: "Pakikinabang sa Espiritu",
    text: "(Kapag hindi ka makatanggap ng Banal na Komunyon. Dasal ni San Alfonso de Liguori.)\n\nHesus ko, sumasampalataya ako na Ikaw ay naririto sa Kabanal-banalang Sakramento. Iniibig Kita nang higit sa lahat, at ninanais kong tanggapin Ka sa aking kaluluwa. Yamang hindi Kita matatanggap ngayon sa Sakramento, pumasok Ka man lamang sa aking puso sa espiritu. Niyayakap Kita na para bang naririto Ka na, at buong-buo akong nakikiisa sa Iyo. Huwag Mong ipahintulot na ako'y mahiwalay sa Iyo kailanman. Amen.",
  },
  "anima-christi": {
    title: "Kaluluwa ni Kristo (Anima Christi)",
    text: "Kaluluwa ni Kristo, pakabanalin Mo ako.\nKatawan ni Kristo, iligtas Mo ako.\nDugo ni Kristo, pag-alabin Mo ako.\nTubig mula sa tagiliran ni Kristo, hugasan Mo ako.\nPagpapakasakit ni Kristo, palakasin Mo ako.\nO mabuting Hesus, dinggin Mo ako.\nSa loob ng Iyong mga sugat, itago Mo ako.\nHuwag Mong ipahintulot na ako'y mahiwalay sa Iyo.\nSa masamang kaaway, ipagtanggol Mo ako.\nSa oras ng aking kamatayan, tawagin Mo ako\nat papariyanin Mo ako sa Iyo,\nupang kasama ng Iyong mga banal ay papurihan Kita\nmagpakailanman. Amen.",
  },
  "before-prayer": {
    title: "Bago Magdasal nang Tahimik",
    text: "Panginoon ko at Diyos ko, matibay akong sumasampalataya na Ikaw ay naririto, na nakikita Mo ako, na naririnig Mo ako. Sinasamba Kita nang buong paggalang; humihingi ako ng tawad sa aking mga kasalanan, at ng grasya na maging mabunga ang panahong ito ng pananalangin.\n\nAking Inang Kalinis-linisan, San Jose na aking ama at panginoon, aking anghel na tagatanod, ipamagitan ninyo ako.",
  },
  "come-holy-spirit": {
    title: "Halina, Espiritu Santo",
    text: "Halina, Espiritu Santo, puspusin Mo ang puso ng Iyong mga anak, at pag-alabin Mo sa kanila ang apoy ng Iyong pag-ibig.\n\nV. Suguin Mo ang Iyong Espiritu at sila'y lalalangin.\nR. At Iyong babaguhin ang mukha ng sangkalupaan.\n\nManalangin tayo. O Diyos, na nagturo sa mga puso ng Iyong mga anak sa pamamagitan ng liwanag ng Espiritu Santo, ipagkaloob Mo na sa tulong din ng Espiritu Santo ay maging tunay kaming marunong at lagi naming matamasa ang Kanyang mga pag-aliw. Sa pamamagitan ni Kristong aming Panginoon. Amen.",
  },
  acts: {
    title: "Pananampalataya, Pag-asa at Pag-ibig",
    text: "Diyos ko, matibay kong sinasampalatayanan na Ikaw ay iisang Diyos sa tatlong Persona, Ama, Anak at Espiritu Santo. Sinasampalatayanan ko na ang Iyong Anak ay nagkatawang-tao at namatay dahil sa aming mga kasalanan, at Siya ay darating upang hukuman ang mga buhay at mga patay. Sinasampalatayanan ko ang mga ito at ang lahat ng katotohanang itinuturo ng banal na Simbahang Katolika, sapagkat Ikaw ang nagpahayag ng mga ito, Ikaw na hindi makapandaraya ni madadaya. Amen.\n\nDiyos ko, sa pag-asa sa Iyong walang hanggang kabutihan at mga pangako, umaasa akong makamtan ang kapatawaran ng aking mga kasalanan, ang tulong ng Iyong grasya, at ang buhay na walang hanggan, alang-alang sa mga merito ni Hesukristo, aking Panginoon at Manunubos. Amen.\n\nDiyos ko, iniibig Kita nang higit sa lahat, nang buong puso at kaluluwa, sapagkat Ikaw ay lubos na mabuti at karapat-dapat sa lahat ng pag-ibig. Iniibig ko ang aking kapwa gaya ng aking sarili alang-alang sa pag-ibig sa Iyo. Pinatatawad ko ang lahat ng nakasakit sa akin, at humihingi ako ng tawad sa lahat ng aking nasaktan. Amen.",
  },
  "guardian-angel": { title: "Anghel ng Diyos", text: ANGEL_OF_GOD },
  "eternal-rest": {
    title: "Kapahingahang Walang Hanggan",
    text: "Pagkalooban Mo sila, Panginoon, ng kapahingahang walang hanggan, at liwanagan nawa sila ng walang katapusang liwanag. Mapahinga nawa sila sa kapayapaan. Amen.\n\nNawa'y ang kanilang mga kaluluwa at ang mga kaluluwa ng lahat ng mga yumaong binyagan, sa awa ng Diyos, ay magpahinga sa kapayapaan. Amen.",
  },
  "st-michael": { title: "Dasal kay San Miguel" },
};
