/** Tagalog names, days, titles, fruits and meditations for the Rosary mysteries (same order as rosary.ts). */
import type { MysterySetId } from "./rosary";

type M = { title: string; fruit: string; meditation: string };

export const MYSTERY_SETS_TL: Record<MysterySetId, { name: string; days: string; mysteries: M[] }> =
  {
    joyful: {
      name: "Mga Misteryo ng Tuwa",
      days: "Lunes at Sabado",
      mysteries: [
        {
          title: "Ang Pagbati ng Anghel kay Maria",
          fruit: "Kababaang-loob",
          meditation:
            "Binati ng anghel Gabriel si Maria, at malaya at mapagpakumbaba siyang nagsabi ng oo sa Diyos. Nawa'y masabi ko rin ang oo sa kalooban ng Diyos sa maliliit na bagay ngayong araw.",
        },
        {
          title: "Ang Pagdalaw ni Maria kay Santa Isabel",
          fruit: "Pag-ibig sa kapwa",
          meditation:
            "Nagmadali si Maria upang paglingkuran ang pinsan niyang si Isabel, dala-dala si Kristo sa kanyang sinapupunan. Nawa'y madala ko si Kristo sa mga nangangailangan ng tulong ngayon.",
        },
        {
          title: "Ang Pagsilang kay Hesus",
          fruit: "Kapayakan ng loob",
          meditation:
            "Isinilang ang Anak ng Diyos sa isang dukhang kuwadra at inihiga sa sabsaban. Nawa'y sa Kanya lamang ko matagpuan ang tunay kong kayamanan.",
        },
        {
          title: "Ang Paghahain kay Hesus sa Templo",
          fruit: "Pagsunod",
          meditation:
            "Inihandog nina Maria at Jose ang Sanggol sa Ama, ayon sa utos ng Batas. Nakilala nina Simeon at Ana ang liwanag ng mga bansa.",
        },
        {
          title: "Ang Pagkatagpo kay Hesus sa Templo",
          fruit: "Kagalakan sa pagkatagpo kay Hesus",
          meditation:
            "Matapos ang tatlong araw na pighati, natagpuan nina Maria at Jose si Hesus sa bahay ng Kanyang Ama. Kapag nawala Siya sa akin dahil sa kasalanan, nawa'y hanapin ko Siyang muli.",
        },
      ],
    },
    sorrowful: {
      name: "Mga Misteryo ng Hapis",
      days: "Martes at Biyernes",
      mysteries: [
        {
          title: "Ang Paghihirap ni Hesus sa Halamanan",
          fruit: "Pagsisisi sa kasalanan",
          meditation:
            "Nanalangin si Hesus sa matinding hapis, at pinagpawisan ng dugo: huwag ang kalooban ko, kundi ang Iyo ang mangyari. Nawa'y magbantay at manalangin ako kasama Niya.",
        },
        {
          title: "Ang Paghampas kay Hesus na Nakagapos sa Haligi",
          fruit: "Kalinisan",
          meditation:
            "Iginapos at hinampas ang ating Panginoon dahil sa ating mga kasalanan. Sa Kanyang mga sugat tayo ay gumaling.",
        },
        {
          title: "Ang Pagpuputong ng Koronang Tinik",
          fruit: "Lakas ng loob",
          meditation:
            "Ang Hari ng mga hari ay nilibak at pinutungan ng koronang tinik. Nawa'y hindi ko Siya ikahiya sa harap ng ibang tao.",
        },
        {
          title: "Ang Pagpasan ng Krus",
          fruit: "Pagtitiis",
          meditation:
            "Pinasan ni Hesus ang mabigat na krus patungong Kalbaryo at nadapa sa ilalim ng bigat nito. Nawa'y pasanin ko ang aking krus araw-araw kasama Niya.",
        },
        {
          title: "Ang Pagpako at Pagkamatay ni Hesus sa Krus",
          fruit: "Pagtitiyaga hanggang wakas",
          meditation:
            "Pinatawad ni Hesus ang mga pumatay sa Kanya, ibinigay sa atin ang Kanyang Ina, at ibinigay ang Kanyang espiritu. Naganap na: inibig Niya tayo hanggang sa wakas.",
        },
      ],
    },
    glorious: {
      name: "Mga Misteryo ng Luwalhati",
      days: "Miyerkules at Linggo",
      mysteries: [
        {
          title: "Ang Muling Pagkabuhay ni Hesus",
          fruit: "Pananampalataya",
          meditation:
            "Sa ikatlong araw, nabuhay na mag-uli si Hesus mula sa libingan at nagtagumpay laban sa kasalanan at kamatayan. Siya ay nabuhay, gaya ng Kanyang sinabi.",
        },
        {
          title: "Ang Pag-akyat ni Hesus sa Langit",
          fruit: "Pag-asa",
          meditation:
            "Umakyat si Hesus sa Ama sa harap ng Kanyang mga alagad, at nangakong sasamahan tayo palagi. Nawa'y manabik ako sa langit.",
        },
        {
          title: "Ang Pagpanaog ng Espiritu Santo",
          fruit: "Pag-ibig sa Diyos",
          meditation:
            "Bumaba ang Espiritu Santo kay Maria at sa mga Apostol na parang mga dilang apoy. Halina, Espiritu Santo, puspusin Mo ang aking puso.",
        },
        {
          title: "Ang Pag-akyat kay Maria sa Langit",
          fruit: "Biyaya ng banal na kamatayan",
          meditation:
            "Sa pagtatapos ng kanyang buhay sa lupa, iniakyat si Maria, katawan at kaluluwa, sa kaluwalhatian ng langit. Hinihintay niya tayo roon.",
        },
        {
          title: "Ang Pagpuputong kay Maria bilang Reyna ng Langit at Lupa",
          fruit: "Pagtitiwala sa pamamagitan ni Maria",
          meditation:
            "Pinutungan si Maria bilang Reyna ng Langit at Lupa. Nawa'y ipagkatiwala ko ang aking sarili sa kanyang pag-aaruga bilang ina.",
        },
      ],
    },
    luminous: {
      name: "Mga Misteryo ng Liwanag",
      days: "Huwebes",
      mysteries: [
        {
          title: "Ang Pagbibinyag kay Hesus sa Ilog Jordan",
          fruit: "Pagbubukas ng loob sa Espiritu Santo",
          meditation:
            "Nabuksan ang langit at ipinahayag ng tinig ng Ama: Ito ang minamahal kong Anak. Nawa'y isabuhay ko nang tapat ang aking binyag.",
        },
        {
          title: "Ang Kasalan sa Cana",
          fruit: "Kay Hesus sa pamamagitan ni Maria",
          meditation:
            "Sa kahilingan ni Maria, ginawa ni Hesus ang Kanyang unang himala. Gawin ninyo ang anumang iutos Niya sa inyo.",
        },
        {
          title: "Ang Pagpapahayag ng Kaharian ng Diyos",
          fruit: "Pagbabalik-loob at pagtitiwala sa Diyos",
          meditation:
            "Tinawag ni Hesus ang lahat sa pagbabalik-loob: malapit na ang Kaharian ng Diyos. Magsisi kayo at sumampalataya sa Mabuting Balita.",
        },
        {
          title: "Ang Pagbabagong-anyo ni Hesus",
          fruit: "Pagnanais ng kabanalan",
          meditation:
            "Sa bundok, nagliwanag na parang araw ang mukha ni Kristo. Ito ang minamahal kong Anak; pakinggan ninyo Siya.",
        },
        {
          title: "Ang Pagtatatag ng Eukaristiya",
          fruit: "Pagsamba",
          meditation:
            "Sa Huling Hapunan, ibinigay sa atin ni Hesus ang Kanyang Katawan at Dugo. Nananatili Siya sa atin sa bawat tabernakulo.",
        },
      ],
    },
  };
