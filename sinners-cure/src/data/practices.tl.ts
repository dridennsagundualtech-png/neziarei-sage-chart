/**
 * Tagalog versions of practices.ts: plan-of-life practices, "Living the faith" guides and
 * the night examination. Guide blocks replace the English blocks one for one; "verses"
 * refs and link targets must stay the same as in English.
 */
import type { GuideBlock, PracticeId } from "./practices";

export const PRACTICES_TL: Record<PracticeId, { title: string; when: string; detail: string }> = {
  offering: {
    title: "Pag-aalay sa umaga",
    when: "Paggising",
    detail:
      "Bumangon agad pagtunog ng alarm at ialay sa Diyos ang buong araw: trabaho, kagalakan at mga problema.",
  },
  prayer: {
    title: "Tahimik na pananalangin",
    when: "Umaga o gabi",
    detail:
      "Sampung tahimik na minuto ng pakikipag-usap sa Diyos sa sarili mong salita. Unti-unting gawing kalahating oras.",
  },
  mass: {
    title: "Banal na Misa",
    when: "Kapag kaya",
    detail:
      "Magsimba, pati sa karaniwang araw kung kaya. Kung hindi, gumawa ng pakikinabang sa espiritu.",
  },
  readings: {
    title: "Mga pagbasa ngayon",
    when: "Kahit kailan",
    detail: "Basahin ang mga pagbasa sa Misa ngayong araw.",
  },
  angelus: {
    title: "Orasyon sa tanghali",
    when: "Tanghali",
    detail:
      "Huminto ng isang minuto sa tanghali upang alalahanin ang Pagkakatawang-tao. Sa Panahon ng Pasko ng Pagkabuhay, ang Regina Caeli.",
  },
  rosary: {
    title: "Banal na Rosaryo",
    when: "Kahit kailan",
    detail: "Limang misteryo sa mga misteryo ngayon, o isang misteryo kung iyon lang ang oras mo.",
  },
  reading: {
    title: "Espirituwal na pagbasa",
    when: "Kahit kailan",
    detail: "Ilang minuto ng Ebanghelyo, at ilang pahina ng isang mabuting aklat espirituwal.",
  },
  visit: {
    title: "Pagdalaw sa Santisimo Sakramento",
    when: "Pagdaan sa simbahan",
    detail: "Dumaan sa simbahan, kahit isang minuto lang, upang batiin si Hesus sa tabernakulo.",
  },
  chaplet: {
    title: "Koronilya ng Banal na Awa",
    when: "Alas-tres ng hapon",
    detail: "Ang oras ng pagkamatay ni Kristo, ang oras ng awa.",
  },
  aspirations: {
    title: "Maiikling dasal",
    when: "Sa buong araw",
    detail:
      "Maliliit na dasal sa pagitan ng mga gawain: Hesus, nananalig ako sa Iyo. Panginoon ko at Diyos ko. Ina, tulungan mo ako.",
  },
  exam: {
    title: "Pagsusuri ng budhi",
    when: "Bago matulog",
    detail:
      "Tatlong minuto upang balikan ang araw kasama ang Diyos, humingi ng tawad, at gumawa ng pasya.",
  },
};

export const GUIDES_TL: Record<string, { title: string; summary: string; blocks: GuideBlock[] }> = {
  "plan-of-life": {
    title: "Plano ng buhay",
    summary: "Mga simpleng gawi ng pananalangin araw-araw, ayon sa turo ni San Josemaría",
    blocks: [
      {
        kind: "p",
        text: "Itinuro ni San Josemaría Escrivá, ang nagtatag ng Opus Dei, na sa karaniwang buhay tinatawag ang karamihan sa atin upang maging banal: sa ating trabaho, pamilya, pakikipagkaibigan, at mga gawaing-bahay na walang nakakakita. Doon tayo hinihintay ng Diyos.",
      },
      {
        kind: "p",
        text: "Upang manatiling malapit sa Diyos kahit abala ang araw, inirekomenda niya ang isang plano ng buhay: ilang nakatakdang sandali ng pananalangin sa buong araw, tulad ng mga haliging sumusuporta sa bahay. Hindi ito pagsusulit na papasa o babagsak ka. Ito ay mga tipanan kasama ang Isang nagmamahal sa iyo.",
      },
      { kind: "h", text: "Ang mga karaniwang gawain" },
      {
        kind: "list",
        items: [
          "Pag-aalay sa umaga, at agad na pagbangon pagtunog ng alarm",
          "Tahimik na pananalangin, mainam kung kalahating oras sa umaga at muli sa hapon o gabi",
          "Banal na Misa at Komunyon, araw-araw kung maaari",
          "Ang Orasyon sa tanghali",
          "Ang Rosaryo",
          "Espirituwal na pagbasa: ang Ebanghelyo at isang mabuting aklat",
          "Pagdalaw sa Santisimo Sakramento",
          "Maiikling dasal at gawa ng pag-ibig sa buong araw",
          "Pagsusuri ng budhi bago matulog",
          "Madalas na Kumpisal, para sa marami ay tuwing isa o dalawang linggo",
        ],
      },
      { kind: "h", text: "Magsimula sa maliit" },
      {
        kind: "p",
        text: "Huwag sabay-sabayin ang lahat. Pumili ng dalawa o tatlong gawaing kaya mong gawin araw-araw, at magdagdag kapag naging natural na ang mga ito. Mas mahalaga ang katapatan sa maliliit na bagay kaysa sa isang malaking plano na iiwan mo pagkalipas ng isang linggo.",
      },
      {
        kind: "quote",
        text: "Pabanalin mo ang iyong trabaho, pabanalin mo ang iyong sarili sa iyong trabaho, at pabanalin mo ang iba sa pamamagitan ng iyong trabaho.",
        cite: "San Josemaría Escrivá",
      },
      { kind: "h", text: "Ang magiting na minuto" },
      {
        kind: "p",
        text: "Tinawag niya ang sandali ng pagbangon na magiting na minuto: ang pagbangon agad pagtunog ng alarm, nang hindi nagpapatumpik-tumpik, bilang unang maliit na alay ng araw. May mga nagsasabi ng isang salita habang bumabangon: Serviam, ako ay maglilingkod.",
      },
      { kind: "h", text: "Kapag hindi ka makapagsimba" },
      {
        kind: "p",
        text: "Maaari kang gumawa ng pakikinabang sa espiritu: sabihin kay Hesus na sumasampalataya kang naroroon Siya sa Eukaristiya at hilingin na pumasok Siya sa iyong puso. Nasa tab ng Mga Dasal ang dasal ni San Alfonso de Liguori.",
      },
      {
        kind: "links",
        items: [
          { label: "Piliin ang iyong mga gawain", to: "/plan" },
          { label: "Pakikinabang sa Espiritu", to: "/prayers/spiritual-communion" },
        ],
      },
    ],
  },
  work: {
    title: "Kabanalan sa karaniwang trabaho",
    summary: "Gawing dasal ang trabaho at mga gawaing-bahay",
    blocks: [
      {
        kind: "p",
        text: "Halos tatlumpung taon si Hesus sa Nazaret na nagtatrabaho gamit ang Kanyang mga kamay bago Siya nangaral sa unang pagkakataon. Hindi nasayang ang mga taong iyon na lingid sa mata ng tao: ginawa nilang banal ang karaniwang trabaho.",
      },
      {
        kind: "quote",
        text: "Anuman ang inyong gawin, gawin ninyo nang buong puso, na parang para sa Panginoon at hindi para sa tao.",
        cite: "Colosas 3:23",
      },
      { kind: "h", text: "Sa pagsasagawa" },
      {
        kind: "list",
        items: [
          "Ialay ito. Bago ka magsimula, sabihin sa Diyos: para sa Iyo ito.",
          "Gawin ito nang mahusay. Tapusin ang sinimulan mo, at pag-ingatan ang mga huling detalye.",
          "Maglingkod. Isipin ang mga taong natutulungan ng iyong trabaho, at tulungan ang katabi mo.",
          "Isaisip ang Diyos. Isang maikling dasal sa pagsisimula ng gawain o sa pagpatak ng bawat oras.",
          "Ialay ang mahihirap na bahagi. Ang pagod, nakababagot na gawain at mahirap pakisamahang tao ay maaaring maging maliliit na sakripisyong kaisa ng kay Kristo.",
          "Magpahinga nang maayos. Ang Linggo ay para sa Diyos at sa iyong pamilya.",
        ],
      },
      { kind: "h", text: "Manalangin gamit ang Ebanghelyo" },
      {
        kind: "p",
        text: "Iminungkahi ni San Josemaría na magbasa ng maikling bahagi ng Ebanghelyo at ilagay ang sarili sa eksena bilang isa pang taong naroroon. Pagmasdan si Hesus, pakinggan Siya, at itanong: Panginoon, ano ang nais Mong gawin ko ngayon?",
      },
      { kind: "links", items: [{ label: "Ebanghelyo ngayon", to: "/mass" }] },
    ],
  },
  sin: {
    title: "Mabigat at magaang kasalanan",
    summary: "Ang itinuturo ng Simbahan, at kung paano bumalik",
    blocks: [
      {
        kind: "p",
        text: "Ang kasalanan ay pagkakasala laban sa Diyos at sugat sa ating sariling puso at sa iba (CCC 1849-1850). Pinagbubukod ng Simbahan ang mga kasalanan ayon sa bigat nito, hindi upang takutin tayo, kundi upang malaman natin kung paano bumalik.",
      },
      { kind: "h", text: "Mabigat na kasalanan (mortal)" },
      {
        kind: "p",
        text: "Inilalayo tayo ng mabigat na kasalanan sa Diyos at sinisira nito ang buhay ng grasya sa kaluluwa (CCC 1855). Upang maging mabigat ang isang kasalanan, dapat totoo ang lahat ng tatlong ito (CCC 1857):",
      },
      {
        kind: "list",
        ordered: true,
        items: [
          "Mabigat na bagay: ang gawa mismo ay lubhang mali, ayon sa Sampung Utos (CCC 1858).",
          "Buong kaalaman: alam mong lubhang mali ito (CCC 1859).",
          "Sinadyang pagsang-ayon: malaya mo itong pinili (CCC 1859).",
        ],
      },
      {
        kind: "p",
        text: "Kung kulang ang isa sa tatlo, hindi mabigat ang kasalanan. Ang kamangmangang hindi mo kasalanan, matinding takot, nakasanayan o sakit ay maaaring magpagaan ng pananagutan (CCC 1735, 1860). Ang Diyos lamang ang humuhusga sa puso, at matutulungan ka ng pari na maunawaan ang iyong kalagayan.",
      },
      { kind: "h", text: "Mga halimbawa ng mabigat na bagay" },
      {
        kind: "list",
        items: [
          "Sinadyang hindi pagsimba sa Linggo o pistang pangilin nang walang mabigat na dahilan (CCC 2181)",
          "Pagpatay, aborsyon at euthanasia (CCC 2268, 2271, 2277)",
          "Pakikiapid, pakikipagtalik sa labas ng kasal, at pornograpiya (CCC 2380, 2353, 2354)",
          "Malaking pagnanakaw o panloloko (CCC 2408-2409)",
          "Paglapastangan sa Diyos, at sakrilehiyo, lalo na laban sa Eukaristiya (CCC 2148, 2120)",
          "Pakikinabang ng Komunyon habang may alam na mabigat na kasalanan (CCC 1385)",
          "Pagsisinungaling sa ilalim ng panunumpa, at mga kasinungalingan o paninirang-puri na nagdudulot ng malaking pinsala (CCC 2152, 2484)",
          "Sinadyang pagnanais ng malaking kapahamakan sa iba dahil sa galit (CCC 2303)",
          "Pagtakwil sa pananampalataya: apostasya, erehiya o sisma (CCC 2089)",
        ],
      },
      { kind: "h", text: "Magaang kasalanan (venial)" },
      {
        kind: "p",
        text: "Hindi gaanong mabigat ang magaang kasalanan: hindi mabigat ang bagay, o mabigat ito ngunit walang buong kaalaman o buong pagsang-ayon (CCC 1862). Hindi tayo nito inihihiwalay sa Diyos, ngunit pinahihina nito ang pag-ibig, at kapag pinabayaan ay maaaring humantong sa mas malala (CCC 1863). Ang pagkainip, maliliit na kasinungalingan at pabayang pagdarasal ay mga karaniwang halimbawa.",
      },
      {
        kind: "p",
        text: "Pinatatawad ang magaang kasalanan sa pamamagitan ng taos na pagsisisi, pananalangin, mga gawa ng kawanggawa at ng Eukaristiya (CCC 1394, 1436). Mariin pa ring inirerekomenda ang pagkumpisal ng mga ito, dahil tinutulungan tayo nitong lumago (CCC 1458).",
      },
      { kind: "h", text: "Kung nakagawa ka ng mabigat na kasalanan" },
      {
        kind: "list",
        items: [
          "Huwag mawalan ng pag-asa. Walang kasalanang hindi patatawarin ng Diyos sa taong tunay na nagsisisi (CCC 982).",
          "Agad na magdasal ng pagsisisi, dahil sa pag-ibig sa Diyos.",
          "Mangumpisal sa lalong madaling panahon. Ikinukumpisal ang mabibigat na kasalanan ayon sa uri at bilang (CCC 1456).",
          "Huwag makinabang ng Komunyon bago mangumpisal. Kung may mabigat na dahilan upang makinabang at walang pagkakataong mangumpisal, gumawa ng ganap na pagsisisi at mangumpisal sa lalong madaling panahon (CCC 1457; can. 916).",
        ],
      },
      {
        kind: "quote",
        text: "Kung ipahahayag natin ang ating mga kasalanan, Siya ay tapat at makatarungan upang patawarin tayo sa ating mga kasalanan at linisin tayo sa lahat ng kasamaan.",
        cite: "1 Juan 1:9",
      },
      {
        kind: "note",
        text: "Kung lagi kang nag-aalala na lahat ng bagay ay mabigat na kasalanan, tinatawag itong scrupulosity. Sabihin ito sa pari. Magagabayan ka niya, at mapagkakatiwalaan mo ang kanyang gabay.",
      },
      {
        kind: "links",
        items: [
          { label: "Gabay sa Kumpisal", to: "/prayers/confession" },
          { label: "Pagsusuri ng budhi", to: "/prayers/examen" },
        ],
      },
    ],
  },
  precepts: {
    title: "Mga Utos ng Simbahan",
    summary: "Ang limang bagay na hinihiling sa bawat Katoliko",
    blocks: [
      {
        kind: "p",
        text: "Ang mga utos ng Simbahan ang pinakamababang hinihiling sa bawat Katoliko, upang patuloy na lumago ang pananalangin at ang buhay-moral (CCC 2041).",
      },
      {
        kind: "list",
        ordered: true,
        items: [
          "Magsimba tuwing Linggo at pistang pangilin, at magpahinga sa trabahong humahadlang sa pagsamba sa Diyos.",
          "Mangumpisal kahit minsan sa isang taon.",
          "Makinabang ng Banal na Komunyon kahit sa panahon ng Pasko ng Pagkabuhay.",
          "Tuparin ang mga araw ng pag-aayuno at pangingilin sa karne na itinakda ng Simbahan.",
          "Tumulong sa mga pangangailangan ng Simbahan, ayon sa kakayahan ng bawat isa.",
        ],
      },
      {
        kind: "p",
        text: "Nakalista ang mga ito sa CCC 2042-2043. Maaaring magdagdag ang mga kapulungan ng mga obispo para sa kanilang bansa.",
      },
      {
        kind: "links",
        items: [
          { label: "Pag-aayuno at pangingilin", to: "/learn/fasting" },
          { label: "Mga pistang pangilin", to: "/learn/holy-days" },
        ],
      },
    ],
  },
  fasting: {
    title: "Pag-aayuno at pangingilin",
    summary: "Sino ang nag-aayuno, kailan, at bakit",
    blocks: [
      { kind: "h", text: "Mga araw ng pag-aayuno" },
      { kind: "p", text: "Miyerkules ng Abo at Biyernes Santo." },
      {
        kind: "p",
        text: "Ang pag-aayuno ay isang buong kain, at hanggang dalawang maliit na kain na kapag pinagsama ay kulang sa isang buong kain, at walang kain sa pagitan. Saklaw nito ang mga Katoliko mula edad 18 hanggang sa pagsisimula ng kanilang ika-60 taon (can. 1251-1252).",
      },
      { kind: "h", text: "Mga araw ng pangingilin sa karne" },
      {
        kind: "p",
        text: "Miyerkules ng Abo, Biyernes Santo, at bawat Biyernes, lalo na ang mga Biyernes ng Kuwaresma.",
      },
      {
        kind: "p",
        text: "Ang pangingilin ay hindi pagkain ng karne, mula edad 14 (can. 1252). Sa mga Biyernes sa labas ng Kuwaresma, pinahihintulutan ng maraming kapulungan ng mga obispo na palitan ito ng ibang penitensya o gawa ng kawanggawa, kaya alamin kung ano ang hinihiling ng inyong mga obispo. Ang Biyernes na isang dakilang kapistahan ay hindi araw ng penitensya (can. 1251).",
      },
      { kind: "h", text: "Bago mag-Komunyon" },
      {
        kind: "p",
        text: "Huwag kumain o uminom ng anuman maliban sa tubig at gamot isang oras bago makinabang ng Banal na Komunyon (can. 919). Hindi saklaw nito ang matatanda at maysakit.",
      },
      { kind: "h", text: "Bakit nag-aayuno" },
      {
        kind: "p",
        text: "Pinalalaya tayo ng pag-aayuno nang kaunti mula sa ating sarili upang magkaroon tayo ng mas maraming puwang para sa Diyos at sa kapwa. Isinasama ito ng Simbahan sa pananalangin at paglilimos (CCC 1434, 1438). Hindi saklaw ng pag-aayuno ang maysakit, mga buntis o nagpapasusong ina, at mga gumagawa ng mabigat na trabaho.",
      },
    ],
  },
  sacraments: {
    title: "Ang pitong sakramento",
    summary: "Ang sariling paraan ni Kristo ng pagbibigay sa atin ng Kanyang buhay",
    blocks: [
      {
        kind: "list",
        items: [
          "Binyag: pinalalaya tayo sa kasalanan at ginagawang mga anak ng Diyos at kasapi ng Simbahan (CCC 1213).",
          "Kumpil: tinatatakan tayo ng Espiritu Santo at pinalalakas upang magpatotoo kay Kristo (CCC 1285).",
          "Eukaristiya: ang mismong Katawan at Dugo ni Kristo, ang bukal at rurok ng buhay Kristiyano (CCC 1324).",
          "Pagbabalik-loob o Kumpisal: pinatatawad ang ating mga kasalanan at ipinakikipagkasundo tayo sa Diyos at sa Simbahan (CCC 1422).",
          "Pagpapahid ng Langis sa Maysakit: nagbibigay ng lakas, kapayapaan at tapang sa malubhang maysakit at matatanda (CCC 1520).",
          "Banal na Orden: itinatalaga ang mga obispo, pari at diyakono upang maglingkod sa Simbahan sa ngalan ni Kristo (CCC 1536).",
          "Kasal: ang panghabambuhay na tipan ng isang lalaki at isang babae, tanda ng pag-ibig ni Kristo sa Simbahan (CCC 1601).",
        ],
      },
      {
        kind: "p",
        text: "Ang Binyag, Kumpil at Eukaristiya ay mga sakramento ng pagpapasimula; ang Kumpisal at Pagpapahid ng Langis ay mga sakramento ng pagpapagaling; ang Banal na Orden at Kasal ay para sa paglilingkod sa pakikipag-isa (CCC 1211-1212).",
      },
    ],
  },
  "holy-days": {
    title: "Mga pistang pangilin",
    summary: "Ang mga araw bukod sa Linggo na nagsisimba ang mga Katoliko",
    blocks: [
      {
        kind: "p",
        text: "Ang bawat Linggo ay araw ng pangilin: ito ang araw ng Muling Pagkabuhay (CCC 2177, 2180).",
      },
      {
        kind: "p",
        text: "Idinadagdag ng pangkalahatang batas ng Simbahan ang mga araw na ito (can. 1246):",
      },
      {
        kind: "list",
        items: [
          "Pasko ng Pagsilang, Disyembre 25",
          "Santa Maria, Ina ng Diyos, Enero 1",
          "Ang Epipanya (Tatlong Hari)",
          "Ang Pag-akyat sa Langit",
          "Corpus Christi",
          "San Jose, Marso 19",
          "San Pedro at San Pablo, Hunyo 29",
          "Ang Pag-akyat kay Maria sa Langit, Agosto 15",
          "Todos los Santos, Nobyembre 1",
          "Ang Kalinis-linisang Paglilihi, Disyembre 8",
        ],
      },
      {
        kind: "p",
        text: "Maaaring ilipat ng bawat kapulungan ng mga obispo ang ilan sa mga ito sa Linggo o alisin ang obligasyon. Sa Pilipinas, ang mga ito ay Enero 1, Disyembre 8 at Disyembre 25. Sa Estados Unidos, Enero 1, ang Pag-akyat sa Langit kung ito ay sa Huwebes, Agosto 15, Nobyembre 1, Disyembre 8 at Disyembre 25. Masasabi sa iyo ng iyong parokya nang tiyak.",
      },
    ],
  },
  everyday: {
    title: "Mga gawaing Katoliko araw-araw",
    summary: "Maliliit na gawi na nagpapanatili ng pananampalataya sa araw, at ang mga gawa ng awa",
    blocks: [
      {
        kind: "list",
        items: [
          "Ang Tanda ng Krus pagkagising, bago kumain, bago bumiyahe, at pagdaan sa simbahan.",
          "Agua bendita pagpasok sa simbahan, at sa bahay, bilang paalala ng iyong binyag.",
          "Dasal bago at pagkatapos kumain.",
          "Ang Orasyon sa tanghali, o ang Regina Caeli sa Panahon ng Pasko ng Pagkabuhay.",
          "Dasal sa gabi, o ang Panalangin sa Umaga at Gabi mula sa Liturhiya ng mga Oras.",
          "Oras ng Pagsamba sa Santisimo Sakramento.",
          "Isang maliit na altar sa bahay: krusipiho, larawan ni Maria, kandila, at Bibliya.",
          "Mga sakramental tulad ng rosaryo, medalya at eskapularyo, na ginagamit nang may pananampalataya (CCC 1667-1670).",
          "Pagbabasbas ng mga magulang sa kanilang mga anak gamit ang Tanda ng Krus.",
          "Pagdarasal para sa mga yumao at pagdalaw sa kanilang puntod, lalo na tuwing Nobyembre.",
          "Ang mga Biyernes bilang maliliit na araw ng penitensya, bilang pag-alala sa Biyernes Santo.",
        ],
      },
      { kind: "h", text: "Mga gawa ng awa sa katawan" },
      {
        kind: "list",
        items: [
          "Pakainin ang nagugutom",
          "Painumin ang nauuhaw",
          "Damitan ang hubad",
          "Patuluyin ang walang tahanan",
          "Dalawin ang maysakit",
          "Dalawin ang nakabilanggo",
          "Ilibing ang patay",
        ],
      },
      { kind: "h", text: "Mga gawa ng awa sa kaluluwa" },
      {
        kind: "list",
        items: [
          "Turuan ang walang alam",
          "Payuhan ang nag-aalinlangan",
          "Pagsabihan ang nagkakasala",
          "Tiisin nang may pasensya ang mga pagkakamali ng iba",
          "Patawarin nang maluwag sa loob ang mga nakasakit",
          "Aliwin ang nagdadalamhati",
          "Ipanalangin ang mga buhay at mga patay",
        ],
      },
      {
        kind: "p",
        text: "Ang mga gawa ng awa ay mga gawa ng kawanggawa na tumutulong sa ating kapwa sa katawan at kaluluwa (CCC 2447).",
      },
    ],
  },
  verses: {
    title: "Kasulatan para sa araw-araw",
    summary: "Mga talatang madadala sa trabaho, pamilya at pahinga",
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
  prayer: {
    title: "Paano manalangin",
    summary: "Isang simpleng paraan upang magsimula ng tahimik na pananalangin",
    blocks: [
      {
        kind: "quote",
        text: "Sa aking palagay, ang mapagnilay na pananalangin ay walang iba kundi isang malapit na pagbabahaginan ng magkaibigan; ito ay ang madalas na paglalaan ng oras upang mapag-isa kasama Niya na alam nating nagmamahal sa atin.",
        cite: "Santa Teresa ni Hesus, binanggit sa CCC 2709",
      },
      {
        kind: "list",
        ordered: true,
        items: [
          "Humanap ng tahimik na lugar at nakatakdang oras. Magandang simula ang sampung minuto.",
          "Ilagay ang sarili sa presensya ng Diyos. Maaari mong gamitin ang dasal Bago Magdasal nang Tahimik.",
          "Basahin nang dahan-dahan ang ilang linya ng Ebanghelyo o ng isang aklat espirituwal.",
          "Kausapin si Hesus tungkol dito at tungkol sa iyong buhay: magpasalamat, humiling, humingi ng tawad, at makinig.",
          "Magtapos sa isang maliit at tiyak na pasya para sa araw na ito.",
          "Magpasalamat sa Kanya, at tapusin sa isang maikling dasal kay Maria.",
        ],
      },
      {
        kind: "p",
        text: "Darating ang mga paglilibang ng isip. Dahan-dahang bumalik. Ang pananatiling tapat kahit tuyo ang pananalangin ay isa nang regalo sa Diyos (CCC 2729-2731).",
      },
      {
        kind: "links",
        items: [
          { label: "Bago Magdasal nang Tahimik", to: "/prayers/before-prayer" },
          { label: "Ebanghelyo ngayon", to: "/mass" },
        ],
      },
    ],
  },
};

export const NIGHT_EXAM_TL: string[] = [
  "Inialay ko ba ang aking araw sa Diyos pagkagising ko?",
  "Tinupad ko ba ang aking oras ng pananalangin, o isinantabi ko ito?",
  "Nagtrabaho ba ako nang mahusay at tinapos ang aking sinimulan?",
  "Paano ko pinakitunguhan ang mga tao sa bahay at sa trabaho? Naging matiyaga, mabait at makatarungan ba ako?",
  "May sinabi ba akong masama tungkol sa iba, o nagsinungaling ako?",
  "Binantayan ko ba ang aking mga mata, isip at salita?",
  "Nagpadala ba ako sa katamaran, katakawan o pag-aaksaya ng oras?",
  "Saan ko nakita ang kamay ng Diyos ngayon, at nagpasalamat ba ako sa Kanya?",
];
