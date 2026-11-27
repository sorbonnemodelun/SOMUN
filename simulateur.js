/* =====================================================================
   SOMUN — Le jeu diplomatique (simulateur de négociation ONU / UNESCO)
   Version 1.2 — module autonome : à charger après le script du site.
   Bilingue : français et anglais (voir « LANGUE DU JEU »).
   Les règles de procédure et de vote sont calculées par ce module, de façon
   déterministe ; l'IA éventuelle ne fait que rédiger des textes.
   Aucune clé d'API ne figure dans ce fichier.
   ===================================================================== */
(function () {
"use strict";
/* =====================================================================
   DONNÉES DE BASE : axes de négociation, délégations, comités, procédures
   Les profils des États sont des simplifications pédagogiques : ils ne
   reflètent pas les positions officielles des gouvernements.
   ===================================================================== */

/* Axes de négociation. Chaque sujet en utilise 3 ou 4.
   Valeur -1 = pôle « neg », +1 = pôle « pos ». */
const AXES = {
  obl: { name: "Portée juridique", neg: "engagements volontaires", pos: "obligations fermes" },
  sup: { name: "Suivi international", neg: "suivi national", pos: "mécanisme international de suivi" },
  fin: { name: "Financement", neg: "aucun nouveau financement", pos: "financement multilatéral dédié" },
  reg: { name: "Échelle d'action", neg: "pilotage onusien centralisé", pos: "approche régionale" },
  prv: { name: "Rôle du secteur privé", neg: "action publique", pos: "partenariats avec le privé" },
  rgl: { name: "Encadrement des technologies", neg: "autorégulation", pos: "régulation stricte" },
  opn: { name: "Accès et partage", neg: "accès encadré", pos: "accès ouvert" },
  res: { name: "Mesures restrictives", neg: "mesures incitatives", pos: "restrictions contraignantes" },
  dro: { name: "Approche", neg: "approche technique", pos: "approche fondée sur les droits" }
};

/* Traits des délégations, notés de 0 à 9, dans cet ordre :
   sov  attachement à la souveraineté      mul  multilatéralisme
   hr   promotion des droits humains        dev  besoins de développement
   don  capacité de contribution financière mkt  orientation marché / secteur privé
   sec  priorité sécuritaire                reg  préférence pour les organisations régionales
   env  vulnérabilité / engagement climat   cul  priorité au patrimoine culturel
   tec  puissance technologique             rgl  préférence pour la régulation des technologies
   opn  science / accès ouverts             tou  dépendance au tourisme
   sea  intérêts maritimes */
const TRAIT_KEYS = ["sov","mul","hr","dev","don","mkt","sec","reg","env","cul","tec","rgl","opn","tou","sea"];

/* [code, nom, groupe régional ONU, groupe électoral UNESCO, blocs, traits, influence 1-5, options]
   Groupes ONU : AFR, APG (Asie-Pacifique), EEG (Europe orientale), GRULAC, WEOG.
   Groupes UNESCO : I, II, III, IV, Va (Afrique), Vb (États arabes). */
const COUNTRY_ROWS = [
  ["CHN","Chine","APG","IV","BRICS","962564745883558",5,{p5:1}],
  ["USA","États-Unis","WEOG","I","G7 OTAN","746099934593668",5,{p5:1,noUnesco:1}],
  ["FRA","France","WEOG","I","UE OTAN G7 OIF","388086757978797",5,{p5:1}],
  ["GBR","Royaume-Uni","WEOG","I","OTAN G7 Commonwealth","477088836786779",5,{p5:1}],
  ["RUS","Russie","EEG","II","BRICS","952344953772447",5,{p5:1}],
  ["DEU","Allemagne","WEOG","I","UE OTAN G7","388097567789757",4],
  ["ITA","Italie","WEOG","I","UE OTAN G7","387176567967697",4],
  ["ESP","Espagne","WEOG","I","UE OTAN","387166567967797",3],
  ["CAN","Canada","WEOG","I","OTAN G7 OIF Commonwealth","388087546677866",4],
  ["AUS","Australie","WEOG","IV","Commonwealth","477078755576777",4],
  ["NOR","Norvège","WEOG","I","OTAN","398096558677858",3],
  ["SWE","Suède","WEOG","I","UE OTAN","299087468688946",3],
  ["NLD","Pays-Bas","WEOG","I","UE OTAN","388088568688859",3],
  ["CHE","Suisse","WEOG","I","OIF","588088337787773",3],
  ["NZL","Nouvelle-Zélande","WEOG","IV","Commonwealth","398067458667876",2],
  ["IRL","Irlande","WEOG","I","UE","398068367777865",2],
  ["GRC","Grèce","WEOG","I","UE OTAN OIF","476146666956699",2],
  ["PRT","Portugal","WEOG","I","UE OTAN","387156467857788",2],
  ["BEL","Belgique","WEOG","I","UE OTAN OIF","388077467768756",3],
  ["MLT","Malte","WEOG","I","UE Commonwealth","476137467846699",1],
  ["TUR","Türkiye","WEOG","I","OTAN OCI","764456755954587",4],
  ["POL","Pologne","EEG","II","UE OTAN","576167865767655",3],
  ["ROU","Roumanie","EEG","II","UE OTAN OIF","476246666757655",2],
  ["CZE","Tchéquie","EEG","II","UE OTAN","477157665767761",2],
  ["EST","Estonie","EEG","II","UE OTAN","388148766687845",2],
  ["SVN","Slovénie","EEG","II","UE OTAN","388146467757764",1],
  ["BGR","Bulgarie","EEG","II","UE OTAN OIF","476236666746665",1],
  ["BRA","Brésil","GRULAC","III","BRICS G77","676646567866766",4],
  ["MEX","Mexique","GRULAC","III","","587546557956786",3],
  ["ARG","Argentine","GRULAC","III","G77","577536466756766",3],
  ["CHL","Chili","GRULAC","III","G77","487448468657867",2],
  ["COL","Colombie","GRULAC","III","G77","576626667846776",2],
  ["PER","Pérou","GRULAC","III","G77","576627567946786",2],
  ["ECU","Équateur","GRULAC","III","G77","676715568736776",1],
  ["PAN","Panama","GRULAC","III","G77","576528467635679",1],
  ["CRI","Costa Rica","GRULAC","III","G77","399526269647885",2],
  ["JAM","Jamaïque","GRULAC","III","G77 PEID Commonwealth","487716479736797",1],
  ["BRB","Barbade","GRULAC","III","G77 PEID Commonwealth","497616379736797",1],
  ["URY","Uruguay","GRULAC","III","G77","388426367657866",1],
  ["GTM","Guatemala","GRULAC","III","G77","665716568835675",1],
  ["TTO","Trinité-et-Tobago","GRULAC","III","G77 PEID Commonwealth","576526578645668",1],
  ["ZAF","Afrique du Sud","AFR","Va","UA BRICS G77 Commonwealth","687646587756777",4],
  ["DZA","Algérie","AFR","Vb","UA LigueArabe OCI G77","864634776734546",3],
  ["EGY","Égypte","AFR","Vb","UA LigueArabe OCI BRICS G77 OIF","863735877944599",4],
  ["ETH","Éthiopie","AFR","Va","UA BRICS G77","774915688834661",3],
  ["GHA","Ghana","AFR","Va","UA G77 Commonwealth","587816588736766",2],
  ["KEN","Kenya","AFR","Va","UA G77 Commonwealth","586816689746787",3],
  ["MAR","Maroc","AFR","Vb","UA LigueArabe OCI G77 OIF","675626667945688",3],
  ["NGA","Nigeria","AFR","Va","UA OCI G77 Commonwealth","675826687745657",4],
  ["SEN","Sénégal","AFR","Va","UA OCI G77 OIF","587815588836777",2],
  ["CIV","Côte d'Ivoire","AFR","Va","UA OCI G77 OIF","576816587735667",2],
  ["TUN","Tunisie","AFR","Vb","UA LigueArabe OCI G77 OIF","676616567946786",2],
  ["CMR","Cameroun","AFR","Va","UA OCI G77 OIF Commonwealth","764815677734655",2],
  ["MOZ","Mozambique","AFR","Va","UA OCI G77 Commonwealth","675905589625667",1],
  ["SLE","Sierra Leone","AFR","Va","UA OCI G77 Commonwealth","586905488625735",1],
  ["GAB","Gabon","AFR","Va","UA OCI G77 OIF Commonwealth","675715588635656",1],
  ["MUS","Maurice","AFR","Va","UA G77 PEID OIF Commonwealth","487517379746798",1],
  ["IND","Inde","APG","IV","BRICS G77 Commonwealth","874746747985877",5],
  ["JPN","Japon","APG","IV","G7","486097647896779",4],
  ["KOR","République de Corée","APG","IV","","486178746796769",3],
  ["IDN","Indonésie","APG","IV","ASEAN BRICS OCI G77","775726678855689",4],
  ["PHL","Philippines","APG","IV","ASEAN G77","675716679745678",2],
  ["VNM","Viet Nam","APG","IV","ASEAN G77 OIF","863616668753578",2],
  ["PAK","Pakistan","APG","IV","OCI G77 Commonwealth","864815868744646",3],
  ["BGD","Bangladesh","APG","IV","OCI G77 Commonwealth","685905469635747",2],
  ["SAU","Arabie saoudite","APG","Vb","LigueArabe OCI G77","862266864753568",4],
  ["ARE","Émirats arabes unis","APG","Vb","LigueArabe OCI BRICS G77","773169655674689",3],
  ["QAT","Qatar","APG","Vb","LigueArabe OCI G77","774168665664668",2],
  ["JOR","Jordanie","APG","Vb","LigueArabe OCI G77","675716677945683",1],
  ["MYS","Malaisie","APG","IV","ASEAN OCI G77 Commonwealth","775437677765689",2],
  ["SGP","Singapour","APG","IV","ASEAN G77 PEID Commonwealth","685159677595679",3],
  ["FJI","Fidji","APG","IV","G77 PEID Commonwealth","597715379726797",1],
  ["MDV","Maldives","APG","IV","OCI G77 PEID Commonwealth","597715469626797",1],
  ["KAZ","Kazakhstan","APG","IV","OCI","774536666744542",2],
  ["THA","Thaïlande","APG","IV","ASEAN G77","675537678855698",2]
];

const UN_GROUPS = { AFR: "Groupe des États d'Afrique", APG: "Groupe des États d'Asie-Pacifique", EEG: "Groupe des États d'Europe orientale", GRULAC: "Groupe des États d'Amérique latine et des Caraïbes", WEOG: "Groupe des États d'Europe occidentale et autres États" };
const UN_GROUPS_SHORT = { AFR: "Afrique", APG: "Asie-Pacifique", EEG: "Europe orientale", GRULAC: "Amérique latine et Caraïbes", WEOG: "Europe occidentale et autres" };
const UNESCO_GROUPS = { I: "Groupe I (Europe occidentale et Amérique du Nord)", II: "Groupe II (Europe orientale)", III: "Groupe III (Amérique latine et Caraïbes)", IV: "Groupe IV (Asie et Pacifique)", Va: "Groupe V(a) (Afrique)", Vb: "Groupe V(b) (États arabes)" };
const BLOC_NAMES = { UE: "Union européenne", OTAN: "OTAN", G7: "G7", G77: "Groupe des 77", BRICS: "BRICS", UA: "Union africaine", ASEAN: "ASEAN", OCI: "Organisation de la coopération islamique", LigueArabe: "Ligue des États arabes", PEID: "Petits États insulaires en développement", OIF: "Francophonie", Commonwealth: "Commonwealth" };

const COUNTRIES = {};
for (const [code, name, un, unesco, blocs, traits, infl, opt] of COUNTRY_ROWS) {
  const t = {};
  TRAIT_KEYS.forEach((k, i) => { t[k] = Number(traits[i]) / 9; });
  COUNTRIES[code] = Object.assign({ code, name, un, unesco, blocs: blocs ? blocs.split(" ") : [], t, infl }, opt || {});
}

/* Article défini pour « la délégation de … » / « le représentant de … » */
const DE_FORMS = {
  CHN:"de la Chine", USA:"des États-Unis", FRA:"de la France", GBR:"du Royaume-Uni", RUS:"de la Russie", DEU:"de l'Allemagne", ITA:"de l'Italie", ESP:"de l'Espagne", CAN:"du Canada", AUS:"de l'Australie", NOR:"de la Norvège", SWE:"de la Suède", NLD:"des Pays-Bas", CHE:"de la Suisse", NZL:"de la Nouvelle-Zélande", IRL:"de l'Irlande", GRC:"de la Grèce", PRT:"du Portugal", BEL:"de la Belgique", MLT:"de Malte", TUR:"de la Türkiye", POL:"de la Pologne", ROU:"de la Roumanie", CZE:"de la Tchéquie", EST:"de l'Estonie", SVN:"de la Slovénie", BGR:"de la Bulgarie", BRA:"du Brésil", MEX:"du Mexique", ARG:"de l'Argentine", CHL:"du Chili", COL:"de la Colombie", PER:"du Pérou", ECU:"de l'Équateur", PAN:"du Panama", CRI:"du Costa Rica", JAM:"de la Jamaïque", BRB:"de la Barbade", URY:"de l'Uruguay", GTM:"du Guatemala", TTO:"de Trinité-et-Tobago", ZAF:"de l'Afrique du Sud", DZA:"de l'Algérie", EGY:"de l'Égypte", ETH:"de l'Éthiopie", GHA:"du Ghana", KEN:"du Kenya", MAR:"du Maroc", NGA:"du Nigeria", SEN:"du Sénégal", CIV:"de la Côte d'Ivoire", TUN:"de la Tunisie", CMR:"du Cameroun", MOZ:"du Mozambique", SLE:"de la Sierra Leone", GAB:"du Gabon", MUS:"de Maurice", IND:"de l'Inde", JPN:"du Japon", KOR:"de la République de Corée", IDN:"de l'Indonésie", PHL:"des Philippines", VNM:"du Viet Nam", PAK:"du Pakistan", BGD:"du Bangladesh", SAU:"de l'Arabie saoudite", ARE:"des Émirats arabes unis", QAT:"du Qatar", JOR:"de la Jordanie", MYS:"de la Malaisie", SGP:"de Singapour", FJI:"des Fidji", MDV:"des Maldives", KAZ:"du Kazakhstan", THA:"de la Thaïlande"
};
const deName = code => LANG === "en" ? "of " + (EN_THE.has(code) ? "the " : "") + COUNTRIES[code].name : (DE_FORMS[code] || ("de " + COUNTRIES[code].name));
/* « la délégation chinoise » serait plus élégant mais source d'erreurs : on écrit « la délégation de la Chine ». */

/* ===== Attitudes diplomatiques des délégations IA =====
   yes / no : seuils d'utilité pour voter pour / contre (sinon abstention)
   move : facilité à faire évoluer sa position ; deal : sensibilité aux accords */
const PERSONALITIES = {
  cooperative:   { name: "Coopérative",     yes: 0.36, no: 0.02, move: 1.25, deal: 1.0, redline: 1.15, desc: "cherche un accord et travaille de bonne foi" },
  prudente:      { name: "Prudente",        yes: 0.50, no: 0.10, move: 0.85, deal: 0.9, redline: 1.0,  desc: "s'engage peu et s'abstient volontiers" },
  intransigeante:{ name: "Intransigeante",  yes: 0.58, no: 0.32, move: 0.55, deal: 0.7, redline: 0.85, desc: "défend ses principes et cède rarement" },
  opportuniste:  { name: "Opportuniste",    yes: 0.46, no: 0.22, move: 1.0,  deal: 1.6, redline: 1.0,  desc: "monnaye son soutien contre des concessions" },
  mediatrice:    { name: "Médiatrice",      yes: 0.40, no: -0.05,move: 1.1,  deal: 1.0, redline: 1.1,  desc: "rapproche les positions et vote rarement contre" },
  ambitieuse:    { name: "Ambitieuse",      yes: 0.46, no: 0.18, move: 0.9,  deal: 1.1, redline: 1.0,  desc: "veut voir ses propres propositions dans le texte" },
  technocratique:{ name: "Technocratique",  yes: 0.46, no: 0.16, move: 1.0,  deal: 0.9, redline: 1.0,  desc: "exige un texte précis, chiffré et applicable" }
};

/* ===== Orientations proposées au joueur (phase 2) ===== */
const ORIENTATIONS = {
  ambitieuse:  { name: "Approche multilatérale ambitieuse", desc: "Des engagements forts, un suivi international et des moyens dédiés.", vec: { obl: .6, sup: .6, fin: .5, reg: -.3, prv: 0, rgl: .45, opn: .35, res: .35, dro: .45 } },
  souverainete:{ name: "Priorité à la souveraineté nationale", desc: "Des engagements volontaires, respectueux des choix de chaque État.", vec: { obl: -.7, sup: -.7, fin: -.1, reg: .3, prv: 0, rgl: -.3, opn: -.2, res: -.25, dro: -.45 } },
  pragmatique: { name: "Approche économique et pragmatique", desc: "Des solutions applicables, peu coûteuses, associant le secteur privé.", vec: { obl: -.3, sup: -.1, fin: -.4, reg: .1, prv: .7, rgl: -.3, opn: -.15, res: -.45, dro: -.15 } },
  cooperation: { name: "Coopération internationale renforcée", desc: "Le partage des moyens et le renforcement des capacités, région par région.", vec: { obl: .1, sup: .2, fin: .6, reg: .4, prv: .2, rgl: .15, opn: .5, res: .05, dro: .2 } }
};

/* ===== Organes et comités =====
   comp : composition simulée ; vote : règle de décision (déterministe) */
const BODIES = {
  UNSC: {
    id: "UNSC", de: "du Conseil de sécurité", g: "m", head: "Le Conseil de sécurité", plenary: null, org: "ONU", name: "Conseil de sécurité", short: "Conseil de sécurité", acr: "CSNU",
    realSize: 15, sim: { p5: true, un: { AFR: 3, APG: 2, GRULAC: 2, WEOG: 2, EEG: 1 } },
    vote: { rule: "unsc" }, chair: "la présidence du Conseil", chairTitle: "Président du Conseil de sécurité", sg: "le Secrétaire général",
    act: "résolution", session: "séance", stay: "Décide de demeurer saisi de la question.",
    desc: "Responsabilité principale du maintien de la paix et de la sécurité internationales (Charte, art. 24). Ses décisions s'imposent aux États membres (art. 25).",
    powers: ["Décisions obligatoires pour les États (art. 25)", "Mesures de l'article 41 (Chapitre VII)", "Mandats de missions et missions du Conseil", "Organes subsidiaires (art. 29)"],
    limits: ["Ne vote pas le budget de l'ONU (compétence de l'Assemblée générale, art. 17)"],
    ruleText: "Quinze membres. Adoption avec au moins neuf voix pour, sans vote contre d'un membre permanent (art. 27.3). L'abstention d'un membre permanent n'empêche pas l'adoption."
  },
  UNGA: {
    id: "UNGA", de: "de l'Assemblée générale", g: "f", head: "L'Assemblée générale", plenary: null, org: "ONU", name: "Assemblée générale", short: "Assemblée générale", acr: "AGNU",
    realSize: 193, sim: { size: 16, un: { AFR: 4, APG: 4, GRULAC: 3, WEOG: 3, EEG: 2 } },
    vote: { rule: "majority", important: true }, chair: "la présidence de l'Assemblée", chairTitle: "Président de l'Assemblée générale", sg: "le Secrétaire général",
    act: "résolution", session: "séance plénière", stay: "Décide d'inscrire la question à l'ordre du jour provisoire de sa prochaine session.",
    desc: "Organe délibérant où chaque État membre dispose d'une voix (art. 9 et 18). Ses résolutions sont des recommandations, sauf pour les questions internes comme le budget.",
    powers: ["Recommandations aux États (art. 10 à 14)", "Budget de l'Organisation et barème des contributions (art. 17)", "Création d'organes subsidiaires (art. 22)", "Adoption de conventions ouvertes à la signature"],
    limits: ["Ne peut pas imposer d'obligations aux États", "Ne crée pas de mesures de l'article 41"],
    ruleText: "Majorité simple des membres présents et votants. Majorité des deux tiers pour les « questions importantes » (art. 18.2), dont les recommandations relatives à la paix et à la sécurité et les questions budgétaires."
  },
  UNHRC: {
    id: "UNHRC", de: "du Conseil des droits de l'homme", g: "m", head: "Le Conseil des droits de l'homme", plenary: "l'Assemblée générale", org: "ONU", name: "Conseil des droits de l'homme", short: "Conseil des droits de l'homme", acr: "CDH",
    realSize: 47, sim: { size: 16, un: { AFR: 4, APG: 4, GRULAC: 3, WEOG: 3, EEG: 2 } },
    vote: { rule: "majority" }, chair: "la présidence du Conseil", chairTitle: "Président du Conseil des droits de l'homme", sg: "le Haut-Commissariat aux droits de l'homme",
    act: "résolution", session: "séance", stay: "Décide de poursuivre l'examen de la question à une session ultérieure.",
    desc: "Organe subsidiaire de l'Assemblée générale (résolution 60/251) chargé de la promotion et de la protection des droits de l'homme.",
    powers: ["Résolutions et recommandations", "Procédures spéciales (rapporteurs spéciaux, groupes de travail)", "Demandes de rapports au Haut-Commissariat", "Recommandations à l'Assemblée générale"],
    limits: ["Pas de décisions obligatoires ni de sanctions", "Ne vote pas de budget"],
    ruleText: "Quarante-sept membres élus. Adoption à la majorité simple des membres présents et votants ; les abstentions ne sont pas comptées."
  },
  ECOSOC: {
    id: "ECOSOC", de: "du Conseil économique et social", g: "m", head: "Le Conseil économique et social", plenary: "l'Assemblée générale", org: "ONU", name: "Conseil économique et social", short: "ECOSOC", acr: "ECOSOC",
    realSize: 54, sim: { size: 16, un: { AFR: 4, APG: 3, GRULAC: 3, WEOG: 4, EEG: 2 } },
    vote: { rule: "majority" }, chair: "la présidence du Conseil", chairTitle: "Président du Conseil économique et social", sg: "le Secrétaire général",
    act: "résolution", session: "séance", stay: "Décide de poursuivre l'examen de la question à sa prochaine session.",
    desc: "Coordonne les travaux économiques et sociaux de l'ONU et de ses institutions spécialisées (Charte, chapitre X).",
    powers: ["Recommandations aux États et à l'Assemblée générale (art. 62)", "Projets de conventions (art. 62.3)", "Commissions techniques (art. 68)", "Conférences internationales (art. 62.4)"],
    limits: ["Pas de décisions obligatoires", "Ne fixe pas le budget de l'ONU"],
    ruleText: "Cinquante-quatre membres élus. Décisions à la majorité des membres présents et votants (art. 67)."
  },
  TRUST: {
    id: "TRUST", de: "du Conseil de tutelle", g: "m", head: "Le Conseil de tutelle", plenary: null, org: "ONU", name: "Conseil de tutelle (session pédagogique)", short: "Conseil de tutelle", acr: "Tutelle",
    realSize: 5, sim: { p5only: true },
    vote: { rule: "majority" }, chair: "la présidence du Conseil", chairTitle: "Président du Conseil de tutelle", sg: "le Secrétaire général",
    act: "résolution", session: "séance", stay: "Décide d'examiner le prochain rapport annuel de l'autorité administrante.",
    desc: "Le Conseil de tutelle a suspendu ses activités en 1994 après l'indépendance des Palaos. Cette session est une fiction pédagogique, sur un territoire fictif.",
    powers: ["Examen des rapports de l'autorité administrante (art. 87.a)", "Examen des pétitions (art. 87.b)", "Missions de visite périodiques (art. 87.c)", "Recommandations"],
    limits: ["Ne peut pas décider à la place de l'autorité administrante", "Pas de sanctions"],
    ruleText: "Composé aujourd'hui des cinq membres permanents. Chaque membre dispose d'une voix ; décisions à la majorité des membres présents et votants (art. 89). Aucun droit de veto."
  },
  UNESCO_GC: {
    id: "UNESCO_GC", de: "de la Conférence générale de l'UNESCO", g: "f", head: "La Conférence générale", plenary: null, org: "UNESCO", name: "Conférence générale de l'UNESCO", short: "Conférence générale", acr: "CG UNESCO",
    realSize: 194, sim: { size: 16, unesco: { I: 3, II: 2, III: 3, IV: 3, Va: 3, Vb: 2 } },
    vote: { rule: "majority", conv23: true }, chair: "la présidence de la Conférence", chairTitle: "Président de la Conférence générale", sg: "le Directeur général",
    act: "résolution", session: "séance plénière", stay: "Décide d'examiner la question à sa prochaine session.",
    desc: "Organe suprême de l'UNESCO : tous les États membres, une voix chacun (Acte constitutif, art. IV).",
    powers: ["Recommandations aux États membres (art. IV.4)", "Adoption de conventions internationales (art. IV.4)", "Programme et budget de l'Organisation", "Création d'organes subsidiaires"],
    limits: ["Les conventions n'engagent que les États qui les ratifient"],
    ruleText: "Majorité simple des membres présents et votants. Majorité des deux tiers pour adopter une convention internationale (art. IV.4)."
  },
  UNESCO_EB: {
    id: "UNESCO_EB", de: "du Conseil exécutif de l'UNESCO", g: "m", head: "Le Conseil exécutif", plenary: "la Conférence générale", org: "UNESCO", name: "Conseil exécutif de l'UNESCO", short: "Conseil exécutif", acr: "EX",
    realSize: 58, sim: { size: 15, unesco: { I: 3, II: 2, III: 3, IV: 3, Va: 3, Vb: 1 } },
    vote: { rule: "majority" }, chair: "la présidence du Conseil exécutif", chairTitle: "Président du Conseil exécutif", sg: "le Directeur général",
    act: "décision", session: "séance plénière", stay: "Décide d'inscrire cette question à l'ordre du jour de sa prochaine session.",
    desc: "Élu par la Conférence générale, il prépare ses travaux et veille à l'exécution du programme (Acte constitutif, art. V).",
    powers: ["Examen du programme et du budget", "Recommandations à la Conférence générale", "Demandes au Directeur général", "Comités et groupes de travail"],
    limits: ["N'adopte ni convention ni budget : il les recommande à la Conférence générale"],
    ruleText: "Cinquante-huit membres élus. Décisions à la majorité simple des membres présents et votants."
  },
  WHC: {
    id: "WHC", de: "du Comité du patrimoine mondial", g: "m", head: "Le Comité du patrimoine mondial", plenary: null, org: "UNESCO", name: "Comité du patrimoine mondial", short: "Comité du patrimoine mondial", acr: "COM",
    realSize: 21, sim: { size: 15, unesco: { I: 3, II: 2, III: 3, IV: 3, Va: 2, Vb: 2 } },
    vote: { rule: "twothirds" }, chair: "la présidence du Comité", chairTitle: "Président du Comité du patrimoine mondial", sg: "le Directeur du Centre du patrimoine mondial",
    act: "décision", session: "séance", stay: "Demande à l'État partie de soumettre un rapport sur l'état de conservation du bien pour examen à sa prochaine session.",
    desc: "Organe intergouvernemental de la Convention de 1972 : il tient la Liste du patrimoine mondial et la Liste du patrimoine mondial en péril, et gère le Fonds du patrimoine mondial.",
    powers: ["Inscription sur la Liste du patrimoine mondial en péril (art. 11.4)", "Assistance internationale du Fonds du patrimoine mondial (art. 13)", "Missions de suivi réactif avec les organisations consultatives", "Examen de l'état de conservation des biens"],
    limits: ["Ne peut rien imposer à un État partie sur son territoire sans sa coopération", "Pas de sanctions"],
    ruleText: "Vingt et un membres élus. Décisions à la majorité des deux tiers des membres présents et votants (Convention de 1972, art. 13.8)."
  },
  ICH: {
    id: "ICH", de: "du Comité intergouvernemental du patrimoine culturel immatériel", g: "m", head: "Le Comité", plenary: null, org: "UNESCO", name: "Comité du patrimoine culturel immatériel", short: "Comité du patrimoine immatériel", acr: "PCI",
    realSize: 24, sim: { size: 15, unesco: { I: 3, II: 2, III: 3, IV: 3, Va: 2, Vb: 2 } },
    vote: { rule: "majority" }, chair: "la présidence du Comité", chairTitle: "Président du Comité intergouvernemental", sg: "le Secrétariat de la Convention",
    act: "décision", session: "séance", stay: "Décide d'examiner la mise en œuvre de la présente décision à sa prochaine session.",
    desc: "Comité intergouvernemental de la Convention de 2003 pour la sauvegarde du patrimoine culturel immatériel.",
    powers: ["Inscription sur la Liste de sauvegarde urgente", "Assistance internationale du Fonds du patrimoine culturel immatériel", "Programmes de bonnes pratiques de sauvegarde", "Recommandations aux États parties"],
    limits: ["Pas d'obligations nouvelles hors de la Convention", "Agit avec le consentement et la participation des communautés concernées"],
    ruleText: "Vingt-quatre membres élus. Décisions à la majorité simple des membres présents et votants ; les abstentions ne sont pas comptées."
  },
  UNESCO_PC: {
    id: "UNESCO_PC", de: "de la Commission de programme de la Conférence générale", g: "f", head: "La Conférence générale", plenary: null, org: "UNESCO", name: "Commission de programme de la Conférence générale", short: "Commission de programme", acr: "Commission",
    realSize: 194, sim: { size: 16, unesco: { I: 3, II: 2, III: 3, IV: 3, Va: 3, Vb: 2 } },
    vote: { rule: "majority" }, chair: "la présidence de la Commission", chairTitle: "Président de la Commission", sg: "le Directeur général",
    act: "résolution", doc: "projet de résolution", session: "séance", stay: "Décide de poursuivre l'examen de la question à sa prochaine session.",
    desc: "Les commissions de programme examinent les projets de résolution dans leur domaine et les recommandent à la plénière de la Conférence générale.",
    powers: ["Recommandations à la plénière de la Conférence générale", "Propositions de programmes et d'activités", "Demandes au Directeur général"],
    limits: ["Ses textes doivent encore être adoptés en plénière"],
    ruleText: "Ouverte à tous les États membres. Recommandations à la majorité simple des membres présents et votants.",
    commissions: { ED: "Éducation", SC: "Sciences exactes et naturelles", CLT: "Culture", CI: "Communication et information" }
  }
};
const BODY_ORDER = { "Nations Unies": ["UNSC", "UNGA", "UNHRC", "ECOSOC", "TRUST"], "UNESCO": ["UNESCO_GC", "UNESCO_EB", "WHC", "ICH", "UNESCO_PC"] };

/* ===== Nature des clauses et compétences par organe =====
   Le moteur refuse les clauses qui sortent des pouvoirs de l'organe. */
const KINDS = {
  rec:      { name: "Recommandation aux États", all: true },
  report:   { name: "Demande de rapport", all: true },
  coop:     { name: "Coopération et renforcement des capacités", all: true },
  review:   { name: "Suivi de la question", all: true },
  body:     { name: "Création d'un organe ou d'un groupe de travail", bodies: ["UNSC","UNGA","UNHRC","ECOSOC","UNESCO_GC","UNESCO_EB","WHC","ICH","UNESCO_PC"] },
  volfund:  { name: "Financement volontaire", all: true },
  assessed: { name: "Financement par contributions obligatoires", bodies: ["UNGA","UNESCO_GC","UNESCO_PC"], why: "Seules l'Assemblée générale (art. 17 de la Charte) et la Conférence générale de l'UNESCO votent le budget et les contributions obligatoires." },
  assessrec:{ name: "Recommandation budgétaire à l'organe plénier", bodies: ["ECOSOC","UNHRC","UNESCO_EB"] },
  binding:  { name: "Obligation pour tous les États (art. 25)", bodies: ["UNSC"], why: "Seul le Conseil de sécurité peut adopter des décisions qui s'imposent à tous les États membres (art. 25 de la Charte)." },
  art41:    { name: "Mesures de l'article 41 (Chapitre VII)", bodies: ["UNSC"], needs7: true, why: "Les mesures de l'article 41 relèvent exclusivement du Conseil de sécurité agissant en vertu du Chapitre VII." },
  mission:  { name: "Mandat d'une mission internationale", bodies: ["UNSC"], why: "Le mandat d'une mission de terrain relève du Conseil de sécurité." },
  visit:    { name: "Mission de visite", bodies: ["UNSC","TRUST"] },
  rapporteur:{ name: "Procédure spéciale (rapporteur spécial)", bodies: ["UNHRC"], why: "La création de procédures spéciales relève du Conseil des droits de l'homme." },
  convention:{ name: "Convention internationale", bodies: ["UNGA","ECOSOC","UNESCO_GC","UNESCO_EB","UNESCO_PC","UNHRC"] },
  danger:   { name: "Liste du patrimoine mondial en péril", bodies: ["WHC"], why: "Seul le Comité du patrimoine mondial peut inscrire un bien sur la Liste du patrimoine mondial en péril (Convention de 1972, art. 11.4)." },
  monitor:  { name: "Mission de suivi réactif", bodies: ["WHC"] },
  urgent:   { name: "Liste de sauvegarde urgente", bodies: ["ICH"], why: "L'inscription sur la Liste de sauvegarde urgente relève du Comité de la Convention de 2003." },
  petition: { name: "Examen d'une pétition", bodies: ["TRUST"] },
  admin:    { name: "Recommandation à l'autorité administrante", bodies: ["TRUST"] }
};
const kindAllowed = (kind, bodyId) => { const k = KINDS[kind]; return !!k && (k.all || (k.bodies || []).includes(bodyId)); };

/* Verbes des clauses opératives, du plus fort au plus faible.
   La force du verbe module l'effet de la clause sur le texte. */
const VERBS = [
  { v: "Exige", s: 1.0, bodies: ["UNSC"] },
  { v: "Décide", s: 0.9 },
  { v: "Demande", s: 0.72 },
  { v: "Exhorte", s: 0.66 },
  { v: "Engage", s: 0.6 },
  { v: "Prie", s: 0.5 },
  { v: "Recommande", s: 0.46 },
  { v: "Encourage", s: 0.36 },
  { v: "Invite", s: 0.3 },
  { v: "Souligne", s: 0.22 },
  { v: "Prend note", s: 0.1 }
];
const verbStrength = v => (VERBS.find(x => x.v === v) || { s: 0.5 }).s;
const verbsFor = bodyId => VERBS.filter(x => !x.bodies || x.bodies.includes(bodyId)).map(x => x.v);
const PREAMBLE_VERBS = ["Rappelant", "Réaffirmant", "Considérant", "Reconnaissant", "Préoccupé par", "Conscient de", "Soulignant", "Prenant note de", "Se félicitant de", "Ayant à l'esprit"];

/* ===== Contraintes de contexte (deux par scénario) ===== */
const CONSTRAINTS = [
  { id: "budget", text: "Le budget ordinaire est soumis à une croissance nominale nulle : toute dépense nouvelle devra être compensée.", w: { fin: 0.25 }, shift: { fin: -0.1 } },
  { id: "rapport", text: "Le rapport du Secrétariat sur la question est attendu dans six mois : plusieurs délégations veulent éviter les doublons.", w: { sup: 0.1 }, tech: 0.2 },
  { id: "precedent", text: "Plusieurs délégations craignent qu'un texte trop ambitieux ne crée un précédent sur la souveraineté des États.", w: { obl: 0.2, sup: 0.2 }, shift: { obl: -0.1, sup: -0.1 } },
  { id: "annonces", text: "La dernière conférence d'annonces de contributions n'a couvert que 41 % des besoins (donnée fictive).", w: { fin: 0.3 } },
  { id: "elections", text: "La session se tient à l'approche d'élections dans plusieurs États, ce qui réduit leur marge de manœuvre.", move: 0.8 },
  { id: "regional", text: "Une organisation régionale vient d'annoncer sa propre initiative, présentée comme complémentaire du cadre multilatéral.", w: { reg: 0.3 }, shift: { reg: 0.1 } },
  { id: "prive", text: "Les acteurs privés du secteur demandent des normes harmonisées et proposent de cofinancer certaines actions.", w: { prv: 0.3 }, shift: { prv: 0.1 } },
  { id: "opinion", text: "L'incident a eu un fort retentissement médiatique : les opinions publiques attendent une réponse visible.", w: { obl: 0.1, fin: 0.1 }, shift: { obl: 0.1 } }
];

/* Contraintes intérieures possibles pour une délégation (neutres, sans stéréotype) */
const DOMESTIC = [
  { text: "Votre parlement a adopté une motion contre tout nouvel engagement financier pluriannuel.", axis: "fin", dir: -1 },
  { text: "Votre opinion publique, très mobilisée depuis l'incident, attend un résultat concret.", axis: "obl", dir: 1 },
  { text: "Votre ministère de l'économie insiste pour que le texte ménage les acteurs économiques nationaux.", axis: "prv", dir: 1 },
  { text: "Votre gouvernement refuse tout mécanisme qui pourrait être perçu comme une ingérence dans ses affaires intérieures.", axis: "sup", dir: -1 },
  { text: "Votre capitale vous demande d'obtenir une reconnaissance du rôle des organisations régionales.", axis: "reg", dir: 1 },
  { text: "Votre ministre a promis publiquement des moyens supplémentaires pour les pays les plus vulnérables.", axis: "fin", dir: 1 }
];

/* Lieux fictifs (pour que les scénarios ne renvoient à aucun conflit réel) */
const PLACE_A = ["Val", "Tam", "Kor", "Mir", "Esc", "Ost", "Arv", "Cal", "Bel", "Sel", "Dor", "Lun", "Ner", "Sav", "Tor"];
const PLACE_B = ["dora", "aris", "ena", "ovie", "ande", "alia", "oria", "ombe", "essa", "ivar", "anor", "ulie", "astre", "erin", "oya"];

/* =====================================================================
   BANQUE DE SUJETS
   Chaque sujet est une base que le générateur combine avec un déclencheur,
   des données de départ (fictives), deux contraintes, une composition et
   des personnalités tirées au hasard. Les références juridiques citées
   (conventions, résolutions) sont réelles ; les faits du scénario sont fictifs.

   Clauses : forme grammaticale
     act   : {obj, inf}  → « Encourage les États à … » / « Demande aux États de … »
     bind  : {obj, inf}  → « Décide que tous les États doivent … » (Conseil de sécurité)
     sec   : {obj, inf}  → « Prie le Secrétaire général de … »
     self  : {inf}       → « Décide de … »
     plen  : {inf}       → « Recommande à l'Assemblée générale de … »
     stmt  : {stmt}      → « Souligne que … »
     raw   : texte complet fourni par l'organe
   fx : effet sur les axes ; tech : clause précise (appréciée des délégations technocratiques)
   ===================================================================== */

const GENERIC_CLAUSES = [
  { id: "g_report", k: "report", form: "sec", obj: "{sg}", v: "Prie", inf: "lui présenter, dans un délai de {mois} mois, un rapport sur {objet}, assorti de recommandations concrètes", fx: { sup: .15 }, tech: 1 },
  { id: "g_annual", k: "report", form: "sec", obj: "{sg}", v: "Prie", inf: "lui rendre compte chaque année de la mise en œuvre de la présente {act}", fx: { sup: .2 }, tech: 1 },
  { id: "g_coop", k: "coop", form: "act", obj: "les États", v: "Encourage", inf: "renforcer leur coopération en matière de {court}, notamment par l'échange d'informations et de bonnes pratiques", fx: { reg: .05, obl: -.05 } },
  { id: "g_cap", k: "coop", form: "act", obj: "les États qui sont en mesure de le faire", v: "Demande", inf: "apporter une assistance technique et financière aux pays en développement dans le domaine de {court}", fx: { fin: .35 } },
  { id: "g_volfund", k: "volfund", form: "act", obj: "les États et les autres donateurs", v: "Invite", inf: "verser des contributions volontaires à un fonds d'affectation spéciale consacré à {objet}", fx: { fin: .4 } },
  { id: "g_assessed", k: "assessed", form: "self", v: "Décide", inf: "financer les activités prévues par la présente {act} au moyen des contributions obligatoires inscrites au budget ordinaire", fx: { fin: .75, obl: .15 } },
  { id: "g_assessrec", k: "assessrec", form: "plen", v: "Recommande", inf: "inscrire au budget ordinaire les ressources nécessaires à {objet}", fx: { fin: .45 } },
  { id: "g_wg", k: "body", form: "self", v: "Décide", inf: "créer un groupe de travail à composition non limitée chargé de proposer, dans un délai d'un an, des mesures concrètes relatives à {objet}", fx: { sup: .25, obl: .1 }, tech: 1 },
  { id: "g_monitor", k: "body", form: "self", v: "Décide", inf: "mettre en place un mécanisme indépendant chargé de suivre la mise en œuvre des engagements relatifs à {objet} et d'en rendre compte chaque année", fx: { sup: .6, obl: .2 }, tech: 1 },
  { id: "g_sov", k: "rec", form: "stmt", v: "Souligne", stmt: "toute mesure prise au titre de la présente {act} doit respecter pleinement la souveraineté des États et le principe de l'appropriation nationale", fx: { sup: -.4, obl: -.25 } },
  { id: "g_regional", k: "coop", form: "act", obj: "les organisations régionales et sous-régionales", v: "Encourage", inf: "jouer un rôle de premier plan dans la mise en œuvre de la présente {act}", fx: { reg: .5 } },
  { id: "g_private", k: "coop", form: "act", obj: "les États", v: "Encourage", inf: "développer des partenariats avec le secteur privé, les fondations et les milieux universitaires afin de mobiliser des ressources et des compétences complémentaires", fx: { prv: .5, fin: .1 } },
  { id: "g_national", k: "rec", form: "act", obj: "les États", v: "Engage", inf: "adopter des stratégies nationales relatives à {objet}, assorties d'objectifs mesurables et d'un calendrier", fx: { obl: .2 }, tech: 1 },
  { id: "g_binding", k: "binding", form: "bind", obj: "tous les États", v: "Décide", inf: "prendre les mesures législatives et administratives nécessaires pour {but}", fx: { obl: .75, sup: .2 } },
  { id: "g_rights", k: "rec", form: "act", obj: "les États", v: "Demande", inf: "veiller à ce que les mesures relatives à {objet} respectent pleinement le droit international des droits de l'homme", fx: { dro: .45 } },
  { id: "g_open", k: "coop", form: "act", obj: "les États", v: "Encourage", inf: "favoriser le partage ouvert des données, des connaissances et des technologies relatives à {objet}, en particulier au bénéfice des pays en développement", fx: { opn: .5 } },
  { id: "g_regulate", k: "rec", form: "act", obj: "les États", v: "Engage", inf: "adopter un cadre réglementaire clair, fondé sur l'évaluation des risques, en matière de {court}", fx: { rgl: .5, obl: .15 } },
  { id: "g_selfreg", k: "coop", form: "act", obj: "les acteurs privés concernés", v: "Encourage", inf: "adopter des codes de conduite volontaires, dont ils rendront compte publiquement", fx: { rgl: -.4, prv: .35, obl: -.15 } },
  { id: "g_restrict", k: "rec", form: "act", obj: "les États", v: "Exhorte", inf: "adopter des mesures de limitation strictes lorsque cela est nécessaire à {but2}", fx: { res: .5, obl: .15 } },
  { id: "g_incent", k: "rec", form: "act", obj: "les États", v: "Encourage", inf: "privilégier des mesures incitatives associant les acteurs économiques concernés", fx: { res: -.45, prv: .2 } },
  { id: "g_convention", k: "convention", form: "self", v: "Décide", inf: "{conv}", fx: { obl: .7, sup: .2 } },
  { id: "g_stay", k: "review", form: "raw", raw: "{stay}", fx: {} }
];

/* Préambule commun (choisi selon l'organe) */
const GENERIC_PREAMBLE = {
  ONU: ["Rappelant les buts et principes de la Charte des Nations Unies"],
  UNESCO: ["Rappelant l'Acte constitutif de l'UNESCO"],
  sov: "Réaffirmant son attachement à la souveraineté, à l'indépendance politique et à l'intégrité territoriale de tous les États",
  coop: "Soulignant l'importance de la coopération internationale et régionale",
  concern: "{Preoccupe} par {trigger}",
  ch7: "Agissant en vertu du Chapitre VII de la Charte des Nations Unies"
};

const ISSUES = [
  {
    id: "infra", title: "Protection des infrastructures humanitaires face aux catastrophes naturelles",
    bodies: ["UNSC", "UNGA", "ECOSOC"], tags: ["env", "dev"], axes: ["obl", "sup", "fin", "reg"],
    v: { objet: "la protection des infrastructures humanitaires exposées aux catastrophes naturelles", court: "résilience des infrastructures humanitaires", but: "protéger les infrastructures humanitaires essentielles contre les effets des catastrophes naturelles", but2: "la protection des infrastructures humanitaires", outil: "un mécanisme d'alerte et de réponse rapide" },
    facts: [["Entrepôts et centres humanitaires endommagés en un an", 12, 75, ""], ["Personnes privées d'aide pendant plus d'une semaine", 300000, 2800000, " personnes"], ["Part des besoins de reconstruction financée", 18, 46, " %"]],
    triggers: ["la destruction par un cyclone des principaux entrepôts humanitaires de l'archipel de {lieu}, qui a privé {n} personnes d'assistance pendant {j} jours", "des crues exceptionnelles qui ont emporté les ponts et l'unique aéroport de la région de {lieu}, coupant les routes d'acheminement de l'aide", "un séisme qui a endommagé les hôpitaux et le réseau d'eau de la ville de {lieu}, déjà fragilisée par une crise économique"],
    background: "Les catastrophes liées aux aléas naturels touchent chaque année des millions de personnes. Le Cadre de Sendai pour la réduction des risques de catastrophe (2015-2030) fixe notamment pour objectif de réduire les dommages causés aux infrastructures essentielles.",
    history: ["En {y1}, un premier débat thématique a mis en évidence l'absence de coordination entre les acteurs de l'urgence et de la reconstruction.", "En {y2}, le Secrétariat a recommandé de recenser les infrastructures humanitaires critiques dans les zones les plus exposées."],
    pre: ["Rappelant la résolution 46/182 de l'Assemblée générale, du 19 décembre 1991, relative au renforcement de la coordination de l'aide humanitaire d'urgence", "Rappelant le Cadre de Sendai pour la réduction des risques de catastrophe 2015-2030"],
    proposals: [
      { name: "un mécanisme international d'alerte et de protection des infrastructures humanitaires", vec: { obl: .4, sup: .7, fin: .4, reg: -.5 }, by: { mul: 1, hr: .5 } },
      { name: "un fonds régional de reconstruction résiliente", vec: { obl: -.2, sup: -.1, fin: .8, reg: .6 }, by: { dev: 1, env: 1 } },
      { name: "des lignes directrices volontaires sur la résilience des infrastructures", vec: { obl: -.7, sup: -.4, fin: -.4, reg: .1 }, by: { sov: 1, don: .5 } }
    ],
    clauses: [
      { id: "i_plans", k: "rec", form: "act", obj: "les États", v: "Engage", inf: "intégrer la protection des infrastructures humanitaires dans leurs plans nationaux de réduction des risques de catastrophe", fx: { obl: .15, sup: .05 }, tech: 1 },
      { id: "i_stocks", k: "coop", form: "act", obj: "les organisations régionales", v: "Encourage", inf: "prépositionner des stocks d'urgence et des moyens logistiques dans les zones les plus exposées", fx: { reg: .45, fin: .15 } },
      { id: "i_alert", k: "body", form: "self", v: "Décide", inf: "créer un système d'alerte rapide commun recensant les infrastructures humanitaires critiques", fx: { sup: .4, obl: .1 }, tech: 1 },
      { id: "i_access", k: "binding", form: "bind", obj: "tous les États", v: "Décide", inf: "garantir l'accès sans entrave du personnel humanitaire et des équipements de secours aux zones sinistrées", fx: { obl: .6, sup: .2 } },
      { id: "i_visit", k: "visit", form: "self", v: "Décide", inf: "dépêcher une mission du Conseil dans la région de {lieu} afin d'évaluer les besoins de protection des infrastructures humanitaires", fx: { sup: .3 } }
    ],
    objectif: "un cadre de protection des infrastructures humanitaires exposées aux catastrophes"
  },
  {
    id: "routes", title: "Sécurisation des routes maritimes commerciales", important: true,
    bodies: ["UNSC", "UNGA"], tags: ["sea", "sec"], axes: ["obl", "sup", "fin", "reg"],
    v: { objet: "la sécurité des routes maritimes commerciales", court: "sécurité maritime", but: "garantir la sécurité de la navigation sur les routes maritimes commerciales", but2: "la sécurité de la navigation", outil: "un centre international de coordination maritime" },
    mods: { sup: { sea: .15 }, reg: { sea: -.15 } },
    facts: [["Incidents de sécurité signalés en un an", 40, 190, ""], ["Part du commerce mondial transitant par la zone", 8, 22, " %"], ["Hausse des primes d'assurance maritime", 30, 260, " %"]],
    triggers: ["une panne des systèmes de positionnement qui a désorienté {n2} navires marchands dans le détroit de {lieu} pendant {h} heures", "le blocage du chenal de {lieu} pendant {j} jours après l'échouement d'un porte-conteneurs, qui a désorganisé les chaînes d'approvisionnement de toute une région", "une série d'abordages de navires de commerce au large de l'archipel de {lieu}, qui a conduit plusieurs armateurs à suspendre leurs rotations"],
    background: "Environ 80 % du commerce mondial en volume est transporté par voie maritime, selon la CNUCED. Quelques détroits et chenaux concentrent une grande partie de ces flux.",
    history: ["En {y1}, une réunion d'experts a recensé les vulnérabilités des grandes routes commerciales.", "En {y2}, le Secrétariat a appelé à mieux coordonner l'échange d'informations entre États côtiers et États du pavillon."],
    pre: ["Rappelant la Convention des Nations Unies sur le droit de la mer du 10 décembre 1982", "Réaffirmant la liberté de navigation, conformément au droit international"],
    proposals: [
      { name: "un centre international de coordination maritime", vec: { obl: .5, sup: .7, fin: .3, reg: -.6 }, by: { mul: 1, sea: 1 } },
      { name: "un programme de renforcement des capacités des États côtiers", vec: { obl: -.2, sup: -.2, fin: .7, reg: .6 }, by: { dev: 1, sea: .6 } },
      { name: "un code de conduite volontaire pour les armateurs", vec: { obl: -.7, sup: -.3, fin: -.5, reg: 0 }, by: { mkt: 1, sov: .6 } }
    ],
    clauses: [
      { id: "r_centres", k: "coop", form: "act", obj: "les États", v: "Encourage", inf: "créer des centres régionaux de partage d'informations maritimes, en coopération avec l'Organisation maritime internationale", fx: { reg: .4, sup: .15 } },
      { id: "r_report", k: "binding", form: "bind", obj: "tous les États", v: "Décide", inf: "signaler sans délai à l'Organisation maritime internationale tout incident grave affectant la sécurité de la navigation", fx: { obl: .6, sup: .35 } },
      { id: "r_flag", k: "rec", form: "act", obj: "les États du pavillon", v: "Demande", inf: "renforcer le contrôle de la conformité des navires inscrits sur leurs registres aux normes internationales de sûreté", fx: { obl: .25, sup: .15 }, tech: 1 },
      { id: "r_exercise", k: "coop", form: "act", obj: "les États côtiers et les organisations régionales", v: "Encourage", inf: "mener des exercices conjoints de surveillance maritime", fx: { reg: .35, sup: .1 } },
      { id: "r_mech", k: "body", form: "self", v: "Décide", inf: "établir un mécanisme international de coordination de la sécurité maritime rattaché au Secrétariat", fx: { sup: .55, reg: -.4, fin: .2 } }
    ],
    objectif: "un cadre de coopération pour sécuriser les grandes routes maritimes"
  },
  {
    id: "piraterie", title: "Coopération internationale contre la piraterie", important: true,
    bodies: ["UNSC", "UNGA"], tags: ["sea", "sec", "dev"], axes: ["obl", "fin", "reg", "dro"],
    v: { objet: "la lutte contre la piraterie et les vols à main armée en mer", court: "lutte contre la piraterie", but: "réprimer la piraterie et poursuivre ses auteurs", but2: "la sécurité des gens de mer", outil: "un mécanisme régional de poursuites" },
    mods: { dro: { sec: -.2 } },
    facts: [["Attaques ou tentatives recensées en un an", 25, 140, ""], ["Marins retenus en otage", 40, 320, ""], ["Suspects relâchés faute de juridiction", 35, 80, " %"]],
    triggers: ["le détournement d'un pétrolier et de ses {n3} marins au large du golfe de {lieu}", "une recrudescence des attaques contre les pêcheurs artisanaux de la côte de {lieu}", "la libération de {n3} suspects faute de juridiction compétente, après leur interpellation par une patrouille internationale"],
    background: "La Convention des Nations Unies sur le droit de la mer (articles 100 à 107) impose aux États de coopérer à la répression de la piraterie en haute mer. Faute de juridiction prête à juger, de nombreux suspects sont relâchés après leur arrestation.",
    history: ["En {y1}, un groupe de contact informel a coordonné les patrouilles navales dans la zone.", "En {y2}, le Secrétariat a souligné le manque de capacités judiciaires des États de la région."],
    pre: ["Rappelant les articles 100 à 107 de la Convention des Nations Unies sur le droit de la mer", "Rappelant la Convention pour la répression d'actes illicites contre la sécurité de la navigation maritime, adoptée en 1988"],
    proposals: [
      { name: "un tribunal régional spécialisé dans les affaires de piraterie", vec: { obl: .4, fin: .5, reg: .6, dro: .3 }, by: { reg: 1, dev: .5 } },
      { name: "des patrouilles navales internationales coordonnées", vec: { obl: .6, fin: .2, reg: -.5, dro: -.4 }, by: { sec: 1, sea: 1 } },
      { name: "un programme d'emploi et de pêche durable pour les communautés côtières", vec: { obl: -.3, fin: .6, reg: .3, dro: .4 }, by: { dev: 1, hr: .5 } }
    ],
    clauses: [
      { id: "p_crim", k: "rec", form: "act", obj: "les États", v: "Demande", inf: "ériger la piraterie en infraction pénale dans leur droit interne et poursuivre les auteurs présumés interpellés", fx: { obl: .35, dro: .05 }, tech: 1 },
      { id: "p_trial", k: "rec", form: "act", obj: "les États", v: "Engage", inf: "garantir aux suspects le respect des normes internationales relatives au procès équitable", fx: { dro: .45 } },
      { id: "p_assets", k: "art41", form: "bind", obj: "tous les États", v: "Décide", inf: "geler les fonds et ressources économiques des personnes qui financent des actes de piraterie, telles que désignées par un comité du Conseil", fx: { obl: .7, dro: -.2 } },
      { id: "p_jobs", k: "coop", form: "act", obj: "les États et les organisations régionales", v: "Encourage", inf: "appuyer des programmes de reconversion et de pêche durable dans les communautés côtières concernées", fx: { fin: .35, dro: .2, reg: .15 } }
    ],
    objectif: "une coopération internationale efficace contre la piraterie"
  },
  {
    id: "missions", title: "Protection des missions internationales dans les zones de crise", important: true,
    bodies: ["UNSC", "UNGA"], tags: ["sec", "mul"], axes: ["obl", "sup", "fin", "reg"],
    v: { objet: "la sûreté et la sécurité du personnel des missions internationales", court: "sécurité des missions internationales", but: "assurer la sûreté et la sécurité du personnel des missions internationales", but2: "la sécurité du personnel", outil: "un dispositif commun d'évaluation des menaces" },
    facts: [["Incidents de sécurité visant des missions en un an", 60, 300, ""], ["Membres du personnel évacués", 120, 900, ""], ["Bases de terrain sans plan d'évacuation à jour", 15, 45, " %"]],
    triggers: ["le pillage des entrepôts d'une mission internationale dans la région de {lieu}", "l'enlèvement de deux membres du personnel d'une mission d'observation, libérés {j} jours plus tard près de {lieu}", "des menaces répétées contre une mission d'assistance électorale dans la province de {lieu}"],
    background: "La Convention de 1994 sur la sécurité du personnel des Nations Unies et du personnel associé engage les États parties à protéger ce personnel et à poursuivre les auteurs d'attaques. La protection relève d'abord du pays hôte.",
    history: ["En {y1}, une évaluation indépendante a relevé des lacunes dans les plans d'évacuation.", "En {y2}, plusieurs pays contributeurs ont demandé une meilleure analyse des menaces avant chaque déploiement."],
    pre: ["Rappelant la Convention sur la sécurité du personnel des Nations Unies et du personnel associé, du 9 décembre 1994", "Rappelant que la responsabilité première de la protection du personnel international incombe au pays hôte"],
    proposals: [
      { name: "un dispositif commun d'évaluation des menaces et de réponse rapide", vec: { obl: .4, sup: .6, fin: .4, reg: -.4 }, by: { mul: 1, sec: .5 } },
      { name: "des accords de sécurité renforcés avec les pays hôtes", vec: { obl: .1, sup: -.3, fin: .1, reg: .3 }, by: { sov: 1 } },
      { name: "une protection confiée aux organisations régionales", vec: { obl: -.1, sup: .1, fin: .3, reg: .7 }, by: { reg: 1 } }
    ],
    clauses: [
      { id: "m_prosecute", k: "binding", form: "bind", obj: "tous les États", v: "Décide", inf: "poursuivre en justice les auteurs d'attaques contre le personnel des missions internationales se trouvant sur leur territoire", fx: { obl: .55, sup: .15 } },
      { id: "m_sofa", k: "rec", form: "act", obj: "les pays hôtes", v: "Demande", inf: "conclure avec chaque mission un accord précisant les garanties de sécurité accordées au personnel", fx: { obl: .2, reg: -.1 }, tech: 1 },
      { id: "m_mandate", k: "mission", form: "self", v: "Décide", inf: "renforcer, dans le mandat des missions concernées, les capacités de protection et d'évacuation du personnel", fx: { sup: .35, fin: .25 } },
      { id: "m_regional", k: "coop", form: "act", obj: "les organisations régionales", v: "Invite", inf: "contribuer à la protection des missions déployées dans leur région, en coordination avec l'Organisation", fx: { reg: .5 } }
    ],
    objectif: "une meilleure protection du personnel des missions internationales"
  },
  {
    id: "eau", title: "Prévention des crises liées aux ressources hydriques", important: true,
    bodies: ["UNSC", "UNGA", "ECOSOC"], tags: ["env", "dev"], axes: ["obl", "sup", "fin", "reg"],
    v: { objet: "la prévention des crises liées aux ressources en eau partagées", court: "coopération dans le domaine de l'eau", but: "prévenir les différends liés aux ressources en eau transfrontières", but2: "la préservation des ressources en eau", outil: "un mécanisme de diplomatie de l'eau" },
    facts: [["Population du bassin concerné", 8, 60, " millions d'habitants"], ["Baisse du débit moyen en dix ans", 12, 38, " %"], ["Accords de bassin en vigueur", 0, 2, ""]],
    triggers: ["une sécheresse historique qui a réduit de moitié le débit du fleuve {lieu}, ravivant les tensions entre les États riverains", "la mise en eau d'un grand barrage sur le cours supérieur du {lieu}, sans accord sur le partage des données hydrologiques", "la pollution accidentelle d'un aquifère partagé qui alimente {n} habitants de la région de {lieu}"],
    background: "En 2010, l'Assemblée générale a reconnu le droit à l'eau potable et à l'assainissement comme un droit de l'homme (résolution 64/292). De nombreux bassins transfrontières ne sont couverts par aucun accord de coopération.",
    history: ["En {y1}, une conférence régionale a proposé un partage volontaire des données hydrologiques.", "En {y2}, les négociations entre États riverains ont été suspendues faute d'accord sur les débits minimaux."],
    pre: ["Rappelant la résolution 64/292 de l'Assemblée générale, du 28 juillet 2010, sur le droit de l'homme à l'eau et à l'assainissement", "Rappelant le Programme de développement durable à l'horizon 2030, en particulier l'objectif 6"],
    proposals: [
      { name: "un mécanisme international de diplomatie de l'eau", vec: { obl: .3, sup: .6, fin: .3, reg: -.5 }, by: { mul: 1 } },
      { name: "des commissions de bassin régionales soutenues par un fonds dédié", vec: { obl: .1, sup: .1, fin: .7, reg: .7 }, by: { dev: 1, env: 1 } },
      { name: "un partage volontaire des données hydrologiques", vec: { obl: -.6, sup: -.3, fin: -.4, reg: .2 }, by: { sov: 1 } }
    ],
    clauses: [
      { id: "e_basin", k: "rec", form: "act", obj: "les États riverains", v: "Encourage", inf: "conclure ou actualiser des accords de bassin prévoyant l'échange régulier de données hydrologiques", fx: { obl: .25, reg: .25, sup: .15 }, tech: 1 },
      { id: "e_notify", k: "rec", form: "act", obj: "les États", v: "Demande", inf: "notifier à l'avance les projets d'infrastructures susceptibles de modifier le débit des cours d'eau partagés", fx: { obl: .3, sup: .2 } },
      { id: "e_experts", k: "body", form: "self", v: "Décide", inf: "créer un groupe d'experts chargé d'appuyer, à leur demande, les États riverains dans la prévention des différends liés à l'eau", fx: { sup: .3, reg: -.1 }, tech: 1 },
      { id: "e_finance", k: "coop", form: "act", obj: "les institutions financières internationales", v: "Invite", inf: "faciliter l'accès des pays en développement aux financements pour des infrastructures hydrauliques résilientes", fx: { fin: .45 } }
    ],
    objectif: "un cadre de prévention des crises liées à l'eau"
  },
  {
    id: "cyber", title: "Protection des infrastructures critiques contre les cyberincidents", important: true,
    bodies: ["UNSC", "UNGA"], tags: ["tec", "sec"], axes: ["obl", "sup", "rgl", "prv"],
    v: { objet: "la protection des infrastructures critiques contre les cyberincidents", court: "cybersécurité des infrastructures critiques", but: "protéger les infrastructures critiques contre les cyberincidents", but2: "la protection des infrastructures critiques", outil: "un réseau international de points de contact" },
    facts: [["Cyberincidents graves signalés sur des infrastructures critiques", 120, 900, ""], ["Hôpitaux touchés par des rançongiciels", 15, 140, ""], ["États dotés d'une équipe nationale d'intervention", 55, 85, " %"]],
    triggers: ["une attaque par rançongiciel qui a paralysé pendant {h} heures le réseau électrique de la ville de {lieu}, privant {n} foyers de courant", "une intrusion dans les systèmes de contrôle d'une station de traitement des eaux de {lieu}", "la mise hors service des systèmes de contrôle aérien de l'aéroport de {lieu} pendant {h} heures"],
    background: "Les États membres de l'ONU ont reconnu que le droit international, et en particulier la Charte, s'applique à l'utilisation des technologies de l'information et des communications, et ont adopté des normes volontaires de comportement responsable.",
    history: ["En {y1}, un séminaire régional a révélé qu'un tiers des États ne disposait pas de point de contact joignable en permanence.", "En {y2}, plusieurs entreprises du secteur numérique ont proposé un partage d'informations sur les vulnérabilités."],
    pre: ["Réaffirmant que le droit international, en particulier la Charte des Nations Unies, s'applique à l'utilisation des technologies de l'information et des communications", "Rappelant les normes volontaires et non contraignantes de comportement responsable des États dans le cyberespace"],
    proposals: [
      { name: "une convention contraignante sur la protection des infrastructures critiques", vec: { obl: .7, sup: .4, rgl: .6, prv: -.2 }, by: { mul: 1, rgl: 1 } },
      { name: "un réseau volontaire de points de contact et d'assistance mutuelle", vec: { obl: -.4, sup: .1, rgl: 0, prv: .2 }, by: { sov: .6, tec: .6 } },
      { name: "des partenariats public-privé pour la sécurité des réseaux", vec: { obl: -.3, sup: -.1, rgl: -.2, prv: .8 }, by: { mkt: 1, tec: 1 } }
    ],
    clauses: [
      { id: "c_poc", k: "rec", form: "act", obj: "les États", v: "Demande", inf: "désigner un point de contact national joignable en permanence en cas de cyberincident grave", fx: { sup: .2, obl: .1 }, tech: 1 },
      { id: "c_refrain", k: "rec", form: "act", obj: "les États", v: "Exhorte", inf: "s'abstenir de toute activité visant à endommager les infrastructures critiques d'un autre État", fx: { obl: .3, rgl: .2 } },
      { id: "c_vuln", k: "coop", form: "act", obj: "les entreprises du secteur numérique", v: "Encourage", inf: "partager avec les autorités compétentes les informations utiles sur les vulnérabilités critiques", fx: { prv: .35, rgl: .2 } },
      { id: "c_registry", k: "body", form: "self", v: "Décide", inf: "établir un registre volontaire des besoins et des offres d'assistance en matière de cybersécurité", fx: { sup: .15, obl: -.1, prv: .1 } }
    ],
    objectif: "une meilleure protection des infrastructures critiques"
  },
  {
    id: "education", title: "Accès universel à l'éducation",
    bodies: ["UNHRC", "UNGA", "ECOSOC", "UNESCO_GC", "UNESCO_PC"], pc: ["ED"], tags: ["dev", "hr"], axes: ["obl", "fin", "dro", "prv"],
    v: { objet: "l'accès universel à un enseignement de qualité, composante du droit à l'éducation", court: "accès à l'éducation", but: "garantir l'accès gratuit à l'enseignement primaire et secondaire", but2: "l'égalité d'accès à l'école", outil: "un plan d'action mondial" },
    facts: [["Enfants et adolescents non scolarisés dans la région", 2, 19, " millions"], ["Écoles endommagées ou fermées", 300, 4200, ""], ["Part des dépenses publiques consacrée à l'éducation", 6, 15, " %"]],
    triggers: ["la fermeture de {n2} écoles dans la région de {lieu} après des inondations", "la suppression des bourses destinées aux élèves des zones rurales de {lieu}", "une étude révélant que {p} % des filles de la région de {lieu} quittent l'école avant 15 ans"],
    background: "Le droit à l'éducation est consacré par l'article 26 de la Déclaration universelle des droits de l'homme. L'objectif de développement durable 4 vise une éducation de qualité pour tous d'ici à 2030.",
    history: ["En {y1}, un forum régional a fixé des objectifs communs de scolarisation sans prévoir de financement.", "En {y2}, le Secrétariat a constaté que la région était en retard sur la plupart des cibles de l'objectif 4."],
    pre: ["Rappelant l'article 26 de la Déclaration universelle des droits de l'homme", "Rappelant la Convention relative aux droits de l'enfant", "Rappelant l'objectif de développement durable 4"],
    proposals: [
      { name: "la gratuité de l'enseignement secondaire assortie d'un suivi international", vec: { obl: .6, fin: .4, dro: .7, prv: -.3 }, by: { hr: 1, mul: .5 } },
      { name: "un fonds mondial pour l'éducation dans les pays les moins avancés", vec: { obl: 0, fin: .8, dro: .3, prv: .1 }, by: { dev: 1 } },
      { name: "des partenariats avec le secteur privé pour équiper les écoles", vec: { obl: -.4, fin: -.2, dro: -.2, prv: .8 }, by: { mkt: 1 } }
    ],
    clauses: [
      { id: "ed_free", k: "rec", form: "act", obj: "les États", v: "Engage", inf: "garantir progressivement la gratuité de l'enseignement secondaire", fx: { obl: .35, dro: .35, fin: .15 } },
      { id: "ed_budget", k: "rec", form: "act", obj: "les États", v: "Encourage", inf: "consacrer à l'éducation au moins 4 à 6 % de leur produit intérieur brut ou 15 à 20 % de leurs dépenses publiques", fx: { fin: .4, obl: .2 }, tech: 1 },
      { id: "ed_girls", k: "rec", form: "act", obj: "les États", v: "Demande", inf: "lever les obstacles qui empêchent les filles et les enfants handicapés d'accéder à l'école", fx: { dro: .45 } },
      { id: "ed_private", k: "coop", form: "act", obj: "les entreprises et les fondations", v: "Invite", inf: "contribuer à l'équipement numérique des écoles des zones défavorisées", fx: { prv: .45 } }
    ],
    objectif: "un engagement commun pour l'accès universel à l'éducation"
  },
  {
    id: "journalistes", title: "Protection des journalistes",
    bodies: ["UNHRC", "UNGA", "UNESCO_GC", "UNESCO_PC"], pc: ["CI"], tags: ["hr"], axes: ["obl", "sup", "dro", "reg"],
    v: { objet: "la sécurité des journalistes et la lutte contre l'impunité", court: "sécurité des journalistes", but: "enquêter sur toutes les attaques visant des journalistes et poursuivre leurs auteurs", but2: "la sécurité des journalistes", outil: "un mécanisme de suivi des enquêtes" },
    facts: [["Journalistes victimes de violences en un an dans la région", 40, 260, ""], ["Affaires élucidées", 10, 25, " %"], ["Journalistes en détention", 20, 150, ""]],
    triggers: ["la mort d'une journaliste d'investigation dans la ville de {lieu}, dont l'enquête est au point mort depuis {mois} mois", "l'arrestation de {n3} reporters qui couvraient des manifestations à {lieu}", "la révélation d'une campagne de harcèlement en ligne visant les rédactions de {lieu}"],
    background: "Le Plan d'action des Nations Unies sur la sécurité des journalistes et la question de l'impunité, lancé en 2012, est coordonné par l'UNESCO. La grande majorité des meurtres de journalistes restent impunis.",
    history: ["En {y1}, une enquête régionale a montré que la plupart des menaces contre les journalistes n'étaient jamais signalées.", "En {y2}, plusieurs États ont créé des mécanismes nationaux de protection, aux résultats inégaux."],
    pre: ["Rappelant l'article 19 de la Déclaration universelle des droits de l'homme et l'article 19 du Pacte international relatif aux droits civils et politiques", "Rappelant le Plan d'action des Nations Unies sur la sécurité des journalistes et la question de l'impunité"],
    proposals: [
      { name: "un mécanisme international de suivi des enquêtes sur les attaques contre les journalistes", vec: { obl: .4, sup: .8, dro: .7, reg: -.4 }, by: { hr: 1 } },
      { name: "des mécanismes nationaux de protection appuyés par les organisations régionales", vec: { obl: .1, sup: .1, dro: .4, reg: .6 }, by: { reg: 1 } },
      { name: "une approche fondée sur la formation et la sécurité des journalistes", vec: { obl: -.5, sup: -.4, dro: -.2, reg: .1 }, by: { sov: 1 } }
    ],
    clauses: [
      { id: "j_inquiry", k: "rec", form: "act", obj: "les États", v: "Demande", inf: "mener des enquêtes impartiales, rapides et efficaces sur toutes les violences visant des journalistes", fx: { obl: .3, dro: .35 } },
      { id: "j_rapporteur", k: "rapporteur", form: "self", v: "Décide", inf: "nommer, pour une période de trois ans, un rapporteur spécial sur la sécurité des journalistes", fx: { sup: .55, dro: .3 } },
      { id: "j_national", k: "rec", form: "act", obj: "les États", v: "Encourage", inf: "mettre en place des mécanismes nationaux d'alerte et de protection des journalistes menacés", fx: { reg: .15, dro: .3, sup: .05 }, tech: 1 },
      { id: "j_dg", k: "report", form: "sec", obj: "{sg}", v: "Prie", inf: "rendre compte tous les deux ans de l'état des enquêtes judiciaires sur les violences visant des journalistes", fx: { sup: .35 }, tech: 1 }
    ],
    objectif: "une protection effective des journalistes et la fin de l'impunité"
  },
  {
    id: "discriminations", title: "Lutte contre les discriminations dans l'accès aux services publics",
    bodies: ["UNHRC", "UNGA", "ECOSOC"], tags: ["hr", "dev"], axes: ["obl", "sup", "dro", "fin"],
    v: { objet: "l'égalité d'accès aux services publics", court: "non-discrimination dans les services publics", but: "garantir l'égalité d'accès aux services publics sans discrimination", but2: "l'égalité d'accès aux services publics", outil: "un observatoire international" },
    facts: [["Personnes privées d'acte de naissance dans la région", 200000, 3500000, " personnes"], ["Écart d'accès aux soins entre zones rurales et urbaines", 18, 52, " points"], ["Plaintes pour discrimination enregistrées", 900, 12000, ""]],
    triggers: ["une enquête montrant que les habitants de la région de {lieu} attendent en moyenne {j} jours de plus que les autres pour obtenir des soins", "la numérisation obligatoire des démarches administratives à {lieu}, qui exclut de fait les personnes sans accès à internet", "le refus d'inscription à l'état civil opposé à {n2} familles nomades dans la province de {lieu}"],
    background: "Le principe de non-discrimination figure à l'article 2 de la Déclaration universelle des droits de l'homme. La cible 16.9 des objectifs de développement durable vise à garantir à tous une identité juridique, notamment grâce à l'enregistrement des naissances, d'ici à 2030.",
    history: ["En {y1}, un rapport a montré que l'absence de papiers d'identité était la première cause d'exclusion des services publics dans la région.", "En {y2}, plusieurs États ont accéléré la numérisation de leurs administrations sans prévoir d'alternative."],
    pre: ["Rappelant l'article 2 de la Déclaration universelle des droits de l'homme", "Rappelant la cible 16.9 du Programme de développement durable à l'horizon 2030, relative à l'identité juridique"],
    proposals: [
      { name: "un observatoire international des discriminations dans les services publics", vec: { obl: .3, sup: .7, dro: .6, fin: .2 }, by: { hr: 1, mul: .5 } },
      { name: "un programme d'appui à l'état civil et aux services de proximité", vec: { obl: 0, sup: 0, dro: .3, fin: .7 }, by: { dev: 1 } },
      { name: "des plans nationaux volontaires de simplification administrative", vec: { obl: -.5, sup: -.5, dro: -.1, fin: -.3 }, by: { sov: 1 } }
    ],
    clauses: [
      { id: "d_birth", k: "rec", form: "act", obj: "les États", v: "Demande", inf: "garantir l'enregistrement gratuit des naissances et la délivrance de documents d'identité à toutes les personnes", fx: { obl: .3, dro: .35, fin: .1 } },
      { id: "d_offline", k: "rec", form: "act", obj: "les États", v: "Encourage", inf: "maintenir un accès non numérique aux services publics essentiels", fx: { dro: .3, obl: .1 } },
      { id: "d_data", k: "rec", form: "act", obj: "les États", v: "Engage", inf: "collecter des données ventilées permettant de mesurer les inégalités d'accès aux services publics", fx: { sup: .25 }, tech: 1 }
    ],
    objectif: "l'égalité d'accès aux services publics"
  },
  {
    id: "deplaces", title: "Protection des populations déplacées par les catastrophes climatiques",
    bodies: ["UNHRC", "UNGA", "ECOSOC"], tags: ["env", "dev"], axes: ["obl", "fin", "dro", "reg"],
    v: { objet: "la protection des personnes déplacées par les catastrophes liées au climat", court: "déplacements liés au climat", but: "protéger les personnes déplacées par les catastrophes liées au climat", but2: "la protection des personnes déplacées", outil: "un cadre international de protection" },
    facts: [["Personnes déplacées dans la région en un an", 120000, 1800000, " personnes"], ["Déplacés vivant encore dans des abris temporaires après un an", 30, 70, " %"], ["Part des plans de relocalisation financée", 10, 35, " %"]],
    triggers: ["la submersion progressive de trois atolls de l'archipel de {lieu}, dont les habitants doivent être relocalisés", "des inondations qui ont déplacé {n} personnes dans le delta de {lieu}", "une sécheresse prolongée qui pousse les éleveurs de la région de {lieu} à franchir les frontières"],
    background: "Les Principes directeurs relatifs au déplacement de personnes à l'intérieur de leur propre pays (1998) couvrent aussi les déplacements liés aux catastrophes. Il n'existe pas de statut international spécifique pour les personnes qui franchissent une frontière à la suite d'une catastrophe climatique.",
    history: ["En {y1}, une initiative intergouvernementale a recensé les bonnes pratiques de protection temporaire.", "En {y2}, les États les plus exposés ont demandé un financement dédié aux relocalisations planifiées."],
    pre: ["Rappelant les Principes directeurs relatifs au déplacement de personnes à l'intérieur de leur propre pays", "Rappelant le Cadre de Sendai pour la réduction des risques de catastrophe 2015-2030"],
    proposals: [
      { name: "un cadre international de protection des personnes déplacées à travers les frontières", vec: { obl: .6, fin: .3, dro: .7, reg: -.4 }, by: { hr: 1, env: .6 } },
      { name: "un fonds pour la relocalisation planifiée des communautés vulnérables", vec: { obl: 0, fin: .8, dro: .3, reg: .3 }, by: { dev: 1, env: 1 } },
      { name: "des accords régionaux volontaires de mobilité", vec: { obl: -.5, fin: -.2, dro: .1, reg: .7 }, by: { reg: 1, sov: .5 } }
    ],
    clauses: [
      { id: "dp_policies", k: "rec", form: "act", obj: "les États", v: "Engage", inf: "intégrer les déplacements liés aux catastrophes dans leurs politiques de réduction des risques et d'adaptation", fx: { obl: .15, dro: .1 }, tech: 1 },
      { id: "dp_temp", k: "rec", form: "act", obj: "les États", v: "Encourage", inf: "accorder une protection temporaire aux personnes qui franchissent leur frontière à la suite d'une catastrophe soudaine", fx: { dro: .45, obl: .2 } },
      { id: "dp_fund", k: "coop", form: "act", obj: "les pays développés", v: "Demande", inf: "accroître leur soutien financier aux plans de relocalisation planifiée des pays les plus vulnérables", fx: { fin: .5 } },
      { id: "dp_regional", k: "coop", form: "act", obj: "les organisations régionales", v: "Encourage", inf: "élaborer des accords de libre circulation tenant compte des catastrophes", fx: { reg: .45 } }
    ],
    objectif: "une meilleure protection des personnes déplacées par les catastrophes"
  },
  {
    id: "surveillance", title: "Encadrement des technologies de surveillance",
    bodies: ["UNHRC", "UNGA"], tags: ["tec", "hr"], axes: ["obl", "sup", "rgl", "prv"],
    v: { objet: "l'encadrement des technologies de surveillance au regard du droit à la vie privée", court: "technologies de surveillance", but: "encadrer l'exportation et l'utilisation des technologies de surveillance", but2: "la protection de la vie privée", outil: "un moratoire" },
    mods: { rgl: { hr: .2 } },
    facts: [["États ayant acquis des logiciels espions commerciaux", 40, 75, ""], ["Militants et journalistes ciblés identifiés", 150, 1400, ""], ["États dotés d'une autorité indépendante de protection des données", 50, 80, " %"]],
    triggers: ["la découverte d'un logiciel espion sur les téléphones de {n3} avocats et journalistes de {lieu}", "le déploiement de la reconnaissance faciale en temps réel dans l'espace public de la ville de {lieu}", "la fuite d'une base de données de surveillance contenant les informations personnelles de {n} personnes"],
    background: "L'article 17 du Pacte international relatif aux droits civils et politiques protège contre les immixtions arbitraires dans la vie privée. Depuis 2013, l'Assemblée générale adopte des résolutions sur le droit à la vie privée à l'ère du numérique.",
    history: ["En {y1}, un rapport du Haut-Commissariat a appelé à encadrer la vente de logiciels espions.", "En {y2}, plusieurs entreprises du secteur ont adopté des principes volontaires jugés insuffisants par la société civile."],
    pre: ["Rappelant l'article 12 de la Déclaration universelle des droits de l'homme et l'article 17 du Pacte international relatif aux droits civils et politiques", "Rappelant les résolutions de l'Assemblée générale sur le droit à la vie privée à l'ère du numérique"],
    proposals: [
      { name: "un moratoire sur la vente de logiciels espions jusqu'à l'adoption de garanties", vec: { obl: .7, sup: .5, rgl: .8, prv: -.4 }, by: { hr: 1, rgl: 1 } },
      { name: "des contrôles nationaux des exportations harmonisés", vec: { obl: .2, sup: .1, rgl: .4, prv: 0 }, by: { sec: .6, mul: .6 } },
      { name: "des principes volontaires de diligence pour les entreprises", vec: { obl: -.6, sup: -.3, rgl: -.2, prv: .7 }, by: { mkt: 1, tec: .6 } }
    ],
    clauses: [
      { id: "s_judge", k: "rec", form: "act", obj: "les États", v: "Demande", inf: "soumettre l'utilisation des technologies de surveillance à une autorisation judiciaire préalable et à un contrôle indépendant", fx: { rgl: .45, obl: .2, sup: .15 } },
      { id: "s_moratorium", k: "rec", form: "act", obj: "les États", v: "Exhorte", inf: "instaurer un moratoire sur la vente et le transfert de logiciels espions tant que des garanties conformes aux droits de l'homme ne sont pas en place", fx: { rgl: .6, obl: .3, prv: -.3 } },
      { id: "s_diligence", k: "coop", form: "act", obj: "les entreprises", v: "Engage", inf: "exercer une diligence raisonnable en matière de droits de l'homme avant toute vente de technologies de surveillance", fx: { prv: .25, rgl: .25 } }
    ],
    objectif: "un encadrement des technologies de surveillance respectueux des droits"
  },
  {
    id: "tourisme", title: "Protection du patrimoine culturel menacé par le tourisme de masse",
    bodies: ["WHC", "UNESCO_GC", "UNESCO_EB", "UNESCO_PC"], pc: ["CLT"], tags: ["cul", "tou"], axes: ["obl", "fin", "res", "prv"],
    v: { objet: "la protection des sites du patrimoine face au tourisme de masse", court: "tourisme durable sur les sites patrimoniaux", but: "limiter les effets du tourisme de masse sur les sites patrimoniaux", but2: "la protection des sites patrimoniaux", outil: "des plans de gestion des flux" },
    mods: { res: { cul: .2, tou: -.3 }, prv: { tou: .2 } },
    facts: [["Visiteurs annuels du site", 2000000, 14000000, " visiteurs"], ["Hausse de la fréquentation en cinq ans", 40, 210, " %"], ["Part des recettes touristiques réinvestie dans la conservation", 2, 12, " %"]],
    triggers: ["l'effondrement partiel d'une muraille de la ville historique de {lieu}, attribué à la surfréquentation", "l'arrivée simultanée de {n4} navires de croisière dans le port historique de {lieu}", "le départ de la quasi-totalité des habitants du centre historique de {lieu}, remplacés par des locations touristiques"],
    background: "La Convention de 1972 concernant la protection du patrimoine mondial culturel et naturel engage les États parties à assurer la protection et la conservation des biens situés sur leur territoire. Le tourisme est aussi une ressource essentielle pour de nombreux sites.",
    history: ["En {y1}, une mission de conseil a recommandé de plafonner la fréquentation aux heures de pointe.", "En {y2}, les autorités locales ont expérimenté une réservation obligatoire, abandonnée sous la pression des professionnels du tourisme."],
    pre: ["Rappelant la Convention concernant la protection du patrimoine mondial, culturel et naturel, adoptée le 16 novembre 1972", "Rappelant le Programme de l'UNESCO sur le patrimoine mondial et le tourisme durable"],
    proposals: [
      { name: "des quotas de fréquentation contraignants pour les sites les plus menacés", vec: { obl: .5, fin: .1, res: .8, prv: -.3 }, by: { cul: 1, mul: .5 } },
      { name: "une taxe de séjour patrimoniale affectée à la conservation", vec: { obl: .2, fin: .6, res: .3, prv: .1 }, by: { dev: .6, cul: .6 } },
      { name: "un label volontaire de tourisme responsable avec les opérateurs", vec: { obl: -.6, fin: -.2, res: -.5, prv: .8 }, by: { tou: 1, mkt: 1 } }
    ],
    clauses: [
      { id: "t_danger", k: "danger", form: "self", v: "Décide", inf: "inscrire la ville historique de {lieu} sur la Liste du patrimoine mondial en péril", fx: { res: .5, obl: .2 } },
      { id: "t_mission", k: "monitor", form: "self", v: "Décide", inf: "dépêcher une mission conjointe de suivi réactif du Centre du patrimoine mondial et de l'ICOMOS dans la ville historique de {lieu}", fx: { res: .1, obl: .05 }, tech: 1 },
      { id: "t_flows", k: "rec", form: "act", obj: "les États parties", v: "Demande", inf: "adopter des plans de gestion des flux de visiteurs pour les biens les plus fréquentés", fx: { res: .35, obl: .15 }, tech: 1 },
      { id: "t_revenue", k: "rec", form: "act", obj: "les États parties", v: "Encourage", inf: "affecter une part des recettes touristiques à la conservation des sites", fx: { fin: .4, res: .1 } },
      { id: "t_charter", k: "coop", form: "act", obj: "les opérateurs touristiques", v: "Invite", inf: "adhérer à des chartes de tourisme responsable élaborées avec les gestionnaires de sites", fx: { prv: .45, res: -.15 } }
    ],
    objectif: "une gestion durable du tourisme sur les sites patrimoniaux"
  },
  {
    id: "climat_patrimoine", title: "Biens du patrimoine mondial face au changement climatique",
    bodies: ["WHC", "UNESCO_GC"], tags: ["env", "cul"], axes: ["obl", "fin", "res", "prv"],
    v: { objet: "la protection des biens du patrimoine mondial face aux effets du changement climatique", court: "adaptation du patrimoine au changement climatique", but: "protéger les biens du patrimoine mondial contre les effets du changement climatique", but2: "la protection des biens menacés", outil: "des plans d'adaptation" },
    facts: [["Biens du patrimoine mondial exposés à la montée des eaux dans la région", 6, 40, ""], ["Coût estimé des travaux d'adaptation", 30, 400, " millions de dollars"], ["Biens disposant d'un plan d'adaptation", 5, 30, " %"]],
    triggers: ["le blanchissement massif du récif corallien de {lieu}, inscrit sur la Liste du patrimoine mondial", "l'érosion côtière qui menace les vestiges du port antique de {lieu}", "des incendies sans précédent aux abords du site naturel de {lieu}"],
    background: "Selon les évaluations de l'UNESCO et de l'UICN, le changement climatique est devenu l'une des principales menaces pesant sur les biens du patrimoine mondial, en particulier les biens naturels.",
    history: ["En {y1}, une étude a recensé les biens de la région les plus exposés à la montée des eaux.", "En {y2}, les demandes d'assistance internationale ont dépassé les moyens disponibles du Fonds du patrimoine mondial."],
    pre: ["Rappelant la Convention concernant la protection du patrimoine mondial, culturel et naturel, adoptée le 16 novembre 1972", "Rappelant l'Accord de Paris adopté en 2015"],
    proposals: [
      { name: "l'inscription systématique sur la Liste en péril des biens gravement menacés", vec: { obl: .4, fin: .2, res: .6, prv: -.2 }, by: { env: 1, mul: .5 } },
      { name: "un fonds d'adaptation pour les biens des pays les plus vulnérables", vec: { obl: 0, fin: .8, res: .1, prv: 0 }, by: { dev: 1, env: 1 } },
      { name: "des plans d'adaptation volontaires définis par chaque État partie", vec: { obl: -.6, fin: -.3, res: -.3, prv: .3 }, by: { sov: 1 } }
    ],
    clauses: [
      { id: "cp_danger", k: "danger", form: "self", v: "Décide", inf: "inscrire le site de {lieu} sur la Liste du patrimoine mondial en péril", fx: { res: .4, obl: .15 } },
      { id: "cp_mission", k: "monitor", form: "self", v: "Décide", inf: "dépêcher une mission de suivi réactif conjointe avec l'UICN sur le site de {lieu}", fx: { obl: .05 }, tech: 1 },
      { id: "cp_plans", k: "rec", form: "act", obj: "les États parties", v: "Demande", inf: "intégrer l'adaptation au changement climatique dans les plans de gestion de leurs biens", fx: { obl: .2, res: .1 }, tech: 1 },
      { id: "cp_fund", k: "volfund", form: "self", v: "Décide", inf: "accorder une assistance internationale d'urgence au titre du Fonds du patrimoine mondial pour la protection du site de {lieu}", fx: { fin: .45 } }
    ],
    objectif: "l'adaptation des biens du patrimoine mondial au changement climatique"
  },
  {
    id: "langues", title: "Préservation des langues en voie de disparition",
    bodies: ["ICH", "UNESCO_GC", "UNESCO_EB", "UNESCO_PC"], pc: ["CLT", "ED"], tags: ["cul", "dev"], axes: ["obl", "fin", "opn", "dro"],
    v: { objet: "la sauvegarde des langues en danger", court: "diversité linguistique", but: "garantir l'enseignement et l'usage public des langues en danger", but2: "la sauvegarde des langues en danger", outil: "des programmes de transmission" },
    facts: [["Langues de la région considérées comme en danger", 12, 90, ""], ["Locuteurs de moins de 20 ans", 3, 22, " %"], ["Écoles proposant un enseignement bilingue", 2, 15, " %"]],
    triggers: ["le décès du dernier locuteur natif d'une langue de la vallée de {lieu}", "la suppression de l'enseignement bilingue dans les écoles de la région de {lieu}", "la dégradation d'archives sonores réunissant {n5} heures de récits oraux de la région de {lieu}"],
    background: "L'Assemblée générale a proclamé la Décennie internationale des langues autochtones (2022-2032), dont l'UNESCO est l'agence chef de file. Une langue cesse d'être transmise lorsque les enfants ne l'apprennent plus.",
    history: ["En {y1}, un atlas régional a classé plus de la moitié des langues de la région comme vulnérables ou en danger.", "En {y2}, plusieurs communautés ont demandé l'accès aux enregistrements conservés dans des institutions étrangères."],
    pre: ["Rappelant la Convention pour la sauvegarde du patrimoine culturel immatériel, adoptée le 17 octobre 2003", "Rappelant la Décennie internationale des langues autochtones (2022-2032)"],
    proposals: [
      { name: "un droit à l'enseignement dans les langues en danger", vec: { obl: .6, fin: .3, opn: .2, dro: .7 }, by: { hr: 1, cul: .5 } },
      { name: "un programme international de documentation et de numérisation ouvert", vec: { obl: -.2, fin: .5, opn: .8, dro: .2 }, by: { opn: 1, dev: .5 } },
      { name: "des initiatives communautaires volontaires", vec: { obl: -.6, fin: -.1, opn: 0, dro: .1 }, by: { sov: 1 } }
    ],
    clauses: [
      { id: "l_urgent", k: "urgent", form: "self", v: "Décide", inf: "inscrire les traditions orales de la vallée de {lieu} sur la Liste du patrimoine culturel immatériel nécessitant une sauvegarde urgente", fx: { obl: .15, fin: .15 } },
      { id: "l_bilingual", k: "rec", form: "act", obj: "les États", v: "Encourage", inf: "favoriser l'enseignement bilingue dans les régions où des langues en danger sont parlées", fx: { dro: .35, obl: .15 } },
      { id: "l_open", k: "coop", form: "act", obj: "les États et les institutions de recherche", v: "Invite", inf: "rendre librement accessibles les enregistrements et les dictionnaires des langues en danger, avec le consentement des communautés", fx: { opn: .5, dro: .1 } },
      { id: "l_fund", k: "volfund", form: "self", v: "Décide", inf: "accorder une assistance internationale au titre du Fonds du patrimoine culturel immatériel pour un programme de transmission intergénérationnelle", fx: { fin: .45 }, bodies: ["ICH"] }
    ],
    objectif: "la sauvegarde et la transmission des langues en danger"
  },
  {
    id: "savoirfaire", title: "Sauvegarde des savoir-faire artisanaux menacés",
    bodies: ["ICH", "UNESCO_PC"], pc: ["CLT"], tags: ["cul", "mkt"], axes: ["obl", "fin", "prv", "opn"],
    v: { objet: "la sauvegarde des savoir-faire artisanaux traditionnels", court: "savoir-faire traditionnels", but: "assurer la transmission des savoir-faire artisanaux traditionnels", but2: "la sauvegarde des savoir-faire", outil: "des programmes de transmission" },
    facts: [["Maîtres artisans encore en activité", 12, 140, ""], ["Âge moyen des praticiens", 58, 74, " ans"], ["Imitations industrielles vendues comme artisanales", 30, 80, " %"]],
    triggers: ["la fermeture annoncée de l'atelier de tissage de {lieu}, dernier lieu de transmission d'une technique séculaire", "la mise en vente massive d'imitations industrielles de la céramique traditionnelle de {lieu}", "le dépôt par une entreprise d'une marque reprenant un motif traditionnel de la communauté de {lieu}"],
    background: "La Convention de 2003 pour la sauvegarde du patrimoine culturel immatériel couvre les savoir-faire liés à l'artisanat traditionnel et prévoit la participation des communautés concernées à leur sauvegarde.",
    history: ["En {y1}, un inventaire national a recensé moins de cent praticiens actifs.", "En {y2}, une coopérative d'artisans a demandé une protection contre les imitations industrielles."],
    pre: ["Rappelant la Convention pour la sauvegarde du patrimoine culturel immatériel de 2003, notamment son article 2", "Rappelant les Principes éthiques pour la sauvegarde du patrimoine culturel immatériel"],
    proposals: [
      { name: "une protection juridique des appellations artisanales", vec: { obl: .6, fin: .1, prv: -.3, opn: -.4 }, by: { cul: 1, sov: .4 } },
      { name: "des bourses de transmission financées par le Fonds du patrimoine immatériel", vec: { obl: 0, fin: .8, prv: 0, opn: .2 }, by: { dev: 1 } },
      { name: "des partenariats avec le design et le commerce équitable", vec: { obl: -.5, fin: -.1, prv: .8, opn: .1 }, by: { mkt: 1 } }
    ],
    clauses: [
      { id: "sf_urgent", k: "urgent", form: "self", v: "Décide", inf: "inscrire le savoir-faire du tissage de {lieu} sur la Liste du patrimoine culturel immatériel nécessitant une sauvegarde urgente", fx: { obl: .15, fin: .15 } },
      { id: "sf_fund", k: "volfund", form: "self", v: "Décide", inf: "accorder une assistance internationale au titre du Fonds du patrimoine culturel immatériel pour des programmes de transmission entre maîtres et apprentis", fx: { fin: .5 }, bodies: ["ICH"] },
      { id: "sf_protect", k: "rec", form: "act", obj: "les États parties", v: "Encourage", inf: "protéger les communautés contre l'appropriation abusive de leurs savoir-faire et de leurs motifs traditionnels", fx: { obl: .3, opn: -.3 } },
      { id: "sf_fair", k: "coop", form: "act", obj: "les acteurs du commerce équitable", v: "Invite", inf: "associer les communautés détentrices à la valorisation de leurs savoir-faire", fx: { prv: .4 } }
    ],
    objectif: "la transmission des savoir-faire artisanaux menacés"
  },
  {
    id: "ia_education", title: "Intelligence artificielle et avenir de l'éducation",
    bodies: ["UNESCO_GC", "UNESCO_EB", "UNESCO_PC", "ECOSOC", "UNGA"], pc: ["ED"], tags: ["tec", "dev"], axes: ["obl", "rgl", "opn", "prv"],
    v: { objet: "l'usage de l'intelligence artificielle dans l'éducation", court: "intelligence artificielle dans l'éducation", but: "encadrer l'usage de l'intelligence artificielle dans les systèmes éducatifs", but2: "la protection des élèves", outil: "des lignes directrices internationales" },
    facts: [["Élèves utilisant chaque semaine un outil d'IA générative", 35, 80, " %"], ["Enseignants formés à l'IA", 5, 30, " %"], ["Écoles sans connexion internet fiable dans la région", 20, 60, " %"]],
    triggers: ["la fuite des données de {n} élèves collectées par une plateforme éducative utilisant l'IA", "la décision de la ville de {lieu} de remplacer une partie des cours par des tuteurs automatisés", "une étude montrant un écart croissant de résultats entre élèves équipés et non équipés dans la région de {lieu}"],
    background: "En 2021, la Conférence générale de l'UNESCO a adopté la Recommandation sur l'éthique de l'intelligence artificielle, premier instrument normatif mondial sur le sujet. L'arrivée des outils d'IA générative à l'école pose des questions de protection des données, d'équité et de pédagogie.",
    history: ["En {y1}, une enquête a montré que la plupart des établissements n'avaient aucune règle sur l'usage de l'IA.", "En {y2}, plusieurs ministères ont publié des recommandations nationales divergentes."],
    pre: ["Rappelant la Recommandation de l'UNESCO sur l'éthique de l'intelligence artificielle, adoptée en 2021", "Rappelant l'objectif de développement durable 4"],
    proposals: [
      { name: "des règles contraignantes de protection des données des élèves", vec: { obl: .6, rgl: .8, opn: .1, prv: -.3 }, by: { rgl: 1, hr: .5 } },
      { name: "des ressources éducatives libres et des outils d'IA ouverts", vec: { obl: -.1, rgl: .2, opn: .8, prv: -.1 }, by: { opn: 1, dev: .5 } },
      { name: "des partenariats avec l'industrie technologique pour équiper les écoles", vec: { obl: -.5, rgl: -.4, opn: -.3, prv: .8 }, by: { mkt: 1, tec: 1 } }
    ],
    clauses: [
      { id: "ia_age", k: "rec", form: "act", obj: "les États", v: "Engage", inf: "fixer un âge minimal et des garanties de protection des données pour l'usage d'outils d'IA générative à l'école", fx: { rgl: .5, obl: .25 }, tech: 1 },
      { id: "ia_open", k: "coop", form: "act", obj: "les États", v: "Encourage", inf: "promouvoir des ressources éducatives libres et des outils d'IA ouverts adaptés aux langues locales", fx: { opn: .5 } },
      { id: "ia_teachers", k: "coop", form: "act", obj: "les États", v: "Encourage", inf: "former les enseignants à un usage critique et responsable de l'intelligence artificielle", fx: { rgl: .1 }, tech: 1 },
      { id: "ia_transparency", k: "coop", form: "act", obj: "les entreprises technologiques", v: "Invite", inf: "garantir la transparence des algorithmes utilisés dans les outils éducatifs", fx: { rgl: .35, prv: .15 } }
    ],
    objectif: "un usage de l'intelligence artificielle au service de l'éducation"
  },
  {
    id: "commerce", title: "Régulation de la commercialisation du patrimoine mondial",
    bodies: ["WHC", "UNESCO_GC", "UNESCO_PC"], pc: ["CLT"], tags: ["cul", "mkt"], axes: ["obl", "res", "prv", "fin"],
    v: { objet: "l'encadrement de l'exploitation commerciale du patrimoine mondial", court: "commercialisation du patrimoine", but: "encadrer l'exploitation commerciale du nom, de l'image et des biens du patrimoine mondial", but2: "l'intégrité du patrimoine", outil: "une charte d'utilisation" },
    mods: { res: { mkt: -.3 } },
    facts: [["Produits utilisant l'emblème sans autorisation", 300, 5000, ""], ["Biens culturels vendus en ligne sans provenance établie", 1200, 15000, ""], ["Recettes reversées aux gestionnaires de sites", 1, 8, " %"]],
    triggers: ["la vente aux enchères en ligne de {n6} objets présentés comme provenant du site de {lieu}, sans certificat d'origine", "le dépôt, par une entreprise privée, de la marque « {lieu} » pour des produits touristiques", "une campagne publicitaire utilisant l'image du site de {lieu} sans l'accord des communautés locales"],
    background: "La Convention de l'UNESCO de 1970 vise à interdire et empêcher l'importation, l'exportation et le transfert de propriété illicites des biens culturels. La vente en ligne a multiplié les transactions difficiles à contrôler.",
    history: ["En {y1}, un groupe d'experts a recensé les plateformes où circulent des biens sans provenance établie.", "En {y2}, plusieurs gestionnaires de sites ont dénoncé l'usage commercial de leur image sans contrepartie."],
    pre: ["Rappelant la Convention concernant les mesures à prendre pour interdire et empêcher l'importation, l'exportation et le transfert de propriété illicites des biens culturels, adoptée le 14 novembre 1970", "Rappelant la Convention concernant la protection du patrimoine mondial, culturel et naturel de 1972"],
    proposals: [
      { name: "l'interdiction de la vente en ligne de biens culturels sans certificat de provenance", vec: { obl: .6, res: .8, prv: -.4, fin: 0 }, by: { cul: 1, rgl: .6 } },
      { name: "un partage des recettes au profit des communautés et de la conservation", vec: { obl: .1, res: .2, prv: .1, fin: .7 }, by: { dev: 1 } },
      { name: "une charte volontaire des plateformes et des marques", vec: { obl: -.6, res: -.4, prv: .8, fin: -.2 }, by: { mkt: 1 } }
    ],
    clauses: [
      { id: "co_cert", k: "rec", form: "act", obj: "les États", v: "Demande", inf: "exiger un certificat de provenance pour toute vente de biens culturels sur les plateformes en ligne", fx: { res: .5, obl: .25, prv: -.2 } },
      { id: "co_remove", k: "coop", form: "act", obj: "les plateformes de vente en ligne", v: "Invite", inf: "retirer sans délai les annonces de biens culturels dont la provenance licite n'est pas établie", fx: { prv: .2, res: .35 } },
      { id: "co_benefit", k: "rec", form: "act", obj: "les États parties", v: "Encourage", inf: "veiller à ce que l'usage commercial du nom et de l'image des biens du patrimoine mondial bénéficie à leur conservation et aux communautés locales", fx: { fin: .35, res: .15 } },
      { id: "co_emblem", k: "body", form: "self", v: "Décide", inf: "élaborer des orientations sur l'utilisation à des fins commerciales de l'emblème du patrimoine mondial", fx: { res: .25, obl: .1 }, tech: 1 }
    ],
    objectif: "un encadrement de la commercialisation du patrimoine"
  },
  {
    id: "archives", title: "Protection des archives historiques et numériques",
    bodies: ["UNESCO_GC", "UNESCO_EB", "UNESCO_PC"], pc: ["CI"], tags: ["cul", "tec"], axes: ["obl", "fin", "opn", "rgl"],
    v: { objet: "la préservation des archives historiques et du patrimoine numérique", court: "préservation des archives", but: "préserver et rendre accessibles les archives historiques et numériques", but2: "la préservation des archives", outil: "un programme de sauvegarde" },
    facts: [["Documents d'archives menacés de dégradation", 200000, 6000000, " documents"], ["Sites web publics disparus en dix ans", 25, 45, " %"], ["Archives numérisées dans la région", 3, 18, " %"]],
    triggers: ["l'incendie du dépôt des archives nationales de {lieu}, qui conservait des registres de plus de trois siècles", "la fermeture d'un service d'hébergement, qui a fait disparaître {n} pages publiques", "la dégradation accélérée des bandes magnétiques qui conservent les archives de la radio de {lieu}"],
    background: "Le programme Mémoire du monde, lancé par l'UNESCO en 1992, vise à préserver le patrimoine documentaire. Une recommandation adoptée en 2015 porte sur sa préservation et son accessibilité, y compris sous forme numérique.",
    history: ["En {y1}, un recensement a montré que la plupart des archives de la région n'avaient aucune copie de sauvegarde.", "En {y2}, plusieurs bibliothèques nationales ont commencé à collecter le web public, avec des moyens très inégaux."],
    pre: ["Rappelant la Recommandation concernant la préservation et l'accessibilité du patrimoine documentaire, y compris le patrimoine numérique, adoptée en 2015", "Rappelant le programme Mémoire du monde"],
    proposals: [
      { name: "une obligation de dépôt légal numérique et de conservation", vec: { obl: .6, fin: .3, opn: .2, rgl: .5 }, by: { rgl: 1, cul: .5 } },
      { name: "un fonds international de numérisation pour les pays en développement", vec: { obl: 0, fin: .8, opn: .5, rgl: 0 }, by: { dev: 1 } },
      { name: "une coopération volontaire entre bibliothèques et entreprises du numérique", vec: { obl: -.6, fin: -.3, opn: .2, rgl: -.4 }, by: { mkt: 1, tec: .5 } }
    ],
    clauses: [
      { id: "a_legal", k: "rec", form: "act", obj: "les États", v: "Encourage", inf: "étendre le dépôt légal aux publications numériques et aux sites web d'intérêt public", fx: { obl: .3, rgl: .3 }, tech: 1 },
      { id: "a_emergency", k: "rec", form: "act", obj: "les États", v: "Engage", inf: "élaborer des plans d'urgence pour la protection des archives en cas de catastrophe", fx: { obl: .1, fin: .1 }, tech: 1 },
      { id: "a_online", k: "coop", form: "act", obj: "les institutions d'archives", v: "Invite", inf: "rendre accessibles en ligne les fonds numérisés relevant du domaine public", fx: { opn: .5 } }
    ],
    objectif: "la préservation et l'accès aux archives historiques et numériques"
  },
  {
    id: "science", title: "Accès aux ressources scientifiques",
    bodies: ["UNESCO_GC", "UNESCO_EB", "UNESCO_PC", "ECOSOC"], pc: ["SC"], tags: ["opn", "dev", "tec"], axes: ["obl", "fin", "opn", "prv"],
    v: { objet: "l'accès aux ressources scientifiques et la science ouverte", court: "science ouverte", but: "garantir un accès ouvert aux publications et aux données scientifiques financées sur fonds publics", but2: "l'accès aux connaissances", outil: "une infrastructure mondiale de science ouverte" },
    mods: { opn: { tec: -.15 } },
    facts: [["Articles scientifiques en accès payant", 40, 65, " %"], ["Coût annuel des abonnements d'une université", 400000, 2500000, " dollars"], ["Chercheurs de la région sans accès aux grandes revues", 30, 70, " %"]],
    triggers: ["la résiliation, faute de moyens, des abonnements scientifiques de toutes les universités publiques de {lieu}", "le passage à un modèle payant d'une base de données climatiques jusqu'alors gratuite", "une épidémie régionale à {lieu} révélant que les données de séquençage restaient inaccessibles aux laboratoires locaux"],
    background: "La Recommandation de l'UNESCO sur une science ouverte, adoptée en 2021, encourage l'accès ouvert aux publications, aux données et aux infrastructures scientifiques. L'article 27 de la Déclaration universelle reconnaît le droit de participer au progrès scientifique.",
    history: ["En {y1}, un consortium régional a tenté sans succès de négocier un accord collectif avec les éditeurs.", "En {y2}, plusieurs agences de financement ont imposé l'accès ouvert aux recherches qu'elles financent."],
    pre: ["Rappelant la Recommandation de l'UNESCO sur une science ouverte, adoptée en 2021", "Rappelant l'article 27 de la Déclaration universelle des droits de l'homme"],
    proposals: [
      { name: "l'accès ouvert obligatoire aux recherches financées sur fonds publics", vec: { obl: .7, fin: .1, opn: .9, prv: -.4 }, by: { opn: 1, mul: .5 } },
      { name: "un fonds de soutien aux infrastructures de recherche des pays en développement", vec: { obl: 0, fin: .8, opn: .5, prv: 0 }, by: { dev: 1 } },
      { name: "des accords négociés avec les éditeurs scientifiques", vec: { obl: -.5, fin: -.2, opn: .1, prv: .7 }, by: { mkt: 1, tec: .6 } }
    ],
    clauses: [
      { id: "sc_open", k: "rec", form: "act", obj: "les États", v: "Engage", inf: "veiller à ce que les publications issues de recherches financées sur fonds publics soient librement accessibles dans un délai de douze mois", fx: { opn: .55, obl: .25, prv: -.2 }, tech: 1 },
      { id: "sc_tiered", k: "coop", form: "act", obj: "les États et les éditeurs", v: "Encourage", inf: "négocier des tarifs différenciés pour les institutions des pays en développement", fx: { prv: .35, fin: .1, opn: .15 } },
      { id: "sc_infra", k: "coop", form: "act", obj: "les États", v: "Encourage", inf: "soutenir des infrastructures publiques de données et d'archives ouvertes", fx: { opn: .35, fin: .25 } }
    ],
    objectif: "un meilleur accès aux ressources scientifiques"
  },
  {
    id: "subaquatique", title: "Protection du patrimoine culturel subaquatique",
    bodies: ["UNESCO_GC", "UNESCO_EB", "UNESCO_PC"], pc: ["CLT"], tags: ["cul", "sea"], axes: ["obl", "sup", "res", "prv"],
    v: { objet: "la protection du patrimoine culturel subaquatique", court: "patrimoine subaquatique", but: "protéger les épaves et les sites engloutis contre le pillage et l'exploitation commerciale", but2: "la protection des sites engloutis", outil: "un registre international" },
    facts: [["Épaves historiques recensées dans la zone", 80, 900, ""], ["Sites pillés ou endommagés en dix ans", 15, 55, " %"], ["Plongées non déclarées détectées", 200, 2500, ""]],
    triggers: ["la découverte du pillage de l'épave d'un navire du XVIIe siècle au large de {lieu}", "le projet d'une entreprise de récupérer et vendre la cargaison d'une épave historique dans les eaux de {lieu}", "l'endommagement d'un site englouti lors de la pose d'un câble sous-marin près de {lieu}"],
    background: "La Convention de 2001 sur la protection du patrimoine culturel subaquatique interdit l'exploitation commerciale de ce patrimoine et privilégie sa conservation in situ.",
    history: ["En {y1}, une campagne de prospection a recensé de nombreuses épaves non protégées dans la zone.", "En {y2}, des objets issus d'épaves sont apparus dans des ventes aux enchères internationales."],
    pre: ["Rappelant la Convention sur la protection du patrimoine culturel subaquatique, adoptée le 2 novembre 2001", "Rappelant la Convention des Nations Unies sur le droit de la mer, notamment ses articles 149 et 303"],
    proposals: [
      { name: "l'interdiction stricte de toute récupération commerciale", vec: { obl: .6, sup: .4, res: .8, prv: -.6 }, by: { cul: 1 } },
      { name: "un registre international et des inspections conjointes", vec: { obl: .3, sup: .7, res: .3, prv: -.1 }, by: { mul: 1 } },
      { name: "des partenariats encadrés avec des entreprises d'archéologie", vec: { obl: -.4, sup: -.2, res: -.3, prv: .7 }, by: { mkt: 1, sea: .5 } }
    ],
    clauses: [
      { id: "u_ban", k: "rec", form: "act", obj: "les États", v: "Demande", inf: "interdire l'exploitation commerciale des épaves et des sites engloutis relevant de leur juridiction", fx: { res: .55, obl: .25, prv: -.35 } },
      { id: "u_insitu", k: "rec", form: "act", obj: "les États", v: "Encourage", inf: "privilégier la conservation in situ du patrimoine subaquatique", fx: { res: .3 } },
      { id: "u_registry", k: "body", form: "self", v: "Décide", inf: "établir un registre international des sites subaquatiques menacés", fx: { sup: .4 }, tech: 1 },
      { id: "u_survey", k: "coop", form: "act", obj: "les entreprises de travaux en mer", v: "Invite", inf: "réaliser des études archéologiques préalables avant toute pose de câble ou de canalisation", fx: { prv: .2, res: .25 }, tech: 1 }
    ],
    objectif: "la protection du patrimoine culturel subaquatique"
  },
  {
    id: "tutelle_autonomie", title: "Accession à l'autonomie d'un territoire sous tutelle (fictif)",
    bodies: ["TRUST"], tags: ["mul", "hr"], axes: ["obl", "sup", "fin", "dro"],
    v: { objet: "l'accession du Territoire sous tutelle des îles {terr} à l'autonomie", court: "autonomie du Territoire", but: "préparer l'accession du Territoire à l'autonomie", but2: "les droits des habitants du Territoire", outil: "une consultation populaire" },
    facts: [["Population du Territoire", 40000, 180000, " habitants"], ["Jeunes scolarisés dans le secondaire", 35, 70, " %"], ["Recettes publiques couvertes par l'autorité administrante", 40, 85, " %"]],
    triggers: ["une pétition signée par {n} habitants des îles {terr} demandant un référendum d'autodétermination", "le rapport annuel de l'autorité administrante sur les îles {terr}, jugé incomplet par plusieurs membres du Conseil", "des manifestations pacifiques dans la capitale des îles {terr} pour réclamer un calendrier de transition"],
    background: "Le régime international de tutelle (Charte, chapitres XII et XIII) visait à favoriser l'évolution des territoires vers la capacité à s'administrer eux-mêmes ou l'indépendance (art. 76). Les îles {terr} et leur autorité administrante sont fictives.",
    history: ["En {y1}, une mission de visite (fictive) a recommandé d'accélérer la formation de l'administration locale.", "En {y2}, l'assemblée élue du Territoire a demandé un calendrier précis de transition."],
    pre: ["Rappelant les chapitres XII et XIII de la Charte des Nations Unies, notamment son article 76", "Rappelant la Déclaration sur l'octroi de l'indépendance aux pays et aux peuples coloniaux, contenue dans la résolution 1514 (XV) de l'Assemblée générale"],
    proposals: [
      { name: "une consultation populaire sous supervision internationale dans un délai de deux ans", vec: { obl: .6, sup: .8, fin: .2, dro: .6 }, by: { hr: 1, mul: .5 } },
      { name: "un plan de transition progressif financé par l'autorité administrante", vec: { obl: .2, sup: .2, fin: .6, dro: .3 }, by: { mul: 1 } },
      { name: "le maintien du statu quo jusqu'au prochain examen", vec: { obl: -.6, sup: -.6, fin: -.2, dro: -.3 }, by: { sov: 1 } }
    ],
    clauses: [
      { id: "ta_calendar", k: "admin", form: "act", obj: "l'autorité administrante", v: "Recommande", inf: "présenter un calendrier de transition vers l'autonomie, élaboré avec les représentants élus du Territoire", fx: { obl: .3, dro: .3 }, tech: 1 },
      { id: "ta_visit", k: "visit", form: "self", v: "Décide", inf: "envoyer une mission de visite dans le Territoire avant sa prochaine session", fx: { sup: .45 } },
      { id: "ta_petition", k: "petition", form: "self", v: "Décide", inf: "examiner la pétition présentée au nom des habitants du Territoire et y répondre à sa prochaine session", fx: { dro: .35, sup: .15 } },
      { id: "ta_invest", k: "admin", form: "act", obj: "l'autorité administrante", v: "Demande", inf: "accroître ses investissements dans l'enseignement secondaire et la formation de l'administration locale", fx: { fin: .45 } }
    ],
    objectif: "une transition maîtrisée vers l'autonomie du Territoire"
  },
  {
    id: "tutelle_ressources", title: "Ressources naturelles d'un territoire sous tutelle (fictif)",
    bodies: ["TRUST"], tags: ["mul", "dev"], axes: ["obl", "sup", "prv", "fin"],
    v: { objet: "la gestion des ressources naturelles du Territoire sous tutelle des îles {terr}", court: "ressources du Territoire", but: "garantir que l'exploitation des ressources profite aux habitants du Territoire", but2: "les intérêts des habitants", outil: "un fonds patrimonial" },
    facts: [["Recettes de la pêche et de l'extraction", 20, 140, " millions de dollars"], ["Part revenant au budget du Territoire", 8, 30, " %"], ["Concessions accordées à des entreprises étrangères", 4, 18, ""]],
    triggers: ["l'octroi d'une concession de pêche industrielle de {n7} ans sans consultation des communautés des îles {terr}", "la découverte d'un gisement de nodules polymétalliques dans les eaux des îles {terr}", "une pétition dénonçant la pollution d'une lagune des îles {terr} par une exploitation minière"],
    background: "L'article 76 de la Charte assigne au régime de tutelle l'objectif de favoriser le progrès économique et social des populations des territoires. Les îles {terr} et leur autorité administrante sont fictives.",
    history: ["En {y1}, un audit (fictif) a montré que moins d'un quart des recettes restait dans le Territoire.", "En {y2}, les communautés côtières ont adressé une pétition au Conseil."],
    pre: ["Rappelant l'article 76 de la Charte des Nations Unies", "Rappelant la résolution 1803 (XVII) de l'Assemblée générale sur la souveraineté permanente sur les ressources naturelles"],
    proposals: [
      { name: "un fonds patrimonial géré avec les représentants du Territoire", vec: { obl: .4, sup: .5, prv: -.2, fin: .5 }, by: { dev: 1, mul: .5 } },
      { name: "la révision des concessions sous le contrôle du Conseil", vec: { obl: .6, sup: .7, prv: -.5, fin: .1 }, by: { hr: 1 } },
      { name: "des partenariats d'investissement avec des entreprises responsables", vec: { obl: -.4, sup: -.3, prv: .8, fin: .2 }, by: { mkt: 1 } }
    ],
    clauses: [
      { id: "tr_suspend", k: "admin", form: "act", obj: "l'autorité administrante", v: "Demande", inf: "suspendre l'octroi de nouvelles concessions jusqu'à la consultation des communautés du Territoire", fx: { obl: .35, prv: -.3 } },
      { id: "tr_fund", k: "admin", form: "act", obj: "l'autorité administrante", v: "Recommande", inf: "verser une part équitable des recettes d'exploitation à un fonds patrimonial au bénéfice des habitants", fx: { fin: .45, obl: .2 } },
      { id: "tr_visit", k: "visit", form: "self", v: "Décide", inf: "envoyer une mission de visite chargée d'évaluer l'impact environnemental des exploitations", fx: { sup: .45 }, tech: 1 },
      { id: "tr_publish", k: "coop", form: "act", obj: "les entreprises titulaires de concessions", v: "Invite", inf: "publier leurs paiements et leurs études d'impact environnemental", fx: { prv: .15, sup: .25 } }
    ],
    objectif: "une gestion des ressources au bénéfice des habitants du Territoire"
  }
];
const ISSUE_BY_ID = Object.fromEntries(ISSUES.map(i => [i.id, i]));

/* Fond de carte : Natural Earth (domaine public), projection Equal Earth.
   Fichier généré par tools/make-map.mjs : ne pas modifier à la main. */
const MAP = {"w":960,"h":430,"bg":"M572,243l1,1 9,7 1,2 3,4-1,5 0,2 2,1 0,1-1,2 0,1 0,2 1,2 1,4 1,1-3,2-3,1-1,0-1,1-2,0-1,1-3-1-2,0-1-5 0-2-1-1-3,0-1-1-2-1-1-1-1-1-1-4-2-2 0-2 0-2 0-4 1,0 1-1 1-2 1-1-1-1 0-1 0-1 1-1 0-2-1-2 1,0 3,0zM458,141l0,1 0,5-9,0 0,9-3,0 0,2 0,5-10,0-1,1 0-2 6,0 1-1 1-2 1-5 4-3 1-5 1,0 1-3 2,0 1,0 1,0 1,0 1,0 0-2zM614,96l-4-12 6-1 5,2 2,1 3,3 3,0 4-1 3,3 1,3 1,0 1,2 4,0 1,2 1,0 0-2 2-3 1,0 1,0-1,2 2,1 2,0 3,1-2,2-2,0-1,0-1-1 0-1-3,1 0,2 0,1-3,0 0,2 2,0 2,3-1,3-2-1-1,0-1-2-3-1-3-2-2-1-4-2-2-3-1-1-2,0-2-1-1-2-3-2-2,2-1,1 0,2zM863,249l5,3 4,2 2,2 2,2 0,2 4,2 1,2-3,1 0,2 3,2 1,4 1,0 0,2 2,0-1,1 3,2-1,1-2,0 0-1-2-1-3,0-2-2-1-2-1-4-3-1-3,1-2,1 0,3-2,1-1-1-3,0 1-12zM894,253l1,1 1,2-1,1-1-2 0-1-1-1-2-2-2-1 1-1 1,1 1,1 1,1zM890,261l-1,1-2,1-1,0-2-1-2-1 0-1 3,0 1,0 1-2 0,2 2,0 1-1 1-2 0-2 2,0 0,1 0,2-1,2-1,0zM900,259l0,1 2,3 1,1-1,1-1,0-1-1-1-2 0-3 0-1zM560,256l0,4 0,2 0,2 2,2 1,4-1,0-4,1-1,2 0,2 0,4-1,4 1,1 2,1 1-1 0,4-2,0-1-2-1-1-2-1-1-2-2,1-2,0-1-2-1,0-2,0 0-1-1,0-1,0-1,0-2,0 0-4-1-1 0-3 0-2 0-1 0-2-3,0 0-2-2,0 0,1-1,0-1,2-1,1-1,0-1,0-2,0-1-1 0-2-1-2-1-3-8,0-1,1-2,0 0-1 1,0 0-2 0-1 1-1 1,1 1-2 1,0 1,1 1,1 1-2 2-2 0-1 0-3 2-4 1-2 2-1 0-2 0-1 0-1 0-2 1-3 0-3 1-2 0-2 0-2 1-2 2-1 2,1 2,1 2,0 2,1 1-2 1,0 3-2 1,1 1,0 1-1 1,0 2,0 1,0 1,0 2,3 1,0 1,0 1,0 2-1 0,2 3,2 0,4 1,1-1,1-1,1-1,2-1,2 0,3-1,1 0,3 0,1-1,2 0,2 0,2zM593,246l-2-3 0-13 3-4 0-2 2,0 2-2 4,0 7-11 2-3 1-3 0-1 0-4 0-2 1,0 1,0 1-1 1-1 1,0 1,1-1,2 1,2-1,1 0,4-2,4-1,5-2,5-2,4-4,5-2,3-4,4-3,3-3,4 0,2zM546,210l-2-2-1-1 0-1 1-1 0-2-2-2 0-2 0-1-1-1-1-2 0-1-1,0 0-1 1-2-1-1 1-1 0-1 0-2 1-3 3,0-1-14 0-2 3,0 0-7 10,0 10,0 11,0 1,4-1,1 1,3 1,4 1,1 2,2-1,2-2,0-1,1 0,3-1,5 1,1-1,4-1,3-1,2-1,3 0,1-2,1 0,4 0,3 0-3-1,0 0-2 0-1-2-1 0-3 0-2-1-1 0,1-2,0 1,1 0,2-1,2-1,3-2,0-2-2-1,1 0,1-2,1 0,1-2,0-1-1-2,0-1,0-1,0-1-2 0-1-2,0-1,2-1,3-1,1zM543,169l1,14-3,0-1,3 0,2 0,1-1,1 1,1-1,2 0,1 1,0 0,1 1,2 1,1 0,1-2,1-1,1-2,4-3,2-2,0-1,0 0,1-1,2-1,1-4,1-1,0 0,1-3,0 1-1-1-3-1-1-1-1-1-2 0-2 1,1 1-1 2,0-2-3 0-2 0-3-1-2 0-2-2,0 0-2-1-1 1-5 4-4 0-4 0-7 1-2-1-1 0-1-1-1-1-6 2-2 11,7zM291,168l0,2-1,2-1,0 1,1 0,1-2,0-1,0-2,0-1,0-1-1 0-1 2,1 2,0 1-1-1-1 1-2-2,0 1-1 1,0zM290,174l0-1-1-1 1,0 1-2 0-2 2,0 2,1 1,1 1,0 0,1 1,0 1,1-1,2-1-1-2,0-1,1-1,0 0-1-1,1-2,2 0-1zM276,144l2-1 1,1-3,1zM280,143l1,1-1,3 0-1 0-1 0-2zM277,149l1,0 0,3 0,2-1,0 0-2-1-1zM345,415l2-1 2,0 1-1 2,1 0,1-3,1-1-1-1,2zM403,5l6-1 5,0 3,0 6,0 13,0 10,1-3,0-7,0-9,0 1,0 6,0 5,0 3,0 1,0-2,1 5,0 8-1 5,0 1,1-7,1-1,0-6,0 4,0-2,1-1,0-1,2 2,1-2,0-3,0 3,1 0,1-2,0 2,1-4,1 2,0-1,1-3,0-2,0 2,1 0,1-4-1-1,1 3,0 2,1 0,1-3,1-1-1-2-1 0,1-2,1 4,0 3,0-6,2-5,2-6,0-2,0-2,1-3,2-5,2-1,0-3,0-3,1-2,1-1,2-1,1-4,2 0,2-2,2-2,2-3,0-2-2-4,0-1-1-1-2-2-3 0-2 1-2-2-2 1-1-1-1 4-2 3-1 1-1 1-1-2,0-2,1-1,0-2-1 0-1 2-1 1,0 4,1-3-1-1-1-2,0-1,0 3-2-1,0-1-2-1-1-2-1 1,0-4-1-4,0-5,0-4,0-1-1-3,0 5-1 4,0-7,0-4-1 1,0 7-1 6,0 1-1-4,0 2,0 6-1 3,0-1-1 4,0 6,0 5,0 1,0 5,0 4,0 2,0 3,1-3-1zM636,406l1,1 2,0 0,1-1,1-4,0 1-1 1-1zM818,272l2-1 2,0 1-1 1,1-1,1-3,1-2,1 0-1zM554,344l1,1-1,1-1,1-1,1-1,1-1,0-1-2 1-2 2-2 1-1zM293,280l2,0 1,0 1-1 2-1 1-2 4,0 0,2 0,2 0,2 3,3 3,1 1,1 2,1 2,1 1,0 2,1 0,2 1,1 0,2-1,0 2,4 5,0 0,2 0,2 2,1 0,2 0,3 0,1 0,2 0,1-1-1-2-2-3,0-4,1-1,3 0,2 0,4-1,0-3-1 0,3-2-2-4-1-2,3-1,0-2-4-2-4 0-4-2-1 0-3-2-2 1-4-1-3 0-1 0-2 0-1 0-4 0-2 1-1zM255,200l-1,1-1,0 0-1-1-1-1,1-1-1-1,0-1-1-1-1 0-1-1-1-1-2 0-1 0,1 1,0 0-1 1,0 0-2 1,0 1,0 0-1 1,1 0-1 1,0 1-1 0-1 1-1 1,1 1-1 1,0 1-1 1,0-1,1 0,2 0,1-1,1 0,2 0,1 0,2-1,0 0,2 0,1-1,0 0,1zM258,185l-1,0-1,1-1,0-1,1-1-1-1,1 0,1-1,1-1,0 0,1-1-1 0,1-1,0-1,0 0,2-1,0 0,1-1-2 0-1 0-1-1,0-1,0-1-1-1-1 1-1-1,0 1-1 1-1 2-1 0-1 1,0 1,0 1,1 1,0 1-1 1,0 1,0 1,0 1,0 1,0 1,1 0,1 1,0zM241,187l1,1 1,1 1,0 1,0 0,1 0,1-1,1-1,0-1,0-1-1-2,0 0-1 0-1 1-1zM243,175l1,0 1-2 1,0 0,1-1,2 1,0-1,2 0,2-1,1-1,0 0,1-1,0 1-4zM315,221l1,1-1,1-4,2-1,0-1,1-2-1-2,0-1,0 1,1 0,2 0,3 3,0 0,1-2,1 0,1-2,1-2,1 0,1-2,0-2-2-1-3 0-2-1,0 1-2 0-1-1-1 0-3 0-2 1-1 0-2 0-1-2,0-2,0-1,1-2-4-1,0-4,0 0-1-1,0 0-1 0-1 0-2 0-1-1-1-1-1 1-2 0-2 1-2 1-1 1-1 2-1 0,1-2,0 1,2 0,2-1,2 0,3 2,0 0-3 0-1 0-3 3-2 0-1 1-1 1,2 2,0 1,2 0,1 3,0 3,0 1,2 2,0 2-1 0-1 3,0 3,0-2,1 1,2 2,0 2,2 0,3 1-1 1,1-2,2 0,2 1,1-1,1-2,0 0,2 0,1zM326,233l-2,0-1,1-1,0-1,1-1,0-2-2 0-1-1-2 1-3 0-2 0-1-1-1 0-1 0-1-2,0-1-3 0-1 0-2 2,0 1-1-1-1 0-2 2-2 2,2 2,2 0,2 1,0 1,2 1,1 0,3-2,1 0,1-1,2 2,3 1,2zM332,231l-2,0-1,0-1,0 0,1 0,1-2,0-1-3-1-2-2-3 1-2 0-1 2-1 0-3 3,1 1-1 2,0 3,1-2,3 0,3 1,2 0,1 0,2zM304,173l2,0 0,1-1,1-2,0-1,0 0-2zM265,156l2,1 2,0 3,1 0,1 3,0 1,0 1,3 2,1 1,0 1,1 0,1 2,0 1,1 0,1-2,1-2,0-1,0-4,0 2-2-1-1-2,0 0-1-1-2-1,0-2-1-1-1-3,0-1-1 1-1-3,0-2,2-1,0 0,1-2,0-1,0 2-1 1-2 1,0 1-1 2,0zM562,320l-2,0-1,0-1,0-1,0-1-2-2,0-1-3 0-1-1,0-3-4-1-2 0-1-1-3 3,1 1,0 1,0 1-2 3-3 1-1 0-1 2-1 2-1 0,2 2,0 1,0 1,1 1,1 1,1 0,4-1,3 0,2 1,1-1,2 0,1-1,2zM557,320l-4,2-2,3-1,2-1,2-2,0 0,2-1,1-1,0-2,0-2-1-1,0-1,1-1,1-1,1-1,2-2,0-1-1 1-2-2-3 0-1 0-10 3,0 0-13 2,0 5-1 1,1 1-1 1,0 2-1 1,3 0,1 1,2 3,4 1,0 0,1 1,3 2,0zM532,329l-1,13-2,2-2,0-1-1-2,0 0-2-1,0-1,1-2-2-1-3 0-3-1-3 0-5 0-4-1-2-1-2-1-3-1-4-1-2-2-4 0-2 1-1 2-1 2,1 1,1 1,0 11,0 1,2 7,0 5-1 2-1 2,0 1,1-2,1-1,0-1,1-1-1-5,1-2,0 0,13-3,0zM449,195l0-2 0-1-1-1 0-2-1-2 1-1 1-2 1,0 2,1 1-1 1,0 1,0 10,0 1-3-1,0-1-16-1-15 4,0 9,8 9,7 0,2 2,1 1,1 0,2 3-1 0,9-1,2 0,2-3,1-3,0-1,1-2,1-2,0 0-1-2,0-2,2-1,1-2,2 0,1-1,0-2,0 0,1-1,2-2,3 0,1-1,2 0,2-1,1-1-1-1,0 0,1-3,0 0-1-1,1 0-1 0-1-1-1 0-1 0-1-1-1 0-1-1-1-1,0-1,1 0,1-1-1-1,0-1-1 0,1-1,0zM435,164l1-1 10,0 0-5 0-2 3,0 0-9 9,0 0-5 9,8-4,0 1,15 1,16 1,0-1,3-10,0-1,0-1,0-1,1-2-1-1,0-1,2-1,1-1-3-2-2-2-1-1-1-1,0-2,0-1,0-1,1 0-2 1-1 0-4 0-3 0-2 0-2-1-2zM487,217l-2,0-1-2 0-8 0-1 0-2-1-1-1-1 0-2 1-1 1-1 1-1 1-1 1-1 1,0 2,2 0,2 0,2 0,1 0,1-1,2-1,2-1,2 0,2zM519,157l1,6 1,1 0,1 1,1-1,2 0,7 0,4-4,4-1,5 1,1 0,2 2,0 0,2-1,0 0,1-2-3-1-1-2,2-2-1-2,0 0,1-2,0-1,1-2,0-3-2-1,1-2,0-1-1-2-2-3,1-1,1 0,2-1,1 0,3-2-2-1,0-1,1 0-2-3-1 0-2-2-2 0-2 0-1 2-1 1-1 3,0 3-1 0-2 1-2 0-9 4-1 8-7 8-7 4,2 2,2zM482,200l0,2 1,1 1,1 0,2 0,1 0,8 1,2-2,1-1-1 0-2-1-2 1-3-1-2 0-3 0-2-1-2 0-1zM443,194l1,0 2,1 1,0 0-1 2,1 0,1 1,0 0-1 1,1 1,0 1,1 0-1 1-1 1,0 1,1 0,1 1,1 0,1 0,1 1,1 0,1 0,1 0,1 0,2 1,3-1,0 0,1 0,2-1,0-1,0 0,1-1,0 0-1 0-1-1-2-1,0-1,0 0-1-1-1 0-1 0-1-1-2-2,0-1,1-1,0 0,1 0,1-2,1-1-2-1-1-1-1-1-2 0-1-1,0 1-2 1,0 1-1 1,0 0-1 0-1zM435,195l2-1 1,0 5,0 0,1 0,1 0,1-1,0-1,1-1,0-1,2-1-2-1,0-1-1 0-1-1,0zM457,212l0,1 0,2 0,1 0,1 1,1 1,1 1,1-1,1 0,3-1,0-2-2-3-3-2-2-2-2 1-1 0-1 1-2 1-2 1,0 1,0 1,2 0,1 0,1 1,0 0-1zM465,202l0-2 1-2 0-1 2-3 1-2 0-1 2,0 1,0 0-1 2-2 1-1 2-2 2,0 0,1 2,0 0,1 0,2 2,2 0,2 3,1 0,2-1,1-1,1-1,1-1,1-2,0-1-1-1,1-1,0-5,0 0,2 0,3-1-1-2,0-1,1-1-1 0-1zM554,221l-1,0-1,0-2,0-1,0-1,1-1,0-1-1-3,2-1,0-1,2-2-1-2,0-2-1-2-1-2,1-1,2 0,2-2,0-1-1-2,2-2,4 0-1 0-2-1-1-1-2 0-1-2-2 0-1 0-2 0-3 1-1 1-3 3,0 0-1 1,0 4-1 1-1 1-2 0-1 1,0 2,0 3-2 2-4 1-1 2-1 0,2 2,2 0,2-1,1 0,1 1,1 2,2 2,1 0,2 2,1 1,2 1,2 2,2zM530,227l0,2-1,2 0,3-1,3 0,2 0,1 0,1 0,2-2,1-1,2-2,4 0,3 0,1-2,2-1,2-1-1-1-1-1,0-1,2-1-1-1-1-1,1-1,1-2-4 2-2-1-2 1-1 2,0 0-2 2,2 2,0 1-2 0-2 0-3-1-2 1-4-1-1-2,0-1-2 1-1 3,0 2,1 2,1 0-2 2-4 2-2 1,1zM506,232l5,0 0,4-4,0-1,0-1,0zM563,270l1,1 1,1 2,1 1,1 2,1 0,3 0,1-1,3 0,3 0,2-1,3 1,1-8,3 0,2-2,1-2,1 0,1-1,1-3,3-1,2-1,0-1,0-3-1-1-1-2,0-2,1-2-3-2-3 1-11 5,0 0-1 1-2-1-1 1-2-1-1 1,0 0,1 2,0 1,0 1,2 2,0 2-1 1,2 2,1 1,1 1,2 2,0 0-4-1,1-2-1-1-1 1-4 0-4 0-2 1-2 4-1zM568,274l3,0 1,1 0,2 1,5-1,3 1,4 1,0 0,2 1,2 0,5-1,0-1,3-1-2 0-3 0-1 0-2-1-1-1,1-1-2-1-1 1-3 0-2 0-3 1-3 0-1 0-3zM563,336l-1,1-2,1-1-2 0-1 1-2 0-1 1,0 1,1 1,1zM515,257l-1,1 0,1 0,2-1,0-1-3 1-1 1-1zM513,262l2,0 1-1 8,0 1,3 1,2 0,2 1,1 2,0 1,0 1,0 1-1 1-2 1,0 0-1 2,0 0,2 3,0 0,2 0,1 0,2 0,3 1,1 0,4 2,0 1,0 1,0 1,1-1,2 1,1-1,2 0,1-5,0-1,11 2,3 2,3-5,1-7,0-1-2-11,0-1,0-1-1-2-1-2,1-1,1 0-2 0-4 1-3 1-1 1-4 0-1 2-3 1-1 0-3 0-2-1-1-1-2 0-3 1-2-1-3-1-3-1-2zM563,249l0,1 0,1 1,1-1,1-1,2-1,1-1,0-1-4 0-2 1,1 1-2zM570,124l-1,1-1-1 0,2 1,1-1,0 0,1 1,0 1,1-1,5-2-5 0-1 0-1 0-1 1-3 0-1 1,0 1,0 0,1 0,1zM570,122l-1,0-1,0 0-2 1-3 2,0 0,2-1,1zM613,285l1,2 0,2 0,5 1,1-1,2 0,1-1-2 0,1 0,3-1,1 0,1-1,3-1,4-2,5-2,7-2,5-2,4-2,1-2,1-2-1-2-1 0-2 0-3-1-3 0-2 1-3 1-1 1-1 1-2 1-3-1-1 0-3 0-3 1-2 0-2 2,0 1-1 1-1 2,0 1-2 3-2 1-2-1-1 1,0 2-2 0-3 1-1zM569,128l-1,0 0-1 1,0-1-1 0-2 1,1 1,2zM435,190l3,0 1-1 1,0 1,1 1,0 1,1-1,1-1-1-2,0-1,1-1,0-2,0zM602,133l1,1 0,1 1,3-2,0-1-2-2,0 1-3zM579,125l-2-4 5-3 0-4 0-2 1-1 1-2 1-1 3,1 1,1 1-1 2,4 2,1 0,2-1,1 0,2 3,4 3,1 2,3 0,2 1,2 1,2-1,0-2,0-1,3-5,0-8-7-4-3zM624,158l0-1 1-2 0-1 1-1-1-1 0-2 1,0 2,3 2,1 2,0 1,1 2,2 1,1 1,1-1,2 0,1-1,2-1,2-1,0-1,1 0,1 1,3-2,0-1,2 0,1-1,1-1,0-1,1 0,1-1,1-2,0-1,1-2,0-1-2-2-6 7-4 1-7zM626,147l-1-1 0-1 1,0 0,2zM926,298l1,2-1,0 0-1zM925,297l0-1 1-3 1,1-1,3zM756,195l-1-4 1-3 3-1 3,1 2,1 1-2 3,1 1,3 0,4-4,3 1,2-3,0-2,2-2-1-1-2zM768,188l-3-1-1,2-2-1 0-2 0-3-3-3-1-3-2-3-2-1-1,2-1,0-1-1-2,2-1-3 0-4-2,0-1-2-1-1 0-1 2-3 0,1 2,0-2-4 2,0 2,3 2,3 3,0 2,3-2,1 0,1 3,2 3,4 3,4 2,2 1,3zM744,166l-1,1-2,1-1,1-1,3-1,1 2,3 2,3 2,2-1,3-1,1 1,2 3,3 0,2 0,1 2,4-1,3-1,4-1-3 1-3-1-2-1-4-1-2-2-4-1-5-1-3-2,2-2,3-2-1-2,0 0-5-1-3-3-4 0-2-1,0-3-3-1-3 2,1-1-3 1-1-1-1 1-1-1-4 2,1 1-3-1-2 1-3-1-2 3-2 2,1-1-2 1-1-1-1 2-1 1,2 2,1 0,3 1,3-1,3 0,4 3-1 1,3 2,1 0,3 2,1 2,1 1-1 1,1-2,3zM790,92l1,1-2,0 0,1 0,1 2,2-1,1-1,1-1,1 0,1 0,1 2,1 2,1 0,1-1,0-2,0 0,2-1,0-1,0-1,0-1-1-1,0 0-1 0-1-1-2 0-1-2,0-2-1 1-2 2-2 0-2 2,1 2,0-2-1 3-2 0-1zM678,72l2-1 3-2 2-2 3,1 2,0 3,2 2,0 4,1 0-2-2-2 1-3 3,1 2,0 3,1 2,2 4,2 2-1 3,0 2,0 3,1 3,2 2,0 3,0 1,0 3-1 2-2 1,0 2,1 3,0 0,2 1,3 1,1 1,0 3,0 1-1 2,1 4,2 0,1-2,0-3,0-1,1 0,2-3,1-1,2-3-1-2,0 0,2 2,1 1,1-1,1-1,2-2,1-4,0-3,1-2,2-1-1-3,0-5-2-2,0-3,0-5-1-3,0-2-1-3-3-1-1-4-1-4-1-3,0-1-2-1-3-3-3-4-1-2-1zM715,140l2,1 0,3-2,0-2-1-2,1-2-1-1-1 1-3 2,0 2,0 1,0zM706,140l0,1 1,3 0,1-2,0-3-1-2,0-2-2-4,0-4-2-3-2-2-1 0-3 1-2 1-1 2,1 3,3 2,0 1,2 2,0 3,2 3,1zM643,108l1,0 2,1 1,0 2-1 1,1 0-1 1,0 1-1-1-1 1-1 2,0 0,1 1,1 0,2 1,1 1,0 1-1 1-1 2,0 2,0 1,1-1,0-1,1-3,0-2,1-1,2 1,1 0,2 0,1 0,1 0,1-3,0 2,2-1,1-1,2 1,2-1,1-1,0-2,0 0,1-2,0-1,2 1,3-3,2-2-1 0,1-2,0-3,0-4-2 2-3-1-2-2,0-1-3-1-2 0-2-1-1 0-2 0-4 3,1 2,0 0-2 2,0 1-1 0-3 2,0 0-2 1,1zM646,109l1-3-2-3-2,0 0-2 3,0 0-1 0-2 3-1 0,1 1,1 1,0-1,1-3,0 1,1 2,0 4,1 4,0 2,3 0-1 2,1 0,1 1,2-2,0-2,0-1,1-1,1-1,0-1-1 0-2-1-1 0-1-2,0-1,1 1,1-1,1-1,0 0,1-1-1-2,1zM648,93l0-2 2,0 4,1 0-2 1,0 4,1 1,0 3,0 4,0 2,1 1,1-3,2 0,1-3,1 0,2-3-1-1,1-2,1 1,1-1,1-4,0-4-1-2,0-1-1 3,0 1-1 2,0 2-2-3-1-2,0-2-1 1-2zM605,94l1-1 2,0 2,1 3,2 1,0 2,0 0-2 1-1 2-2 3,2 1,2 2,1 2,0 1,1 2,3 4,2 2,1 3,2 3,1 1,2-1,0-1-1 0,2-2,0 0,3-1,1-2,0 0,2-2,0-3-1-1-3-2,0-3-3-2,0-3-2-2,0-1,1-2-1-1,2-2,1-1-2 0-4-3-1 1-2-2,0 0-3 2,1 2-1-2-2-1-2-2,1 0,2zM603,133l-1-2-1-2 0-2-2-3-3-1-3-4 0-2 1-1 0-2-2-1-2-4-2-3 0-1-1-3 1-1 1,1 1,2 2,0 1,0 2-3 1,0 1,1 0,2 1,1 1,0 1,3 3,0 2,2 3,1 4-1 0-1 2-1 1-2 2,1 1-1 2,0 3,2 2,0 3,3 2,0 1,3 0,4 0,2 1,1 0,2 1,2 1,3 2,0 1,2-2,3 1,2 2,2 3,2 0,3 2,0 0,2-3,2 0,4-6-1-2-1-3-1-2-4-2,0-1,0-3,2-3-1-3-3-3-1-2-3-3-5-1,1-2-1zM570,124l0-1 0-1 0-2 1-1 0-2-2,0 0-2 0-2 1,0 0-1 0-2 1,1 3-1 1,0 2,0 3-1 1,0 3,0-1,2-1,1 0,2 0,4-5,3-4,4zM593,104l-1,0-1-2-2,0 0-1-1,0-1-1-2-1 0-1-1-2 3,0 1,1 1,0 0,1 1,1 0,1 1,1 1,1zM540,53l2,1 1,0 1,0 2,1 0,1 2,2 1,1 1,1 1,0 0,1-2,0-1,0 1,1 1,2-2,0 0,1 0,1-1,0-2,0-1-1-1,1-1-1-1,0-3,0-2-1-2,0-1,1-1,0 0-1-1-1 1-1 0-1-1-1 0-1 2,0 2-1 0-2 2,0 0-2 1,0zM550,64l1,0 0-1 1,0 2,0 2,2 0,1 2,0 1,2 3,1 2,0 1,1 2,0 3,1 0,1 0,1 1,2 0,1-3,0-1,1 1,1-2,0-1,1-3,1-1,1 0,1-1,0 0-1-2,0-1,1 0-1-4-1 0-1-2,1-1,1-1,3-1-1-1,1-1-1 0-1 1-1 0-1 2,0 0-1-1,0-1-2-1,0 0-1-1-1-1,0-2-1-1,0 0,1-1,0-1,1-2,0-1,0-2,0-1-1-1,1 0-1-2-1 0-1 1-1 0,1 0-2 1-2 1,0 1-1-2-3 1,0 1-1 2,0 2,1 3,0 1,0 1,1 1-1 1,1 2,0 1,0 0-1 0-1zM519,75l0,1-2,0 1,1-1,2-2,0-1,1-2,0-4-1 0-1-2,1-1,0-1,0-1,0-1-1 0-1 1,0 1,1 0-1 2,0 2-1 1,0 1,1-1-2 1-1 1-1 2,1 1-1 2,0 1,0 1,1zM530,74l2,1 0,1-2,0 0,2-2,3-1,0-2,0-1,1-1,0-2,0-2-2-1,0 0-1-1,0 1-2-1-1 2,0 0-1 1,1 1,0 2,0 0-1 1,0 1,0 1,0 0-1 1,0 3,1zM541,75l0-1 1,0 2,1 1,0 1,1 0,1 1,0 1,2 1,0 0,1-2,0 0,1-1,1 0,1-1-1 0-2 0-1-2-2-1-1-1-1zM537,54l0,2-2,0 0,2-2,1-2,0-1-1-1,0 0-1 0-1-1,0-2-1-1-2 2-1 4,1 2-1 0,1 1,0zM537,50l1,0 1,1 1,2-2,1-1,0-3-1-1,0 0-1-2,1-4-1-2,1 0-2 0-1 2-1 2,2 2,0 0-2 2-1 1,1 2,1zM530,97l0,1 0,1 0,1-1,1-1,0 0-1-1-1-1-1 0-3 1,0-1-1 0-1 1-1 1,0 0,1 1,0 0,1 0,1 0,2zM518,80l1,0 2,2 2,0 1,0 0,1 1,1-1,1-1-1-1,0-2,0-2,0-1,0 0,1 1,1 1,1 1,2 1,0 1,1 2,2-3-1-1-1-2-1-2-2-1-2 0-1-2,0 0,1-1-1 0-1 1,0 1,0 1,0 1,0 0-1 0-1zM494,69l0,1 0,1-1,0 0-1zM916,316l1,2 1,2-1,1-1-1-2-2-1-2 0-2 0-1 1,0 1,1 1,1zM917,278l1,1-2,0-1-2 2,1zM916,275l0,1-2-3 0-3 1,0 1,3zM914,276l-1,0-2,0 0-1 0-1 2,0 1,1zM912,269l0,1 0,1-2-1-1-2-1-1 1,0 1,1zM905,266l1,1-1-1-1-1 0-1zM701,212l0,4-1,1-2,1-2-3 0-5 0-6 2,2 2,3zM797,152l0,6 0,3-3-3-1-3 1-3 1-3 1,1zM501,56l-1,0-2,0-1-1 0-3 0-1 1-1 2,0 1,0 1-1 0,1 0,1 0,1 1,0 0,1-1,0-1,2zM506,53l1,1-1,3-2-2-1-1zM452,29l0,1 2,1-3,2-6,2-2,0-2,0-6-1 2-1-4-1 4,0 0-1-4-1 2-1 3,0 2,1 3-1 3,1 3-1zM590,94l1,0 2,2 1,0 1,0 1-2 1,2 2,2 1,0 1,1-2,0 0,3 0,1 0,1 0,1-1,0-1-1 0-2-1-1-1,0-2,3-1-2-1-1-1-1 0-1-1-1 0-1-1,0-1-1 1-1 2,1 1,1 0-1-1-1zM592,104l-2,0-1-2-1-1 1,0 0,1 2,0zM574,89l2,0 4,1 4,1 0,1 1-1 3,1 1,1 1,1 0,1 1,1 0,1-1-1-2-1-1,1-3,0-2-1-3,0 0-1-1-2-1-1-2-1zM793,220l0,2 0,2-1,0-1,1-1-2 1-1zM533,23l0,2 4,1-2,2 3,2-1,2 3,1-1,2 4,1-1,2-1,1-4,3-3,0-4,1-3,1-2-2-2,0 0-3-1-2 1-1 1-2 4-2 1,0 0-1-3-1-1-1-1-3-3-2-3-1 1,0 3,1 2,0 2,0 2-1 0-1 3-1 3,1zM531,72l-1,1 0,1 0,1-3-1-1,0 0,1-1,0-1,0-1,0 0,1-2,0-1,0-1-1-1-1 1-1 1,0 1,0 0-1 1-1 1,0 2,1 1-1 1,1 2-1zM578,187l-1-1 1-5 0-3 1-1 2,0 1-2 2,4 1,3 1,2 4,3 2,2 1,2 1,2 2,1-1,1-1-1-1-1-1-2-2-1 0-1-3-2-2,0 0-1-2,1-2-2 0,3zM327,313l1,2 0,5 3,0 1,0 2,1 0,1 1,3 1,1 1,0 1,0 1,1 0,1 0,2 0,2 0,4-2,2-2,1-3-1-3-1 2-5-1-2-3-1-3-2-3-1-5-6 0-4 0-2 1-3 4-1 3,0 2,2zM618,171l2,6 1,2-1,1-1,2 0,1-2,2-4,1-3,3-1,0-1,0-1,1-2,1-2,0-1,0 0,1-1,1 0,1-2,0-2,0-1-2 0-2-1-1 0-3-1-1 0-1 0-1 0-1 0-2 1-1 0-1 0-2 1,1 1,0 3,0 1,0 2,0 1,0 1,1 1,0 2-4 2-2zM561,116l1-1 1,0 2-1-1,1 0,1-1,0-1-1 0,1zM561,116l1,0 0-1 1,1 1,0-2,1-1,0-1-1zM546,160l0,7-3,0 0,2-11-7-11-7-2,2-2,2-2-2-4-2-1-2-2-2-1,1-1-2 0-1-2-3 1-1 0-2 0-2 0-2 0-3 0-1-1-3 1-1 0-1 0-2 2-1 1-1 1-1 0-3 3,1 1,0 2,1 3,1 2,3 2,1 4,1 2,2 2-1 1-2-1-2 1-2 1-1 2-1 3,1 1,1 1,0 1,1 3,0 1,1-1,2 0,2 0,2 1,2 1,13zM594,194l1,1 1-1 0,1 0,1-1,1 1,1-1,2 0-1-1,1-2,0 0-2 0-1 1-1zM612,198l0,2 0,4 0,1-1,3-2,3-2,0-9-5-1-1-1-2-1-2 0-1 1-2 1,1 1,1 1,2 1,0 3-1 3-1 2-1 1,0 1-1zM572,243l-5,1-3,0-1,0-2,1-1,0 0-3 1-1 0-3 1-2 1-2 1-1 1-1-1-1 0-4 1-1 2,1 2-1 2,0 1-2 2,3 0,2 1,4-1,3-1,2-1,2zM563,244l1,2 0,2-1,1-2,0-1,2-1-1 0-2 1-2 0-1 1,0zM524,92l-2-2-1-1-1,0-1-2-1-1-1-1 0-1 1,0 2,0 2,0 1,0 1,1 1,0 0,1 1,1 0,2-1,0-1,1zM533,93l1,1 1,2-1,0-1,0-1,1-2,0-1,0 0-2 0-1 0-1 2,0 1,0zM524,82l1-1 2,0 1,1 0,1 2,1 0,1 2,1 0-1 1,1 0,1 0,2 1,1-1,1 0,1 0,1-1,0-1,0 0-1 1,0-1,0 0-1-1,0 0-1-1,0-1,1-1-1-1,0 0-1-1,0 1,0 0-2-1-1 0-1-1,0 1-1-1-1zM528,92l-1,0-1,1 0,1-1-1-1-1 0-2 1-1 1,0 0,1 1,0 1,1zM529,94l0-1-1,0 0-1 0-1 1-1 1,0 0,1 1,0 0,1 1,0-1,0 0,1-2,0 0,1zM564,227l-3-2 0-2-2,1-1,0-1,0-1,0-2-3 0-1-2-2-1-2-1-2-2-1 0-2-2-1-1-2 1-1 1-3 1-2 2,0 0,1 1,2 1,0 1,0 2,0 1,1 2,0 0-1 2-1 0-1 1-1 2,2 2,0 1-3 1-2 0-2-1-1 2,0 0-1 1,1 0,2 0,3 2,1 0,1 0,2 1,0 0,3-1,1-1,0-1,2 2,1 1,2 1,1 1,1 2,4-2,2-2,2-1,2-2,0-2,1-2-1z","c":{"CHN":"M770,174l-2-1-1-3 1-2 3-1 1,0 1,2-1,1 0,2zM670,93l-1-2 2-1-5-5 4-1 1-1-1-5 5,0 1-1-1-3 1,0 1-2 1,0 2,2 2,1 4,1 3,3 1,3 1,2 3,0 4,1 4,1 1,1 3,3 2,1 3,0 5,1 3,0 2,0 5,2 3,0 1,1 2-2 3-1 4,0 2-1 1-2 1-1-1-1-2-1 0-2 2,0 3,1 1-2 3-1 0-2 1-1 3,0 2,0 0-1-4-2-2-1-1,1-3,0-1,0-1-1-1-3 0-2 3,1 2-2-1-1 0-3 0-1-1-1-2-1 1-1 2-1 3,0 4,1 3,1 4,3 1,1 3,2 3,2 4,1 5,2 3,3 3,0 1-1 3-1 1,3 0,1 2,3 1,3-4-1-1,2 3,2 2,4-1,0 1,1-3-1 0,1-3,2 2,1-2,0-2-1 0,2-2,2-1,2-2,1-1,2-2,0 0-1-1-1 0-2-2-2-1,1-2,2 0,2-2,0-1,2 3,2 2,1 1,1 2,1 2-2 3,1 1,0 2,2-3,1-1,1-1,2 0,2 3,2 3,3 3,3 2,3 1,3-1,0 2,2 2,1 0,3 1,3-2,0 0,4-1,4-1,5-2,3-3,3-3,0-1,2-1-2-1,2-3,2-3,1 0,3-1,0-2-2 1-1-4-2-1,1-3-1-2-1 0-2-2-1-2-1-2,2-2,0-2,0-1,1-2,0 2,4-2,0 0-1-1-1-1,1-2-1-2-1 0-3-2-1-1-3-3,1 0-4 1-3-1-3 0-3-2-1-1-2-2,1-3-1 1-1-2-2-1,1-3-1-2,2-2,3-2,0-1-1-1,0-2,0-2,0-1,3-1-3-1,1-3,0-3-1-3-2-2,0-1-2-2,0-3-3-2-1-1,1-4-2-3-2-2-4 2,0-1-1-1-2-1-3-4-4-4-1-2-2-2-2-1-1-1-2 0-1-2-1 0,1-2-3 1-1-1-1 2-1 1-1 3,1 0-2 3-1 0-1 3-2z","USA":"M202,73l7,0 7,0 2,0 7,0 6,0 7,0 7,0 8,0 7,0 5,0 1-1 0,1 0,1 2,0 2,0 2,1 2,0 2,1 1-1 2,0 2,1 1,1 2,1 1,1 0,1 1,0 0,1 1,0-1,1 2,1-1,3 0,3-2,2-2,1-1,1 0,1 1,1 1,0 3-2 3,0 3-2 1,0 0-1 0-1 1,0 2,0 2,0 2-2 3-2 2-1 3,0 4,0 1,0 1,0 1-1 1-1 2-3 3-2 0,1 2-1 0,1-1,4 1,2 0,1-3,2-3,1-3,0-2,2 0,1-1,2 0,1 1,0 0-1 1,1-1,1-2,0-1,0-2,1-1,0-1,0-2,1 3-1 1,1-4,1-1,0-1,0 0,1-1,2-3,2 1-1-1,0-1,1 1,1-1,1-1,1-2,3 1-2-1-2 1-2-1,1 0,2-1,0 1,1-1,3 1,0-1,1 0,3-3,3-2,1-3,2-1,0-2,1 0,1-4,2-2,2-1,2-1,2-1,3 0,3 1,2 0,1 0,4-1,3 0,1-1,2-1,1-1-1-1-1 0-1-1-3-1-3 0-1 2-2-1-2-1-3-1-1-3,2-1-2-1-1-3,1-2-1-2,1-2,0 1,1-1,2 0,1-1-1-1,1-2,0-1-2-3,0-1-1-2,1-2,1-3,2-3,2-2,1-1,2-1,2 0,2 0,1-1,0-2-1-2-1 0-1 0-3-1-2 0-2 0-2-2-1-2,0-2,2-2-1-1-1 0-2 0-1-1-2-1-1-1-1-4,0 0,1-2,0-5,0-5-2-3-2-3,0-3,0 0-1-1-2-1-1 1-1-2,0 0-1-2,0-1-1 1-1-1-4 0-4 1-1-1-1 0-3 1-2 0-2 2-3 2-2 0-3 3-3 2-2 3-3 2-4 1-3 0-1 1-1 3,1-1,3 1-1 1-2zM70,167l0,1 1,0 0,1-2,1-1,1-1,0 1-1 0-1 0-1 1,0 0-1zM69,165l-1,0 0-1 1,0zM68,163l0,1-2,0 1-1zM65,161l0,1 1,1-1,0-1,0 0-1zM62,160l0,1-1-1 1,0zM141,42l1,1-1,0-2,1-1-1zM160,48l1,0 0,1-3,1-3,1-1,0 1-1 3-1zM219,22l-10,8-17,12 2,1 1,0 1,1 0,2 3-1 3-1 0,1 0,1 1,1-1,2-1,3 2,2-1,1-3,2 0-2-1,0 2-3-1-2 1-2-1,0-4,0-1-1-2-3-1,0-3-1-3,0-2-1-2-1-2,1-2,1-1,0-3,1-3,1-3,0 1-1 4-3 3,0 1-1-5,1-3,2-5,2 0,1-5,2-3,1-3,1-2,1-5,1-2,1-4,1-1,0-3,1-3,1-3,1-5,1 0-1 4-1 3-1 4-1 3-1 3-1 5-1 1-1 2-1 3-2 3-1-3,1 0-1-3,1 1-1-2,1 1-1-4,1-1,0 2-2 1-1 0-1-3,1 0-1-1-1 2-1 0-1 3-2 3-1 3-1 2,0 4-1 1,0 2-1 1-1 3-1-2,0-2,1-2,0-1,0-3,0-2-1 1,0-1-2 5-1 5-1 2,0-2,1 4,0 1-1-1-1 0-1 0-1-2,0 3-1 3,0 4-1 2-1 3-1 3,0 4-1 2,0 4-1 2,1 2,0 3,0-1,1 2,0 2,0 3,0 4,0 1,1 3-1 2,1zM142,34l0,1 2,0 1,0 1,1-3,0-1-1-2,0z","FRA":"M340,225l-2,3-1,3-1,1-1,0 0-1-1,0-1,1-1-1 1-1 0-2 0-1-1-2 0-3 2-3 1,0 2,1 2,3zM494,71l1,1 3,1-1,2 0,2-1,0-1,0 1,1-2,1 0,2 1-1 1,1 0,1 0,1 0,1 0,3 2,0-1,1-2,2-4-1-4,1 0,2-3,1-2-2-1,1-5-2 0-1 1-2 0-6-2-3-2-1-3-1 0-2 3-1 3,1 0-4 2,2 5-3 1-2 2,0 1,1 1,1 2,1 1,0 2,1zM501,92l1-1 1,2-1,3-1-1-1-2z","GBR":"M467,59l-2-1-1,0 0-1 0-1 2,0 2,1zM473,60l1-1-2-2-2,0-1-1 1-1-1-1-1,1 0-2-1-2 1-2 2-2 1,0 3,0-3,2 3,0 2,0-1,2-2,2 3,1 2,3 1,0 1,3 1,2 3,0-1,2-1,1 1,1-2,2-3,0-4,0-1,0-1,1-2,0-2,1-1-1 3-3 2,0-3-1-1-1 3-1-1-1 0-2z","RUS":"M636,6l3,0 4,0 5,1 1,1-3,0-6,0-3,0-2-1-2,0zM653,8l6,1-9,0 1-1 1,0zM721,12l4,0 8,1 0,1-6,0-3,0-5-1 0-1zM739,13l5,0-1,1-3,0-4-1-1,0zM729,16l1-1 2,0 3,1 1,0-3,0-3,0zM555,7l3-1 3,0 0,1 1-1 1,0 3,0-1,1-2,0-1,0-2,0-2,0 1,0zM529,58l-4,0-3,0 1-2 3-1 2,1 1,0 0,1zM575,15l3-1-1-1 4,0 5-1 5-1 3,0 3,0 2,0-1,1-6,0-4,1-5,1-1,2-2,2 1,1 4,1-1,1-6-1-1,0-3-1-1-1 2,0-1-1 3-2zM790,59l4,3 2,3 4,3 7,5-4-1 2,4 5,3 1,2-3-2 1,3-3-3-2-3-3-3-1-2-4-4-4-3-3-3 1-2-3-1 1,0zM144,24l2,1 2,2-3,1 1,1 2-2 4,1 1,2-3,1-4,0-3,2-2,0-2,0-2-1 2-1-2,0-2,0 0-1 2-1-4,1 0,1-3,1 14-8zM830,32l-1,1-3,0 4,1 4,2 2,0 2,1 0,1-4-1-3,2-1,0-1,2-1,1 1,2-5-2-3,2-2-1-1,1-3,0 2,1 0,3 2,1 3,0 4,4-1,0 1,2 3,1-3,2 3,3-2,0 2,3 0,3-3-2-6-4-7-6-4-4 0-1-1-1 2-1 0-3 0-3 1-1-3-4-2,0 2,2-2,3-6-3-4,1 0,4 4,1-4,1-3,0-2-2-3,0-1,1-7,0-6,1-1,5-2,6 4,0 2,2 3,0 0-1 3,0 6,3 2,2 1,3 3,4 3,4 0,4 1,3-1,3 0,4 0,1-2,2-2,0-2-1-2,2 1,1-1-1-1-1 1,0-2-4-3-2 1-2 4,1-1-3-2-3 0-1-1-3-3,1-1,1-3,0-3-3-5-2-4-1-3-2-3-2-1-1-4-3-3-1-4-1-3,0-2,1-1,1 2,1 1,1 0,1 0,3 1,1-2,2-3-1-3,0-2-1-1,0-2,2-3,1-1,0-3,0-2,0-3-2-3-1-2,0-3,0-2,1-4-2-2-2-3-1-2,0-3-1-1,3 2,2 0,2-4-1-2,0-3-2-2,0-3-1-2,2-3,2-2,1-1,0-2-2-3,1-1-2-2,0-2-2-2,0-3,0-3-1-1,1-9-7-3-2 0-1-4,3-2,0-1-1-3-1-2,0-2-2-4-1-2,1-4,1-1,1-8,1 0,1 2,1-2,1 1,1-2,1 5,2 0,1-4,0 0,1-3-1-4,0-2,1-3-1-5-2-4,0-3,3 0,2-3-2-1,4 1,0 0,2 2,2 2,0 2,2 0,2 1,0 0,2-2,1-2,3 3,3 0,2 4,3-1,2-1,0-1,0-2-2-1,0-1-1-1-1-3-1-1,1 0-1-4-1-4-1-2,0-3-2-3-2-3-1 2-1 1-2-1-1 3-2-2,0-1-1 1-1 3,0 0-1-1-2 0-1 0-1-3-1-2,0-1-1-2,0-3-1-1-2-2,0 0-1-2-2-2,0-1,0 0,1-1,0-1-2-1-1 1,0 2,0 0-1-1,0-1-1-1-1-2-2 0-1-2-1-1,0-1,0-2-1-1-2-1-1-1,0 1-1-1-3 1-1 2-2-3-1 4-3 1-1 1-2-4-1 1-2-3-1 1-2-3-2 2-2-4-1 0-2 2,0 3,0 1-1 4,1 5,0 8,3 2,1 0,1-1,1-3,1-9-2-2,0 4,2 1,1 0,2 3,1 2,0 0-1-2-1 1-1 5,2 2-1-2-1 4-2 1,0 3,0 0-1-2-1 0-1-2-2 6,1 1,1-2,0 1,2 2,0 2,0 0-2 4,0 5-2 2,0-1,1 2,0 1,0 3,0 3-1 3,1 1-1-3-1 1-1 6,1 3,0 8,2 0-1-2-1-3,0 0-1-2-2 2-2 0-1 1-1 5,1 1,1 0,1 1,1 2,1 1,3 3,1 0,1-1,3 2,0 0-1 2,0 0-1 1-1-2-1 0-1-2-1-2-1 0-1-3-2 2-1-1-1 1,0 1,1 1,1 2,1-2-2 3,0 3,0 5,1-3-2-2-2 3,0 4,0 4,0-3-1 2-1 2,0 2-1 5,0 4,0 2,0 3-1 3,0 1-1 3,0 4,0-2,0 4,1 1,0 1,0 6,0 4,1 2,0 1,1-1,0-4,1-1,1 3,0 3,0 1,0 2,1 3-1 6,1 1,0 8,1-1-2 4,1 3,0 4,0 2,1 0,1 4,2 4,0-1-2 4,1 3,0 4,0 1,0 3,0-4-2 1,0 18,1 4,1 7,1 6,0 5,0 2,1 2,1 4,1 1-1 4,0 4,1 3-1 6,2 1,0-3-2-1,0 7,0 3,0 7,1 5,1 14,8zM809,20l-2,0-1,0 1-1 2,1zM153,19l1,0 1,0 2,0-1,1-2,0-3,0 2-1zM557,82l1-1 2,0 0,1 1,0 1,1 3,0 0,1-3,1-3,1-1,0 0-2-3-1 1,0 2-1z","DEU":"M511,59l0,2 1,1 0,2 0,1 1,2-1,0-1,0-1,1-1,0-2,1 1,1 0,1 1,1 2,1-1,1-1,1 1,2-1-1-1,0-2,1-2,0 0,1-1-1-1,0-3-1 0,1-2,0 0-2 1-2-3-1-1-1 0-1 0-1 0-2-1-2 2,0 0-2 0-2 0-1 0-1 2,0 1,1 1-1 0-1-1-2 2,0 1,0 0,1 3,1 0,1 2-1 1-1 3,1z","ITA":"M504,79l1,0 1,0 2-1 0,1 4,1 0,1 0,2-2-1-1,1 0,2 0,1 1,1 2,2 1,2 3,3 2,0 1,0-1,1 2,1 2,1 2,2 0,2-1-2-2,0-1,2 2,1-1,1-1,1-1,2-1,1 0-1 1-2 0-1-1-2-1-1-1-1-1-1-1-1-1-1-2,0-2-1-2-2-2-2-1-3-1-1-2-1-1,1-2,1-1,0 1-1-2,0 0-3 0-1 0-1 0-1 1,1 1,0 1-1 1,0 1,0 0-1 2,1 1-1zM516,106l2,0-1,2 1,1-1,2-2-1-1-1-4-1 1-2 2,0zM501,97l1-1 2,2-1,5-1-1-1,1-1,0 0-4 0-2z","ESP":"M462,109l0-1 1-1 0-1-1-1 1-2-1-2 1,0 0-2 1,0 0-3 1,0-1-2-1,0-1,0-1,0-1-1-1,0 0,1 0-2-1-2 3-2 3,1 3,0 3,0 2,0 4,0 0,1 5,2 1-1 2,2 3-1 0,2-2,2-3,1 0,1-2,2-1,2 1,2-1,1-1,2-2,1-1,3-3,0-3,0-1,1-1,1-1,0-1-1-1-2z","CAN":"M202,73l-2-3-1-1-3-2 1-2 2-2-2-1 2-2-1-2 1-1 3-2 1-1-2-2 1-3 1-2-1-1 0-1 0-1-3,1-3,1 0-2-1-1-1,0-2-1 17-12 10-8 3,1 2,1 1,0 3-1 3-1 3,1 3-1 4-1 0,1 2,0 2-1 1,0 1,2 4-2-2,2 3,0 1-1 3,0 1,1 4,1 2,0 2,0 1,1-3,1 2,0 6,0 2,0 1,1 3-1-1-1 2-1 2,0 2,0 1,0 0,1 3,0 2,1 3,0 3,0 1-1 2-1 2,1-1,2 2-2 2,0 2-2 0-1-2,0 2-2 4-2 2,1 1,0 1,2-3,1 3,1-2,2 4-2 1,1-2,2 1,1 3-1 3-2 2-2 3,0 2,0 2,1-1,1-2,1 0,1-1,1-5,2-3,0-1-1-2,1-3,2-1,1-4,2-3,0-2,1-1,1-3,1-4,1-4,3-3,2-2,3 3,0-1,3 0,2 3-1 3,1 2,1 0,1 2,1 2,1 3,0 3,1-2,2-1,3 0,3 2,2 2-1 3-2 1-5-1-1 4-1 4-2 2-2 1-2 0-2-2-2 4-2 1-3 2-3 2-1 3,1 1,0 3-1 1,1 1,2 1,1 3,0-1,2-1,3 1,0 1,2 4-2 3-2 2-2 1,3 1,3 1,3-2,1 2,2 1,1 3,1 1,1 0,2 2,1 0,1-1,3-2,1-2,1-4,1-3,2-4,1-5-1-3,0-3,0-2,2-4,1-5,4-3,3 2,0 5-4 6-3 3,0 2,1-3,2-1,4 0,2 3,1 4,0 3-4 0,3 1,1-4,2-6,1-2,2-4,2-2,0 1-3 5-2-3,0-3,0-1-2 1-4 0-1-2,1 0-1-3,2-2,3-1,1-1,1-1,0-1,0-4,0-3,0-2,1-3,2-2,2-2,0-2,0-1,0 0,1 0,1-1,0-3,2-3,0-3,2-1,0-1-1 0-1 1-1 2-1 2-2 0-3 1-3-2-1 1-1-1,0 0-1-1,0 0-1-1-1-2-1-1-1-2-1-2,0-1,1-2-1-2,0-2-1-2,0-2,0 0-1 0-1-1,1-5,0-7,0-8,0-7,0-7,0-6,0-7,0-2,0-7,0zM312,37l3-1 2,0 0,1-3,1-2,0zM337,17l-1-1 1-1 4,0 3,1-1,1-1,0-2,0-2,0zM319,38l1,0 1,0-1,1-1,0 0-1zM316,13l-2,1-2,0-2-1 2,0 3-1 1,1zM319,10l-4,0 4,0 1,0zM316,8l2,1-1,0-3,1-1-1 0-1 2,0zM325,14l-3,0-4,0 0-1 1-1-1,0-4-1-1,0 1-1 3,0 2,1 3,0 1,0-1,1 2,0 1,1 2,0 2,0 3-1 4,0 3,0 1,1 0,1-1,0-3,0-2,0-6,0zM291,9l2,0-1,1-4,0-2,0 2-1zM292,8l2,1-2,0-3,0 2-1zM357,66l-2,2-3,2 2-1 2,1-2,1 2,1 1-1 2,1-1,2 2,0 0,1 0,2-2,2-1,1-2-1 2-2-1-1-3,3-2,0 2-2-1,0-3,0-4,0 0-1 1-1 0-1 2-2 4-4 2-2 2-1 1,0zM317,32l2,0 1,1 0,1 1,0 1,1-2,0-3,0 0-1-3,1-4,1 1-1-3,0 2-1 2-2 2-2 2,0-1,1 1,0zM338,18l3-1 3,1 2,1-1,0 4,0 1,1 4,1 1,0 0,2-4,1 4,1 3,1 1,2 3,0-1,1-5,3-2-1-2-2-3,0-1,1 2,2 2,1 0,2-2,2-2-1-4-2 2,2 1,2 0,1-5-1-3-2-2-1 1,0-2-1-2-2 0,1-6,0-1,0 2-2 4,0 4,0 0-1 1-1 4-2 0-1 0-1-2-1-3,0 1-1-1-1-1,0-1-1-2,1-3,0-7,0-3-1-3,0-1-1 3,0-3-1 1-1 3-2 3,0 5-1-2,1 0,1 3-1 5-1 2,2-2,1zM313,15l4,0 3,0-5,2-2,0-3,1-2,0 0-1 1-1 2-1zM267,12l4-1 5-1 3,0 2,0-1,1-2,0-2,0-4,1-3,0zM193,59l2-1-4,3 0,3-1,0 0-2 1-1-1-1 1-1 1-1zM302,8l3,0 4,0 1,1-3,0-2,0-4,0 2,0-1-1zM200,74l-2,0-2-1 0-1-1-1 0-1-2,0 0-2 1,0 2,0 1,1 2,0 0,1 0,1 1,1zM266,14l2,1 4,0 1,0 2,1-3,0-6,1-4,1-1,1-6,1 0-1-3-1 2,0 3-2 3-1 0-1zM293,12l1,0 2,0 0,1-2,0-6,1-6,0-2,0 4-1-8,0-2,0 4-1 3-1 4,1 2,1 3,0-1-2 2,0 2,0 0,1zM290,16l1,1-1,2-1,1 2,1 3,1-1,0-3,1-1,1-3,0-3-1-2,0-5,1-5,0-3,0-2-1-2,0 0-1 1,0 3-1 3,0 2,0-3,0-4,0-2,0 0-1 5-1-3,0-3,0 4-1 2-1 6-1 1,0-2,1 5,0 1,0 3,0 1,0 0,2 2-1 0-2 2,0zM300,17l-1-1 3-1 2,0 3,0 0,1-2,1 2,0-2,2-4,0-2,0-3-2 1,0zM291,16l2-1 1,1-3,1-1-1zM310,11l1,1-1,0-2,1-3,1-2-1 1-1-3,1 2-2 1,1 4-1 2,0zM320,7l1-1 2,0 3,0 2,0 3,1 2,0 1,0 1,1-2,0-4,1-3,0-4,0-1-1 2,0-3,0-1-1-1,0zM328,5l3,0 2,0 3,0 3,0 2,0 2,0 1,0 3-1 3,0 5,0 1,0 4,0 4,0 3,0 5,0 3,1 3,0-4,0-5,0-1,1 3,0-4,0-3,0-4,1-3,0-1,1-6,0 3,0-2,0 1,1-2,0-3,0-1,1-3,0 0,1 3,0-6,1-4-1-5,1-2-1-4,0 1,0 3-1 0-1 2,0 4,1-2-1-2,0 1-1 4,0 1,0-2-1-1,0 5,0 1,0 3,0-3,0-6,0-3-1-1,0-2,0zM337,27l-1,0-2,0 0-1 2-1 1,0 2,1-1,0zM302,23l-2,1-2-1-2,1-1-1 2-1 2-1 2,1zM335,70l1,0 3,1 2,1-1,0-1,0-2-1zM333,78l0,2 2,0 2,0-1,1-1,1-3-2 0-1z","AUS":"M834,382l1,1-2,3-2,1-2,3 0-1-4,2-1,0 0-3 1-2 1-2 1-2 1,0 2,1 2,0zM797,355l-3,1-3,1-1,2-2,1-2,0-1,0-2,0-2,0-2,0-2,2-1,0-2,1-1,1-2,0-2,0-2-2-1-1 1-2 2,0 1-1 0-1 1-2 1-2 0-4 0-2 1-2 0-2 0-1 0-1 0-3 0-3 0-1 0,1 1-3 1,1 0,1 1-1-1-3 0-1 0-1 1-2 1-1 0-2 1-2 2-2-1,2 2-2 2-1 2-2 2-1 2,0 3-1 1-1 1,0 1-1 1,0 3-1 2-1 1-2 2-2 1-1 0-2 3-3 0,3 1-1 0-2 1-2 1,1 1-2 2-2 1-2 1,0 1-1 1,0 0-1 1,0 2-1 1,2 1,2 2,0 2,0-1-2 2-2 2-1-1-1 2-2 2-2 1,1 2-1 1-2-2-1 1,0 2,0 1,2 2,1 1-1 2,2 1-1 1,0 1-1 1,2-1,2-1,1-1,0 0,2-1,2-2,1 0,2 2,1 2,2 1,1 1,2 1,0 1,1 0,1 2,1 2-1 1-2 1-2 1-1 2-3 0-2 0-1 0-2 1-3 1-1 0-1 1-2 1-2 0-1 1-1 1,2-1,2 1,0 0,2 0,2 0,2 0,1 0,3 2-1 1,1 1,1-1,2 0,3 0,2 0,3-1,2 0,3 3,2 1,1 1,2 0,1 0,2 0,4 1-1 1,1 1,0-1,4 1,2 0,1 1,3 0,3-1,2-1,2 0,3-2,3-1,1-3,3-1,2-1,3-3,3-3,1-2,3-2,2-3,2-2,2-2,2-2,3 0,1-2,1-3,0-3,1-2,1-2,2-2-2-1,0 2-2-2,1-4,2-1-1-1,0-1,0-2-1-1-2 2-3 0-1-1-2-2,0 2-2 1-2-3,2-2,1 2-2 2-2 1-2 1-2-3,3-2,1-3,2-1-1 1-2 0-2-1-1 1-1-2-2-2,0-2-2-4,0-4,2-3,1z","NOR":"M505,7l1,0 2,0 3,0 5,1-4,1 0,1-2,0-1,1-2,0-3-1 1,0-3-1-3-1-1-1 4,0 1,0zM538,23l-3,0-2,0 1-1-3-1-3,1 0,1-2,1-2,0-2,0-3-1-1,0-1,0 0,2-3-1-1,2-1-1-1,2-2,2-3,3 1,1 0,1-2,0-1,2 0,3 2,1-1,3-1,2-1,1-2-1-4,2-2,1-3-1-1-3-1-5 2-2 5-2 4-2 3-3 4-4 3-2 4-2 4-1 3,0 3-1 3,0 3,0 6,1-2,0zM526,7l-2,1-5,0-5,0-1-1-2,0-2,0 5,0 3,0 1-1 5,1zM522,10l-3,0-4,0 2-1-2,0 4,0 1,0z","SWE":"M503,46l1-1 1-2 1-3-2-1 0-3 1-2 2,0 0-1-1-1 3-3 2-2 1-2 1,1 1-2 3,1 0-2 1,0 3,1 3,2 1,3 1,1-3,0-2,2 1,1-3,2-3,2-1,3 1,2 2,1-1,3-2,0 0,5-1,2-3,0-1,2-2,0-1-2-2-3z","NLD":"M495,60l0,1 0,2 0,2-2,0 1,2-2,0-1-1-2,0-2,0 1-1 2-4 3-1z","CHE":"M502,77l0,1 1,1 1,0 0,1-1,1-2-1 0,1-1,0-1,0-1,1-1,0-1-1-1-1-1,1 0-2 2-1-1-1 1,0 1,0 2,0 0-1z","NZL":"M906,380l-2,2-4,2-2,1 0-1-1,0 4-3 0-1-1-2 1-1 3-1 2-2 1-2 1-3 1,0-1-2 1-2 0-3 1,0 0,2 2,1-2,3-1,3 2-2 1,1-2,2 1,1 2,0 2-1 1,1-3,2-2,2-2,0-1,1-1,2zM879,391l4-2 3-1 3-3 1,0 2-2 3-2-1,2 0,1 3-1-1,1-1,1-2,2-4,2-2,1-1,2-1,0-4,1-2,2-4,3-3,1-2,1-2,0-1-1-2,0 0-1 4-2 5-3 2-1z","IRL":"M467,59l0,2-2,2-4,2-3,0 2-3-1-3 3-2 2-1 0,1 0,1 1,0z","GRC":"M545,115l0,1-4,0-3-1 1-1 1,1 2,0 2,0zM535,96l2,0 1-1 2,1 2,0 0-2 1,1 0,2-1,0-1,0-1,0-3,1 2,2-1,0-2,0-1-2-1,1 1,2 2,2-1,0 1,2 1,1 1,1-3,0 1,1-1,1 1,2-2,0-2-1-1-3-1-2-1-1-1-2 0-1 1-1 0-1 0-1 0-1 2,0 1-1 1,0z","PRT":"M459,94l0-1 1,0 1,1 1,0 1,0 1,0 1,2-1,0 0,3-1,0 0,2-1,0 1,2-1,2 1,1 0,1-1,1 0,1-1,1-2,0-1,0 1-3-1-2-1,0 0-1 0-2 1-1 0-2 1-1 0-2 0-1z","BEL":"M494,67l0,2-1,1 0,1-2-1-1,0-2-1-1-1-1-1 1-1 2,0 2,0 1,1z","TUR":"M590,109l-1,1-1-1-3-1-1,1-3,0-1,0-3,1-2,0-1,0-3,1-1-1 0,2 0,1-1,0-1-1 1-1-2,0-2-1-1,2-4,0-2-1-3,0 0,1-2,0-2-1-3,0-2-4-2-1 1-3-2-1 3-3 3-1 1-2 4,1 3-3 3,0 4,0 4,2 4,1 3-1 2,1 2-2 3,0 2,1 1,2 0,1 2,1 1,1-1,1 1,3 0,1zM542,94l2-1 3,1 0,1 2,1 0,1-3,0-1,1-2,1-1-1 0-1 1,0 0-2z","POL":"M531,59l0,1 1,1 0,1-1,1 1,1 0,1 2,3-1,1-1,0-1,2 0,2 0-1-2-1-2,1-1-1-1,1-2-1-1,0-1-1-1,0-1-1-1-1-1,1-1,0 0-1-1,0-2-1-1-2 0-1 0-2-1-1 0-2 1,0 3-2 3-1 2,1 2,1 3,0 4,0 1,0z","ROU":"M546,83l1,1 1-1 1,1-1,1-1,0 0,3-1,0-2-1-3,1-1,0-3,0-2,0-1,0-1-1 0-1-1-1 0,1-2-1 0-1-2-1 0-1-1-1 1,0 2-3 0-2 2,0 1-1 1,1 2,0 1,0 2,0 1-1 1,0 1,1 1,1 2,2 0,1 0,2z","CZE":"M513,67l2,1 1,0 0,1 1,0 1-1 1,1 1,1 1,0 1,1-1,1 0,1-1,0-1,0-1,1-1-1-1,0-2,0-1,1-2-1-2-1-1-1 0-1-1-1 2-1 1,0 1-1 1,0z","EST":"M538,45l-1,1 1,3-1,1-1,0-2-1-1-1-2,1 0-2-1,1-1-1-1-2 3,0 2-1 2,1z","SVN":"M512,80l2,0 1-1 2,0 1,0 0,1-2,1 0,1 0,1-1,0-1,0-1,0-1,0 0-2z","BGR":"M533,87l1,1 1,0 2,0 3,0 1,0 3-1 2,1 1,0-1,2 0,2 1,2-3-1-2,1 0,2-2,0-2-1-1,1-2,0-1-2-1-1 0-1 0-1 1-1-1-1 0-2z","BRA":"M347,360l-1-2 0-2-1-2-3-2-3-2-1,0-3-3-1,1 2-5 2-3 2-2 2-1-1-3-1-2-1,0 0-2 0-2 0-1-1-1-1,0-1,0-1-1-1-3 0-1-2-1-1,0-3,0 0-5-1-2 0-1 0-2 0-1 0-3 0-2-2-1 0-2 0-2-5,0-2-4 1,0 0-2-1-1 0-2-2-1-1,0-2-1-2-1-1-1-3-1-3-3 0-2 0-2 0-2-4,0-1,2-2,1-1,1-1,0-2,0-2,1-1-1 0-5-2,2-3,0-1-2-2-1 1-1-2-2-1-4 0-2 2-1 0-2 0-1 0-2 3-2 3-1 0-1 2,1 1-10 0-2 0-2-1-1 0-3 1-1 1,1 0-2-2,0 0-2 6,0 1-2 0,2 1,2 0-1 2,2 2,0 0-1 2-1 2-1 0-1 2-1 0-1-3,0 0-3 0-2-1-1 1,0 2,0 2,1 1-1 1,0 4-2 1-1-1-1 2,0 0,1 0,1 1,1 0,1 0,2-1,3 1,2 0,1 2,2 1,0 1-1 1,0 1-1 2,0 2,0 0-1 0-1 1,0 1,0 2,0 1,1 1-1 1,0 0,1 1,0 1-1 1-3 2-3 1,0 0,2 2,6 1,1 0,2-2,3 1,1 5,1 0,3 2-2 3,1 5,3 1,2 0,2 3-1 5,2 4-1 4,3 4,5 2,1 2,0 1,1 1,5 1,2-1,6-1,2-4,5-1,4-2,3-1,1 0,2 0,7 0,5 0,3-1,1 0,5-2,5 0,3-2,2-1,2-3,0-4,1-1,2-3,1-3,3-1,3 0,3 0,1 0,4 0,2-1,1-2,6-2,3-1,2-1,3z","MEX":"M186,124l3,0 3,0 3,2 5,2 5,0 2,0 0-1 4,0 1,1 1,1 1,2 0,1 0,2 1,1 2,1 2-2 2,0 2,1 0,2 0,2 1,2 0,3 0,1 2,1 2,1 1,0-2,3-1,2-2,5 0,2 0,2 0,1 0,3 1,3 0,2 1,2 3,1 1,1 2-1 2,0 2-1 2-1 2-1 1-2 1-3 0-1 2-1 3-1 3,0 1,0 1,1-1,1-1,3-1,2-1,2-1,3 0-1-1,0-1,0-1,2-1,0-2,0-3,0 0,2-1,0 1,1 0,1 1,1 0,1-4,1-1,2 0,1-1,1 0,1-2-4-1-1-2-1-2,0-2,2-2,0-1-1-2-1-3-1-1-1-3-1-2-2-1-1-1,0-2-1-1-2-3-2 0-2-1-2 1,0 0-1 1-1 0-2 0-1 0-2 0-1-2-4-2-2 0-3-2-1 0-1 1-2-1-1-1-2 0-2-1,0-1-2-1-2 1-1-1-2 0-3 1-1-1-2-1,1-1-1-1,1-1,2 0,2 0,2 1,2 0,1 0,1 1,0 0,2 0,1 0,1 1,2 0,3 0,2 1,2-1,1 1,0 1,2 0,2-1,2-1,0 0-3-1-2-1-1-1-1 0-3 1-2-1-1-1-1-1,0 0-1-2,0 0-2 0-1 1,0 1-1 1-1-1-3-1-1 0-2 0-2 0-3z","ARG":"M330,417l1,2 2,2 4,1 3,1 0,1-2,1-2-1-1,0-3,0zM334,348l0,3 0,3 0,3 0,1 0,2 1,2 3,3 1,2 1,1 1,2-2,4-3,2-4,1-3-1 1,2 0,2 1,2-1,1-2,1-3-2-1,1 2,3 1,1 1-1 2,2-2,1-1,2 0,3 0,1-2,1-1,1 0,2 3,2 3,1 0,3-2,1 0,4-2,1 0,1 2,3 2,2-1,0-2-1-6,0-1-2-1-2-2,0-1-1-1-3 1-1 0-2-1-1 0-3-1-4-1-2 1,0-1-1-1-1 0-1-1-1-2-4 0-1-1-3-1-4 0-3 1-1-2-3-1-3 1-2 0-3 0-3-1-3 0-1-3-5 1-4-1-3 0-3 1-3 1-3-1-1 0-1-1-6 3-1 0-4-1-1 2-3 4,1 2,2 0-3 3,1 1,0 5,6 3,1 3,2 3,1 1,2-2,5 3,1 3,1 2-1 2-2 0-4 1,0 1,2 1,3-2,1-2,2-2,3z","CHL":"M330,417l2,7 3,0 1,0 0,1-2,0-1,0-1,0-2-1-2,0-4-1-3-2-4-3 2,1 4,1 3,1 1-1-1-2 2-1zM295,304l2,2 0,3 2,1 0,4 2,4 2,4 1,0 1,1 0,4-3,1 1,6 0,1 1,1-1,3-1,3 0,3 1,3-1,4 3,5 0,1 1,3 0,3 0,3-1,2 1,3 2,3-1,1 0,3 1,4 1,3 0,1 2,4 1,1 0,1 1,1 1,1-1,0 1,2 1,4 0,3 1,1 0,2-1,1 1,3 1,1 2,0 1,2 1,2 6,0 2,1-2,0-2,1 1,3-1,0-3-1-3-2-4-2-1-1-1-2-2-2-2-5-1-3 2-2-4-1 1-2-1-5 3,1-1-7-2,0 0,3-1,0-1-4-2-6 1-2-2-4-1-3 1,0 0-6 0-5-1-5-1-5 0-3-2-4 1-4-1-7-1-7 0-8-1-6-2-5 2,0z","COL":"M298,235l0,1-1-2 0-2-1,2-6,0 0,2 2,0 0,2-1-1-1,1 0,3 1,1 0,2 0,2-1,10-1-2-1,0 2-4-2-2-2,1-1-1-1,1-2-1-2-3-1-1-1-2-2-2-1,0-1,0-1-2-1,1-2-1-1-1-1,0-2-2-1-1 1-1 0-1 1-2 1,0 2-2 1-2-1-1 0-2 0-3 0-1 0-4-1-1 1-2 1-1 0-2 0-1 1,0 3-2 1-1 0-1 1-3 1-2 2,0 2,0 3-2 1-1 1-1 1,0 1,1-1,1-2,1-1,1-1,1-1,2 0,2-1,2 1,1 1,1 0,1 0,2 0,1 0,1 1,0 0,1 4,0 1,0 2,4 1-1 2,0 2,0 0,1 0,2-1,1 0,2 0,3 1,1 0,1-1,2 1,0 0,2z","PER":"M290,256l-2-1 0,1-3,1-3,2 0,2 0,1 0,2-2,1 0,2 1,4 2,2-1,1 2,1 1,2 3,0 2-2 0,5 1,1 2-1 3,6-1,1 0,2 0,4 0,1 0,2 0,1 1,3-1,4 0,2-2,0-3-2 0-1-6-4-5-4-2-2-2-3 1-1-3-5-4-6-3-7-1-2-1-3-2-2-2-2 1-1-2-4 1-2 2-3 0,2 0,1 0,1 1,0 1,0 1,2 2-1 0-3 2-3 3-2 3-3 1-3-1-3 1,0 2,2 1,2 1,1 2,3 2,1 1-1 1,1 2-1 2,2-2,4 1,0z","ECU":"M275,240l1,3-1,3-3,3-3,2-2,3 0,3-2,1-1-2-1,0-1,0 0-1 0-1 0-2 1-2 0-2-1,2-2-2 1-1-1-3 1-1 1-2 1-2-1-2 2-1 2-1 2,2 1,0 1,1 2,1 1-1 1,2z","PAN":"M271,208l0,1 0,2-1,1-1,2-1-2 0-2 1,0-1-1 0-1-2-1-1,0-1,2-1,0 0,1-1,0 1,2 0,1-1,0-1,1 0-3-1,1-1,0 0-2-1,0-1,0-1,0 0-1 0-1 1-1-1,0 0-2 1,0 1,1 0,1 1,0 1,1 1,0 2-1 1-1 1-1 2,0 1,1 1,0 1,1z","CRI":"M257,205l-1,0 0,2 1,0-1,1 0,1 0,1-2-1 0-1 0-1-1-1-1-1-1-1 0-1 0,1-1,1 0-1-1,0 0-1 0-1 0-1-1-1 1-1 1,0 1,1 1-1 1,1 0,1 1,0 1-1 0,2 1,1z","JAM":"M274,173l2,0 1,1 1,1-2,0-1,1-1-1-2-1 1-1 1,0z","URY":"M334,348l1-1 3,3 1,0 3,2 3,2 1,2 0,2 1,2-1,2-2,2-2-1-2,0-2-1-2,0-2-2 0-2 0-1 0-3 0-3z","GTM":"M233,187l0-1 1-1 0-1 1-2 4-1 0-1-1-1 0-1-1-1 1,0 0-2 3,0 2,0 0,3-1,4 1,0 1,1 0-1 1,1-2,1-1,1-1,1 1,0-1,1-1,1-1,1 0,1-2-1-1,0-2-1z","TTO":"M314,201l1-1 1,0 0,3-3,0 1-1z","ZAF":"M522,342l1-1 1,0 0,2 2,0 1,1 2,0 2-2 1-13 0,1 2,3-1,2 1,1 2,0 1-2 1-1 1-1 1-1 1,0 2,1 2,0 1,0 1-1 0-2 2,0 1-2 1-2 2-3 4-2 1,0 1,0 1,0 2,0 1,5 0,3-1,4 0,1-1-1-1,0 0,1-1,2 0,1 1,2 2-1 1-1 2,0-1,2-1,3-1,2-2,2-1,2-1,2-2,2-3,3-2,2-2,2-3,1-1,0-1,1-1,0-1,0-3,0-2,0-1,0-2,1-3,1-1,1-1,0-1-1-1,0-1-2 0,1 0-1 0-2-1-2 1-1 0-2-1-3-2-3zM554,344l-1-2-1,1-2,2-1,2 1,2 1,0 1-1 1-1 1-1 1-1z","DZA":"M458,142l0-1 0-4 4-3 3,0 2-1 1-2 3-1 0-3 1,0 1-1 4-1 0-1 0-1-1-3 0-2-1-2 2-2 3-1 1-1 3-1 4-1 4,0 1,0 2-1 3,0 1,1 2,0-1,1 1,3-1,3-1,2 0,3 2,2 2,2 1,6 1,3 0,1 0,3 0,2 0,2 0,2-1,1 2,3 0,1 1,2 1-1 2,2 1,2-8,7-8,7-4,1-3,1 0-2-1-1-2-1 0-2-9-7-9-8z","EGY":"M577,160l-11,0-10,0-10,0-1-12-1-13-1-2 0-2 0-2 1-2 3,0 2,1 3,1 1,1 2-1 1-1 2,0 2,0 1,2 0-1 2,0 2,0 2,0 2,5-1,2 0,2 0,2-1,1-1-1-1-2-3-5 0,1 2,3 2,4 2,5 1,2 1,2 3,4 0,3 3,3z","ETH":"M609,211l-7,11-4,0-2,2-2,0 0,2-2,0-1-2-3,2-1,1-1,0-1,0-1,0-4-3-2,0-1-2 0-2-1,0-2-4-1-1-1-1-1-2-2-1 1-2 1,0 1-1 0-3 0-4 2-1 0-1 1-3 1-2 1-3 1-4 3,1 0-3 2,2 2-1 0,1 2,0 3,2 0,1 2,1 1,2 1,1-1,2-1,1 0,1 0,2 2,0 1-1 0,1 0,1 1,2 1,2 1,1 9,5z","GHA":"M480,200l0,1 1,2 0,2 0,3 1,2-1,3 1,2 0,2 1,1-4,2-2,2-2,1-3-1 0-2-1-3 1-4 1-3-1-5 0-3 0-2 5,0 1,0 1-1z","KEN":"M586,257l-3-4-1-2-9-7-1-1 0-3 1-2 1-2 1-3-1-4 0-2-2-3 2-2 2-2 1,0 0,2 1,2 2,0 4,3 1,0 1,0 1,0 1-1 3-2 1,2 2,0-3,4 0,13 2,3-2,2-1,1-1,0 0,3-1,1-1,3z","MAR":"M475,116l1,2 0,2 1,3 0,1 0,1-4,1-1,1-1,0 0,3-3,1-1,2-2,1-3,0-4,3 0,4-1,0 0,2-1,0-1,0-1,0-1,0-2,0-1,3-1,0-1,5-4,3-1,5-1,2-1,1-6,0 0-1 2-1 0-2 0-1 1-3 2-2 1,0 1-2 0-2 1-2 1-2 2-3 2-2 2,0 2-2 1-1 3-3-1-4 1-3 1-2 1-2 3-2 2-1 2-3 0-2 2,0 2,1 2,0 3,0z","NGA":"M487,217l0-6 0-2 1-2 1-2 1-2 0-1 0-1 0-2 0-2 0-3 1-1 0-2 1-1 3-1 2,2 1,1 2,0 1-1 3,2 2,0 1-1 2,0 0-1 2,0 2,1 2-2 1,1 2,3 1,2 0,1 0,1-2,3-1,2 0,2-1,1-1,2-1,2 0,1-1,2 0,1-2,2-2-2-1,0-1,2-1,0-1,4-1,2-3,2-1,0-1,0-2,0-1-2-1-3-2-2-2,0z","SEN":"M435,190l-1-2-1-2 1,0 1-3 1-2 1-1 1,0 2,0 1,0 1,1 2,1 2,2 1,3 1,2 0,2 1,1 0,1 0,2-2-1 0,1-1,0-2-1-1,0-5,0-1,0-2,1 0-3 2,0 1,0 1-1 2,0 1,1 1-1-1-1-1,0-1-1-1,0-1,1z","CIV":"M458,203l1-1 0,1 3,0 0-1 1,0 1,1 1-1 2,1 0,1 1,1 1-1 2,0 1,1 1,5-1,3-1,4 1,3 0,2-1,0-2-1-2,0-3,1-2,1-2,1-1,0 0-3 1-1-1-1-1-1-1-1 0-1 0-1 0-2 0-1 1,0 0-2 0-1 1,0-1-3 0-2 0-1z","TUN":"M504,132l-1-6-2-2-2-2 0-3 1-2 1-3-1-3 1-1 2-2 2,1 0,1 2-1 0,1-1,1 0,2 1,1 0,3-2,1 1,2 1,0 1,2 1,0 0,3-1,1-1,1-2,1 0,2 0,1z","CMR":"M519,193l1,2 0,3 0,2 2,3-2,0-1,1-1-1 0,2 1,2 1,1 1,1 1,3-1,1-1,3-1,1 0,3 0,2 0,1 2,2 0,1 1,2 1,1 0,2 0,1 0,2-2-1-2-1-3,0-1-1-1,1-2-1-1,1-5,0 1-3-1-3-2,0 0-2-1-1 0-1 1-2 1-4 1,0 1-2 1,0 2,2 2-2 0-1 1-2 0-1 1-2 1-2 1-1 0-2 1-2 2-3 0-1 0-1-1-2 0-1z","MOZ":"M573,282l2,0 3,1 1-1 2,0 1-1 1,0 3-1 3-2 0,1 0,4 0,3 0,6 0,1-1,3-1,2-2,3-2,1-4,2-3,4-1,0-2,3-1,1-1,2 1,3 1,2 0,1 0,3-1,2 1,0-1,2-1,1-2,1-3,2-2,1 0,2 1,0 0,2-2,0 0-2-1-1 0-1 1-4 0-3-1-5 3-4 1-2 0-1 1-2-1-1 0-2 1-3 0-4-1-1-1-1-1-1-1,0-2,0 0-2 0-2 8-3 1,2 1-1 1,1 0,2 0,1 0,3 1,2 1-3 1,0 0-5-1-2 0-2-1,0-1-4z","SLE":"M444,207l2-1 0-1 0-1 1,0 1-1 2,0 1,2 0,1 0,1 1,1 0,1-1,2-1,2 0,1-1,1-1,0-2-2-1-2 0-1z","GAB":"M511,232l1-1 2,1 1-1 1,1-1,1 1,2 2,0 1,1-1,4 1,2 0,3 0,2-1,2-2,0-2-2 0,2-2,0-1,1 1,2-2,2-3-3-1-3-2-4 0-1 1-1 0-3 1-3 1,0 4,0z","IND":"M729,139l1,1-1,1 1,2-2-1-3,2 1,2-1,3 1,2-1,3-2-1 1,4-1,1 1,1-1,1-3-5 0,2-2-2 0-2 1,0 1-3-2-1-2,0-3,0-1-2-1-1-2-1-1,2 3,2-2,1 0,2 2,1 0,2 1,2 1,3 0,2-1-1-4,1 1,3-1,2-3,2-2,5-2,2-2,2 0,2-1,1-3,1-1,0 0,3 1,5 1,3-1,3 0,6-1,0-1,3 1,1-3,1 0,3-1,1-3-4-2-5-1-3-1-2-2-4-1-4-1-2-3-5-2-7-1-5-1-4-1-3-4,2-2-1-4-4 1-1-1-2-3-3 1-2 6,0-1-3-2-2-1-2-2-2 2-3 3,0 2-4 1-3 1-4 0-2 1-2-2-2-2-2-1-3 0-1 4,1 3-1 1-3 4,4 1,3 1,2 1,1-2,0 2,4 3,2 4,2-1,2 0,3 2,1 3,2 4,2 4,0 2,2 2,0 3,1 2,0 0-1-1-3 0-1 1-1 1,3 1,1 2,1 2-1 2,1 2,0 0-3-2-1 2,0 2-3 2-2 3,1 1-1 2,2-1,1z","JPN":"M823,103l0,3 2,3 1,3 1,1 1,3-3,1-4,0-2,4-2-1-1-3-4,1-2,2-3,0 3,2 2,6-1,1-2-1-1-3-2-1-2-2 2-1 0-2 1-2 1-2 4-1 3,0 0-5 2,1 2-3 0-1 0-4-3-4-1-2 3,0 4,4zM819,88l1-2 3,4-3,1 0,3-5-2 1,3-2,0-3-3 0-2 2-1-3-4-1-2 6,3 2,1zM811,121l0-2 2,1 0-2 2,1 1,1 0,2-2-1-1,1 1,2-2-1z","KOR":"M788,107l1,0 0-2 2,0 1,0 0-1 4,4 2,2 2,4 0,2-2,0-1,2-2,0-2-2 0-2-3-4 1,0z","IDN":"M863,249l-1,12-1,12-2-3-3,0-1,1-3,0 2-3 1-1 0-4-1-3-5-3-2-1-4-3-1,2-1,0-1-1 0-2-2-2 3-1 2,0 0-1-4,0-1-2-2-1-1-2 3-1 2-1 4,2 1,1 0,6 3,2 2-4 3-2 3,0 2,1 2,2zM818,272l0,1 0,1-2,3-3,1 0-1 0-1 2-2zM843,265l0-3 1-1 1-1 0,1 0,2zM800,225l-1,3 2,4-1,1 3,4-3,0-1,3 0,3-2,2 0,4-2,6 0-2-3,2-1-2-2,0-1-2-4,2-1-2-1,0-3,0 0-5-1-1-2-3 0-4 0-3 2-2 0,2 2,2 2-1 2,1 1-2 2-1 2,1 2,0 2-5 1-2 0-4 4,0zM831,250l3,1 1,3-2-1-2-1-2,0-2,0 1-2zM824,254l-1-1-1-1 3-1 0,2zM828,232l0,2 1,0 1,2 0,3-2,0 0,2 1,2-1,0-1-2-1-5 1-3zM814,237l3,0 3-3 0,1-2,3-2,1-3-1-4,1-2,0-1,3 3,3 1-2 5-1 0,2-1-1-1,2-3,2 3,5-1,1 2,4 0,2-2,2 0-2 1-3-3,2 0-1 0-2-2-2 1-3-2,1 0,4 0,5-2,1-1-1 1-4-1-3-1,0 0-3 1-2 0-3 2-6 0-1 2-3 3,1zM804,277l-3-2 3-1 1,1 1,1 0,1zM808,271l2,0 2-1 0,2-4,1-4-1 0-1 2-1zM800,270l1,0 1,2-3,0-2,1-2,0 2-2 1,0 1-1zM774,263l0,2 5,0 1-1 5,1 1,3 4,0 3,3-3,1-3-2-3,1-2-1-3,0-3-2-2,0-1,0-5-1 0-2-3,0 2-4 4,1 2,1zM764,244l0,2 1,2 2,1 1,2-1,5 0,5-3,0-2-3-4-3-1-2-2-3-1-3-2-5-2-3-1-3-1-3-3-2-1-3-2-2-3-4-1-2 2,0 4,1 3,3 2,3 2,1 2,4 3,0 3,3 1,3 2,2-1,3 2,1z","PHL":"M805,194l-2-3 2,0 1,1 0,3zM811,203l0-1 0-2 2,0 0,2 1-3 0,3 0,2-1,2-1,1-2-3zM822,209l0,3 1,2-1,3-1-4-1,2 1,3-1,2-3-3-1-2 0-2-2-2 0,2-2,0-1,2-1-1 1-3 1-1 2-2 1,2 2-1 0-2 2,0-1-3 3,2 0,2zM800,206l-3,3 1-2 2-2 1-3 1-4 1,3-2,2zM804,174l0,1 2,3 0,3-1,1 0,3 1,3 1,0 1,0 4,2 0,2 1,1 0,1-2-2-1-1-1,1-2-2-2,0-2-1 0-1 1-1-1-1 0,2-2-3-1-1-1-4 2,2-1-6 0-3 2,0 1,1 1-1zM809,198l-1-1 2,1 1,0 1,1-2,2-1,1 0-2zM817,196l2,4-2-1 0,1 1,2-1,1-1-3-1,0 0-2 1,0 0-1-2-3 2,0z","VNM":"M761,202l2-2 3,0-1-2 4-3 0-4-1-3-1-3-1-3-2-2-3-4-3-4-3-2 0-1 2-1-2-3-3,0-2-3-2-3 1-1 2,0 2,0 2-2 2,1 2,1 0,2 2,1 3,1-3,3-1,3 0,3 2,4 4,4 3,2 2,3 2,7 1,6-2,3-3,2-2,3-3,3-1-2 1-2z","PAK":"M672,114l-1,3-3,1-4-1 0,1 1,3 2,2 2,2-1,2 0,2-1,4-1,3-2,4-3,0-2,3 2,2 1,2 2,2 1,3-6,0-1,2-2,0-2-3-2-3-5,1-4,0-3,1 0-4 3-2 0-2-2,0 0-3-3-2-2-2-1-2 4,2 3,0 2,0 0-1 2,1 3-2-1-3 1-2 2,0 0-1 2,0 1,0 1-1-1-2 1-2 1-1-2-2 3,0 0-1 0-1 0-1 0-2-1-1 1-2 2-1 3,0 1-1 1,0 2,2 2,2z","BGD":"M723,160l1,3-2-1 1,3-1-2 0-2-1-1-2-2-2,0 0,1 0,2-1-1-1,1-2-1-1-3-1-2 0-2-2-1 0-2 2-1-3-2 1-2 2,1 1,1 1,2 3,0 2,0 2,1-1,3-1,0 0,2 2,2 0-2z","SAU":"M569,135l3,0 1-1 0-1 2,0 1-1 0-1-3-3 5-2 1-1 3,1 4,3 8,7 5,0 2,0 1,2 2,0 1,3 2,0 0,2 2,1 1,2 0,1 0,1 1,1 0,1 1,1 1,0 1,0 0,2 2,4 8,2 0-1 2,2-1,7-7,4-8,1-2,2-2,4-1,0-1-1-1,0-2,0-1,0-3,0-1,0-1-1 0,2 0,1-1,1 0-1-1-1-1-2-1-1-2-3-1-3-2-2-1-1-2-3-1-3 0-2-2-3-1-2-1-1-2-2 1,0-1-2-1-1-1-3-2-2-2-3-1,0 0-1 0-2z","ARE":"M614,153l1-1 0,1 2,0 2,0 2,0 1-2 2-3 1-2 1,1 0,3-1,0 0,2 1,1-1,1 0,1-1,2 0,1 0,1-8-2-2-4z","QAT":"M612,151l-1-3 1-2 1,0 0,1 1,2 0,2-1,0z","JOR":"M569,125l1-1 3,1 4-4 2,4-1,1-5,2 3,3 0,1-1,1-2,0 0,1-1,1-3,0 0-1 1-5-1-1 1-1z","MYS":"M751,216l1,0 2,1 0,2 2,0 1-2 0,1 2,2 1,2 1,3 0,1 0,2 0,2 1,1 1,3 0,1-2,0-2-2-4-3 0-2-2-2 0-4-1-2 0-2zM800,225l-2-1-4,0 0,4-1,2-2,5-2,0-2-1-2,1-1,2-2-1-2,1-2-2 0-2 2,1 2-1 0-3 2-1 3,0 2-3 1-3 1,2 1-1 1,0 0-2 0-2 2-3 1-2 1,0 2,1 0,2 2,1 2,1 0,2-2,0 1,2z","FJI":"M953,303l1,0 1,1-1,2-2,0-1,0 0-2 1-1zM959,300l-2,1-1,1 0-2 1,0 1-1 2-1-1,2zM0,298l1,2-1-2z","KAZ":"M677,72l-1,2-1,0 1,3-1,1-5,0 1,5-1,1-4,1 5,5-2,1 1,2-1-1-2-1-4,0-3,0-1,0-4-1-1,0 0,2-4-1-2,0 0,2-1,0-2,3 0,2-1,0-1-2-4,0-1-2-1,0-1-3-3-3-4,1-3,0-3-3-2-1-5-2-6,1 4,12-1,0-3-2-2-1-2,0-1,1 0-2-1-1-3-1-2-3-1,0-1-1 3,0-1-2 2-1 2,1 0-3-1-2-2,0-3-1-2,2-2,0-1,0 0-2-2-2-2,0-2-2 0-2-1,0 1-4 3,2 0-2 3-3 4,0 5,2 3,1 2-1 4,0 3,1 0-1 4,0 0-1-5-2 2-1-1-1 2-1-2-1 0-1 8-1 1-1 4-1 2-1 4,1 2,2 2,0 3,1 1,1 2,0 4-3 0,1 3,2 9,7 1-1 3,1 3,0 2,0 2,2 2,0 1,2 3-1z","THA":"M762,188l-3-1-3,1-1,3 1,4-3-1-2,0 0-3-3,0 1,4-1,5 0,4 0,2 2,0 1,4 1,3 2,2 1,0 2,2-1,2-2,0 0-2-2-1-1,0-1-1-1-2-1-2-2-2 0,2-1-2 0-2 1-3 1-4 1-3-2-4 0-1 0-2-3-3-1-2 1-1 1-3-2-2-2-3-2-3 1-1 1-3 1-1 2-1 1-1 1,1 1,2 2,0 0,4 1,3 2-2 1,1 1,0 1-2 2,1 2,3 1,3 3,3 0,3z"},"dot":{"MLT":[515.6,113.2],"BRB":[320.2,191.9],"MUS":[631.8,313.3],"SGP":[762.1,234.9],"MDV":[679.5,224.6]},"ctr":{"CHN":[734.5,113.5],"USA":[241.1,103.2],"FRA":[485.4,80],"GBR":[474.4,59.4],"RUS":[674,43.9],"DEU":[502.8,66.8],"ITA":[509,89.4],"ESP":[471.3,99.1],"CAN":[270.7,52.8],"AUS":[827.2,330.6],"NOR":[505.6,34.5],"SWE":[512.5,37.9],"NLD":[492.1,63.3],"CHE":[498.7,79.1],"NZL":[880.2,392.1],"IRL":[462.5,60.9],"GRC":[534.5,102.1],"PRT":[460.5,101.2],"BEL":[490.2,67.9],"MLT":[515.6,113.2],"TUR":[565.7,103.2],"POL":[522.6,63.9],"ROU":[537.8,82],"CZE":[514.5,70.4],"EST":[533.6,46.6],"SVN":[514.5,81.1],"BGR":[539.6,91.4],"BRA":[337.4,278.2],"MEX":[213.7,154.4],"ARG":[319.4,361.6],"CHL":[305.3,365.3],"COL":[281.8,225.6],"PER":[279.3,273.2],"ECU":[267.1,245.2],"PAN":[263.5,208.8],"CRI":[252.9,203.5],"JAM":[274.9,174.1],"BRB":[320.2,191.9],"URY":[339.5,356.4],"GTM":[238.8,182.8],"TTO":[314.6,201.9],"ZAF":[544.2,343.1],"DZA":[486.7,139.7],"EGY":[557,145],"ETH":[586.9,208.4],"GHA":[476.7,211],"KEN":[582.7,237.7],"MAR":[458.1,133.7],"NGA":[501.6,205.1],"SEN":[441.2,187.7],"CIV":[464.8,212.3],"TUN":[503.8,118.9],"CMR":[514.2,219.3],"MOZ":[574.4,302.1],"SLE":[448.1,208.8],"GAB":[511.8,242.3],"MUS":[631.8,313.3],"IND":[687.7,158.1],"JPN":[817.2,113],"KOR":[794.5,111.5],"IDN":[789.8,240.9],"PHL":[804.3,182.7],"VNM":[762.8,179.9],"PAK":[656.1,133.3],"BGD":[715.2,154],"SAU":[596.1,153.4],"ARE":[621.2,153.9],"QAT":[612.7,148.8],"JOR":[572.9,128.6],"MYS":[791.3,226.9],"SGP":[762.1,234.9],"FJI":[952.6,304.6],"MDV":[679.5,224.6],"KAZ":[633,75.7],"THA":[749.8,185.5]}};

/* =====================================================================
   VERSION ANGLAISE — données de base
   Les tables françaises restent la référence ; setLang("en") remplace
   leurs champs de texte par ceux-ci (et setLang("fr") les rétablit).
   ===================================================================== */
const EN_AXES = {
  obl: { name: "Legal scope", neg: "voluntary commitments", pos: "firm obligations" },
  sup: { name: "International follow-up", neg: "national follow-up", pos: "international monitoring mechanism" },
  fin: { name: "Funding", neg: "no new funding", pos: "dedicated multilateral funding" },
  reg: { name: "Level of action", neg: "centralized UN steering", pos: "regional approach" },
  prv: { name: "Role of the private sector", neg: "public action", pos: "partnerships with the private sector" },
  rgl: { name: "Technology governance", neg: "self-regulation", pos: "strict regulation" },
  opn: { name: "Access and sharing", neg: "controlled access", pos: "open access" },
  res: { name: "Restrictive measures", neg: "incentives", pos: "binding restrictions" },
  dro: { name: "Approach", neg: "technical approach", pos: "rights-based approach" }
};
/* Noms courts officiels (usage ONU) ; « the » = article devant le nom dans une phrase */
const EN_COUNTRIES = {
  CHN: "China", USA: "United States", FRA: "France", GBR: "United Kingdom", RUS: "Russia", DEU: "Germany", ITA: "Italy", ESP: "Spain", CAN: "Canada", AUS: "Australia",
  NOR: "Norway", SWE: "Sweden", NLD: "Netherlands", CHE: "Switzerland", NZL: "New Zealand", IRL: "Ireland", GRC: "Greece", PRT: "Portugal", BEL: "Belgium", MLT: "Malta",
  TUR: "Türkiye", POL: "Poland", ROU: "Romania", CZE: "Czechia", EST: "Estonia", SVN: "Slovenia", BGR: "Bulgaria", BRA: "Brazil", MEX: "Mexico", ARG: "Argentina",
  CHL: "Chile", COL: "Colombia", PER: "Peru", ECU: "Ecuador", PAN: "Panama", CRI: "Costa Rica", JAM: "Jamaica", BRB: "Barbados", URY: "Uruguay", GTM: "Guatemala",
  TTO: "Trinidad and Tobago", ZAF: "South Africa", DZA: "Algeria", EGY: "Egypt", ETH: "Ethiopia", GHA: "Ghana", KEN: "Kenya", MAR: "Morocco", NGA: "Nigeria", SEN: "Senegal",
  CIV: "Côte d'Ivoire", TUN: "Tunisia", CMR: "Cameroon", MOZ: "Mozambique", SLE: "Sierra Leone", GAB: "Gabon", MUS: "Mauritius", IND: "India", JPN: "Japan", KOR: "Republic of Korea",
  IDN: "Indonesia", PHL: "Philippines", VNM: "Viet Nam", PAK: "Pakistan", BGD: "Bangladesh", SAU: "Saudi Arabia", ARE: "United Arab Emirates", QAT: "Qatar", JOR: "Jordan", MYS: "Malaysia",
  SGP: "Singapore", FJI: "Fiji", MDV: "Maldives", KAZ: "Kazakhstan", THA: "Thailand"
};
const EN_THE = new Set(["USA", "GBR", "NLD", "KOR", "PHL", "ARE"]);
const EN_UN_GROUPS = { AFR: "Group of African States", APG: "Group of Asia-Pacific States", EEG: "Group of Eastern European States", GRULAC: "Group of Latin American and Caribbean States", WEOG: "Group of Western European and other States" };
const EN_UN_GROUPS_SHORT = { AFR: "Africa", APG: "Asia-Pacific", EEG: "Eastern Europe", GRULAC: "Latin America and Caribbean", WEOG: "Western Europe and others" };
const EN_UNESCO_GROUPS = { I: "Group I (Western Europe and North America)", II: "Group II (Eastern Europe)", III: "Group III (Latin America and the Caribbean)", IV: "Group IV (Asia and the Pacific)", Va: "Group V(a) (Africa)", Vb: "Group V(b) (Arab States)" };
const EN_BLOC_NAMES = { UE: "European Union", OTAN: "NATO", G7: "G7", G77: "Group of 77", BRICS: "BRICS", UA: "African Union", ASEAN: "ASEAN", OCI: "Organisation of Islamic Cooperation", LigueArabe: "League of Arab States", PEID: "Small Island Developing States", OIF: "Francophonie", Commonwealth: "Commonwealth" };
const EN_PERSONALITIES = {
  cooperative:    { name: "Cooperative",    desc: "seeks agreement and works in good faith" },
  prudente:       { name: "Cautious",       desc: "commits little and readily abstains" },
  intransigeante: { name: "Uncompromising", desc: "stands by its principles and rarely gives ground" },
  opportuniste:   { name: "Opportunistic",  desc: "trades its support for concessions" },
  mediatrice:     { name: "Bridge-builder", desc: "brings positions together and rarely votes against" },
  ambitieuse:     { name: "Ambitious",      desc: "wants to see its own proposals in the text" },
  technocratique: { name: "Technocratic",   desc: "wants a precise, quantified and workable text" }
};
const EN_ORIENTATIONS = {
  ambitieuse:   { name: "Ambitious multilateral approach", desc: "Strong commitments, international follow-up and dedicated resources." },
  souverainete: { name: "National sovereignty first", desc: "Voluntary commitments that respect each State's choices." },
  pragmatique:  { name: "Economic and pragmatic approach", desc: "Workable, low-cost solutions involving the private sector." },
  cooperation:  { name: "Stronger international cooperation", desc: "Sharing resources and building capacity, region by region." }
};
const EN_BODIES = {
  UNSC: {
    de: "of the Security Council", head: "The Security Council", name: "Security Council", short: "Security Council", acr: "UNSC",
    chair: "the President of the Council", chairTitle: "President of the Security Council", sg: "the Secretary-General",
    act: "resolution", session: "meeting", stay: "Decides to remain seized of the matter.",
    desc: "Primary responsibility for the maintenance of international peace and security (Charter, Art. 24). Its decisions are binding on Member States (Art. 25).",
    powers: ["Decisions binding on all States (Art. 25)", "Article 41 measures (Chapter VII)", "Mission mandates and Council missions", "Subsidiary organs (Art. 29)"],
    limits: ["Does not vote on the UN budget (a General Assembly competence, Art. 17)"],
    ruleText: "Fifteen members. Adopted with at least nine votes in favour and no vote against by a permanent member (Art. 27.3). An abstention by a permanent member does not prevent adoption."
  },
  UNGA: {
    de: "of the General Assembly", head: "The General Assembly", name: "General Assembly", short: "General Assembly", acr: "UNGA",
    chair: "the President of the Assembly", chairTitle: "President of the General Assembly", sg: "the Secretary-General",
    act: "resolution", session: "plenary meeting", stay: "Decides to include the item in the provisional agenda of its next session.",
    desc: "Deliberative body in which each Member State has one vote (Art. 9 and 18). Its resolutions are recommendations, except on internal matters such as the budget.",
    powers: ["Recommendations to States (Art. 10 to 14)", "Budget of the Organization and scale of assessments (Art. 17)", "Establishment of subsidiary organs (Art. 22)", "Adoption of conventions opened for signature"],
    limits: ["Cannot impose obligations on States", "Cannot adopt Article 41 measures"],
    ruleText: "Simple majority of members present and voting. Two-thirds majority for “important questions” (Art. 18.2), including recommendations on peace and security and budgetary questions."
  },
  UNHRC: {
    de: "of the Human Rights Council", head: "The Human Rights Council", plenary: "the General Assembly", name: "Human Rights Council", short: "Human Rights Council", acr: "HRC",
    chair: "the President of the Council", chairTitle: "President of the Human Rights Council", sg: "the Office of the High Commissioner for Human Rights",
    act: "resolution", session: "meeting", stay: "Decides to continue its consideration of the matter at a future session.",
    desc: "Subsidiary body of the General Assembly (resolution 60/251) responsible for promoting and protecting human rights.",
    powers: ["Resolutions and recommendations", "Special procedures (special rapporteurs, working groups)", "Requests for reports from the Office of the High Commissioner", "Recommendations to the General Assembly"],
    limits: ["No binding decisions or sanctions", "Does not vote on a budget"],
    ruleText: "Forty-seven elected members. Adopted by a simple majority of members present and voting; abstentions are not counted."
  },
  ECOSOC: {
    de: "of the Economic and Social Council", head: "The Economic and Social Council", plenary: "the General Assembly", name: "Economic and Social Council", short: "ECOSOC", acr: "ECOSOC",
    chair: "the President of the Council", chairTitle: "President of the Economic and Social Council", sg: "the Secretary-General",
    act: "resolution", session: "meeting", stay: "Decides to continue its consideration of the matter at its next session.",
    desc: "Coordinates the economic and social work of the United Nations and its specialized agencies (Charter, Chapter X).",
    powers: ["Recommendations to States and to the General Assembly (Art. 62)", "Draft conventions (Art. 62.3)", "Functional commissions (Art. 68)", "International conferences (Art. 62.4)"],
    limits: ["No binding decisions", "Does not set the UN budget"],
    ruleText: "Fifty-four elected members. Decisions by a majority of members present and voting (Art. 67)."
  },
  TRUST: {
    de: "of the Trusteeship Council", head: "The Trusteeship Council", name: "Trusteeship Council (teaching session)", short: "Trusteeship Council", acr: "Trusteeship",
    chair: "the President of the Council", chairTitle: "President of the Trusteeship Council", sg: "the Secretary-General",
    act: "resolution", session: "meeting", stay: "Decides to examine the next annual report of the Administering Authority.",
    desc: "The Trusteeship Council suspended its operations in 1994, after the independence of Palau. This session is a teaching exercise set in a fictional territory.",
    powers: ["Examination of the reports of the Administering Authority (Art. 87.a)", "Examination of petitions (Art. 87.b)", "Periodic visiting missions (Art. 87.c)", "Recommendations"],
    limits: ["Cannot decide in place of the Administering Authority", "No sanctions"],
    ruleText: "Now made up of the five permanent members. Each member has one vote; decisions by a majority of members present and voting (Art. 89). No veto."
  },
  UNESCO_GC: {
    de: "of the UNESCO General Conference", head: "The General Conference", name: "UNESCO General Conference", short: "General Conference", acr: "UNESCO GC",
    chair: "the President of the Conference", chairTitle: "President of the General Conference", sg: "the Director-General",
    act: "resolution", session: "plenary meeting", stay: "Decides to examine the matter at its next session.",
    desc: "UNESCO's supreme body: all Member States, one vote each (Constitution, Art. IV).",
    powers: ["Recommendations to Member States (Art. IV.4)", "Adoption of international conventions (Art. IV.4)", "Programme and budget of the Organization", "Establishment of subsidiary bodies"],
    limits: ["Conventions bind only the States that ratify them"],
    ruleText: "Simple majority of members present and voting. Two-thirds majority to adopt an international convention (Art. IV.4)."
  },
  UNESCO_EB: {
    de: "of the UNESCO Executive Board", head: "The Executive Board", plenary: "the General Conference", name: "UNESCO Executive Board", short: "Executive Board", acr: "EX",
    chair: "the Chair of the Executive Board", chairTitle: "Chair of the Executive Board", sg: "the Director-General",
    act: "decision", session: "plenary meeting", stay: "Decides to include this item in the agenda of its next session.",
    desc: "Elected by the General Conference, it prepares the Conference's work and oversees the execution of the programme (Constitution, Art. V).",
    powers: ["Examination of the programme and budget", "Recommendations to the General Conference", "Requests to the Director-General", "Committees and working groups"],
    limits: ["Adopts neither conventions nor the budget: it recommends them to the General Conference"],
    ruleText: "Fifty-eight elected members. Decisions by a simple majority of members present and voting."
  },
  WHC: {
    de: "of the World Heritage Committee", head: "The World Heritage Committee", name: "World Heritage Committee", short: "World Heritage Committee", acr: "COM",
    chair: "the Chair of the Committee", chairTitle: "Chair of the World Heritage Committee", sg: "the Director of the World Heritage Centre",
    act: "decision", session: "meeting", stay: "Requests the State Party to submit a report on the state of conservation of the property for examination at its next session.",
    desc: "Intergovernmental body of the 1972 Convention: it keeps the World Heritage List and the List of World Heritage in Danger, and manages the World Heritage Fund.",
    powers: ["Inscription on the List of World Heritage in Danger (Art. 11.4)", "International assistance from the World Heritage Fund (Art. 13)", "Reactive monitoring missions with the Advisory Bodies", "Examination of the state of conservation of properties"],
    limits: ["Cannot impose anything on a State Party on its territory without its cooperation", "No sanctions"],
    ruleText: "Twenty-one elected members. Decisions by a two-thirds majority of members present and voting (1972 Convention, Art. 13.8)."
  },
  ICH: {
    de: "of the Intergovernmental Committee for the Safeguarding of the Intangible Cultural Heritage", head: "The Committee", name: "Intangible Cultural Heritage Committee", short: "Intangible Heritage Committee", acr: "ICH",
    chair: "the Chair of the Committee", chairTitle: "Chair of the Intergovernmental Committee", sg: "the Secretariat of the Convention",
    act: "decision", session: "meeting", stay: "Decides to examine the implementation of the present decision at its next session.",
    desc: "Intergovernmental Committee of the 2003 Convention for the Safeguarding of the Intangible Cultural Heritage.",
    powers: ["Inscription on the Urgent Safeguarding List", "International assistance from the Intangible Cultural Heritage Fund", "Programmes of good safeguarding practices", "Recommendations to States Parties"],
    limits: ["No new obligations beyond the Convention", "Acts with the consent and participation of the communities concerned"],
    ruleText: "Twenty-four elected members. Decisions by a simple majority of members present and voting; abstentions are not counted."
  },
  UNESCO_PC: {
    de: "of the Programme Commission of the General Conference", head: "The General Conference", name: "Programme Commission of the General Conference", short: "Programme Commission", acr: "Commission",
    chair: "the Chair of the Commission", chairTitle: "Chair of the Commission", sg: "the Director-General",
    act: "resolution", doc: "draft resolution", session: "meeting", stay: "Decides to continue its consideration of the matter at its next session.",
    desc: "The programme commissions examine the draft resolutions in their field and recommend them to the plenary of the General Conference.",
    powers: ["Recommendations to the plenary of the General Conference", "Proposals for programmes and activities", "Requests to the Director-General"],
    limits: ["Its texts must still be adopted in plenary"],
    ruleText: "Open to all Member States. Recommendations by a simple majority of members present and voting.",
    commissions: { ED: "Education", SC: "Natural Sciences", CLT: "Culture", CI: "Communication and Information" }
  }
};
const EN_KINDS = {
  rec: { name: "Recommendation to States" },
  report: { name: "Request for a report" },
  coop: { name: "Cooperation and capacity-building" },
  review: { name: "Follow-up of the matter" },
  body: { name: "Establishment of a body or working group" },
  volfund: { name: "Voluntary funding" },
  assessed: { name: "Funding from assessed contributions", why: "Only the General Assembly (Art. 17 of the Charter) and the UNESCO General Conference vote on the budget and on assessed contributions." },
  assessrec: { name: "Budget recommendation to the plenary body" },
  binding: { name: "Obligation for all States (Art. 25)", why: "Only the Security Council can adopt decisions that are binding on all Member States (Art. 25 of the Charter)." },
  art41: { name: "Article 41 measures (Chapter VII)", why: "Article 41 measures are reserved to the Security Council acting under Chapter VII." },
  mission: { name: "Mandate of an international mission", why: "Mandating a field mission is a matter for the Security Council." },
  visit: { name: "Visiting mission" },
  rapporteur: { name: "Special procedure (special rapporteur)", why: "Establishing special procedures is a matter for the Human Rights Council." },
  convention: { name: "International convention" },
  danger: { name: "List of World Heritage in Danger", why: "Only the World Heritage Committee can inscribe a property on the List of World Heritage in Danger (1972 Convention, Art. 11.4)." },
  monitor: { name: "Reactive monitoring mission" },
  urgent: { name: "Urgent Safeguarding List", why: "Inscription on the Urgent Safeguarding List is a matter for the Committee of the 2003 Convention." },
  petition: { name: "Examination of a petition" },
  admin: { name: "Recommendation to the Administering Authority" }
};
/* Verbes : l'identifiant reste le verbe français (règles, forces) ; seul l'affichage change */
const EN_VERBS = {
  "Exige": "Demands", "Décide": "Decides", "Demande": "Calls upon", "Exhorte": "Strongly urges", "Engage": "Urges", "Prie": "Requests",
  "Recommande": "Recommends", "Encourage": "Encourages", "Invite": "Invites", "Souligne": "Stresses", "Prend note": "Takes note",
  "Réaffirme": "Reaffirms", "Rappelle": "Recalls"
};
const EN_CONSTRAINTS = {
  budget: "The regular budget is subject to zero nominal growth: any new expenditure will have to be offset.",
  rapport: "The Secretariat's report on the matter is due in six months: several delegations want to avoid duplication.",
  precedent: "Several delegations fear that an overly ambitious text would set a precedent on the sovereignty of States.",
  annonces: "The last pledging conference covered only 41% of needs (fictional figure).",
  elections: "The session is taking place ahead of elections in several States, which limits their room for manoeuvre.",
  regional: "A regional organization has just announced its own initiative, presented as complementary to the multilateral framework.",
  prive: "Private actors in the sector are calling for harmonized standards and offering to co-finance some of the actions.",
  opinion: "The incident received wide media coverage: public opinion expects a visible response."
};
const EN_DOMESTIC = [
  "Your parliament has adopted a motion opposing any new multi-year financial commitment.",
  "Public opinion in your country, highly mobilized since the incident, expects a concrete result.",
  "Your ministry of the economy insists that the text should spare national economic actors.",
  "Your government rejects any mechanism that could be seen as interference in its internal affairs.",
  "Your capital wants you to secure recognition of the role of regional organizations.",
  "Your minister has publicly promised additional resources for the most vulnerable countries."
];

/* ===== VERSION ANGLAISE — banque de sujets =====
   Mêmes identifiants que les tables françaises. Formes : obj = groupe nominal (« States »),
   inf = groupe verbal sans « to », stmt = proposition (après « that »). */
const EN_GENERIC_CLAUSES = {
  g_report: { inf: "submit to it, within {mois} months, a report on {objet}, with concrete recommendations" },
  g_annual: { inf: "report to it annually on the implementation of the present {act}" },
  g_coop: { obj: "States", inf: "strengthen their cooperation on {court}, in particular through the exchange of information and good practices" },
  g_cap: { obj: "States that are in a position to do so", inf: "provide technical and financial assistance to developing countries in the field of {court}" },
  g_volfund: { obj: "States and other donors", inf: "make voluntary contributions to a trust fund dedicated to {objet}" },
  g_assessed: { inf: "finance the activities provided for in the present {act} from assessed contributions under the regular budget" },
  g_assessrec: { inf: "include in the regular budget the resources required for {objet}" },
  g_wg: { inf: "establish an open-ended working group to propose, within one year, concrete measures relating to {objet}" },
  g_monitor: { inf: "establish an independent mechanism to monitor the implementation of commitments relating to {objet} and to report on it every year" },
  g_sov: { stmt: "any measure taken under the present {act} must fully respect the sovereignty of States and the principle of national ownership" },
  g_regional: { obj: "regional and subregional organizations", inf: "play a leading role in the implementation of the present {act}" },
  g_private: { obj: "States", inf: "develop partnerships with the private sector, foundations and academia in order to mobilize additional resources and expertise" },
  g_national: { obj: "States", inf: "adopt national strategies on {objet}, with measurable targets and a timetable" },
  g_binding: { obj: "all States", inf: "take the legislative and administrative measures necessary to {but}" },
  g_rights: { obj: "States", inf: "ensure that measures relating to {objet} fully respect international human rights law" },
  g_open: { obj: "States", inf: "promote the open sharing of data, knowledge and technologies relating to {objet}, in particular for the benefit of developing countries" },
  g_regulate: { obj: "States", inf: "adopt a clear, risk-based regulatory framework on {court}" },
  g_selfreg: { obj: "the private actors concerned", inf: "adopt voluntary codes of conduct and report publicly on their implementation" },
  g_restrict: { obj: "States", inf: "adopt strict limitation measures where necessary for {but2}" },
  g_incent: { obj: "States", inf: "give priority to incentive measures involving the economic actors concerned" }
};
const EN_GENERIC_PREAMBLE = {
  ONU: ["Recalling the purposes and principles of the Charter of the United Nations"],
  UNESCO: ["Recalling the Constitution of UNESCO"],
  sov: "Reaffirming its commitment to the sovereignty, political independence and territorial integrity of all States",
  coop: "Stressing the importance of international and regional cooperation",
  concern: "{Preoccupe} by {trigger}",
  ch7: "Acting under Chapter VII of the Charter of the United Nations"
};
const EN_ISSUES = {
  infra: {
    title: "Protection of humanitarian infrastructure against natural disasters",
    v: { objet: "the protection of humanitarian infrastructure exposed to natural disasters", court: "the resilience of humanitarian infrastructure", but: "protect essential humanitarian infrastructure against the effects of natural disasters", but2: "the protection of humanitarian infrastructure", outil: "a rapid alert and response mechanism" },
    facts: [["Humanitarian warehouses and centres damaged in one year", ""], ["People deprived of aid for more than a week", " people"], ["Share of reconstruction needs funded", "%"]],
    triggers: ["the destruction by a cyclone of the main humanitarian warehouses of the {lieu} archipelago, which left {n} people without assistance for {j} days", "exceptional floods that swept away the bridges and the only airport of the {lieu} region, cutting off the routes used to deliver aid", "an earthquake that damaged the hospitals and the water network of the city of {lieu}, already weakened by an economic crisis"],
    background: "Disasters caused by natural hazards affect millions of people every year. The Sendai Framework for Disaster Risk Reduction 2015-2030 sets, among other targets, the goal of reducing disaster damage to critical infrastructure.",
    history: ["In {y1}, a first thematic debate highlighted the lack of coordination between emergency and reconstruction actors.", "In {y2}, the Secretariat recommended mapping critical humanitarian infrastructure in the most exposed areas."],
    pre: ["Recalling General Assembly resolution 46/182 of 19 December 1991 on strengthening of the coordination of humanitarian emergency assistance", "Recalling the Sendai Framework for Disaster Risk Reduction 2015-2030"],
    proposals: ["an international mechanism for the alert and protection of humanitarian infrastructure", "a regional fund for resilient reconstruction", "voluntary guidelines on infrastructure resilience"],
    clauses: {
      i_plans: { obj: "States", inf: "integrate the protection of humanitarian infrastructure into their national disaster risk reduction plans" },
      i_stocks: { obj: "regional organizations", inf: "preposition emergency stocks and logistical assets in the most exposed areas" },
      i_alert: { inf: "establish a common early warning system mapping critical humanitarian infrastructure" },
      i_access: { obj: "all States", inf: "guarantee humanitarian personnel and relief equipment unimpeded access to the affected areas" },
      i_visit: { inf: "dispatch a mission of the Council to the {lieu} region to assess the protection needs of humanitarian infrastructure" }
    },
    objectif: "a framework for protecting humanitarian infrastructure exposed to disasters"
  },
  routes: {
    title: "Securing commercial shipping routes",
    v: { objet: "the security of commercial shipping routes", court: "maritime security", but: "ensure the safety of navigation on commercial shipping routes", but2: "the safety of navigation", outil: "an international maritime coordination centre" },
    facts: [["Security incidents reported in one year", ""], ["Share of world trade passing through the area", "%"], ["Increase in marine insurance premiums", "%"]],
    triggers: ["a failure of positioning systems that left {n2} merchant ships disoriented in the {lieu} strait for {h} hours", "the blocking of the {lieu} channel for {j} days after a container ship ran aground, disrupting the supply chains of an entire region", "a series of collisions involving merchant ships off the {lieu} archipelago, which led several shipowners to suspend their services"],
    background: "Around 80% of world trade by volume is carried by sea, according to UNCTAD. A handful of straits and channels concentrate a large share of these flows.",
    history: ["In {y1}, an expert meeting identified the vulnerabilities of the main trade routes.", "In {y2}, the Secretariat called for better coordination of information-sharing between coastal States and flag States."],
    pre: ["Recalling the United Nations Convention on the Law of the Sea of 10 December 1982", "Reaffirming the freedom of navigation, in accordance with international law"],
    proposals: ["an international maritime coordination centre", "a capacity-building programme for coastal States", "a voluntary code of conduct for shipowners"],
    clauses: {
      r_centres: { obj: "States", inf: "establish regional maritime information-sharing centres, in cooperation with the International Maritime Organization" },
      r_report: { obj: "all States", inf: "report without delay to the International Maritime Organization any serious incident affecting the safety of navigation" },
      r_flag: { obj: "flag States", inf: "strengthen their oversight of the compliance of ships on their registers with international security standards" },
      r_exercise: { obj: "coastal States and regional organizations", inf: "conduct joint maritime surveillance exercises" },
      r_mech: { inf: "establish an international maritime security coordination mechanism attached to the Secretariat" }
    },
    objectif: "a cooperation framework to secure the main shipping routes"
  },
  piraterie: {
    title: "International cooperation against piracy",
    v: { objet: "the fight against piracy and armed robbery at sea", court: "the fight against piracy", but: "repress piracy and prosecute those responsible", but2: "the safety of seafarers", outil: "a regional prosecution mechanism" },
    facts: [["Attacks or attempted attacks recorded in one year", ""], ["Seafarers held hostage", ""], ["Suspects released for lack of jurisdiction", "%"]],
    triggers: ["the hijacking of an oil tanker and its {n3} crew members off the Gulf of {lieu}", "a resurgence of attacks on small-scale fishers along the coast of {lieu}", "the release of {n3} suspects for lack of a competent jurisdiction, after their arrest by an international patrol"],
    background: "The United Nations Convention on the Law of the Sea (articles 100 to 107) requires States to cooperate in the repression of piracy on the high seas. For lack of a jurisdiction ready to try them, many suspects are released after their arrest.",
    history: ["In {y1}, an informal contact group coordinated naval patrols in the area.", "In {y2}, the Secretariat highlighted the lack of judicial capacity in the States of the region."],
    pre: ["Recalling articles 100 to 107 of the United Nations Convention on the Law of the Sea", "Recalling the Convention for the Suppression of Unlawful Acts against the Safety of Maritime Navigation, adopted in 1988"],
    proposals: ["a regional court specialized in piracy cases", "coordinated international naval patrols", "a programme of jobs and sustainable fishing for coastal communities"],
    clauses: {
      p_crim: { obj: "States", inf: "criminalize piracy under their domestic law and prosecute the alleged perpetrators they apprehend" },
      p_trial: { obj: "States", inf: "guarantee suspects respect for international fair trial standards" },
      p_assets: { obj: "all States", inf: "freeze the funds and economic resources of persons who finance acts of piracy, as designated by a committee of the Council" },
      p_jobs: { obj: "States and regional organizations", inf: "support retraining and sustainable fishing programmes in the coastal communities concerned" }
    },
    objectif: "effective international cooperation against piracy"
  },
  missions: {
    title: "Protection of international missions in crisis areas",
    v: { objet: "the safety and security of the personnel of international missions", court: "the security of international missions", but: "ensure the safety and security of the personnel of international missions", but2: "the security of personnel", outil: "a common threat assessment system" },
    facts: [["Security incidents targeting missions in one year", ""], ["Staff members evacuated", ""], ["Field bases without an up-to-date evacuation plan", "%"]],
    triggers: ["the looting of the warehouses of an international mission in the {lieu} region", "the abduction of two staff members of an observer mission, released {j} days later near {lieu}", "repeated threats against an electoral assistance mission in the province of {lieu}"],
    background: "The 1994 Convention on the Safety of United Nations and Associated Personnel commits States Parties to protecting such personnel and prosecuting the perpetrators of attacks. Protection is first and foremost the responsibility of the host country.",
    history: ["In {y1}, an independent evaluation found gaps in the evacuation plans.", "In {y2}, several contributing countries called for a better threat analysis before each deployment."],
    pre: ["Recalling the Convention on the Safety of United Nations and Associated Personnel of 9 December 1994", "Recalling that the primary responsibility for the protection of international personnel lies with the host country"],
    proposals: ["a common threat assessment and rapid response system", "strengthened security agreements with host countries", "protection entrusted to regional organizations"],
    clauses: {
      m_prosecute: { obj: "all States", inf: "prosecute the perpetrators of attacks against the personnel of international missions who are present on their territory" },
      m_sofa: { obj: "host countries", inf: "conclude with each mission an agreement specifying the security guarantees granted to its personnel" },
      m_mandate: { inf: "strengthen, in the mandates of the missions concerned, the capacity to protect and evacuate personnel" },
      m_regional: { obj: "regional organizations", inf: "contribute to the protection of missions deployed in their region, in coordination with the Organization" }
    },
    objectif: "better protection for the personnel of international missions"
  },
  eau: {
    title: "Preventing crises related to water resources",
    v: { objet: "the prevention of crises related to shared water resources", court: "water cooperation", but: "prevent disputes over transboundary water resources", but2: "the preservation of water resources", outil: "a water diplomacy mechanism" },
    facts: [["Population of the basin concerned", " million inhabitants"], ["Fall in average flow over ten years", "%"], ["Basin agreements in force", ""]],
    triggers: ["a historic drought that halved the flow of the {lieu} river, rekindling tensions between riparian States", "the filling of a large dam on the upper course of the {lieu}, without any agreement on sharing hydrological data", "the accidental pollution of a shared aquifer that supplies {n} inhabitants of the {lieu} region"],
    background: "In 2010, the General Assembly recognized the right to safe drinking water and sanitation as a human right (resolution 64/292). Many transboundary basins are not covered by any cooperation agreement.",
    history: ["In {y1}, a regional conference proposed voluntary sharing of hydrological data.", "In {y2}, negotiations between riparian States were suspended for lack of agreement on minimum flows."],
    pre: ["Recalling General Assembly resolution 64/292 of 28 July 2010 on the human right to water and sanitation", "Recalling the 2030 Agenda for Sustainable Development, in particular Goal 6"],
    proposals: ["an international water diplomacy mechanism", "regional basin commissions supported by a dedicated fund", "voluntary sharing of hydrological data"],
    clauses: {
      e_basin: { obj: "riparian States", inf: "conclude or update basin agreements providing for the regular exchange of hydrological data" },
      e_notify: { obj: "States", inf: "give advance notice of infrastructure projects likely to alter the flow of shared watercourses" },
      e_experts: { inf: "establish a group of experts to support riparian States, at their request, in preventing water-related disputes" },
      e_finance: { obj: "international financial institutions", inf: "facilitate access by developing countries to financing for resilient water infrastructure" }
    },
    objectif: "a framework for preventing water-related crises"
  },
  cyber: {
    title: "Protecting critical infrastructure against cyber incidents",
    v: { objet: "the protection of critical infrastructure against cyber incidents", court: "the cybersecurity of critical infrastructure", but: "protect critical infrastructure against cyber incidents", but2: "the protection of critical infrastructure", outil: "an international network of points of contact" },
    facts: [["Serious cyber incidents reported on critical infrastructure", ""], ["Hospitals hit by ransomware", ""], ["States with a national incident response team", "%"]],
    triggers: ["a ransomware attack that paralysed the power grid of the city of {lieu} for {h} hours, leaving {n} households without electricity", "an intrusion into the control systems of a water treatment plant in {lieu}", "the shutdown of the air traffic control systems of {lieu} airport for {h} hours"],
    background: "UN Member States have recognized that international law, and in particular the Charter, applies to the use of information and communications technologies, and have adopted voluntary norms of responsible behaviour.",
    history: ["In {y1}, a regional seminar revealed that one third of States had no point of contact reachable around the clock.", "In {y2}, several digital companies offered to share information on vulnerabilities."],
    pre: ["Reaffirming that international law, in particular the Charter of the United Nations, applies to the use of information and communications technologies", "Recalling the voluntary, non-binding norms of responsible State behaviour in cyberspace"],
    proposals: ["a binding convention on the protection of critical infrastructure", "a voluntary network of points of contact and mutual assistance", "public-private partnerships for network security"],
    clauses: {
      c_poc: { obj: "States", inf: "designate a national point of contact reachable at all times in the event of a serious cyber incident" },
      c_refrain: { obj: "States", inf: "refrain from any activity intended to damage the critical infrastructure of another State" },
      c_vuln: { obj: "digital companies", inf: "share relevant information on critical vulnerabilities with the competent authorities" },
      c_registry: { inf: "establish a voluntary register of cybersecurity assistance needs and offers" }
    },
    objectif: "better protection of critical infrastructure"
  },
  education: {
    title: "Universal access to education",
    v: { objet: "universal access to quality education, as part of the right to education", court: "access to education", but: "guarantee free access to primary and secondary education", but2: "equal access to school", outil: "a global action plan" },
    facts: [["Out-of-school children and adolescents in the region", " million"], ["Schools damaged or closed", ""], ["Share of public expenditure devoted to education", "%"]],
    triggers: ["the closure of {n2} schools in the {lieu} region after floods", "the abolition of scholarships for pupils in the rural areas of {lieu}", "a study revealing that {p}% of girls in the {lieu} region leave school before the age of 15"],
    background: "The right to education is enshrined in article 26 of the Universal Declaration of Human Rights. Sustainable Development Goal 4 aims to ensure quality education for all by 2030.",
    history: ["In {y1}, a regional forum set common enrolment targets without providing any funding.", "In {y2}, the Secretariat found that the region was lagging behind on most of the Goal 4 targets."],
    pre: ["Recalling article 26 of the Universal Declaration of Human Rights", "Recalling the Convention on the Rights of the Child", "Recalling Sustainable Development Goal 4"],
    proposals: ["free secondary education with international follow-up", "a global fund for education in the least developed countries", "partnerships with the private sector to equip schools"],
    clauses: {
      ed_free: { obj: "States", inf: "progressively guarantee free secondary education" },
      ed_budget: { obj: "States", inf: "devote at least 4 to 6% of their gross domestic product, or 15 to 20% of their public expenditure, to education" },
      ed_girls: { obj: "States", inf: "remove the obstacles that prevent girls and children with disabilities from going to school" },
      ed_private: { obj: "companies and foundations", inf: "contribute to the digital equipment of schools in disadvantaged areas" }
    },
    objectif: "a common commitment to universal access to education"
  },

  journalistes: {
    title: "Protection of journalists",
    v: { objet: "the safety of journalists and the fight against impunity", court: "the safety of journalists", but: "investigate all attacks against journalists and prosecute those responsible", but2: "the safety of journalists", outil: "a mechanism to monitor investigations" },
    facts: [["Journalists subjected to violence in the region in one year", ""], ["Cases solved", "%"], ["Journalists in detention", ""]],
    triggers: ["the death of an investigative journalist in the city of {lieu}, whose case has been at a standstill for {mois} months", "the arrest of {n3} reporters who were covering demonstrations in {lieu}", "the revelation of an online harassment campaign targeting newsrooms in {lieu}"],
    background: "The United Nations Plan of Action on the Safety of Journalists and the Issue of Impunity, launched in 2012, is coordinated by UNESCO. The vast majority of killings of journalists go unpunished.",
    history: ["In {y1}, a regional survey showed that most threats against journalists were never reported.", "In {y2}, several States set up national protection mechanisms, with mixed results."],
    pre: ["Recalling article 19 of the Universal Declaration of Human Rights and article 19 of the International Covenant on Civil and Political Rights", "Recalling the United Nations Plan of Action on the Safety of Journalists and the Issue of Impunity"],
    proposals: ["an international mechanism to monitor investigations into attacks on journalists", "national protection mechanisms supported by regional organizations", "an approach based on training and on the safety of journalists"],
    clauses: {
      j_inquiry: { obj: "States", inf: "conduct impartial, prompt and effective investigations into all violence against journalists" },
      j_rapporteur: { inf: "appoint, for a period of three years, a special rapporteur on the safety of journalists" },
      j_national: { obj: "States", inf: "set up national early warning and protection mechanisms for journalists under threat" },
      j_dg: { inf: "report every two years on the status of judicial investigations into violence against journalists" }
    },
    objectif: "effective protection of journalists and an end to impunity"
  },
  discriminations: {
    title: "Combating discrimination in access to public services",
    v: { objet: "equal access to public services", court: "non-discrimination in public services", but: "guarantee equal access to public services without discrimination", but2: "equal access to public services", outil: "an international observatory" },
    facts: [["People without a birth certificate in the region", " people"], ["Gap in access to health care between rural and urban areas", " points"], ["Discrimination complaints recorded", ""]],
    triggers: ["a survey showing that residents of the {lieu} region wait on average {j} days longer than others to obtain health care", "the compulsory digitization of administrative procedures in {lieu}, which in practice excludes people without internet access", "the refusal to enter {n2} nomadic families in the civil registry of the province of {lieu}"],
    background: "The principle of non-discrimination is set out in article 2 of the Universal Declaration of Human Rights. Target 16.9 of the Sustainable Development Goals aims to provide legal identity for all, including birth registration, by 2030.",
    history: ["In {y1}, a report showed that the lack of identity papers was the leading cause of exclusion from public services in the region.", "In {y2}, several States accelerated the digitization of their administrations without providing any alternative."],
    pre: ["Recalling article 2 of the Universal Declaration of Human Rights", "Recalling target 16.9 of the 2030 Agenda for Sustainable Development, on legal identity"],
    proposals: ["an international observatory on discrimination in public services", "a support programme for civil registration and local services", "voluntary national plans for administrative simplification"],
    clauses: {
      d_birth: { obj: "States", inf: "guarantee free birth registration and the issuance of identity documents to all persons" },
      d_offline: { obj: "States", inf: "maintain non-digital access to essential public services" },
      d_data: { obj: "States", inf: "collect disaggregated data to measure inequalities in access to public services" }
    },
    objectif: "equal access to public services"
  },
  deplaces: {
    title: "Protection of people displaced by climate disasters",
    v: { objet: "the protection of persons displaced by climate-related disasters", court: "climate-related displacement", but: "protect persons displaced by climate-related disasters", but2: "the protection of displaced persons", outil: "an international protection framework" },
    facts: [["People displaced in the region in one year", " people"], ["Displaced people still in temporary shelters after one year", "%"], ["Share of relocation plans funded", "%"]],
    triggers: ["the gradual submersion of three atolls of the {lieu} archipelago, whose inhabitants must be relocated", "floods that displaced {n} people in the {lieu} delta", "a prolonged drought that is pushing herders in the {lieu} region to cross borders"],
    background: "The Guiding Principles on Internal Displacement (1998) also cover displacement caused by disasters. There is no specific international status for people who cross a border following a climate disaster.",
    history: ["In {y1}, an intergovernmental initiative compiled good practices in temporary protection.", "In {y2}, the most exposed States called for dedicated funding for planned relocations."],
    pre: ["Recalling the Guiding Principles on Internal Displacement", "Recalling the Sendai Framework for Disaster Risk Reduction 2015-2030"],
    proposals: ["an international framework to protect people displaced across borders", "a fund for the planned relocation of vulnerable communities", "voluntary regional mobility agreements"],
    clauses: {
      dp_policies: { obj: "States", inf: "integrate disaster displacement into their risk reduction and adaptation policies" },
      dp_temp: { obj: "States", inf: "grant temporary protection to persons who cross their border following a sudden-onset disaster" },
      dp_fund: { obj: "developed countries", inf: "increase their financial support for the planned relocation plans of the most vulnerable countries" },
      dp_regional: { obj: "regional organizations", inf: "develop free movement agreements that take disasters into account" }
    },
    objectif: "better protection for people displaced by disasters"
  },
  surveillance: {
    title: "Regulating surveillance technologies",
    v: { objet: "the regulation of surveillance technologies in the light of the right to privacy", court: "surveillance technologies", but: "regulate the export and use of surveillance technologies", but2: "the protection of privacy", outil: "a moratorium" },
    facts: [["States that have acquired commercial spyware", ""], ["Activists and journalists identified as targets", ""], ["States with an independent data protection authority", "%"]],
    triggers: ["the discovery of spyware on the phones of {n3} lawyers and journalists in {lieu}", "the deployment of real-time facial recognition in public spaces in the city of {lieu}", "the leak of a surveillance database containing the personal information of {n} people"],
    background: "Article 17 of the International Covenant on Civil and Political Rights protects against arbitrary interference with privacy. Since 2013, the General Assembly has adopted resolutions on the right to privacy in the digital age.",
    history: ["In {y1}, a report by the Office of the High Commissioner called for regulating the sale of spyware.", "In {y2}, several companies in the sector adopted voluntary principles that civil society considered insufficient."],
    pre: ["Recalling article 12 of the Universal Declaration of Human Rights and article 17 of the International Covenant on Civil and Political Rights", "Recalling the General Assembly resolutions on the right to privacy in the digital age"],
    proposals: ["a moratorium on the sale of spyware until safeguards are adopted", "harmonized national export controls", "voluntary due diligence principles for companies"],
    clauses: {
      s_judge: { obj: "States", inf: "make the use of surveillance technologies subject to prior judicial authorization and independent oversight" },
      s_moratorium: { obj: "States", inf: "introduce a moratorium on the sale and transfer of spyware until safeguards that comply with human rights are in place" },
      s_diligence: { obj: "companies", inf: "exercise human rights due diligence before any sale of surveillance technologies" }
    },
    objectif: "rights-respecting regulation of surveillance technologies"
  },

  tourisme: {
    title: "Protecting cultural heritage threatened by mass tourism",
    v: { objet: "the protection of heritage sites against mass tourism", court: "sustainable tourism at heritage sites", but: "limit the effects of mass tourism on heritage sites", but2: "the protection of heritage sites", outil: "visitor flow management plans" },
    facts: [["Annual visitors to the site", " visitors"], ["Increase in visitor numbers over five years", "%"], ["Share of tourism revenue reinvested in conservation", "%"]],
    triggers: ["the partial collapse of a wall of the historic city of {lieu}, attributed to overcrowding", "the simultaneous arrival of {n4} cruise ships in the historic port of {lieu}", "the departure of almost all the residents of the historic centre of {lieu}, replaced by tourist rentals"],
    background: "The 1972 Convention concerning the Protection of the World Cultural and Natural Heritage commits States Parties to ensuring the protection and conservation of the properties located on their territory. Tourism is also an essential resource for many sites.",
    history: ["In {y1}, an advisory mission recommended capping visitor numbers at peak times.", "In {y2}, the local authorities tried out compulsory booking, which was dropped under pressure from the tourism industry."],
    pre: ["Recalling the Convention concerning the Protection of the World Cultural and Natural Heritage, adopted on 16 November 1972", "Recalling the UNESCO World Heritage and Sustainable Tourism Programme"],
    proposals: ["binding visitor quotas for the most threatened sites", "a heritage tourist tax earmarked for conservation", "a voluntary responsible tourism label with tour operators"],
    clauses: {
      t_danger: { inf: "inscribe the historic city of {lieu} on the List of World Heritage in Danger" },
      t_mission: { inf: "dispatch a joint World Heritage Centre/ICOMOS reactive monitoring mission to the historic city of {lieu}" },
      t_flows: { obj: "States Parties", inf: "adopt visitor flow management plans for the most visited properties" },
      t_revenue: { obj: "States Parties", inf: "allocate a share of tourism revenue to the conservation of sites" },
      t_charter: { obj: "tour operators", inf: "sign up to responsible tourism charters drawn up with site managers" }
    },
    objectif: "sustainable management of tourism at heritage sites"
  },
  climat_patrimoine: {
    title: "World Heritage properties and climate change",
    v: { objet: "the protection of World Heritage properties against the effects of climate change", court: "the adaptation of heritage to climate change", but: "protect World Heritage properties against the effects of climate change", but2: "the protection of threatened properties", outil: "adaptation plans" },
    facts: [["World Heritage properties in the region exposed to sea-level rise", ""], ["Estimated cost of adaptation works", " million dollars"], ["Properties with an adaptation plan", "%"]],
    triggers: ["the mass bleaching of the {lieu} coral reef, inscribed on the World Heritage List", "the coastal erosion threatening the remains of the ancient port of {lieu}", "unprecedented fires around the natural site of {lieu}"],
    background: "According to assessments by UNESCO and IUCN, climate change has become one of the main threats to World Heritage properties, in particular natural properties.",
    history: ["In {y1}, a study identified the properties in the region most exposed to sea-level rise.", "In {y2}, requests for international assistance exceeded the resources available in the World Heritage Fund."],
    pre: ["Recalling the Convention concerning the Protection of the World Cultural and Natural Heritage, adopted on 16 November 1972", "Recalling the Paris Agreement adopted in 2015"],
    proposals: ["the systematic inscription of seriously threatened properties on the List in Danger", "an adaptation fund for properties in the most vulnerable countries", "voluntary adaptation plans defined by each State Party"],
    clauses: {
      cp_danger: { inf: "inscribe the site of {lieu} on the List of World Heritage in Danger" },
      cp_mission: { inf: "dispatch a joint reactive monitoring mission with IUCN to the site of {lieu}" },
      cp_plans: { obj: "States Parties", inf: "integrate climate change adaptation into the management plans of their properties" },
      cp_fund: { inf: "grant emergency international assistance from the World Heritage Fund for the protection of the site of {lieu}" }
    },
    objectif: "the adaptation of World Heritage properties to climate change"
  },
  langues: {
    title: "Preserving endangered languages",
    v: { objet: "the safeguarding of endangered languages", court: "linguistic diversity", but: "guarantee the teaching and public use of endangered languages", but2: "the safeguarding of endangered languages", outil: "transmission programmes" },
    facts: [["Languages in the region considered endangered", ""], ["Speakers under the age of 20", "%"], ["Schools offering bilingual education", "%"]],
    triggers: ["the death of the last native speaker of a language of the {lieu} valley", "the abolition of bilingual education in the schools of the {lieu} region", "the deterioration of sound archives holding {n5} hours of oral narratives from the {lieu} region"],
    background: "The General Assembly proclaimed the International Decade of Indigenous Languages (2022-2032), with UNESCO as the lead agency. A language stops being passed on when children no longer learn it.",
    history: ["In {y1}, a regional atlas classified more than half of the region's languages as vulnerable or endangered.", "In {y2}, several communities requested access to recordings held by foreign institutions."],
    pre: ["Recalling the Convention for the Safeguarding of the Intangible Cultural Heritage, adopted on 17 October 2003", "Recalling the International Decade of Indigenous Languages (2022-2032)"],
    proposals: ["a right to education in endangered languages", "an open international documentation and digitization programme", "voluntary community initiatives"],
    clauses: {
      l_urgent: { inf: "inscribe the oral traditions of the {lieu} valley on the List of Intangible Cultural Heritage in Need of Urgent Safeguarding" },
      l_bilingual: { obj: "States", inf: "promote bilingual education in regions where endangered languages are spoken" },
      l_open: { obj: "States and research institutions", inf: "make the recordings and dictionaries of endangered languages freely accessible, with the consent of the communities" },
      l_fund: { inf: "grant international assistance from the Intangible Cultural Heritage Fund for an intergenerational transmission programme" }
    },
    objectif: "the safeguarding and transmission of endangered languages"
  },
  savoirfaire: {
    title: "Safeguarding endangered craft skills",
    v: { objet: "the safeguarding of traditional craft skills", court: "traditional know-how", but: "ensure the transmission of traditional craft skills", but2: "the safeguarding of know-how", outil: "transmission programmes" },
    facts: [["Master craftspeople still working", ""], ["Average age of practitioners", " years"], ["Industrial imitations sold as handmade", "%"]],
    triggers: ["the announced closure of the {lieu} weaving workshop, the last place where a centuries-old technique is passed on", "the mass sale of industrial imitations of the traditional pottery of {lieu}", "the registration by a company of a trademark using a traditional pattern of the {lieu} community"],
    background: "The 2003 Convention for the Safeguarding of the Intangible Cultural Heritage covers skills related to traditional craftsmanship and provides for the participation of the communities concerned in their safeguarding.",
    history: ["In {y1}, a national inventory counted fewer than a hundred active practitioners.", "In {y2}, a cooperative of craftspeople requested protection against industrial imitations."],
    pre: ["Recalling the 2003 Convention for the Safeguarding of the Intangible Cultural Heritage, in particular its article 2", "Recalling the Ethical Principles for Safeguarding Intangible Cultural Heritage"],
    proposals: ["legal protection for craft appellations", "transmission grants funded by the Intangible Cultural Heritage Fund", "partnerships with design and fair trade"],
    clauses: {
      sf_urgent: { inf: "inscribe the weaving know-how of {lieu} on the List of Intangible Cultural Heritage in Need of Urgent Safeguarding" },
      sf_fund: { inf: "grant international assistance from the Intangible Cultural Heritage Fund for transmission programmes between masters and apprentices" },
      sf_protect: { obj: "States Parties", inf: "protect communities against the misappropriation of their skills and traditional patterns" },
      sf_fair: { obj: "fair trade actors", inf: "involve the communities that hold these skills in promoting them" }
    },
    objectif: "the transmission of endangered craft skills"
  },

  ia_education: {
    title: "Artificial intelligence and the future of education",
    v: { objet: "the use of artificial intelligence in education", court: "artificial intelligence in education", but: "regulate the use of artificial intelligence in education systems", but2: "the protection of pupils", outil: "international guidelines" },
    facts: [["Pupils using a generative AI tool every week", "%"], ["Teachers trained in AI", "%"], ["Schools in the region without a reliable internet connection", "%"]],
    triggers: ["the leak of data on {n} pupils collected by an AI-based educational platform", "the decision by the city of {lieu} to replace part of its lessons with automated tutors", "a study showing a widening gap in results between equipped and unequipped pupils in the {lieu} region"],
    background: "In 2021, the UNESCO General Conference adopted the Recommendation on the Ethics of Artificial Intelligence, the first global standard-setting instrument on the subject. The arrival of generative AI tools in schools raises questions of data protection, equity and teaching.",
    history: ["In {y1}, a survey showed that most schools had no rules on the use of AI.", "In {y2}, several ministries published diverging national recommendations."],
    pre: ["Recalling the UNESCO Recommendation on the Ethics of Artificial Intelligence, adopted in 2021", "Recalling Sustainable Development Goal 4"],
    proposals: ["binding rules to protect pupils' data", "open educational resources and open AI tools", "partnerships with the technology industry to equip schools"],
    clauses: {
      ia_age: { obj: "States", inf: "set a minimum age and data protection safeguards for the use of generative AI tools at school" },
      ia_open: { obj: "States", inf: "promote open educational resources and open AI tools adapted to local languages" },
      ia_teachers: { obj: "States", inf: "train teachers in the critical and responsible use of artificial intelligence" },
      ia_transparency: { obj: "technology companies", inf: "guarantee the transparency of the algorithms used in educational tools" }
    },
    objectif: "the use of artificial intelligence in the service of education"
  },
  commerce: {
    title: "Regulating the commercialization of World Heritage",
    v: { objet: "the regulation of the commercial exploitation of World Heritage", court: "the commercialization of heritage", but: "regulate the commercial exploitation of the name, the image and the properties of World Heritage", but2: "the integrity of heritage", outil: "a charter of use" },
    facts: [["Products using the emblem without authorization", ""], ["Cultural objects sold online without established provenance", ""], ["Revenue paid back to site managers", "%"]],
    triggers: ["the online auction of {n6} objects presented as coming from the site of {lieu}, without a certificate of origin", "the registration by a private company of the trademark “{lieu}” for tourist products", "an advertising campaign using the image of the site of {lieu} without the agreement of local communities"],
    background: "The 1970 UNESCO Convention aims to prohibit and prevent the illicit import, export and transfer of ownership of cultural property. Online sales have multiplied transactions that are difficult to control.",
    history: ["In {y1}, a group of experts identified the platforms where objects without established provenance circulate.", "In {y2}, several site managers denounced the commercial use of their image without compensation."],
    pre: ["Recalling the Convention on the Means of Prohibiting and Preventing the Illicit Import, Export and Transfer of Ownership of Cultural Property, adopted on 14 November 1970", "Recalling the 1972 Convention concerning the Protection of the World Cultural and Natural Heritage"],
    proposals: ["a ban on the online sale of cultural objects without a certificate of provenance", "revenue sharing for the benefit of communities and conservation", "a voluntary charter for platforms and brands"],
    clauses: {
      co_cert: { obj: "States", inf: "require a certificate of provenance for any sale of cultural property on online platforms" },
      co_remove: { obj: "online marketplaces", inf: "remove without delay any listing of cultural objects whose lawful provenance has not been established" },
      co_benefit: { obj: "States Parties", inf: "ensure that the commercial use of the name and image of World Heritage properties benefits their conservation and local communities" },
      co_emblem: { inf: "draw up guidelines on the commercial use of the World Heritage emblem" }
    },
    objectif: "a framework for the commercialization of heritage"
  },
  archives: {
    title: "Protecting historical and digital archives",
    v: { objet: "the preservation of historical archives and digital heritage", court: "the preservation of archives", but: "preserve historical and digital archives and make them accessible", but2: "the preservation of archives", outil: "a safeguarding programme" },
    facts: [["Archival documents at risk of deterioration", " documents"], ["Public websites gone in ten years", "%"], ["Archives digitized in the region", "%"]],
    triggers: ["the fire at the national archives repository of {lieu}, which held registers more than three centuries old", "the closure of a hosting service, which caused {n} public pages to disappear", "the accelerated deterioration of the magnetic tapes that hold the archives of {lieu} radio"],
    background: "The Memory of the World Programme, launched by UNESCO in 1992, aims to preserve documentary heritage. A recommendation adopted in 2015 deals with its preservation and accessibility, including in digital form.",
    history: ["In {y1}, a survey showed that most archives in the region had no backup copy.", "In {y2}, several national libraries began collecting the public web, with very uneven resources."],
    pre: ["Recalling the Recommendation concerning the Preservation of, and Access to, Documentary Heritage Including in Digital Form, adopted in 2015", "Recalling the Memory of the World Programme"],
    proposals: ["an obligation of digital legal deposit and preservation", "an international digitization fund for developing countries", "voluntary cooperation between libraries and digital companies"],
    clauses: {
      a_legal: { obj: "States", inf: "extend legal deposit to digital publications and websites of public interest" },
      a_emergency: { obj: "States", inf: "draw up emergency plans to protect archives in the event of a disaster" },
      a_online: { obj: "archival institutions", inf: "make their digitized public-domain collections accessible online" }
    },
    objectif: "the preservation of, and access to, historical and digital archives"
  },
  science: {
    title: "Access to scientific resources",
    v: { objet: "access to scientific resources and open science", court: "open science", but: "guarantee open access to publicly funded scientific publications and data", but2: "access to knowledge", outil: "a global open science infrastructure" },
    facts: [["Scientific articles behind a paywall", "%"], ["Annual cost of a university's subscriptions", " dollars"], ["Researchers in the region without access to major journals", "%"]],
    triggers: ["the cancellation, for lack of funds, of the scientific subscriptions of all public universities in {lieu}", "the switch to a paid model of a climate database that had until then been free", "a regional epidemic in {lieu} revealing that sequencing data remained out of reach for local laboratories"],
    background: "The UNESCO Recommendation on Open Science, adopted in 2021, encourages open access to scientific publications, data and infrastructure. Article 27 of the Universal Declaration recognizes the right to share in scientific advancement.",
    history: ["In {y1}, a regional consortium tried unsuccessfully to negotiate a collective agreement with publishers.", "In {y2}, several funding agencies made open access compulsory for the research they fund."],
    pre: ["Recalling the UNESCO Recommendation on Open Science, adopted in 2021", "Recalling article 27 of the Universal Declaration of Human Rights"],
    proposals: ["mandatory open access to publicly funded research", "a fund to support research infrastructure in developing countries", "agreements negotiated with scientific publishers"],
    clauses: {
      sc_open: { obj: "States", inf: "ensure that publications resulting from publicly funded research are freely accessible within twelve months" },
      sc_tiered: { obj: "States and publishers", inf: "negotiate tiered pricing for institutions in developing countries" },
      sc_infra: { obj: "States", inf: "support public open data and archive infrastructure" }
    },
    objectif: "better access to scientific resources"
  },

  subaquatique: {
    title: "Protection of the underwater cultural heritage",
    v: { objet: "the protection of the underwater cultural heritage", court: "underwater heritage", but: "protect wrecks and submerged sites against looting and commercial exploitation", but2: "the protection of submerged sites", outil: "an international register" },
    facts: [["Historic wrecks recorded in the area", ""], ["Sites looted or damaged in ten years", "%"], ["Undeclared dives detected", ""]],
    triggers: ["the discovery that the wreck of a seventeenth-century ship off {lieu} had been looted", "a company's plan to recover and sell the cargo of a historic wreck in the waters of {lieu}", "damage to a submerged site during the laying of an undersea cable near {lieu}"],
    background: "The 2001 Convention on the Protection of the Underwater Cultural Heritage prohibits the commercial exploitation of this heritage and gives priority to its preservation in situ.",
    history: ["In {y1}, a survey campaign recorded many unprotected wrecks in the area.", "In {y2}, objects taken from wrecks appeared in international auctions."],
    pre: ["Recalling the Convention on the Protection of the Underwater Cultural Heritage, adopted on 2 November 2001", "Recalling the United Nations Convention on the Law of the Sea, in particular its articles 149 and 303"],
    proposals: ["a strict ban on any commercial recovery", "an international register and joint inspections", "regulated partnerships with archaeology companies"],
    clauses: {
      u_ban: { obj: "States", inf: "prohibit the commercial exploitation of wrecks and submerged sites under their jurisdiction" },
      u_insitu: { obj: "States", inf: "give priority to the in situ preservation of underwater heritage" },
      u_registry: { inf: "establish an international register of threatened underwater sites" },
      u_survey: { obj: "offshore works companies", inf: "carry out archaeological surveys before laying any cable or pipeline" }
    },
    objectif: "the protection of the underwater cultural heritage"
  },
  tutelle_autonomie: {
    title: "Self-government for a Trust Territory (fictional)",
    v: { objet: "the attainment of self-government by the Trust Territory of the {terr} Islands", court: "the self-government of the Territory", but: "prepare the Territory for self-government", but2: "the rights of the inhabitants of the Territory", outil: "a popular consultation" },
    facts: [["Population of the Territory", " inhabitants"], ["Young people in secondary school", "%"], ["Public revenue covered by the Administering Authority", "%"]],
    triggers: ["a petition signed by {n} inhabitants of the {terr} Islands calling for a referendum on self-determination", "the annual report of the Administering Authority on the {terr} Islands, which several members of the Council consider incomplete", "peaceful demonstrations in the capital of the {terr} Islands calling for a transition timetable"],
    background: "The International Trusteeship System (Charter, Chapters XII and XIII) was designed to promote the progressive development of territories towards self-government or independence (Art. 76). The {terr} Islands and their Administering Authority are fictional.",
    history: ["In {y1}, a (fictional) visiting mission recommended speeding up the training of the local administration.", "In {y2}, the elected assembly of the Territory called for a precise transition timetable."],
    pre: ["Recalling Chapters XII and XIII of the Charter of the United Nations, in particular Article 76", "Recalling the Declaration on the Granting of Independence to Colonial Countries and Peoples, contained in General Assembly resolution 1514 (XV)"],
    proposals: ["a popular consultation under international supervision within two years", "a gradual transition plan funded by the Administering Authority", "maintaining the status quo until the next review"],
    clauses: {
      ta_calendar: { obj: "the Administering Authority", inf: "present a timetable for the transition to self-government, drawn up with the elected representatives of the Territory" },
      ta_visit: { inf: "send a visiting mission to the Territory before its next session" },
      ta_petition: { inf: "examine the petition submitted on behalf of the inhabitants of the Territory and respond to it at its next session" },
      ta_invest: { obj: "the Administering Authority", inf: "increase its investment in secondary education and in the training of the local administration" }
    },
    objectif: "a well-managed transition to self-government for the Territory"
  },
  tutelle_ressources: {
    title: "Natural resources of a Trust Territory (fictional)",
    v: { objet: "the management of the natural resources of the Trust Territory of the {terr} Islands", court: "the resources of the Territory", but: "ensure that the exploitation of resources benefits the inhabitants of the Territory", but2: "the interests of the inhabitants", outil: "a heritage fund" },
    facts: [["Revenue from fishing and extraction", " million dollars"], ["Share going to the Territory's budget", "%"], ["Concessions granted to foreign companies", ""]],
    triggers: ["the granting of a {n7}-year industrial fishing concession without consulting the communities of the {terr} Islands", "the discovery of a deposit of polymetallic nodules in the waters of the {terr} Islands", "a petition denouncing the pollution of a lagoon in the {terr} Islands by a mining operation"],
    background: "Article 76 of the Charter gives the trusteeship system the objective of promoting the economic and social advancement of the inhabitants of the territories. The {terr} Islands and their Administering Authority are fictional.",
    history: ["In {y1}, a (fictional) audit showed that less than a quarter of the revenue remained in the Territory.", "In {y2}, coastal communities sent a petition to the Council."],
    pre: ["Recalling Article 76 of the Charter of the United Nations", "Recalling General Assembly resolution 1803 (XVII) on permanent sovereignty over natural resources"],
    proposals: ["a heritage fund managed with the representatives of the Territory", "a review of the concessions under the supervision of the Council", "investment partnerships with responsible companies"],
    clauses: {
      tr_suspend: { obj: "the Administering Authority", inf: "suspend the granting of new concessions until the communities of the Territory have been consulted" },
      tr_fund: { obj: "the Administering Authority", inf: "pay a fair share of operating revenue into a heritage fund for the benefit of the inhabitants" },
      tr_visit: { inf: "send a visiting mission to assess the environmental impact of the operations" },
      tr_publish: { obj: "the companies holding concessions", inf: "publish their payments and their environmental impact assessments" }
    },
    objectif: "the management of resources for the benefit of the inhabitants of the Territory"
  }
};

/* =====================================================================
   LANGUE DU JEU
   Le jeu est écrit en français. La version anglaise remplace en place les
   textes des tables (setLang) et les phrases du moteur (L(fr, en)).
   La langue d'une partie est fixée à sa création (S.lang) : les textes déjà
   produits (journal, discours, clauses) restent dans cette langue.
   ===================================================================== */
let LANG = "fr";
const L = (fr, en) => LANG === "en" ? en : fr;
const LOC = () => LANG === "en" ? "en-GB" : "fr-FR";
/* Verbe d'une clause pour l'affichage (l'identifiant reste le verbe français) */
const vb = v => LANG === "en" ? (EN_VERBS[v] || v) : v;
const FR_SAVE = new Map();
function swapFields(obj, en, keys) {
  if (!obj) return;
  let fr = FR_SAVE.get(obj);
  if (!fr) { fr = {}; for (const k of keys) fr[k] = obj[k]; FR_SAVE.set(obj, fr); }
  for (const k of keys) {
    const v = LANG === "en" && en && en[k] !== undefined ? en[k] : fr[k];
    if (v === undefined) delete obj[k]; else obj[k] = v;
  }
}
const keysOf = o => Object.keys(o || {});
let langApplied = "fr";
function setLang(l) {
  LANG = l === "en" ? "en" : "fr";
  if (langApplied === LANG) return;
  langApplied = LANG;
  for (const k in AXES) swapFields(AXES[k], EN_AXES[k], ["name", "neg", "pos"]);
  for (const code in COUNTRIES) swapFields(COUNTRIES[code], { name: EN_COUNTRIES[code] }, ["name"]);
  swapFields(UN_GROUPS, EN_UN_GROUPS, keysOf(EN_UN_GROUPS));
  swapFields(UN_GROUPS_SHORT, EN_UN_GROUPS_SHORT, keysOf(EN_UN_GROUPS_SHORT));
  swapFields(UNESCO_GROUPS, EN_UNESCO_GROUPS, keysOf(EN_UNESCO_GROUPS));
  swapFields(BLOC_NAMES, EN_BLOC_NAMES, keysOf(EN_BLOC_NAMES));
  for (const k in PERSONALITIES) swapFields(PERSONALITIES[k], EN_PERSONALITIES[k], ["name", "desc"]);
  for (const k in ORIENTATIONS) swapFields(ORIENTATIONS[k], EN_ORIENTATIONS[k], ["name", "desc"]);
  const BK = ["de", "head", "plenary", "name", "short", "acr", "chair", "chairTitle", "sg", "act", "doc", "session", "stay", "desc", "powers", "limits", "ruleText"];
  for (const id in BODIES) {
    swapFields(BODIES[id], EN_BODIES[id], BK);
    if (BODIES[id].commissions) swapFields(BODIES[id].commissions, (EN_BODIES[id] || {}).commissions, keysOf(BODIES[id].commissions));
  }
  for (const k in KINDS) swapFields(KINDS[k], EN_KINDS[k], ["name", "why"]);
  for (const c of CONSTRAINTS) swapFields(c, { text: EN_CONSTRAINTS[c.id] }, ["text"]);
  DOMESTIC.forEach((d, i) => swapFields(d, { text: EN_DOMESTIC[i] }, ["text"]));
  const CK = ["obj", "inf", "stmt", "raw"];
  for (const c of GENERIC_CLAUSES) swapFields(c, EN_GENERIC_CLAUSES[c.id], CK);
  swapFields(GENERIC_PREAMBLE, EN_GENERIC_PREAMBLE, keysOf(EN_GENERIC_PREAMBLE));
  for (const i of ISSUES) {
    const e = EN_ISSUES[i.id] || {};
    swapFields(i, e, ["title", "triggers", "background", "history", "pre", "objectif"]);
    swapFields(i.v, e.v, keysOf(i.v));
    i.facts.forEach((f, n) => { const ef = (e.facts || [])[n]; swapFields(f, ef ? { 0: ef[0], 3: ef[1] } : null, [0, 3]); });
    i.proposals.forEach((p, n) => swapFields(p, { name: (e.proposals || [])[n] }, ["name"]));
    for (const c of i.clauses) swapFields(c, (e.clauses || {})[c.id], CK);
  }
  for (const f of LANG_HOOKS) f();
}
/* Tables de texte définies plus loin dans le fichier : elles s'inscrivent ici */
const LANG_HOOKS = [];

/* =====================================================================
   MOTEUR DE SIMULATION
   Toutes les règles (compétences, votes, seuils) sont calculées ici de
   façon déterministe. Le hasard (graine enregistrée) ne sert qu'à varier
   les scénarios, les personnalités et l'issue des tentatives de persuasion.
   ===================================================================== */

/* ---------- Outils ---------- */
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const r2 = x => Math.round(x * 100) / 100;
const fmtN = n => Math.round(n).toLocaleString(LOC());
const capFirst = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
function rngNext(S) { // mulberry32, état conservé dans la partie
  let t = (S.rng = (S.rng + 0x6D2B79F5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const rr = (S, a, b) => a + (b - a) * rngNext(S);
const ri = (S, a, b) => Math.floor(rr(S, a, b + 1));
const pick = (S, arr) => arr[Math.floor(rngNext(S) * arr.length)];
function shuffle(S, arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rngNext(S) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function wpick(S, entries) { // [[valeur, poids], …]
  const tot = entries.reduce((s, e) => s + Math.max(0, e[1]), 0); let x = rngNext(S) * tot;
  for (const [v, w] of entries) { x -= Math.max(0, w); if (x <= 0) return v; }
  return entries[entries.length - 1][0];
}
/* Remplace les {variables}. « à {x} » et « de {x} » sont contractés
   selon le premier mot de la valeur (au, aux, du, des, d'). */
function fill(str, vars) {
  let s = String(str ?? "");
  for (let pass = 0; pass < 4 && /\{\w+\}/.test(s); pass++) {
    if (LANG === "fr") s = s.replace(/(^|[\s(«])(à|de) \{(\w+)\}/g, (m, pre, prep, k) => {
      if (vars[k] === undefined) return m;
      const val = String(vars[k]);
      if (val.startsWith("{")) return m;
      return pre + (prep === "à" ? aForm(val) : deForm(val));
    });
    s = s.replace(/\{(\w+)\}/g, (m, k) => vars[k] !== undefined ? vars[k] : m);
  }
  return s;
}
const VOWEL = /^[aeiouyhâàäéèêëîïôöûùüœ]/i;
const de = s => (VOWEL.test(s) ? "d'" : "de ") + s;
function deForm(np) {
  if (/^des /i.test(np)) return de(np.slice(4));
  if (/^les /i.test(np)) return "des " + np.slice(4);
  if (/^le /i.test(np)) return "du " + np.slice(3);
  return de(np);
}
const que = s => (VOWEL.test(s) ? "qu'" : "que ") + s;
function aForm(np) {
  if (/^tous les /i.test(np) || /^toutes les /i.test(np)) return "à " + np;
  if (/^les /i.test(np)) return "aux " + np.slice(4);
  if (/^le /i.test(np)) return "au " + np.slice(3);
  if (/^la /i.test(np)) return "à la " + np.slice(3);
  if (/^l'/i.test(np)) return "à l'" + np.slice(2);
  return "à " + np;
}
const isPlural = np => /^(les|tous|toutes|des) /i.test(np) || / et /.test(np);
const P5 = ["CHN", "USA", "FRA", "GBR", "RUS"];
const cname = code => COUNTRIES[code] ? COUNTRIES[code].name : code;
const sortFr = codes => codes.slice().sort((a, b) => cname(a).localeCompare(cname(b), LANG));

/* ---------- Positions et priorités des délégations ---------- */
const AXIS_FORMULA = {
  obl: t => 1.0 * t.mul - 1.0 * t.sov + 0.2 * t.hr - 0.1,
  sup: t => 0.8 * t.mul + 0.5 * t.hr - 1.1 * t.sov,
  fin: t => 1.1 * t.dev - 0.6 * t.don + 0.3 * t.mul - 0.25,
  reg: t => 1.0 * t.reg - 0.5 * t.mul + 0.25 * t.sov - 0.2,
  prv: t => 1.2 * t.mkt - 0.5 * t.dev - 0.35,
  rgl: t => 1.2 * t.rgl - 0.4 * t.sov - 0.3,
  opn: t => 1.0 * t.opn + 0.4 * t.dev - 0.45 * t.tec - 0.25,
  res: t => 1.0 * t.cul - 0.9 * t.tou + 0.2 * t.env - 0.1,
  dro: t => 1.1 * t.hr - 0.6 * t.sov - 0.2 * t.sec
};
const AXIS_WEIGHT = {
  obl: t => 0.35 + 0.35 * Math.abs(t.sov - t.mul) + 0.15 * t.sov,
  sup: t => 0.3 + 0.45 * t.sov + 0.15 * t.hr,
  fin: t => 0.3 + 0.45 * t.dev + 0.25 * t.don,
  reg: t => 0.25 + 0.4 * t.reg,
  prv: t => 0.25 + 0.4 * t.mkt,
  rgl: t => 0.25 + 0.3 * t.tec + 0.25 * t.rgl,
  opn: t => 0.25 + 0.3 * t.opn + 0.25 * t.dev,
  res: t => 0.25 + 0.3 * t.cul + 0.3 * t.tou,
  dro: t => 0.25 + 0.35 * t.hr + 0.25 * t.sov
};
function pickPersonality(S, c) {
  const t = c.t;
  return wpick(S, [
    ["cooperative", 1 + t.mul], ["prudente", 0.8 + 0.9 * t.sov], ["intransigeante", 0.4 + t.sov + (c.infl >= 4 ? 0.3 : 0)],
    ["opportuniste", 0.7 + 0.6 * t.mkt], ["mediatrice", 0.6 + 0.6 * t.mul + (c.infl >= 2 && c.infl <= 3 ? 0.4 : 0)],
    ["ambitieuse", 0.3 + 0.22 * c.infl], ["technocratique", 0.5 + 0.7 * t.tec]
  ]);
}
const issueOf = S => ISSUE_BY_ID[S.issueId];
const bodyOf = S => BODIES[S.bodyId];

/* ---------- Clauses : instanciation, texte, effets, recevabilité ---------- */
function bodyVars(S) {
  const b = bodyOf(S), i = issueOf(S), sc = S.scen;
  const conv = {
    UNGA: L("engager, au sein d'un comité intergouvernemental ouvert à tous les États, la négociation d'une convention internationale relative à {objet}", "launch, within an intergovernmental committee open to all States, negotiations on an international convention on {objet}"),
    ECOSOC: L("établir un projet de convention relative à {objet}, en vue de le soumettre à l'Assemblée générale", "prepare a draft convention on {objet}, with a view to submitting it to the General Assembly"),
    UNHRC: L("créer un groupe de travail intergouvernemental chargé d'élaborer un instrument juridiquement contraignant relatif à {objet}", "establish an intergovernmental working group to elaborate a legally binding instrument on {objet}"),
    UNESCO_GC: L("adopter la Convention internationale sur {objet} figurant en annexe et la soumettre à la ratification des États membres", "adopt the International Convention on {objet} annexed hereto and submit it to Member States for ratification"),
    UNESCO_EB: L("recommander à la Conférence générale d'élaborer une convention internationale relative à {objet}", "recommend that the General Conference prepare an international convention on {objet}"),
    UNESCO_PC: L("engager l'élaboration d'une convention internationale relative à {objet}", "launch the preparation of an international convention on {objet}")
  }[b.id] || L("engager l'élaboration d'un instrument relatif à {objet}", "launch the preparation of an instrument on {objet}");
  return Object.assign({}, i.v, sc.vars, { sg: b.sg, act: b.act, stay: b.stay, conv, mois: sc.vars.mois, Preoccupe: L(b.g === "f" ? "Préoccupée" : "Préoccupé", "Concerned"), trigger: sc.triggerShort });
}
let uidSeq = 0;
function newUid(S) { S.uid = (S.uid || 0) + 1; return "c" + S.uid; }
function instClause(S, tpl, by) {
  const V = bodyVars(S);
  const c = { uid: newUid(S), src: tpl.id, k: tpl.k, form: tpl.form, v: tpl.v, fx: Object.assign({}, tpl.fx), tech: tpl.tech ? 1 : 0, by: by || S.player };
  if (tpl.obj) c.obj = fill(tpl.obj, V);
  if (tpl.inf) c.inf = fill(tpl.inf, V);
  if (tpl.stmt) c.stmt = fill(tpl.stmt, V);
  if (tpl.raw) c.raw = fill(tpl.raw, V);
  if (tpl.text) c.text = tpl.text;
  if (c.form === "bind" && S.bodyId !== "UNSC") c.v = "Demande"; // hors Conseil de sécurité : pas d'obligation
  return c;
}
const FORM_VERBS = {
  act: ["Demande", "Exhorte", "Engage", "Recommande", "Encourage", "Invite", "Souligne"],
  bind: ["Décide", "Demande", "Exhorte", "Engage", "Encourage", "Invite"],
  sec: ["Prie", "Demande", "Invite"],
  self: ["Décide", "Souligne"],
  plen: ["Recommande", "Invite"],
  stmt: ["Souligne", "Réaffirme", "Rappelle"],
  raw: [],
  free: null
};
function verbsForClause(S, c) {
  if (c.form === "free") return verbsFor(S.bodyId);
  const l = FORM_VERBS[c.form] || [];
  if (c.form === "bind" && S.bodyId !== "UNSC") return l.filter(v => v !== "Décide");
  return l;
}
function actText(v, obj, inf) {
  if (LANG === "en") {
    if (v === "Recommande") return `Recommends that ${obj} ${inf}`;
    if (v === "Souligne") return `Stresses the importance for ${obj} to ${inf}`;
    return `${vb(v)} ${obj} to ${inf}`;
  }
  if (v === "Demande" || v === "Recommande") return `${v} ${aForm(obj)} ${de(inf)}`;
  if (v === "Souligne") return `Souligne l'importance, pour ${obj}, ${de(inf)}`;
  return `${v} ${obj} à ${inf}`;
}
function clauseText(S, c) {
  const b = bodyOf(S);
  if (LANG === "en") switch (c.form) {
    case "act": return actText(c.v, c.obj, c.inf);
    case "bind": return c.v === "Décide" ? `Decides that ${c.obj} shall ${c.inf}` : actText(c.v, c.obj, c.inf);
    case "sec": return `${vb(c.v)} ${c.obj} to ${c.inf}`;
    case "self": return c.v === "Souligne" ? `Stresses the need to ${c.inf}` : `Decides to ${c.inf}`;
    case "plen": { const pl = b.plenary || "the General Assembly"; return c.v === "Invite" ? `Invites ${pl} to ${c.inf}` : `Recommends that ${pl} ${c.inf}`; }
    case "stmt": return `${vb(c.v)} that ${c.stmt}`;
    case "raw": return c.raw;
    default: return `${vb(c.v)} ${c.text || ""}`.trim();
  }
  switch (c.form) {
    case "act": return actText(c.v, c.obj, c.inf);
    case "bind": return c.v === "Décide" ? `Décide que ${c.obj} ${isPlural(c.obj) ? "doivent" : "doit"} ${c.inf}` : actText(c.v, c.obj, c.inf);
    case "sec":
      if (c.v === "Prie") return `Prie ${c.obj} ${de(c.inf)}`;
      if (c.v === "Demande") return `Demande ${aForm(c.obj)} ${de(c.inf)}`;
      return `Invite ${c.obj} à ${c.inf}`;
    case "self": return c.v === "Souligne" ? `Souligne la nécessité ${de(c.inf)}` : `Décide ${de(c.inf)}`;
    case "plen": { const pl = b.plenary || "l'Assemblée générale"; return c.v === "Invite" ? `Invite ${pl} à ${c.inf}` : `Recommande ${aForm(pl)} ${de(c.inf)}`; }
    case "stmt": return `${c.v} ${que(c.stmt)}`;
    case "raw": return c.raw;
    default: return `${c.v} ${c.text || ""}`.trim();
  }
}
function effKind(c) {
  if (c.form === "bind" && c.v !== "Décide") return "rec";
  if (c.form === "self" && c.v === "Souligne") return "rec";
  return c.k;
}
/* Recevabilité : la présidence écarte les clauses qui sortent des compétences de l'organe */
function checkClause(S, c) {
  const k = effKind(c), b = bodyOf(S);
  if (!kindAllowed(k, b.id)) return { ok: false, why: (KINDS[k] && KINDS[k].why) || L(`Cette mesure (${(KINDS[k] || {}).name || k}) ne relève pas des compétences ${b.de}.`, `This measure (${(KINDS[k] || {}).name || k}) is outside the competence ${b.de}.`) };
  if (c.form === "free") {
    const t = (c.text || "").toLowerCase();
    if (b.id !== "UNSC" && /sanction|embargo|gel des avoirs|geler les|asset freeze|freez(e|ing) (the|of|their)? ?(funds|assets)/.test(t)) return { ok: false, why: L("Seul le Conseil de sécurité peut décider de sanctions (article 41 de la Charte).", "Only the Security Council can decide on sanctions (Article 41 of the Charter).") };
    if (b.id !== "UNSC" && c.v === "Décide" && /tous les états (doivent|devront)|obligation pour les états|all states (shall|must)|obligation (for|on) (all )?states/.test(t)) return { ok: false, why: KINDS.binding.why };
    if (!["UNGA", "UNESCO_GC", "UNESCO_PC"].includes(b.id) && /contributions? (obligatoires?|statutaires?)|budget ordinaire|assessed contributions?|regular budget/.test(t) && !/recommande/i.test(c.v)) return { ok: false, why: KINDS.assessed.why };
    if (b.id !== "WHC" && /patrimoine mondial en péril|heritage in danger|list in danger/.test(t)) return { ok: false, why: KINDS.danger.why };
    if (b.id !== "UNHRC" && /rapporteur spécial|special rapporteur/.test(t)) return { ok: false, why: KINDS.rapporteur.why };
    if (b.id !== "UNSC" && /maintien de la paix|casques bleus|force internationale|peacekeeping|blue helmets|international force/.test(t)) return { ok: false, why: KINDS.mission.why };
  }
  if (KINDS[k] && KINDS[k].needs7 && !S.draft.pre.some(p => p.id === "ch7")) return { ok: true, warn: L("Les mesures de l'article 41 supposent que le Conseil agisse en vertu du Chapitre VII : ajoutez ce paragraphe au préambule.", "Article 41 measures require the Council to act under Chapter VII: add this paragraph to the preamble.") };
  return { ok: true };
}
function clauseFx(S, c) {
  const chk = checkClause(S, c);
  if (!chk.ok) return {};
  const s = verbStrength(c.v);
  let m = (c.form === "stmt" || c.form === "raw") ? 1 : 0.45 + 0.75 * s;
  if (c.form === "self" && c.v === "Souligne") m *= 0.5;
  const out = {};
  for (const a in c.fx) out[a] = c.fx[a] * m;
  if (["act", "bind", "free"].includes(c.form)) out.obl = (out.obl || 0) + 0.12 * (s - 0.5);
  if (c.form === "bind" && c.v !== "Décide") out.obl = (out.obl || 0) - 0.35;
  return out;
}
const PRE_FX = { ch7: { obl: .3, sup: .1 }, sov: { sup: -.15, obl: -.1 } };
/* Orientation du texte sur chaque axe : somme des effets, adoucie (tanh) */
function textVec(S, opts = {}) {
  const axes = issueOf(S).axes, raw = Object.fromEntries(axes.map(a => [a, 0]));
  for (const c of S.draft.ops) { if (c.uid === opts.without) continue; const f = clauseFx(S, c); for (const a in f) if (a in raw) raw[a] += f[a]; }
  if (opts.extra) { const f = clauseFx(S, opts.extra); for (const a in f) if (a in raw) raw[a] += f[a]; }
  for (const p of S.draft.pre) { const f = PRE_FX[p.id]; if (f) for (const a in f) if (a in raw) raw[a] += f[a]; }
  const R = {};
  for (const a of axes) R[a] = Math.tanh(TUNE.tanh * raw[a]);
  return R;
}
function precision(S) {
  const ops = S.draft.ops.filter(c => checkClause(S, c).ok);
  const tech = ops.filter(c => c.tech).length, rep = ops.some(c => effKind(c) === "report");
  const dl = ops.some(c => /\d/.test(c.inf || c.text || ""));
  return clamp(tech * 0.22 + (rep ? 0.2 : 0) + (dl ? 0.1 : 0), 0, 1);
}

/* ---------- Utilité d'un texte pour une délégation ---------- */
function hardBreach(d, R) {
  for (const rl of d.red || []) {
    if (rl.dir === "max" && R[rl.axis] > rl.thr) return rl;
  }
  return null;
}
function softBreach(d, R) {
  for (const rl of d.red || []) {
    if (rl.dir === "min" && R[rl.axis] < rl.thr) return rl;
  }
  return null;
}
/* Réglages d'équilibre (calibrés par des parties simulées, voir test/bots.cjs) */
const TUNE = { K: 1.5, yesOff: 0.04, noOff: 0.08, tanh: 1.15, unscE10: 0.06 };
function baseU(d, R) {
  let num = 0, den = 0;
  for (const a in d.pos) { if (!(a in R)) continue; num += d.w[a] * (1 - TUNE.K * Math.abs(R[a] - d.pos[a])); den += d.w[a]; }
  return den ? num / den : 0;
}
function hasSrc(S, src) { return S.draft.ops.some(c => c.src === src && checkClause(S, c).ok); }
function uOf(S, code, R) {
  const d = S.dels[code]; R = R || textVec(S);
  let u = baseU(d, R);
  if (d.pet && hasSrc(S, d.pet)) u += d.pers === "ambitieuse" ? 0.16 : 0.08;
  if (d.pers === "technocratique") u += 0.12 * (precision(S) - 0.5);
  u += clamp(d.rel, -100, 100) / 100 * 0.12;
  const sameBloc = S.draft.cosponsors.filter(x => x !== code && sharedNegoBloc(x, code)).length;
  u += Math.min(0.09, 0.03 * sameBloc);
  if (d.lobbied) u += 0.04;
  return u;
}

/* ---------- Composition des comités ---------- */
function compose(S, body, playerWanted) {
  if (body.sim.p5only) return P5.slice();
  const pool = Object.values(COUNTRIES).filter(c => !(body.org === "UNESCO" && c.noUnesco));
  const chosen = new Set(body.sim.p5 ? P5 : []);
  const quotas = body.sim.un || body.sim.unesco, key = body.sim.un ? "un" : "unesco";
  for (const g in quotas) {
    const cands = shuffle(S, pool.filter(c => c[key] === g && !chosen.has(c.code) && !(body.sim.p5 && c.p5)));
    // légère préférence pour les délégations influentes, sans les rendre systématiques
    cands.sort((a, b) => (b.infl + rngNext(S) * 4) - (a.infl + rngNext(S) * 4));
    cands.slice(0, quotas[g]).forEach(c => chosen.add(c.code));
  }
  if (playerWanted && !chosen.has(playerWanted) && COUNTRIES[playerWanted]) {
    const g = COUNTRIES[playerWanted][key], list = [...chosen];
    const swap = list.find(x => COUNTRIES[x][key] === g && !P5.includes(x))
      || (!body.sim.p5 && list.find(x => COUNTRIES[x][key] === g))
      || list.find(x => !P5.includes(x));
    if (swap) chosen.delete(swap);
    chosen.add(playerWanted);
  }
  return sortFr([...chosen]);
}
function placeName(S) { return pick(S, PLACE_A) + pick(S, PLACE_B); }

/* ---------- Générateur de scénarios ---------- */
function generateScenario(bodyId, opts = {}) {
  const S = { rng: (opts.seed >>> 0) || ((Date.now() ^ (Math.random() * 1e9)) >>> 0) };
  S.seed = S.rng;
  const body = BODIES[bodyId];
  let pc = null;
  if (bodyId === "UNESCO_PC") pc = opts.pc || pick(S, Object.keys(body.commissions));
  let cands = ISSUES.filter(i => i.bodies.includes(bodyId) && (bodyId !== "UNESCO_PC" || (i.pc || []).includes(pc)));
  const fresh = cands.filter(i => !(opts.avoid || []).includes(i.id));
  if (fresh.length) cands = fresh;
  const issue = pick(S, cands);
  let lieu = placeName(S), terr = placeName(S);
  while (terr === lieu) terr = placeName(S);
  const year = new Date().getFullYear();
  const vars = {
    lieu, terr, n: fmtN(ri(S, 20, 2000) * 1000), n2: ri(S, 40, 400), n3: ri(S, 8, 40), n4: ri(S, 3, 8), n5: fmtN(ri(S, 3, 24) * 100), n6: ri(S, 30, 250), n7: ri(S, 15, 30),
    j: ri(S, 3, 21), h: ri(S, 6, 72), p: ri(S, 20, 55), mois: pick(S, [6, 9, 12, 18]), y1: year - ri(S, 3, 5), y2: year - ri(S, 1, 2)
  };
  const triggerShort = fill(pick(S, issue.triggers), Object.assign({}, issue.v, vars));
  const facts = issue.facts.map(([label, a, b, unit]) => {
    let v = rr(S, a, b);
    v = b >= 1000 ? Math.round(v / 1000) * 1000 : (b - a < 5 && unit && unit.trim() !== "%" ? Math.round(v * 10) / 10 : Math.round(v));
    return { label, value: v, unit };
  });
  const constraints = shuffle(S, CONSTRAINTS).slice(0, 2).map(c => c.id);
  const members = compose(S, body, opts.player);
  const scen = {
    bodyId, pc, issueId: issue.id, title: issue.title, title_fr: (FR_SAVE.get(issue) || issue).title, title_en: (EN_ISSUES[issue.id] || {}).title || issue.title, lang: LANG, vars, triggerShort, facts, constraints, members,
    weeks: ri(S, 2, 6), sessionNo: ri(S, 7, 74), chairF: rngNext(S) < 0.5, extraordinary: rngNext(S) < 0.3, year
  };
  return { scen, seed: S.seed, rng: S.rng };
}

/* ---------- Création d'une partie ---------- */
function newGame(gen, player) {
  const { scen } = gen;
  const S = {
    v: 1, lang: scen.lang || LANG, id: "s" + Date.now().toString(36), seed: gen.seed, rng: gen.rng, created: Date.now(), updated: Date.now(),
    bodyId: scen.bodyId, issueId: scen.issueId, scen, player, phase: 1, clock: 0, orientation: null, line: null,
    dels: {}, order: [], speeches: [], debateIdx: 0, playerSpoke: false, replies: 0,
    draft: { pre: [], ops: [], cosponsors: [] }, amendments: [], inbox: [], deals: [], log: [], uid: 0,
    time: { neg: 120, draft: 60 }, negSpent: 0, lastAi: 0,
    stats: { quality: [], attempts: 0, successes: 0, counters: 0, broken: 0, amendAcc: 0, amendRej: 0, amendCounter: 0, offersAcc: 0 },
    initial: null, vote: null, report: null
  };
  const issue = issueOf(S), body = bodyOf(S);
  const cons = scen.constraints.map(id => CONSTRAINTS.find(c => c.id === id));
  for (const code of scen.members) S.dels[code] = makeDelegation(S, code, cons, code === player);
  // Propositions concurrentes : chacune portée par la délégation la plus proche
  const used = new Set([player]);
  S.proposals = issue.proposals.map((p, i) => {
    const score = code => Object.entries(p.by).reduce((s, [k, w]) => s + w * COUNTRIES[code].t[k], 0) + COUNTRIES[code].infl * 0.08 + rngNext(S) * 0.4;
    const sponsor = scen.members.filter(c => !used.has(c)).sort((a, b) => score(b) - score(a))[0];
    if (sponsor) used.add(sponsor);
    const core = bestClauseFor(S, p.vec, []);
    if (sponsor && core) S.dels[sponsor].pet = core.id;
    return { id: "P" + (i + 1), name: p.name, vec: p.vec, sponsor, core: core && core.id };
  });
  // Relations initiales avec la délégation du joueur
  const me = S.dels[player];
  for (const code of scen.members) {
    if (code === player) continue;
    const d = S.dels[code];
    const shared = COUNTRIES[code].blocs.filter(b => COUNTRIES[player].blocs.includes(b)).length;
    const sim = 1 - avgDist(d.pos, me.pos) / 2;
    d.rel = Math.round(clamp(-20 + shared * 12 + (COUNTRIES[code].un === COUNTRIES[player].un ? 8 : 0) + sim * 30 + rr(S, -8, 8), -60, 70));
    d.rel0 = d.rel;
  }
  S.chairName = scen.chairF ? L("Madame la Présidente", "Madam President") : L("Monsieur le Président", "Mr. President");
  logE(S, "procedure", L(`Ouverture de la ${body.session} ${body.de}.`, `Opening of the ${body.session} ${body.de}.`));
  return S;
}
function avgDist(a, b) { const ks = Object.keys(a); return ks.reduce((s, k) => s + Math.abs(a[k] - (b[k] || 0)), 0) / ks.length; }
function makeDelegation(S, code, cons, isPlayer) {
  const c = COUNTRIES[code], t = c.t, issue = issueOf(S);
  const pers = isPlayer ? "joueur" : pickPersonality(S, c);
  const sal = clamp(0.4 + 0.6 * (issue.tags.reduce((s, k) => s + t[k], 0) / issue.tags.length) + rr(S, -0.1, 0.1), 0.3, 1);
  const pos = {}, w = {};
  for (const a of issue.axes) {
    let p = AXIS_FORMULA[a](t);
    const mods = (issue.mods || {})[a]; if (mods) for (const k in mods) p += mods[k] * t[k];
    for (const cc of cons) if (cc.shift && cc.shift[a]) p += cc.shift[a];
    p += rr(S, -0.15, 0.15);
    if (pers === "intransigeante") p *= 1.2; else if (pers === "mediatrice") p *= 0.8; else if (pers === "cooperative") p *= 0.9;
    pos[a] = r2(clamp(p, -1, 1));
    let wt = AXIS_WEIGHT[a](t) * (0.7 + 0.5 * sal);
    for (const cc of cons) if (cc.w && cc.w[a]) wt += cc.w[a] * 0.6;
    w[a] = r2(clamp(wt + rr(S, -0.1, 0.1), 0.15, 1.2));
  }
  const d = { code, pers, pos, w, sal: r2(sal), rel: 0, rel0: 0, red: [], pet: null, known: { pos: false, red: false, pet: false }, cosponsor: false, commit: null, lobbied: false, mood: 0 };
  d.red = computeRed(d);
  d.pet = (bestClauseFor(S, pos, [], w) || {}).id || null;
  if (isPlayer) { d.known = { pos: true, red: true, pet: true }; const dm = pick(S, DOMESTIC.filter(x => issue.axes.includes(x.axis))) || null; d.domestic = dm; if (dm) { d.pos[dm.axis] = r2(clamp(d.pos[dm.axis] + dm.dir * 0.25, -1, 1)); d.w[dm.axis] = r2(clamp(d.w[dm.axis] + 0.2, 0.15, 1.2)); d.red = computeRed(d); } }
  return d;
}
/* Lignes rouges : au plus deux, sur les axes à la fois prioritaires et tranchés.
   « max » : le texte ne doit pas dépasser le seuil (sinon vote contre, veto au Conseil de sécurité).
   « min » : le texte doit atteindre le seuil (sinon abstention).
   Plus la position est extrême, plus le seuil est proche d'elle. */
function computeRed(d) {
  const f = (PERSONALITIES[d.pers] || { redline: 1 }).redline;
  const out = [];
  for (const a of Object.keys(d.w).sort((x, y) => d.w[y] - d.w[x])) {
    const p = d.pos[a], m = (0.3 + 0.65 * (1 - Math.abs(p))) * f;
    if (out.length < 2 && d.w[a] >= 0.68 && Math.abs(p) >= 0.55) out.push(p < 0 ? { axis: a, dir: "max", thr: r2(clamp(m, 0.15, 0.85)) } : { axis: a, dir: "min", thr: r2(clamp(0.45 - m, -0.5, 0.3)) });
  }
  return out;
}
/* Banque de clauses disponibles pour l'organe */
function clauseBank(S) {
  const issue = issueOf(S), b = bodyOf(S);
  const list = [...issue.clauses, ...GENERIC_CLAUSES].filter(tpl => {
    if (tpl.bodies && !tpl.bodies.includes(b.id)) return false;
    let k = tpl.k; if (tpl.form === "bind" && b.id !== "UNSC" && tpl.k === "binding") k = "rec";
    if (!kindAllowed(k, b.id)) return false;
    if (tpl.id === "g_stay") return false;
    const ax = Object.keys(tpl.fx || {});
    return ["report", "review", "coop", "body", "volfund"].includes(tpl.k) || ax.some(a => issue.axes.includes(a));
  });
  return list;
}
const tplById = (S, id) => [...issueOf(S).clauses, ...GENERIC_CLAUSES].find(t => t.id === id);
function bestClauseFor(S, vec, exclude, w) {
  const issue = issueOf(S);
  let best = null, bs = -1e9;
  for (const tpl of clauseBank(S)) {
    if ((exclude || []).includes(tpl.id) || ["g_report", "g_annual"].includes(tpl.id)) continue;
    let s = 0;
    for (const a of issue.axes) s += (tpl.fx[a] || 0) * (vec[a] || 0) * (w ? w[a] : 1);
    s += issue.clauses.includes(tpl) ? 0.04 : 0;
    if (s > bs) { bs = s; best = tpl; }
  }
  return bs > 0.02 ? best : null;
}

/* ---------- Journal (chronologie) ---------- */
function clockStr(S) { const m = 10 * 60 + S.clock; return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; }
function logE(S, cat, text, by) { S.log.push({ t: clockStr(S), phase: S.phase, cat, text, by: by || null }); }
function advance(S, min) { S.clock += min; }
/* Temps de négociation (phase 4) ou de rédaction (phase 5) consommé par une démarche */
function spend(S, min) { advance(S, min); S.negSpent += min; if (S.phase === 5) S.time.draft = Math.max(0, S.time.draft - min); else S.time.neg = Math.max(0, S.time.neg - min); }
const timeLeft = S => S.phase === 5 ? S.time.draft : S.phase === 4 ? S.time.neg : 0;

/* ---------- Phase 2 : orientation du joueur ---------- */
function setOrientation(S, key) {
  const me = S.dels[S.player], o = ORIENTATIONS[key], issue = issueOf(S);
  S.orientation = key;
  S.line = {};
  for (const a of issue.axes) S.line[a] = r2(clamp(0.55 * me.pos[a] + 0.45 * (o.vec[a] || 0), -1, 1));
  S.orientFit = r2(1 - avgDist(Object.fromEntries(issue.axes.map(a => [a, o.vec[a] || 0])), me.pos) / 2);
  logE(S, "procedure", L(`Votre délégation retient l'orientation « ${o.name} ».`, `Your delegation adopts the “${o.name}” approach.`), S.player);
}
function recommendedOrientations(S) {
  const me = S.dels[S.player], issue = issueOf(S);
  return Object.keys(ORIENTATIONS).map(k => {
    const v = ORIENTATIONS[k].vec;
    const fit = 1 - issue.axes.reduce((s, a) => s + me.w[a] * Math.abs((v[a] || 0) - me.pos[a]), 0) / issue.axes.reduce((s, a) => s + me.w[a], 0) / 2;
    return { k, fit: r2(fit) };
  }).sort((a, b) => b.fit - a.fit);
}

/* ---------- Vote : intention de chaque délégation ---------- */
function voteIntent(S, code, R) {
  const d = S.dels[code], P = PERSONALITIES[d.pers]; R = R || textVec(S);
  const hard = hardBreach(d, R);
  const isP5 = S.bodyId === "UNSC" && P5.includes(code);
  if (hard) return { v: "no", why: "red", axis: hard.axis };
  let u = uOf(S, code, R);
  const deal = S.deals.find(x => x.with === code && x.status === "active");
  if (deal && dealHonored(S, deal)) { if (deal.ask === "vote" || deal.ask === "cosponsor") return { v: "yes", why: "deal" }; u += 0.1; }
  if (d.cosponsor) return { v: "yes", why: "cosponsor" };
  const soft = softBreach(d, R);
  // au Conseil de sécurité, les membres élus recherchent souvent l'unité du Conseil
  const yesT = P.yes + TUNE.yesOff - (S.bodyId === "UNSC" && !isP5 ? TUNE.unscE10 : 0);
  let v = u >= yesT ? "yes" : (u < P.no + TUNE.noOff ? "no" : "abs");
  if (soft && v === "yes") v = "abs";
  if (isP5 && v === "no") v = "abs"; // un membre permanent réserve son veto à ses lignes rouges
  if (S.bodyId !== "UNSC" && d.sal < 0.5 && v === "abs" && u >= P.yes + TUNE.yesOff - 0.12) v = "yes";
  return { v, why: soft && v !== "yes" ? "soft" : "u", u: r2(u) };
}
function dealHonored(S, deal) {
  if (deal.kind === "pet") return hasSrc(S, deal.src);
  if (deal.kind === "soften" || deal.kind === "fund" || deal.kind === "add") {
    const c = S.draft.ops.find(x => x.uid === deal.uid);
    if (deal.kind === "soften") return !c || verbStrength(c.v) <= deal.maxS + 1e-9;
    return !!c;
  }
  if (deal.kind === "delete") return !S.draft.ops.some(x => x.uid === deal.uid);
  return true;
}
function needRule(S) {
  const b = bodyOf(S), issue = issueOf(S);
  const kinds = S.draft.ops.filter(c => checkClause(S, c).ok).map(effKind);
  if (b.vote.rule === "unsc") return { type: "unsc", label: L("9 voix pour au moins, sans vote contre d'un membre permanent", "at least 9 votes in favour, with no vote against by a permanent member") };
  if (b.vote.rule === "twothirds") return { type: "23", label: L("majorité des deux tiers des membres présents et votants (Convention de 1972, art. 13.8)", "two-thirds majority of members present and voting (1972 Convention, Art. 13.8)") };
  if (b.vote.conv23 && kinds.includes("convention")) return { type: "23", label: L("majorité des deux tiers : adoption d'une convention internationale (Acte constitutif, art. IV.4)", "two-thirds majority: adoption of an international convention (Constitution, Art. IV.4)") };
  if (b.vote.important && (issue.important || kinds.includes("assessed"))) return { type: "23", label: issue.important ? L("majorité des deux tiers : question importante relative à la paix et à la sécurité (Charte, art. 18.2)", "two-thirds majority: important question relating to peace and security (Charter, Art. 18.2)") : L("majorité des deux tiers : question budgétaire, considérée comme importante (Charte, art. 18.2)", "two-thirds majority: budgetary question, considered important (Charter, Art. 18.2)") };
  return { type: "maj", label: L("majorité simple des membres présents et votants", "simple majority of members present and voting") };
}
function tally(S, votes) {
  let yes = 0, no = 0, abs = 0; const veto = [];
  for (const [code, v] of Object.entries(votes)) { if (v === "yes") yes++; else if (v === "no") { no++; if (S.bodyId === "UNSC" && P5.includes(code)) veto.push(code); } else abs++; }
  const rule = needRule(S);
  let adopted;
  if (rule.type === "unsc") adopted = yes >= 9 && veto.length === 0;
  else if (rule.type === "23") adopted = yes + no > 0 && yes >= 2 * no;
  else adopted = yes > no;
  return { yes, no, abs, veto, adopted, rule };
}
function projection(S) {
  const R = textVec(S), votes = {}, known = {};
  for (const code of S.scen.members) {
    if (code === S.player) { votes[code] = "yes"; known[code] = true; continue; }
    votes[code] = voteIntent(S, code, R).v;
    known[code] = S.dels[code].known.pos;
  }
  return { votes, known, t: tally(S, votes) };
}

/* ---------- Réactions clause par clause ---------- */
function clauseReactions(S, c) {
  const R = textVec(S), R0 = textVec(S, { without: c.uid }), out = { sup: [], opp: [], mod: [], neu: [] };
  const chk = checkClause(S, c);
  for (const code of S.scen.members) {
    if (code === S.player) continue;
    const d = S.dels[code];
    if (!chk.ok) { out.neu.push(code); continue; }
    let delta = baseU(d, R) - baseU(d, R0);
    if (d.pet === c.src) delta += 0.08;
    const breach = hardBreach(d, R) && !hardBreach(d, R0);
    if (breach || delta < -0.12) out.opp.push(code);
    else if (delta < -0.035) out.mod.push(code);
    else if (delta > 0.025) out.sup.push(code);
    else out.neu.push(code);
  }
  return out;
}

/* ---------- Texte de départ (début des négociations) ---------- */
function initialDraft(S) {
  const b = bodyOf(S), issue = issueOf(S), me = S.dels[S.player];
  const V = bodyVars(S);
  S.draft.title = issue.title;
  S.draft.pre = [];
  const gp = GENERIC_PREAMBLE[b.org];
  gp.forEach((t, i) => S.draft.pre.push({ id: "g" + i, txt: t }));
  issue.pre.forEach((t, i) => S.draft.pre.push({ id: "i" + i, txt: fill(t, V) }));
  S.draft.pre.push({ id: "concern", txt: fill(GENERIC_PREAMBLE.concern, V) });
  if (me.pos.sup < -0.3 || me.pos.obl < -0.3) S.draft.pre.push({ id: "sov", txt: GENERIC_PREAMBLE.sov });
  else S.draft.pre.push({ id: "coop", txt: GENERIC_PREAMBLE.coop });
  // Clauses : celles qui servent le mieux la ligne du joueur
  const chosen = [];
  const bank = clauseBank(S).filter(t => !["g_assessed", "g_convention", "g_binding"].includes(t.id) || (S.line.obl || 0) > 0.45);
  const score = tpl => issue.axes.reduce((s, a) => s + (tpl.fx[a] || 0) * (S.line[a] || 0) * me.w[a], 0) + (issue.clauses.includes(tpl) ? 0.05 : 0);
  bank.filter(t => !["g_report", "g_annual"].includes(t.id)).map(t => [t, score(t)]).filter(x => x[1] > 0.02).sort((a, b) => b[1] - a[1]).slice(0, 4).forEach(([t]) => chosen.push(t));
  if (me.pet && !chosen.some(t => t.id === me.pet)) { const p = tplById(S, me.pet); if (p && bank.includes(p)) chosen[3] = p; }
  chosen.push(GENERIC_CLAUSES.find(g => g.id === "g_report"));
  S.draft.ops = chosen.filter(Boolean).map(t => instClause(S, t, S.player));
  if (S.draft.ops.some(c => KINDS[effKind(c)] && KINDS[effKind(c)].needs7)) S.draft.pre.push({ id: "ch7", txt: GENERIC_PREAMBLE.ch7 });
  S.draft.ops.push(instClause(S, GENERIC_CLAUSES.find(g => g.id === "g_stay"), S.player));
  S.draft.cosponsors = [];
}

/* ---------- Effets d'une intervention publique du joueur ---------- */
function applyPlayerSpeech(S, stance, quality, opts = {}) {
  const issue = issueOf(S), pInfl = COUNTRIES[S.player].infl;
  S.stats.quality.push(r2(quality));
  for (const code of S.scen.members) {
    if (code === S.player) continue;
    const d = S.dels[code];
    let align = 0, den = 0;
    for (const a of issue.axes) { if (stance[a] === undefined) continue; align += d.w[a] * (1 - Math.abs(stance[a] - d.pos[a])); den += d.w[a]; }
    align = den ? align / den - 0.5 : 0; // -1,5 … +0,5
    d.rel = Math.round(clamp(d.rel + 12 * align * (0.5 + quality) + (opts.open ? 4 * quality : 0), -100, 100));
    const move = (PERSONALITIES[d.pers] || { move: 1 }).move;
    for (const a of issue.axes) {
      if (stance[a] === undefined) continue;
      if (Math.abs(d.pos[a]) < 0.35 && (!d.red.some(r => r.axis === a))) d.pos[a] = r2(clamp(d.pos[a] + (stance[a] - d.pos[a]) * 0.07 * quality * move * (0.6 + pInfl * 0.1), -1, 1));
    }
  }
  if (opts.target) {
    const t = S.dels[opts.target];
    if (t) {
      t.rel = clamp(t.rel - 12, -100, 100);
      for (const code of S.scen.members) {
        if (code === S.player || code === opts.target) continue;
        const sim = 1 - avgDist(S.dels[code].pos, t.pos) / 2;
        S.dels[code].rel = Math.round(clamp(S.dels[code].rel + (sim > 0.75 ? -3 : 2), -100, 100));
      }
    }
  }
}

/* ---------- Négociation : actions bilatérales ---------- */
const ARGS = {
  juridique:    { name: "Argument juridique", desc: "droit international, précédents, cohérence avec les textes existants", traits: { mul: .7, hr: .3 }, axes: ["obl", "sup", "dro"] },
  economique:   { name: "Argument économique", desc: "coûts, efficacité, intérêts des acteurs économiques", traits: { mkt: .6, don: .4 }, axes: ["prv", "fin", "res", "rgl"] },
  humanitaire:  { name: "Argument humanitaire", desc: "conséquences pour les populations concernées", traits: { hr: .6, env: .2, dev: .2 }, axes: ["dro", "fin", "sup"] },
  securite:     { name: "Argument de sécurité", desc: "stabilité, prévention des crises, menaces communes", traits: { sec: .8, sea: .2 }, axes: ["obl", "sup", "reg"] },
  souverainete: { name: "Rassurer sur la souveraineté", desc: "garanties de non-ingérence et d'appropriation nationale", traits: { sov: 1 }, axes: ["obl", "sup", "dro", "reg"], reassure: true },
  developpement:{ name: "Argument de développement", desc: "renforcement des capacités, solidarité Nord-Sud", traits: { dev: .8, reg: .2 }, axes: ["fin", "reg", "opn"] },
  reputation:   { name: "Image et influence", desc: "leadership, visibilité, rôle dans l'histoire de la négociation", traits: { mul: .4 }, infl: true, axes: [] }
};

const EN_ARGS = {
  juridique: { name: "Legal argument", desc: "international law, precedents, consistency with existing texts" },
  economique: { name: "Economic argument", desc: "costs, efficiency, interests of economic actors" },
  humanitaire: { name: "Humanitarian argument", desc: "consequences for the people concerned" },
  securite: { name: "Security argument", desc: "stability, crisis prevention, common threats" },
  souverainete: { name: "Reassure on sovereignty", desc: "guarantees of non-interference and national ownership" },
  developpement: { name: "Development argument", desc: "capacity-building, North-South solidarity" },
  reputation: { name: "Image and influence", desc: "leadership, visibility, a place in the history of the negotiation" }
};
LANG_HOOKS.push(() => { for (const k in ARGS) swapFields(ARGS[k], EN_ARGS[k], ["name", "desc"]); });
function argFit(S, code, key) {
  const A = ARGS[key], c = COUNTRIES[code];
  let f = Object.entries(A.traits).reduce((s, [k, w]) => s + w * c.t[k], 0);
  if (A.infl) f += (c.infl - 1) / 4 * 0.5;
  return clamp(f, 0, 1);
}
function biggestGap(S, code) {
  const d = S.dels[code], issue = issueOf(S);
  return issue.axes.slice().sort((a, b) => d.w[b] * Math.abs(d.pos[b] - S.line[b]) - d.w[a] * Math.abs(d.pos[a] - S.line[a]))[0];
}
function actProbe(S, code) {
  const d = S.dels[code];
  d.known = { pos: true, red: true, pet: true };
  d.rel = clamp(d.rel + 2, -100, 100);
  spend(S, 10);
  logE(S, "bilateral", L(`Échange bilatéral avec la délégation ${deName(code)} : elle expose ses priorités.`, `Bilateral exchange with the delegation ${deName(code)}: it sets out its priorities.`), code);
  return { ok: true };
}
function actPersuade(S, code, key, axis) {
  const d = S.dels[code], P = PERSONALITIES[d.pers], A = ARGS[key];
  axis = axis || biggestGap(S, code);
  const fit = argFit(S, code, key);
  const onAxis = !A.axes.length || A.axes.includes(axis) ? 1 : 0.6;
  const isRed = d.red.some(r => r.axis === axis);
  let p = 0.22 + 0.45 * fit * onAxis + 0.15 * (d.rel / 100) + 0.05 * (COUNTRIES[S.player].infl - 3);
  p *= P.move * (S.scen.constraints.includes("elections") ? 0.85 : 1); if (isRed) p -= 0.2;
  p = clamp(p, 0.05, 0.9);
  const roll = rngNext(S), ok = roll < p;
  S.stats.attempts++;
  let effect = "";
  if (ok) {
    S.stats.successes++;
    if (A.reassure) { d.w[axis] = r2(Math.max(0.15, d.w[axis] * 0.75)); d.red = d.red.map(r => r.axis === axis && r.dir === "max" ? Object.assign({}, r, { thr: r2(Math.min(0.95, r.thr + 0.15)) }) : r); effect = "reassure"; }
    else { const before = d.pos[axis]; d.pos[axis] = r2(clamp(d.pos[axis] + (S.line[axis] - d.pos[axis]) * clamp(0.3 * P.move, 0.1, 0.45), -1, 1)); effect = before === d.pos[axis] ? "none" : "move"; }
    d.rel = clamp(d.rel + 3, -100, 100);
  } else {
    d.rel = clamp(d.rel - (fit < 0.3 ? 6 : 2), -100, 100);
  }
  d.known.pos = true;
  spend(S, 15);
  logE(S, "bilateral", ok ? L(`La délégation ${deName(code)} se montre sensible à votre ${A.name.toLowerCase()} (${AXES[axis].name.toLowerCase()}).`, `The delegation ${deName(code)} is receptive to your approach: ${A.name.toLowerCase()} (${AXES[axis].name.toLowerCase()}).`) : L(`La délégation ${deName(code)} n'est pas convaincue par votre ${A.name.toLowerCase()}.`, `The delegation ${deName(code)} is not convinced by your approach: ${A.name.toLowerCase()}.`), code);
  return { ok, p: r2(p), axis, effect, fit: r2(fit) };
}
/* Offres possibles dans un accord bilatéral */
function dealOffers(S, code) {
  const d = S.dels[code], R = textVec(S), out = [];
  if (d.pet && !hasSrc(S, d.pet)) { const t = tplById(S, d.pet); if (t) out.push({ kind: "pet", src: d.pet, label: L("Intégrer au texte le paragraphe « " + capFirst(clauseText(S, instClausePreview(S, t))) + " »", "Add the paragraph \u201c" + capFirst(clauseText(S, instClausePreview(S, t))) + "\u201d to the text") }); }
  // la clause qui la gêne le plus
  let worst = null, wd = 0;
  for (const c of S.draft.ops) {
    if (c.form === "raw" || !checkClause(S, c).ok) continue;
    const R0 = textVec(S, { without: c.uid }); const delta = baseU(d, R) - baseU(d, R0);
    if (delta < wd) { wd = delta; worst = c; }
  }
  if (worst && wd < -0.02) {
    const vs = verbsForClause(S, worst), weaker = vs.filter(v => verbStrength(v) < verbStrength(worst.v)).sort((a, b) => verbStrength(b) - verbStrength(a));
    if (weaker.length) out.push({ kind: "soften", uid: worst.uid, verb: weaker[Math.min(1, weaker.length - 1)], label: L(`Remplacer « ${worst.v} » par « ${weaker[Math.min(1, weaker.length - 1)]} » au paragraphe « ${clauseShort(S, worst)} »`, `Replace “${vb(worst.v)}” with “${vb(weaker[Math.min(1, weaker.length - 1)])}” in the paragraph “${clauseShort(S, worst)}”`) });
    out.push({ kind: "delete", uid: worst.uid, label: L(`Retirer le paragraphe « ${clauseShort(S, worst)} »`, `Remove the paragraph “${clauseShort(S, worst)}”`) });
  }
  if (issueOf(S).axes.includes("fin") && d.pos.fin > 0.2 && !hasSrc(S, "g_cap")) out.push({ kind: "fund", src: "g_cap", label: L("Ajouter un paragraphe sur l'assistance technique et financière aux pays en développement", "Add a paragraph on technical and financial assistance to developing countries") });
  out.push({ kind: "support", label: L("Promettre votre soutien à une initiative de sa délégation dans un autre forum", "Promise your support for one of its delegation's initiatives in another forum") });
  return out;
}
function instClausePreview(S, tpl) { const save = S.uid; const c = instClause(S, tpl); S.uid = save; return c; }
const clauseNum = (S, uid) => S.draft.ops.findIndex(c => c.uid === uid) + 1;
function applyOffer(S, code, offer) {
  if (offer.kind === "pet" || offer.kind === "fund") {
    const t = tplById(S, offer.src); const c = instClause(S, t, code);
    const stay = S.draft.ops.findIndex(x => x.src === "g_stay");
    S.draft.ops.splice(stay < 0 ? S.draft.ops.length : stay, 0, c);
    if (KINDS[effKind(c)] && KINDS[effKind(c)].needs7 && !S.draft.pre.some(p => p.id === "ch7")) S.draft.pre.push({ id: "ch7", txt: GENERIC_PREAMBLE.ch7 });
    return { uid: c.uid, src: c.src };
  }
  if (offer.kind === "soften") { const c = S.draft.ops.find(x => x.uid === offer.uid); if (c) { c.v = offer.verb; c.amendedBy = code; } return { uid: offer.uid, maxS: verbStrength(offer.verb) }; }
  if (offer.kind === "delete") { S.draft.ops = S.draft.ops.filter(x => x.uid !== offer.uid); return { uid: offer.uid }; }
  return {};
}
function simulateOffer(S, code, offer) {
  const snap = JSON.stringify(S.draft), su = S.uid;
  applyOffer(S, code, offer);
  const R = textVec(S), u = uOf(S, code, R), hard = hardBreach(S.dels[code], R);
  S.draft = JSON.parse(snap); S.uid = su;
  return { u, hard };
}
const ASKS = {
  vote: { name: "Voter pour le texte", they: "elle votera pour le texte" },
  cosponsor: { name: "Se porter coauteur du texte", they: "elle se portera coauteur du texte" },
  group: { name: "Rallier son groupe à votre texte", they: "elle plaidera pour votre texte au sein de son groupe" }
};
const EN_ASKS = {
  vote: { name: "Vote for the text", they: "it will vote for the text" },
  cosponsor: { name: "Co-sponsor the text", they: "it will co-sponsor the text" },
  group: { name: "Rally its group behind your text", they: "it will argue for your text within its group" }
};
LANG_HOOKS.push(() => { for (const k in ASKS) swapFields(ASKS[k], EN_ASKS[k], ["name", "they"]); });
const lcFirst = s => s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
/* Résumé court d'un paragraphe, pour les libellés */
function clauseShort(S, c) { const w = capFirst(clauseText(S, c)).replace(/[.;]\s*$/, "").split(" "); return w.slice(0, 9).join(" ") + (w.length > 9 ? "…" : ""); }
function actDeal(S, code, askKey, offer) {
  const d = S.dels[code], P = PERSONALITIES[d.pers];
  const before = uOf(S, code);
  const sim = simulateOffer(S, code, offer);
  let u = sim.u + (offer.kind === "support" ? 0.05 : 0) + 0.06 * (P.deal - 1);
  const need = askKey === "cosponsor" ? P.yes + 0.08 : P.yes - 0.04;
  S.stats.attempts++;
  spend(S, 20);
  d.known.pos = true;
  if (sim.hard) {
    logE(S, "bilateral", L(`La délégation ${deName(code)} refuse votre offre : le texte franchirait sa ligne rouge (${AXES[sim.hard.axis].name.toLowerCase()}).`, `The delegation ${deName(code)} rejects your offer: the text would cross its red line (${AXES[sim.hard.axis].name.toLowerCase()}).`), code);
    return { ok: false, reason: "red", axis: sim.hard.axis };
  }
  if (askKey === "group" && !groupsPresent(S).some(g => g.members.includes(code))) return { ok: false, reason: "nogroup" };
  if (u >= need) {
    const applied = applyOffer(S, code, offer);
    const deal = { id: "d" + (S.deals.length + 1), with: code, ask: askKey, kind: offer.kind, label: offer.label, status: "active", t: clockStr(S) };
    Object.assign(deal, applied);
    S.deals.push(deal);
    S.stats.successes++;
    d.rel = clamp(d.rel + 6, -100, 100);
    if (askKey === "cosponsor") { d.cosponsor = true; if (!S.draft.cosponsors.includes(code)) S.draft.cosponsors.push(code); }
    if (askKey === "group") {
      const mates = new Set(groupsPresent(S).filter(g => g.members.includes(code)).flatMap(g => g.members));
      for (const m of mates) if (m !== code) { S.dels[m].lobbied = true; S.dels[m].rel = clamp(S.dels[m].rel + 5, -100, 100); }
    }
    logE(S, "bilateral", L(`Accord conclu avec la délégation ${deName(code)} : ${ASKS[askKey].they} ; en échange, vous acceptez ${de(lcFirst(offer.label))}.`, `Agreement reached with the delegation ${deName(code)}: ${ASKS[askKey].they}; in return, you agree to ${lcFirst(offer.label)}.`), code);
    return { ok: true, gain: r2(u - before) };
  }
  if (u >= need - 0.1) {
    S.stats.counters++;
    const alt = dealOffers(S, code).find(o => o.kind !== offer.kind && o.kind !== "support");
    logE(S, "bilateral", L(`La délégation ${deName(code)} juge votre offre insuffisante et fait une contre-proposition.`, `The delegation ${deName(code)} considers your offer insufficient and makes a counter-proposal.`), code);
    return { ok: false, reason: "counter", counter: alt || null };
  }
  d.rel = clamp(d.rel - 2, -100, 100);
  logE(S, "bilateral", L(`La délégation ${deName(code)} décline votre proposition d'accord.`, `The delegation ${deName(code)} declines your proposed agreement.`), code);
  return { ok: false, reason: "far" };
}
function actCosponsor(S, code) {
  const d = S.dels[code], P = PERSONALITIES[d.pers], u = uOf(S, code);
  spend(S, 5);
  d.known.pos = true;
  if (u >= P.yes + 0.05 && d.rel >= -10 && !hardBreach(d, textVec(S))) {
    d.cosponsor = true; if (!S.draft.cosponsors.includes(code)) S.draft.cosponsors.push(code);
    d.rel = clamp(d.rel + 4, -100, 100);
    logE(S, "coalition", L(`La délégation ${deName(code)} accepte de se porter coauteur du projet.`, `The delegation ${deName(code)} agrees to co-sponsor the draft.`), code);
    return { ok: true };
  }
  logE(S, "bilateral", L(`La délégation ${deName(code)} ne souhaite pas, à ce stade, se porter coauteur.`, `The delegation ${deName(code)} does not wish to co-sponsor the draft at this stage.`), code);
  return { ok: false, u: r2(u), need: r2(P.yes + 0.05) };
}
function actConsult(S) {
  for (const code of S.scen.members) if (code !== S.player) S.dels[code].known.pos = true;
  spend(S, 30);
  logE(S, "procedure", L("Consultations informelles ouvertes à toutes les délégations sur le projet de texte.", "Informal consultations on the draft text, open to all delegations."));
  aiRound(S, true);
}
/* Rencontre avec un groupe (bloc ou groupe régional) */
/* Groupes de négociation : groupes régionaux et groupes qui s'expriment
   d'une seule voix dans les enceintes multilatérales */
const NEGO_BLOCS = { UE: "les États membres de l'Union européenne", G77: "le Groupe des 77", ASEAN: "les États membres de l'ASEAN", OCI: "les États membres de l'Organisation de la coopération islamique", LigueArabe: "le Groupe des États arabes", PEID: "les petits États insulaires en développement" };
const EN_NEGO_BLOCS = { UE: "the member States of the European Union", G77: "the Group of 77", ASEAN: "the member States of ASEAN", OCI: "the member States of the Organisation of Islamic Cooperation", LigueArabe: "the Group of Arab States", PEID: "the small island developing States" };
LANG_HOOKS.push(() => swapFields(NEGO_BLOCS, EN_NEGO_BLOCS, keysOf(EN_NEGO_BLOCS)));
const groupLabel = g => g.label || g.name;
function groupsPresent(S) {
  const out = [];
  const others = S.scen.members.filter(m => m !== S.player);
  const blocs = {};
  for (const m of others) for (const b of COUNTRIES[m].blocs) if (NEGO_BLOCS[b]) (blocs[b] = blocs[b] || []).push(m);
  for (const b in blocs) if (blocs[b].length >= 2) out.push({ id: "b:" + b, name: BLOC_NAMES[b] || b, label: NEGO_BLOCS[b], members: blocs[b] });
  const key = BODIES[S.bodyId].org === "UNESCO" ? "unesco" : "un";
  const gs = {}; for (const m of others) (gs[COUNTRIES[m][key]] = gs[COUNTRIES[m][key]] || []).push(m);
  for (const g in gs) if (gs[g].length >= 2) { const name = key === "un" ? UN_GROUPS[g] : (LANG === "en" ? "Electoral " + UNESCO_GROUPS[g] : UNESCO_GROUPS[g].replace(/^Groupe/, "Groupe électoral")); out.push({ id: "g:" + g, name, label: L("le ", "the ") + name, members: gs[g] }); }
  return out.sort((a, b) => b.members.length - a.members.length).slice(0, 8);
}
const sharedNegoBloc = (a, b) => COUNTRIES[a].blocs.some(x => NEGO_BLOCS[x] && COUNTRIES[b].blocs.includes(x));
function groupDemand(S, grp) {
  const issue = issueOf(S), avg = {};
  for (const a of issue.axes) avg[a] = grp.members.reduce((s, m) => s + S.dels[m].pos[a] * S.dels[m].w[a], 0) / grp.members.reduce((s, m) => s + S.dels[m].w[a], 0);
  const axis = issue.axes.slice().sort((a, b) => Math.abs(avg[b] - (textVec(S)[b] || 0)) - Math.abs(avg[a] - (textVec(S)[a] || 0)))[0];
  return { avg, axis, dir: avg[axis] > textVec(S)[axis] ? 1 : -1 };
}
function actGroup(S, grpId, offer) {
  const grp = groupsPresent(S).find(g => g.id === grpId); if (!grp) return { ok: false };
  spend(S, 25);
  const snap = JSON.stringify(S.draft), su = S.uid;
  if (offer) applyOffer(S, grp.members[0], offer);
  const R = textVec(S), won = [], lost = [];
  for (const m of grp.members) {
    const d = S.dels[m]; d.known.pos = true;
    const P = PERSONALITIES[d.pers], u = uOf(S, m, R) + 0.04;
    if (!hardBreach(d, R) && u >= P.yes - 0.06) { won.push(m); d.lobbied = true; d.rel = clamp(d.rel + 4, -100, 100); }
    else lost.push(m);
  }
  if (won.length < Math.ceil(grp.members.length / 2)) { S.draft = JSON.parse(snap); S.uid = su; won.forEach(m => { S.dels[m].lobbied = false; }); logE(S, "coalition", L(`Réunion avec ${groupLabel(grp)} : pas de majorité au sein du groupe pour soutenir votre texte.`, `Meeting with ${groupLabel(grp)}: there is no majority within the group to support your text.`)); return { ok: false, won, lost }; }
  if (offer) S.deals.push(Object.assign({ id: "d" + (S.deals.length + 1), with: grp.members[0], group: grp.name, ask: "group", kind: offer.kind, label: offer.label, status: "active", t: clockStr(S) }, {}));
  S.stats.successes++; S.stats.attempts++;
  logE(S, "coalition", L(`Réunion avec ${groupLabel(grp)} : ${won.length} délégation(s) sur ${grp.members.length} soutiennent désormais votre texte.`, `Meeting with ${groupLabel(grp)}: ${won.length} of ${grp.members.length} delegation(s) now support your text.`));
  return { ok: true, won, lost };
}

/* ---------- Initiatives des délégations IA ---------- */
function aiRound(S, consult) {
  const others = S.scen.members.filter(m => m !== S.player), issue = issueOf(S), R = textVec(S), events = [];
  S.aiSeen = S.aiSeen || {};
  const seen = k => { if (S.aiSeen[k]) return true; S.aiSeen[k] = 1; return false; };
  // 1. Désaccords entre délégations, sans le joueur
  let bestPair = null, bp = 0;
  for (let i = 0; i < others.length; i++) for (let j = i + 1; j < others.length; j++) {
    const a = S.dels[others[i]], b = S.dels[others[j]];
    for (const ax of issue.axes) { if (S.aiSeen["c:" + others[i] + others[j] + ax] || S.aiSeen["c:" + others[i] + ax] || S.aiSeen["c:" + others[j] + ax]) continue; const s = Math.abs(a.pos[ax] - b.pos[ax]) * Math.min(a.w[ax], b.w[ax]) + rngNext(S) * 0.15; if (s > bp) { bp = s; bestPair = [others[i], others[j], ax]; } }
  }
  if (bestPair && bp > 0.55) {
    S.aiSeen["c:" + bestPair[0] + bestPair[1] + bestPair[2]] = S.aiSeen["c:" + bestPair[0] + bestPair[2]] = S.aiSeen["c:" + bestPair[1] + bestPair[2]] = 1;
    const [x, y, ax] = bestPair, dx = S.dels[x], dy = S.dels[y];
    logE(S, "ai", L(`Les délégations ${deName(x)} et ${deName(y)} s'opposent sur la question ${axisDe(ax)} : la première défend ${poleNP(S, ax, dx.pos[ax])}, la seconde ${poleNP(S, ax, dy.pos[ax])}.`, `The delegations ${deName(x)} and ${deName(y)} clash over ${axisDe(ax)}: the first defends ${poleNP(S, ax, dx.pos[ax])}, the second ${poleNP(S, ax, dy.pos[ax])}.`), x);
    events.push("clash");
  }
  // 2. Concertation au sein d'un groupe
  const groups = groupsPresent(S).filter(g => g.members.length >= 3 && !S.aiSeen["g:" + g.id]);
  if (groups.length && rngNext(S) < 0.7) {
    const g = pick(S, groups), avg = {};
    seen("g:" + g.id);
    for (const a of issue.axes) avg[a] = g.members.reduce((s, m) => s + S.dels[m].pos[a], 0) / g.members.length;
    for (const m of g.members) for (const a of issue.axes) S.dels[m].pos[a] = r2(S.dels[m].pos[a] * 0.85 + avg[a] * 0.15);
    const ax = issue.axes.slice().sort((a, b) => Math.abs(avg[b]) - Math.abs(avg[a]))[0];
    logE(S, "coalition", L(`Concertation au sein ${deForm(groupLabel(g))} : position commune en faveur ${deForm(poleNP(S, ax, avg[ax]))}.`, `Consultations within ${groupLabel(g)}: a common position in favour of ${poleNP(S, ax, avg[ax])}.`));
    events.push("group");
  }
  // 3. Proposition concurrente défendue par son auteur
  const rival = S.proposals.filter(p => p.sponsor && p.core && !hasSrc(S, p.core) && !S.aiSeen["r:" + p.id]);
  if (rival.length && rngNext(S) < 0.65) {
    const p = pick(S, rival), fans = others.filter(m => m !== p.sponsor && avgDist(S.dels[m].pos, p.vec) < 0.55);
    seen("r:" + p.id);
    for (const m of fans) S.dels[m].rel = clamp(S.dels[m].rel - 2, -100, 100);
    logE(S, "ai", L(`La délégation ${deName(p.sponsor)} fait circuler sa proposition : ${p.name}. ${fans.length ? fans.length + " délégation(s) y sont favorables." : "Elle peine à rallier des soutiens."}`, `The delegation ${deName(p.sponsor)} circulates its proposal: ${p.name}. ${fans.length ? fans.length + " delegation(s) are in favour of it." : "It is struggling to win support."}`), p.sponsor);
    events.push("rival");
  }
  // 4. Offre spontanée adressée au joueur
  const near = others.filter(m => { const d = S.dels[m], P = PERSONALITIES[d.pers], u = uOf(S, m, R); return !d.cosponsor && !S.deals.some(x => x.with === m && x.status === "active") && u < P.yes && u >= P.yes - 0.14 && !S.inbox.some(x => x.from === m && x.status === "pending"); });
  if (near.length) {
    const m = pick(S, near), offers = dealOffers(S, m).filter(o => o.kind !== "support");
    if (offers.length) {
      const o = offers[0];
      S.inbox.push({ id: "m" + (S.inbox.length + 1), from: m, offer: o, ask: "vote", status: "pending", t: clockStr(S) });
      logE(S, "ai", L(`La délégation ${deName(m)} vous propose un accord : elle votera pour le texte si vous acceptez ${de(lcFirst(o.label))}.`, `The delegation ${deName(m)} offers you an agreement: it will vote for the text if you agree to ${lcFirst(o.label)}.`), m);
      events.push("offer");
    }
  }
  // 5. Médiation
  const med = others.find(m => S.dels[m].pers === "mediatrice" && rngNext(S) < 0.6);
  if (med && S.draft.ops.length) {
    const contested = S.draft.ops.map(c => [c, clauseReactions(S, c)]).filter(([c, r]) => r.opp.length + r.mod.length >= 3 && verbsForClause(S, c).some(v => verbStrength(v) < verbStrength(c.v))).sort((a, b) => (b[1].opp.length + b[1].mod.length) - (a[1].opp.length + a[1].mod.length))[0];
    if (contested) { proposeAmendment(S, med, contested[0], "soften", "compromis"); events.push("mediation"); }
  }
  // 6. Amendements des délégations insatisfaites (phase de rédaction ou consultations)
  if (S.phase === 5 || consult) genAmendments(S, consult ? 2 : 3);
  S.lastAi = S.negSpent;
  return events;
}
const axisDe = ax => LANG === "en" ? ({ obl: "the legal scope of the text", sup: "international follow-up", fin: "funding", reg: "the level of action", prv: "the role of the private sector", rgl: "technology governance", opn: "access and sharing", res: "restrictive measures", dro: "the rights-based approach" }[ax]) : ({ obl: "de la portée juridique du texte", sup: "du suivi international", fin: "du financement", reg: "de l'échelle d'action", prv: "du rôle du secteur privé", rgl: "de l'encadrement des technologies", opn: "de l'accès et du partage", res: "des mesures restrictives", dro: "de l'approche fondée sur les droits" }[ax]);
function maybeAi(S) { if ((S.phase === 4 || S.phase === 5) && S.negSpent - S.lastAi >= 25) aiRound(S); }

/* ---------- Amendements ---------- */
function proposeAmendment(S, code, c, type, tag) {
  if (S.amendments.some(a => a.status === "pending" && a.target === (c && c.uid) && a.type === type)) return null;
  const am = { id: "a" + (S.amendments.length + 1), by: code, type, target: c ? c.uid : null, status: "pending", tag: tag || null, t: clockStr(S) };
  if (type === "soften") {
    const vs = verbsForClause(S, c).filter(v => verbStrength(v) < verbStrength(c.v)).sort((a, b) => verbStrength(b) - verbStrength(a));
    if (!vs.length) return null;
    am.verb = vs[Math.min(tag ? 0 : 1, vs.length - 1)];
  }
  if (type === "add") { am.src = c; am.target = null; }
  // soutiens : délégations à qui l'amendement profite
  const snap = JSON.stringify(S.draft), su = S.uid, before = {};
  for (const m of S.scen.members) if (m !== S.player) before[m] = baseU(S.dels[m], textVec(S));
  applyAmend(S, am);
  am.sup = []; am.opp = [];
  for (const m of S.scen.members) { if (m === S.player || m === code) continue; const dlt = baseU(S.dels[m], textVec(S)) - before[m]; if (dlt > 0.02) am.sup.push(m); else if (dlt < -0.03) am.opp.push(m); }
  am.gain = r2(baseU(S.dels[code], textVec(S)) - before[code]);
  S.draft = JSON.parse(snap); S.uid = su;
  S.amendments.push(am);
  logE(S, "amend", L(`La délégation ${deName(code)} propose un amendement : ${amendLabel(S, am)}.`, `The delegation ${deName(code)} proposes an amendment: ${amendLabel(S, am)}.`), code);
  return am;
}
function amendLabel(S, am) {
  const n = am.target ? clauseNum(S, am.target) : 0;
  if (am.type === "soften") return L(`remplacer « ${(S.draft.ops.find(c => c.uid === am.target) || {}).v} » par « ${am.verb} » au paragraphe ${n}`, `replace “${vb((S.draft.ops.find(c => c.uid === am.target) || {}).v)}” with “${vb(am.verb)}” in paragraph ${n}`);
  if (am.type === "delete") return L(`supprimer le paragraphe ${n}`, `delete paragraph ${n}`);
  if (am.type === "add") { const t = tplById(S, am.src); return L(`ajouter un paragraphe : « ${t ? clauseText(S, instClausePreview(S, t)) : ""} »`, `add a paragraph: “${t ? clauseText(S, instClausePreview(S, t)) : ""}”`); }
  return am.type;
}
function applyAmend(S, am) {
  if (am.type === "soften") { const c = S.draft.ops.find(x => x.uid === am.target); if (c) { c.v = am.verb; c.amendedBy = am.by; } }
  else if (am.type === "delete") S.draft.ops = S.draft.ops.filter(x => x.uid !== am.target);
  else if (am.type === "add") { const t = tplById(S, am.src); if (t) { const c = instClause(S, t, am.by); const stay = S.draft.ops.findIndex(x => x.src === "g_stay"); S.draft.ops.splice(stay < 0 ? S.draft.ops.length : stay, 0, c); am.newUid = c.uid; } }
}
function genAmendments(S, max) {
  let n = 0;
  const R = textVec(S);
  const others = S.scen.members.filter(m => m !== S.player).map(m => [m, uOf(S, m, R)]).sort((a, b) => a[1] - b[1]);
  for (const [m, u] of others) {
    if (n >= max) break;
    const d = S.dels[m], P = PERSONALITIES[d.pers];
    if (u >= P.yes + 0.05 || d.sal < 0.45 || S.amendments.filter(a => a.by === m).length >= 2) continue;
    let worst = null, wd = 0;
    for (const c of S.draft.ops) { if (c.form === "raw" || !checkClause(S, c).ok) continue; const dl = baseU(d, R) - baseU(d, textVec(S, { without: c.uid })); if (dl < wd) { wd = dl; worst = c; } }
    let am = null;
    if (worst && wd < -0.03) {
      const canSoften = verbsForClause(S, worst).some(v => verbStrength(v) < verbStrength(worst.v));
      am = proposeAmendment(S, m, worst, canSoften && (wd > -0.12 || d.pers === "mediatrice" || d.pers === "cooperative") ? "soften" : "delete");
    } else if (d.pet && !hasSrc(S, d.pet) && !S.amendments.some(a => a.type === "add" && a.src === d.pet)) am = proposeAmendment(S, m, d.pet, "add");
    if (am) n++;
  }
  return n;
}
function decideAmendment(S, id, decision) {
  const am = S.amendments.find(a => a.id === id); if (!am || am.status !== "pending") return null;
  const d = S.dels[am.by];
  spend(S, 5);
  if (decision === "accept") {
    applyAmend(S, am); am.status = "accepted"; S.stats.amendAcc++;
    d.rel = clamp(d.rel + 8, -100, 100); (am.sup || []).forEach(m => { S.dels[m].rel = clamp(S.dels[m].rel + 3, -100, 100); }); (am.opp || []).forEach(m => { S.dels[m].rel = clamp(S.dels[m].rel - 2, -100, 100); });
    logE(S, "amend", L(`Vous acceptez l'amendement de la délégation ${deName(am.by)}.`, `You accept the amendment proposed by the delegation ${deName(am.by)}.`), am.by);
  } else if (decision === "reject") {
    am.status = "rejected"; S.stats.amendRej++;
    d.rel = clamp(d.rel - (d.pers === "intransigeante" ? 10 : 6), -100, 100); (am.sup || []).forEach(m => { S.dels[m].rel = clamp(S.dels[m].rel - 2, -100, 100); });
    logE(S, "amend", L(`Vous rejetez l'amendement de la délégation ${deName(am.by)}.`, `You reject the amendment proposed by the delegation ${deName(am.by)}.`), am.by);
  } else if (decision === "counter") {
    // contre-proposition : adoucir d'un seul cran au lieu de supprimer, ou ajouter avec un verbe plus faible
    S.stats.amendCounter++;
    const c = S.draft.ops.find(x => x.uid === am.target);
    let ok = false;
    if (am.type === "delete" && c) {
      const vs = verbsForClause(S, c).filter(v => verbStrength(v) < verbStrength(c.v)).sort((a, b) => verbStrength(b) - verbStrength(a));
      if (vs.length) { const before = baseU(d, textVec(S)); const old = c.v; c.v = vs[Math.min(1, vs.length - 1)]; const gain = baseU(d, textVec(S)) - before; ok = gain >= am.gain * 0.45 * PERSONALITIES[d.pers].deal; if (!ok) c.v = old; else c.amendedBy = am.by; }
    } else if (am.type === "soften" && c) {
      const vs = verbsForClause(S, c).filter(v => verbStrength(v) < verbStrength(c.v) && verbStrength(v) > verbStrength(am.verb)).sort((a, b) => verbStrength(b) - verbStrength(a));
      if (vs.length) { const before = baseU(d, textVec(S)); const old = c.v; c.v = vs[0]; const gain = baseU(d, textVec(S)) - before; ok = gain >= am.gain * 0.45 * PERSONALITIES[d.pers].deal; if (!ok) c.v = old; else c.amendedBy = am.by; }
    } else if (am.type === "add") {
      applyAmend(S, am); const nc = S.draft.ops.find(x => x.uid === am.newUid);
      if (nc) { const vs = verbsForClause(S, nc).filter(v => verbStrength(v) < verbStrength(nc.v)).sort((a, b) => verbStrength(b) - verbStrength(a)); if (vs.length) nc.v = vs[0]; }
      ok = true;
    }
    am.status = ok ? "countered" : "rejected";
    d.rel = clamp(d.rel + (ok ? 4 : -3), -100, 100);
    logE(S, "amend", ok ? L(`La délégation ${deName(am.by)} accepte votre contre-proposition.`, `The delegation ${deName(am.by)} accepts your counter-proposal.`) : L(`La délégation ${deName(am.by)} refuse votre contre-proposition ; son amendement est considéré comme rejeté.`, `The delegation ${deName(am.by)} rejects your counter-proposal; its amendment is considered rejected.`), am.by);
  }
  checkDeals(S);
  return am;
}
function decideInbox(S, id, accept) {
  const m = S.inbox.find(x => x.id === id); if (!m || m.status !== "pending") return null;
  m.status = accept ? "accepted" : "declined";
  const d = S.dels[m.from];
  if (accept) {
    const applied = applyOffer(S, m.from, m.offer);
    S.deals.push(Object.assign({ id: "d" + (S.deals.length + 1), with: m.from, ask: "vote", kind: m.offer.kind, label: m.offer.label, status: "active", t: clockStr(S) }, applied));
    d.rel = clamp(d.rel + 6, -100, 100); S.stats.offersAcc++;
    logE(S, "bilateral", L(`Vous acceptez l'offre de la délégation ${deName(m.from)} : elle votera pour le texte.`, `You accept the offer from the delegation ${deName(m.from)}: it will vote for the text.`), m.from);
  } else { d.rel = clamp(d.rel - 3, -100, 100); logE(S, "bilateral", L(`Vous déclinez l'offre de la délégation ${deName(m.from)}.`, `You decline the offer from the delegation ${deName(m.from)}.`), m.from); }
  checkDeals(S);
  return m;
}
/* Amendements devenus sans objet après une modification du texte */
function refreshAmendments(S) {
  for (const am of S.amendments) {
    if (am.status !== "pending") continue;
    const c = am.target ? S.draft.ops.find(x => x.uid === am.target) : null;
    if ((am.type === "soften" || am.type === "delete") && !c) am.status = "moot";
    else if (am.type === "soften" && verbStrength(c.v) <= verbStrength(am.verb)) am.status = "moot";
    else if (am.type === "add" && hasSrc(S, am.src)) am.status = "moot";
  }
}
/* Promesses : si le joueur défait ce qu'il a promis, l'accord est rompu */
function checkDeals(S) {
  refreshAmendments(S);
  for (const dl of S.deals) {
    if (dl.status !== "active") continue;
    if (!dealHonored(S, dl)) {
      dl.status = "broken"; S.stats.broken++;
      const d = S.dels[dl.with]; d.rel = clamp(d.rel - 25, -100, 100); d.cosponsor = false;
      S.draft.cosponsors = S.draft.cosponsors.filter(x => x !== dl.with);
      for (const m of S.scen.members) if (m !== S.player && m !== dl.with && sharedNegoBloc(m, dl.with)) S.dels[m].rel = clamp(S.dels[m].rel - 5, -100, 100);
      logE(S, "bilateral", L(`Promesse rompue : la délégation ${deName(dl.with)} constate que l'engagement « ${dl.label} » n'a pas été tenu.`, `Broken promise: the delegation ${deName(dl.with)} notes that the commitment “${dl.label}” has not been kept.`), dl.with);
    }
  }
}

/* ---------- Édition du texte par le joueur ---------- */
function addClause(S, tplId) {
  const t = tplById(S, tplId); if (!t) return null;
  const c = instClause(S, t, S.player);
  const stay = S.draft.ops.findIndex(x => x.src === "g_stay");
  S.draft.ops.splice(stay < 0 ? S.draft.ops.length : stay, 0, c);
  if (KINDS[effKind(c)] && KINDS[effKind(c)].needs7 && !S.draft.pre.some(p => p.id === "ch7")) { S.draft.pre.push({ id: "ch7", txt: GENERIC_PREAMBLE.ch7 }); logE(S, "procedure", L("Le paragraphe « Agissant en vertu du Chapitre VII » est ajouté au préambule, condition des mesures de l'article 41.", "The paragraph “Acting under Chapter VII” is added to the preamble, as required for Article 41 measures.")); }
  logE(S, "amend", L(`Vous ajoutez un paragraphe au projet : « ${capFirst(clauseText(S, c))} ».`, `You add a paragraph to the draft: “${capFirst(clauseText(S, c))}”.`), S.player);
  checkDeals(S);
  return c;
}
function addFreeClause(S, verb, text, kind, fx) {
  const c = { uid: newUid(S), src: "free", k: kind || "rec", form: "free", v: verb, text: String(text).trim().replace(/[.;]\s*$/, ""), fx: fx || {}, tech: /\d/.test(text) ? 1 : 0, by: S.player };
  const stay = S.draft.ops.findIndex(x => x.src === "g_stay");
  S.draft.ops.splice(stay < 0 ? S.draft.ops.length : stay, 0, c);
  logE(S, "amend", L(`Vous rédigez un nouveau paragraphe : « ${capFirst(clauseText(S, c))} ».`, `You draft a new paragraph: “${capFirst(clauseText(S, c))}”.`), S.player);
  checkDeals(S);
  return c;
}
function setVerb(S, uid, verb) { const c = S.draft.ops.find(x => x.uid === uid); if (!c) return; c.v = verb; checkDeals(S); }
function removeClause(S, uid) { const c = S.draft.ops.find(x => x.uid === uid); if (!c || c.form === "raw") return; S.draft.ops = S.draft.ops.filter(x => x.uid !== uid); logE(S, "amend", L(`Vous retirez le paragraphe « ${capFirst(clauseText(S, c)).slice(0, 90)}… ».`, `You withdraw the paragraph “${capFirst(clauseText(S, c)).slice(0, 90)}…”.`), S.player); checkDeals(S); }
function moveClause(S, uid, dir) { const i = S.draft.ops.findIndex(x => x.uid === uid), j = i + dir; if (i < 0 || j < 0 || j >= S.draft.ops.length || S.draft.ops[j].form === "raw" || S.draft.ops[i].form === "raw") return; const a = S.draft.ops; [a[i], a[j]] = [a[j], a[i]]; }
function togglePre(S, id) {
  const i = S.draft.pre.findIndex(p => p.id === id);
  if (i >= 0) S.draft.pre.splice(i, 1); else S.draft.pre.push({ id, txt: GENERIC_PREAMBLE[id] });
  checkDeals(S);
}

/* ---------- Vote final ---------- */
function runVote(S, playerVote) {
  const R = textVec(S), votes = {}, why = {};
  for (const code of S.scen.members) {
    if (code === S.player) { votes[code] = playerVote; continue; }
    const vi = voteIntent(S, code, R); votes[code] = vi.v; why[code] = vi;
  }
  // accords honorés / rompus
  for (const dl of S.deals) if (dl.status === "active") dl.status = dealHonored(S, dl) ? "honored" : "broken";
  const t = tally(S, votes);
  const start = Math.floor(rngNext(S) * S.scen.members.length);
  const order = sortFr(S.scen.members); const rollOrder = order.slice(start).concat(order.slice(0, start));
  S.vote = { votes, why, t, rollOrder, R, playerVote };
  advance(S, 15);
  logE(S, "vote", L(`Vote enregistré : ${t.yes} pour, ${t.no} contre, ${t.abs} abstention(s). ${t.adopted ? "Le projet est adopté." : "Le projet n'est pas adopté."}${t.veto.length ? " Vote négatif d'un membre permanent : " + t.veto.map(cname).join(", ") + "." : ""}`, `Recorded vote: ${t.yes} in favour, ${t.no} against, ${t.abs} abstention(s). ${t.adopted ? "The draft is adopted." : "The draft is not adopted."}${t.veto.length ? " Negative vote by a permanent member: " + t.veto.map(cname).join(", ") + "." : ""}`));
  return S.vote;
}

/* ---------- Bilan ---------- */
function playerU(S, R) { return baseU(S.dels[S.player], R); }
function objectives(S) {
  const me = S.dels[S.player], issue = issueOf(S), out = [];
  const top = issue.axes.slice().sort((a, b) => me.w[b] - me.w[a]);
  const a1 = top[0], p1 = me.pos[a1];
  if (p1 >= 0) { const thr = r2(clamp(p1 * 0.55, 0.15, 0.55)); out.push({ id: "axis", axis: a1, dir: "min", thr, text: L(`Obtenir un texte adopté orienté vers ${poleNP(S, a1, 1)} (indicateur « ${AXES[a1].name} » au moins à ${fmtSigned(thr)})`, `Secure the adoption of a text oriented towards ${poleNP(S, a1, 1)} (“${AXES[a1].name}” indicator at least ${fmtSigned(thr)})`) }); }
  else { const thr = r2(clamp(p1 * 0.3 + 0.25, -0.2, 0.3)); out.push({ id: "axis", axis: a1, dir: "max", thr, text: L(`Éviter l'adoption d'un texte trop orienté vers ${poleNP(S, a1, 1)} (indicateur « ${AXES[a1].name} » au plus à ${fmtSigned(thr)})`, `Prevent the adoption of a text leaning too far towards ${poleNP(S, a1, 1)} (“${AXES[a1].name}” indicator at most ${fmtSigned(thr)})`) }); }
  if (me.pet) { const t = tplById(S, me.pet); if (t) out.push({ id: "pet", src: me.pet, text: L(`Faire figurer dans le texte adopté : « ${capFirst(clauseText(S, instClausePreview(S, t)))} »`, `Get this paragraph into the adopted text: “${capFirst(clauseText(S, instClausePreview(S, t)))}”`) }); }
  const k = S.scen.members.length <= 6 ? 1 : 3;
  out.push({ id: "co", k, text: L(`Rassembler au moins ${k} coauteur${k > 1 ? "s" : ""}, dont un hors de votre groupe régional`, `Gather at least ${k} co-sponsor${k > 1 ? "s" : ""}, including one from outside your regional group`) });
  return out;
}
const fmtSigned = x => (x > 0 ? "+" : x < 0 ? "−" : "") + Math.abs(x).toFixed(2).replace(".", L(",", "."));
function evalObjectives(S) {
  const R = S.vote ? S.vote.R : textVec(S), adopted = S.vote && S.vote.t.adopted, me = COUNTRIES[S.player];
  const key = BODIES[S.bodyId].org === "UNESCO" ? "unesco" : "un";
  return objectives(S).map(o => {
    let ok = false, note = "";
    if (o.id === "axis") {
      if (o.dir === "min") { ok = adopted && R[o.axis] >= o.thr; note = adopted ? L(`valeur obtenue : ${fmtSigned(r2(R[o.axis]))}`, `value obtained: ${fmtSigned(r2(R[o.axis]))}`) : L("aucun texte adopté", "no text adopted"); }
      else { ok = !adopted || R[o.axis] <= o.thr; note = adopted ? L(`valeur obtenue : ${fmtSigned(r2(R[o.axis]))}`, `value obtained: ${fmtSigned(r2(R[o.axis]))}`) : L("aucun texte contraire à vos intérêts n'a été adopté", "no text contrary to your interests was adopted"); }
    } else if (o.id === "pet") { ok = adopted && hasSrc(S, o.src); note = ok ? L("paragraphe présent dans le texte adopté", "paragraph included in the adopted text") : (adopted ? L("paragraphe absent du texte", "paragraph missing from the text") : L("aucun texte adopté", "no text adopted")); }
    else if (o.id === "co") { const co = S.draft.cosponsors; ok = co.length >= o.k && co.some(c => COUNTRIES[c][key] !== me[key]); note = L(`${co.length} coauteur(s)`, `${co.length} co-sponsor(s)`); }
    return Object.assign({}, o, { ok, note });
  });
}
function buildReport(S) {
  const me = S.dels[S.player], R = S.vote.R, t = S.vote.t, issue = issueOf(S);
  const objs = evalObjectives(S);
  const q = S.stats.quality.length ? S.stats.quality.reduce((a, b) => a + b, 0) / S.stats.quality.length : 0.4;
  const sQuality = Math.round(clamp(q * 100 + Math.min(10, S.replies * 4), 0, 100));
  const rate = S.stats.attempts ? S.stats.successes / S.stats.attempts : 0;
  const uStart = S.initial ? S.initial.uPlayer : playerU(S, R), uEnd = playerU(S, R);
  const sNego = Math.round(clamp(40 + 45 * (rate - 0.4) + 60 * (uEnd - uStart) + (S.stats.attempts ? 10 : -15) - 12 * S.stats.broken, 0, 100));
  const key = BODIES[S.bodyId].org === "UNESCO" ? "unesco" : "un";
  const yesGroups = new Set(Object.entries(S.vote.votes).filter(([c, v]) => v === "yes").map(([c]) => COUNTRIES[c][key]));
  const sCoal = Math.round(clamp(14 * S.draft.cosponsors.length + 9 * yesGroups.size + (t.adopted ? 15 : 0) - 10 * S.stats.broken, 0, 100));
  const hardMe = hardBreach(me, R), softMe = softBreach(me, R);
  let sCons = Math.round(clamp(100 * (0.25 + playerU(S, R) * 0.75) * (0.85 + 0.15 * (S.orientFit || 0.5)), 0, 100));
  if (t.adopted && hardMe && S.vote.playerVote === "yes") sCons -= 35;
  if (!t.adopted && hardMe && S.vote.playerVote !== "yes") sCons += 10;
  if (softMe && S.vote.playerVote === "yes" && t.adopted) sCons -= 10;
  sCons = clamp(sCons, 0, 100);
  const init = S.initial ? S.initial.proj : null;
  let conv = 0;
  if (init) for (const code of S.scen.members) { if (code === S.player) continue; const a = init.votes[code], b = S.vote.votes[code]; const rank = v => v === "yes" ? 2 : v === "abs" ? 1 : 0; if (rank(b) > rank(a)) conv += rank(b) - rank(a); }
  const sComp = Math.round(clamp(30 + 9 * conv + 6 * (S.stats.amendAcc + S.stats.amendCounter) - 3 * S.stats.amendRej + 5 * S.stats.offersAcc, 0, 100));
  const mine = S.draft.ops.filter(c => c.by === S.player && c.form !== "raw").length, total = S.draft.ops.filter(c => c.form !== "raw").length || 1;
  const objOk = objs.filter(o => o.ok).length;
  const sInfl = Math.round(clamp(45 * (mine / total) + (init ? 5 * (t.yes - init.t.yes) : 0) + 12 * objOk + (t.adopted ? 10 : 0), 0, 100));
  const scores = [
    { k: L("Qualité des interventions", "Quality of statements"), v: sQuality, c: sQuality >= 70 ? L("Vos interventions étaient claires et argumentées.", "Your statements were clear and well argued.") : sQuality >= 45 ? L("Des interventions correctes, qui auraient gagné à être plus précises.", "Sound statements, which would have gained from being more precise.") : L("Vos interventions ont peu pesé sur le débat.", "Your statements carried little weight in the debate.") },
    { k: L("Capacité de négociation", "Negotiating skill"), v: sNego, c: S.stats.attempts ? L(`${S.stats.successes} succès sur ${S.stats.attempts} démarches${S.stats.broken ? ", mais " + S.stats.broken + " promesse(s) rompue(s)" : ""}.`, `${S.stats.successes} successful approach(es) out of ${S.stats.attempts}${S.stats.broken ? ", but " + S.stats.broken + " broken promise(s)" : ""}.`) : L("Vous n'avez engagé aucune démarche bilatérale.", "You did not make any bilateral approach.") },
    { k: L("Construction de coalitions", "Coalition building"), v: sCoal, c: L(`${S.draft.cosponsors.length} coauteur(s) ; votes favorables venus de ${yesGroups.size} groupe(s) régional(aux).`, `${S.draft.cosponsors.length} co-sponsor(s); votes in favour from ${yesGroups.size} regional group(s).`) },
    { k: L("Cohérence avec la position nationale", "Consistency with the national position"), v: sCons, c: hardMe && t.adopted ? L("Le texte adopté franchit l'une de vos lignes rouges.", "The adopted text crosses one of your red lines.") : L("Le résultat reste cohérent avec les instructions de votre capitale.", "The outcome remains consistent with your capital's instructions.") },
    { k: L("Capacité à obtenir des compromis", "Ability to secure compromises"), v: sComp, c: conv ? L(`${conv} évolution(s) de vote en votre faveur depuis le début des négociations.`, `${conv} vote shift(s) in your favour since the start of the negotiations.`) : L("Peu de délégations ont fait évoluer leur vote.", "Few delegations changed their vote.") },
    { k: L("Influence sur le résultat final", "Influence on the final outcome"), v: sInfl, c: L(`${mine} paragraphe(s) sur ${total} portent votre empreinte ; ${objOk} objectif(s) sur ${objs.length} atteint(s).`, `${mine} of ${total} paragraph(s) bear your mark; ${objOk} of ${objs.length} objective(s) achieved.`) }
  ];
  const overall = Math.round(scores.reduce((s, x) => s + x.v, 0) / scores.length);
  let verdict;
  const defended = objs.filter(o => o.ok).length >= 2;
  if (t.adopted && defended) verdict = { k: L("Succès diplomatique", "Diplomatic success"), c: L("Le texte est adopté et vos priorités y figurent.", "The text is adopted and your priorities are reflected in it.") };
  else if (t.adopted) verdict = { k: L("Adoption, priorités partielles", "Adopted, priorities partly met"), c: L("Le texte est adopté, mais vos objectifs ne sont que partiellement atteints.", "The text is adopted, but your objectives are only partly achieved.") };
  else if (defended) verdict = { k: L("Échec du texte, intérêts préservés", "Text rejected, interests preserved"), c: L("Le texte n'est pas adopté, mais vous avez défendu efficacement les intérêts de votre pays.", "The text is not adopted, but you effectively defended your country's interests.") };
  else verdict = { k: L("Échec diplomatique", "Diplomatic failure"), c: L("Le texte n'est pas adopté et vos objectifs ne sont pas atteints.", "The text is not adopted and your objectives are not achieved.") };
  // Relations : évolutions marquantes
  const rel = S.scen.members.filter(c => c !== S.player).map(c => ({ code: c, d: S.dels[c].rel - S.dels[c].rel0 })).sort((a, b) => b.d - a.d);
  const concessions = S.amendments.filter(a => a.status === "accepted" || a.status === "countered").map(a => ({ by: a.by, label: amendLabelFinal(a) }))
    .concat(S.deals.map(dl => ({ by: dl.with, label: dl.label, deal: dl.status })));
  const coalitions = [];
  for (const g of groupsPresent(S)) { const y = g.members.filter(m => S.vote.votes[m] === "yes").length; if (y >= 2) coalitions.push(L(`${g.name} : ${y} sur ${g.members.length} ont voté pour`, `${g.name}: ${y} of ${g.members.length} voted in favour`)); }
  S.report = { scores, overall, verdict, objs, rel, concessions, coalitions: coalitions.slice(0, 4), consequences: consequences(S) };
  return S.report;
}
function amendLabelFinal(a) {
  if (a.type === "soften") return L(`verbe remplacé par « ${a.verb} »`, `verb replaced by “${vb(a.verb)}”`);
  if (a.type === "delete") return a.status === "countered" ? L("paragraphe adouci plutôt que supprimé", "paragraph softened rather than deleted") : L("paragraphe supprimé", "paragraph deleted");
  return L("paragraphe ajouté", "paragraph added");
}
function consequences(S) {
  const b = bodyOf(S), t = S.vote.t, issue = issueOf(S), out = [];
  const kinds = S.draft.ops.filter(c => checkClause(S, c).ok).map(effKind);
  if (t.adopted) {
    if (b.id === "UNSC" && (kinds.includes("binding") || kinds.includes("art41"))) out.push(L("Les décisions du Conseil prises au titre de l'article 25 s'imposent désormais à tous les États membres.", "The Council's decisions taken under Article 25 are now binding on all Member States."));
    else if (b.id === "UNESCO_PC") out.push(L("Le projet de résolution est transmis à la plénière de la Conférence générale, qui devra encore l'adopter.", "The draft resolution is transmitted to the plenary of the General Conference, which must still adopt it."));
    else if (b.id === "UNESCO_GC" && kinds.includes("convention")) out.push(L("La convention est ouverte à la ratification : elle n'engagera que les États qui la ratifieront.", "The convention is open for ratification: it will bind only the States that ratify it."));
    else out.push(L(`Le texte adopté a valeur de recommandation : sa mise en œuvre dépendra de la volonté des États.`, `The adopted text has the force of a recommendation: its implementation will depend on the will of States.`));
    if (kinds.includes("report")) out.push(L(`${capFirst(b.sg)} présentera un rapport de suivi dans les délais prévus (scénario fictif).`, `${capFirst(b.sg)} will submit a follow-up report within the set time frame (fictional scenario).`));
    if (kinds.includes("volfund") || kinds.includes("assessed")) out.push(L("Les moyens financiers prévus devront être mobilisés : leur montant sera un test de la crédibilité du texte.", "The planned financial resources will have to be mobilized: the amount raised will test the credibility of the text."));
    if (t.no + t.abs > t.yes * 0.6) out.push(L("Le nombre d'abstentions et de votes contre fragilise la portée politique du texte.", "The number of abstentions and votes against weakens the political weight of the text."));
  } else {
    out.push(L("La question reste inscrite à l'ordre du jour : les délégations devront reprendre les négociations à une session ultérieure.", "The item remains on the agenda: delegations will have to resume negotiations at a later session."));
    if (t.veto.length) out.push(L(`Le vote négatif ${t.veto.map(deName).join(" et ")} a empêché l'adoption, malgré ${t.yes} voix pour.`, `The negative vote ${t.veto.map(deName).join(" and ")} prevented adoption, despite ${t.yes} votes in favour.`));
    const rival = S.proposals.find(p => p.sponsor && S.vote.votes[p.sponsor] !== "yes");
    if (rival) out.push(L(`La délégation ${deName(rival.sponsor)} annonce qu'elle portera sa propre proposition (${rival.name}) dans un autre cadre.`, `The delegation ${deName(rival.sponsor)} announces that it will pursue its own proposal (${rival.name}) in another forum.`));
  }
  const broken = S.deals.filter(d => d.status === "broken");
  if (broken.length) out.push(L(`${broken.length} engagement(s) non tenu(s) entament la confiance de vos partenaires pour les prochaines négociations.`, `${broken.length} unkept commitment(s) undermine your partners' trust ahead of future negotiations.`));
  return out;
}

/* =====================================================================
   TEXTES : discours, briefing, réponses des délégations
   Les interventions sont construites à partir des positions calculées par
   le moteur (axes, priorités, lignes rouges, attitude), jamais à partir de
   l'identité d'un pays : aucune formule ne vise une nation en particulier.
   ===================================================================== */

/* ---------- Groupes nominaux de chaque pôle ---------- */
function poleNP(S, axis, dir) {
  const unesco = bodyOf(S).org === "UNESCO";
  const T = LANG === "en" ? {
    obl: ["voluntary commitments", "firm obligations"],
    sup: ["follow-up by the States themselves", "an international monitoring mechanism"],
    fin: ["spending restraint", "dedicated multilateral funding"],
    reg: [unesco ? "coordination by UNESCO" : "coordination at United Nations level", "action led by regional organizations"],
    prv: ["action led by public authorities", "partnerships with the private sector"],
    rgl: ["self-regulation by the actors", "strict regulation"],
    opn: ["controlled access", "open and shared access"],
    res: ["incentives", "binding restrictions"],
    dro: ["a technical and operational approach", "a rights-based approach"]
  }[axis] : {
    obl: ["des engagements volontaires", "des obligations fermes"],
    sup: ["un suivi assuré par les États eux-mêmes", "un mécanisme international de suivi"],
    fin: ["la maîtrise des dépenses", "un financement multilatéral dédié"],
    reg: [unesco ? "une coordination assurée par l'UNESCO" : "une coordination assurée au niveau des Nations Unies", "une action portée par les organisations régionales"],
    prv: ["une action conduite par les pouvoirs publics", "des partenariats avec le secteur privé"],
    rgl: ["l'autorégulation des acteurs", "une régulation stricte"],
    opn: ["un accès encadré", "un accès ouvert et partagé"],
    res: ["des mesures incitatives", "des restrictions contraignantes"],
    dro: ["une approche technique et opérationnelle", "une approche fondée sur les droits"]
  }[axis];
  return T[dir > 0 ? 1 : 0];
}
const axisName = a => AXES[a].name.toLowerCase();

/* ---------- Variables de rédaction ---------- */
function speechVars(S) {
  const b = bodyOf(S);
  return Object.assign({}, bodyVars(S), {
    Pres: S.chairName, org: b.org === "UNESCO" ? L("l'UNESCO", "UNESCO") : L("l'Organisation", "the Organization"),
    head: b.head, lieu: S.scen.vars.lieu, terr: S.scen.vars.terr
  });
}
/* Choix d'une variante sans répétition dans la partie */
function pickPhr(S, key, list) {
  S.phr = S.phr || {};
  if (S.phr[key] === undefined) S.phr[key] = Math.floor(rngNext(S) * list.length);
  const v = list[S.phr[key] % list.length];
  S.phr[key]++;
  return v;
}
const sentence = s => { s = capFirst(String(s).trim()); return /[.!?…»\u201d]$/.test(s) ? s : s + "."; };

/* ---------- Banque de phrases par axe ---------- */
const SPEECH = {
  obl: {
    pos: { strong: ["Ma délégation est convaincue que seules des obligations claires permettront de {but}. Des engagements volontaires ont déjà été pris par le passé ; ils n'ont pas suffi.", "Le temps des déclarations d'intention est passé : le texte que nous adopterons doit comporter des engagements précis, assortis d'échéances.", "Nous voulons un texte ferme, qui engage réellement les États et ne se limite pas à de simples encouragements."],
           mid: ["Nous souhaitons que le texte aille au-delà des simples encouragements, sans imposer pour autant un cadre rigide.", "Ma délégation est favorable à des engagements plus précis, à condition qu'ils restent réalistes."] },
    neg: { strong: ["Ma délégation ne peut accepter que ce texte impose des obligations nouvelles aux États : chaque pays doit rester libre de choisir les moyens adaptés à sa situation.", "Nous mettons en garde contre la tentation d'un texte contraignant. Les engagements définis par chaque État sont ceux qui sont réellement appliqués."],
           mid: ["Nous préférons un texte incitatif, qui laisse aux États une marge d'appréciation dans sa mise en œuvre.", "Ma délégation privilégie la souplesse : des recommandations bien conçues valent mieux que des obligations difficiles à appliquer."] }
  },
  sup: {
    pos: { strong: ["Sans mécanisme de suivi indépendant, ce texte resterait lettre morte. Nous demandons qu'un dispositif international rende compte régulièrement de sa mise en œuvre.", "Ma délégation insiste sur la nécessité d'un suivi international crédible, avec des rapports réguliers et publics."],
           mid: ["Un suivi régulier de la mise en œuvre nous paraît utile, par exemple au moyen de rapports périodiques du Secrétariat.", "Nous souhaitons que les progrès accomplis puissent être mesurés et rendus publics."] },
    neg: { strong: ["Ma délégation s'opposera à tout mécanisme qui permettrait d'évaluer les politiques nationales de l'extérieur : le suivi relève de la responsabilité de chaque État.", "Nous refusons la création d'un nouvel organe de contrôle. Les États sont les mieux placés pour évaluer leurs propres progrès."],
           mid: ["Nous préférons que le suivi repose sur les rapports nationaux plutôt que sur un nouveau dispositif international.", "Un suivi léger, fondé sur les informations transmises par les États, nous paraît suffisant."] }
  },
  fin: {
    pos: { strong: ["La question des moyens est décisive. Sans financement dédié et prévisible, les pays les plus exposés ne pourront pas agir.", "Ma délégation demande que le texte prévoie un financement à la hauteur des besoins, en particulier pour les pays en développement."],
           mid: ["Nous souhaitons que le texte mentionne des moyens de financement, notamment pour le renforcement des capacités.", "Ma délégation appelle à mobiliser des ressources supplémentaires, même modestes, pour accompagner la mise en œuvre."] },
    neg: { strong: ["Dans le contexte budgétaire actuel, ma délégation ne soutiendra aucune dépense nouvelle qui ne serait pas compensée. Mieux utiliser les ressources existantes doit être notre priorité.", "Nous ne sommes pas en mesure de prendre de nouveaux engagements financiers. Le texte doit s'appuyer sur les mécanismes qui existent déjà."],
           mid: ["Ma délégation privilégie les contributions volontaires et la mobilisation des ressources existantes, plutôt que la création d'un nouveau fonds.", "Nous serons attentifs au coût de chaque mesure proposée."] }
  },
  reg: {
    pos: { strong: ["Les organisations régionales connaissent le terrain et disposent souvent de mécanismes déjà opérationnels : le texte doit leur confier un rôle de premier plan.", "Ma délégation plaide pour des solutions régionales, conçues au plus près des réalités de chaque région."],
           mid: ["Nous souhaitons que le texte reconnaisse la contribution des organisations régionales et sous-régionales.", "Les initiatives régionales existantes devraient être mieux associées à nos travaux."] },
    neg: { strong: ["Seule une coordination à l'échelle mondiale permettra d'éviter la fragmentation des initiatives. Ma délégation souhaite que {org} joue pleinement son rôle.", "Nous craignons qu'une approche purement régionale ne creuse les écarts entre les régions. Le cadre doit rester universel."],
           mid: ["Nous sommes attachés à un cadre universel, auquel les organisations régionales peuvent utilement contribuer.", "Ma délégation souhaite que la coordination reste assurée au niveau mondial."] }
  },
  prv: {
    pos: { strong: ["Le secteur privé dispose de compétences et de ressources considérables. Ma délégation souhaite que le texte l'associe pleinement, au moyen de partenariats ambitieux.", "Nous ne réussirons pas sans les entreprises et les fondations : elles doivent être associées à la conception comme à la mise en œuvre des solutions."],
           mid: ["Des partenariats avec le secteur privé peuvent utilement compléter l'action publique.", "Ma délégation souhaite que le texte ouvre la porte à des partenariats avec les acteurs économiques."] },
    neg: { strong: ["Ma délégation tient à ce que cette question reste du ressort de l'action publique : les intérêts privés ne doivent pas orienter des décisions qui relèvent de l'intérêt général.", "Nous sommes réservés quant à un rôle accru des acteurs privés. La responsabilité première incombe aux États."],
           mid: ["Le secteur privé peut contribuer, mais dans un cadre fixé par les pouvoirs publics.", "Nous souhaitons que les partenariats éventuels restent sous le contrôle des autorités publiques."] }
  },
  rgl: {
    pos: { strong: ["Les risques sont désormais bien documentés. Ma délégation demande un encadrement clair, fondé sur l'évaluation des risques, et des garanties effectives pour les personnes concernées.", "Nous ne pouvons pas laisser les acteurs fixer seuls leurs propres règles : une régulation stricte est indispensable."],
           mid: ["Nous souhaitons que le texte pose quelques règles communes, proportionnées aux risques.", "Des garanties minimales, communes à tous, nous paraissent nécessaires."] },
    neg: { strong: ["Ma délégation met en garde contre une régulation excessive, qui freinerait l'innovation sans réduire les risques. Les codes de conduite élaborés avec les acteurs ont fait leurs preuves.", "Nous ne soutiendrons pas un encadrement rigide d'un domaine qui évolue aussi vite : il faut faire confiance aux normes techniques et à l'autorégulation."],
           mid: ["Nous privilégions des lignes directrices souples, que les acteurs pourront adapter à l'évolution des technologies.", "Ma délégation souhaite éviter toute règle qui deviendrait obsolète avant même d'être appliquée."] }
  },
  opn: {
    pos: { strong: ["Le partage des connaissances est la condition d'un accès équitable. Ma délégation défend un accès ouvert, en particulier au bénéfice des pays en développement.", "Nous demandons que les ressources concernées soient librement accessibles : c'est une question d'équité entre les pays."],
           mid: ["Nous souhaitons que le texte favorise davantage le partage et l'accès ouvert.", "Ma délégation encourage le partage des données et des savoirs, dans le respect des droits de chacun."] },
    neg: { strong: ["Ma délégation tient à un accès encadré, qui protège les droits des créateurs et des communautés concernées et garantit la sécurité des données.", "L'ouverture sans garanties n'est pas une solution : l'accès doit rester encadré et respecter les droits de chacun."],
           mid: ["Nous sommes favorables au partage, à condition qu'il soit encadré par des règles claires.", "Ma délégation souhaite que l'accès aux ressources reste soumis à des conditions précises."] }
  },
  res: {
    pos: { strong: ["Les mesures incitatives ont montré leurs limites. Ma délégation estime que des restrictions contraignantes sont désormais nécessaires.", "Nous demandons des mesures fermes : il faut fixer des limites claires et les faire respecter."],
           mid: ["Des limitations ciblées nous paraissent nécessaires dans les situations les plus graves.", "Ma délégation n'exclut pas des restrictions, lorsque les autres mesures ont échoué."] },
    neg: { strong: ["Ma délégation s'oppose à des restrictions qui pénaliseraient les populations et les économies locales. Des mesures incitatives, négociées avec les acteurs, sont plus efficaces.", "Nous ne soutiendrons pas une approche fondée sur l'interdiction : il faut convaincre et accompagner les acteurs plutôt que les contraindre."],
           mid: ["Nous préférons des mesures incitatives, quitte à envisager des limites ciblées en dernier recours.", "Ma délégation souhaite que l'on privilégie l'accompagnement des acteurs concernés."] }
  },
  dro: {
    pos: { strong: ["Cette question est d'abord une question de droits. Ma délégation souhaite que le texte place les droits des personnes concernées au cœur de chaque mesure.", "Nous demandons que le texte rappelle explicitement les obligations des États au regard du droit international des droits de l'homme."],
           mid: ["Nous souhaitons que le texte fasse référence aux droits des personnes concernées.", "Ma délégation tient à ce que les mesures adoptées respectent pleinement les droits de chacun."] },
    neg: { strong: ["Ma délégation souhaite que nous nous en tenions aux aspects techniques de la question, sans élargir le débat à des sujets qui relèvent d'autres enceintes.", "Ce texte doit rester concret et opérationnel : nous ne souhaitons pas qu'il devienne un instrument de mise en cause des États."],
           mid: ["Nous privilégions une approche pratique, centrée sur des mesures concrètes.", "Ma délégation souhaite un texte opérationnel, qui évite les débats de principe."] }
  }
};
/* Lignes rouges : « max » = refus d'un texte trop orienté vers le pôle positif
   (conduit à un vote contre) ; « min » = exigence minimale (conduit à l'abstention) */
const REDLINE = {
  obl: { max: ["Ma délégation ne pourra pas soutenir un texte qui imposerait des obligations nouvelles aux États.", "nous aurions du mal à accepter des obligations nouvelles pour les États"], min: ["Ma délégation ne votera pas en faveur d'un texte vidé de tout engagement concret.", "un texte sans engagement concret ne recevrait pas notre soutien"] },
  sup: { max: ["Ma délégation n'acceptera aucun mécanisme international chargé d'évaluer les politiques nationales.", "un mécanisme international d'évaluation des politiques nationales nous poserait de sérieuses difficultés"], min: ["Sans dispositif de suivi, ma délégation ne pourra pas voter en faveur du texte.", "un texte sans aucun suivi ne nous paraîtrait pas crédible"] },
  fin: { max: ["Ma délégation ne pourra pas soutenir un texte qui crée de nouvelles dépenses obligatoires.", "de nouvelles dépenses obligatoires nous poseraient de sérieuses difficultés"], min: ["Un texte sans moyens ne recevra pas le soutien de ma délégation.", "un texte sans aucun moyen nous paraîtrait difficile à soutenir"] },
  reg: { max: ["Ma délégation n'acceptera pas que l'essentiel de la mise en œuvre soit confié aux organisations régionales, au détriment du cadre universel.", "un texte qui confierait l'essentiel de la mise en œuvre aux organisations régionales nous poserait problème"], min: ["Ma délégation ne soutiendra pas un texte qui ignorerait le rôle des organisations régionales.", "nous tenons à ce que le rôle des organisations régionales soit reconnu"] },
  prv: { max: ["Ma délégation s'opposera à tout texte qui confierait au secteur privé des responsabilités qui relèvent des États.", "confier au secteur privé des responsabilités publiques nous poserait problème"], min: ["Un texte qui tiendrait le secteur privé à l'écart ne recevra pas notre soutien.", "nous tenons à ce que le secteur privé soit associé à la mise en œuvre"] },
  rgl: { max: ["Ma délégation ne pourra pas soutenir un encadrement contraignant des technologies concernées.", "un encadrement contraignant des technologies nous poserait de sérieuses difficultés"], min: ["Ma délégation ne soutiendra pas un texte qui se contenterait d'en appeler à l'autorégulation.", "un simple appel à l'autorégulation ne nous paraîtrait pas suffisant"] },
  opn: { max: ["Ma délégation n'acceptera pas un accès ouvert sans garanties pour les détenteurs de droits.", "un accès ouvert sans garanties nous poserait problème"], min: ["Un texte qui ne favoriserait ni l'accès ni le partage ne recevra pas notre soutien.", "nous tenons à ce que le texte favorise l'accès et le partage"] },
  res: { max: ["Ma délégation votera contre toute restriction qui pénaliserait les économies concernées.", "des restrictions pénalisant les économies concernées nous poseraient de sérieuses difficultés"], min: ["Ma délégation ne soutiendra pas un texte qui se limiterait à de simples incitations.", "de simples incitations ne nous paraîtraient pas suffisantes"] },
  dro: { max: ["Ma délégation ne soutiendra pas un texte qui s'écarterait de l'objet de la question pour traiter de sujets examinés dans d'autres enceintes.", "un texte qui s'écarterait de l'objet de la question nous poserait problème"], min: ["Un texte qui passerait sous silence les droits des personnes concernées ne recevra pas notre soutien.", "nous tenons à ce que les droits des personnes concernées soient mentionnés"] }
};
const OPENINGS = ["Merci, {Pres}.", "{Pres}, je vous remercie de me donner la parole.", "Je vous remercie, {Pres}, et vous félicite pour la conduite de nos travaux.", "{Pres}, ma délégation vous remercie de lui donner la parole."];
const OPENINGS_2 = {
  any: ["Ma délégation remercie le Secrétariat pour les informations communiquées.", "Les événements récents rappellent l'urgence de la question inscrite à notre ordre du jour.", "Ma délégation a pris connaissance avec attention de la note d'information du Secrétariat."],
  high: ["Cette question revêt une importance particulière pour mon pays.", "Mon pays suit cette question avec la plus grande attention."],
  open: ["Ma délégation aborde ce débat dans un esprit constructif.", "Nous abordons ce débat avec la volonté d'aboutir."]
};
const CLOSINGS = {
  cooperative: ["Ma délégation est prête à travailler avec toutes les délégations pour parvenir à un texte largement soutenu.", "Nous aborderons les consultations dans un esprit d'ouverture."],
  prudente: ["Ma délégation examinera avec attention tout projet de texte à la lumière de ces considérations.", "Nous attendrons de connaître le projet de texte avant d'arrêter notre position."],
  intransigeante: ["Ces principes ne sont pas négociables pour ma délégation.", "Ma délégation ne s'écartera pas de cette ligne."],
  opportuniste: ["Ma délégation est disposée à soutenir un texte qui tiendra compte de ses préoccupations.", "Nous sommes ouverts au dialogue avec toutes les délégations prêtes à entendre nos préoccupations."],
  mediatrice: ["Ma délégation se tient à la disposition de toutes les parties pour faciliter un compromis.", "Nous sommes prêts à faciliter les consultations pour rapprocher les points de vue."],
  ambitieuse: ["Ma délégation présentera des propositions concrètes en ce sens.", "Nous entendons jouer un rôle moteur dans les négociations à venir."],
  technocratique: ["Ma délégation plaidera pour un texte précis, assorti d'indicateurs et d'un calendrier de mise en œuvre.", "Nous serons attentifs à la précision du texte et à la faisabilité de chaque mesure."]
};
/* Déclarations de groupe : usage courant hors du Conseil de sécurité */
const BLOC_STATEMENT = { UE: "de l'Union européenne et de ses États membres", G77: "du Groupe des 77 et de la Chine", ASEAN: "de l'Association des nations de l'Asie du Sud-Est", OCI: "de l'Organisation de la coopération islamique", LigueArabe: "du Groupe des États arabes", PEID: "de l'Alliance des petits États insulaires" };

/* ---------- Version anglaise des banques de phrases ---------- */
const EN_SPEECH = {
  obl: {
    pos: { strong: ["My delegation is convinced that only clear obligations will make it possible to {but}. Voluntary commitments have been made in the past; they have not been enough.", "The time for declarations of intent is over: the text we adopt must contain precise commitments, with deadlines.", "We want a firm text that genuinely commits States and does not stop at mere encouragement."],
           mid: ["We would like the text to go beyond mere encouragement, without imposing a rigid framework.", "My delegation is in favour of more precise commitments, provided that they remain realistic."] },
    neg: { strong: ["My delegation cannot accept that this text should impose new obligations on States: each country must remain free to choose the means suited to its situation.", "We warn against the temptation of a binding text. The commitments that each State sets for itself are the ones that are actually implemented."],
           mid: ["We prefer a text that encourages, leaving States some discretion in its implementation.", "My delegation favours flexibility: well-designed recommendations are better than obligations that are hard to implement."] }
  },
  sup: {
    pos: { strong: ["Without an independent monitoring mechanism, this text would remain a dead letter. We ask that an international mechanism report regularly on its implementation.", "My delegation insists on the need for credible international follow-up, with regular and public reports."],
           mid: ["Regular follow-up of implementation seems useful to us, for example through periodic reports by the Secretariat.", "We would like the progress made to be measured and made public."] },
    neg: { strong: ["My delegation will oppose any mechanism that would allow national policies to be assessed from outside: follow-up is the responsibility of each State.", "We reject the creation of a new oversight body. States are best placed to assess their own progress."],
           mid: ["We prefer follow-up to be based on national reports rather than on a new international mechanism.", "Light follow-up, based on the information provided by States, seems sufficient to us."] }
  },
  fin: {
    pos: { strong: ["The question of resources is decisive. Without dedicated and predictable funding, the most exposed countries will not be able to act.", "My delegation asks that the text provide funding commensurate with the needs, in particular for developing countries."],
           mid: ["We would like the text to mention means of financing, in particular for capacity-building.", "My delegation calls for additional resources, however modest, to support implementation."] },
    neg: { strong: ["In the current budgetary context, my delegation will not support any new expenditure that is not offset. Making better use of existing resources must be our priority.", "We are not in a position to take on new financial commitments. The text must build on the mechanisms that already exist."],
           mid: ["My delegation favours voluntary contributions and the mobilization of existing resources, rather than the creation of a new fund.", "We will pay close attention to the cost of each proposed measure."] }
  },
  reg: {
    pos: { strong: ["Regional organizations know the situation on the ground and often have mechanisms that are already operational: the text must give them a leading role.", "My delegation argues for regional solutions, designed as close as possible to the realities of each region."],
           mid: ["We would like the text to recognize the contribution of regional and subregional organizations.", "Existing regional initiatives should be more closely involved in our work."] },
    neg: { strong: ["Only coordination at the global level will prevent initiatives from becoming fragmented. My delegation wants {org} to play its full role.", "We fear that a purely regional approach would widen the gaps between regions. The framework must remain universal."],
           mid: ["We are committed to a universal framework, to which regional organizations can usefully contribute.", "My delegation would like coordination to remain at the global level."] }
  },
  prv: {
    pos: { strong: ["The private sector has considerable expertise and resources. My delegation would like the text to involve it fully, through ambitious partnerships.", "We will not succeed without companies and foundations: they must be involved in both designing and implementing solutions."],
           mid: ["Partnerships with the private sector can usefully complement public action.", "My delegation would like the text to open the door to partnerships with economic actors."] },
    neg: { strong: ["My delegation insists that this matter should remain the responsibility of public authorities: private interests must not steer decisions that concern the general interest.", "We have reservations about a greater role for private actors. The primary responsibility lies with States."],
           mid: ["The private sector can contribute, but within a framework set by public authorities.", "We would like any partnerships to remain under the control of public authorities."] }
  },
  rgl: {
    pos: { strong: ["The risks are now well documented. My delegation calls for clear, risk-based regulation and effective safeguards for the people concerned.", "We cannot let the actors set their own rules alone: strict regulation is essential."],
           mid: ["We would like the text to set a few common rules, proportionate to the risks.", "Minimum safeguards, common to all, seem necessary to us."] },
    neg: { strong: ["My delegation warns against excessive regulation, which would hold back innovation without reducing the risks. Codes of conduct drawn up with the actors have proved their worth.", "We will not support rigid regulation of a field that is changing so fast: we must trust technical standards and self-regulation."],
           mid: ["We favour flexible guidelines that the actors can adapt as technologies evolve.", "My delegation wants to avoid any rule that would become obsolete before it is even applied."] }
  },
  opn: {
    pos: { strong: ["Sharing knowledge is the condition for equitable access. My delegation defends open access, in particular for the benefit of developing countries.", "We ask that the resources concerned be freely accessible: it is a question of fairness between countries."],
           mid: ["We would like the text to do more to promote sharing and open access.", "My delegation encourages the sharing of data and knowledge, with respect for everyone's rights."] },
    neg: { strong: ["My delegation is committed to controlled access, which protects the rights of creators and of the communities concerned and guarantees data security.", "Openness without safeguards is not a solution: access must remain regulated and respect everyone's rights."],
           mid: ["We are in favour of sharing, provided that it is governed by clear rules.", "My delegation would like access to resources to remain subject to precise conditions."] }
  },
  res: {
    pos: { strong: ["Incentives have shown their limits. My delegation believes that binding restrictions are now necessary.", "We call for firm measures: clear limits must be set and enforced."],
           mid: ["Targeted limitations seem necessary to us in the most serious situations.", "My delegation does not rule out restrictions when other measures have failed."] },
    neg: { strong: ["My delegation opposes restrictions that would penalize local populations and economies. Incentives negotiated with the actors are more effective.", "We will not support an approach based on prohibition: we must convince and support the actors rather than constrain them."],
           mid: ["We prefer incentives, even if it means considering targeted limits as a last resort.", "My delegation would like priority to be given to supporting the actors concerned."] }
  },
  dro: {
    pos: { strong: ["This question is first and foremost a question of rights. My delegation would like the text to put the rights of the people concerned at the heart of every measure.", "We ask that the text explicitly recall the obligations of States under international human rights law."],
           mid: ["We would like the text to refer to the rights of the people concerned.", "My delegation insists that the measures adopted fully respect the rights of all."] },
    neg: { strong: ["My delegation would like us to keep to the technical aspects of the question, without broadening the debate to matters that belong in other forums.", "This text must remain concrete and operational: we do not want it to become an instrument for putting States in the dock."],
           mid: ["We favour a practical approach, focused on concrete measures.", "My delegation wants an operational text that avoids debates of principle."] }
  }
};
const EN_REDLINE = {
  obl: { max: ["My delegation will not be able to support a text that would impose new obligations on States.", "we would find it hard to accept new obligations for States"], min: ["My delegation will not vote in favour of a text stripped of any concrete commitment.", "a text without any concrete commitment would not receive our support"] },
  sup: { max: ["My delegation will not accept any international mechanism tasked with assessing national policies.", "an international mechanism to assess national policies would cause us serious difficulties"], min: ["Without a follow-up mechanism, my delegation will not be able to vote in favour of the text.", "a text without any follow-up would not seem credible to us"] },
  fin: { max: ["My delegation will not be able to support a text that creates new mandatory expenditure.", "new mandatory expenditure would cause us serious difficulties"], min: ["A text without resources will not receive my delegation's support.", "a text without any resources would be hard for us to support"] },
  reg: { max: ["My delegation will not accept that most of the implementation be entrusted to regional organizations, to the detriment of the universal framework.", "a text that entrusted most of the implementation to regional organizations would be a problem for us"], min: ["My delegation will not support a text that ignores the role of regional organizations.", "we insist that the role of regional organizations be recognized"] },
  prv: { max: ["My delegation will oppose any text that would entrust the private sector with responsibilities that belong to States.", "entrusting public responsibilities to the private sector would be a problem for us"], min: ["A text that kept the private sector at arm's length will not receive our support.", "we insist that the private sector be involved in implementation"] },
  rgl: { max: ["My delegation will not be able to support binding regulation of the technologies concerned.", "binding regulation of these technologies would cause us serious difficulties"], min: ["My delegation will not support a text that merely calls for self-regulation.", "a mere call for self-regulation would not seem sufficient to us"] },
  opn: { max: ["My delegation will not accept open access without safeguards for rights holders.", "open access without safeguards would be a problem for us"], min: ["A text that promoted neither access nor sharing will not receive our support.", "we insist that the text promote access and sharing"] },
  res: { max: ["My delegation will vote against any restriction that would penalize the economies concerned.", "restrictions penalizing the economies concerned would cause us serious difficulties"], min: ["My delegation will not support a text limited to mere incentives.", "mere incentives would not seem sufficient to us"] },
  dro: { max: ["My delegation will not support a text that strays from the subject of the question to deal with matters considered in other forums.", "a text that strayed from the subject of the question would be a problem for us"], min: ["A text that is silent on the rights of the people concerned will not receive our support.", "we insist that the rights of the people concerned be mentioned"] }
};
const EN_OPENINGS = ["Thank you, {Pres}.", "{Pres}, thank you for giving me the floor.", "Thank you, {Pres}, and congratulations on the way you are conducting our work.", "{Pres}, my delegation thanks you for giving it the floor."];
const EN_OPENINGS_2 = {
  any: ["My delegation thanks the Secretariat for the information provided.", "Recent events are a reminder of the urgency of the item on our agenda.", "My delegation has studied the Secretariat's briefing note with care."],
  high: ["This question is of particular importance to my country.", "My country is following this question with the greatest attention."],
  open: ["My delegation approaches this debate in a constructive spirit.", "We approach this debate determined to reach an outcome."]
};
const EN_CLOSINGS = {
  cooperative: ["My delegation is ready to work with all delegations to reach a broadly supported text.", "We will approach the consultations in a spirit of openness."],
  prudente: ["My delegation will carefully examine any draft text in the light of these considerations.", "We will wait to see the draft text before settling our position."],
  intransigeante: ["These principles are not negotiable for my delegation.", "My delegation will not depart from this line."],
  opportuniste: ["My delegation is willing to support a text that takes its concerns into account.", "We are open to dialogue with all delegations willing to hear our concerns."],
  mediatrice: ["My delegation stands ready to help all parties reach a compromise.", "We are ready to facilitate the consultations in order to bring views closer together."],
  ambitieuse: ["My delegation will put forward concrete proposals to that end.", "We intend to play a leading role in the negotiations ahead."],
  technocratique: ["My delegation will argue for a precise text, with indicators and an implementation timetable.", "We will pay close attention to the precision of the text and the feasibility of each measure."]
};
const EN_BLOC_STATEMENT = { UE: "of the European Union and its member States", G77: "of the Group of 77 and China", ASEAN: "of the Association of Southeast Asian Nations", OCI: "of the Organisation of Islamic Cooperation", LigueArabe: "of the Group of Arab States", PEID: "of the Alliance of Small Island States" };
LANG_HOOKS.push(() => {
  for (const a in SPEECH) for (const d in SPEECH[a]) swapFields(SPEECH[a][d], (EN_SPEECH[a] || {})[d], ["strong", "mid"]);
  for (const a in REDLINE) swapFields(REDLINE[a], EN_REDLINE[a], ["max", "min"]);
  swapFields(OPENINGS, EN_OPENINGS, OPENINGS.map((x, i) => i));
  swapFields(OPENINGS_2, EN_OPENINGS_2, ["any", "high", "open"]);
  swapFields(CLOSINGS, EN_CLOSINGS, keysOf(CLOSINGS));
  swapFields(BLOC_STATEMENT, EN_BLOC_STATEMENT, keysOf(BLOC_STATEMENT));
});

function axisSentence(S, axis, p, V) {
  if (Math.abs(p) < 0.25) return fill(L(`Sur la question ${axisDe(axis)}, ma délégation reste ouverte aux différentes options.`, `On the question of ${axisDe(axis)}, my delegation remains open to the various options.`), V);
  const bank = SPEECH[axis][p > 0 ? "pos" : "neg"][Math.abs(p) >= 0.55 ? "strong" : "mid"];
  return fill(pickPhr(S, `ax_${axis}_${p > 0 ? 1 : 0}_${Math.abs(p) >= 0.55 ? 1 : 0}`, bank), V);
}
function topAxes(pos, w, n) {
  return Object.keys(pos).filter(a => Math.abs(pos[a]) >= 0.25).sort((a, b) => w[b] * Math.abs(pos[b]) - w[a] * Math.abs(pos[a])).slice(0, n);
}
function redSentence(S, rl, soft) {
  const pair = REDLINE[rl.axis][rl.dir];
  return soft ? L(`Nous le disons dans un esprit d'ouverture : ${pair[1]}.`, `We say this in a spirit of openness: ${pair[1]}.`) : pair[0];
}

/* ---------- Référence à un orateur précédent ---------- */
function stanceOf(S, code) { return code === S.player ? (S.playerStance || S.line || S.dels[code].pos) : S.dels[code].pos; }
function pickReference(S, code) {
  const d = S.dels[code], axes = topAxes(d.pos, d.w, 2);
  const prev = [...new Set(S.speeches.filter(s => s.code && s.code !== code).map(s => s.code))];
  let best = null, bs = 0;
  for (const p of prev) {
    const pp = stanceOf(S, p);
    for (const a of axes) {
      const x = pp[a], y = d.pos[a];
      if (x === undefined) continue;
      let sc = 0, type = null;
      if (Math.sign(x) !== Math.sign(y) && Math.abs(x) >= 0.3 && Math.abs(y) >= 0.3) { sc = Math.abs(x - y) * d.w[a]; type = "dis"; }
      else if (Math.sign(x) === Math.sign(y) && Math.abs(x) >= 0.3 && Math.abs(y) >= 0.3) { sc = 0.55 * d.w[a]; type = "agr"; }
      if (p === S.player) sc *= 1.3;
      sc += rngNext(S) * 0.1;
      if (type && sc > bs) { bs = sc; best = { code: p, axis: a, type, theirs: x, mine: y }; }
    }
  }
  return best && (best.type === "dis" ? bs > 0.35 : bs > 0.3) ? best : null;
}
function referenceSentence(S, ref) {
  const who = L(`la délégation ${deName(ref.code)}`, `the delegation ${deName(ref.code)}`), theirs = poleNP(S, ref.axis, ref.theirs), mine = poleNP(S, ref.axis, ref.mine);
  if (ref.type === "dis") return pickPhr(S, "ref_dis", [
    L(`Ma délégation ne partage pas l'approche défendue par ${who}. Là où elle plaide pour ${theirs}, nous privilégions ${mine}.`, `My delegation does not share the approach advocated by ${who}. Where it argues for ${theirs}, we favour ${mine}.`),
    L(`Nous avons entendu les arguments de ${who} en faveur ${deForm(theirs)}. Nous ne pouvons y souscrire : ma délégation privilégie ${mine}.`, `We have heard the arguments of ${who} in favour of ${theirs}. We cannot subscribe to them: my delegation favours ${mine}.`),
    L(`Contrairement à ${who}, nous ne pensons pas ${que(theirs)} soit la bonne réponse.`, `Unlike ${who}, we do not believe that ${theirs} is the right answer.`)
  ]);
  return pickPhr(S, "ref_agr", [
    L(`Nous rejoignons ${who}, qui a plaidé à juste titre pour ${mine}.`, `We agree with ${who}, which rightly argued for ${mine}.`),
    L(`Comme ${who}, ma délégation souhaite ${mine}.`, `Like ${who}, my delegation wants ${mine}.`),
    L(`Ma délégation partage l'analyse de ${who} sur la question ${axisDe(ref.axis)}.`, `My delegation shares the analysis of ${who} on ${axisDe(ref.axis)}.`)
  ]);
}

/* ---------- Intervention d'une délégation IA (débat général) ---------- */
function aiSpeech(S, code) {
  const d = S.dels[code], V = speechVars(S), issue = issueOf(S), b = bodyOf(S);
  const p1 = [], p2 = [], p3 = [];
  p1.push(fill(pickPhr(S, "open1", OPENINGS), V));
  const second = d.sal >= 0.72 ? OPENINGS_2.high : (["cooperative", "mediatrice"].includes(d.pers) ? OPENINGS_2.open : OPENINGS_2.any);
  p1.push(fill(pickPhr(S, "open2_" + (second === OPENINGS_2.high ? "h" : second === OPENINGS_2.open ? "o" : "a"), second), V));
  if (!["UNSC", "TRUST"].includes(b.id)) {
    const bloc = COUNTRIES[code].blocs.find(x => BLOC_STATEMENT[x] && S.scen.members.filter(m => COUNTRIES[m].blocs.includes(x)).length >= 2);
    if (bloc && rngNext(S) < 0.45) p1.push(L(`Ma délégation s'associe à la déclaration prononcée au nom ${BLOC_STATEMENT[bloc]} et souhaite ajouter quelques remarques à titre national.`, `My delegation aligns itself with the statement made on behalf ${BLOC_STATEMENT[bloc]} and wishes to add a few remarks in its national capacity.`));
  }
  const axes = topAxes(d.pos, d.w, 2);
  if (!axes.length) p2.push(axisSentence(S, issue.axes[0], 0, V));
  for (const a of axes) p2.push(axisSentence(S, a, d.pos[a], V));
  if (d.pers === "technocratique" && S.scen.facts.length) { const f = pick(S, S.scen.facts); p2.push(L(`Les données communiquées par le Secrétariat le montrent (${f.label.charAt(0).toLowerCase() + f.label.slice(1)} : ${fmtFact(f)}).`, `The figures provided by the Secretariat show this (${f.label.charAt(0).toLowerCase() + f.label.slice(1)}: ${fmtFact(f)}).`)); }
  const ref = pickReference(S, code);
  if (ref && (ref.type === "dis" || rngNext(S) < 0.6)) p3.push(referenceSentence(S, ref));
  const prop = S.proposals.find(p => p.sponsor === code);
  if (prop) p3.push(pickPhr(S, "prop", [L(`C'est pourquoi ma délégation propose ${prop.name}.`, `That is why my delegation proposes ${prop.name}.`), L(`Ma délégation soumettra à l'examen de tous une proposition précise : ${prop.name}.`, `My delegation will submit a specific proposal for everyone's consideration: ${prop.name}.`)]));
  if (d.red.length) p3.push(redSentence(S, d.red[0], ["mediatrice", "cooperative"].includes(d.pers)));
  if (d.pers === "mediatrice") { const ax = consensusAxis(S); if (ax) p3.push(L(`Ma délégation invite chacun à partir des points de convergence, qui existent, notamment en faveur ${deForm(poleNP(S, ax.axis, ax.avg))}.`, `My delegation invites everyone to build on the points of convergence, which do exist, notably in favour of ${poleNP(S, ax.axis, ax.avg)}.`)); }
  p3.push(pickPhr(S, "close_" + d.pers, CLOSINGS[d.pers] || CLOSINGS.prudente) + L(" Je vous remercie.", " Thank you."));
  return { code, paras: [p1.join(" "), p2.join(" "), p3.join(" ")].filter(Boolean), ref: ref ? { code: ref.code, type: ref.type, axis: ref.axis } : null, kind: "debate", t: clockStr(S) };
}
function fmtFact(f) { return (f.value >= 1000 ? fmtN(f.value) : String(f.value).replace(".", L(",", "."))) + (f.unit || ""); }
function consensusAxis(S) {
  const issue = issueOf(S), ms = S.scen.members.filter(m => m !== S.player);
  let best = null;
  for (const a of issue.axes) {
    const vals = ms.map(m => S.dels[m].pos[a]), avg = vals.reduce((x, y) => x + y, 0) / vals.length;
    const sd = Math.sqrt(vals.reduce((x, y) => x + (y - avg) ** 2, 0) / vals.length);
    if (Math.abs(avg) >= 0.15 && (!best || sd < best.sd)) best = { axis: a, avg, sd };
  }
  return best;
}

/* ---------- Présidence ---------- */
function chairOpening(S) {
  const b = bodyOf(S), issue = issueOf(S), V = speechVars(S), sc = S.scen;
  const paras = [];
  paras.push(L(`Excellences, mesdames et messieurs les délégués, je déclare ouverte la ${b.session} ${b.de}${b.id === "UNESCO_PC" && b.commissions[sc.pc] ? " (commission « " + b.commissions[sc.pc] + " »)" : ""}.`, `Excellencies, distinguished delegates, I declare open this ${b.session} ${b.de}${b.id === "UNESCO_PC" && b.commissions[sc.pc] ? " (" + b.commissions[sc.pc] + " Commission)" : ""}.`));
  paras.push(L(`Notre ordre du jour appelle l'examen de la question intitulée « ${fill(issue.title, V)} ». `, `The item on our agenda is entitled “${fill(issue.title, V)}”. `) + (sc.extraordinary ? fill(L(`Cette séance a été convoquée à la suite ${deForm(sc.triggerShort)}.`, `This meeting has been convened following ${sc.triggerShort}.`), V) : fill(L(`Cette question a pris une acuité nouvelle à la suite ${deForm(sc.triggerShort)}.`, `This question has become more pressing following ${sc.triggerShort}.`), V)));
  paras.push(fill(issue.background, V) + " " + issue.history.map(h => fill(h, Object.assign({}, V, sc.vars))).join(" "));
  paras.push(L(`Nos travaux se dérouleront en plusieurs temps : un débat général, des consultations informelles, puis l'examen d'un projet de ${b.act} et sa mise aux voix. Je rappelle les règles de vote : ${b.ruleText.charAt(0).toLowerCase() + b.ruleText.slice(1)}`, `Our work will proceed in several stages: a general debate, informal consultations, then the consideration of a draft ${b.act} and a vote on it. I recall the voting rules: ${b.ruleText.charAt(0).toLowerCase() + b.ruleText.slice(1)}`) + (issue.important && b.vote.important ? L(" La présente question relève des questions importantes : la majorité des deux tiers s'appliquera.", " This item is an important question: a two-thirds majority will apply.") : ""));
  const cons = sc.constraints.map(id => CONSTRAINTS.find(c => c.id === id).text);
  paras.push(L(`J'appelle enfin l'attention des délégations sur deux éléments de contexte. ${cons.join(" ")}`, `Finally, I draw the attention of delegations to two points of context. ${cons.join(" ")}`));
  paras.push(L(`Je rappelle que les faits et les données présentés pour ce scénario sont fictifs. Les délégations vont maintenant recevoir les instructions de leur capitale.`, `I recall that the facts and figures presented in this scenario are fictional. Delegations will now receive instructions from their capitals.`));
  return paras;
}
function chairLine(S, key, x) {
  const b = bodyOf(S);
  switch (key) {
    case "debate": return L(`Nous passons au débat général. ${x} délégations sont inscrites sur la liste des orateurs. Je donne la parole à la délégation ${deName(S.order[0])}.`, `We now turn to the general debate. ${x} delegations are inscribed on the list of speakers. I give the floor to the delegation ${deName(S.order[0])}.`);
    case "next": return L(`Je remercie la délégation ${deName(x.prev)} et donne la parole à la délégation ${deName(x.next)}.`, `I thank the delegation ${deName(x.prev)} and give the floor to the delegation ${deName(x.next)}.`);
    case "you": return L(`Je remercie la délégation ${deName(x.prev)}. La parole est à la délégation ${deName(S.player)}.`, `I thank the delegation ${deName(x.prev)}. I now give the floor to the delegation ${deName(S.player)}.`);
    case "endDebate": return L(`Le débat général est clos. La séance est suspendue pour permettre la tenue de consultations informelles.`, `The general debate is closed. The meeting is suspended to allow informal consultations to take place.`);
    case "draft": return L(`La séance est reprise. Le projet de ${b.act} présenté par la délégation ${deName(S.player)} a été distribué. Nous allons l'examiner paragraphe par paragraphe et statuer sur les amendements proposés.`, `The meeting is resumed. The draft ${b.act} submitted by the delegation ${deName(S.player)} has been circulated. We will consider it paragraph by paragraph and take action on the proposed amendments.`);
    case "vote": return L(`Nous allons maintenant nous prononcer sur le projet de ${b.act}. Je rappelle la règle applicable : ${needRule(S).label}.`, `We will now take action on the draft ${b.act}. I recall the applicable rule: ${needRule(S).label}.`);
    case "reply": return L(`La délégation ${deName(x)} a demandé à exercer son droit de réponse. Elle a la parole.`, `The delegation ${deName(x)} has asked to exercise its right of reply. It has the floor.`);
  }
  return "";
}
function voteAnnounce(S) {
  const t = S.vote.t, b = bodyOf(S);
  const counts = L(`Le résultat du vote est le suivant : ${t.yes} voix pour, ${t.no} voix contre et ${t.abs} abstention${t.abs > 1 ? "s" : ""}.`, `The result of the vote is as follows: ${t.yes} in favour, ${t.no} against and ${t.abs} abstention${t.abs !== 1 ? "s" : ""}.`);
  if (t.adopted) return L(`${counts} Le projet de ${b.act} est adopté.`, `${counts} The draft ${b.act} is adopted.`);
  if (t.veto.length) return L(`${counts} Le projet de ${b.act} n'est pas adopté en raison du vote négatif d'un membre permanent du Conseil.`, `${counts} The draft ${b.act} is not adopted, owing to the negative vote of a permanent member of the Council.`);
  return L(`${counts} Le projet de ${b.act} n'est pas adopté, la majorité requise n'ayant pas été atteinte.`, `${counts} The draft ${b.act} is not adopted, the required majority not having been obtained.`);
}
function voteExplanation(S, code, v, why) {
  const adopted = S.vote.t.adopted, a = why && why.axis ? axisName(why.axis) : null;
  if (v === "no" && why && why.why === "red") return L(`Ma délégation a voté contre ce texte, qui franchit une limite fondamentale pour nous en matière ${de(a)}.`, `My delegation voted against this text, which crosses a fundamental line for us on ${a}.`);
  if (v === "no") return L(`Ma délégation a voté contre : le texte ne répond pas à ses préoccupations essentielles.`, `My delegation voted against: the text does not address its essential concerns.`);
  if (v === "abs" && why && why.why === "soft") return L(`Ma délégation s'est abstenue : le texte reste en deçà de nos attentes en matière ${de(axisName(S.dels[code].red.find(r => r.dir === "min").axis))}.`, `My delegation abstained: the text falls short of our expectations on ${axisName(S.dels[code].red.find(r => r.dir === "min").axis)}.`);
  if (v === "abs") return L(`Ma délégation s'est abstenue : certains éléments du texte ne nous paraissent pas suffisamment équilibrés.`, `My delegation abstained: some elements of the text do not seem sufficiently balanced to us.`);
  if (why && why.why === "deal") return L(`Ma délégation a voté pour ce texte, conformément à l'accord conclu pendant les consultations.`, `My delegation voted in favour of this text, in line with the agreement reached during the consultations.`);
  if (why && why.why === "cosponsor") return adopted ? L(`Coauteur du texte, ma délégation se félicite de son adoption.`, `As a co-sponsor of the text, my delegation welcomes its adoption.`) : L(`Coauteur du texte, ma délégation regrette qu'il n'ait pas été adopté.`, `As a co-sponsor of the text, my delegation regrets that it was not adopted.`);
  return adopted ? L(`Ma délégation a voté pour ce texte, qui constitue un pas dans la bonne direction.`, `My delegation voted in favour of this text, which is a step in the right direction.`) : L(`Ma délégation a voté pour ce texte et regrette qu'il n'ait pas recueilli la majorité requise.`, `My delegation voted in favour of this text and regrets that it did not obtain the required majority.`);
}

/* ---------- Briefing confidentiel ---------- */
const INTERESTS = {
  sov: "préserver la souveraineté nationale et le principe de non-ingérence",
  mul: "renforcer le système multilatéral et le respect du droit international",
  hr: "promouvoir les droits humains",
  dev: "obtenir des moyens pour le développement et le renforcement des capacités",
  don: "maîtriser le montant de vos contributions financières",
  mkt: "préserver la compétitivité de vos entreprises",
  sec: "garantir la sécurité et la stabilité",
  reg: "valoriser le rôle des organisations régionales",
  env: "réduire votre vulnérabilité aux effets du changement climatique",
  cul: "protéger le patrimoine culturel",
  tec: "préserver vos capacités technologiques",
  rgl: "encadrer les technologies émergentes",
  opn: "favoriser le partage des connaissances",
  tou: "préserver les recettes du tourisme",
  sea: "protéger vos intérêts maritimes"
};
const EN_INTERESTS = {
  sov: "preserve national sovereignty and the principle of non-interference",
  mul: "strengthen the multilateral system and respect for international law",
  hr: "promote human rights",
  dev: "obtain resources for development and capacity-building",
  don: "keep your financial contributions under control",
  mkt: "preserve the competitiveness of your companies",
  sec: "guarantee security and stability",
  reg: "enhance the role of regional organizations",
  env: "reduce your vulnerability to the effects of climate change",
  cul: "protect cultural heritage",
  tec: "preserve your technological capabilities",
  rgl: "regulate emerging technologies",
  opn: "promote the sharing of knowledge",
  tou: "preserve tourism revenue",
  sea: "protect your maritime interests"
};
LANG_HOOKS.push(() => swapFields(INTERESTS, EN_INTERESTS, keysOf(EN_INTERESTS)));

function briefing(S) {
  const me = S.dels[S.player], c = COUNTRIES[S.player], issue = issueOf(S), V = speechVars(S);
  const imp = w => w >= 0.8 ? L("priorité majeure", "top priority") : w >= 0.55 ? L("point important", "important point") : L("point secondaire", "secondary point");
  const axes = issue.axes.slice().sort((a, b) => me.w[b] - me.w[a]).map(a => {
    const p = me.pos[a];
    const how = Math.abs(p) >= 0.55 ? "fermement" : Math.abs(p) >= 0.25 ? "plutôt" : null;
    const text = how ? L(`Votre capitale privilégie ${how} ${poleNP(S, a, p)}.`, `Your capital ${how === "fermement" ? "firmly favours" : "leans towards"} ${poleNP(S, a, p)}.`) : me.w[a] >= 0.55 ? L(`Votre capitale recherche un point d'équilibre entre ${poleNP(S, a, -1)} et ${poleNP(S, a, 1)}.`, `Your capital is looking for a balance between ${poleNP(S, a, -1)} and ${poleNP(S, a, 1)}.`) : L(`Pas de position arrêtée : vous disposez d'une marge de manœuvre.`, `No fixed position: you have some room for manoeuvre.`);
    return { axis: a, name: AXES[a].name, p, w: me.w[a], importance: imp(me.w[a]), text };
  });
  const keys = [...new Set([...issue.tags, "sov", "mul", "dev", "don"])].filter(k => INTERESTS[k]);
  const interests = keys.sort((a, b) => c.t[b] - c.t[a]).slice(0, 3).map(k => INTERESTS[k]);
  const sim = code => { const d = S.dels[code]; let s = 0, n = 0; for (const a of issue.axes) { s += me.w[a] * Math.abs(d.pos[a] - me.pos[a]); n += me.w[a]; } return 1 - s / n / 2; };
  const others = S.scen.members.filter(m => m !== S.player).sort((a, b) => sim(b) - sim(a));
  const red = me.red.map(rl => ({ axis: rl.axis, text: rl.dir === "max" ? L(`Ne pas accepter un texte qui irait trop loin vers ${poleNP(S, rl.axis, 1)}. Si c'est le cas, votre capitale vous demande de voter contre.`, `Do not accept a text that goes too far towards ${poleNP(S, rl.axis, 1)}. If it does, your capital asks you to vote against.`) : L(`Ne pas soutenir un texte qui renoncerait à ${poleNP(S, rl.axis, 1)}. Dans ce cas, abstenez-vous.`, `Do not support a text that gives up on ${poleNP(S, rl.axis, 1)}. In that case, abstain.`) }));
  return {
    title: L(`Note confidentielle à l'attention de la délégation ${deName(S.player)}`, `Confidential note for the delegation ${deName(S.player)}`),
    lead: fill(L(`Votre délégation participe à l'examen de la question « ${issue.title} ». Votre gouvernement souhaite que la séance aboutisse à {objectif}, sans que vous perdiez de vue les intérêts nationaux exposés ci-dessous.`, `Your delegation is taking part in the consideration of the item “${issue.title}”. Your government wants the meeting to result in {objectif}, without losing sight of the national interests set out below.`), Object.assign({}, V, { objectif: fill(issue.objectif, V) })),
    interests, axes, red, domestic: me.domestic ? me.domestic.text : null,
    allies: others.slice(0, 3), rivals: others.slice(-3).reverse(),
    influential: others.filter(m => COUNTRIES[m].infl >= 4).slice(0, 4),
    objectives: objectives(S),
    orientations: recommendedOrientations(S).map((o, i) => Object.assign({}, ORIENTATIONS[o.k], { k: o.k, fit: o.fit, recommended: i === 0 }))
  };
}

/* ---------- Interventions proposées au joueur ---------- */
function playerOptions(S) {
  const me = S.dels[S.player], V = speechVars(S), line = S.line, issue = issueOf(S);
  const save = JSON.stringify(S.phr || {});
  const axes = topAxes(line, me.w, 2).length ? topAxes(line, me.w, 2) : issue.axes.slice(0, 1);
  const open = fill(OPENINGS[1], V);
  const out = [];
  // 1. Ligne de la capitale
  {
    const ps = [open + " " + fill(OPENINGS_2.any[0], V), axes.map(a => axisSentence(S, a, line[a], V)).join(" ")];
    const last = [];
    if (me.red.length) last.push(redSentence(S, me.red[0], false));
    last.push(L("Ma délégation défendra cette position tout au long des consultations. Je vous remercie.", "My delegation will defend this position throughout the consultations. Thank you."));
    ps.push(last.join(" "));
    out.push({ id: "ferme", name: L("Défendre la ligne de votre capitale", "Defend your capital's line"), hint: L("Clair et cohérent. Rassure les délégations proches, peut braquer les plus éloignées.", "Clear and consistent. Reassures like-minded delegations, but may put off those furthest from you."), stance: line, quality: 0.76, paras: ps });
  }
  // 2. Main tendue
  {
    const soft = {}; for (const a of issue.axes) soft[a] = r2(line[a] * 0.55);
    const ax = consensusAxis(S);
    const ps = [open + " " + fill(OPENINGS_2.open[0], V), axes.map(a => axisSentence(S, a, soft[a] || line[a] * 0.5, V)).join(" ")];
    ps.push((ax ? L(`Des convergences existent, notamment en faveur ${deForm(poleNP(S, ax.axis, ax.avg))}. `, `There are points of convergence, notably in favour of ${poleNP(S, ax.axis, ax.avg)}. `) : "") + L("Ma délégation est prête à examiner toutes les propositions et à travailler avec chacun pour parvenir à un texte largement soutenu. Je vous remercie.", "My delegation is ready to consider all proposals and to work with everyone to reach a broadly supported text. Thank you."));
    out.push({ id: "ouverture", name: L("Tendre la main", "Reach out"), hint: L("Améliore vos relations avec la plupart des délégations, mais affirme moins vos priorités.", "Improves your relations with most delegations, but asserts your priorities less."), stance: soft, quality: 0.7, open: true, paras: ps });
  }
  // 3. Proposition concrète
  {
    const pet = me.pet ? tplById(S, me.pet) : null;
    const f = S.scen.facts[0];
    const ps = [open + L(` Les données communiquées par le Secrétariat appellent une réponse concrète (${f.label.charAt(0).toLowerCase() + f.label.slice(1)} : ${fmtFact(f)}).`, ` The figures provided by the Secretariat call for a concrete response (${f.label.charAt(0).toLowerCase() + f.label.slice(1)}: ${fmtFact(f)}).`)];
    ps.push(axisSentence(S, axes[0], line[axes[0]], V));
    ps.push((pet ? L(`Ma délégation proposera d'inscrire dans le texte le paragraphe suivant : « ${capFirst(clauseText(S, instClausePreview(S, pet)))}. » `, `My delegation will propose that the following paragraph be included in the text: “${capFirst(clauseText(S, instClausePreview(S, pet)))}.” `) : "") + L("Nous souhaitons un texte précis, assorti d'un calendrier et d'un rapport de suivi. Je vous remercie.", "We want a precise text, with a timetable and a follow-up report. Thank you."));
    out.push({ id: "proposition", name: L("Présenter une proposition concrète", "Put forward a concrete proposal"), hint: L("Apprécié des délégations attachées à la précision. Fait connaître votre proposition.", "Valued by delegations that care about precision. Makes your proposal known."), stance: line, quality: 0.84, paras: ps, tech: true });
  }
  // 4. Répondre à un orateur
  const prev = [...new Set(S.speeches.filter(s => s.code && s.code !== S.player).map(s => s.code))];
  let target = null, ts = 0;
  for (const p of prev) { const d = S.dels[p]; for (const a of axes) { const s = Math.abs(d.pos[a] - line[a]) * me.w[a]; if (Math.sign(d.pos[a]) !== Math.sign(line[a]) && s > ts) { ts = s; target = { code: p, axis: a }; } } }
  if (target && ts > 0.5) {
    const d = S.dels[target.code];
    const ps = [open, L(`Ma délégation ne peut souscrire aux propos de la délégation ${deName(target.code)}. Là où elle défend ${poleNP(S, target.axis, d.pos[target.axis])}, nous estimons ${que(poleNP(S, target.axis, line[target.axis]))} répond mieux à l'enjeu.`, `My delegation cannot subscribe to the remarks of the delegation ${deName(target.code)}. Where it defends ${poleNP(S, target.axis, d.pos[target.axis])}, we believe that ${poleNP(S, target.axis, line[target.axis])} is a better response to the challenge.`)];
    ps.push(axes.filter(a => a !== target.axis).map(a => axisSentence(S, a, line[a], V)).join(" ") + L(" Je vous remercie.", " Thank you."));
    out.push({ id: "reponse", name: L(`Répondre à la délégation ${deName(target.code)}`, `Respond to the delegation ${deName(target.code)}`), hint: L("Marque votre différence et rapproche les délégations qui partagent vos vues. La délégation visée le prendra mal.", "Sets you apart and brings like-minded delegations closer. The delegation targeted will take it badly."), stance: line, quality: 0.66, paras: ps.filter(Boolean), target: target.code });
  }
  S.phr = JSON.parse(save); // les options non choisies ne consomment pas de variantes
  return out;
}

/* ---------- Analyse d'un texte libre (mode démonstration) ---------- */
const LEX = {
  obl: { pos: ["contraign", "obligatoire", "obligation", "juridiquement", "engagements précis", "engagements fermes", "impérati", "doivent ", "devront"], neg: ["volontaire", "souple", "souplesse", "flexib", "au cas par cas", "marge d'appréciation", "non contraign"] },
  sup: { pos: ["suivi", "mécanisme", "contrôle", "évaluation", "indépendant", "transparence", "rendre compte", "redevabilité", "rapport"], neg: ["ingérence", "affaires intérieures", "appropriation nationale", "rapports nationaux", "évaluation nationale"] },
  fin: { pos: ["financement", "fonds", "moyens", "solidarité", "assistance", "aide financière", "ressources supplémentaires"], neg: ["coût", "dépense", "contraintes budgétaires", "ressources existantes", "économies", "budget limité"] },
  reg: { pos: ["régional", "régionale", "organisations régionales", "sous-régional", "au plus près du terrain", "proximité"], neg: ["universel", "mondial", "centralis", "coordination globale"] },
  prv: { pos: ["secteur privé", "entreprises", "partenariat", "investisseurs", "fondations", "acteurs économiques"], neg: ["service public", "pouvoirs publics", "intérêt général", "intérêts privés"] },
  rgl: { pos: ["réglement", "régulation", "encadrement", "encadrer", "protection des données", "garanties", "évaluation des risques"], neg: ["innovation", "autorégulation", "codes de conduite", "normes techniques", "freiner"] },
  opn: { pos: ["accès ouvert", "libre accès", "partage", "librement accessible", "gratuit", "science ouverte", "ouvert"], neg: ["propriété intellectuelle", "droits d'auteur", "accès encadré", "confidentialité", "sécurité des données"] },
  res: { pos: ["restreindre", "limiter", "quota", "interdi", "plafonn", "restriction", "moratoire"], neg: ["incitati", "accompagner", "label", "économies locales", "emplois", "pénaliser"] },
  dro: { pos: ["droits", "droit à", "dignité", "liberté", "égalité", "non-discrimination", "victimes"], neg: ["technique", "pragmatique", "opérationnel", "politis", "autres enceintes"] }
};

/* Lexique anglais (parties en anglais) */
const EN_LEX = {
  obl: { pos: ["binding", "mandatory", "obligation", "legally", "precise commitments", "firm commitments", "imperative", "must ", "shall "], neg: ["voluntary", "flexib", "case by case", "case-by-case", "discretion", "non-binding"] },
  sup: { pos: ["monitoring", "follow-up", "mechanism", "oversight", "evaluation", "assessment", "independent", "transparen", "accountab", "report"], neg: ["interference", "internal affairs", "national ownership", "national reports", "national assessment"] },
  fin: { pos: ["funding", "financing", "fund ", "resources", "solidarity", "assistance", "financial aid", "additional resources"], neg: ["cost", "expenditure", "spending", "budgetary constraints", "existing resources", "savings", "limited budget"] },
  reg: { pos: ["regional", "subregional", "regional organizations", "on the ground", "proximity"], neg: ["universal", "global", "centraliz", "centralis", "worldwide"] },
  prv: { pos: ["private sector", "companies", "business", "partnership", "investors", "foundations", "economic actors"], neg: ["public service", "public authorities", "general interest", "public interest", "private interests"] },
  rgl: { pos: ["regulat", "legal framework", "data protection", "safeguards", "risk assessment", "oversight"], neg: ["innovation", "self-regulation", "codes of conduct", "technical standards", "hold back", "stifle"] },
  opn: { pos: ["open access", "free access", "sharing", "freely accessible", "free of charge", "open science", "open "], neg: ["intellectual property", "copyright", "controlled access", "confidentiality", "data security"] },
  res: { pos: ["restrict", "limit", "quota", "prohibit", "ban ", "cap ", "restriction", "moratorium"], neg: ["incentive", "support the actors", "label", "local economies", "jobs", "penaliz", "penalis"] },
  dro: { pos: ["rights", "right to", "dignity", "freedom", "equality", "non-discrimination", "victims"], neg: ["technical", "pragmatic", "operational", "politiciz", "politicis", "other forums", "other fora"] }
};
LANG_HOOKS.push(() => { for (const a in LEX) swapFields(LEX[a], EN_LEX[a], ["pos", "neg"]); });
const NEGATORS_EN = /(\bnot\b|\bno\b|\bnor\b|\bneither\b|\bwithout\b|\breject\w*|\brefus\w*|\bagainst\b|\bnever\b|\boppos\w*|\bcannot\b|n't\b|\bnon\b)/;
const NEGATORS = /(\bpas\b|\bni\b|\baucun\w*|\bsans\b|\brefus\w*|\brejet\w*|\bcontre\b|\bnon\b|\bjamais\b|\bopposons\b|\bopposé\w*)/;
function lexScan(text, axes) {
  const t = " " + text.toLowerCase().replace(/[’]/g, "'") + " ", out = {}, hits = {};
  for (const a of axes) {
    let pos = 0, neg = 0;
    for (const [pole, list] of [["pos", LEX[a].pos], ["neg", LEX[a].neg]]) for (const w of list) {
      let i = t.indexOf(w);
      while (i >= 0) {
        const before = t.slice(Math.max(0, i - 28), i);
        const flip = (LANG === "en" ? NEGATORS_EN : NEGATORS).test(before.split(/[.,;:!?]/).pop());
        if ((pole === "pos") !== flip) pos++; else neg++;
        i = t.indexOf(w, i + w.length);
      }
    }
    hits[a] = pos + neg;
    if (pos + neg) out[a] = r2(clamp((pos - neg) / (pos + neg + 0.6) * 1.15, -1, 1));
  }
  return { stance: out, hits };
}
function analyzeSpeech(S, text) {
  const issue = issueOf(S), raw = String(text || "").trim(), low = raw.toLowerCase();
  const words = raw.split(/\s+/).filter(Boolean).length;
  const { stance, hits } = lexScan(raw, issue.axes);
  let q = words < 15 ? 0.25 : words < 40 ? 0.42 : words < 80 ? 0.52 : words <= 220 ? 0.62 : 0.55;
  const notes = [];
  if (/président|présidente|president|chair/.test(low)) q += 0.04;
  const conn = (low.match(/\b(d'abord|premièrement|deuxièmement|ensuite|enfin|c'est pourquoi|en conséquence|par ailleurs|en outre|ainsi|firstly|first of all|secondly|finally|therefore|consequently|moreover|furthermore|in addition|that is why|thus)\b/g) || []).length;
  q += Math.min(0.12, conn * 0.04);
  if (conn >= 2) notes.push(L("intervention structurée", "well-structured statement"));
  if (/propos|suggér|recommand|nous demandons|nous souhaitons|suggest|recommend|we call for|we ask|we would like|we want/.test(low)) { q += 0.08; notes.push(L("propositions concrètes", "concrete proposals")); }
  if (/\d/.test(raw)) { q += 0.05; notes.push(L("appui sur des données", "use of data")); }
  const topicWords = (issue.v.court + " " + issue.v.objet).toLowerCase().split(/[\s,'’]+/).filter(w => w.length >= 6);
  const onTopic = topicWords.some(w => low.includes(w.slice(0, 7)));
  if (onTopic) q += 0.06;
  const coop = (low.match(/\b(ensemble|compromis|dialogue|partenaires|consensus|coopération|convergence|together|compromise|partners|cooperation|common ground)\b/g) || []).length;
  if (coop) q += Math.min(0.08, coop * 0.03);
  const open = coop >= 2;
  if (open) notes.push(L("ton constructif", "constructive tone"));
  const caps = raw.split(/\s+/).filter(w => w.length > 3 && w === w.toUpperCase() && /[A-ZÉ]/.test(w)).length;
  const rude = /(honte|scandal|ridicule|inadmissible|mensong|hypocris|absurde|stupide|idiot|nul\b|shame|ridiculous|outrageous|lies\b|liar|hypocri|absurd|stupid|nonsense|!!)/.test(low) || caps >= 3;
  if (rude) { q -= 0.25; notes.push(L("ton jugé agressif, peu conforme aux usages diplomatiques", "tone deemed aggressive, not in keeping with diplomatic practice")); }
  const signal = Object.keys(stance).length;
  if (!signal && !onTopic) { q -= 0.15; notes.push(L("position difficile à identifier", "position hard to identify")); }
  else if (!signal) notes.push(L("position peu explicite", "position not very explicit"));
  if (words < 15) notes.push(L("intervention très brève", "very short statement"));
  return { stance, quality: r2(clamp(q, 0.15, 0.95)), notes, open, rude, hits, words };
}
/* Paragraphe libre : nature probable et effets sur les axes */
function analyzeClause(S, verb, text) {
  const t = String(text || "").toLowerCase(), issue = issueOf(S);
  let k = "rec";
  if (/contributions? (obligatoires?|statutaires?)|budget ordinaire|assessed contributions?|regular budget/.test(t)) k = "assessed";
  else if (/rapport|rendre compte|report/.test(t)) k = "report";
  else if (/fonds|contributions? volontaires?|fund|voluntary contributions?/.test(t)) k = "volfund";
  else if (/convention/.test(t)) k = "convention";
  else if (/groupe de travail|comité|observatoire|mécanisme|organe|working group|committee|observatory|mechanism|body/.test(t) && /^(décide|crée|établit)/i.test(verb)) k = "body";
  else if (/coopération|échange d'informations|renforcement des capacités|partage d'expérience|cooperation|exchange of information|capacity.building|sharing of experience/.test(t)) k = "coop";
  const { stance } = lexScan(text, issue.axes);
  const fx = {};
  for (const a in stance) fx[a] = r2(stance[a] * 0.45);
  if (k === "report") fx.sup = r2((fx.sup || 0) + 0.12);
  if (k === "volfund") fx.fin = r2((fx.fin || 0) + 0.3);
  if (k === "assessed") { fx.fin = r2((fx.fin || 0) + 0.6); fx.obl = r2((fx.obl || 0) + 0.15); }
  if (k === "convention") { fx.obl = r2((fx.obl || 0) + 0.6); }
  return { k, fx };
}

/* ---------- Réactions pendant le débat ---------- */
function clarifyReply(S, code) {
  const d = S.dels[code], axes = topAxes(d.pos, d.w, 2);
  const parts = [L(`${S.chairName}, je remercie la délégation ${deName(S.player)} pour sa question.`, `${S.chairName}, I thank the delegation ${deName(S.player)} for its question.`)];
  if (axes.length) parts.push(L(`Ma délégation privilégie ${poleNP(S, axes[0], d.pos[axes[0]])}${axes[1] ? ", ainsi " + que(poleNP(S, axes[1], d.pos[axes[1]])) : ""}.`, `My delegation favours ${poleNP(S, axes[0], d.pos[axes[0]])}${axes[1] ? ", as well as " + poleNP(S, axes[1], d.pos[axes[1]]) : ""}.`));
  else parts.push(L("Ma délégation n'a pas de position arrêtée et reste ouverte aux différentes options.", "My delegation has no fixed position and remains open to the various options."));
  if (d.red.length) parts.push(d.red[0].dir === "max" ? L(`Je le précise : ${REDLINE[d.red[0].axis].max[1]}, au point de nous conduire à voter contre.`, `Let me be clear: ${REDLINE[d.red[0].axis].max[1]}, to the point of leading us to vote against.`) : L(`Je le précise : ${REDLINE[d.red[0].axis].min[1]}.`, `Let me be clear: ${REDLINE[d.red[0].axis].min[1]}.`));
  else parts.push(L("Nous serons attentifs à l'équilibre d'ensemble du texte.", "We will pay attention to the overall balance of the text."));
  return parts.join(" ");
}
function rightOfReply(S, code) {
  const d = S.dels[code], a = topAxes(d.pos, d.w, 1)[0] || issueOf(S).axes[0];
  const hard = d.pers === "intransigeante";
  return (hard ? L("Ma délégation rejette la présentation qui vient d'être faite de sa position. ", "My delegation rejects the way its position has just been presented. ") : L("Ma délégation regrette la présentation qui a été faite de sa position. ", "My delegation regrets the way its position has been presented. ")) +
    L(`Nous défendons ${poleNP(S, a, d.pos[a])} parce que c'est, selon nous, la condition d'une mise en œuvre effective.`, `We defend ${poleNP(S, a, d.pos[a])} because, in our view, it is the condition for effective implementation.`) + (hard ? L(" Nous ne changerons pas de ligne.", " We will not change our line.") : L(" Nous restons ouverts au dialogue.", " We remain open to dialogue."));
}
function supportText(S, code) {
  const d = S.dels[code], a = topAxes(d.pos, d.w, 1)[0];
  return L(`Ma délégation souhaite appuyer l'intervention de la délégation ${deName(code)}`, `My delegation wishes to support the statement made by the delegation ${deName(code)}`) + (a ? L(`, en particulier lorsqu'elle plaide pour ${poleNP(S, a, d.pos[a])}.`, `, in particular where it argues for ${poleNP(S, a, d.pos[a])}.`) : ".");
}

/* ---------- Réponses en négociation bilatérale ---------- */
function probeReply(S, code) {
  const d = S.dels[code], axes = topAxes(d.pos, d.w, 2), vi = voteIntent(S, code);
  const parts = [];
  parts.push(axes.length ? L(`Nous privilégions ${poleNP(S, axes[0], d.pos[axes[0]])}${axes[1] ? ", ainsi " + que(poleNP(S, axes[1], d.pos[axes[1]])) : ""}.`, `We favour ${poleNP(S, axes[0], d.pos[axes[0]])}${axes[1] ? ", as well as " + poleNP(S, axes[1], d.pos[axes[1]]) : ""}.`) : L("Nous n'avons pas de position arrêtée sur ce sujet.", "We have no fixed position on this subject."));
  if (d.red.length) parts.push(d.red.map(rl => rl.dir === "max" ? L(`En revanche, ${REDLINE[rl.axis].max[1]} : ce serait pour nous un motif de vote contre.`, `However, ${REDLINE[rl.axis].max[1]}: that would be grounds for us to vote against.`) : L(`Par ailleurs, ${REDLINE[rl.axis].min[1]}.`, `In addition, ${REDLINE[rl.axis].min[1]}.`)).join(" "));
  else parts.push(L("Nous n'avons pas de ligne rouge sur ce texte, mais nous resterons attentifs à son équilibre.", "We have no red line on this text, but we will keep an eye on its balance."));
  if (d.pet) { const t = tplById(S, d.pet); if (t && !hasSrc(S, d.pet)) parts.push(L(`Nous aimerions voir figurer dans le texte le paragraphe suivant : « ${capFirst(clauseText(S, instClausePreview(S, t)))}. »`, `We would like to see the following paragraph in the text: “${capFirst(clauseText(S, instClausePreview(S, t)))}.”`)); }
  if (S.draft.ops.length) parts.push(vi.v === "yes" ? L("En l'état, nous voterions pour le texte.", "As it stands, we would vote for the text.") : vi.v === "no" ? L("En l'état, nous voterions contre le texte.", "As it stands, we would vote against the text.") : L("En l'état, nous nous abstiendrions.", "As it stands, we would abstain."));
  return parts.join(" ");
}
function persuadeReply(S, code, r) {
  const d = S.dels[code];
  if (r.ok && r.effect === "reassure") return L("Vos garanties nous rassurent : ce point nous préoccupe désormais moins.", "Your guarantees reassure us: this point now concerns us less.");
  if (r.ok) return pickPhr(S, "pers_ok", [L("Votre argument mérite réflexion. Nous pourrions faire évoluer notre position sur ce point.", "Your argument deserves consideration. We could adjust our position on this point."), L("Nous sommes sensibles à cet argument et en tiendrons compte.", "We are receptive to this argument and will take it into account."), L("C'est un point que notre capitale entendra. Nous allons revoir notre position.", "That is a point our capital will listen to. We will review our position.")]);
  if (d.red.some(x => x.axis === r.axis)) return L("Sur ce point, notre position est arrêtée : elle ne changera pas.", "On this point, our position is settled: it will not change.");
  return pickPhr(S, "pers_ko", [L("Nous comprenons votre point de vue, mais il ne répond pas à nos préoccupations.", "We understand your point of view, but it does not address our concerns."), L("Cet argument ne nous convainc pas.", "This argument does not convince us."), L("Nous ne voyons pas les choses de cette manière.", "We do not see things that way.")]);
}
function dealReply(S, code, askKey, r) {
  if (r.ok) return ({ vote: L("Marché conclu : nous voterons pour le texte si cet engagement est tenu.", "It's a deal: we will vote for the text if this commitment is kept."), cosponsor: L("Marché conclu : nous nous porterons coauteur du texte si cet engagement est tenu.", "It's a deal: we will co-sponsor the text if this commitment is kept."), group: L("Marché conclu : nous plaiderons en faveur du texte au sein de notre groupe.", "It's a deal: we will argue for the text within our group.") })[askKey];
  if (r.reason === "red") return L("Ce que vous proposez conduirait le texte au-delà d'une limite que notre capitale ne nous permet pas de franchir.", "What you propose would take the text beyond a line that our capital does not allow us to cross.");
  if (r.reason === "nogroup") return L("Notre délégation ne fait partie d'aucun groupe représenté ici dont elle pourrait rallier les membres.", "Our delegation does not belong to any group represented here whose members it could rally.");
  if (r.reason === "counter") return r.counter ? L(`Votre offre ne suffit pas. Nous pourrions en revanche accepter si vous acceptiez ${de(r.counter.label.charAt(0).toLowerCase() + r.counter.label.slice(1))}.`, `Your offer is not enough. We could, however, agree if you agreed to ${r.counter.label.charAt(0).toLowerCase() + r.counter.label.slice(1)}.`) : L("Votre offre ne suffit pas, mais nous restons ouverts à la discussion.", "Your offer is not enough, but we remain open to discussion.");
  return L("Nous ne pouvons pas accepter cet arrangement.", "We cannot accept this arrangement.");
}
function cosponsorReply(S, code, r) {
  return r.ok ? L("Nous acceptons de nous porter coauteur du texte.", "We agree to co-sponsor the text.") : L("Il est trop tôt pour que nous nous portions coauteur : le texte doit encore évoluer.", "It is too early for us to co-sponsor: the text still needs to evolve.");
}

/* =====================================================================
   DÉROULEMENT D'UNE PARTIE : les sept phases
   1 Ouverture · 2 Briefing · 3 Débat général · 4 Négociations
   5 Rédaction · 6 Vote · 7 Débriefing
   ===================================================================== */
const PHASES = ["Ouverture", "Briefing", "Débat général", "Négociations", "Rédaction", "Vote", "Bilan"];
const MAX_REACTIONS = 3;
const EN_PHASES = ["Opening", "Briefing", "General debate", "Negotiations", "Drafting", "Vote", "Debrief"];
LANG_HOOKS.push(() => swapFields(PHASES, EN_PHASES, PHASES.map((x, i) => i)));


/* Insère des interventions juste après celle de la délégation visée (et après les réactions déjà faites) */
function insertAfter(S, code, entries) {
  let i = -1;
  for (let k = S.speeches.length - 1; k >= 0; k--) if (S.speeches[k].code === code && S.speeches[k].kind === "debate") { i = k; break; }
  if (i < 0) { S.speeches.push(...entries); return; }
  let j = i + 1;
  while (j < S.speeches.length && !S.speeches[j].chair && S.speeches[j].kind !== "debate") j++;
  S.speeches.splice(j, 0, ...entries);
}
function talk(S, code, who, text) { S.talks = S.talks || {}; (S.talks[code] = S.talks[code] || []).push({ t: clockStr(S), who, text }); }

/* Phase 1 → 2 */
function startBriefing(S) { if (S.phase !== 1) return; S.phase = 2; advance(S, 10); logE(S, "procedure", L("Les délégations reçoivent les instructions de leur capitale.", "Delegations receive instructions from their capitals.")); }

/* Phase 2 → 3 */
function chooseOrientation(S, key) {
  if (S.phase !== 2 || !ORIENTATIONS[key]) return;
  setOrientation(S, key);
  S.phase = 3;
  startDebate(S);
}
function startDebate(S) {
  const others = shuffle(S, S.scen.members.filter(m => m !== S.player));
  const slot = Math.min(others.length, ri(S, 2, Math.min(5, Math.max(2, others.length - 1))));
  others.splice(slot, 0, S.player);
  S.order = others; S.debateIdx = 0; S.reactions = 0;
  S.speeches = [{ chair: true, kind: "chair", paras: [chairLine(S, "debate", S.order.length)], t: clockStr(S) }];
  advance(S, 5);
  logE(S, "debate", L("Ouverture du débat général.", "Opening of the general debate."));
}
const currentSpeaker = S => S.order[S.debateIdx] || null;
const isMyTurn = S => S.phase === 3 && currentSpeaker(S) === S.player;
const debateOver = S => S.debateIdx >= S.order.length;
function debateNext(S) {
  if (S.phase !== 3 || debateOver(S) || isMyTurn(S)) return null;
  const code = currentSpeaker(S), sp = aiSpeech(S, code);
  S.speeches.push(sp);
  S.debateIdx++;
  advance(S, 4);
  logE(S, "debate", L(`Intervention de la délégation ${deName(code)}${sp.ref && sp.ref.code === S.player ? (sp.ref.type === "dis" ? ", qui conteste votre position" : ", qui rejoint votre position") : ""}.`, `Statement by the delegation ${deName(code)}${sp.ref && sp.ref.code === S.player ? (sp.ref.type === "dis" ? ", which challenges your position" : ", which shares your position") : ""}.`), code);
  const nx = currentSpeaker(S);
  if (nx) S.speeches.push({ chair: true, kind: "chair", paras: [chairLine(S, nx === S.player ? "you" : "next", { prev: code, next: nx })], t: clockStr(S) });
  return sp;
}
function debateToMe(S) { let n = 0; while (S.phase === 3 && !debateOver(S) && !isMyTurn(S) && n++ < 40) debateNext(S); }
function playerSpeak(S, choice) {
  if (!isMyTurn(S)) return null;
  let paras, stance, quality, extra = {};
  if (choice.free) {
    const a = choice.analysis || analyzeSpeech(S, choice.free);
    paras = String(choice.free).trim().split(/\n{2,}/).map(x => x.replace(/\s+/g, " ").trim()).filter(Boolean);
    stance = a.stance; quality = a.quality; extra = { open: a.open, notes: a.notes };
    if (a.rude) S.stats.rude = (S.stats.rude || 0) + 1;
  } else {
    const o = playerOptions(S).find(x => x.id === choice.optionId) || playerOptions(S)[0];
    paras = o.paras; stance = o.stance; quality = o.quality; extra = { open: o.open, target: o.target, option: o.id };
    if (o.tech) S.techSpeech = true;
  }
  const merged = Object.assign({}, S.line); for (const a in stance) merged[a] = stance[a];
  S.playerStance = merged;
  applyPlayerSpeech(S, stance, quality, extra);
  S.playerSpoke = true;
  S.speeches.push({ code: S.player, mine: true, kind: "debate", paras, quality, notes: extra.notes || null, t: clockStr(S) });
  if (extra.target) S.speeches.push({ code: extra.target, kind: "reply", paras: [rightOfReply(S, extra.target)], t: clockStr(S) });
  S.debateIdx++;
  advance(S, 4);
  logE(S, "debate", L(`Votre délégation prononce son intervention${extra.target ? " et répond à la délégation " + deName(extra.target) : ""}.`, `Your delegation delivers its statement${extra.target ? " and responds to the delegation " + deName(extra.target) : ""}.`), S.player);
  const nx = currentSpeaker(S);
  if (nx) S.speeches.push({ chair: true, kind: "chair", paras: [chairLine(S, "next", { prev: S.player, next: nx })], t: clockStr(S) });
  return true;
}
/* Réactions aux interventions : appuyer, contester, demander une précision */
function react(S, code, kind) {
  if (S.phase !== 3 || (S.reactions || 0) >= MAX_REACTIONS || code === S.player || !S.dels[code]) return null;
  const d = S.dels[code], others = S.scen.members.filter(m => m !== S.player && m !== code);
  const near = (x, y) => 1 - avgDist(S.dels[x].pos, S.dels[y].pos) / 2;
  S.reactions = (S.reactions || 0) + 1;
  S.reacted = S.reacted || {}; S.reacted[code] = kind;
  advance(S, 2);
  if (kind === "support") {
    d.rel = clamp(d.rel + 7, -100, 100);
    for (const m of others) { const s = near(m, code); if (s > 0.75) S.dels[m].rel = clamp(S.dels[m].rel + 2, -100, 100); else if (s < 0.45) S.dels[m].rel = clamp(S.dels[m].rel - 2, -100, 100); }
    insertAfter(S, code, [{ code: S.player, mine: true, kind: "support", about: code, paras: [supportText(S, code)], t: clockStr(S) }]);
    logE(S, "debate", L(`Votre délégation appuie l'intervention de la délégation ${deName(code)}.`, `Your delegation supports the statement by the delegation ${deName(code)}.`), code);
  } else if (kind === "contest") {
    d.rel = clamp(d.rel - 9, -100, 100);
    for (const m of others) { if (near(m, code) > 0.78) S.dels[m].rel = clamp(S.dels[m].rel - 3, -100, 100); else if (1 - avgDist(S.dels[m].pos, S.line) / 2 > 0.75) S.dels[m].rel = clamp(S.dels[m].rel + 2, -100, 100); }
    const a = topAxes(d.pos, d.w, 1)[0] || issueOf(S).axes[0];
    const np = poleNP(S, a, d.pos[a]);
    insertAfter(S, code, [{ code: S.player, mine: true, kind: "contest", about: code, paras: [L(`Ma délégation conteste l'analyse de la délégation ${deName(code)}. ${capFirst(np)} ne nous ${/^des /.test(np) ? "paraissent" : "paraît"} pas répondre à l'enjeu : nous privilégions ${poleNP(S, a, S.line[a] || -d.pos[a])}.`, `My delegation challenges the analysis of the delegation ${deName(code)}. We do not believe that ${np} would meet the challenge: we favour ${poleNP(S, a, S.line[a] || -d.pos[a])}.`)], t: clockStr(S) },
      { code, kind: "reply", paras: [rightOfReply(S, code)], t: clockStr(S) }]);
    logE(S, "debate", L(`Votre délégation conteste l'intervention de la délégation ${deName(code)}, qui exerce son droit de réponse.`, `Your delegation challenges the statement by the delegation ${deName(code)}, which exercises its right of reply.`), code);
  } else {
    d.known.pos = true; d.known.red = true;
    d.rel = clamp(d.rel + 2, -100, 100);
    insertAfter(S, code, [{ code: S.player, mine: true, kind: "question", about: code, paras: [L(`Ma délégation souhaiterait que la délégation ${deName(code)} précise ses priorités et les limites qu'elle ne pourrait pas accepter.`, `My delegation would like the delegation ${deName(code)} to clarify its priorities and the limits it could not accept.`)], t: clockStr(S) },
      { code, kind: "reply", paras: [clarifyReply(S, code)], t: clockStr(S) }]);
    logE(S, "debate", L(`La délégation ${deName(code)} précise sa position à votre demande.`, `The delegation ${deName(code)} clarifies its position at your request.`), code);
  }
  return true;
}
/* Phase 3 → 4 */
function endDebate(S) {
  if (S.phase !== 3) return;
  if (!S.playerSpoke) S.stats.quality.push(0.1);
  let n = 0; while (!debateOver(S) && n++ < 40) { if (isMyTurn(S)) { S.debateIdx++; logE(S, "debate", L("Votre délégation renonce à son temps de parole.", "Your delegation waives its speaking time."), S.player); } else debateNext(S); }
  S.speeches.push({ chair: true, kind: "chair", paras: [chairLine(S, "endDebate")], t: clockStr(S) });
  S.phase = 4;
  advance(S, 15);
  initialDraft(S);
  S.initial = { proj: projection(S), uPlayer: r2(playerU(S, textVec(S))) };
  logE(S, "procedure", L(`Votre délégation fait circuler un avant-projet de ${bodyOf(S).act} comprenant ${S.draft.ops.length} paragraphes.`, `Your delegation circulates a preliminary draft ${bodyOf(S).act} with ${S.draft.ops.length} paragraphs.`), S.player);
  aiRound(S);
}

/* ---------- Négociations (phase 4) et rédaction (phase 5) ---------- */
const COST = { probe: 10, persuade: 15, deal: 20, cosponsor: 5, group: 25, consult: 30, amend: 5 };
function canAct(S, kind) { return (S.phase === 4 || S.phase === 5) && timeLeft(S) >= COST[kind]; }
const ARG_MSG = {
  juridique: "Sur la question {ax}, notre proposition s'inscrit dans le prolongement des instruments existants : elle ne crée aucune rupture juridique.",
  economique: "Sur la question {ax}, notre approche est la moins coûteuse à long terme et ménage les acteurs économiques.",
  humanitaire: "Pensons d'abord aux populations concernées : sur la question {ax}, notre approche répond à leurs besoins.",
  securite: "Sur la question {ax}, notre approche réduit les risques de crise pour tous les États concernés.",
  souverainete: "Nous tenons à vous rassurer : sur la question {ax}, rien dans ce texte ne porte atteinte à vos choix nationaux.",
  developpement: "Sur la question {ax}, notre approche renforcera les capacités des pays en développement.",
  reputation: "Soutenir ce texte, c'est prendre part à une initiative visible, dont votre délégation pourra revendiquer le succès."
};

const EN_ARG_MSG = {
  juridique: "On {ax}, our proposal builds on existing instruments: it creates no legal break with them.",
  economique: "On {ax}, our approach is the least costly in the long run and spares economic actors.",
  humanitaire: "Let us think first of the people concerned: on {ax}, our approach meets their needs.",
  securite: "On {ax}, our approach reduces the risk of crisis for all the States concerned.",
  souverainete: "Let us reassure you: on {ax}, nothing in this text undermines your national choices.",
  developpement: "On {ax}, our approach will strengthen the capacities of developing countries.",
  reputation: "Supporting this text means taking part in a visible initiative whose success your delegation will be able to claim."
};
const EN_ASK_MSG = { vote: "vote for the text", cosponsor: "co-sponsor the text", group: "rally your group behind our text" };
LANG_HOOKS.push(() => { swapFields(ARG_MSG, EN_ARG_MSG, keysOf(EN_ARG_MSG)); swapFields(ASK_MSG, EN_ASK_MSG, keysOf(EN_ASK_MSG)); });
function offerPromise(S, o) {
  const c = o.uid ? S.draft.ops.find(x => x.uid === o.uid) : null, short = c ? clauseShort(S, c) : "";
  switch (o.kind) {
    case "pet": { const t = tplById(S, o.src); return L(`nous intégrerons au texte le paragraphe que vous proposez : « ${t ? capFirst(clauseText(S, instClausePreview(S, t))) : ""} »`, `we will include in the text the paragraph you propose: “${t ? capFirst(clauseText(S, instClausePreview(S, t))) : ""}”`); }
    case "soften": return L(`nous remplacerons « ${c ? c.v : ""} » par « ${o.verb} » au paragraphe « ${short} »`, `we will replace “${c ? vb(c.v) : ""}” with “${vb(o.verb)}” in the paragraph “${short}”`);
    case "delete": return L(`nous retirerons le paragraphe « ${short} »`, `we will withdraw the paragraph “${short}”`);
    case "fund": return L("nous ajouterons un paragraphe sur l'assistance technique et financière aux pays en développement", "we will add a paragraph on technical and financial assistance to developing countries");
    default: return L("nous soutiendrons une initiative de votre délégation dans un autre forum", "we will support an initiative of your delegation in another forum");
  }
}
const ASK_MSG = { vote: "voter pour le texte", cosponsor: "vous porter coauteur du texte", group: "rallier votre groupe à notre texte" };
function doProbe(S, code) {
  if (!canAct(S, "probe")) return { ok: false, reason: "time" };
  talk(S, code, "me", L("Pourriez-vous nous préciser vos priorités et vos limites sur ce texte ?", "Could you tell us your priorities and your limits on this text?"));
  actProbe(S, code);
  const reply = probeReply(S, code);
  talk(S, code, "them", reply);
  maybeAi(S);
  return { ok: true, reply };
}
function doPersuade(S, code, key, axis) {
  if (!canAct(S, "persuade") || !ARGS[key]) return { ok: false, reason: "time" };
  axis = axis || biggestGap(S, code);
  talk(S, code, "me", fill(ARG_MSG[key], { ax: axisDe(axis) }));
  const r = actPersuade(S, code, key, axis);
  r.reply = persuadeReply(S, code, r);
  talk(S, code, "them", r.reply);
  maybeAi(S);
  return r;
}
function doDeal(S, code, askKey, offer) {
  if (!canAct(S, "deal")) return { ok: false, reason: "time" };
  talk(S, code, "me", L(`Nous vous proposons l'arrangement suivant : ${offerPromise(S, offer)}. En contrepartie, nous comptons sur votre délégation pour ${ASK_MSG[askKey]}.`, `We propose the following arrangement: ${offerPromise(S, offer)}. In return, we count on your delegation to ${ASK_MSG[askKey]}.`));
  const r = actDeal(S, code, askKey, offer);
  r.reply = dealReply(S, code, askKey, r);
  talk(S, code, "them", r.reply);
  maybeAi(S);
  return r;
}
function doCosponsor(S, code) {
  if (!canAct(S, "cosponsor")) return { ok: false, reason: "time" };
  talk(S, code, "me", L("Accepteriez-vous de vous porter coauteur de notre projet ?", "Would you agree to co-sponsor our draft?"));
  const r = actCosponsor(S, code);
  r.reply = cosponsorReply(S, code, r);
  talk(S, code, "them", r.reply);
  maybeAi(S);
  return r;
}
function doConsult(S) { if (!canAct(S, "consult")) return { ok: false, reason: "time" }; actConsult(S); return { ok: true }; }
function doGroup(S, grpId, offer) { if (!canAct(S, "group")) return { ok: false, reason: "time" }; const r = actGroup(S, grpId, offer); maybeAi(S); return r; }
function doAmend(S, id, decision) { if (!canAct(S, "amend")) return { ok: false, reason: "time" }; return { ok: !!decideAmendment(S, id, decision) }; }

/* Phase 4 → 5 */
function endNegotiations(S) {
  if (S.phase !== 4) return;
  S.phase = 5;
  advance(S, 10);
  S.speeches.push({ chair: true, kind: "chair", paras: [chairLine(S, "draft")], t: clockStr(S) });
  logE(S, "procedure", L("Reprise de la séance : examen du projet de texte et des amendements.", "Meeting resumed: consideration of the draft text and the amendments."));
  genAmendments(S, 3);
  S.lastAi = S.negSpent;
}
/* Phase 5 → 6 */
function pendingAmendments(S) { return S.amendments.filter(a => a.status === "pending"); }
function submitToVote(S) {
  if (S.phase !== 5) return;
  for (const am of pendingAmendments(S)) { am.status = "lapsed"; S.dels[am.by].rel = clamp(S.dels[am.by].rel - 3, -100, 100); }
  for (const m of S.inbox) if (m.status === "pending") m.status = "expired";
  S.phase = 6;
  advance(S, 5);
  S.speeches.push({ chair: true, kind: "chair", paras: [chairLine(S, "vote")], t: clockStr(S) });
  logE(S, "vote", L(`Le projet de ${bodyOf(S).act} est mis aux voix.`, `The draft ${bodyOf(S).act} is put to the vote.`));
}
function castVote(S, v) {
  if (S.phase !== 6 || S.vote) return S.vote;
  runVote(S, ["yes", "no", "abs"].includes(v) ? v : "yes");
  // explications de vote : votes négatifs et abstentions marquants, puis un soutien
  const ex = [], V = S.vote;
  const order = S.scen.members.filter(m => m !== S.player);
  const pickBy = f => order.filter(f).sort((a, b) => COUNTRIES[b].infl - COUNTRIES[a].infl);
  for (const c of pickBy(c => V.votes[c] === "no").slice(0, 2)) ex.push(c);
  for (const c of pickBy(c => V.votes[c] === "abs").slice(0, 1)) ex.push(c);
  for (const c of pickBy(c => V.votes[c] === "yes" && (V.why[c] || {}).why !== "u").slice(0, 1).concat(pickBy(c => V.votes[c] === "yes").slice(0, 1))) if (!ex.includes(c) && ex.length < 4) ex.push(c);
  V.expl = ex.map(c => ({ code: c, v: V.votes[c], text: voteExplanation(S, c, V.votes[c], V.why[c]) }));
  V.announce = voteAnnounce(S);
  return V;
}
/* Phase 6 → 7 */
function finishGame(S) {
  if (S.phase !== 6 || !S.vote) return null;
  S.phase = 7;
  const rep = buildReport(S);
  logE(S, "procedure", L(`Fin de la séance. Bilan : ${rep.verdict.k.toLowerCase()}.`, `End of the meeting. Outcome: ${rep.verdict.k.toLowerCase()}.`));
  return rep;
}
function summarize(S) {
  return {
    id: S.id, date: S.updated || Date.now(), bodyId: S.bodyId, pc: S.scen.pc, issueId: S.issueId, title: issueOf(S).title, title_fr: (FR_SAVE.get(issueOf(S)) || issueOf(S)).title, title_en: (EN_ISSUES[S.issueId] || {}).title, lang: S.lang || "fr",
    player: S.player, adopted: S.vote ? S.vote.t.adopted : null, yes: S.vote ? S.vote.t.yes : 0, no: S.vote ? S.vote.t.no : 0, abs: S.vote ? S.vote.t.abs : 0,
    score: S.report ? S.report.overall : null, verdict: S.report ? S.report.verdict.k : null, genOpts: S.genOpts || null
  };
}

/* =====================================================================
   IA FACULTATIVE (côté navigateur)
   Le jeu fonctionne entièrement sans IA : c'est le mode démonstration.
   Si la fonction serveur « diplomatie » est déployée sur Supabase et que
   le joueur est connecté, l'IA peut :
     - reformuler les interventions des délégations ;
     - analyser les interventions et paragraphes rédigés librement.
   Elle ne décide jamais d'un vote ni d'une règle : le moteur garde la main.
   La clé d'API reste sur le serveur. Le navigateur n'envoie que des données
   structurées ; le serveur construit lui-même les consignes.
   ===================================================================== */

/* Garde-fou : dans une partie en anglais, on écarte un texte de l'IA rédigé en français */
function looksFrench(t) {
  const s = " " + String(t || "").toLowerCase() + " ";
  const fr = (s.match(/\s(le|la|les|des|du|une|est|et|pour|que|nous|notre|délégation|dans)\s/g) || []).length;
  const en = (s.match(/\s(the|and|of|to|is|we|our|delegation|in|that)\s/g) || []).length;
  return fr > en;
}
const AI = {
  status: "unknown", // unknown | checking | on | off
  reason: "",
  provider: "",
  remaining: null,
  MAX_PER_GAME: 30,
  TIMEOUT: 15000,
  _ctx: null,
  _checkedFor: null,
  label() {
    if (this.status === "on") return L("IA connectée : les délégations s'expriment avec leurs propres mots.", "AI connected: delegations speak in their own words.");
    if (this.status === "checking") return L("Vérification de l'IA…", "Checking the AI…");
    return L("Mode démonstration : textes générés par le simulateur, sans IA.", "Demo mode: texts generated by the simulator, without AI.");
  },
  budgetLeft(S) { return S ? Math.max(0, this.MAX_PER_GAME - (S.aiCalls || 0)) : 0; },
  usable(S) { return this.status === "on" && this.budgetLeft(S) > 0 && (this.remaining === null || this.remaining > 0); },
  async check(ctx, force) {
    const user = ctx && ctx.user ? ctx.user.id || ctx.user.email || "u" : null;
    if (!force && this._checkedFor === user && this.status !== "unknown") return this.status;
    this._ctx = ctx; this._checkedFor = user;
    const sb = ctx && ctx.sb;
    if (!sb || !sb.functions || typeof sb.functions.invoke !== "function") { this.status = "off"; this.reason = "nofn"; return this.status; }
    if (!user) { this.status = "off"; this.reason = "login"; return this.status; }
    try {
      const cached = JSON.parse(sessionStorage.getItem("somun_sim_ai") || "null");
      if (!force && cached && cached.u === user && Date.now() - cached.t < 10 * 60 * 1000) { Object.assign(this, cached.v); return this.status; }
    } catch (e) { /* stockage indisponible */ }
    this.status = "checking";
    const r = await this._invoke({ task: "ping" }, 8000);
    if (r && r.ok) { this.status = "on"; this.reason = ""; this.provider = String(r.provider || ""); this.remaining = typeof r.remaining === "number" ? r.remaining : null; }
    else { this.status = "off"; this.reason = r && r.error === "limit" ? "limit" : "server"; }
    try { sessionStorage.setItem("somun_sim_ai", JSON.stringify({ u: user, t: Date.now(), v: { status: this.status, reason: this.reason, provider: this.provider, remaining: this.remaining } })); } catch (e) { /* stockage indisponible */ }
    return this.status;
  },
  async _invoke(body, timeout) {
    const sb = this._ctx && this._ctx.sb;
    if (!sb || !sb.functions) return null;
    try {
      const call = sb.functions.invoke("diplomatie", { body });
      const res = await Promise.race([call, new Promise(r => setTimeout(() => r({ timeout: true }), timeout || this.TIMEOUT))]);
      if (!res || res.timeout || res.error) return null;
      return res.data && typeof res.data === "object" ? res.data : null;
    } catch (e) { return null; }
  },
  async call(S, body) {
    if (!this.usable(S)) return null;
    S.aiCalls = (S.aiCalls || 0) + 1;
    const r = await this._invoke(body);
    if (r && typeof r.remaining === "number") this.remaining = r.remaining;
    if (r && r.error === "limit") { this.remaining = 0; return null; }
    return r && r.ok ? r : null;
  },
  /* Reformulation d'une intervention (le fond reste celui calculé par le moteur) */
  async rewrite(S, sp, kind) {
    const b = bodyOf(S), d = S.dels[sp.code];
    const r = await this.call(S, {
      task: "speech", kind: kind || "debate", lang: LANG,
      body: b.name, org: b.org, issue: issueOf(S).title, chair: S.chairName,
      speaker: COUNTRIES[sp.code].name, attitude: d ? (PERSONALITIES[d.pers] || {}).name || "" : "",
      text: sp.paras.join("\n\n").slice(0, 2400)
    });
    const t = r && typeof r.text === "string" ? r.text.trim() : "";
    if (t.length < 60 || t.length > 2400 || (LANG === "en" && looksFrench(t))) return null;
    return t.replace(/\r/g, "").split(/\n{2,}/).map(x => x.replace(/\s+/g, " ").trim()).filter(Boolean).slice(0, 5);
  },
  /* Analyse d'une intervention libre : position sur les axes et qualité */
  async classifySpeech(S, text) {
    const issue = issueOf(S);
    const r = await this.call(S, {
      task: "classify", mode: "speech", lang: LANG, issue: issue.title,
      axes: issue.axes.map(a => ({ id: a, name: AXES[a].name, neg: AXES[a].neg, pos: AXES[a].pos })),
      text: String(text).slice(0, 3000)
    });
    if (!r || !r.result || typeof r.result !== "object") return null;
    const out = { stance: {}, quality: null, notes: [] };
    for (const a of issue.axes) { const v = Number((r.result.stance || {})[a]); if (Number.isFinite(v) && Math.abs(v) >= 0.05) out.stance[a] = r2(clamp(v, -1, 1)); }
    const q = Number(r.result.quality); if (Number.isFinite(q)) out.quality = clamp(q, 0, 1);
    if (Array.isArray(r.result.notes)) out.notes = r.result.notes.filter(x => typeof x === "string" && !(LANG === "en" && looksFrench(x))).map(x => x.slice(0, 120)).slice(0, 3);
    return out;
  },
  /* Analyse d'un paragraphe libre : effets sur les axes uniquement.
     La nature du paragraphe et sa recevabilité restent déterminées par le moteur. */
  async classifyClause(S, verb, text) {
    const issue = issueOf(S);
    const r = await this.call(S, {
      task: "classify", mode: "clause", lang: LANG, issue: issue.title, body: bodyOf(S).name,
      axes: issue.axes.map(a => ({ id: a, name: AXES[a].name, neg: AXES[a].neg, pos: AXES[a].pos })),
      text: (vb(verb) + " " + String(text)).slice(0, 1200)
    });
    if (!r || !r.result) return null;
    const fx = {};
    for (const a of issue.axes) { const v = Number((r.result.fx || {})[a]); if (Number.isFinite(v) && Math.abs(v) >= 0.05) fx[a] = r2(clamp(v, -0.8, 0.8)); }
    return { fx };
  }
};

/* =====================================================================
   INTERFACE
   Rendu par chaînes HTML et délégation d'événements (data-a = action,
   data-x / data-y = paramètres, data-k = champ de saisie mémorisé).
   L'état de la partie est sauvegardé dans le navigateur après chaque action.
   Version 1.1 : la partie se joue sur une « scène » sombre, avec une barre
   « Maintenant » qui donne toujours la prochaine étape, et des infographies
   (voir 72-infographics.js).
   ===================================================================== */
const KEY_CUR = "somun_sim_v1_current", KEY_HIST = "somun_sim_v1_history";
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* rien */ } }
};
let G = null, CTX = null;
const UI = { screen: "home", setup: { step: 1, bodyId: null, pc: null, player: null, gen: null, q: "" }, tab: "board", sel: null, panel: null, deal: { ask: "vote", offer: 0 }, arg: { key: null, axis: null }, drafts: {}, speakMode: "opts", busy: null, scrollTo: null, addFilter: null, confirmVote: false, freeClause: false, flash: null };
const H = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ctx = () => { try { return (typeof CTX === "function" ? CTX() : CTX) || {}; } catch (e) { return {}; } };
const reduceMotion = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
function toast(msg) { const c = ctx(); if (typeof c.toast === "function") c.toast(msg); else UI.flash = msg; }

/* ---------- Sauvegarde ---------- */
function validGame(S) { return S && S.v === 1 && BODIES[S.bodyId] && ISSUE_BY_ID[S.issueId] && S.dels && S.dels[S.player] && S.phase >= 1 && S.phase <= 7; }
function loadGame() { const S = LS.get(KEY_CUR, null); if (validGame(S)) { G = S; UI.tab = S.uiTab || defaultTab(S.phase); } else if (S) LS.del(KEY_CUR); }
function save() {
  if (!G) return;
  try { recordTrace(); } catch (e) { /* la courbe n'est qu'une aide */ }
  G.updated = Date.now(); G.uiTab = UI.tab;
  if (!LS.set(KEY_CUR, G) && !save.warned) { save.warned = true; toast(L("La sauvegarde automatique n'est pas disponible dans ce navigateur : la partie sera perdue si vous fermez la page.", "Automatic saving is not available in this browser: the game will be lost if you close the page.")); }
}
function pushHistory(S) {
  const h = LS.get(KEY_HIST, []).filter(x => x.id !== S.id);
  h.unshift(summarize(S));
  LS.set(KEY_HIST, h.slice(0, 30));
}

/* ---------- Petits composants ---------- */
const cnm = code => (COUNTRIES[code] || { name: code }).name;
const plq = (code, cls) => `<span class="sim-plq${code === (G && G.player) ? " me" : ""}${cls ? " " + cls : ""}">${H(cnm(code))}</span>`;
const btn = (label, a, o = {}) => `<button type="button" class="sim-btn${o.cls ? " " + o.cls : ""}" data-a="${a}"${o.x != null ? ` data-x="${H(o.x)}"` : ""}${o.y != null ? ` data-y="${H(o.y)}"` : ""}${o.dis ? " disabled" : ""}${o.title ? ` title="${H(o.title)}"` : ""}${o.pressed != null ? ` aria-pressed="${o.pressed}"` : ""}>${label}</button>`;
const voteWord = v => (LANG === "en" ? { yes: "In favour", no: "Against", abs: "Abstention" } : { yes: "Pour", no: "Contre", abs: "Abstention" })[v] || L("Inconnu", "Unknown");
const relLabel = r => LANG === "en" ? (r >= 45 ? ["Excellent", "r5"] : r >= 15 ? ["Good", "r4"] : r > -15 ? ["Neutral", "r3"] : r > -45 ? ["Strained", "r2"] : ["Difficult", "r1"]) : r >= 45 ? ["Excellente", "r5"] : r >= 15 ? ["Bonne", "r4"] : r > -15 ? ["Neutre", "r3"] : r > -45 ? ["Tendue", "r2"] : ["Difficile", "r1"];
const relMeter = r => { const k = Number(relLabel(r)[1].slice(1)); return `<span class="sim-relm r${k}" aria-hidden="true">${[1, 2, 3, 4, 5].map(i => `<i${i <= k ? ' class="on"' : ""}></i>`).join("")}</span>`; };
const inflLabel = n => LANG === "en" ? (n >= 5 ? "very strong" : n >= 4 ? "strong" : n >= 3 ? "average" : "modest") : n >= 5 ? "très forte" : n >= 4 ? "forte" : n >= 3 ? "moyenne" : "modeste";
const groupName = code => { const b = BODIES[G.bodyId]; return b.org === "UNESCO" ? UNESCO_GROUPS[COUNTRIES[code].unesco] : UN_GROUPS[COUNTRIES[code].un]; };
const mins = n => `${n} min`;
const orgName = b => b.org === "ONU" ? L("Nations Unies", "United Nations") : "UNESCO";
const PHASE_DESC = [
  "La présidence ouvre la séance et présente la question inscrite à l'ordre du jour.",
  "Vous recevez les instructions confidentielles de votre capitale et choisissez votre ligne.",
  "Les délégations interviennent à tour de rôle. Vous prenez la parole, appuyez ou contestez.",
  "Entretiens bilatéraux, accords et réunions de groupe : chaque démarche prend du temps.",
  "Le projet de texte est examiné paragraphe par paragraphe et les délégations proposent des amendements.",
  "Le texte est mis aux voix selon les règles exactes de l'organe.",
  "Analyse de votre performance. Un texte rejeté n'est pas toujours un échec."
];
const BODY_SHORT = {
  UNSC: ["Maintien de la paix et de la sécurité internationales. Décisions obligatoires pour les États.", "9 voix sur 15, sans vote contre d'un membre permanent"],
  UNGA: ["Tous les États membres, une voix chacun. Recommandations et budget de l'Organisation.", "Majorité simple, deux tiers pour les questions importantes"],
  UNHRC: ["Promotion et protection des droits de l'homme. Procédures spéciales.", "Majorité simple des membres présents et votants"],
  ECOSOC: ["Coopération économique et sociale, coordination des institutions spécialisées.", "Majorité simple des membres présents et votants"],
  TRUST: ["Session pédagogique sur un territoire fictif. Activités réelles suspendues depuis 1994.", "Majorité simple, sans droit de veto"],
  UNESCO_GC: ["Organe suprême de l'UNESCO. Recommandations et conventions internationales.", "Majorité simple, deux tiers pour une convention"],
  UNESCO_EB: ["Prépare les travaux de la Conférence générale et suit l'exécution du programme.", "Majorité simple des membres présents et votants"],
  WHC: ["Liste du patrimoine mondial, Liste en péril, Fonds du patrimoine mondial.", "Deux tiers des membres présents et votants"],
  ICH: ["Convention de 2003 : sauvegarde du patrimoine culturel immatériel.", "Majorité simple des membres présents et votants"],
  UNESCO_PC: ["Éducation, sciences, culture ou communication : textes recommandés à la plénière.", "Majorité simple des membres présents et votants"]
};

const EN_PHASE_DESC = [
  "The chair opens the meeting and introduces the item on the agenda.",
  "You receive confidential instructions from your capital and choose your line.",
  "Delegations take the floor in turn. You speak, support or challenge.",
  "Bilateral talks, agreements and group meetings: every move takes time.",
  "The draft text is examined paragraph by paragraph and delegations propose amendments.",
  "The text is put to the vote under the exact rules of the body.",
  "An analysis of your performance. A rejected text is not always a failure."
];
const EN_BODY_SHORT = {
  UNSC: ["Maintenance of international peace and security. Decisions binding on States.", "9 votes out of 15, with no vote against by a permanent member"],
  UNGA: ["All Member States, one vote each. Recommendations and the Organization's budget.", "Simple majority, two thirds for important questions"],
  UNHRC: ["Promotion and protection of human rights. Special procedures.", "Simple majority of members present and voting"],
  ECOSOC: ["Economic and social cooperation, coordination of the specialized agencies.", "Simple majority of members present and voting"],
  TRUST: ["Teaching session on a fictional territory. Actual operations suspended since 1994.", "Simple majority, no veto"],
  UNESCO_GC: ["UNESCO's supreme body. Recommendations and international conventions.", "Simple majority, two thirds for a convention"],
  UNESCO_EB: ["Prepares the work of the General Conference and oversees the execution of the programme.", "Simple majority of members present and voting"],
  WHC: ["World Heritage List, List in Danger, World Heritage Fund.", "Two thirds of members present and voting"],
  ICH: ["2003 Convention: safeguarding the intangible cultural heritage.", "Simple majority of members present and voting"],
  UNESCO_PC: ["Education, sciences, culture or communication: texts recommended to the plenary.", "Simple majority of members present and voting"]
};
LANG_HOOKS.push(() => { swapFields(PHASE_DESC, EN_PHASE_DESC, PHASE_DESC.map((x, i) => i)); swapFields(BODY_SHORT, EN_BODY_SHORT, keysOf(BODY_SHORT)); });
const sizeText = b => LANG === "en" ? (b.sim.p5only ? "5 permanent members" : b.realSize >= 190 ? `${b.realSize} Member States · ${b.sim.size || 15} simulated delegations` : `${b.realSize} members${(b.sim.size || 15) !== b.realSize ? ` · ${b.sim.size} simulated` : ""}`) : b.sim.p5only ? "5 membres permanents" : b.realSize >= 190 ? `${b.realSize} États membres · ${b.sim.size || 15} délégations simulées` : `${b.realSize} membres${(b.sim.size || 15) !== b.realSize ? ` · ${b.sim.size} simulés` : ""}`;
function eligible(bodyId) {
  const b = BODIES[bodyId];
  if (b.sim.p5only) return P5.slice();
  return Object.values(COUNTRIES).filter(c => !(b.org === "UNESCO" && c.noUnesco)).map(c => c.code);
}
function aiNote() {
  const c = ctx();
  if (AI.status === "on") return `<span class="sim-mode on">${H(AI.label())}</span>`;
  const why = AI.reason === "login" ? L(" Connectez-vous pour utiliser l'IA si elle est activée pour l'association.", " Log in to use the AI if it is enabled for the association.") : AI.reason === "limit" ? L(" La limite quotidienne d'appels à l'IA est atteinte.", " The daily limit of AI calls has been reached.") : "";
  return `<span class="sim-mode">${H(AI.label() + why)}</span>`;
}

/* ---------- Écran d'accueil ---------- */
function miniTally(x) {
  const t = Math.max(1, (x.yes || 0) + (x.no || 0) + (x.abs || 0));
  return `<span class="sim-mt" title="${L(`${x.yes} pour, ${x.no} contre, ${x.abs} abstention(s)`, `${x.yes} in favour, ${x.no} against, ${x.abs} abstention(s)`)}"><i class="v-yes" style="width:${(x.yes / t * 100).toFixed(1)}%"></i><i class="v-abs" style="width:${(x.abs / t * 100).toFixed(1)}%"></i><i class="v-no" style="width:${(x.no / t * 100).toFixed(1)}%"></i></span>`;
}
function vHome() {
  const hist = LS.get(KEY_HIST, []);
  const cur = G && G.phase < 7 ? G : null;
  return `<div class="sim-home">
  <section class="sim-hero">
    <div class="h-txt">
      <p class="sim-kick">${L("Simulation diplomatique de SOMUN", "SOMUN diplomatic simulation")}</p>
      <h1 class="h-title">${L("<em>1</em> voix sur 193", "<em>1</em> vote out of 193")}</h1>
      <p class="h-lead">${L("Chaque État membre des Nations Unies dispose d'une voix. Le temps d'une séance, vous représentez l'un d'eux : vous écoutez, vous négociez, vous rédigez, puis la salle vote.", "Every Member State of the United Nations has one vote. For the length of a meeting, you represent one of them: you listen, you negotiate, you draft, and then the room votes.")}</p>
      <p class="h-lead2">${L("Vous ne choisissez pas les autres délégations. Vous choisissez ce que vous leur dites.", "You don't choose the other delegations. You choose what you say to them.")}</p>
      ${cur ? `<div class="sim-resume"><span class="sim-kick">${L(`Séance en cours · étape ${cur.phase} sur 7 : `, `Meeting in progress · step ${cur.phase} of 7: `)}${H(PHASES[cur.phase - 1].toLowerCase())}</span><b>${H(issueOf(cur).title)}</b><span class="sim-mute">${H(BODIES[cur.bodyId].name)} ${L("· délégation ", "· delegation ")}${H(deName(cur.player))}</span><div class="sim-row">${btn(L("Reprendre la séance", "Resume the meeting"), "resume", { cls: "primary" })}${btn(L("Nouvelle simulation", "New simulation"), "new", { cls: "ghost" })}${btn(L("Abandonner", "Abandon"), "abandon", { cls: "link" })}</div></div>${aiNote()}`
      : `<div class="sim-cta">${btn(L("Nouvelle simulation", "New simulation"), "new", { cls: "primary lg" })}${aiNote()}</div>`}
    </div>
    <figure class="h-art">${heroDots()}<figcaption><span><i class="hd-k"></i>${L("193 États membres de l'ONU", "193 UN Member States")}</span><span><i class="hd-k c"></i>${L("15 siègent au Conseil de sécurité", "15 sit on the Security Council")}</span><span><i class="hd-k me"></i>${L("1 délégation : la vôtre", "1 delegation: yours")}</span></figcaption></figure>
  </section>
  <section class="sim-how"><h2>${L("Comment ça marche ?", "How does it work?")}</h2><div class="how-grid">
    <div><h3>${L("Une délégation parmi d'autres", "One delegation among others")}</h3><p>${L("Vous recevez un organe, un pays et une question fictive. Les autres délégations ont leurs intérêts, leurs alliés et leurs lignes rouges : à vous de les découvrir.", "You are given a body, a country and a fictional question. The other delegations have their own interests, allies and red lines: it is up to you to discover them.")}</p></div>
    <div><h3>${L("Le temps de la séance", "Meeting time")}</h3><p>${L("Sept étapes, de l'ouverture au vote. Pendant les négociations, chaque démarche consomme du temps de séance : vous ne pourrez pas tout faire.", "Seven steps, from the opening to the vote. During the negotiations, every move uses up meeting time: you won't be able to do everything.")}</p></div>
    <div><h3>${L("Des règles réelles", "Real rules")}</h3><p>${L("Le vote suit la règle exacte de chaque organe : 9 voix sans veto au Conseil de sécurité, deux tiers pour certaines décisions. Le simulateur compte les voix, jamais l'IA.", "The vote follows the exact rule of each body: 9 votes and no veto in the Security Council, two thirds for certain decisions. The simulator counts the votes, never the AI.")}</p></div>
  </div></section>
  <section><h2>${L("Les sept étapes d'une séance", "The seven steps of a meeting")}</h2><ol class="sim-phases">${PHASES.map((p, i) => `<li><span class="s7-n">${i + 1}</span><b>${H(p)}</b><span>${H(PHASE_DESC[i])}</span></li>`).join("")}</ol></section>
  <section>${L("<h2>Vos séances</h2>", "<h2>Your meetings</h2>")}
  ${hist.length ? `<div class="sim-hist">${hist.map(x => `<article class="hist-c"><span class="sim-kick">${new Date(x.date).toLocaleDateString(LOC())}</span><b>${H((LANG === "en" ? x.title_en : x.title_fr) || x.title)}</b><span class="sim-mute">${H((BODIES[x.bodyId] || {}).name || "")} ${L("· délégation ", "· delegation ")}${H(deName(x.player))}</span>${miniTally(x)}<div class="hist-r"><span class="sim-res ${x.adopted ? "ok" : "ko"}">${L(`${x.adopted ? "Adopté" : "Non adopté"} · ${x.yes} pour, ${x.no} contre, ${x.abs} abst.`, `${x.adopted ? "Adopted" : "Not adopted"} · ${x.yes} in favour, ${x.no} against, ${x.abs} abst.`)}</span>${x.score != null ? `<span class="sim-hist-score">${x.score}<small>/100</small></span>` : ""}</div>${x.genOpts ? btn(L("Rejouer", "Replay"), "replay", { cls: "ghost sm", x: x.id }) : ""}</article>`).join("")}</div>
  <p>${btn(L("Effacer l'historique", "Clear history"), "clearHist", { cls: "link" })}</p>` : `<p class="sim-mute">${L("Vos séances terminées apparaîtront ici, avec leur résultat et votre score.", "Your completed meetings will appear here, with their result and your score.")}</p>`}</section>
  <p class="sim-fine">${L("Les scénarios sont fictifs. Les profils des États sont des simplifications pédagogiques et ne reflètent pas les positions officielles des gouvernements. Les règles de vote appliquées sont celles des textes constitutifs de chaque organe.", "The scenarios are fictional. Country profiles are teaching simplifications and do not reflect the official positions of governments. The voting rules applied are those of each body's founding texts.")}</p>
</div>`;
}

/* ---------- Préparation d'une partie ---------- */
function vSetup() {
  const st = UI.setup, steps = L(["Organe", "Délégation", "Scénario"], ["Body", "Delegation", "Scenario"]);
  const crumbs = `<ol class="sim-crumbs">${steps.map((s, i) => `<li class="${i + 1 === st.step ? "on" : i + 1 < st.step ? "done" : ""}"><span class="cr-n">${i + 1}</span>${i + 1 < st.step ? `<button type="button" data-a="setupStep" data-x="${i + 1}">${s}</button>` : s}</li>`).join("")}</ol>`;
  let body = "";
  if (st.step === 1) {
    const card = id => { const b = BODIES[id], [d, r] = BODY_SHORT[id]; return `<button type="button" class="sim-body${st.bodyId === id ? " on" : ""}" data-a="pickBody" data-x="${id}" aria-pressed="${st.bodyId === id}"><span class="sim-body-n">${H(b.name.replace(" (session pédagogique)", "").replace(" (teaching session)", ""))}${id === "TRUST" ? ` <span class="sim-tag"${L(">pédagogique</span>", ">teaching</span>")}` : ""}</span><span class="sim-body-d">${H(d)}</span>${seatGlyph(b)}<span class="sim-body-m">${H(sizeText(b))}</span>${ruleGlyph(b)}<span class="sim-body-v">${H(r)}</span></button>`; };
    body = `${L("<h1>Choisissez un organe</h1>", "<h1>Choose a body</h1>")}<p class="sim-lead">${L("Chaque organe a ses propres pouvoirs et sa propre règle de vote. La barre dorée indique la part des voix qu'il faut réunir ; le simulateur refuse les mesures qui sortent des compétences de l'organe.", "Each body has its own powers and its own voting rule. The gold bar shows the share of votes needed; the simulator rejects measures that fall outside the body's competence.")}</p>
    ${L("<h2 class=\"sim-org-h\">Nations Unies</h2>", "<h2 class=\"sim-org-h\">United Nations</h2>")}<div class="sim-bodies">${BODY_ORDER["Nations Unies"].map(card).join("")}</div>
    <h2 class="sim-org-h">UNESCO</h2><div class="sim-bodies">${BODY_ORDER.UNESCO.map(card).join("")}</div>
    ${st.bodyId === "UNESCO_PC" ? `<div class="sim-pcpick"><b>Commission</b><div class="sim-chips">${Object.entries(BODIES.UNESCO_PC.commissions).map(([k, v]) => `<button type="button" class="sim-chip${st.pc === k ? " on" : ""}" data-a="pickPc" data-x="${k}" aria-pressed="${st.pc === k}">${H(v)}</button>`).join("")}</div></div>` : ""}
    <div class="sim-cta">${st.bodyId === "UNESCO_PC" ? btn(L("Continuer", "Continue"), "setupStep", { cls: "primary", x: 2, dis: !st.pc }) : ""}${btn(L("Retour", "Back"), "home", { cls: "ghost" })}</div>`;
  } else if (st.step === 2) {
    const b = BODIES[st.bodyId];
    body = `${L("<h1>Choisissez votre délégation</h1>", "<h1>Choose your delegation</h1>")}<p class="sim-lead">${H(b.name)}${st.pc ? " · " + H(b.commissions[st.pc]) : ""}. ${b.id === "UNSC" ? L("Les cinq membres permanents siègent toujours ; les dix autres sièges sont répartis entre les groupes régionaux.", "The five permanent members always sit; the other ten seats are shared among the regional groups.") : b.sim.p5only ? L("Le Conseil de tutelle ne compte plus que les cinq membres permanents.", "The Trusteeship Council now has only the five permanent members.") : L("La composition simulée respecte la répartition entre groupes régionaux.", "The simulated membership respects the distribution among regional groups.")}</p>
    <div class="sim-row sim-search"><input type="search" data-k="q" data-live="countries" ${L("placeholder=\"Rechercher un pays\" aria-label=\"Rechercher un pays\"", "placeholder=\"Search for a country\" aria-label=\"Search for a country\"")} value="${H(st.q)}">${btn(L("Tirer au sort", "Pick at random"), "pickCountry", { cls: "ghost", x: "__random" })}</div>
    <div id="sim-countries">${countryList()}</div>
    <div class="sim-cta">${btn(L("Retour", "Back"), "setupStep", { cls: "ghost", x: 1 })}</div>`;
  } else {
    body = scenarioPreview();
  }
  return `<div class="sim-setup">${crumbs}${body}</div>`;
}
function countryList() {
  const st = UI.setup, b = BODIES[st.bodyId], key = b.org === "UNESCO" ? "unesco" : "un", names = key === "un" ? UN_GROUPS : UNESCO_GROUPS;
  const q = st.q.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const list = eligible(st.bodyId).filter(c => !q || cnm(c).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(q));
  if (!list.length) return `<p class="sim-mute">${L("Aucun pays ne correspond à cette recherche.", "No country matches this search.")}</p>`;
  const groups = {};
  for (const c of list) (groups[COUNTRIES[c][key]] = groups[COUNTRIES[c][key]] || []).push(c);
  return Object.keys(names).filter(g => groups[g]).map(g => `<div class="sim-cgroup"><h3><i class="sim-gdot" style="background:${GROUP_COLORS[g]}"></i>${H(names[g])}</h3><div class="sim-countries">${sortFr(groups[g]).map(c => `<button type="button" class="sim-country" data-a="pickCountry" data-x="${c}">${H(cnm(c))}${b.id === "UNSC" && P5.includes(c) ? `${L("<small>membre permanent</small>", "<small>permanent member</small>")}` : ""}</button>`).join("")}</div></div>`).join("");
}
function scenarioPreview() {
  if (UI.setup.gen && UI.setup.gen.scen.lang && UI.setup.gen.scen.lang !== LANG && UI.setup.genOpts) UI.setup.gen = generateScenario(UI.setup.bodyId, UI.setup.genOpts);
  const st = UI.setup, sc = st.gen.scen, issue = ISSUE_BY_ID[sc.issueId], b = BODIES[sc.bodyId];
  const V = Object.assign({}, issue.v, sc.vars);
  const cons = sc.constraints.map(id => CONSTRAINTS.find(c => c.id === id).text);
  const P = { bodyId: sc.bodyId, scen: sc, player: st.player };
  return `<p class="sim-kick">${L("Scénario fictif · ", "Fictional scenario · ")}${H(orgName(b))} · ${H(b.name)}${sc.pc ? " · " + H(b.commissions[sc.pc]) : ""}</p>
  <h1 class="sc-title">${H(issue.title)}</h1>
  <p class="sc-who">${L(`Vous représentez <b>${H(cnm(st.player))}</b>, une délégation sur ${sc.members.length}.`, `You represent <b>${H(cnm(st.player))}</b>, one delegation out of ${sc.members.length}.`)}</p>
  <p class="sim-lead sc-lead">${H(capFirst(sc.triggerShort))}.</p>
  ${statCards(sc.facts, L("Données du scénario, fictives", "Scenario data (fictional)"))}
  <div class="sim-cols">
    ${L("<div><h3>Contexte</h3>", "<div><h3>Background</h3>")}<p>${H(fill(issue.background, V))}</p>
      ${L("<h3>Ce qui pèse sur la séance</h3>", "<h3>What weighs on the meeting</h3>")}<ul class="sim-ul">${cons.map(c => `<li>${H(c)}</li>`).join("")}</ul></div>
    ${L("<div><h3>Règle de vote</h3>", "<div><h3>Voting rule</h3>")}<p>${H(b.ruleText)}</p>${ruleGlyph(b)}
      ${L("<h3>Délégations présentes</h3>", "<h3>Delegations present</h3>")}<div class="sim-plqs">${sc.members.map(c => plq(c, c === st.player ? "me" : "")).join("")}</div></div>
  </div>
  <figure class="sim-mapbox">${dotMap(P, "group", { click: false, player: st.player })}${mapLegend(P, "group")}</figure>
  <div class="sim-cta">${btn(L("Ouvrir la séance", "Open the meeting"), "start", { cls: "primary lg" })}${btn(L("Autre scénario", "Another scenario"), "reroll", { cls: "ghost" })}${btn(L("Changer de délégation", "Change delegation"), "setupStep", { cls: "ghost", x: 2 })}</div>`;
}

/* ---------- Partie : en-tête, étapes, salles, barre « Maintenant » ---------- */
const TABS = [["board", "Ma délégation"], ["room", "Salle de conférence"], ["diplo", "Espace diplomatique"], ["draft", "Salle de rédaction"], ["vote", "Salle de vote"], ["log", "Chronologie"]];

const EN_TABS = { board: "My delegation", room: "Conference room", diplo: "Diplomatic space", draft: "Drafting room", vote: "Voting room", log: "Timeline" };
LANG_HOOKS.push(() => { for (const t of TABS) swapFields(t, { 1: EN_TABS[t[0]] }, [1]); });
function defaultTab(phase) { return ({ 1: "room", 2: "board", 3: "room", 4: "diplo", 5: "draft", 6: "vote", 7: "board" })[phase] || "board"; }
function nowBar() {
  const S = G;
  let txt = "", action = "";
  switch (S.phase) {
    case 1: txt = L("La présidence a ouvert la séance. Recevez les instructions de votre capitale.", "The chair has opened the meeting. Receive your capital's instructions."); action = btn(L("Recevoir mes instructions", "Receive my instructions"), "brief", { cls: "primary" }); break;
    case 2: txt = L("Lisez vos instructions confidentielles, puis choisissez votre ligne de négociation.", "Read your confidential instructions, then choose your negotiating line."); action = UI.tab !== "board" ? btn(L("Lire mes instructions", "Read my instructions"), "tab", { cls: "primary", x: "board" }) : btn(L("Choisir ma ligne", "Choose my line"), "jump", { cls: "primary", x: ".sim-orients" }); break;
    case 3: {
      const pos = S.order.indexOf(S.player) + 1;
      if (isMyTurn(S)) { txt = L("La présidence vous donne la parole.", "The chair gives you the floor."); action = UI.tab !== "room" ? btn(L("Prendre la parole", "Take the floor"), "tab", { cls: "primary", x: "room" }) : btn(L("Préparer mon intervention", "Prepare my statement"), "jump", { cls: "primary", x: ".sim-myturn" }); }
      else if (debateOver(S)) { txt = L("Toutes les délégations inscrites se sont exprimées.", "All inscribed delegations have spoken."); action = btn(L("Ouvrir les négociations", "Open the negotiations"), "endDebate", { cls: "primary" }); }
      else { txt = S.playerSpoke ? L("Débat général : les dernières délégations s'expriment.", "General debate: the last delegations are speaking.") : L(`Débat général : vous êtes ${pos === 1 ? "le premier orateur" : `le ${pos}e orateur`} inscrit.`, `General debate: you are ${pos === 1 ? "first" : pos + (["th", "st", "nd", "rd"][(pos % 100 - 20) % 10] || ["th", "st", "nd", "rd"][pos % 100] || "th")} on the list of speakers.`); action = btn(UI.busy ? L("La délégation s'exprime…", "The delegation is speaking…") : L("Orateur suivant", "Next speaker"), "next", { cls: "primary", dis: !!UI.busy }); }
      break;
    }
    case 4: txt = L(`Négociations : il vous reste ${mins(timeLeft(S))}.`, `Negotiations: you have ${mins(timeLeft(S))} left.`); action = btn(L("Passer à l'examen du texte", "Move on to the text"), "endNego", { cls: "primary" }); break;
    case 5: txt = L(`Examen du texte : il vous reste ${mins(timeLeft(S))}. Traitez les amendements, puis mettez le texte aux voix.`, `Consideration of the text: you have ${mins(timeLeft(S))} left. Deal with the amendments, then put the text to the vote.`); action = UI.tab !== "draft" ? btn(L("Ouvrir la salle de rédaction", "Open the drafting room"), "tab", { cls: "primary", x: "draft" }) : btn(L("Voir les amendements", "See the amendments"), "jump", { cls: "primary", x: ".sim-tools" }); break;
    case 6: txt = S.vote ? L("Le vote est terminé.", "The vote is over.") : L("Le texte est mis aux voix. Exprimez le vote de votre délégation.", "The text is put to the vote. Cast your delegation's vote."); action = S.vote ? btn(L("Voir le bilan", "See the debrief"), "finish", { cls: "primary" }) : (UI.tab !== "vote" ? btn(L("Aller à la salle de vote", "Go to the voting room"), "tab", { cls: "primary", x: "vote" }) : btn(L("Voter", "Vote"), "jump", { cls: "primary", x: ".sim-votebtns" })); break;
    case 7: txt = L("La séance est levée.", "The meeting is adjourned."); action = btn(L("Nouvelle simulation", "New simulation"), "new", { cls: "primary" }); break;
  }
  return `<div class="sim-now" role="region" ${L("aria-label=\"Prochaine étape\"><span class=\"now-k\">Maintenant</span>", "aria-label=\"Next step\"><span class=\"now-k\">Now</span>")}<p>${H(txt)}</p>${action}</div>`;
}
function vGame() {
  const S = G, b = bodyOf(S), issue = issueOf(S);
  const pend = pendingAmendments(S).length, inbox = S.inbox.filter(m => m.status === "pending").length;
  const badge = S.phase <= 5 ? { diplo: inbox, draft: pend } : {};
  const mast = `<div class="sim-mast">
    <div class="m-top"><span class="m-org">${H(orgName(b))}</span><span class="m-body">${H(b.name.replace(" (session pédagogique)", "").replace(" (teaching session)", ""))}${S.scen.pc ? " · " + H(b.commissions[S.scen.pc]) : ""}</span>${L("<span class=\"sim-tag\">Scénario fictif</span>", "<span class=\"sim-tag\">Fictional scenario</span>")}<time class="m-clock" ${L("title=\"Horloge de séance\"", "title=\"Meeting clock\"")}>${H(clockStr(S))}</time></div>
    <h1 class="m-title">${H(issue.title)}</h1>
    <div class="m-me">${L("<span>Vous représentez</span>", "<span>You represent</span>")}${plq(S.player)}<span class="m-of">${L(`1 délégation sur ${S.scen.members.length}`, `1 delegation out of ${S.scen.members.length}`)}</span>${btn(L("Menu du jeu", "Game menu"), "home", { cls: "link" })}</div>
  </div>`;
  const rail = `<ol class="sim-rail" ${L("aria-label=\"Étapes de la séance\"", "aria-label=\"Steps of the meeting\"")} style="--p:${((S.phase - 1) / 6).toFixed(3)}">${PHASES.map((p, i) => `<li class="${i + 1 === S.phase ? "on" : i + 1 < S.phase ? "done" : ""}"${i + 1 === S.phase ? ' aria-current="step"' : ""}><span class="n">${i + 1}</span><span class="l">${H(p)}</span></li>`).join("")}</ol>`;
  const tabs = `<div class="sim-tabs" role="tablist">${TABS.map(([k, l]) => `<button type="button" role="tab" aria-selected="${UI.tab === k}" class="${UI.tab === k ? "on" : ""}" data-a="tab" data-x="${k}">${H(l)}${badge[k] ? `<span class="sim-badge" aria-label="${badge[k]} ${L("en attente", "pending")}">${badge[k]}</span>` : ""}</button>`).join("")}</div>`;
  const content = ({ board: tBoard, room: tRoom, diplo: tDiplo, draft: tDraft, vote: tVote, log: tLog })[UI.tab] || tBoard;
  const help = UI.tab === defaultTab(S.phase) ? phaseHelp(S) : "";
  return `<div class="sim-game">${mast}${rail}${tabs}
  <div class="sim-layout${S.phase === 7 ? " wide" : ""}"><div class="sim-main" role="tabpanel">${help}${content()}</div>${S.phase === 7 ? "" : `<aside class="sim-aside" aria-label="Situation">${situation()}</aside>`}</div>
  ${nowBar()}
</div>`;
}

/* ---------- Situation (colonne latérale) ---------- */
function liveObjectives(S) {
  const R = textVec(S), me = COUNTRIES[S.player], key = bodyOf(S).org === "UNESCO" ? "unesco" : "un";
  return objectives(S).map(o => {
    let ok = false;
    if (o.id === "axis") ok = o.dir === "min" ? R[o.axis] >= o.thr : R[o.axis] <= o.thr;
    else if (o.id === "pet") ok = hasSrc(S, o.src);
    else if (o.id === "co") ok = S.draft.cosponsors.length >= o.k && S.draft.cosponsors.some(c => COUNTRIES[c][key] !== me[key]);
    return Object.assign({}, o, { ok });
  });
}
function estimate(S) {
  const p = projection(S), counts = { yes: 0, no: 0, abs: 0, unk: 0 }, best = {}, worst = {};
  for (const c of S.scen.members) {
    const known = c === S.player || S.dels[c].known.pos;
    if (known) { counts[p.votes[c]]++; best[c] = worst[c] = p.votes[c]; }
    else { counts.unk++; best[c] = "yes"; worst[c] = "no"; }
  }
  const tb = tally(S, best), tw = tally(S, worst);
  return { counts, status: tw.adopted ? "ok" : !tb.adopted ? "ko" : "unk", rule: p.t.rule };
}
function situation() {
  const S = G;
  const parts = [];
  if (S.phase === 3 && UI.tab !== "room") {
    const last = [...S.speeches].reverse().find(sp => sp.code && sp.kind === "debate"), nx = currentSpeaker(S);
    parts.push(`<div class="sim-sit sim-sit-room">${L("<h3>Dans la salle</h3>", "<h3>In the room</h3>")}${roomSVG(S, { mini: true })}<p class="sim-mute">${last ? L(`À la parole : <b>${H(cnm(last.code))}</b>.`, `Speaking: <b>${H(cnm(last.code))}</b>.`) : L("La présidence ouvre le débat.", "The chair opens the debate.")}${nx ? L(` Prochain orateur : ${nx === S.player ? "<b>vous</b>" : H(cnm(nx))}.`, ` Next speaker: ${nx === S.player ? "<b>you</b>" : H(cnm(nx))}.`) : ""}</p></div>`);
  }
  if (S.phase === 3) {
    const others = S.scen.members.filter(c => c !== S.player), known = others.filter(c => S.dels[c].known.pos);
    parts.push(`<div class="sim-sit">${L("<h3>Ce que vous savez</h3>", "<h3>What you know</h3>")}<div class="sim-known">${others.map(c => `<i class="${S.dels[c].known.pos ? "on" : ""}" title="${H(cnm(c))}${S.dels[c].known.pos ? "" : L(" : position inconnue", ": position unknown")}"></i>`).join("")}</div><p class="sim-mute">${L(`<b>${known.length} position${known.length > 1 ? "s" : ""} connue${known.length > 1 ? "s" : ""}</b> sur ${others.length}. Pour connaître une position, demandez une précision à la délégation après son intervention ; pendant les négociations, vous pourrez la sonder.`, `<b>${known.length} position${known.length !== 1 ? "s" : ""} known</b> out of ${others.length}. To learn a position, ask the delegation for clarification after its statement; during the negotiations, you will be able to sound it out.`)}</p></div>`);
  }
  if (S.phase === 4 || S.phase === 5) {
    const tot = S.phase === 4 ? 120 : 60, left = timeLeft(S);
    parts.push(`<div class="sim-sit"><h3>${L(`Temps ${S.phase === 4 ? "de négociation" : "d'examen du texte"}`, S.phase === 4 ? "Negotiating time" : "Time to examine the text")}</h3><div class="sim-time"><b>${left}</b><span>${L("min sur", "min out of")} ${tot}</span></div><div class="sim-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${tot}" aria-valuenow="${left}"><i style="width:${Math.round(left / tot * 100)}%"></i></div><p class="sim-mute">${L("Horloge de séance : ", "Meeting clock: ")}${H(clockStr(S))}</p></div>`);
  }
  if (S.phase >= 4 && S.phase <= 6 && !S.vote) parts.push(`<div class="sim-sit">${L("<h3>Si l'on votait maintenant</h3>", "<h3>If the vote were held now</h3>")}${voteDots(S)}</div>`);
  if (S.phase >= 2 && S.phase < 7) {
    const objs = S.vote ? evalObjectives(S) : S.phase >= 4 ? liveObjectives(S) : objectives(S).map(o => Object.assign({}, o, { ok: null }));
    const done = objs.filter(o => o.ok === true).length;
    parts.push(`<div class="sim-sit"><h3>${L("Vos objectifs", "Your objectives")}${S.phase >= 4 ? ` <span class="sim-count">${done} ${L("sur", "of")} ${objs.length}</span>` : ""}</h3><ul class="sim-objs">${objs.map(o => `<li class="${o.ok === true ? "ok" : o.ok === false ? "no" : ""}"><span class="sim-dot" aria-hidden="true"></span>${H(o.text)}${o.ok === true ? `${L("<span class=\"sr\">(atteint pour l'instant)</span>", "<span class=\"sr\">(achieved for now)</span>")}` : ""}</li>`).join("")}</ul></div>`);
  }
  if (S.phase >= 4 && S.phase < 7) parts.push(`<div class="sim-sit">${L("<h3>Soutiens</h3>", "<h3>Support</h3>")}<p>${S.draft.cosponsors.length ? L(`Coauteurs : ${S.draft.cosponsors.map(c => H(cnm(c))).join(", ")}.`, `Co-sponsors: ${S.draft.cosponsors.map(c => H(cnm(c))).join(", ")}.`) : L("Aucun coauteur pour l'instant.", "No co-sponsors yet.")} ${S.deals.filter(d => d.status === "active").length ? L(`${S.deals.filter(d => d.status === "active").length} accord(s) en cours.`, `${S.deals.filter(d => d.status === "active").length} agreement(s) under way.`) : ""}</p></div>`);
  parts.push(`<div class="sim-sit sim-sit-mode">${aiNote()}</div>`);
  return parts.join("");
}

/* ---------- Ma délégation (tableau de bord) ---------- */
function tBoard() {
  const S = G, b = bodyOf(S), issue = issueOf(S), V = speechVars(S), out = [];
  if (S.phase === 7 && S.report) out.push(debrief());
  if (S.phase < 7) out.push(`<div class="sim-inline-sit">${situation()}</div>`);
  if (S.phase >= 2) out.push(briefNote());
  out.push(`<section class="sim-card">${L("<h2>La question</h2>", "<h2>The question</h2>")}
    <p class="sim-qlead">${H(capFirst(S.scen.triggerShort))}.</p><p>${H(fill(issue.background, V))}</p>
    ${statCards(S.scen.facts, L("Données du scénario, fictives", "Scenario data (fictional)"))}
    <p class="sim-fine">${L("Les faits et les données de ce scénario sont fictifs ; les textes juridiques cités sont réels.", "The facts and figures in this scenario are fictional; the legal texts cited are real.")}</p></section>`);
  out.push(`<section class="sim-card">${L("<h2>Les délégations présentes</h2>", "<h2>The delegations present</h2>")}${mapBlock(S, S.phase >= 4 ? ["group", "vote", "rel"] : S.phase >= 3 ? ["group", "rel"] : ["group"], UI.mapMode || "group")}</section>`);
  out.push(`<section class="sim-card"><h2>${H(b.name)}</h2><p>${H(b.desc)}</p>
    <div class="sim-cols"><div>${L("<h3>Ce que l'organe peut faire</h3>", "<h3>What the body can do</h3>")}<ul class="sim-ul ok">${b.powers.map(p => `<li>${H(p)}</li>`).join("")}</ul></div><div>${L("<h3>Ce qu'il ne peut pas faire</h3>", "<h3>What it cannot do</h3>")}<ul class="sim-ul ko">${b.limits.map(p => `<li>${H(p)}</li>`).join("")}</ul></div></div>
    <h3>${L("Règle de vote", "Voting rule")}</h3><p>${H(b.ruleText)}</p>${ruleDiagram(S)}</section>`);
  return out.join("");
}
/* Positions sur les points clés, en curseurs « vers où penche… » */
function axisBars(S, code, opts = {}) {
  const d = S.dels[code], issue = issueOf(S), R = textVec(S), showR = S.phase >= 4, mine = code === S.player;
  const known = mine || d.known.pos, red = mine || d.known.red, me = S.dels[S.player];
  const rows = issue.axes.map(a => {
    const rl = red ? d.red.find(r => r.axis === a) : null;
    const marks = [known ? { v: d.pos[a], k: mine ? "cap" : "del", t: mine ? L("Position de votre capitale", "Your capital's position") : L("Position de la délégation", "The delegation's position") } : null, !mine ? { v: me.pos[a], k: "cap sm", t: L("Position de votre capitale", "Your capital's position") } : null, showR ? { v: R[a], k: "txt", t: L("Texte actuel", "Current text") } : null];
    const tag = mine ? (d.w[a] >= 0.8 ? L("priorité majeure", "top priority") : d.w[a] >= 0.55 ? L("point important", "important point") : L("point secondaire", "secondary point")) : (known ? "" : L("position inconnue", "position unknown"));
    const say = mine ? L(`Votre capitale penche ${H(leanWord(d.pos[a], a))}${showR ? ` ; le texte, ${H(leanWord(R[a], a))}` : ""}.`, `Your capital leans ${H(leanWord(d.pos[a], a))}${showR ? `; the text, ${H(leanWord(R[a], a))}` : ""}.`) : known ? L(`Penche ${H(leanWord(d.pos[a], a))}.`, `Leans ${H(leanWord(d.pos[a], a))}.`) : "";
    return leanRow(a, marks, { red: rl, tag, say });
  }).join("");
  const legend = opts.legend === false ? "" : `<p class="sim-legend"><span><i class="lg-cap"></i>${mine ? L("position de votre capitale", "your capital's position") : L("votre capitale", "your capital")}</span>${!mine && known ? `<span>${L("<i class=\"lg-del\"></i>cette délégation</span>", "<i class=\"lg-del\"></i>this delegation</span>")}` : ""}${showR ? `<span>${L("<i class=\"lg-txt\"></i>texte actuel</span>", "<i class=\"lg-txt\"></i>current text</span>")}` : ""}${red && d.red.length ? `<span>${L("<i class=\"lg-red\"></i>ligne rouge</span>", "<i class=\"lg-red\"></i>red line</span>")}` : ""}</p>`;
  return `<div class="sim-axes">${rows}${legend}</div>`;
}
function briefNote() {
  const S = G, br = briefing(S), b = bodyOf(S);
  const orient = S.phase === 2 ? `${L("<h3>Choisissez votre ligne de négociation</h3>", "<h3>Choose your negotiating line</h3>")}<p class="sim-mute">${L("Votre ligne combine les instructions de votre capitale et l'orientation choisie. Elle guide vos interventions et le premier projet de texte.", "Your line combines your capital's instructions and the approach you choose. It guides your statements and the first draft text.")}</p>
    <div class="sim-orients">${br.orientations.map(o => `<button type="button" class="sim-orient" data-a="orient" data-x="${o.k}"><b>${H(o.name)}</b>${o.recommended ? `${L("<span class=\"sim-tag gold\">conseillée par votre capitale</span>", "<span class=\"sim-tag gold\">recommended by your capital</span>")}` : ""}<span>${H(o.desc)}</span><span class="sim-fit"><span class="fit-bar"><i style="width:${Math.round(o.fit * 100)}%"></i></span>${L(`Compatibilité avec vos instructions : ${Math.round(o.fit * 100)} %`, `Fit with your instructions: ${Math.round(o.fit * 100)}%`)}</span></button>`).join("")}</div>`
    : L(`<p class="sim-mute">Ligne retenue : <b>${H(ORIENTATIONS[S.orientation].name)}</b>.</p>`, `<p class="sim-mute">Line adopted: <b>${H(ORIENTATIONS[S.orientation].name)}</b>.</p>`);
  return `<section class="sim-card sim-brief">
    <div class="tg-head">${L("<span>Télégramme diplomatique</span><span class=\"sim-conf\">Confidentiel</span>", "<span>Diplomatic cable</span><span class=\"sim-conf\">Confidential</span>")}</div>
    <dl class="tg-meta"><div>${L("<dt>De</dt><dd>Votre capitale</dd>", "<dt>From</dt><dd>Your capital</dd>")}</div><div><dt>${L("À", "To")}</dt><dd>${L(`Délégation ${H(deName(S.player))} auprès ${H(b.de)}`, `Delegation ${H(deName(S.player))} to the ${H(b.name.replace(" (teaching session)", ""))}`)}</dd></div><div>${L("<dt>Objet</dt>", "<dt>Subject</dt>")}<dd>${H(issueOf(S).title)}</dd></div></dl>
    <h2>${H(br.title)}</h2><p>${H(br.lead)}</p>
    ${L("<h3>Intérêts nationaux</h3>", "<h3>National interests</h3>")}<ul class="sim-ul">${br.interests.map(x => `<li>${H(capFirst(x))}</li>`).join("")}</ul>
    ${L("<h3>Où penche votre capitale</h3>", "<h3>Where your capital leans</h3>")}<p class="sim-mute">${L("Sur chaque point clé, le curseur montre la position que votre capitale vous demande de défendre.", "On each key point, the marker shows the position your capital asks you to defend.")}</p>
    ${axisBars(S, S.player)}
    <ul class="sim-ul sim-axnotes">${br.axes.map(a => `<li><b>${H(a.name)}</b>${L(" : ", ": ")}${H(a.text)}</li>`).join("")}</ul>
    ${br.red.length ? `${L("<h3>Lignes rouges</h3><ul class=\"sim-ul sim-redlist\">", "<h3>Red lines</h3><ul class=\"sim-ul sim-redlist\">")}${br.red.map(r => `<li>${H(r.text)}</li>`).join("")}</ul>` : ""}
    ${br.domestic ? `${L("<h3>Contrainte intérieure</h3>", "<h3>Domestic constraint</h3>")}<p>${H(br.domestic)}</p>` : ""}
    <div class="sim-cols"><div>${L("<h3>Partenaires probables</h3>", "<h3>Likely partners</h3>")}<div class="sim-plqs">${br.allies.map(c => plq(c)).join("")}</div></div><div>${L("<h3>Positions éloignées</h3>", "<h3>Distant positions</h3>")}<div class="sim-plqs">${br.rivals.map(c => plq(c)).join("")}</div></div></div>
    ${L("<h3>Objectifs de la délégation</h3>", "<h3>Delegation objectives</h3>")}<ul class="sim-ul">${br.objectives.map(o => `<li>${H(o.text)}</li>`).join("")}</ul>
    ${orient}</section>`;
}
function debrief() {
  const S = G, R = S.report, t = S.vote.t;
  const rel = R.rel.filter(x => Math.abs(x.d) >= 5);
  const up = rel.filter(x => x.d > 0).slice(0, 3), down = rel.filter(x => x.d < 0).sort((a, b) => a.d - b.d).slice(0, 3);
  const maxD = Math.max(10, ...rel.map(x => Math.abs(x.d)));
  const relRow = x => `<div class="sim-relrow">${plq(x.code, "sm")}<span class="rr-bar ${x.d > 0 ? "up" : "down"}"><i style="width:${(Math.abs(x.d) / maxD * 100).toFixed(0)}%"></i></span><span class="${x.d > 0 ? "sim-up" : "sim-down"}">${x.d > 0 ? "+" : ""}${x.d}</span></div>`;
  const trace = roomTrace(S);
  const ok = R.objs.filter(o => o.ok).length;
  return `<section class="sim-debrief">
    <div class="sim-verdict ${({ "Succès diplomatique": "ok", "Échec diplomatique": "ko", "Diplomatic success": "ok", "Diplomatic failure": "ko" })[R.verdict.k] || "mid"}"><div>${L("<span class=\"sim-kick\">Bilan de la séance</span>", "<span class=\"sim-kick\">Outcome of the meeting</span>")}<div class="sim-verdict-k">${H(R.verdict.k)}</div><p>${H(R.verdict.c)}</p><p class="sim-verdict-v">${L(`${t.yes} pour, ${t.no} contre, ${t.abs} abstention${t.abs > 1 ? "s" : ""} · ${t.adopted ? "texte adopté" : "texte non adopté"}${t.veto.length ? ` (vote négatif ${t.veto.map(deName).join(", ")})` : ""}`, `${t.yes} in favour, ${t.no} against, ${t.abs} abstention${t.abs !== 1 ? "s" : ""} · ${t.adopted ? "text adopted" : "text not adopted"}${t.veto.length ? ` (negative vote ${t.veto.map(deName).join(", ")})` : ""}`)}</p></div><div class="sim-overall"><b>${R.overall}</b>${L("<span>sur 100</span>", "<span>out of 100</span>")}</div></div>
    <div class="sim-grain"><div class="gr-fig">${scoreFlower(R)}</div><div>${L("<h2>Votre performance</h2>", "<h2>Your performance</h2>")}<p class="sim-mute">${L("Chaque pétale mesure l'un des six aspects de votre travail, sur 100 : plus il est long, meilleur est le score.", "Each petal measures one of the six aspects of your work, out of 100: the longer it is, the better the score.")}</p>
      <ul class="sim-scorelist">${R.scores.map(s => `<li><div class="sl-h"><span>${H(s.k)}</span><b>${s.v}</b></div><span class="sl-bar"><i style="width:${s.v}%"></i></span><p>${H(s.c)}</p></li>`).join("")}</ul></div></div>
    ${trace ? `${L("<h2>La salle, démarche après démarche</h2>", "<h2>The room, move by move</h2>")}<p class="sim-mute">${L("Chaque colonne montre les intentions de vote que vous connaissiez après une démarche : vous découvrez les positions, puis vous les faites bouger.", "Each column shows the voting intentions you knew after a move: you discover the positions, then you shift them.")}</p>${trace}` : ""}
    <h2>${L("Objectifs de votre capitale", "Your capital's objectives")} <span class="sim-count">${ok} ${L("sur", "of")} ${R.objs.length}</span></h2><ul class="sim-objs final">${R.objs.map(o => `<li class="${o.ok ? "ok" : "no"}"><span class="sim-dot" aria-hidden="true"></span><span>${H(o.text)}<small>${o.ok ? L("Atteint", "Achieved") : L("Non atteint", "Not achieved")}${L(" : ", ": ")}${H(o.note)}</small></span></li>`).join("")}</ul>
    <div class="sim-cols">${L("<div><h2>Conséquences</h2>", "<div><h2>Consequences</h2>")}<ul class="sim-ul">${R.consequences.map(c => `<li>${H(c)}</li>`).join("")}</ul></div>
    ${L("<div><h2>Concessions et accords</h2>", "<div><h2>Concessions and agreements</h2>")}${R.concessions.length ? `<ul class="sim-ul">${R.concessions.map(c => `<li>${H(cnm(c.by))}${L(" : ", ": ")}${H(c.label)}${c.deal ? ` <span class="sim-deal ${c.deal}">${c.deal === "broken" ? L("promesse rompue", "broken promise") : c.deal === "honored" ? L("tenu", "kept") : L("en cours", "ongoing")}</span>` : ""}</li>`).join("")}</ul>` : `<p class="sim-mute">${L("Aucune concession ni aucun accord.", "No concessions and no agreements.")}</p>`}
    ${R.coalitions.length ? `<h3>Coalitions</h3><ul class="sim-ul">${R.coalitions.map(c => `<li>${H(c)}</li>`).join("")}</ul>` : ""}</div></div>
    ${L("<h2>Le vote sur la carte</h2>", "<h2>The vote on the map</h2>")}<figure class="sim-mapbox">${dotMap(S, "vote")}${mapLegend(S, "vote")}</figure>
    <h2>Relations</h2><div class="sim-cols"><div>${L("<h3>En progrès</h3>", "<h3>Improving</h3>")}${up.length ? up.map(relRow).join("") : `<p class="sim-mute">${L("Aucune évolution notable.", "No notable change.")}</p>`}</div><div>${L("<h3>En recul</h3>", "<h3>Declining</h3>")}${down.length ? down.map(relRow).join("") : `<p class="sim-mute">${L("Aucune dégradation notable.", "No notable deterioration.")}</p>`}</div></div>
    <div class="sim-cta">${btn(L("Nouvelle simulation", "New simulation"), "new", { cls: "primary" })}${btn(L("Rejouer ce scénario", "Replay this scenario"), "replayCur", { cls: "ghost" })}${btn(L("Revoir la chronologie", "Review the timeline"), "tab", { cls: "ghost", x: "log" })}</div>
  </section>`;
}

/* ---------- Salle de conférence ---------- */
const chairTitle = S => S.scen.chairF ? bodyOf(S).chairTitle.replace(/^Président/, "Présidente") : bodyOf(S).chairTitle;
const KIND_LABEL = { debate: "Intervention", reply: "Réponse", support: "Appui", contest: "Objection", question: "Question" };

const EN_KIND_LABEL = { debate: "Statement", reply: "Reply", support: "Support", contest: "Objection", question: "Question" };
LANG_HOOKS.push(() => swapFields(KIND_LABEL, EN_KIND_LABEL, keysOf(EN_KIND_LABEL)));
function speechHTML(S, sp, i) {
  if (sp.chair) return `<div class="sim-chair"><span>${H(chairTitle(S))}</span>${sp.paras.map(p => `<p>${H(p)}</p>`).join("")}</div>`;
  const can = S.phase === 3 && !sp.mine && sp.kind === "debate" && (S.reactions || 0) < MAX_REACTIONS && !(S.reacted || {})[sp.code];
  return `<article class="sim-sp ${sp.mine ? "mine" : ""} k-${sp.kind}" id="sim-sp-${i}"><div class="sim-sp-h">${plq(sp.code)}<span class="sim-sp-m">${H(KIND_LABEL[sp.kind] || "")}${sp.t ? ` <time>${H(sp.t)}</time>` : ""}${sp.ai ? L(" · formulée par l'IA", " · worded by the AI") : ""}</span></div>
    ${sp.pending ? `<p class="sim-wait">${L("La délégation prend la parole…", "The delegation takes the floor…")}</p>` : sp.paras.map(p => `<p>${H(p)}</p>`).join("")}
    ${sp.mine && sp.notes && sp.notes.length ? `<p class="sim-notes">${L("Perception de votre intervention : ", "How your statement came across: ")}${H(sp.notes.join(", "))}.</p>` : ""}
    ${can ? `<div class="sim-react">${btn(L("Appuyer", "Support"), "react", { cls: "ghost sm", x: sp.code, y: "support" })}${btn(L("Contester", "Challenge"), "react", { cls: "ghost sm", x: sp.code, y: "contest" })}${btn(L("Demander une précision", "Ask for clarification"), "react", { cls: "ghost sm", x: sp.code, y: "clarify" })}</div>` : ""}</article>`;
}
function tRoom() {
  const S = G;
  const cam = camera(S) + roomLegend(S);
  if (S.phase <= 2) {
    return `<section class="sim-card sim-roomcard">${L("<h2>Ouverture de la séance</h2>", "<h2>Opening of the meeting</h2>")}${cam}<div class="sim-chair big"><span>${H(chairTitle(S))}</span>${chairOpening(S).map(p => `<p>${H(p)}</p>`).join("")}</div>
    ${S.phase === 1 ? `<div class="sim-cta">${btn(L("Recevoir les instructions de ma capitale", "Receive my capital's instructions"), "brief", { cls: "primary" })}</div>` : `<div class="sim-cta">${btn(L("Lire mes instructions", "Read my instructions"), "tab", { cls: "primary", x: "board" })}</div>`}</section>`;
  }
  const speakers = `<div class="sim-queue">${L("<span class=\"sim-kick\">Liste des orateurs</span>", "<span class=\"sim-kick\">List of speakers</span>")}<ol class="sim-speakers" ${L("aria-label=\"Liste des orateurs\"", "aria-label=\"List of speakers\"")}>${S.order.map((c, i) => `<li class="${i < S.debateIdx ? "done" : i === S.debateIdx && S.phase === 3 ? "cur" : ""}${c === S.player ? " me" : ""}"><span>${i + 1}</span>${H(cnm(c))}</li>`).join("")}</ol></div>`;
  const feed = `<div class="sim-feed">${S.speeches.map((sp, i) => speechHTML(S, sp, i)).join("")}</div>`;
  let ctrl = "";
  if (S.phase === 3) {
    if (isMyTurn(S)) ctrl = myTurn();
    else if (debateOver(S)) ctrl = `<div class="sim-cta">${btn(L("Clore le débat et ouvrir les négociations", "Close the debate and open the negotiations"), "endDebate", { cls: "primary" })}</div>`;
    else ctrl = `<div class="sim-cta">${btn(UI.busy ? L("La délégation s'exprime…", "The delegation is speaking…") : L("Orateur suivant", "Next speaker"), "next", { cls: "primary", dis: !!UI.busy })}${!S.playerSpoke ? btn(L("Aller jusqu'à mon tour", "Skip to my turn"), "toMe", { cls: "ghost", dis: !!UI.busy }) : btn(L("Entendre les dernières délégations", "Hear the last delegations"), "toEnd", { cls: "ghost", dis: !!UI.busy })}</div>
      <p class="sim-mute">${L(`Réactions possibles : ${MAX_REACTIONS - (S.reactions || 0)} sur ${MAX_REACTIONS}. Appuyer une délégation améliore vos relations ; la contester marque votre différence.`, `Reactions left: ${MAX_REACTIONS - (S.reactions || 0)} of ${MAX_REACTIONS}. Supporting a delegation improves your relations; challenging it sets you apart.`)}</p>`;
  }
  return `<section class="sim-card sim-roomcard"><h2>${S.phase === 3 ? L("Débat général", "General debate") : L("Compte rendu des débats", "Record of the debate")}</h2>${cam}${speakers}${feed}${ctrl}</section>`;
}
function myTurn() {
  const S = G, opts = playerOptions(S);
  const mode = UI.speakMode;
  const seg = `<div class="sim-seg" role="group" ${L("aria-label=\"Mode d'intervention\"", "aria-label=\"Statement mode\"")}>${btn(L("Interventions préparées", "Prepared statements"), "speakMode", { x: "opts", cls: mode === "opts" ? "on" : "", pressed: mode === "opts" })}${btn(L("Rédiger mon intervention", "Write my statement"), "speakMode", { x: "free", cls: mode === "free" ? "on" : "", pressed: mode === "free" })}</div>`;
  let body;
  if (mode === "opts") body = `<div class="sim-opts">${opts.map(o => `<div class="sim-opt"><h3>${H(o.name)}</h3><p class="sim-mute">${H(o.hint)}</p><div class="sim-opt-t">${o.paras.map(p => `<p>${H(p)}</p>`).join("")}</div>${btn(L("Prononcer cette intervention", "Deliver this statement"), "speakOpt", { cls: "primary sm", x: o.id, dis: !!UI.busy })}</div>`).join("")}</div>`;
  else body = `<label class="sim-lbl" for="sim-speech">${L("Votre intervention (trois minutes environ, soit 80 à 200 mots)", "Your statement (about three minutes, i.e. 80 to 200 words)")}</label>
    <textarea id="sim-speech" rows="9" data-k="speech" data-live="speech" placeholder="${H(S.chairName)}${L(", ma délégation…", ", my delegation…")}">${H(UI.drafts.speech || "")}</textarea>
    <div id="sim-live-speech" aria-live="polite">${liveSpeech()}</div>
    <div class="sim-cta">${btn(UI.busy ? L("Analyse en cours…", "Analysing…") : L("Prononcer mon intervention", "Deliver my statement"), "speakFree", { cls: "primary", dis: !!UI.busy || !(UI.drafts.speech || "").trim() })}</div>`;
  return `<section class="sim-myturn">${L("<span class=\"sim-kick\">La présidence vous donne la parole</span><h3>À vous de parler</h3>", "<span class=\"sim-kick\">The chair gives you the floor</span><h3>Your turn to speak</h3>")}${seg}${body}</section>`;
}
function liveSpeech() {
  const S = G, txt = UI.drafts.speech || "";
  if (!txt.trim()) return `<p class="sim-mute">${L("Exposez vos priorités, appuyez-vous sur les données, proposez des solutions et restez courtois : la qualité de l'intervention et la position qu'elle exprime auront un effet sur les autres délégations.", "Set out your priorities, rely on the data, propose solutions and remain courteous: the quality of your statement and the position it expresses will have an effect on the other delegations.")}</p>`;
  const a = analyzeSpeech(S, txt);
  const st = Object.keys(a.stance);
  return `<div class="sim-analysis"><div>${L("<b>Position perçue</b>", "<b>Perceived position</b>")} ${st.length ? st.map(ax => `<span class="sim-chip sm">${H(AXES[ax].name)}${L(" : ", ": ")}${H(a.stance[ax] > 0 ? AXES[ax].pos : AXES[ax].neg)}</span>`).join("") : `<span class="sim-mute">${L("aucune position claire pour l'instant", "no clear position yet")}</span>`}</div>
    <div>${L("<b>Qualité estimée</b>", "<b>Estimated quality</b>")} <span class="sim-q"><i style="width:${Math.round(a.quality * 100)}%"></i></span> ${Math.round(a.quality * 100)}/100${a.notes.length ? ` · ${H(a.notes.join(", "))}` : ""}</div>
    <div class="sim-mute">${a.words} ${L("mots", "words")}${AI.usable(S) ? L(" · l'analyse finale sera faite par l'IA", " · the final analysis will be done by the AI") : ""}</div></div>`;
}

/* ---------- Espace diplomatique ---------- */
function tDiplo() {
  const S = G;
  if (S.phase < 4) return `<section class="sim-card">${L("<h2>Espace diplomatique</h2>", "<h2>Diplomatic space</h2>")}<p>${L("Les consultations informelles s'ouvriront à la clôture du débat général. Vous pourrez alors sonder les délégations, proposer des accords et réunir des groupes.", "Informal consultations will open when the general debate closes. You will then be able to sound out delegations, propose agreements and convene groups.")}</p>${S.phase === 3 ? `${L("<h3>Carte des positions</h3>", "<h3>Position map</h3>")}${positionBlock(S)}` : ""}${delegList(false)}</section>`;
  const live = S.phase === 4 || S.phase === 5;
  const inbox = S.inbox.filter(m => m.status === "pending");
  const groups = groupsPresent(S);
  return `<section class="sim-card">${L("<h2>Espace diplomatique</h2>", "<h2>Diplomatic space</h2>")}
    ${live && timeLeft(S) < 5 ? `<p class="sim-warn soft">${L(`Le temps ${S.phase === 4 ? "de négociation" : "d'examen"} est écoulé. ${S.phase === 4 ? "Passez à l'examen du texte." : "Vous pouvez encore modifier le texte, puis le mettre aux voix."}`, `${S.phase === 4 ? "Negotiating" : "Examination"} time is up. ${S.phase === 4 ? "Move on to the examination of the text." : "You can still amend the text, then put it to the vote."}`)}</p>` : ""}
    ${live ? `<div class="sim-diptop"><p>${L(`Chaque démarche consomme du temps : il vous reste <b>${timeLeft(S)} min</b>.`, `Every move takes time: you have <b>${timeLeft(S)} min</b> left.`)}</p>${btn(L("Consultations ouvertes · 30 min", "Open consultations · 30 min"), "consult", { cls: "ghost", dis: !canAct(S, "consult"), title: L("Toutes les délégations exposent leur position ; certaines proposent des amendements.", "All delegations set out their position; some propose amendments.") })}</div>` : ""}
    ${inbox.length && live ? `<div class="sim-inbox">${L("<h3>Propositions reçues</h3>", "<h3>Offers received</h3>")}${inbox.map(m => `<div class="sim-offer">${plq(m.from)}<p>${L(`Elle votera pour le texte si vous acceptez ${H(de(lcFirst(m.offer.label)))}.`, `It will vote for the text if you agree to ${H(lcFirst(m.offer.label))}.`)}</p><div class="sim-row">${btn(L("Accepter", "Accept"), "inbox", { cls: "primary sm", x: m.id, y: "1" })}${btn(L("Décliner", "Decline"), "inbox", { cls: "ghost sm", x: m.id, y: "0" })}</div></div>`).join("")}</div>` : ""}
    <div class="sim-dipgrid"><div>${delegList(true)}</div><div class="sim-detail">${UI.sel && S.dels[UI.sel] && UI.sel !== S.player ? delegDetail(UI.sel, live) : `<p class="sim-mute">${L("Sélectionnez une délégation pour voir ce que vous savez d'elle et engager une démarche.", "Select a delegation to see what you know about it and make a move.")}</p>`}</div></div>
    ${L("<h3>Carte des positions</h3>", "<h3>Position map</h3>")}<p class="sim-mute">${L("Chaque délégation est placée selon ses positions connues sur deux points clés. Les délégations proches de votre ligne sont vos partenaires naturels ; cliquez sur un point pour ouvrir la fiche.", "Each delegation is placed according to its known positions on two key points. Delegations close to your line are your natural partners; click on a dot to open its profile.")}</p>${positionBlock(S)}
    ${L("<h3>Carte du monde</h3>", "<h3>World map</h3>")}${mapBlock(S, ["vote", "rel", "group"], UI.mapMode && UI.mapMode !== "group" ? UI.mapMode : "vote")}
    ${groups.length ? `${L("<h3>Groupes représentés</h3>", "<h3>Groups represented</h3>")}<div class="sim-groups">${groups.map(g => `<div class="sim-group"><b>${H(g.name)}</b><div class="sim-plqs">${g.members.map(c => plq(c, "sm")).join("")}</div>${live ? btn(L("Réunir le groupe · 25 min", "Convene the group · 25 min"), "group", { cls: "ghost sm", x: g.id, dis: !canAct(S, "group") }) : ""}</div>`).join("")}</div>` : ""}
    ${S.deals.length ? `${L("<h3>Accords conclus</h3>", "<h3>Agreements reached</h3>")}<ul class="sim-ul">${S.deals.map(d => `<li>${H(cnm(d.with))}${d.group ? " (" + H(d.group) + ")" : ""}${L(` : ${H(ASKS[d.ask] ? ASKS[d.ask].they : "")} ; vous acceptez ${H(de(lcFirst(d.label)))}.`, `: ${H(ASKS[d.ask] ? ASKS[d.ask].they : "")}; you agree to ${H(lcFirst(d.label))}.`)} <span class="sim-deal ${d.status}">${(LANG === "en" ? { active: "ongoing", broken: "broken", honored: "kept" } : { active: "en cours", broken: "rompu", honored: "tenu" })[d.status] || ""}</span></li>`).join("")}</ul>` : ""}
  </section>`;
}
function delegList(full) {
  const S = G, proj = full ? projection(S) : null;
  const others = sortFr(S.scen.members.filter(c => c !== S.player));
  return `<div class="sim-dels">${others.map(c => {
    const d = S.dels[c], [rl] = relLabel(d.rel), v = proj && d.known.pos ? proj.votes[c] : null;
    return `<button type="button" class="sim-delrow${UI.sel === c ? " on" : ""}" data-a="sel" data-x="${c}" aria-pressed="${UI.sel === c}">${plq(c, "sm")}<span class="sim-rel" title="${L("Relation : ", "Relations: ")}${H(rl.toLowerCase())}">${relMeter(d.rel)}<span class="sr">${L("Relation : ", "Relations: ")}${H(rl.toLowerCase())}</span></span>${full ? `<span class="sim-vchip v-${v || "unk"}">${v ? voteWord(v) : "?"}</span>` : ""}${d.cosponsor ? `${L("<span class=\"sim-tag\">coauteur</span>", "<span class=\"sim-tag\">co-sponsor</span>")}` : ""}</button>`;
  }).join("")}</div>`;
}
function delegDetail(code, live) {
  const S = G, d = S.dels[code], c = COUNTRIES[code], vi = d.known.pos ? voteIntent(S, code) : null;
  const pet = d.known.pet && d.pet && !hasSrc(S, d.pet) ? tplById(S, d.pet) : null;
  const talks = (S.talks || {})[code] || [];
  const blocs = c.blocs.filter(x => BLOC_NAMES[x]).map(x => BLOC_NAMES[x]);
  let panel = "";
  if (live && UI.panel === "persuade") {
    const ax = UI.arg.axis || biggestGap(S, code);
    panel = `<div class="sim-panel">${L("<h4>Quel argument présenter ?</h4>", "<h4>Which argument will you make?</h4>")}<div class="sim-args">${Object.entries(ARGS).map(([k, A]) => `<button type="button" class="sim-arg${UI.arg.key === k ? " on" : ""}" data-a="argKey" data-x="${k}" aria-pressed="${UI.arg.key === k}"><b>${H(A.name)}</b><span>${H(A.desc)}</span></button>`).join("")}</div>
      <label class="sim-lbl" for="sim-argax">${L("Sur quel point ?</label>", "On which point?</label>")}<select id="sim-argax" data-a="argAxis">${issueOf(S).axes.map(a => `<option value="${a}"${a === ax ? " selected" : ""}>${H(AXES[a].name)}</option>`).join("")}</select>
      <div class="sim-row">${btn(L("Présenter l'argument · 15 min", "Make the argument · 15 min"), "persuade", { cls: "primary sm", dis: !UI.arg.key || !canAct(S, "persuade") })}${btn(L("Annuler", "Cancel"), "panel", { cls: "ghost sm", x: "" })}</div></div>`;
  } else if (live && UI.panel === "deal") {
    const offers = dealOffers(S, code), oi = Math.min(UI.deal.offer, offers.length - 1);
    panel = `<div class="sim-panel">${L("<h4>Ce que vous demandez</h4>", "<h4>What you ask for</h4>")}<div class="sim-chips">${Object.entries(ASKS).map(([k, A]) => `<button type="button" class="sim-chip${UI.deal.ask === k ? " on" : ""}" data-a="dealAsk" data-x="${k}" aria-pressed="${UI.deal.ask === k}">${H(A.name)}</button>`).join("")}</div>
      ${L("<h4>Ce que vous offrez</h4>", "<h4>What you offer</h4>")}<div class="sim-offers">${offers.map((o, i) => `<button type="button" class="sim-arg${i === oi ? " on" : ""}" data-a="dealOffer" data-x="${i}" aria-pressed="${i === oi}"><span>${H(o.label)}</span></button>`).join("")}</div>
      <p class="sim-mute">${L("Une promesse non tenue rompt l'accord et dégrade vos relations avec la délégation et ses partenaires.", "A broken promise ends the agreement and damages your relations with the delegation and its partners.")}</p>
      <div class="sim-row">${btn(L("Proposer l'accord · 20 min", "Propose the agreement · 20 min"), "deal", { cls: "primary sm", dis: !canAct(S, "deal") || !offers.length })}${btn(L("Annuler", "Cancel"), "panel", { cls: "ghost sm", x: "" })}</div></div>`;
  }
  const [rl] = relLabel(d.rel);
  return `<div class="sim-dhead">${plq(code)}<span class="sim-mute">${H(groupName(code))}${blocs.length ? " · " + H(blocs.join(", ")) : ""}</span></div>
    <div class="sim-kv"><div>${L("<span class=\"kv-k\">Relation</span>", "<span class=\"kv-k\">Relations</span>")}<span class="kv-v">${relMeter(d.rel)} ${H(rl)} (${d.rel > 0 ? "+" : ""}${d.rel})</span></div><div><span class="kv-k">Influence</span><span class="kv-v">${H(inflLabel(c.infl))}</span></div><div>${L("<span class=\"kv-k\">Vote estimé</span>", "<span class=\"kv-k\">Estimated vote</span>")}<span class="kv-v"><span class="sim-vchip v-${vi ? vi.v : "unk"}">${vi ? voteWord(vi.v) : L("inconnu", "unknown")}</span></span></div><div class="kv-w"><span class="kv-k">Attitude</span><span class="kv-v">${d.known.pet ? H(PERSONALITIES[d.pers].name) + L(" : ", ": ") + H(PERSONALITIES[d.pers].desc) : L("à découvrir en la sondant", "to be discovered by sounding it out")}</span></div></div>
    ${axisBars(S, code)}
    ${pet ? `<p class="sim-pet">${L(`Souhaite voir figurer dans le texte : « ${H(capFirst(clauseText(S, instClausePreview(S, pet))))} ».`, `Would like to see in the text: “${H(capFirst(clauseText(S, instClausePreview(S, pet))))}”.`)}</p>` : ""}
    ${talks.length ? `<div class="sim-talk">${talks.slice(-8).map(t => `<div class="sim-msg ${t.who}"><span>${t.who === "me" ? L("Votre délégation", "Your delegation") : H(cnm(code))} · ${H(t.t)}</span><p>${H(t.text)}</p></div>`).join("")}</div>` : ""}
    ${live ? `<div class="sim-acts">${btn(d.known.pet ? L("Déjà sondée", "Already sounded out") : L("Sonder · 10 min", "Sound out · 10 min"), "probe", { cls: "ghost sm", dis: d.known.pet || !canAct(S, "probe"), title: L("Connaître ses priorités, ses lignes rouges et son vote probable", "Learn its priorities, red lines and likely vote") })}${btn(L("Convaincre · 15 min", "Persuade · 15 min"), "panel", { cls: "ghost sm" + (UI.panel === "persuade" ? " on" : ""), x: "persuade", dis: !canAct(S, "persuade") })}${btn(L("Proposer un accord · 20 min", "Propose an agreement · 20 min"), "panel", { cls: "ghost sm" + (UI.panel === "deal" ? " on" : ""), x: "deal", dis: !canAct(S, "deal") })}${btn(L("Demander le coparrainage · 5 min", "Ask it to co-sponsor · 5 min"), "cosponsor", { cls: "ghost sm", dis: d.cosponsor || !canAct(S, "cosponsor") })}</div>${panel}` : ""}`;
}

/* ---------- Salle de rédaction ---------- */
function splitVerb(S, c) {
  const t = capFirst(clauseText(S, c)).replace(/[;.]\s*$/, "");
  const v = c.form === "raw" ? t.split(" ")[0] : (t.startsWith(vb(c.v)) ? vb(c.v) : t.split(" ")[0]);
  return [v, t.slice(v.length)];
}
function effectsText(S, fx) {
  const issue = issueOf(S), parts = [];
  for (const a of issue.axes) { const v = fx[a] || 0; if (Math.abs(v) >= 0.1) parts.push(v > 0 ? AXES[a].pos : AXES[a].neg); }
  return parts.length ? L("Oriente le texte vers : ", "Moves the text towards: ") + parts.join(", ") : L("Effet limité sur les points clés", "Limited effect on the key points");
}
function tDraft() {
  const S = G, b = bodyOf(S);
  if (S.phase < 4) return `<section class="sim-card">${L("<h2>Salle de rédaction</h2>", "<h2>Drafting room</h2>")}<p>${L("Le projet de texte de votre délégation circulera à l'ouverture des négociations. Vous pourrez alors modifier chaque paragraphe, en ajouter et traiter les amendements des autres délégations.", "Your delegation's draft text will be circulated when the negotiations open. You will then be able to amend each paragraph, add new ones and deal with the other delegations' amendments.")}</p></section>`;
  const edit = S.phase === 4 || S.phase === 5;
  const ops = S.draft.ops, last = ops.length - 1;
  const authors = [S.player].concat(S.draft.cosponsors);
  const doc = `<div class="sim-doc${S.phase === 7 ? (S.vote.t.adopted ? " adopted" : " rejected") : ""}">
    ${S.phase === 7 ? `<div class="sim-stamp">${S.vote.t.adopted ? L("Adopté", "Adopted") : L("Non adopté", "Not adopted")}</div>` : ""}
    <div class="sim-doc-h"><div class="sim-doc-org">${H(b.org === "ONU" ? L("Nations Unies", "United Nations") : L("Organisation des Nations Unies pour l'éducation, la science et la culture", "United Nations Educational, Scientific and Cultural Organization"))}</div><div class="sim-doc-b">${H(b.name.replace(" (session pédagogique)", "").replace(" (teaching session)", ""))}${S.scen.pc ? " · " + H(b.commissions[S.scen.pc]) : ""}</div>
    <div class="sim-doc-t">${H(b.doc || L("Projet de " + b.act, "Draft " + b.act))}</div><div class="sim-doc-a">${authors.map(c => H(cnm(c))).join(", ")}${L(` : projet de ${H(b.act)}`, `: draft ${H(b.act)}`)}</div></div>
    <h3 class="sim-doc-title">${H(S.draft.title)}</h3>
    <p class="sim-doc-head"><i>${H(b.head)}</i>,</p>
    ${S.draft.pre.map(p => { const w = p.txt.split(" "); const k = /^(Préoccupée?|Gravement|Profondément|Conscient|Consciente|Prenant|Ayant|Concerned|Deeply|Gravely|Aware|Taking|Bearing)$/.test(w[0]) && w[1] && /^(par|de|note|à|by|concerned|of|in)$/.test(w[1]) ? 2 : 1; return `<p class="sim-pre"><i>${H(w.slice(0, k).join(" "))}</i> ${H(w.slice(k).join(" "))},</p>`; }).join("")}
    <ol class="sim-ops">${ops.map((c, i) => opItem(S, c, i, i === last, edit)).join("")}</ol>
  </div>`;
  const tools = edit ? draftTools() : "";
  return `<section class="sim-card sim-draftcard">${L("<h2>Salle de rédaction</h2>", "<h2>Drafting room</h2>")}${edit ? `<p class="sim-mute">${L("Le texte vous appartient : modifiez le verbe d'un paragraphe pour en changer la portée, déplacez-le, retirez-le ou ajoutez-en. Sous chaque paragraphe, la barre montre les réactions des délégations dont vous connaissez la position.", "The text is yours: change the verb of a paragraph to change its scope, move it, remove it or add new ones. Under each paragraph, the bar shows the reactions of the delegations whose position you know.")}</p>` : ""}${doc}${tools}</section>`;
}
function opItem(S, c, i, isLast, edit) {
  const [v, rest] = splitVerb(S, c), chk = checkClause(S, c);
  let react = "";
  if (edit && c.form !== "raw" && chk.ok) {
    const r = clauseReactions(S, c), kn = x => x.filter(m => S.dels[m].known.pos);
    const unk = S.scen.members.filter(m => m !== S.player && !S.dels[m].known.pos).length;
    const sup = kn(r.sup), opp = kn(r.opp), mod = kn(r.mod), neu = kn(r.neu);
    const tot = Math.max(1, sup.length + mod.length + neu.length + opp.length + unk);
    const seg = (cls, n) => n ? `<i class="${cls}" style="width:${(n / tot * 100).toFixed(1)}%"></i>` : "";
    const chip = (cls, list, label) => list.length ? `<span class="${cls}" title="${H(list.map(cnm).join(", "))}">${label}${L(" : ", ": ")}${list.length}</span>` : "";
    react = `<div class="sim-op-r"><span class="rb">${seg("r-sup", sup.length)}${seg("r-mod", mod.length)}${seg("r-neu", neu.length)}${seg("r-unk", unk)}${seg("r-opp", opp.length)}</span><span class="rt">${chip("r-sup", sup, L("soutien", "support"))}${chip("r-mod", mod, L("demandes de modification", "requests for changes"))}${chip("r-opp", opp, "opposition")}${chip("r-neu", neu, "abstention")}${unk ? `<span class="r-unk">${L(`${unk} position${unk > 1 ? "s" : ""} inconnue${unk > 1 ? "s" : ""}`, `${unk} unknown position${unk !== 1 ? "s" : ""}`)}</span>` : ""}</span></div>`;
  }
  const verbs = verbsForClause(S, c);
  const tools = edit && c.form !== "raw" ? `<div class="sim-op-t">${verbs.length > 1 ? `<label class="sr" for="sim-v-${c.uid}">${L("Verbe du paragraphe", "Verb of paragraph")} ${i + 1}</label><select id="sim-v-${c.uid}" data-a="verb" data-x="${c.uid}">${verbs.map(x => `<option value="${H(x)}"${x === c.v ? " selected" : ""}>${H(vb(x))}</option>`).join("")}</select>` : ""}${btn(L("Monter", "Move up"), "move", { cls: "ghost xs", x: c.uid, y: "-1", dis: i === 0 })}${btn(L("Descendre", "Move down"), "move", { cls: "ghost xs", x: c.uid, y: "1", dis: isLast || (S.draft.ops[i + 1] && S.draft.ops[i + 1].form === "raw") })}${btn(L("Retirer", "Remove"), "remove", { cls: "ghost xs danger", x: c.uid })}</div>` : "";
  return `<li class="sim-op${chk.ok ? "" : " bad"}"><p><i>${H(v)}</i>${H(rest)}${isLast ? "." : L(" ;", ";")}</p>
    ${!chk.ok ? `<p class="sim-warn">${L("Irrecevable : ", "Inadmissible: ")}${H(chk.why)}${L(" La présidence ne retiendra pas ce paragraphe.", " The chair will not retain this paragraph.")}</p>` : chk.warn ? `<p class="sim-warn soft">${H(chk.warn)}</p>` : ""}
    ${c.by && c.by !== S.player ? `<p class="sim-by">${L("Proposé par la délégation ", "Proposed by the delegation ")}${H(deName(c.by))}</p>` : ""}${tools}${react}</li>`;
}
function draftTools() {
  const S = G, b = bodyOf(S);
  const pend = pendingAmendments(S), done = S.amendments.filter(a => a.status !== "pending");
  const has = id => S.draft.pre.some(p => p.id === id);
  const pre = `<div class="sim-tool">${L("<h3>Préambule</h3>", "<h3>Preamble</h3>")}<div class="sim-chips">${btn(L("Rappel de la souveraineté des États", "Recall State sovereignty"), "pre", { cls: "chip" + (has("sov") ? " on" : ""), x: "sov", pressed: has("sov") })}${btn(L("Appel à la coopération", "Call for cooperation"), "pre", { cls: "chip" + (has("coop") ? " on" : ""), x: "coop", pressed: has("coop") })}${b.id === "UNSC" ? btn(L("Agissant en vertu du Chapitre VII", "Acting under Chapter VII"), "pre", { cls: "chip" + (has("ch7") ? " on" : ""), x: "ch7", pressed: has("ch7") }) : ""}</div></div>`;
  const amend = `<div class="sim-tool"><h3>${L("Amendements", "Amendments")}${pend.length ? L(` en attente (${pend.length})`, ` pending (${pend.length})`) : ""}</h3>${pend.length ? pend.map(a => { const kn = x => (x || []).filter(m => S.dels[m].known.pos).length; return `<div class="sim-amend">${plq(a.by, "sm")}<p>${H(capFirst(amendLabel(S, a)))}.${a.tag === "compromis" ? L(" Proposition de compromis.", " Compromise proposal.") : ""}</p><p class="sim-mute">${L(`Soutiens connus : ${kn(a.sup)} · oppositions connues : ${kn(a.opp)}`, `Known support: ${kn(a.sup)} · known opposition: ${kn(a.opp)}`)}</p>${S.phase >= 4 && S.phase <= 5 ? `<div class="sim-row">${btn(L("Accepter · 5 min", "Accept · 5 min"), "amend", { cls: "primary xs", x: a.id, y: "accept", dis: !canAct(S, "amend") })}${btn(L("Contre-proposer", "Counter-propose"), "amend", { cls: "ghost xs", x: a.id, y: "counter", dis: !canAct(S, "amend") })}${btn(L("Rejeter", "Reject"), "amend", { cls: "ghost xs", x: a.id, y: "reject", dis: !canAct(S, "amend") })}</div>` : ""}</div>`; }).join("") : `<p class="sim-mute">${L("Aucun amendement en attente.", "No pending amendments.")}${S.phase === 4 ? L(" Les délégations en déposeront à l'examen du texte.", " Delegations will table them when the text is examined.") : ""}</p>`}${done.length ? `<details class="sim-done"><summary>${L("Amendements traités", "Amendments dealt with")} (${done.length})</summary><ul class="sim-ul">${done.map(a => `<li>${H(cnm(a.by))}${L(" : ", ": ")}${H((LANG === "en" ? { accepted: "accepted", rejected: "rejected", countered: "compromise found", lapsed: "lapsed", moot: "moot" } : { accepted: "accepté", rejected: "rejeté", countered: "compromis trouvé", lapsed: "devenu caduc", moot: "sans objet" })[a.status] || a.status)}</li>`).join("")}</ul></details>` : ""}</div>`;
  const bank = clauseBank(S).filter(t => t.id !== "g_stay" && !S.draft.ops.some(c => c.src === t.id));
  const add = UI.panel === "add" ? `<div class="sim-panel">${L("<h4>Paragraphes disponibles</h4>", "<h4>Available paragraphs</h4>")}<ul class="sim-bank">${bank.map(t => { const c = instClausePreview(S, t); return `<li><p>${H(capFirst(clauseText(S, c)))}</p><p class="sim-mute">${H((KINDS[effKind(c)] || {}).name || "")} · ${H(effectsText(S, c.fx))}</p>${btn(L("Ajouter", "Add"), "addClause", { cls: "ghost xs", x: t.id })}</li>`; }).join("")}</ul>${btn(L("Fermer", "Close"), "panel", { cls: "ghost sm", x: "" })}</div>` : "";
  const free = UI.panel === "free" ? freeClausePanel() : "";
  const submit = S.phase === 5 ? (UI.confirmVote ? `<div class="sim-confirm"><p>${pend.length ? L(`${pend.length} amendement(s) en attente deviendront caducs, ce que leurs auteurs regretteront. `, `${pend.length} pending amendment(s) will lapse, which their authors will regret. `) : ""}${L("Une fois le texte mis aux voix, il ne pourra plus être modifié.", "Once the text has been put to the vote, it can no longer be changed.")}</p><div class="sim-row">${btn(L("Confirmer la mise aux voix", "Confirm the vote"), "submit", { cls: "primary" })}${btn(L("Continuer l'examen", "Continue the examination"), "confirmVote", { cls: "ghost", x: "0" })}</div></div>` : `<div class="sim-cta">${btn(L("Mettre le texte aux voix", "Put the text to the vote"), "confirmVote", { cls: "primary", x: "1" })}</div>`) : `<p class="sim-mute">${L("Pendant les négociations, vous pouvez modifier librement le texte et traiter les amendements déjà déposés. Les autres délégations déposeront la plupart de leurs amendements à l'examen du texte.", "During the negotiations, you can freely amend the text and deal with the amendments already tabled. The other delegations will table most of their amendments when the text is examined.")}</p>`;
  return `<div class="sim-tools">${amend}${pre}<div class="sim-tool">${L("<h3>Ajouter un paragraphe</h3>", "<h3>Add a paragraph</h3>")}<div class="sim-row">${btn(L("Choisir un paragraphe type", "Choose a standard paragraph"), "panel", { cls: "ghost sm" + (UI.panel === "add" ? " on" : ""), x: UI.panel === "add" ? "" : "add" })}${btn(L("Rédiger un paragraphe", "Write a paragraph"), "panel", { cls: "ghost sm" + (UI.panel === "free" ? " on" : ""), x: UI.panel === "free" ? "" : "free" })}</div>${add}${free}</div>${submit}</div>`;
}
function freeClausePreview() {
  const S = G, v = UI.drafts.fverb || "Encourage", txt = UI.drafts.ftext || "";
  if (!txt.trim()) return `<p class="sim-mute">${L("Choisissez le verbe, puis écrivez la suite du paragraphe. Le simulateur vérifie qu'il relève bien des compétences de l'organe.", "Choose the verb, then write the rest of the paragraph. The simulator checks that it falls within the body's competence.")}</p>`;
  const a = analyzeClause(S, v, txt), c = { uid: "preview", src: "free", k: a.k, form: "free", v, text: txt.trim().replace(/[.;]\s*$/, ""), fx: a.fx };
  const chk = checkClause(S, c);
  return `<div class="sim-analysis"><div>${L("<b>Aperçu</b>", "<b>Preview</b>")} ${H(capFirst(clauseText(S, c)))}</div><div>${L("<b>Nature</b>", "<b>Type</b>")} ${H((KINDS[effKind(c)] || {}).name || "")}${chk.ok ? "" : ` · <span class="sim-bad">${L("irrecevable : ", "inadmissible: ")}${H(chk.why)}</span>`}</div><div>${L("<b>Effet estimé</b>", "<b>Estimated effect</b>")} ${H(effectsText(S, a.fx))}${AI.usable(S) ? L(" (affiné par l'IA à l'ajout)", " (refined by the AI when added)") : ""}</div></div>`;
}
function freeClausePanel() {
  const S = G, verbs = verbsFor(S.bodyId), v = UI.drafts.fverb || "Encourage", txt = UI.drafts.ftext || "";
  const prev = freeClausePreview();
  return `<div class="sim-panel">${L("<h4>Rédiger un paragraphe du dispositif</h4>", "<h4>Write an operative paragraph</h4>")}<div class="sim-free"><label class="sr" ${L("for=\"sim-fverb\">Verbe</label>", "for=\"sim-fverb\">Verb</label>")}<select id="sim-fverb" data-a="fverb">${verbs.map(x => `<option value="${H(x)}"${x === v ? " selected" : ""}>${H(vb(x))}</option>`).join("")}</select>
    <label class="sr" ${L("for=\"sim-ftext\">Suite du paragraphe</label>", "for=\"sim-ftext\">Rest of the paragraph</label>")}<textarea id="sim-ftext" rows="3" data-k="ftext" data-live="clause" ${L("placeholder=\"les États à…\"", "placeholder=\"States to…\"")}>${H(txt)}</textarea></div>
    <div id="sim-live-clause">${prev}</div><div class="sim-row">${btn(UI.busy ? L("Analyse…", "Analysing…") : L("Ajouter au texte", "Add to the text"), "addFree", { cls: "primary sm", dis: !!UI.busy || !txt.trim() })}${btn(L("Fermer", "Close"), "panel", { cls: "ghost sm", x: "" })}</div></div>`;
}

/* ---------- Salle de vote ---------- */
function tVote() {
  const S = G, b = bodyOf(S);
  if (S.phase < 6) return `<section class="sim-card">${L("<h2>Salle de vote</h2>", "<h2>Voting room</h2>")}<p>${L("Le vote aura lieu lorsque vous mettrez le texte aux voix, à l'issue de son examen.", "The vote will take place when you put the text to the vote, once it has been examined.")}</p><p>${L("<b>Règle applicable en l'état :</b>", "<b>Rule applicable as things stand:</b>")} ${H(needRule(S).label)}.</p>${S.phase >= 4 ? `${L("<h3>Si l'on votait maintenant</h3>", "<h3>If the vote were held now</h3>")}${voteDots(S)}` : ""}</section>`;
  if (!S.vote) {
    const me = S.dels[S.player], R = textVec(S), hard = hardBreach(me, R);
    return `<section class="sim-card">${L("<h2>Salle de vote</h2>", "<h2>Voting room</h2>")}<p class="sim-qlead">${H(chairLine(S, "vote"))}</p>
      ${hard ? `<p class="sim-warn">${L("Attention : ce texte franchit l'une des lignes rouges fixées par votre capitale", "Warning: this text crosses one of the red lines set by your capital")} (${H(AXES[hard.axis].name.toLowerCase())}).</p>` : ""}
      ${L("<h3>Si l'on votait maintenant</h3>", "<h3>If the vote were held now</h3>")}${voteDots(S)}
      ${ruleDiagram(S)}
      ${L("<h3>Vote de votre délégation</h3>", "<h3>Your delegation's vote</h3>")}<div class="sim-votebtns">${btn(L("Pour", "In favour"), "vote", { cls: "v-yes", x: "yes" })}${btn(L("Contre", "Against"), "vote", { cls: "v-no", x: "no" })}${btn("Abstention", "vote", { cls: "v-abs", x: "abs" })}</div></section>`;
  }
  const V = S.vote, t = V.t, anim = !V.shown && !reduceMotion();
  const n = V.rollOrder.length;
  const board = `<div class="sim-board${anim ? " anim" : ""}" style="--n:${n}">
    <div class="sim-board-h"><div class="sim-board-t">${H(b.name.replace(" (session pédagogique)", "").replace(" (teaching session)", ""))} · ${L("vote enregistré", "recorded vote")}</div>
      <div class="sim-tallies"><div class="t-yes"><b>${t.yes}</b><span>${L("pour", "in favour")}</span></div><div class="t-no"><b>${t.no}</b><span>${L("contre", "against")}</span></div><div class="t-abs"><b>${t.abs}</b><span>abstentions</span></div></div>
      <div class="sim-board-rule">${H(capFirst(t.rule.label))}</div></div>
    <ul class="sim-lights">${V.rollOrder.map((c, i) => `<li class="v-${V.votes[c]}${c === S.player ? " me" : ""}" style="--i:${i}"><i aria-hidden="true"></i><span>${H(cnm(c))}${S.bodyId === "UNSC" && P5.includes(c) ? "<sup>P</sup>" : ""}</span><em>${voteWord(V.votes[c])}${t.veto.includes(c) ? " (veto)" : ""}</em></li>`).join("")}</ul>
    <div class="sim-result ${t.adopted ? "ok" : "ko"}">${t.adopted ? L("Adopté", "Adopted") : L("Non adopté", "Not adopted")}</div></div>`;
  const checks = [];
  if (t.rule.type === "unsc") {
    checks.push([t.yes >= 9, L(`Voix pour : ${t.yes} sur les 9 requises`, `Votes in favour: ${t.yes} of the 9 required`)]);
    checks.push([!t.veto.length, t.veto.length ? L(`Vote contre d'un membre permanent : ${t.veto.map(cnm).join(", ")}`, `Vote against by a permanent member: ${t.veto.map(cnm).join(", ")}`) : L("Aucun vote contre d'un membre permanent", "No vote against by a permanent member")]);
  } else if (t.rule.type === "23") {
    checks.push([t.yes + t.no > 0 && t.yes >= 2 * t.no, L(`Voix exprimées : ${t.yes + t.no} (les ${t.abs} abstentions ne comptent pas). Deux tiers requis : ${Math.ceil((t.yes + t.no) * 2 / 3)} voix pour au moins ; obtenues : ${t.yes}`, `Votes cast: ${t.yes + t.no} (the ${t.abs} abstentions do not count). Two thirds required: at least ${Math.ceil((t.yes + t.no) * 2 / 3)} votes in favour; obtained: ${t.yes}`)]);
  } else {
    checks.push([t.yes > t.no, L(`Voix exprimées : ${t.yes + t.no} (les ${t.abs} abstentions ne comptent pas). Majorité : plus de voix pour (${t.yes}) que de voix contre (${t.no})`, `Votes cast: ${t.yes + t.no} (the ${t.abs} abstentions do not count). Majority: more votes in favour (${t.yes}) than against (${t.no})`)]);
  }
  const verify = `<div class="sim-verify">${L("<h3>Vérification de la règle</h3>", "<h3>Checking the rule</h3>")}<ul>${checks.map(([ok, txt]) => `<li class="${ok ? "ok" : "no"}"><span class="sim-dot" aria-hidden="true"></span>${H(txt)}${L(" : ", ": ")}<b>${ok ? L("condition remplie", "condition met") : L("condition non remplie", "condition not met")}</b></li>`).join("")}</ul><p class="sim-mute">${L("Règle appliquée : ", "Rule applied: ")}${H(t.rule.label)}${L(". Le résultat est calculé par le simulateur, jamais par l'IA.", ". The result is calculated by the simulator, never by the AI.")}</p></div>`;
  return `<section class="sim-card">${L("<h2>Salle de vote</h2>", "<h2>Voting room</h2>")}${board}<p class="sim-announce">${H(V.announce)}</p>${verify}
    ${camera(S, { compact: true })}${roomLegend(S)}
    ${V.expl.length ? `${L("<h3>Explications de vote</h3>", "<h3>Explanations of vote</h3>")}<div class="sim-expl">${V.expl.map(x => `<div class="sim-sp">${plq(x.code)}<p>${H(x.text)}</p></div>`).join("")}</div>` : ""}
    ${S.phase === 6 ? `<div class="sim-cta">${btn(L("Voir le bilan", "See the debrief"), "finish", { cls: "primary" })}</div>` : ""}</section>`;
}

/* ---------- Chronologie ---------- */
const CAT = { procedure: "Procédure", debate: "Débat", bilateral: "Entretien", coalition: "Groupe", ai: "Initiative", amend: "Texte", vote: "Vote" };

const EN_CAT = { procedure: "Procedure", debate: "Debate", bilateral: "Talks", coalition: "Group", ai: "Initiative", amend: "Text", vote: "Vote" };
LANG_HOOKS.push(() => swapFields(CAT, EN_CAT, keysOf(EN_CAT)));
function tLog() {
  const S = G, by = {};
  for (const e of S.log) (by[e.phase] = by[e.phase] || []).push(e);
  return `<section class="sim-card">${L("<h2>Chronologie de la séance</h2>", "<h2>Timeline of the meeting</h2>")}<p class="sim-mute">${L("Tout ce qui s'est passé, minute par minute, à l'horloge de la séance.", "Everything that happened, minute by minute, by the meeting clock.")}</p>${Object.keys(by).sort((a, b) => a - b).map(ph => `<div class="sim-logph"><h3><span class="s7-n">${ph}</span>${H(PHASES[ph - 1])}</h3><ol class="sim-log">${by[ph].map(e => `<li class="c-${e.cat}"><time>${H(e.t)}</time><span class="sim-logcat">${H(CAT[e.cat] || "")}</span><p>${H(e.text)}</p></li>`).join("")}</ol></div>`).join("")}</section>`;
}

/* ---------- Rendu ---------- */
/* Langue affichée : celle de la partie quand on la joue, sinon celle du site */
const siteLang = () => ctx().lang === "en" ? "en" : "fr";
const viewLang = () => UI.screen === "game" && G ? (G.lang || "fr") : siteLang();
function langNote() {
  if (!(UI.screen === "game" && G) || (G.lang || "fr") === siteLang()) return "";
  return siteLang() === "en"
    ? `<div class="sim-en sim-langnote" role="note" lang="en"><p>This session was opened in French, so it continues in French. To play in English, open a new session.</p>${btn("New session in English", "new", { cls: "ghost sm" })}</div>`
    : `<div class="sim-en sim-langnote" role="note" lang="fr"><p>Cette séance a été ouverte en anglais : elle se poursuit en anglais. Pour jouer en français, ouvrez une nouvelle séance.</p>${btn("Nouvelle séance en français", "new", { cls: "ghost sm" })}</div>`;
}
function inner() {
  setLang(viewLang());
  const en = langNote();
  const flash = UI.flash ? `<div class="sim-flash" role="status">${H(UI.flash)}</div>` : "";
  UI.flash = null;
  const screen = UI.screen === "game" && G ? "game" : UI.screen === "setup" ? "setup" : "home";
  return `<div class="sim-stage s-${screen}">${en}${flash}${screen === "game" ? vGame() : screen === "setup" ? vSetup() : vHome()}</div>`;
}
function rerender() {
  const root = document.getElementById("sim-root");
  if (!root) return;
  const a = document.activeElement, key = a && root.contains(a) ? (a.dataset.k ? "k:" + a.dataset.k : a.id ? "id:" + a.id : null) : null;
  const selStart = a && "selectionStart" in a ? a.selectionStart : null;
  root.innerHTML = inner();
  if (key) {
    const el = key.startsWith("k:") ? root.querySelector(`[data-k="${key.slice(2)}"]`) : document.getElementById(key.slice(3));
    if (el) { el.focus({ preventScroll: true }); if (selStart != null && "setSelectionRange" in el) try { el.setSelectionRange(selStart, selStart); } catch (e) { /* champ sans sélection */ } }
  }
  afterRender(root);
}
function afterRender(root) {
  // sur petit écran, la barre d'onglets défile : l'onglet actif reste visible
  const tabs = root.querySelector(".sim-tabs"), on = tabs && tabs.querySelector("button.on");
  if (on && tabs.scrollWidth > tabs.clientWidth + 4) tabs.scrollLeft += on.getBoundingClientRect().left - tabs.getBoundingClientRect().left - (tabs.clientWidth - on.offsetWidth) / 2;
  // sur petit écran, le plan de la salle défile horizontalement : on le centre
  root.querySelectorAll(".sim-roombox").forEach(b => { if (b.scrollWidth > b.clientWidth + 4 && !b.dataset.c) { b.scrollLeft = (b.scrollWidth - b.clientWidth) / 2; b.dataset.c = "1"; } });
  if (UI.scrollTo) {
    const target = UI.scrollTo === "top" ? root : root.querySelector(UI.scrollTo);
    UI.scrollTo = null;
    if (target) {
      // près du haut de page, on remonte jusqu'en haut : l'en-tête du site change de taille vers 12 px de défilement
      const top = target.getBoundingClientRect().top + window.scrollY - 90;
      const low = window.innerHeight - 130; // la barre « Maintenant » occupe le bas de l'écran
      if (target === root ? window.scrollY > top : (target.getBoundingClientRect().top < 80 || target.getBoundingClientRect().top > low)) window.scrollTo({ top: top < 40 ? 0 : top, behavior: reduceMotion() ? "auto" : "smooth" });
    }
  }
  if (G && G.vote && !G.vote.shown && UI.tab === "vote") { G.vote.shown = true; save(); }
}
function liveUpdate(k) {
  if (k === "speech") { const el = document.getElementById("sim-live-speech"); if (el) el.innerHTML = liveSpeech(); const b = document.querySelector('#sim-root [data-a="speakFree"]'); if (b) b.disabled = !!UI.busy || !(UI.drafts.speech || "").trim(); }
  else if (k === "clause") { rerenderPart("sim-live-clause", freeClausePreview); const b = document.querySelector('#sim-root [data-a="addFree"]'); if (b) b.disabled = !!UI.busy || !(UI.drafts.ftext || "").trim(); }
  else if (k === "countries") { UI.setup.q = UI.drafts.q || ""; const el = document.getElementById("sim-countries"); if (el) el.innerHTML = countryList(); }
}
function rerenderPart(id, f) { const el = document.getElementById(id); if (el) el.innerHTML = f(); }

/* =====================================================================
   ACTIONS DE L'INTERFACE
   Chaque bouton porte data-a (action) et éventuellement data-x / data-y.
   ===================================================================== */
const sleep = ms => new Promise(r => setTimeout(r, ms));
function recentIssues(bodyId) { return LS.get(KEY_HIST, []).filter(h => h.bodyId === bodyId).slice(0, 4).map(h => h.issueId); }
function generateFor(bodyId, pc, player, extraAvoid) {
  setLang(siteLang());
  const genOpts = { seed: (Math.random() * 4294967295) >>> 0, avoid: recentIssues(bodyId).concat(extraAvoid || []), pc: pc || undefined, player };
  const gen = generateScenario(bodyId, genOpts);
  return { gen, genOpts };
}
function setupFromOpts(bodyId, genOpts) {
  setLang(siteLang());
  const gen = generateScenario(bodyId, genOpts);
  UI.setup = { step: 3, bodyId, pc: gen.scen.pc, player: genOpts.player, gen, genOpts, q: "" };
  UI.screen = "setup"; UI.scrollTo = "top";
}
function mySpeechSel(S) { const i = S.speeches.map(s => !!(s.mine && s.kind === "debate")).lastIndexOf(true); return i >= 0 ? "#sim-sp-" + i : null; }
function goTab(k) { UI.tab = k; UI.panel = null; UI.confirmVote = false; }
function phaseChanged() { goTab(defaultTab(G.phase)); UI.scrollTo = "top"; }

async function act(a, x, y) {
  setLang(viewLang());
  const S = G;
  switch (a) {
    /* --- accueil et préparation --- */
    case "home": UI.screen = "home"; UI.scrollTo = "top"; break;
    case "new":
      if (G && G.phase < 7) UI.flash = siteLang() === "en" ? "Your current game will be replaced when you open a new meeting." : "Votre partie en cours sera remplacée lorsque vous ouvrirez une nouvelle séance.";
      UI.screen = "setup"; UI.setup = { step: 1, bodyId: null, pc: null, player: null, gen: null, q: "" }; UI.scrollTo = "top"; break;
    case "resume": if (G) { UI.screen = "game"; UI.tab = G.uiTab || defaultTab(G.phase); UI.scrollTo = "top"; } break;
    case "abandon": G = null; LS.del(KEY_CUR); break;
    case "clearHist": LS.del(KEY_HIST); break;
    case "replay": { const h = LS.get(KEY_HIST, []).find(e => e.id === x); if (h && h.genOpts && BODIES[h.bodyId]) setupFromOpts(h.bodyId, h.genOpts); break; }
    case "replayCur": if (G && G.genOpts) setupFromOpts(G.bodyId, G.genOpts); break;
    case "setupStep": {
      const n = Number(x);
      if (n === 2 && !UI.setup.bodyId) break;
      if (n === 3 && !UI.setup.player) break;
      UI.setup.step = n; UI.scrollTo = "top"; break;
    }
    case "pickBody":
      UI.setup.bodyId = x;
      if (x !== "UNESCO_PC") { UI.setup.pc = null; UI.setup.step = 2; UI.setup.q = ""; UI.drafts.q = ""; UI.scrollTo = "top"; }
      else UI.scrollTo = ".sim-pcpick";
      break;
    case "pickPc": UI.setup.pc = x; UI.setup.step = 2; UI.setup.q = ""; UI.drafts.q = ""; UI.scrollTo = "top"; break;
    case "pickCountry": {
      const list = eligible(UI.setup.bodyId);
      const code = x === "__random" ? list[Math.floor(Math.random() * list.length)] : x;
      if (!COUNTRIES[code]) break;
      const { gen, genOpts } = generateFor(UI.setup.bodyId, UI.setup.pc, code);
      Object.assign(UI.setup, { player: code, gen, genOpts, step: 3 }); UI.scrollTo = "top"; break;
    }
    case "reroll": {
      const { gen, genOpts } = generateFor(UI.setup.bodyId, UI.setup.pc, UI.setup.player, [UI.setup.gen.scen.issueId]);
      Object.assign(UI.setup, { gen, genOpts }); break;
    }
    case "start": {
      const st = UI.setup;
      if (!st.gen || !st.player) break;
      if (st.gen.scen.lang && st.gen.scen.lang !== LANG && st.genOpts) st.gen = generateScenario(st.bodyId, st.genOpts);
      G = newGame(st.gen, st.player); G.genOpts = st.genOpts;
      UI.screen = "game"; UI.sel = null; UI.drafts = {}; UI.speakMode = "opts"; goTab("room"); UI.scrollTo = "top";
      break;
    }
    /* --- navigation --- */
    case "tab": goTab(x); UI.scrollTo = ".sim-tabs"; break;
    case "jump": UI.scrollTo = x; break;
    case "pause": if (S) { S.seen = S.seen || {}; S.seen[S.phase] = x === "1"; } break;
    case "mapMode": UI.mapMode = x; break;
    case "pmAxis": { const issue = issueOf(S), me = S.dels[S.player], def = issue.axes.slice().sort((a, b) => me.w[b] - me.w[a]); const cur = UI.pm || [def[0], def[1]]; cur[Number(x) || 0] = y; if (cur[0] === cur[1]) cur[1 - (Number(x) || 0)] = def.find(a => a !== y); UI.pm = cur; break; }
    case "seat": case "mapsel": {
      if (!S || !S.dels[x]) break;
      if (x === S.player) { toast(L("Votre délégation : ", "Your delegation: ") + cnm(x) + "."); break; }
      if (S.phase === 3 || (S.phase <= 2 && UI.tab === "room")) {
        const i = S.speeches.map(sp => sp.code === x && sp.kind === "debate").lastIndexOf(true);
        if (i >= 0) { goTab("room"); UI.scrollTo = "#sim-sp-" + i; }
        else toast(L(`${cnm(x)} (${groupName(x)}) n'a pas encore pris la parole.`, `${cnm(x)} (${groupName(x)}) has not yet taken the floor.`));
        break;
      }
      if (S.phase >= 4) { UI.sel = x; UI.panel = null; goTab("diplo"); UI.scrollTo = ".sim-detail"; break; }
      toast(`${cnm(x)} · ${groupName(x)}`);
      break;
    }
    /* --- phases 1 à 3 --- */
    case "brief": startBriefing(S); phaseChanged(); break;
    case "orient": chooseOrientation(S, x); phaseChanged(); break;
    case "next": await speakNext(); return;
    case "toMe": debateToMe(S); UI.scrollTo = ".sim-myturn"; break;
    case "toEnd": { let n = 0; while (!debateOver(S) && !isMyTurn(S) && n++ < 40) debateNext(S); UI.scrollTo = ".sim-feed > :last-child"; break; }
    case "speakMode": UI.speakMode = x === "free" ? "free" : "opts"; break;
    case "speakOpt": playerSpeak(S, { optionId: x }); UI.scrollTo = mySpeechSel(S); break;
    case "speakFree": await speakFree(); return;
    case "react": {
      if (!react(S, x, y)) break;
      const qi = S.speeches.findIndex(s => s.about === x && s.mine);
      const last = qi >= 0 ? S.speeches[qi + 1] : null;
      UI.scrollTo = qi >= 0 ? `#sim-sp-${qi + 1}` : null;
      if (y === "clarify" && AI.usable(S) && last && last.kind === "reply") {
        last.pending = true; UI.busy = "reply"; save(); rerender();
        const paras = await AI.rewrite(S, last, "reply");
        if (paras) { last.paras = paras; last.ai = true; }
        delete last.pending; UI.busy = null;
      }
      break;
    }
    case "endDebate": endDebate(S); UI.sel = null; phaseChanged(); UI.flash = L("Votre avant-projet circule parmi les délégations. Consultez-le dans la salle de rédaction.", "Your preliminary draft is circulating among the delegations. You can read it in the drafting room."); break;
    /* --- phases 4 et 5 : négociations --- */
    case "sel": UI.sel = x; UI.panel = null; UI.arg = { key: null, axis: null }; UI.deal = { ask: "vote", offer: 0 }; if (window.innerWidth < 900) UI.scrollTo = ".sim-detail"; break;
    case "panel": UI.panel = x || null; break;
    case "argKey": UI.arg.key = x; break;
    case "argAxis": UI.arg.axis = y; break;
    case "dealAsk": UI.deal.ask = x; break;
    case "dealOffer": UI.deal.offer = Number(x) || 0; break;
    case "probe": if (UI.sel) { const r = doProbe(S, UI.sel); if (!r.ok) toast(L("Il ne vous reste plus assez de temps pour cette démarche.", "You no longer have enough time for this move.")); UI.scrollTo = ".sim-talk"; } break;
    case "persuade": if (UI.sel && UI.arg.key) { const r = doPersuade(S, UI.sel, UI.arg.key, UI.arg.axis || biggestGap(S, UI.sel)); if (r.reason === "time") toast(L("Il ne vous reste plus assez de temps pour cette démarche.", "You no longer have enough time for this move.")); UI.panel = null; UI.scrollTo = ".sim-talk"; } break;
    case "deal": if (UI.sel) { const offers = dealOffers(S, UI.sel), o = offers[Math.min(UI.deal.offer, offers.length - 1)]; if (o) { const r = doDeal(S, UI.sel, UI.deal.ask, o); if (r.reason === "time") toast(L("Il ne vous reste plus assez de temps pour cette démarche.", "You no longer have enough time for this move.")); } UI.panel = null; UI.scrollTo = ".sim-talk"; } break;
    case "cosponsor": if (UI.sel) { const r = doCosponsor(S, UI.sel); if (r.reason === "time") toast(L("Il ne vous reste plus assez de temps pour cette démarche.", "You no longer have enough time for this move.")); UI.scrollTo = ".sim-talk"; } break;
    case "consult": { const r = doConsult(S); toast(r.ok ? L("Consultations tenues : toutes les positions sont désormais connues.", "Consultations held: all positions are now known.") : L("Il ne vous reste plus assez de temps pour des consultations ouvertes.", "You no longer have enough time for open consultations.")); break; }
    case "group": { const r = doGroup(S, x, null); if (r.reason === "time") toast(L("Il ne vous reste plus assez de temps pour réunir ce groupe.", "You no longer have enough time to convene this group.")); else toast(r.ok ? L(`Réunion fructueuse : ${r.won.length} délégation(s) soutiennent désormais votre texte.`, `Successful meeting: ${r.won.length} delegation(s) now support your text.`) : L("Pas de majorité au sein du groupe pour soutenir votre texte.", "There is no majority within the group to support your text.")); break; }
    case "inbox": decideInbox(S, x, y === "1"); break;
    case "endNego": endNegotiations(S); phaseChanged(); break;
    /* --- texte --- */
    case "verb": setVerb(S, x, y); break;
    case "move": moveClause(S, x, Number(y)); break;
    case "remove": removeClause(S, x); break;
    case "pre": togglePre(S, x); break;
    case "addClause": addClause(S, x); UI.panel = null; UI.scrollTo = ".sim-ops > :nth-last-child(2)"; break;
    case "fverb": UI.drafts.fverb = y; break;
    case "addFree": await addFree(); return;
    case "amend": { const r = doAmend(S, x, y); if (!r.ok) toast(L("Il ne vous reste plus assez de temps pour examiner cet amendement.", "You no longer have enough time to examine this amendment.")); break; }
    case "confirmVote": UI.confirmVote = x === "1"; break;
    case "submit": submitToVote(S); UI.confirmVote = false; phaseChanged(); break;
    /* --- vote et bilan --- */
    case "vote": castVote(S, x); S.vote.shown = false; goTab("vote"); UI.scrollTo = ".sim-board"; break;
    case "finish": if (finishGame(S)) { pushHistory(S); phaseChanged(); } break;
    default: return;
  }
  save();
  rerender();
}
async function speakNext() {
  const S = G, sp = debateNext(S);
  if (!sp) { save(); rerender(); return; }
  UI.scrollTo = `#sim-sp-${S.speeches.indexOf(sp)}`;
  if (AI.usable(S)) {
    sp.pending = true; UI.busy = "speech"; save(); rerender();
    const paras = await AI.rewrite(S, sp, "debate");
    if (paras) { sp.paras = paras; sp.ai = true; }
    delete sp.pending; UI.busy = null;
  }
  save(); rerender();
}
async function speakFree() {
  const S = G, txt = (UI.drafts.speech || "").trim();
  if (!txt || !isMyTurn(S)) return;
  const a = analyzeSpeech(S, txt);
  if (AI.usable(S)) {
    UI.busy = "classify"; rerender();
    const r = await AI.classifySpeech(S, txt);
    if (r) {
      Object.assign(a.stance, r.stance);
      if (r.quality != null) a.quality = r2(clamp(0.5 * a.quality + 0.5 * r.quality, 0.15, 0.95));
      if (r.notes.length) a.notes = r.notes.concat(a.rude ? [L("ton jugé agressif", "tone deemed aggressive")] : []);
    }
    UI.busy = null;
  }
  playerSpeak(S, { free: txt, analysis: a });
  UI.drafts.speech = ""; UI.scrollTo = mySpeechSel(S);
  save(); rerender();
}
async function addFree() {
  const S = G, v = UI.drafts.fverb || "Encourage", txt = (UI.drafts.ftext || "").trim();
  if (!txt) return;
  const a = analyzeClause(S, v, txt);
  if (AI.usable(S)) {
    UI.busy = "clause"; rerender();
    const r = await AI.classifyClause(S, v, txt);
    if (r && Object.keys(r.fx).length) a.fx = r.fx;
    UI.busy = null;
  }
  addFreeClause(S, v, txt, a.k, a.fx);
  UI.drafts.ftext = ""; UI.panel = null; UI.scrollTo = ".sim-ops > :nth-last-child(2)";
  save(); rerender();
}

/* ---------- Écouteurs (un seul jeu, délégué au document) ---------- */
function onClick(e) {
  const el = e.target.closest("[data-a]");
  if (!el || el.tagName === "SELECT" || !el.closest("#sim-root") || el.disabled) return;
  e.preventDefault();
  act(el.dataset.a, el.dataset.x, el.dataset.y).catch(err => { UI.busy = null; console.error("[simulateur]", err); toast(L("Une erreur est survenue. La partie a été sauvegardée.", "An error occurred. The game has been saved.")); rerender(); });
}
function onChange(e) {
  const el = e.target;
  if (el.tagName !== "SELECT" || !el.dataset.a || !el.closest("#sim-root")) return;
  act(el.dataset.a, el.dataset.x, el.value).catch(err => console.error("[simulateur]", err));
}
function onKey(e) {
  if (e.key !== "Enter" && e.key !== " ") return;
  const el = e.target.closest && e.target.closest('[data-a][role="button"]');
  if (!el || el.tagName === "BUTTON" || !el.closest("#sim-root")) return;
  e.preventDefault();
  act(el.dataset.a, el.dataset.x, el.dataset.y).catch(err => console.error("[simulateur]", err));
}
function onInput(e) {
  const el = e.target;
  if (!el.dataset || !el.dataset.k || !el.closest("#sim-root")) return;
  UI.drafts[el.dataset.k] = el.value;
  if (el.dataset.live) liveUpdate(el.dataset.live);
}

/* =====================================================================
   STYLES (injectés une seule fois, tous préfixés par .sim)
   Version 1.1 : une scène sombre, « la salle de nuit », inspirée des pages
   de données de 1 sur 8 milliards : chiffres en grand dans un caractère à
   empattements (Newsreader), repères à chasse fixe (IBM Plex Mono), une
   seule couleur d'action (l'or de SOMUN) et deux couleurs de vote
   (pour, contre). Le texte courant garde la police du site.
   ===================================================================== */
const SIM_CSS = `
.sim{
  --n0:#0b1024;--n1:#131b38;--n2:#1a2349;--n3:#232d5a;
  --ln:#2a3460;--ln2:#1e264b;
  --tx:#e7eaf6;--tx2:#b3b9d6;--tx3:#8a92b8;
  --gold:#ebc000;--gold2:#ffd84a;--gold-ink:#171300;--gold-s:rgba(235,192,0,.14);
  --pour:#4cc0af;--contre:#f2788d;--abst:#a7abcf;--inc:#4a5383;
  --pour-s:rgba(76,192,175,.15);--contre-s:rgba(242,120,141,.15);--abst-s:rgba(167,171,207,.14);
  --warn:#f0b84c;--link:#b4c0ff;
  --fd:"Newsreader",Georgia,"Times New Roman",serif;
  --fm:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  --ft:var(--f-texte,"Poppins",system-ui,sans-serif);
  position:relative;color:var(--tx);background:var(--n0);
  margin:0 calc(50% - 50vw) -48px;padding:34px 0 64px;
  background-image:radial-gradient(900px 420px at 85% -120px,rgba(90,110,220,.22),transparent 70%),radial-gradient(700px 380px at -10% 10%,rgba(235,192,0,.06),transparent 70%);
  font:400 15px/1.62 var(--ft);-webkit-font-smoothing:antialiased;color-scheme:dark
}
.sim *{box-sizing:border-box}
.sim-stage{max-width:1200px;margin:0 auto;padding:0 22px}
.sim h1,.sim h2,.sim h3,.sim h4{color:var(--tx);font-family:var(--fd);letter-spacing:0;display:block}
.sim h2::before{display:none}
.sim h1{font-weight:700;font-size:clamp(30px,4.2vw,46px);line-height:1.08;margin:6px 0 10px}
.sim h2{font-weight:600;font-size:clamp(21px,2.4vw,26px);line-height:1.2;margin:34px 0 12px}
.sim h3{font-weight:600;font-size:17.5px;line-height:1.3;margin:20px 0 6px}
.sim h4{font-family:var(--ft);font-weight:600;font-size:14px;margin:6px 0 8px;color:var(--tx2)}
.sim p{margin:8px 0}
.sim b{color:inherit}
.sim .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.sim a{color:var(--link)}
.sim-kick{display:block;font:500 12.5px/1.4 var(--fm);color:var(--pour);letter-spacing:.01em;margin:0 0 4px}
.sim-lead{color:var(--tx2);font-size:16.5px;max-width:66ch;margin:6px 0 18px}
.sim-mute{color:var(--tx3);font-size:13.5px}
.sim-fine{color:var(--tx3);font-size:12.5px;margin-top:26px;max-width:76ch}
.sim-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.sim-cta{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:20px 0 6px}
.sim-en,.sim-flash{padding:10px 14px;border-radius:12px;margin:0 0 16px;font-size:14px}
.sim-en{background:var(--gold-s);color:var(--gold2)}
.sim-langnote{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px}.sim-langnote p{margin:0;flex:1 1 260px}
.sim-flash{background:var(--n2);border:1px solid var(--ln);color:var(--tx)}
.sim-ul{margin:6px 0 10px;padding-left:20px}
.sim-ul li{margin:4px 0}
.sim-ul li::marker{color:var(--tx3)}
.sim-ul.ok li::marker{color:var(--pour)}.sim-ul.ko li::marker{color:var(--contre)}
.sim-count{font:500 12.5px var(--fm);color:var(--tx3);margin-left:6px;vertical-align:2px}

/* Boutons */
.sim-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1.5px solid var(--ln);background:transparent;color:var(--tx);padding:9px 18px;border-radius:99px;font:600 14px/1.25 var(--ft);cursor:pointer;transition:background .15s,border-color .15s,color .15s,transform .1s}
.sim-btn:hover{border-color:var(--tx3);background:rgba(255,255,255,.04)}
.sim-btn:active{transform:scale(.97)}
.sim-btn:focus-visible,.sim button:focus-visible,.sim select:focus-visible,.sim textarea:focus-visible,.sim input:focus-visible,.sim [role=button]:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
.sim-btn.primary{background:var(--gold);border-color:var(--gold);color:var(--gold-ink)}
.sim-btn.primary:hover{background:var(--gold2);border-color:var(--gold2);box-shadow:0 6px 22px -8px rgba(235,192,0,.6)}
.sim-btn.ghost{border-color:var(--ln);color:var(--tx)}
.sim-btn.ghost:hover{border-color:var(--tx2)}
.sim-btn.ghost.on{border-color:var(--gold);background:var(--gold-s);color:var(--gold2)}
.sim-btn.lg{padding:13px 28px;font-size:16px}
.sim-btn.sm{padding:6px 13px;font-size:13px}
.sim-btn.xs{padding:3px 10px;font-size:12px;border-width:1px}
.sim-btn.link{border:0;background:none;padding:0;color:var(--tx2);font-weight:500;text-decoration:underline;text-underline-offset:3px}
.sim-btn.link:hover{color:var(--tx)}
.sim-btn.danger{color:var(--contre)}
.sim-btn.danger:hover{border-color:var(--contre);background:var(--contre-s)}
.sim-btn:disabled{opacity:.4;cursor:default;transform:none;box-shadow:none}
.sim-btn.chip,.sim-chip{border:1px solid var(--ln);background:var(--n1);color:var(--tx);padding:6px 13px;border-radius:99px;font:500 13px/1.3 var(--ft);cursor:pointer}
.sim-btn.chip:hover,.sim-chip:hover{border-color:var(--tx3)}
.sim-btn.chip.on,.sim-chip.on{background:var(--gold-s);border-color:var(--gold);color:var(--gold2)}
.sim-chip.sm{padding:2px 9px;font-size:12px;cursor:default;margin:2px 4px 2px 0;display:inline-block}
.sim-chips{display:flex;flex-wrap:wrap;gap:6px}
.sim-tag{display:inline-block;font:500 11.5px/1.4 var(--fm);padding:2px 8px;border-radius:6px;background:var(--n2);color:var(--tx2);border:1px solid var(--ln);vertical-align:2px;white-space:nowrap}
.sim-tag.gold{background:var(--gold-s);border-color:rgba(235,192,0,.4);color:var(--gold2)}
.sim-badge{display:inline-grid;place-items:center;min-width:18px;height:18px;padding:0 5px;margin-left:6px;border-radius:99px;background:var(--contre);color:#2a0a10;font:700 11px/1 var(--ft)}

/* Plaques nominatives : blanches, comme dans les salles de l'ONU */
.sim-plq{display:inline-flex;align-items:center;font:700 11.5px/1.2 var(--ft);text-transform:uppercase;letter-spacing:.07em;color:#141a3a;background:#f4f5fb;border-radius:3px;padding:4px 8px 3px;border-bottom:3px solid #5865b8;white-space:nowrap}
.sim-plq.me{background:var(--gold);border-bottom-color:#8a6d00;color:var(--gold-ink)}
.sim-plq.sm{font-size:10.5px;padding:3px 7px 2px}
.sim-plqs{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}

/* Accueil */
.sim-hero{display:grid;gap:26px;align-items:center;padding:10px 0 8px}
.sim .h-title{font:700 clamp(44px,7.2vw,96px)/.95 var(--fd);letter-spacing:-.02em;margin:8px 0 18px;white-space:nowrap}
.sim .h-title em{font-style:italic;color:var(--gold);font-weight:600;padding-right:.04em}
.h-lead{font-size:18px;line-height:1.6;color:var(--tx);max-width:56ch;margin:0 0 10px}
.h-lead2{font:italic 500 19px/1.5 var(--fd);color:var(--tx2);max-width:52ch;margin:14px 0 4px}
.h-art{margin:0;background:linear-gradient(180deg,var(--n1),rgba(19,27,56,.4));border:1px solid var(--ln);border-radius:22px;padding:24px 22px 18px}
.sim-herodots{width:100%;height:auto;display:block}
.sim-herodots .hd{fill:#2b3566}
.sim-herodots .hd.c{fill:#c7ccf0}
.sim-herodots .hd.me{fill:var(--gold);filter:drop-shadow(0 0 6px rgba(235,192,0,.8))}
.h-art figcaption{display:flex;flex-wrap:wrap;gap:6px 18px;margin-top:16px;font:500 12.5px/1.4 var(--fm);color:var(--tx2)}
.h-art figcaption span{display:inline-flex;align-items:center;gap:7px}
.hd-k{width:9px;height:9px;border-radius:50%;background:#2b3566;display:inline-block}
.hd-k.c{background:#c7ccf0}.hd-k.me{background:var(--gold)}
.sim-mode{font-size:13px;color:var(--tx3);display:inline-flex;align-items:center;gap:7px}
.sim-mode::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--tx3);flex:none}
.sim-mode.on::before{background:var(--pour);box-shadow:0 0 8px var(--pour)}
.sim-resume{display:flex;flex-direction:column;align-items:flex-start;gap:3px;border:1px solid rgba(235,192,0,.45);background:linear-gradient(120deg,var(--gold-s),transparent 75%);border-radius:16px;padding:16px 18px 14px;margin:24px 0 12px;max-width:560px}
.sim-resume b{font:600 21px/1.25 var(--fd);color:var(--tx)}
.sim-resume .sim-row{margin-top:10px;align-items:center}
.sim-how .how-grid{display:grid;gap:12px}
.sim-how .how-grid>div{border-top:1px solid var(--ln);padding:12px 0 2px}
.sim-how h3{margin:0 0 6px;font-size:19px}
.sim-how p{color:var(--tx2);margin:0}
.sim-phases{list-style:none;padding:0;margin:0;display:grid;gap:8px}
.sim-phases li{display:grid;grid-template-columns:38px 1fr;column-gap:12px;align-items:start;background:var(--n1);border:1px solid var(--ln2);border-radius:14px;padding:12px 14px}
.s7-n{grid-row:span 2;width:30px;height:30px;border-radius:50%;border:1.5px solid var(--ln);display:inline-grid;place-items:center;font:500 13px/1 var(--fm);color:var(--tx2)}
.sim-phases b{font:600 17px/1.3 var(--fd)}
.sim-phases span:not(.s7-n){color:var(--tx3);font-size:13.5px}
.sim-hist{display:grid;gap:10px}
.hist-c{display:flex;flex-direction:column;gap:5px;background:var(--n1);border:1px solid var(--ln2);border-radius:16px;padding:14px 16px}
.hist-c>b{font:600 18px/1.25 var(--fd)}
.hist-c .sim-kick{color:var(--tx3);margin:0}
.hist-c .sim-btn{align-self:flex-start;margin-top:4px}
.hist-r{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:6px}
.sim-res{font-size:13px;font-weight:600}
.sim-res.ok{color:var(--pour)}.sim-res.ko{color:var(--contre)}
.sim-hist-score{font:700 26px/1 var(--fd)}
.sim-hist-score small{font:500 12px var(--fm);color:var(--tx3);margin-left:2px}
.sim-mt{display:flex;height:6px;border-radius:99px;overflow:hidden;background:var(--n3);margin:4px 0 2px}
.sim-mt i{display:block;height:100%}
.sim-mt .v-yes{background:var(--pour)}.sim-mt .v-no{background:var(--contre)}.sim-mt .v-abs{background:var(--abst)}

/* Préparation */
.sim-crumbs{list-style:none;display:flex;gap:6px 14px;padding:0;margin:0 0 16px;font:500 13px var(--fm);color:var(--tx3);flex-wrap:wrap}
.sim-crumbs li{display:flex;align-items:center;gap:7px}
.cr-n{width:22px;height:22px;border-radius:50%;border:1px solid var(--ln);display:inline-grid;place-items:center;font-size:11.5px}
.sim-crumbs li.on{color:var(--tx)}
.sim-crumbs li.on .cr-n{background:var(--gold);border-color:var(--gold);color:var(--gold-ink)}
.sim-crumbs li.done .cr-n{border-color:var(--pour);color:var(--pour)}
.sim-crumbs button{border:0;background:none;color:var(--link);text-decoration:underline;text-underline-offset:3px;cursor:pointer;font:inherit;padding:0}
.sim .sim-org-h{font:500 13px var(--fm);color:var(--pour);margin:26px 0 10px}
.sim-bodies{display:grid;gap:10px}
.sim-body{display:flex;flex-direction:column;gap:6px;text-align:left;border:1px solid var(--ln);background:var(--n1);border-radius:16px;padding:15px 16px 14px;cursor:pointer;font:inherit;color:inherit;transition:border-color .15s,background .15s,transform .15s}
.sim-body:hover{border-color:var(--tx3);background:var(--n2)}
.sim-body.on{border-color:var(--gold);background:var(--gold-s)}
.sim-body-n{font:600 19px/1.2 var(--fd);color:var(--tx)}
.sim-body-d{font-size:13.5px;color:var(--tx2)}
.sim-body-m{font:500 12px var(--fm);color:var(--tx3)}
.sim-body-v{font-size:12.5px;color:var(--gold2)}
.sim-seatd{display:grid;grid-template-columns:repeat(var(--c),1fr);gap:3px;max-width:290px;margin:4px 0 0}
.sim-seatd i{aspect-ratio:1;border-radius:50%;background:#4a5590;max-width:12px}
.sim-seatd i.p5{background:#c7ccf0;box-shadow:0 0 0 1.5px var(--n1),0 0 0 2.5px #c7ccf0}
.sim-seatn{display:flex;align-items:baseline;gap:8px;margin:2px 0 0}
.sim-seatn b{font:700 34px/1 var(--fd)}
.sim-seatn span{font-size:12.5px;color:var(--tx3)}
.sim-ruleg{position:relative;height:6px;border-radius:99px;background:var(--n3);margin:8px 0 2px}
.sim-ruleg i{position:absolute;left:0;top:0;bottom:0;border-radius:inherit;background:linear-gradient(90deg,rgba(235,192,0,.35),var(--gold))}
.sim-ruleg span{position:absolute;top:-4px;bottom:-4px;width:2px;margin-left:-1px;background:var(--tx)}
.sim-pcpick{margin:16px 0;padding:14px 16px;border-radius:14px;background:var(--n1);border:1px solid var(--ln)}
.sim-search{margin:4px 0 8px}
.sim-search input{flex:1;min-width:200px}
.sim-cgroup h3{font:500 13px var(--ft);color:var(--tx2);margin:18px 0 8px;display:flex;align-items:center;gap:8px}
.sim-gdot{width:9px;height:9px;border-radius:50%;display:inline-block}
.sim-countries{display:flex;flex-wrap:wrap;gap:6px}
.sim-country{border:1px solid var(--ln);background:var(--n1);border-radius:10px;padding:7px 12px;font:500 14px/1.2 var(--ft);cursor:pointer;color:var(--tx);display:flex;flex-direction:column;align-items:flex-start}
.sim-country small{font:500 10.5px var(--fm);color:var(--gold2);margin-top:2px}
.sim-country:hover{border-color:var(--gold);background:var(--gold-s)}
.sim .sc-title{font-size:clamp(32px,4.6vw,52px);max-width:22ch}
.sc-who{font-size:17px;color:var(--tx);margin:0 0 4px}
.sc-lead{font:italic 500 19px/1.5 var(--fd);color:var(--tx2)}
.sim-cols{display:grid;gap:4px 34px}
.sim-qlead{font:500 19px/1.5 var(--fd);color:var(--tx)}

/* Fiches chiffrées */
.sim-stats{display:grid;gap:10px;margin:16px 0 8px}
.sim-stat{display:flex;flex-direction:column;gap:4px;background:var(--n1);border:1px solid var(--ln);border-radius:14px;padding:14px 16px 12px}
.st-k{font-size:13px;color:var(--tx2);line-height:1.4}
.sim-stat b{font:700 34px/1.05 var(--fd);color:var(--tx);font-variant-numeric:lining-nums}
.st-src{font:400 11.5px var(--fm);color:var(--tx3);margin-top:auto;padding-top:4px}

/* Partie : en-tête, étapes, salles */
.sim-mast{padding:2px 0 14px}
.m-top{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;font:500 12.5px var(--fm);color:var(--tx3)}
.m-org{color:var(--pour)}
.m-clock{margin-left:auto;font:600 15px var(--fm);color:var(--tx);background:var(--n1);border:1px solid var(--ln);border-radius:8px;padding:3px 10px}
.sim .m-title{font-size:clamp(26px,3.6vw,40px);margin:10px 0 10px;max-width:30ch}
.m-me{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;font-size:14px;color:var(--tx2)}
.m-of{font:500 12.5px var(--fm);color:var(--tx3)}
.m-me .sim-btn.link{margin-left:auto}
.sim-rail{list-style:none;display:flex;padding:0;margin:8px 0 14px;position:relative}
.sim-rail::before,.sim-rail::after{content:"";position:absolute;top:13px;left:13px;height:2px;border-radius:2px}
.sim-rail::before{right:13px;background:var(--ln)}
.sim-rail::after{width:calc((100% - 26px) * var(--p));background:linear-gradient(90deg,var(--pour),var(--gold))}
.sim-rail li{flex:1;display:flex;flex-direction:column;align-items:flex-start;gap:6px;min-width:0;position:relative;z-index:1}
.sim-rail li:last-child{flex:0 0 auto;align-items:flex-end}
.sim-rail .n{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font:500 12px/1 var(--fm);border:1.5px solid var(--ln);color:var(--tx3);background:var(--n0)}
.sim-rail .l{font-size:12.5px;color:var(--tx3);white-space:nowrap}
.sim-rail li.done .n{border-color:var(--pour);color:var(--pour)}
.sim-rail li.done .l{color:var(--tx2)}
.sim-rail li.on .n{background:var(--gold);border-color:var(--gold);color:var(--gold-ink);box-shadow:0 0 0 5px rgba(235,192,0,.16)}
.sim-rail li.on .l{color:var(--tx);font-weight:600}
.sim-tabs{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;scroll-margin-top:80px;padding:4px;background:var(--n1);border:1px solid var(--ln);border-radius:14px}
.sim-tabs::-webkit-scrollbar{display:none}
.sim-tabs button{border:0;background:none;padding:9px 14px;font:500 14px/1.2 var(--ft);color:var(--tx2);cursor:pointer;white-space:nowrap;display:flex;align-items:center;border-radius:10px;transition:background .15s,color .15s}
.sim-tabs button:hover{color:var(--tx);background:rgba(255,255,255,.04)}
.sim-tabs button.on{color:var(--tx);background:var(--n3);box-shadow:inset 0 -2px 0 var(--gold)}
.sim-layout{display:grid;gap:18px}
.sim-layout.wide{grid-template-columns:minmax(0,1fr)}
.sim-layout.wide .sim-card p:not(.ln-say),.sim-layout.wide .sim-ul li,.sim-layout.wide .sim-pause p{max-width:78ch}
.sim-layout.wide .sim-ln{max-width:820px}
.sim-main{min-width:0}
.sim-aside{display:none}
.sim-card{background:var(--n1);border:1px solid var(--ln);border-radius:20px;padding:20px 20px 22px;margin-top:16px}
.sim-card>h2:first-child,.sim-debrief>h2:first-child{margin-top:0}
.sim-inline-sit{margin-top:16px;border:1px solid var(--ln);background:var(--n1);border-radius:20px;padding:16px 18px}
.sim-inline-sit:empty{display:none}

/* Une pause : l'explication de l'étape */
.sim-pause{margin-top:16px;border:1px solid rgba(76,192,175,.35);background:linear-gradient(135deg,rgba(76,192,175,.12),rgba(19,27,56,.2) 70%);border-radius:20px;padding:18px 20px 16px}
.sim-pause h2{margin:2px 0 6px}
.sim-pause p{max-width:70ch}
.ps-k{font:500 12.5px var(--fm);color:var(--pour)}
.ps-why b{display:block;font:500 12.5px var(--fm);color:var(--gold2);margin-bottom:2px}
.sim-pause.min{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 12px;padding:10px 16px}
.sim-pause.min b{font:600 16px var(--fd)}
.sim-pause.min .sim-btn.link{margin-left:auto;font-size:13px}

/* La barre « Maintenant » : la prochaine étape, toujours visible */
.sim-now{position:sticky;bottom:16px;z-index:5;display:flex;align-items:center;gap:10px 16px;flex-wrap:wrap;margin:22px auto 0;max-width:880px;background:rgba(19,27,56,.92);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--ln);border-radius:18px;padding:10px 10px 10px 18px;box-shadow:0 18px 40px -18px rgba(0,0,0,.8)}
.now-k{font:500 12px var(--fm);color:var(--gold2);flex:none}
.sim-now p{flex:1;min-width:200px;margin:0;font-size:14.5px;color:var(--tx)}
.sim-now .sim-btn{flex:none}
/* Le message flottant du site passe au-dessus de la barre */
html body:has(.sim-now) .toast{bottom:96px;width:max-content;max-width:min(90vw,560px)}

/* Situation (colonne latérale) */
.sim-sit{padding:14px 0;border-bottom:1px solid var(--ln2)}
.sim-sit:first-child{padding-top:0}
.sim-sit:last-child{border-bottom:0;padding-bottom:0}
.sim .sim-sit h3{margin:0 0 10px;font:500 12.5px var(--fm);color:var(--tx2)}
.sim-sit p{font-size:13.5px}
.sim-time{display:flex;align-items:baseline;gap:8px}
.sim-time b{font:700 40px/1 var(--fd)}
.sim-time span{font:500 12.5px var(--fm);color:var(--tx3)}
.sim-bar{height:6px;border-radius:99px;background:var(--n3);overflow:hidden;margin:8px 0}
.sim-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--pour),var(--gold));border-radius:inherit;transition:width .4s}
.sim-known{display:flex;flex-wrap:wrap;gap:5px}
.sim-known i{width:13px;height:13px;border-radius:50%;border:1.5px dashed var(--inc)}
.sim-known i.on{background:var(--tx2);border:0}
.sim-objs{list-style:none;padding:0;margin:0}
.sim-objs li{display:flex;gap:10px;align-items:flex-start;font-size:13.5px;margin:8px 0;color:var(--tx2)}
.sim-objs li.ok{color:var(--tx)}
.sim-objs li small{display:block;color:var(--tx3);font-size:12.5px}
.sim-dot{flex:none;width:12px;height:12px;border-radius:50%;border:1.5px solid var(--tx3);margin-top:5px}
.sim-objs li.ok .sim-dot{background:var(--pour);border-color:var(--pour)}
.sim-objs li.no .sim-dot{border-color:var(--contre)}
.sim-objs.final li{font-size:14.5px}

/* Points de vote face au seuil */
.sim-vd{margin:2px 0}
.vd-row{position:relative;display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:4px;padding:16px 0 2px}
.sim-vd.big .vd-row{grid-template-columns:repeat(auto-fill,minmax(14px,1fr))}
.sim .vd{display:inline-block;aspect-ratio:1;width:100%;max-width:22px;border-radius:50%;background:var(--inc);position:relative}
.sim .vd.v-yes{background:var(--pour)}
.sim .vd.v-no{background:var(--contre)}
.sim .vd.v-abs{background:var(--abst)}
.sim .vd.v-unk{background:transparent;box-shadow:inset 0 0 0 1.5px #6b74a8}
.sim .vd.me{box-shadow:0 0 0 2px var(--n1),0 0 0 3.5px var(--gold)}
.sim .vd.v-unk.me{box-shadow:inset 0 0 0 1.5px #6b74a8,0 0 0 2px var(--n1),0 0 0 3.5px var(--gold)}
.sim .vd.p5::after{content:"";position:absolute;left:50%;bottom:-6px;width:4px;height:4px;margin-left:-2px;border-radius:50%;background:var(--tx2)}
.vd-th{position:absolute;top:0;bottom:-6px;width:2px;background:var(--tx)}
.vd-th span{position:absolute;top:-3px;left:5px;font:500 11px var(--fm);color:var(--tx);white-space:nowrap}
.vd-say{font-size:13.5px;color:var(--tx2);margin:12px 0 4px}
.vd-say b{color:var(--tx)}
.vd-status{font-size:13.5px;font-weight:600;margin:4px 0}
.vd-status.ok{color:var(--pour)}.vd-status.ko{color:var(--contre)}.vd-status.unk{color:var(--warn)}
.vd-legend{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:12px;color:var(--tx3);margin:6px 0 0}
.vd-legend span{display:inline-flex;align-items:center;gap:5px}
.sim .vd-legend .vd{width:10px;height:10px}
.sim .vd-legend .vd.me{background:transparent;box-shadow:inset 0 0 0 2px var(--gold)}
.sim .vd-legend .vd.p5{background:transparent;box-shadow:none;width:4px;height:4px;background:var(--tx2)}
.sim .vd-legend .vd.p5::after{display:none}

/* Télégramme de la capitale */
.sim-brief{position:relative;background:linear-gradient(180deg,#151d3d,var(--n1) 140px)}
.tg-head{display:flex;justify-content:space-between;align-items:center;gap:10px;font:500 12.5px var(--fm);color:var(--tx2);border-bottom:1px dashed var(--ln);padding-bottom:10px}
.sim-conf{font:600 11px/1 var(--fm);letter-spacing:.12em;text-transform:uppercase;color:var(--contre);border:1.5px solid var(--contre);border-radius:4px;padding:5px 7px 4px;transform:rotate(2deg)}
.tg-meta{display:grid;gap:4px;margin:12px 0 4px;font-size:13.5px}
.tg-meta div{display:grid;grid-template-columns:60px 1fr;gap:10px}
.tg-meta dt{font:500 12.5px var(--fm);color:var(--tx3)}
.tg-meta dd{margin:0;color:var(--tx)}
.sim-brief h2{font-size:22px}
.sim-redlist li{color:var(--contre)}
.sim-axnotes{font-size:13.5px;color:var(--tx2)}
.sim-axnotes b{color:var(--tx)}
.sim-orients{display:grid;gap:10px;margin-top:10px;scroll-margin:90px 0 140px}
.sim-orient{display:flex;flex-direction:column;gap:6px;align-items:flex-start;text-align:left;border:1px solid var(--ln);background:var(--n2);border-radius:16px;padding:14px 16px;cursor:pointer;font:inherit;color:inherit;transition:border-color .15s,background .15s}
.sim-orient:hover{border-color:var(--gold);background:var(--n3)}
.sim-orient b{font:600 18px/1.25 var(--fd)}
.sim-orient>span:not(.sim-tag){font-size:13.5px;color:var(--tx2)}
.sim-fit{display:flex;flex-direction:column;gap:5px;width:100%;font-size:12px!important;color:var(--tx3)!important}
.fit-bar{display:block;height:5px;border-radius:99px;background:var(--n0);overflow:hidden}
.fit-bar i{display:block;height:100%;background:var(--gold)}

/* Curseurs « vers où penche… » */
.sim-axes{margin:12px 0 6px;display:grid;gap:16px}
.sim-ln{display:grid;gap:6px}
.ln-h{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font:600 14px var(--ft)}
.ln-h em{font:500 11.5px var(--fm);font-style:normal;color:var(--tx3)}
.ln-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(120px,2.4fr) minmax(0,1fr);align-items:center;gap:12px}
.ln-end{font-size:12px;color:var(--tx3);line-height:1.3;text-align:right}
.ln-end.r{text-align:left}
.ln-track{position:relative;height:4px;border-radius:99px;background:var(--n3)}
.ln-track::before{content:"";position:absolute;left:50%;top:-5px;bottom:-5px;width:1px;background:var(--ln)}
.ln-m{position:absolute;top:50%;width:14px;height:14px;border-radius:50%;transform:translate(-50%,-50%)}
.ln-m.cap{background:var(--gold);box-shadow:0 0 0 3px rgba(235,192,0,.22)}
.ln-m.cap.sm{width:9px;height:9px;box-shadow:none;opacity:.75}
.ln-m.del{background:#c7ccf0}
.ln-m.txt{width:11px;height:11px;border-radius:2px;background:var(--tx);border:2px solid var(--n0);transform:translate(-50%,-50%) rotate(45deg)}
.ln-red{position:absolute;top:-7px;bottom:-7px;width:3px;margin-left:-1.5px;border-radius:2px;background:var(--contre)}
.ln-say{font-size:12.5px;color:var(--tx3);margin:0;text-align:center}
.sim-legend{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:12px;color:var(--tx3);margin:4px 0 0}
.sim-legend span{display:inline-flex;align-items:center;gap:6px}
.sim-legend i{display:inline-block}
.lg-cap{width:10px;height:10px;border-radius:50%;background:var(--gold)}
.lg-del{width:10px;height:10px;border-radius:50%;background:#c7ccf0}
.lg-txt{width:8px;height:8px;background:var(--tx);transform:rotate(45deg)}
.lg-red{width:3px;height:12px;background:var(--contre)}

/* Salle de conférence : une caméra sur la salle, avec sous-titres */
.sim-cam{position:relative;margin:12px 0 6px;border-radius:22px;overflow:hidden;background:#070b1c;border:1px solid var(--ln)}
.cam-top{position:absolute;top:12px;left:14px;right:14px;z-index:2;display:flex;flex-wrap:wrap;align-items:center;gap:6px;pointer-events:none}
.cam-tag{font:600 11px/1 var(--fm);padding:5px 8px;border-radius:6px;background:rgba(7,11,28,.78);color:var(--tx);border:1px solid rgba(255,255,255,.12)}
.cam-tag.rec::before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--contre);margin-right:6px;vertical-align:0}
.cam-tag.dim{color:var(--tx2)}
.cam-where{font:500 11.5px var(--fm);color:var(--tx3)}
.cam-clock{margin-left:auto;font:600 12px/1 var(--fm);padding:5px 8px;border-radius:6px;background:rgba(7,11,28,.78);color:var(--tx);border:1px solid rgba(255,255,255,.12)}
.cam-view{padding:38px 6px 0}
.cam-sub{position:relative;margin:-58px 16px 0;z-index:2;padding:0 0 16px;text-align:center}
.cam-name{display:inline-block;font:700 12px/1 var(--ft);text-transform:uppercase;letter-spacing:.07em;color:#141a3a;background:#f4f5fb;border-radius:3px;padding:5px 8px 4px;border-bottom:3px solid #5865b8}
.cam-name.me{background:var(--gold);border-bottom-color:#8a6d00;color:var(--gold-ink)}
.cam-role{display:inline-block;font:500 11.5px/1 var(--fm);color:var(--tx);background:rgba(242,120,141,.85);border-radius:3px;padding:5px 7px;margin-left:6px;vertical-align:1px}
.cam-sub p{margin:10px auto 0;max-width:62ch;font:500 16px/1.45 var(--ft);color:#fff;background:rgba(7,11,28,.82);border-radius:10px;padding:10px 14px;text-wrap:balance}
.sim-cam.compact .cam-sub p{font-size:14.5px}
.sim-camlegend{justify-content:center;margin:8px 0 14px}
.sim-room{width:100%;height:auto;display:block;max-width:820px;margin:0 auto}
.sim-floor{stroke:rgba(255,255,255,.05)}
.fl-a{stop-color:#1f2a5c}.fl-b{stop-color:#0b1028}
.sim-table{fill:none;stroke:#2f3b74}
.sim-table-edge{fill:none;stroke:#3a4787;stroke-width:1.2}
.sim-desk{fill:#17204a;stroke:#3a4787;stroke-width:1.2}
.sim-desk.rostrum{fill:rgba(235,192,0,.18);stroke:var(--gold)}
.sim-room-note{font:500 10.5px var(--fm);fill:var(--tx3);text-anchor:middle}
.sim-seat{cursor:pointer;outline:none}
.sim-av-ring{fill:none;stroke:transparent;stroke-width:2.4}
.sim-seat:hover .sim-av-ring,.sim-seat:focus-visible .sim-av-ring{stroke:var(--tx2);stroke-dasharray:3 3}
.sim-av-ring.on{stroke:var(--gold);stroke-width:3;stroke-dasharray:none}
.sim-av-ring.on.speak{stroke:#9fb2ff;stroke-width:3.2;animation:simRing 1.6s ease-in-out infinite}
.sim-seat.me .sim-av-ring.on.speak{stroke:var(--gold)}
.sim-seat-l{font:700 9.5px var(--ft);letter-spacing:.05em;text-transform:uppercase}
.sim-room .sim-seat-l{fill:#d6daf2}
.sim-room .sim-seat.me .sim-seat-l{fill:var(--gold2)}
.sim-room .sim-plate+.sim-seat-l{fill:#141a3a}
.sim-room .sim-seat.me .sim-plate+.sim-seat-l{fill:var(--gold-ink)}
.sim-seat:hover .sim-seat-l,.sim-seat:focus-visible .sim-seat-l{text-decoration:underline}
.sim-room .sim-seat-l.chair{fill:var(--tx2);font-size:10.5px}
.sim-plate{fill:#eef0fa;stroke:#5865b8;stroke-width:.8}
.sim-seat.me .sim-plate{fill:var(--gold);stroke:#8a6d00}
.sim-light{stroke:#0b1024;stroke-width:1.6}
.sim-seat.v-yes .sim-plate{fill:#bfece4;stroke:var(--pour)}.sim-seat.v-no .sim-plate{fill:#fbd0d8;stroke:var(--contre)}.sim-seat.v-abs .sim-plate{fill:#dcdef0;stroke:var(--abst)}
.sim-room.mini{max-width:100%;margin:4px 0}
.sim-sit-room p{margin:4px 0 0}
.sim-light.v-yes{fill:var(--pour)}.sim-light.v-no{fill:var(--contre)}.sim-light.v-abs{fill:var(--abst)}
.sim-co{fill:var(--gold);stroke:#0b1024;stroke-width:1.2}
.sim-bubble path{fill:#f4f5fb;stroke:#0b1024;stroke-width:1.3}
.sim-bubble circle{fill:#141a3a}
.sim-gavel rect{fill:var(--gold)}
.sim-legend .lg-me{width:11px;height:11px;border-radius:50%;border:2.5px solid var(--gold);background:var(--n3)}
.sim-legend .lg-speak{width:11px;height:11px;border-radius:50%;border:2.5px solid #9fb2ff}
.sim-legend .lg-co{width:8px;height:8px;border-radius:50%;background:var(--gold)}
.sim-legend .lg-v{width:10px;height:10px;border-radius:50%}
.sim-legend .lg-v.yes{background:var(--pour)}.sim-legend .lg-v.no{background:var(--contre)}.sim-legend .lg-v.abs{background:var(--abst)}
.sim-legend .lg-sq{width:11px;height:11px;border-radius:3px}
.sim-legend .lg-sq.round{border-radius:50%}
@keyframes simRing{50%{stroke-opacity:.3}}
.sim-queue{margin:6px 0 14px}
.sim-queue .sim-kick{color:var(--tx3)}
.sim-speakers{list-style:none;display:flex;flex-wrap:wrap;gap:6px;padding:0;margin:4px 0 0}
.sim-speakers li{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;padding:3px 10px 3px 4px;border-radius:99px;background:var(--n2);color:var(--tx3);border:1px solid transparent}
.sim-speakers li span{font:500 10.5px var(--fm);width:20px;height:20px;border-radius:50%;display:inline-grid;place-items:center;background:var(--n0);color:var(--tx3)}
.sim-speakers li.done{color:var(--tx2)}
.sim-speakers li.done span{color:var(--pour)}
.sim-speakers li.cur{background:var(--n3);color:var(--tx);border-color:#9fb2ff}
.sim-speakers li.me{border-color:var(--gold);color:var(--gold2)}
.sim-feed{display:flex;flex-direction:column;gap:12px;margin:8px 0}
.sim-sp{border:1px solid var(--ln);border-radius:16px;padding:14px 16px;background:var(--n2);scroll-margin:90px 0 140px}
.sim-sp-h{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px}
.sim-sp-m{font-size:12.5px;color:var(--tx3)}
.sim-sp-m time{font:500 12px var(--fm);color:var(--tx3);margin-left:4px}
.sim-sp p{margin:10px 0 0;font-size:15px;line-height:1.65;color:var(--tx)}
.sim-sp.mine{border-color:rgba(235,192,0,.55);background:linear-gradient(90deg,rgba(235,192,0,.10),var(--n2) 60%)}
.sim-sp.k-reply,.sim-sp.k-support,.sim-sp.k-contest,.sim-sp.k-question{margin-left:22px;background:var(--n1)}
.sim-wait{color:var(--tx3);font-style:italic;animation:simPulse 1.2s ease-in-out infinite}
.sim-notes{font-size:12.5px!important;color:var(--tx3)!important}
.sim-react{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
.sim-chair{border-left:2px solid var(--gold);padding:2px 0 2px 16px;font-family:var(--fd)}
.sim-chair>span{display:block;font:500 12px/1.3 var(--fm);color:var(--gold2)}
.sim-chair p{margin:8px 0;font-size:16.5px;line-height:1.65;color:var(--tx)}
.sim-chair.big p{font-size:17.5px;line-height:1.7;max-width:68ch}
.sim-myturn{border:1px solid var(--gold);border-radius:20px;padding:16px 18px 18px;background:linear-gradient(180deg,rgba(235,192,0,.10),var(--n1) 160px);margin-top:16px;scroll-margin:90px 0 140px}
.sim-myturn .sim-kick{color:var(--gold2)}
.sim-myturn>h3{margin:2px 0 10px;font-size:22px}
.sim-seg{display:inline-flex;flex-wrap:wrap;gap:4px;background:var(--n0);border:1px solid var(--ln);border-radius:99px;padding:3px;margin:2px 0 14px}
.sim-seg .sim-btn{border:0;padding:6px 14px;font-size:13px;color:var(--tx2);background:none}
.sim-seg .sim-btn.on{background:var(--n3);color:var(--tx);box-shadow:inset 0 0 0 1px var(--gold)}
.sim-opts{display:grid;gap:12px}
.sim-opt{border:1px solid var(--ln);border-radius:16px;padding:14px 16px;background:var(--n2);display:flex;flex-direction:column}
.sim .sim-opt h3{margin:0;font-size:18px}
.sim-opt .sim-mute{margin:3px 0 8px;font-size:12.5px}
.sim-opt-t{font-size:14px;line-height:1.6;color:var(--tx2);flex:1;border-left:2px solid var(--ln);padding-left:12px;margin-bottom:12px}
.sim-opt-t p{margin:0 0 6px}
.sim-opt .sim-btn{align-self:flex-start}
.sim-lbl{display:block;font-size:13px;font-weight:600;color:var(--tx2);margin:8px 0 6px}
.sim textarea,.sim select,.sim input[type=search],.sim input[type=text]{font:inherit;font-size:15px;border:1px solid var(--ln);border-radius:12px;padding:10px 12px;background:var(--n0);color:var(--tx)}
.sim select{width:auto;max-width:100%;padding:7px 10px}
.sim input[type=search]{width:auto;border-radius:99px;padding:10px 18px}
.sim textarea{width:100%;resize:vertical;line-height:1.6}
.sim textarea:focus,.sim select:focus,.sim input:focus{border-color:var(--gold);outline:0}
.sim ::placeholder{color:var(--tx3)}
.sim-analysis{background:var(--n0);border:1px solid var(--ln2);border-radius:14px;padding:12px 14px;font-size:13.5px;margin:10px 0;display:grid;gap:7px;color:var(--tx2)}
.sim-analysis b{color:var(--tx);margin-right:6px}
.sim-q{display:inline-block;width:90px;height:5px;border-radius:99px;background:var(--n3);vertical-align:middle;margin-right:6px;overflow:hidden}
.sim-q i{display:block;height:100%;background:var(--gold)}
.sim-bad{color:var(--contre)}

/* Espace diplomatique */
.sim-diptop{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;margin-bottom:6px}
.sim-diptop p{margin:0}
.sim-inbox{margin:12px 0 16px}
.sim-offer{border:1px solid rgba(235,192,0,.5);background:var(--gold-s);border-radius:14px;padding:12px 14px;margin:8px 0}
.sim-offer p{font-size:14px}
.sim-dipgrid{display:grid;gap:14px;margin-top:12px}
.sim-dels{display:flex;flex-direction:column;gap:3px}
.sim-delrow{display:flex;align-items:center;gap:10px;flex-wrap:wrap;text-align:left;padding:8px 10px;border:1px solid transparent;border-radius:12px;background:none;cursor:pointer;font:inherit;color:inherit}
.sim-delrow:hover{background:var(--n2)}
.sim-delrow.on{background:var(--n3);border-color:var(--gold)}
.sim-rel{margin-left:auto;display:inline-flex;align-items:center}
.sim-relm{display:inline-flex;gap:2px;vertical-align:middle}
.sim-relm i{width:7px;height:12px;border-radius:2px;background:var(--n3)}
.sim-relm.r1 i.on{background:var(--contre)}.sim-relm.r2 i.on{background:#f0a35e}.sim-relm.r3 i.on{background:#8a92b8}.sim-relm.r4 i.on{background:#93d9cd}.sim-relm.r5 i.on{background:var(--pour)}
.sim-vchip{font:600 11.5px/1.4 var(--ft);padding:2px 9px;border-radius:99px;background:var(--n3);color:var(--tx2);min-width:30px;text-align:center}
.sim-vchip.v-yes{background:var(--pour-s);color:var(--pour)}.sim-vchip.v-no{background:var(--contre-s);color:var(--contre)}.sim-vchip.v-abs{background:var(--abst-s);color:var(--abst)}
.sim-detail{border:1px solid var(--ln);background:var(--n2);border-radius:18px;padding:16px;scroll-margin:90px 0 140px;min-width:0}
.sim-dhead{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.sim-kv{display:grid;grid-template-columns:1fr 1fr;gap:10px 16px;margin:14px 0}
.kv-k{display:block;font:500 11.5px var(--fm);color:var(--tx3)}
.kv-v{font-size:13.5px;color:var(--tx)}
.kv-w{grid-column:1/-1}
.sim-pet{font-size:13.5px;background:var(--n0);border-radius:12px;padding:10px 12px;color:var(--tx2)}
.sim-talk{display:flex;flex-direction:column;gap:8px;margin:14px 0;scroll-margin:90px 0 140px}
.sim-msg{max-width:92%;border-radius:14px;padding:9px 12px}
.sim-msg span{display:block;font:500 11px var(--fm);color:var(--tx3)}
.sim-msg p{margin:3px 0 0;font-size:13.5px}
.sim-msg.me{align-self:flex-end;background:rgba(235,192,0,.12);border:1px solid rgba(235,192,0,.28)}
.sim-msg.them{align-self:flex-start;background:var(--n0);border:1px solid var(--ln2)}
.sim-acts{display:flex;flex-wrap:wrap;gap:6px;margin:14px 0 4px}
.sim-panel{background:var(--n0);border:1px solid var(--ln2);border-radius:16px;padding:14px;margin-top:10px}
.sim-args,.sim-offers{display:grid;gap:6px;margin-bottom:10px}
.sim-arg{text-align:left;border:1px solid var(--ln);background:var(--n1);border-radius:12px;padding:9px 12px;cursor:pointer;font:inherit;color:inherit}
.sim-arg b{display:block;font-size:13.5px;color:var(--tx)}
.sim-arg span{font-size:12.5px;color:var(--tx2)}
.sim-arg.on{border-color:var(--gold);background:var(--gold-s)}
.sim-arg:hover{border-color:var(--tx3)}
.sim-panel select{margin-bottom:10px;max-width:100%}
.sim-groups{display:grid;gap:10px}
.sim-group{border:1px solid var(--ln);background:var(--n2);border-radius:14px;padding:12px 14px}
.sim-group b{font:600 16px var(--fd)}
.sim-deal{display:inline-block;font:500 11px/1.4 var(--fm);padding:1px 8px;border-radius:6px;background:var(--n3);color:var(--tx2)}
.sim-deal.broken{background:var(--contre-s);color:var(--contre)}.sim-deal.honored{background:var(--pour-s);color:var(--pour)}

/* Carte des positions */
.sim-pmwrap{margin:6px 0 12px}
.sim-pmsel{gap:6px 10px}
.sim-pmsel .sim-lbl{margin:0}
.sim-pmap{width:100%;height:auto;max-width:660px;display:block;margin:10px auto 0}
.sim-pm-box{fill:#0e1534;stroke:var(--ln)}
.sim-pm-axis{stroke:#36417a;stroke-dasharray:4 4}
.sim-pm-t{font:500 11px var(--ft);fill:var(--tx3)}
.sim-pm-t.sm{font-size:10.5px}
.sim-pm-dot{stroke:#0b1024;stroke-width:1.6;cursor:pointer;outline:none}
.sim-pm-dot:hover,.sim-pm-dot:focus-visible{stroke:#fff;stroke-width:2}
.sim-pm-l{font:600 9.5px var(--ft);fill:var(--tx2)}
.sim-pm-l.b{font-weight:700;fill:var(--tx);font-size:10.5px}
.sim-pm-me circle{fill:var(--n0);stroke:var(--gold);stroke-width:3}
.sim-pm-txt rect{fill:var(--tx);stroke:#0b1024;stroke-width:1.5}
.sim-legend .lg-me{background:var(--n0)}

/* Carte du monde en points */
.sim-mapbox{margin:8px 0 4px}
.sim-mapmodes{margin-bottom:10px}
.sim-dmap{width:100%;height:auto;display:block;border-radius:16px;background:radial-gradient(80% 90% at 50% 40%,#111a40,#0a0f26)}
.dm-dot{fill:#2b3566}
.dm-dot.on{fill:#5966a8}
.dm-c{cursor:default;outline:none}
.dm-c[data-a]{cursor:pointer}
.dm-c circle:not(.dm-halo){stroke:#0b1024;stroke-width:1.4}
.dm-halo{opacity:.22}
.dm-c[data-a]:hover circle:not(.dm-halo),.dm-c[data-a]:focus-visible circle:not(.dm-halo){stroke:#fff;stroke-width:2}
.dm-c.me circle:not(.dm-halo){stroke:#fff;stroke-width:2.2}
.dm-c.me .dm-halo{opacity:.35}
.dm-me-l{font:700 11px var(--ft);fill:var(--gold2);letter-spacing:.04em;text-transform:uppercase;paint-order:stroke;stroke:#0b1024;stroke-width:3px}

/* Salle de rédaction : le projet de texte comme un document officiel, sur papier */
.sim-doc{position:relative;background:#fbfbf7;border-radius:6px;box-shadow:0 30px 60px -30px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.06);max-width:800px;margin:18px auto;padding:32px 24px 28px;font-family:var(--sfd,Georgia,"Times New Roman",serif);font-size:16px;line-height:1.62;color:#1d1d2b;color-scheme:light}
.sim-doc-h{text-align:center;margin-bottom:16px}
.sim-doc-org{font-variant:small-caps;letter-spacing:.06em;font-size:14px;color:#020259}
.sim-doc-b{font-weight:700;margin-top:2px}
.sim-doc-t{font-style:italic;margin-top:10px}
.sim-doc-a{font-size:13.5px;color:#5c5e80;margin-top:2px}
.sim .sim-doc-title{font-family:inherit;font-size:18px;font-weight:700;text-align:center;margin:12px 0 16px;color:#1d1d2b}
.sim-doc-head{margin:0 0 6px}
.sim-pre{text-indent:2.2em;margin:4px 0!important}
.sim-ops{padding-left:2.4em;margin:10px 0 0}
.sim-op{margin:14px 0;padding-left:4px}
.sim-op::marker{font-weight:700}
.sim-op>p:first-child{margin:0}
.sim-op.bad>p:first-child{color:#8d8da0;text-decoration:line-through;text-decoration-color:#c12a3a}
.sim-warn{font:13px/1.45 var(--ft);color:#ffb3bf;background:var(--contre-s);border-radius:10px;padding:7px 11px;margin:6px 0!important}
.sim-warn.soft{color:#ffd98a;background:rgba(240,184,76,.13)}
.sim-doc .sim-warn{color:#a3162a;background:#fde4e8}
.sim-doc .sim-warn.soft{color:#7a5200;background:#fff3cf}
.sim-by{font:12px var(--ft);color:#5c5e80;margin:3px 0 0!important}
.sim-op-t{display:flex;flex-wrap:wrap;gap:5px;align-items:center;margin-top:8px;font-family:var(--ft)}
.sim-doc .sim-op-t select{font-size:13px;padding:3px 8px;border-radius:8px;background:#fff;color:#1d1d2b;border:1px solid #cfd2e6}
.sim-doc .sim-btn.ghost{border-color:#cfd2e6;color:#020259;background:#fff}
.sim-doc .sim-btn.ghost:hover{border-color:#020259}
.sim-doc .sim-btn.danger{color:#b3192d}
.sim-op-r{display:grid;gap:5px;margin-top:8px;font:12px var(--ft);color:#5c5e80}
.sim-op-r .rb{display:flex;height:7px;border-radius:99px;overflow:hidden;background:#eceef6;max-width:380px}
.sim-op-r .rb i{display:block;height:100%}
.sim-op-r .rb .r-sup{background:#2a9d8c}.sim-op-r .rb .r-mod{background:#e3a63a}.sim-op-r .rb .r-neu{background:#a7abcf}.sim-op-r .rb .r-unk{background:#dfe1ee}.sim-op-r .rb .r-opp{background:#d9455d}
.sim-op-r .rt{display:flex;flex-wrap:wrap;gap:3px 12px}
.sim-op-r .rt .r-sup{color:#1d7a6d}.sim-op-r .rt .r-mod{color:#9a6a00}.sim-op-r .rt .r-opp{color:#b3192d}
.sim-doc.adopted{box-shadow:0 30px 60px -30px rgba(0,0,0,.9),0 0 0 2px var(--pour)}.sim-doc.rejected{box-shadow:0 30px 60px -30px rgba(0,0,0,.9),0 0 0 2px var(--contre)}
.sim-stamp{position:absolute;top:16px;right:14px;transform:rotate(-7deg);border:3px solid currentColor;border-radius:6px;padding:5px 10px 3px;font:700 15px/1 var(--fm);letter-spacing:.12em;text-transform:uppercase;opacity:.85}
.sim-doc.adopted .sim-stamp{color:#1d7a6d}.sim-doc.rejected .sim-stamp{color:#b3192d}
.sim-tools{max-width:800px;margin:0 auto;scroll-margin:90px 0 140px}
.sim-tool{border-top:1px solid var(--ln);padding:14px 0}
.sim-tool>h3{margin-top:0}
.sim-bank{list-style:none;padding:0;margin:0 0 10px;max-height:460px;overflow:auto}
.sim-bank li{border-bottom:1px solid var(--ln2);padding:10px 2px}
.sim-bank li p{margin:0 0 4px;font-size:13.5px}
.sim-free{display:grid;gap:8px}
.sim-amend{border:1px solid var(--ln);background:var(--n2);border-radius:14px;padding:12px 14px;margin:8px 0}
.sim-amend p{font-size:14px;margin:6px 0}
.sim-done summary{cursor:pointer;font-size:13.5px;color:var(--tx3);margin-top:6px}
.sim-confirm{border:1px solid var(--gold);background:var(--gold-s);border-radius:16px;padding:14px 16px;margin:14px 0}

/* Salle de vote : le tableau électronique de la salle */
.sim-votebtns{display:flex;flex-wrap:wrap;gap:10px;margin-top:8px;scroll-margin:90px 0 140px}
.sim-votebtns .sim-btn{min-width:150px;padding:13px 22px;font-size:16px;background:var(--n2)}
.sim-votebtns .v-yes{border-color:var(--pour);color:var(--pour)}.sim-votebtns .v-yes:hover{background:var(--pour-s)}
.sim-votebtns .v-no{border-color:var(--contre);color:var(--contre)}.sim-votebtns .v-no:hover{background:var(--contre-s)}
.sim-votebtns .v-abs{border-color:var(--abst);color:var(--abst)}.sim-votebtns .v-abs:hover{background:var(--abst-s)}
.sim-board{background:radial-gradient(120% 90% at 50% 0%,#141d4a 0%,#070b1d 65%);color:#fff;border-radius:20px;padding:20px 20px 16px;margin:14px 0;scroll-margin:90px 0 140px;border:1px solid var(--ln)}
.sim-board-h{display:grid;gap:10px;border-bottom:1px solid rgba(255,255,255,.12);padding-bottom:14px}
.sim-board-t{font:500 12px var(--fm);color:var(--tx3)}
.sim-tallies{display:flex;gap:28px;flex-wrap:wrap}
.sim-tallies div{display:flex;align-items:baseline;gap:8px}
.sim-tallies b{font:700 54px/1 var(--fd);font-variant-numeric:tabular-nums lining-nums}
.sim-tallies span{font:500 12.5px var(--fm);color:var(--tx2)}
.sim-tallies .t-yes b{color:var(--pour)}.sim-tallies .t-no b{color:var(--contre)}.sim-tallies .t-abs b{color:var(--abst)}
.sim-board-rule{font-size:12.5px;color:var(--tx2)}
.sim-lights{list-style:none;padding:0;margin:16px 0 6px;display:grid;grid-template-columns:repeat(auto-fill,minmax(172px,1fr));gap:7px 18px}
.sim-lights li{display:flex;align-items:center;gap:9px;font-size:13px;min-width:0;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.06)}
.sim-lights i{flex:none;width:13px;height:13px;border-radius:50%;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25)}
.sim-lights span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sim-lights sup{font:500 9px var(--fm);color:var(--tx3);margin-left:3px}
.sim-lights em{margin-left:auto;font:500 11px var(--fm);font-style:normal;color:var(--tx2);white-space:nowrap}
.sim-lights .v-yes i{background:var(--pour);border-color:var(--pour);box-shadow:0 0 10px rgba(76,192,175,.7)}
.sim-lights .v-no i{background:var(--contre);border-color:var(--contre);box-shadow:0 0 10px rgba(242,120,141,.7)}
.sim-lights .v-abs i{background:var(--abst);border-color:var(--abst);box-shadow:0 0 10px rgba(167,171,207,.5)}
.sim-lights li.me span{color:var(--gold2);font-weight:600}
.sim-result{text-align:center;font:700 30px/1 var(--fd);letter-spacing:.06em;padding:16px 0 6px;border-top:1px solid rgba(255,255,255,.12);margin-top:8px}
.sim-result.ok{color:var(--pour)}.sim-result.ko{color:var(--contre)}
.sim-board.anim .sim-lights i{animation:simLight .35s ease-out both;animation-delay:calc(var(--i) * 120ms + 300ms)}
.sim-board.anim .sim-lights em{animation:simFade .3s ease-out both;animation-delay:calc(var(--i) * 120ms + 380ms)}
.sim-board.anim .sim-tallies,.sim-board.anim .sim-result{animation:simFade .5s ease-out both;animation-delay:calc(var(--n) * 120ms + 500ms)}
.sim-announce{font:italic 500 17px/1.55 var(--fd);max-width:70ch;color:var(--tx2)}
.sim-expl{display:grid;gap:8px}
.sim-expl .sim-sp p{margin-top:6px;font-size:14px}
.sim-verify{border:1px solid var(--ln);background:var(--n2);border-radius:16px;padding:6px 16px 10px;margin:14px 0}
.sim-verify ul{list-style:none;padding:0;margin:6px 0}
.sim-verify li{display:flex;gap:9px;align-items:flex-start;font-size:14px;margin:7px 0}
.sim-verify li.ok .sim-dot{background:var(--pour);border-color:var(--pour)}
.sim-verify li.no .sim-dot{background:var(--contre);border-color:var(--contre)}
@keyframes simLight{from{background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.25);box-shadow:none;transform:scale(.7)}}
@keyframes simFade{from{opacity:0;transform:translateY(4px)}}
@keyframes simPulse{50%{opacity:.45}}

/* Schéma de la règle de vote */
.sim-rd{border:1px solid var(--ln);background:var(--n2);border-radius:16px;padding:14px 16px 12px;margin:12px 0}
.sim-rd-h{display:flex;flex-direction:column;gap:1px}
.sim-rd-h b{font:600 17px var(--fd)}
.sim-rd-h span{font-size:12.5px;color:var(--tx3)}
.sim-rd-row{display:grid;grid-template-columns:repeat(15,1fr);gap:4px;margin:14px 0 0}
.sim-rd-c{height:20px;border-radius:5px;background:var(--n3)}
.sim-rd-c.v-yes{background:var(--pour)}.sim-rd-c.v-no{background:var(--contre)}.sim-rd-c.v-abs{background:var(--abst)}
.sim-rd-ticks{position:relative;height:22px;margin-bottom:4px}
.sim-rd-ticks span{position:absolute;top:0;transform:translateX(-50%);font:500 11px var(--fm);color:var(--tx);white-space:nowrap;padding-top:7px}
.sim-rd-ticks span::before{content:"";position:absolute;left:50%;top:-1px;width:2px;height:7px;background:var(--tx);margin-left:-1px}
.sim-rd-p5s{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:4px 0}
.sim-rd-p5{font:700 10.5px/1.3 var(--ft);text-transform:uppercase;letter-spacing:.05em;padding:3px 7px 2px;border-radius:4px;background:var(--n3);color:var(--tx2)}
.sim-rd-p5.v-yes{background:var(--pour-s);color:var(--pour)}.sim-rd-p5.v-no{background:var(--contre-s);color:var(--contre)}.sim-rd-p5.v-abs{background:var(--abst-s);color:var(--abst)}
.sim-rd-bar{position:relative;height:20px;border-radius:6px;background:var(--n3);display:flex;margin:16px 0 8px}
.sim-rd-bar i{display:block;height:100%}
.sim-rd-bar i.yes{background:var(--pour);border-radius:6px 0 0 6px}.sim-rd-bar i.no{background:var(--contre)}
.sim-rd-th{position:absolute;top:-6px;bottom:-6px;width:3px;margin-left:-1.5px;background:var(--tx);border-radius:2px}
.sim-rd-legend{display:flex;gap:6px 14px;flex-wrap:wrap;font-size:12.5px;color:var(--tx3)}
.sim-rd-legend .yes{color:var(--pour);font-weight:600}.sim-rd-legend .no{color:var(--contre);font-weight:600}

/* Bilan */
.sim-debrief{margin-top:16px}
.sim-verdict{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;border-radius:22px;padding:22px 24px;border:1px solid var(--ln);background:var(--n1)}
.sim-verdict.ok{border-color:rgba(76,192,175,.55);background:linear-gradient(135deg,rgba(76,192,175,.16),var(--n1) 60%)}
.sim-verdict.mid{border-color:rgba(235,192,0,.5);background:linear-gradient(135deg,rgba(235,192,0,.12),var(--n1) 60%)}
.sim-verdict.ko{border-color:rgba(242,120,141,.55);background:linear-gradient(135deg,rgba(242,120,141,.15),var(--n1) 60%)}
.sim-verdict-k{font:700 clamp(30px,4vw,44px)/1.05 var(--fd);margin:4px 0}
.sim-verdict p{margin:8px 0 0;max-width:62ch;color:var(--tx2)}
.sim-verdict-v{font:500 12.5px var(--fm);color:var(--tx3)!important}
.sim-overall{text-align:center;display:flex;flex-direction:column;align-items:center;line-height:1}
.sim-overall b{font:700 92px/0.9 var(--fd);letter-spacing:-.03em}
.sim-overall span{font:500 12.5px var(--fm);color:var(--tx3);margin-top:8px}
.sim-grain{display:grid;gap:10px 28px;align-items:center;margin-top:8px}
.gr-fig{max-width:420px;margin:0 auto;width:100%}
.sim-flower{width:100%;height:auto;display:block}
.fl-ring{fill:none;stroke:var(--ln2);stroke-width:1}
.fl-p{fill:var(--gold);stroke:#0b1024;stroke-width:1.5}
.fl-c{fill:var(--n0);stroke:var(--gold);stroke-width:2}
.fl-o{font:700 22px var(--fd);fill:var(--tx)}
.fl-l{font:500 14px var(--ft);fill:var(--tx2)}
.fl-v{font:500 14px var(--fm);fill:var(--gold2)}
.sim-scorelist{list-style:none;padding:0;margin:8px 0 0;display:grid;gap:12px}
.sl-h{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:14px;font-weight:600}
.sl-h b{font:700 22px/1 var(--fd)}
.sl-bar{display:block;height:5px;border-radius:99px;background:var(--n3);overflow:hidden;margin:6px 0 4px}
.sl-bar i{display:block;height:100%;background:var(--gold)}
.sim-scorelist p{margin:0;font-size:12.5px;color:var(--tx3)}
.sim-trace{margin:10px 0 4px;background:var(--n1);border:1px solid var(--ln);border-radius:18px;padding:16px 16px 12px}
.sim-trace svg{width:100%;height:auto;display:block}
.tr-a.v-yes{fill:var(--pour)}.tr-a.v-abs{fill:var(--abst)}.tr-a.v-unk{fill:#1e2753}.tr-a.v-no{fill:var(--contre)}
.tr-ph{stroke:rgba(255,255,255,.35);stroke-dasharray:3 4}
.tr-th{stroke:#fff;stroke-width:1.5;stroke-dasharray:6 4}
.tr-t{font:500 11px var(--fm);fill:var(--tx2)}
.tr-t.b{fill:#fff;paint-order:stroke;stroke:#0b1024;stroke-width:4px;stroke-linejoin:round}
.sim .sim-trace .vd-legend{margin-top:10px}
.sim-relrow{display:grid;grid-template-columns:minmax(0,auto) 1fr 44px;align-items:center;gap:12px;padding:6px 0;max-width:420px}
.rr-bar{height:6px;border-radius:99px;background:var(--n3);overflow:hidden}
.rr-bar i{display:block;height:100%}
.rr-bar.up i{background:var(--pour)}.rr-bar.down i{background:var(--contre)}
.sim-up{color:var(--pour);font:600 14px var(--fm);text-align:right}.sim-down{color:var(--contre);font:600 14px var(--fm);text-align:right}

/* Chronologie */
.sim-logph h3{display:flex;align-items:center;gap:10px}
.sim-logph .s7-n{width:26px;height:26px;font-size:11.5px}
.sim-log{list-style:none;padding:0 0 0 12px;margin:0 0 8px 12px;border-left:1px solid var(--ln)}
.sim-log li{display:grid;grid-template-columns:52px 1fr;column-gap:10px;padding:8px 0 8px 10px;position:relative}
.sim-log li::before{content:"";position:absolute;left:-17px;top:15px;width:9px;height:9px;border-radius:50%;background:var(--n0);border:1.5px solid var(--tx3)}
.sim-log time{font:500 12.5px var(--fm);color:var(--gold2);grid-row:span 2;padding-top:1px}
.sim-logcat{font:500 11px var(--fm);color:var(--tx3)}
.sim-log p{margin:0;font-size:14px;color:var(--tx)}
.sim-log .c-bilateral::before{border-color:#9fb2ff}.sim-log .c-coalition::before{border-color:var(--pour)}.sim-log .c-ai::before{border-color:var(--warn)}.sim-log .c-amend::before{border-color:#c6a6ff}.sim-log .c-vote::before{border-color:var(--contre);background:var(--contre)}
.sim-log .c-bilateral .sim-logcat{color:#9fb2ff}.sim-log .c-coalition .sim-logcat{color:var(--pour)}.sim-log .c-ai .sim-logcat{color:var(--warn)}.sim-log .c-amend .sim-logcat{color:#c6a6ff}.sim-log .c-vote .sim-logcat{color:var(--contre)}

@media (min-width:640px){
  .sim-bodies{grid-template-columns:1fr 1fr}
  .sim-cols{grid-template-columns:1fr 1fr}
  .sim-stats{grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
  .sim-orients,.sim-args{grid-template-columns:1fr 1fr}
  .sim-phases{grid-template-columns:1fr 1fr}
  .sim-hist{grid-template-columns:1fr 1fr}
  .sim-how .how-grid{grid-template-columns:repeat(3,1fr);gap:24px}
  .sim-doc{padding:44px 56px 36px}
  .sim-log li{grid-template-columns:56px 110px 1fr}
  .sim-log time{grid-row:auto}
}
@media (min-width:900px){
  .sim-hero{grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:44px}
  .sim-opts{grid-template-columns:1fr 1fr}
  .sim-dipgrid{grid-template-columns:300px minmax(0,1fr);align-items:start}
  .sim-groups{grid-template-columns:1fr 1fr}
  .sim-bodies{grid-template-columns:repeat(3,1fr)}
  .sim-grain{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
  .sim-phases{grid-template-columns:repeat(4,1fr)}
  .sim-phases li{grid-template-columns:1fr;row-gap:6px}
  .s7-n{grid-row:auto}
  .sim-hist{grid-template-columns:repeat(3,1fr)}
}
@media (min-width:1040px){
  .sim-layout{grid-template-columns:minmax(0,1fr) 330px;align-items:start;gap:24px}
  .sim-aside{display:block;position:sticky;top:84px;margin-top:16px;border:1px solid var(--ln);background:var(--n1);border-radius:20px;padding:16px 18px;max-height:calc(100vh - 100px);overflow:auto;scrollbar-width:thin}
  .sim-inline-sit{display:none}
}
@media (max-width:859px){
  .sim-now{bottom:calc(84px + env(safe-area-inset-bottom));border-radius:16px;padding:9px 9px 9px 14px;gap:6px 10px}
  .sim-now p{font-size:13px;min-width:0;flex-basis:calc(100% - 80px)}
  .sim-now .sim-btn{flex:1 1 auto}
  .now-k{display:none}
  /* pendant la saisie, le clavier occupe le bas de l'écran : la barre s'efface */
  .sim:has(textarea:focus,input:focus) .sim-now{display:none}
  html body:has(.sim-now) .toast{bottom:calc(168px + env(safe-area-inset-bottom))}
}
@media (max-width:639px){
  .sim{padding-top:22px}
  .sim-tabs{padding-right:30px;-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 34px),transparent);mask-image:linear-gradient(90deg,#000 calc(100% - 34px),transparent)}
  .fl-l,.fl-v{font-size:17px}
  .fl-o{font-size:28px}
  .dm-me-l{font-size:30px;stroke-width:6px}
  .sim-stage{padding:0 14px}
  .sim-card,.sim-inline-sit{padding:16px 14px 18px;border-radius:18px}
  .sim-roombox{overflow-x:auto;-webkit-overflow-scrolling:touch}
  .sim-room:not(.mini){min-width:660px}
  .cam-sub{margin:-46px 8px 0}
  .cam-sub p{font-size:14px;padding:8px 10px}
  .cam-where{display:none}
  .sim-seg{display:flex;width:100%;border-radius:14px}
  .sim-seg .sim-btn{flex:1;border-radius:10px;padding:7px 8px}
  .sim-rail li:not(.on) .l{display:none}
  .sim-rail li.on .l{position:absolute;top:34px;left:50%;transform:translateX(-50%)}
  .sim-rail li:first-child.on .l{left:0;transform:none}
  .sim-rail li:last-child.on .l{left:auto;right:0;transform:none}
  .sim-rail{margin-bottom:34px}
  .sim .m-title{font-size:25px}
  .m-clock{margin-left:0}
  .sim-tallies b{font-size:42px}
  .sim-overall b{font-size:72px}
  .ln-row{grid-template-columns:minmax(0,1fr) minmax(90px,1.6fr) minmax(0,1fr);gap:8px}
  .ln-end{font-size:11px}
  .sim-sp.k-reply,.sim-sp.k-support,.sim-sp.k-contest,.sim-sp.k-question{margin-left:10px}
}
@media (prefers-reduced-motion:reduce){
  .sim *{animation:none!important;transition:none!important}
}
`;

/* =====================================================================
   INFOGRAPHIES : salles, personnages, carte du monde, carte des positions,
   schéma de la règle de vote. Tout est dessiné en SVG, sans image externe.
   Les personnages sont des silhouettes neutres : aucun attribut national.
   ===================================================================== */
const SHORT = { ARE: "Émirats ar. u.", KOR: "Rép. de Corée", TTO: "Trinité-et-T.", SAU: "Arabie saoud.", ZAF: "Afrique du Sud", NZL: "Nouv.-Zélande", CIV: "Côte d'Ivoire", GBR: "Royaume-Uni", USA: "États-Unis" };

const EN_SHORT = { ARE: "UAE", KOR: "Rep. of Korea", TTO: "Trinidad & T.", SAU: "Saudi Arabia", ZAF: "South Africa", NZL: "New Zealand", CIV: "Côte d'Ivoire", GBR: "UK", USA: "USA" };
LANG_HOOKS.push(() => swapFields(SHORT, EN_SHORT, keysOf(EN_SHORT)));
const shortName = c => SHORT[c] || cnm(c);
const hashCode = s => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
const f1 = n => Math.round(n * 10) / 10;

/* ---------- Personnages ---------- */
/* teintes moyennes : les silhouettes restent lisibles sur le fond sombre de la salle */
const SUITS = ["#5865b8", "#6a5cae", "#4a6fa8", "#5d6596", "#7462a8", "#4f7f99", "#6b6fa0"];
const HEADS = ["#eef0fa", "#e4e7f6", "#f3f4fb"];
function avatar(x, y, s, o = {}) {
  const h = hashCode(o.seed || "x"), suit = o.suit || SUITS[h % SUITS.length], head = HEADS[(h >>> 3) % HEADS.length], hair = o.hair != null ? o.hair : (h >>> 6) % 4;
  const hairShape = [
    "",
    `<path d="M-7,-11 a7,7 0 0 1 14,0 l-2,-1 a6,5 0 0 0 -10,0 z" fill="${suit}" opacity=".85"/>`,
    `<circle cx="0" cy="-17.5" r="3.2" fill="${suit}" opacity=".85"/><path d="M-7,-10 a7,7 0 0 1 14,0 l-1.5,-.6 a6,5 0 0 0 -11,0 z" fill="${suit}" opacity=".85"/>`,
    `<path d="M-7.6,-8 a7.6,7.6 0 0 1 15.2,0 l0,5 l-2.4,0 l0,-4 a5.4,5 0 0 0 -10.4,0 l0,4 l-2.4,0 z" fill="${suit}" opacity=".85"/>`
  ][hair];
  return `<g class="sim-av${o.cls ? " " + o.cls : ""}" transform="translate(${f1(x)},${f1(y)}) scale(${s})">
    <circle cx="0" cy="-3" r="17" class="sim-av-ring${o.ring ? " on" : ""}${o.speak ? " speak" : ""}"/>
    <path d="M-13,13 C-13,3 -7,-1 0,-1 C7,-1 13,3 13,13 Z" fill="${suit}"/>
    <path d="M-2.2,-1 L0,5 L2.2,-1 Z" fill="#fff" opacity=".85"/>
    <circle cx="0" cy="-9" r="7" fill="${head}"/>${hairShape}</g>`;
}
function bubble(x, y) {
  return `<g class="sim-bubble" transform="translate(${f1(x)},${f1(y)})"><path d="M-12,-11 h24 a5,5 0 0 1 5,5 v6 a5,5 0 0 1 -5,5 h-14 l-5,5 v-5 h-5 a5,5 0 0 1 -5,-5 v-6 a5,5 0 0 1 5,-5 z"/><circle cx="-6" cy="-3" r="1.6"/><circle cx="0" cy="-3" r="1.6"/><circle cx="6" cy="-3" r="1.6"/></g>`;
}
function gavel(x, y) {
  return `<g transform="translate(${f1(x)},${f1(y)}) rotate(-30)" class="sim-gavel"><rect x="-6" y="-3" width="12" height="6" rx="1.5"/><rect x="-1" y="2" width="2" height="11" rx="1"/></g>`;
}

/* ---------- Salles ---------- */
const ROOM_KIND = { UNSC: "horseshoe", TRUST: "horseshoe", UNGA: "hemicycle", UNESCO_GC: "hemicycle", UNESCO_PC: "hemicycle", UNHRC: "hemicycle", ECOSOC: "hemicycle", UNESCO_EB: "utable", WHC: "utable", ICH: "utable" };
const rad = d => d * Math.PI / 180;
function roomLayout(kind, n) {
  const seats = [];
  if (kind === "horseshoe") {
    const W = 800, H = 410, cx = 400, cy = 226, R = n <= 6 ? 125 : 150;
    const nl = Math.floor(n / 2), nr = n - nl;
    const left = [], right = [];
    for (let i = 0; i < nl; i++) left.push(nl === 1 ? 200 : 148 + i * (98 / (nl - 1)));
    for (let i = 0; i < nr; i++) right.push(nr === 1 ? 340 : 294 + i * (98 / (nr - 1)));
    for (const t of left.concat(right)) {
      const a = rad(t), c = Math.cos(a), sn = Math.sin(a);
      seats.push({ ax: cx + (R + 32) * c, ay: cy + (R + 32) * sn + 6, lx: cx + (R + 64) * c, ly: cy + (R + 64) * sn + 4, anchor: c < -0.35 ? "end" : c > 0.35 ? "start" : "middle", dx: cx + (R + 2) * c, dy: cy + (R + 2) * sn });
    }
    const a0 = rad(140), a1 = rad(400);
    const arc = r => `M${f1(cx + r * Math.cos(a0))},${f1(cy + r * Math.sin(a0))} A${r},${r} 0 1 1 ${f1(cx + r * Math.cos(a1))},${f1(cy + r * Math.sin(a1))}`;
    const decor = `<path d="${arc(R)}" class="sim-table" stroke-width="30"/><path d="${arc(R - 15)}" class="sim-table-edge"/><path d="${arc(R + 15)}" class="sim-table-edge"/>
      <rect x="${cx - 70}" y="${cy + 10}" width="140" height="34" rx="6" class="sim-desk"/><text x="${cx}" y="${cy + 31}" ${L("class=\"sim-room-note\">Secrétariat</text>", "class=\"sim-room-note\">Secretariat</text>")}`;
    return { W, H, seats, chair: { x: cx, y: cy - R - 30, lx: cx, ly: cy - R - 66, bub: -1 }, decor };
  }
  if (kind === "hemicycle") {
    const W = 800, H = 478, cx = 400, cy = 360;
    const inner = Math.min(n, Math.round(n * 0.44)), outer = n - inner;
    const rows = [[178, inner], [262, outer]];
    let decor = "";
    for (const [r, k] of rows) {
      const t0 = 196, t1 = 344;
      decor += `<path d="M${f1(cx + (r - 16) * Math.cos(rad(t0 - 6)))},${f1(cy + (r - 16) * Math.sin(rad(t0 - 6)))} A${r - 16},${r - 16} 0 0 1 ${f1(cx + (r - 16) * Math.cos(rad(t1 + 6)))},${f1(cy + (r - 16) * Math.sin(rad(t1 + 6)))}" class="sim-table" stroke-width="16"/>`;
      for (let i = 0; i < k; i++) {
        const t = rad(k === 1 ? 270 : t0 + i * (t1 - t0) / (k - 1)), c = Math.cos(t), sn = Math.sin(t);
        const ax = cx + (r + 8) * c, ay = cy + (r + 8) * sn + 4;
        seats.push({ ax, ay, lx: ax, ly: ay + 22, anchor: "middle", plate: true });
      }
    }
    decor += `<rect x="${cx - 30}" y="${cy - 6}" width="60" height="26" rx="5" class="sim-desk rostrum"/><text x="${cx}" y="${cy + 11}" ${L("class=\"sim-room-note\">Tribune</text>", "class=\"sim-room-note\">Rostrum</text>")}<rect x="${cx - 130}" y="${cy + 74}" width="260" height="30" rx="6" class="sim-desk"/>`;
    return { W, H, seats, chair: { x: cx, y: cy + 74, lx: cx + 150, ly: cy + 94, anchor: "start" }, decor };
  }
  // table en U
  const W = 800, H = 470, x0 = 170, x1 = 630, y0 = 92, y1 = 420;
  const top = Math.min(4, Math.max(0, n - 6)), side = n - top, nl = Math.floor(side / 2), nr = side - nl;
  const add = (x, y, anchor, lx, ly) => seats.push({ ax: x, ay: y, lx, ly, anchor, dx: x, dy: y });
  for (let i = 0; i < top; i++) { const half = Math.ceil(top / 2), k = i % half; const x = 400 + (i < half ? -1 : 1) * (84 + k * 78); add(x, y0 - 18, "middle", x, y0 - 50); }
  for (let i = 0; i < nl; i++) { const y = y0 + 58 + i * ((y1 - y0 - 70) / Math.max(1, nl - 1 || 1)); add(x0 - 30, y, "end", x0 - 56, y + 4); }
  for (let i = 0; i < nr; i++) { const y = y0 + 58 + i * ((y1 - y0 - 70) / Math.max(1, nr - 1 || 1)); add(x1 + 30, y, "start", x1 + 56, y + 4); }
  const decor = `<path d="M${x0},${y1} V${y0} H${x1} V${y1}" class="sim-table" stroke-width="28" stroke-linejoin="round"/><path d="M${x0 + 14},${y1} V${y0 + 14} H${x1 - 14} V${y1}" class="sim-table-edge"/><path d="M${x0 - 14},${y1} V${y0 - 14} H${x1 + 14} V${y1}" class="sim-table-edge"/>
    <rect x="330" y="${(y0 + y1) / 2 + 20}" width="140" height="34" rx="6" class="sim-desk"/><text x="400" y="${(y0 + y1) / 2 + 41}" ${L("class=\"sim-room-note\">Secrétariat</text>", "class=\"sim-room-note\">Secretariat</text>")}`;
  return { W, H, seats, chair: { x: 400, y: y0 - 20, lx: 400, ly: y0 + 34 }, decor };
}
/* Placement des sièges : ordre alphabétique, comme dans la plupart des salles */
function roomSVG(S, opts = {}) {
  const b = bodyOf(S), kind = ROOM_KIND[b.id] || "hemicycle", mini = !!opts.mini, sc = mini ? 1.5 : 1.12;
  const members = sortFr(S.scen.members), RL = roomLayout(kind, members.length);
  const lastSpeech = [...S.speeches].reverse().find(sp => sp.code && sp.kind === "debate");
  const speaking = S.phase === 3 && lastSpeech ? lastSpeech.code : null;
  const chairSpeaks = S.phase <= 2 || (S.phase === 3 && !lastSpeech) || S.phase === 5 || (S.phase === 6 && !S.vote);
  const votes = S.vote ? S.vote.votes : null;
  const est = opts.estimate && !votes ? projection(S).votes : null;
  const seats = members.map((code, i) => {
    const p = RL.seats[i], me = code === S.player, d = S.dels[code];
    const v = votes ? votes[code] : est && (me || d.known.pos) ? est[code] : null;
    const name = H(shortName(code));
    const tw = Math.max(34, name.length * 5.4 + 10);
    const plate = mini ? "" : p.plate
      ? `<rect x="${f1(p.lx - tw / 2)}" y="${f1(p.ly - 7.5)}" width="${f1(tw)}" height="11" rx="1.5" class="sim-plate"/><text x="${f1(p.lx)}" y="${f1(p.ly + 0.7)}" class="sim-seat-l" text-anchor="middle">${name}</text>`
      : `<text x="${f1(p.lx)}" y="${f1(p.ly)}" class="sim-seat-l" text-anchor="${p.anchor}">${name}</text>`;
    const light = v ? `<circle cx="${f1(p.ax + 15 * sc)}" cy="${f1(p.ay - 18 * sc)}" r="${f1(6 * sc)}" class="sim-light v-${v}"/>` : "";
    const co = S.draft && S.draft.cosponsors.includes(code) ? `<circle cx="${f1(p.ax - 15 * sc)}" cy="${f1(p.ay - 18 * sc)}" r="${f1(4 * sc)}" class="sim-co"/>` : "";
    return `<g class="sim-seat${me ? " me" : ""}${code === speaking ? " speaking" : ""}${v ? " v-" + v : ""}" data-a="seat" data-x="${code}" tabindex="0" role="button" aria-label="${H(cnm(code))}${v ? L(" : ", ": ") + voteWord(v) : ""}"><title>${H(cnm(code))}${v ? " · " + voteWord(v) : ""}${me ? L(" · votre délégation", " · your delegation") : ""}</title>
      ${avatar(p.ax, p.ay, sc, { seed: code, ring: me || code === speaking, speak: code === speaking, cls: me ? "me" : "" })}${plate}${light}${co}${code === speaking ? bubble(p.ax + (p.anchor === "end" ? 28 : p.anchor === "start" ? -28 : 26) * sc, p.ay - 34 * sc) : ""}</g>`;
  }).join("");
  const C = RL.chair;
  const chair = `<g class="sim-chairfig${chairSpeaks ? " speaking" : ""}"><title>${H(chairTitle(S))}</title>${avatar(C.x, C.y, mini ? 1.6 : 1.25, { seed: "chair-" + S.id, suit: "#8d95d8", ring: chairSpeaks, speak: chairSpeaks, hair: 1 })}${gavel(C.x + 24, C.y + 6)}${mini ? "" : `<text x="${f1(C.lx)}" y="${f1(C.ly)}" class="sim-seat-l chair" text-anchor="${C.anchor || "middle"}">${L("Présidence", "Chair")}</text>`}${chairSpeaks ? bubble(C.x + (C.bub || 1) * 34, C.y - 30) : ""}</g>`;
  const gid = uid("simfloor");
  return `<svg class="sim-room k-${kind}${mini ? " mini" : ""}" viewBox="0 0 ${RL.W} ${RL.H}" role="group" aria-label="${H(L("Salle " + b.de + " : " + members.length + " délégations", "Room " + b.de + ": " + members.length + " delegations"))}">
    <defs><radialGradient id="${gid}" cx="50%" cy="${kind === "hemicycle" ? "78%" : "45%"}" r="70%"><stop offset="0" class="fl-a"/><stop offset="1" class="fl-b"/></radialGradient></defs>
    <rect x="6" y="6" width="${RL.W - 12}" height="${RL.H - 12}" rx="26" class="sim-floor" fill="url(#${gid})"/>${RL.decor}${chair}${seats}</svg>`;
}
function roomLegend(S) {
  const parts = [`<span><i class="lg-me">${L("</i>votre délégation</span>", "</i>your delegation</span>")}`];
  if (S.phase === 3) parts.push(`${L("<span><i class=\"lg-speak\"></i>à la parole</span>", "<span><i class=\"lg-speak\"></i>speaking</span>")}`);
  if (S.draft && S.draft.cosponsors.length) parts.push(`${L("<span><i class=\"lg-co\"></i>coauteur</span>", "<span><i class=\"lg-co\"></i>co-sponsor</span>")}`);
  if (S.vote) parts.push(`${L("<span><i class=\"lg-v yes\"></i>pour</span><span><i class=\"lg-v no\"></i>contre</span>", "<span><i class=\"lg-v yes\"></i>in favour</span><span><i class=\"lg-v no\"></i>against</span>")}<span><i class="lg-v abs"></i>abstention</span>`);
  return `<p class="sim-legend sim-camlegend">${parts.join("")}<span>${L("Touchez ou cliquez un siège pour en savoir plus.", "Tap or click a seat to find out more.")}</span></p>`;
}

/* ---------- Carte du monde ---------- */
const GROUP_COLORS = { AFR: "#4cc0af", APG: "#f0a35e", EEG: "#a48cf0", GRULAC: "#f27fb0", WEOG: "#6f9bff", I: "#6f9bff", II: "#a48cf0", III: "#f27fb0", IV: "#f0a35e", Va: "#4cc0af", Vb: "#c9c26a" };
const VOTE_COLORS = { yes: "#4cc0af", no: "#f2788d", abs: "#a7abcf", unk: "#4a5383" };
const REL_COLORS = { r5: "#4cc0af", r4: "#93d9cd", r3: "#7d85ad", r2: "#f0a35e", r1: "#f2788d" };
function mapColors(S, mode) {
  const key = bodyOf(S).org === "UNESCO" ? "unesco" : "un", out = {};
  const proj = mode === "vote" && !S.vote ? projection(S).votes : null;
  for (const c of S.scen.members) {
    if (c === S.player) { out[c] = "#ebc000"; continue; }
    if (mode === "vote") { const v = S.vote ? S.vote.votes[c] : S.dels[c].known.pos ? proj[c] : "unk"; out[c] = VOTE_COLORS[v]; }
    else if (mode === "rel") out[c] = REL_COLORS[relLabel(S.dels[c].rel)[1]];
    else out[c] = GROUP_COLORS[COUNTRIES[c][key]];
  }
  return out;
}
function worldMap(S, mode = "group", opts = {}) { return dotMap(S, mode, opts); }
function mapLegend(S, mode) {
  if (mode === "vote") return `<p class="sim-legend"><span><i class="lg-sq" style="background:#ebc000">${L("</i>votre délégation</span>", "</i>your delegation</span>")}${Object.entries(LANG === "en" ? { yes: "in favour", no: "against", abs: "abstention", unk: "position unknown" } : { yes: "pour", no: "contre", abs: "abstention", unk: "position inconnue" }).map(([k, l]) => `<span><i class="lg-sq" style="background:${VOTE_COLORS[k]}"></i>${l}</span>`).join("")}</p>`;
  if (mode === "rel") return `<p class="sim-legend"><span><i class="lg-sq" style="background:#ebc000">${L("</i>votre délégation</span>", "</i>your delegation</span>")}${(LANG === "en" ? [["r5", "excellent"], ["r4", "good"], ["r3", "neutral"], ["r2", "strained"], ["r1", "difficult"]] : [["r5", "excellente"], ["r4", "bonne"], ["r3", "neutre"], ["r2", "tendue"], ["r1", "difficile"]]).map(([k, l]) => `<span><i class="lg-sq" style="background:${REL_COLORS[k]}"></i>${l}</span>`).join("")}</p>`;
  const key = bodyOf(S).org === "UNESCO" ? "unesco" : "un", names = key === "un" ? UN_GROUPS_SHORT : UNESCO_GROUPS;
  const present = [...new Set(S.scen.members.map(c => COUNTRIES[c][key]))];
  return `<p class="sim-legend"><span><i class="lg-sq" style="background:#ebc000">${L("</i>votre délégation</span>", "</i>your delegation</span>")}${Object.keys(names).filter(g => present.includes(g)).map(g => `<span><i class="lg-sq" style="background:${GROUP_COLORS[g]}"></i>${H(key === "un" ? names[g] : names[g].replace(/^Groupe /, "Groupe "))}</span>`).join("")}</p>`;
}
function mapBlock(S, modes, cur) {
  const m = modes.includes(cur) ? cur : modes[0];
  const label = LANG === "en" ? { group: "Regional groups", vote: S.vote ? "Final vote" : "Estimated vote", rel: "Relations" } : { group: "Groupes régionaux", vote: S.vote ? "Vote final" : "Vote estimé", rel: "Relations" };
  return `<div class="sim-mapbox">${modes.length > 1 ? `<div class="sim-chips sim-mapmodes">${modes.map(k => `<button type="button" class="sim-chip${k === m ? " on" : ""}" data-a="mapMode" data-x="${k}" aria-pressed="${k === m}">${label[k]}</button>`).join("")}</div>` : ""}${worldMap(S, m)}${mapLegend(S, m)}</div>`;
}

/* ---------- Carte des positions ---------- */
function positionMap(S, ax, ay) {
  const W = 560, Hh = 410, pl = 30, pr = 30, pt = 26, pb = 34;
  const X = v => pl + (clamp(v, -1, 1) + 1) / 2 * (W - pl - pr), Y = v => Hh - pb - (clamp(v, -1, 1) + 1) / 2 * (Hh - pt - pb);
  const proj = S.phase >= 4 ? projection(S).votes : null, R = S.phase >= 4 ? textVec(S) : null;
  const pts = [], unknown = [];
  for (const c of S.scen.members) {
    if (c === S.player) continue;
    const d = S.dels[c];
    if (!d.known.pos) { unknown.push(c); continue; }
    pts.push({ c, x: X(d.pos[ax]), y: Y(d.pos[ay]), r: 4 + COUNTRIES[c].infl * 1.4, fill: proj ? VOTE_COLORS[proj[c]] : REL_COLORS[relLabel(d.rel)[1]] });
  }
  const me = S.dels[S.player], line = S.line || me.pos;
  const placed = [{ x: X(line[ax]) - 16, y: Y(line[ay]) - 11, w: 32 }];
  if (R) placed.push({ x: X(R[ax]) - 18, y: Y(R[ay]) + 22, w: 36 }, { x: X(R[ax]) - 8, y: Y(R[ay]) + 8, w: 16 });
  const fits = (x, y, w) => x > 2 && x + w < W - 2 && y > 12 && y < Hh - 4 && !placed.some(b => x < b.x + b.w && x + w > b.x && y - 10 < b.y && y > b.y - 10);
  const labels = pts.sort((a, b) => b.r - a.r).map(p => {
    const t = shortName(p.c), w = t.length * 5.5 + 4;
    for (const [dx, dy, an] of [[p.r + 3, 4, "start"], [-p.r - 3 - w, 4, "end"], [-w / 2, -p.r - 4, "middle"], [-w / 2, p.r + 12, "middle"]]) {
      const x = p.x + dx, y = p.y + dy;
      if (fits(x, y, w)) { placed.push({ x, y, w }); return `<text x="${f1(an === "end" ? x + w : an === "middle" ? x + w / 2 : x)}" y="${f1(y)}" text-anchor="${an}" class="sim-pm-l">${H(t)}</text>`; }
    }
    return "";
  }).join("");
  const grid = `<rect x="${pl}" y="${pt}" width="${W - pl - pr}" height="${Hh - pt - pb}" class="sim-pm-box"/>
    <line x1="${X(0)}" y1="${pt}" x2="${X(0)}" y2="${Hh - pb}" class="sim-pm-axis"/><line x1="${pl}" y1="${Y(0)}" x2="${W - pr}" y2="${Y(0)}" class="sim-pm-axis"/>
    <text x="${pl + 4}" y="${Hh - 12}" class="sim-pm-t">← ${H(AXES[ax].neg)}</text><text x="${W - pr - 4}" y="${Hh - 12}" class="sim-pm-t" text-anchor="end">${H(AXES[ax].pos)} →</text>
    <text x="${pl + 4}" y="${pt - 9}" class="sim-pm-t">↑ ${H(AXES[ay].pos)}</text><text x="${pl + 4}" y="${Hh - pb - 6}" class="sim-pm-t sm">↓ ${H(AXES[ay].neg)}</text>`;
  const dots = pts.map(p => `<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="${f1(p.r)}" fill="${p.fill}" class="sim-pm-dot" data-a="seat" data-x="${p.c}" tabindex="0" role="button" aria-label="${H(cnm(p.c))}"><title>${H(cnm(p.c))}</title></circle>`).join("");
  const mx = X(line[ax]), my = Y(line[ay]);
  const meMark = `<g class="sim-pm-me"><circle cx="${f1(mx)}" cy="${f1(my)}" r="9"/><text x="${f1(mx)}" y="${f1(my - 13)}" text-anchor="middle" class="sim-pm-l b">${L("Vous", "You")}</text></g>`;
  const txt = R ? `<g class="sim-pm-txt"><rect x="${f1(X(R[ax]) - 6)}" y="${f1(Y(R[ay]) - 6)}" width="12" height="12" transform="rotate(45 ${f1(X(R[ax]))} ${f1(Y(R[ay]))})"/><text x="${f1(X(R[ax]))}" y="${f1(Y(R[ay]) + 22)}" text-anchor="middle" class="sim-pm-l b">${L("Texte", "Text")}</text></g>` : "";
  return { svg: `<svg class="sim-pmap" viewBox="0 0 ${W} ${Hh}" role="group" ${L("aria-label=\"Carte des positions des délégations\"", "aria-label=\"Map of the positions of delegations\"")}>${grid}${dots}${labels}${txt}${meMark}</svg>`, unknown };
}
function positionBlock(S) {
  const issue = issueOf(S), me = S.dels[S.player];
  const def = issue.axes.slice().sort((a, b) => me.w[b] - me.w[a]);
  let [ax, ay] = UI.pm || [def[0], def[1]];
  if (!issue.axes.includes(ax)) ax = def[0];
  if (!issue.axes.includes(ay) || ay === ax) ay = def.find(a => a !== ax);
  const { svg, unknown } = positionMap(S, ax, ay);
  const sel = (id, v, other) => `<select id="${id}" data-a="pmAxis" data-x="${id === "sim-pmx" ? 0 : 1}">${issue.axes.filter(a => a !== other).map(a => `<option value="${a}"${a === v ? " selected" : ""}>${H(AXES[a].name)}</option>`).join("")}</select>`;
  return `<div class="sim-pmwrap"><div class="sim-row sim-pmsel"><label class="sim-lbl" for="sim-pmx">Horizontal</label>${sel("sim-pmx", ax, ay)}<label class="sim-lbl" for="sim-pmy">Vertical</label>${sel("sim-pmy", ay, ax)}</div>${svg}
    <p class="sim-legend"><span>${L("<i class=\"lg-me\"></i>votre ligne</span>", "<i class=\"lg-me\"></i>your line</span>")}${S.phase >= 4 ? `<span>${L("<i class=\"lg-txt\"></i>texte actuel</span>", "<i class=\"lg-txt\"></i>current text</span>")}${Object.entries(LANG === "en" ? { yes: "will vote in favour", no: "will vote against", abs: "will abstain" } : { yes: "votera pour", no: "votera contre", abs: "s'abstiendra" }).map(([k, l]) => `<span><i class="lg-sq round" style="background:${VOTE_COLORS[k]}"></i>${l}</span>`).join("")}` : `${L("<span>couleur : relation avec votre délégation</span>", "<span>colour: relations with your delegation</span>")}`}${L("<span>taille : influence</span>", "<span>size: influence</span>")}</p>
    ${unknown.length ? `<p class="sim-mute">${L("Positions encore inconnues : ", "Positions still unknown: ")}${unknown.map(c => H(cnm(c))).join(", ")}.</p>` : ""}</div>`;
}

/* ---------- Schéma de la règle de vote ---------- */
function ruleDiagram(S) {
  const rule = needRule(S), n = S.scen.members.length;
  const live = S.phase >= 4, e = live && !S.vote ? estimate(S) : null;
  const counts = S.vote ? { yes: S.vote.t.yes, no: S.vote.t.no, abs: S.vote.t.abs, unk: 0 } : e ? e.counts : null;
  if (rule.type === "unsc") {
    const order = counts ? [].concat(Array(counts.yes).fill("yes"), Array(counts.abs).fill("abs"), Array(counts.unk).fill("unk"), Array(counts.no).fill("no")) : Array(n).fill("unk");
    const cells = order.map((v, i) => `<span class="sim-rd-c v-${v}${i === 8 ? " th" : ""}"></span>`).join("");
    const p5 = P5.map(c => { const v = S.vote ? S.vote.votes[c] : e && (c === S.player || S.dels[c].known.pos) ? projection(S).votes[c] : "unk"; return `<span class="sim-rd-p5 v-${v}">${H(shortName(c))}</span>`; }).join("");
    return `<div class="sim-rd"><div class="sim-rd-h">${L("<b>9 voix pour sur 15</b><span>et aucun vote contre d'un membre permanent</span>", "<b>9 votes in favour out of 15</b><span>and no vote against by a permanent member</span>")}</div><div class="sim-rd-row">${cells}</div><div class="sim-rd-ticks"><span style="left:${(9 / 15) * 100}%"${L(">seuil : 9</span>", ">threshold: 9</span>")}</div>
      <div class="sim-rd-p5s">${L("<span class=\"sim-mute\">Membres permanents :</span>", "<span class=\"sim-mute\">Permanent members:</span>")}${p5}</div><p class="sim-mute">${L("Un seul vote contre d'un membre permanent bloque l'adoption (veto). Son abstention, elle, ne bloque pas.", "A single vote against by a permanent member blocks adoption (veto). Its abstention does not.")}</p></div>`;
  }
  const yes = counts ? counts.yes : 0, no = counts ? counts.no : 0, vot = Math.max(1, yes + no);
  const th = rule.type === "23" ? 2 / 3 : 0.5;
  return `<div class="sim-rd"><div class="sim-rd-h"><b>${rule.type === "23" ? L("Deux tiers des voix exprimées", "Two thirds of the votes cast") : L("Majorité des voix exprimées", "Majority of the votes cast")}</b><span>${rule.type === "23" ? L("au moins deux fois plus de voix pour que de voix contre", "at least twice as many votes in favour as against") : L("plus de voix pour que de voix contre", "more votes in favour than against")}${L(" ; les abstentions ne comptent pas</span>", "; abstentions do not count</span>")}</div>
    <div class="sim-rd-bar"><i class="yes" style="width:${counts ? (yes / vot) * 100 : 0}%"></i><i class="no" style="width:${counts ? (no / vot) * 100 : 0}%"></i><span class="sim-rd-th" style="left:${th * 100}%"></span></div>
    <div class="sim-rd-legend">${counts ? `${L(`<span class="yes">${yes} pour</span><span class="no">${no} contre</span><span>${counts.abs} abstention${counts.abs > 1 ? "s" : ""}${counts.unk ? ` · ${counts.unk} inconnue${counts.unk > 1 ? "s" : ""}` : ""}</span>`, `<span class="yes">${yes} in favour</span><span class="no">${no} against</span><span>${counts.abs} abstention${counts.abs !== 1 ? "s" : ""}${counts.unk ? ` · ${counts.unk} unknown` : ""}</span>`)}` : `<span class="sim-mute">${L("Le seuil se calcule sur les seules voix pour et contre.", "The threshold is calculated on votes in favour and against only.")}</span>`}</div></div>`;
}

/* =====================================================================
   INFOGRAPHIES (version 1.1)
   Points de vote face au seuil, curseurs « vers où penche… », fiches
   chiffrées avec leur source, scène de séance filmée avec sous-titres,
   carte du monde en points, fleur des scores, composition de la salle
   au fil de la séance. Tout est calculé à partir de l'état de la partie.
   ===================================================================== */
let SVG_UID = 0;
const uid = p => `${p}${++SVG_UID}`;
const pctOf = v => (clamp(v, -1, 1) + 1) * 50;
const plural = (n, one, many) => `${n} ${(LANG === "en" ? n !== 1 : n > 1) ? many : one}`;

/* ---------- Votes : connus, estimés ou inconnus ---------- */
function voteState(S) {
  if (S.vote) return { votes: Object.assign({}, S.vote.votes), final: true, rule: S.vote.t.rule };
  const p = projection(S), votes = {};
  for (const c of S.scen.members) votes[c] = c === S.player || S.dels[c].known.pos ? p.votes[c] : "unk";
  return { votes, final: false, rule: p.t.rule };
}
const VORDER = { yes: 0, abs: 1, unk: 2, no: 3 };
const VWORD = { yes: "pour", no: "contre", abs: "abstention", unk: "position inconnue" };
const EN_VWORD = { yes: "in favour", no: "against", abs: "abstention", unk: "position unknown" };
const EN_MAPMODE_LABEL = { group: "Regional groups", vote: "Vote", rel: "Relations" };
const EN_PHASE_HELP = [
  ["The chair opens the meeting and recalls the question and the voting rule.", "Everything that follows starts here: note the subject and what the body can decide."],
  ["Your capital sends you its instructions: its priorities, its red lines, its likely partners.", "Choose a negotiating line consistent with these instructions."],
  ["Each delegation takes the floor in turn. You discover their positions and set out your own.", "A clear, well-argued statement brings like-minded delegations closer to you."],
  ["The corridors open: you have 120 minutes to sound out, persuade, strike deals and convene groups.", "Every move takes time. Target the delegations that will swing the vote."],
  ["The text is examined paragraph by paragraph. Delegations table amendments: you accept them, reject them or propose a compromise.", "A text that is too ambitious loses votes; a text that is too weak no longer serves your objectives."],
  ["The text is put to the vote under the exact rule of the body. The simulator counts the votes, never the AI.", "Your own vote must remain consistent with your capital's instructions."],
  ["The meeting is adjourned. Here is what you achieved, and why.", "A rejected text is not always a failure: what counts are your objectives."]
];
LANG_HOOKS.push(() => {
  swapFields(VWORD, EN_VWORD, keysOf(EN_VWORD));
  swapFields(MAPMODE_LABEL, EN_MAPMODE_LABEL, keysOf(EN_MAPMODE_LABEL));
  PHASE_HELP.forEach((p, i) => swapFields(p, EN_PHASE_HELP[i] ? { 0: EN_PHASE_HELP[i][0], 1: EN_PHASE_HELP[i][1] } : null, [0, 1]));
});

function voteDots(S, o = {}) {
  const vs = voteState(S), rule = vs.rule, n = S.scen.members.length, unsc = rule.type === "unsc";
  const list = S.scen.members.slice().sort((a, b) => VORDER[vs.votes[a]] - VORDER[vs.votes[b]] || (a === S.player ? -1 : b === S.player ? 1 : cnm(a).localeCompare(cnm(b), LANG)));
  const c = { yes: 0, no: 0, abs: 0, unk: 0 };
  for (const k of list) c[vs.votes[k]]++;
  const big = n > 24;
  const dots = list.map(code => `<i class="vd v-${vs.votes[code]}${code === S.player ? " me" : ""}${S.bodyId === "UNSC" && P5.includes(code) ? " p5" : ""}" title="${H(cnm(code))}${L(" : ", ": ")}${H(VWORD[vs.votes[code]])}"></i>`).join("");
  const th = unsc ? `<span class="vd-th" style="left:calc(${(9 / n) * 100}% - 1px)">${L("<span>9 voix</span>", "<span>9 votes</span>")}</span>` : "";
  let say;
  const vetoes = S.bodyId === "UNSC" ? P5.filter(p => vs.votes[p] === "no") : [];
  if (unsc) say = L(`<b>${c.yes} pour</b> sur ${n}. Il en faut 9, sans vote contre d'un membre permanent.${vetoes.length ? ` ${H(vetoes.map(cnm).join(" et "))} ${vetoes.length > 1 ? "voteraient" : "voterait"} contre : ce serait un veto.` : ""}`, `<b>${c.yes} in favour</b> out of ${n}. Nine are needed, with no vote against by a permanent member.${vetoes.length ? ` ${H(vetoes.map(cnm).join(" and "))} would vote against: that would be a veto.` : ""}`);
  else if (rule.type === "23") say = L(`<b>${c.yes} pour, ${c.no} contre.</b> Il faut au moins deux fois plus de voix pour que de voix contre ; les abstentions ne comptent pas.`, `<b>${c.yes} in favour, ${c.no} against.</b> At least twice as many votes in favour as against are needed; abstentions do not count.`);
  else say = L(`<b>${c.yes} pour, ${c.no} contre.</b> Il faut plus de voix pour que de voix contre ; les abstentions ne comptent pas.`, `<b>${c.yes} in favour, ${c.no} against.</b> More votes in favour than against are needed; abstentions do not count.`);
  if (!vs.final && c.unk) say += ` ${plural(c.unk, L("position reste inconnue", "position is still unknown"), L("positions restent inconnues", "positions are still unknown"))}.`;
  let status = "";
  if (!vs.final && o.status !== false) {
    const e = estimate(S);
    status = `<p class="vd-status ${e.status}">${e.status === "ok" ? L("En l'état, le texte serait adopté.", "As things stand, the text would be adopted.") : e.status === "ko" ? L("En l'état, le texte serait rejeté.", "As things stand, the text would be rejected.") : L("Issue incertaine : tout dépend des positions inconnues.", "Uncertain outcome: everything depends on the unknown positions.")}</p>`;
  }
  const legend = o.legend === false ? "" : `<p class="vd-legend">${L("<span><i class=\"vd v-yes\"></i>pour</span><span><i class=\"vd v-abs\"></i>abstention</span><span><i class=\"vd v-unk\"></i>inconnue</span><span><i class=\"vd v-no\"></i>contre</span><span><i class=\"vd me\"></i>vous</span>", "<span><i class=\"vd v-yes\"></i>in favour</span><span><i class=\"vd v-abs\"></i>abstention</span><span><i class=\"vd v-unk\"></i>unknown</span><span><i class=\"vd v-no\"></i>against</span><span><i class=\"vd me\"></i>you</span>")}${S.bodyId === "UNSC" ? `${L("<span><i class=\"vd p5\"></i>membre permanent</span>", "<span><i class=\"vd p5\"></i>permanent member</span>")}` : ""}</p>`;
  return `<div class="sim-vd${big ? " big" : ""}"><div class="vd-row" style="--n:${n}">${dots}${th}</div><p class="vd-say">${say}</p>${status}${legend}</div>`;
}

/* ---------- Curseurs : vers quel côté penche une position ---------- */
function leanWord(v, a) {
  const x = clamp(v, -1, 1), side = x > 0 ? AXES[a].pos : AXES[a].neg;
  if (LANG === "en") return Math.abs(x) < 0.15 ? "towards the middle" : Math.abs(x) < 0.5 ? `slightly towards \u201c${side}\u201d` : `clearly towards \u201c${side}\u201d`;
  return Math.abs(x) < 0.15 ? "à l'équilibre" : Math.abs(x) < 0.5 ? `un peu vers « ${side} »` : `nettement vers « ${side} »`;
}
/* marks : [{ v, k: "cap" | "del" | "txt" | "oth", t: libellé }] ; red : { thr, dir } */
function leanRow(a, marks, o = {}) {
  const A = AXES[a];
  const m = marks.filter(x => x && x.v != null).map(x => `<span class="ln-m ${x.k}" style="left:${pctOf(x.v).toFixed(1)}%" title="${H(x.t || "")}"></span>`).join("");
  const red = o.red ? `<span class="ln-red ${o.red.dir}" style="left:${pctOf(o.red.thr).toFixed(1)}%" ${L("title=\"Ligne rouge\"", "title=\"Red line\"")}></span>` : "";
  return `<div class="sim-ln"><div class="ln-h"><span>${H(A.name)}</span>${o.tag ? `<em>${H(o.tag)}</em>` : ""}</div>
    <div class="ln-row"><span class="ln-end">${H(A.neg)}</span><div class="ln-track">${red}${m}</div><span class="ln-end r">${H(A.pos)}</span></div>
    ${o.say ? `<p class="ln-say">${o.say}</p>` : ""}</div>`;
}

/* ---------- Fiches chiffrées ---------- */
function statCards(facts, src) {
  return `<div class="sim-stats">${facts.map(f => `<div class="sim-stat"><span class="st-k">${H(f.label)}</span><b>${H(fmtFact(f))}</b><span class="st-src">${H(src)}</span></div>`).join("")}</div>`;
}

/* ---------- Carte du monde en points ---------- */
const MAPMODE_LABEL = { group: "Groupes régionaux", vote: "Vote", rel: "Relations" };
function dotMap(S, mode = "group", opts = {}) {
  const members = opts.members || S.scen.members, me = opts.player || S.player, col = mapColors(S, mode);
  const click = opts.click !== false, id = uid("simdots"), idm = uid("simdotm");
  const memberShapes = members.map(c => MAP.c[c] ? `<path d="${MAP.c[c]}"/>` : "").join("");
  const others = Object.keys(MAP.c).filter(c => !members.includes(c)).map(c => `<path d="${MAP.c[c]}"/>`).join("");
  const dots = sortFr(members).filter(c => MAP.ctr[c]).sort((a, b) => (a === me) - (b === me)).map(c => {
    const [x, y] = MAP.ctr[c], r = c === me ? 9 : 4.5 + (COUNTRIES[c].infl || 2) * 0.9;
    return `<g class="dm-c${c === me ? " me" : ""}"${click ? ` data-a="mapsel" data-x="${c}" tabindex="0" role="button"` : ""} aria-label="${H(cnm(c))}"><title>${H(cnm(c))}</title><circle cx="${x}" cy="${y}" r="${f1(r + 5)}" class="dm-halo" style="fill:${col[c]}"/><circle cx="${x}" cy="${y}" r="${f1(r)}" style="fill:${col[c]}"/></g>`;
  }).join("");
  const mc = MAP.ctr[me];
  const label = mc ? `<text x="${f1(mc[0])}" y="${f1(mc[1] - 15)}" class="dm-me-l" text-anchor="middle">${H(cnm(me))}</text>` : "";
  return `<svg class="sim-dmap" viewBox="0 0 ${MAP.w} ${MAP.h}" role="group" ${L("aria-label=\"Carte des délégations présentes\"", "aria-label=\"Map of the delegations present\"")}>
    <defs><pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.15" class="dm-dot"/></pattern>
    <pattern id="${idm}" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.45" class="dm-dot on"/></pattern></defs>
    <path d="${MAP.bg}" fill="url(#${id})"/><g fill="url(#${id})">${others}</g><g fill="url(#${idm})">${memberShapes}</g>${dots}${label}</svg>`;
}

/* ---------- Scène de séance filmée, avec sous-titres ---------- */
const firstSentence = (txt, max = 190) => {
  const t = String(txt || "").replace(/\s+/g, " ").trim(), m = t.match(/^(.{40,}?[.!?…])\s/);
  const s = m ? m[1] : t;
  return s.length > max ? s.slice(0, s.lastIndexOf(" ", max - 1)) + "…" : s;
};
function camState(S) {
  const sp = [...S.speeches].reverse().find(x => !x.pending && (x.code || x.chair));
  if (S.vote) return { who: chairTitle(S), role: L("Résultat du vote", "Result of the vote"), line: S.vote.announce, chair: true };
  if (S.phase <= 2 || !sp) { const op = chairOpening(S); return { who: chairTitle(S), role: L("Ouverture de la séance", "Opening of the meeting"), line: op[0], chair: true }; }
  if (S.phase === 4) return { who: chairTitle(S), role: L("Suspension de séance", "Meeting suspended"), line: L("La séance est suspendue pour des consultations informelles. Les délégations se retrouvent dans les couloirs.", "The meeting is suspended for informal consultations. Delegations meet in the corridors."), chair: true };
  if (S.phase === 5) return { who: chairTitle(S), role: L("Examen du projet", "Consideration of the draft"), line: L("La présidence invite les délégations à examiner le projet de texte paragraphe par paragraphe.", "The chair invites delegations to examine the draft text paragraph by paragraph."), chair: true };
  if (S.phase === 6) return { who: chairTitle(S), role: L("Mise aux voix", "Voting"), line: chairLine(S, "vote"), chair: true };
  if (sp.chair) return { who: chairTitle(S), role: L("Présidence", "Chair"), line: sp.paras[0], chair: true };
  return { who: cnm(sp.code), role: `${KIND_LABEL[sp.kind] || L("Intervention", "Statement")}${sp.t ? " · " + sp.t : ""}`, line: sp.paras[0], me: sp.mine, code: sp.code };
}
function camera(S, o = {}) {
  const b = bodyOf(S), st = camState(S), live = S.phase < 7 && !S.vote;
  return `<figure class="sim-cam${o.compact ? " compact" : ""}">
    <div class="cam-top"><span class="cam-tag${live ? " rec" : ""}">${live ? L("En direct", "Live") : L("Rediffusion", "Replay")}</span>${L("<span class=\"cam-tag dim\">Caméra 1</span>", "<span class=\"cam-tag dim\">Camera 1</span>")}<span class="cam-where">${H(b.room || L("Salle " + b.de, "Chamber " + b.de))}</span><time class="cam-clock">${H(clockStr(S))}</time></div>
    <div class="cam-view sim-roombox">${roomSVG(S)}</div>
    <figcaption class="cam-sub"><span class="cam-name${st.me ? " me" : ""}">${H(st.who)}</span><span class="cam-role">${H(st.role)}</span><p>${L("« ", "\u201c")}${H(firstSentence(st.line))}${L(" »", "\u201d")}</p></figcaption>
  </figure>`;
}

/* ---------- Fleur des scores du bilan ---------- */
const SCORE_SHORT = { "Qualité des interventions": "Interventions", "Capacité de négociation": "Négociation", "Construction de coalitions": "Coalitions", "Cohérence avec la position nationale": "Cohérence", "Capacité à obtenir des compromis": "Compromis", "Influence sur le résultat final": "Influence", "Quality of statements": "Statements", "Negotiating skill": "Negotiation", "Coalition building": "Coalitions", "Consistency with the national position": "Consistency", "Ability to secure compromises": "Compromise", "Influence on the final outcome": "Influence" };
function scoreFlower(R) {
  const sc = R.scores, n = sc.length, cx = 200, cy = 190, rMax = 122, rMin = 30;
  const petals = sc.map((s, i) => {
    const ang = -90 + i * 360 / n, PL = rMin + (rMax - rMin) * clamp(s.v, 0, 100) / 100, w = Math.max(15, PL * 0.27);
    return `<ellipse cx="0" cy="${f1(-PL / 2)}" rx="${f1(w)}" ry="${f1(PL / 2)}" transform="translate(${cx},${cy}) rotate(${f1(ang + 90)})" class="fl-p" style="opacity:${(0.45 + 0.55 * s.v / 100).toFixed(2)}"><title>${H(s.k)}${L(" : ", ": ")}${s.v} ${L("sur", "out of")} 100</title></ellipse>`;
  }).join("");
  const rings = [0.25, 0.5, 0.75, 1].map(f => `<circle cx="${cx}" cy="${cy}" r="${f1(rMin + (rMax - rMin) * f)}" class="fl-ring"/>`).join("");
  const labels = sc.map((s, i) => {
    const a = rad(-90 + i * 360 / n), r = rMax + 30, x = cx + r * Math.cos(a), y = cy + r * Math.sin(a), an = Math.abs(Math.cos(a)) < 0.3 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
    return `<text x="${f1(x)}" y="${f1(y - 2)}" text-anchor="${an}" class="fl-l">${H(SCORE_SHORT[s.k] || s.k.split(" ")[0])}</text><text x="${f1(x)}" y="${f1(y + 15)}" text-anchor="${an}" class="fl-v">${s.v}</text>`;
  }).join("");
  return `<svg class="sim-flower" viewBox="-70 0 540 390" role="img" aria-label="${L("Vos six scores : ", "Your six scores: ")}${H(sc.map(s => (SCORE_SHORT[s.k] || s.k) + " " + s.v).join(", "))}">${rings}${petals}<circle cx="${cx}" cy="${cy}" r="27" class="fl-c"/><text x="${cx}" y="${cy + 8}" text-anchor="middle" class="fl-o">${R.overall}</text>${labels}</svg>`;
}

/* ---------- Composition de la salle au fil de la séance ---------- */
function recordTrace() {
  const S = G;
  if (!S || S.phase < 3 || S.phase > 6 || S.vote) return;
  const e = estimate(S).counts, tr = S.trace || (S.trace = []), last = tr[tr.length - 1];
  const pt = { t: clockStr(S), ph: S.phase, y: e.yes, a: e.abs, u: e.unk, n: e.no };
  if (!last || last.ph !== pt.ph || last.y !== pt.y || last.a !== pt.a || last.u !== pt.u || last.n !== pt.n) tr.push(pt);
  if (tr.length > 160) tr.splice(1, 1);
}
function roomTrace(S) {
  const tr = (S.trace || []).slice();
  if (S.vote) tr.push({ t: "vote", ph: 6, y: S.vote.t.yes, a: S.vote.t.abs, u: 0, n: S.vote.t.no, fin: true });
  if (tr.length < 3) return "";
  // le graphique est dessiné à la largeur de l'écran : ses légendes gardent leur taille
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const N = S.scen.members.length, W = Math.round(clamp(Math.min(vw, 1244) - 92, 330, 1110)), Hh = vw < 640 ? 250 : 280, pl = 28, pr = 10, pt = 14, pb = 46, k = tr.length;
  const X = i => pl + i * (W - pl - pr) / (k - 1), Y = v => pt + (Hh - pt - pb) * (1 - v / N);
  const bands = [["y", "v-yes"], ["a", "v-abs"], ["u", "v-unk"], ["n", "v-no"]];
  let acc = tr.map(() => 0), areas = "";
  for (const [key, cls] of bands) {
    const lo = acc, hi = tr.map((p, i) => lo[i] + p[key]);
    let top = "", bot = "";
    for (let i = 0; i < k; i++) {
      const x0 = X(i), x1 = i < k - 1 ? X(i + 1) : X(i);
      top += `${i ? "L" : "M"}${f1(x0)},${f1(Y(hi[i]))} L${f1(x1)},${f1(Y(hi[i]))} `;
    }
    for (let i = k - 1; i >= 0; i--) { const x0 = X(i), x1 = i < k - 1 ? X(i + 1) : X(i); bot += `L${f1(x1)},${f1(Y(lo[i]))} L${f1(x0)},${f1(Y(lo[i]))} `; }
    areas += `<path d="${top}${bot}Z" class="tr-a ${cls}"/>`;
    acc = hi;
  }
  // étiquettes de phase : deux rangées au plus, sans chevauchement
  const labels = [{ i: 0, txt: PHASES[tr[0].ph - 1] + " · " + tr[0].t }];
  for (let i = 1; i < k; i++) if (tr[i].ph !== tr[i - 1].ph) labels.push({ i, txt: tr[i].fin ? "Vote" : PHASES[tr[i].ph - 1] });
  const rowEnd = [-1e9, -1e9], cw = 6.7;
  const phaseMarks = labels.map((l, n) => {
    const x = X(l.i), w = l.txt.length * cw;
    let lx = n === 0 ? pl : x + 4, anchor = "start";
    if (lx + w > W - 2) { lx = x - 4; anchor = "end"; }
    const left = anchor === "start" ? lx : lx - w, right = anchor === "start" ? lx + w : lx;
    const row = left > rowEnd[0] + 8 ? 0 : left > rowEnd[1] + 8 ? 1 : -1;
    const line = n === 0 ? "" : `<line x1="${f1(x)}" y1="${pt}" x2="${f1(x)}" y2="${Hh - pb + 6 + (row === 1 ? 14 : 0)}" class="tr-ph"/>`;
    if (row < 0) return line;
    rowEnd[row] = right;
    return line + `<text x="${f1(lx)}" y="${Hh - pb + 17 + row * 15}" text-anchor="${anchor}" class="tr-t">${H(l.txt)}</text>`;
  }).join("");
  const thr = S.vote ? S.vote.t.rule : needRule(S);
  const th = thr.type === "unsc" ? `<line x1="${pl}" y1="${f1(Y(9))}" x2="${W - pr}" y2="${f1(Y(9))}" class="tr-th"/><text x="${W - pr - 2}" y="${f1(Y(9) - 5)}" text-anchor="end" class="tr-t b"${L(">seuil : 9 voix pour</text>", ">threshold: 9 votes in favour</text>")}` : "";
  const yAxis = [0, Math.round(N / 2), N].map(v => `<text x="${pl - 6}" y="${f1(Y(v) + 4)}" text-anchor="end" class="tr-t">${v}</text>`).join("");
  return `<figure class="sim-trace"><svg viewBox="0 0 ${W} ${Hh}" role="img" ${L("aria-label=\"Composition de la salle au fil de la séance\"", "aria-label=\"Composition of the room over the meeting\"")}>${areas}${phaseMarks}${th}${yAxis}</svg>
    <figcaption class="vd-legend">${L("<span><i class=\"vd v-yes\"></i>pour</span><span><i class=\"vd v-abs\"></i>abstention</span><span><i class=\"vd v-unk\"></i>position inconnue</span><span><i class=\"vd v-no\"></i>contre</span>", "<span><i class=\"vd v-yes\"></i>in favour</span><span><i class=\"vd v-abs\"></i>abstention</span><span><i class=\"vd v-unk\"></i>position unknown</span><span><i class=\"vd v-no\"></i>against</span>")}</figcaption></figure>`;
}

/* ---------- 1 voix sur 193 : l'illustration de l'accueil ---------- */
function heroDots() {
  const n = 193, cols = 22, gap = 15, r = 4.2, council = new Set([12, 30, 47, 58, 71, 85, 96, 104, 119, 133, 141, 156, 167, 178, 186]), me = 104;
  const dots = Array.from({ length: n }, (_, i) => { const x = 10 + (i % cols) * gap, y = 10 + Math.floor(i / cols) * gap; return `<circle cx="${x}" cy="${y}" r="${i === me ? r + 1.6 : r}" class="hd${council.has(i) ? " c" : ""}${i === me ? " me" : ""}"/>`; }).join("");
  const rows = Math.ceil(n / cols);
  return `<svg class="sim-herodots" viewBox="0 0 ${20 + (cols - 1) * gap} ${20 + (rows - 1) * gap}" aria-hidden="true">${dots}</svg>`;
}

/* ---------- Petites illustrations des organes ---------- */
function seatGlyph(b) {
  const n = b.sim.p5only ? 5 : b.realSize;
  if (n > 60) return `<div class="sim-seatn"><b>${n}</b>${L("<span>États membres</span>", "<span>Member States</span>")}</div>`;
  const p5 = b.id === "UNSC" || b.id === "TRUST";
  return `<div class="sim-seatd" style="--c:${n <= 15 ? n : Math.ceil(n / 2)}" aria-label="${n} ${L("membres", "members")}">${Array.from({ length: n }, (_, i) => `<i${p5 && i < 5 ? ' class="p5"' : ""}></i>`).join("")}</div>`;
}
function ruleGlyph(b) {
  const t = b.vote.rule === "unsc" ? 9 / 15 : b.vote.rule === "twothirds" ? 2 / 3 : 0.5;
  return `<div class="sim-ruleg"><i style="width:${(t * 100).toFixed(1)}%"></i><span style="left:${(t * 100).toFixed(1)}%"></span></div>`;
}

/* ---------- Une pause : ce qui se passe, ce qui compte ---------- */
const PHASE_HELP = [
  ["La présidence ouvre la séance, rappelle la question et la règle de vote.", "Tout ce qui suit part de là : notez le sujet et ce que l'organe peut décider."],
  ["Votre capitale vous envoie ses instructions : ses priorités, ses lignes rouges, ses partenaires probables.", "Choisissez une ligne de négociation compatible avec ces instructions."],
  ["Chaque délégation prend la parole à son tour. Vous découvrez leurs positions et vous exposez la vôtre.", "Une intervention claire et argumentée rapproche les délégations proches de vous."],
  ["Les couloirs s'ouvrent : vous disposez de 120 minutes pour sonder, convaincre, passer des accords et réunir des groupes.", "Chaque démarche consomme du temps. Visez les délégations qui feront basculer le vote."],
  ["Le texte est examiné paragraphe par paragraphe. Les délégations déposent des amendements : vous les acceptez, les rejetez ou proposez un compromis.", "Un texte trop ambitieux perd des voix ; un texte trop faible ne sert plus vos objectifs."],
  ["Le texte est mis aux voix selon la règle exacte de l'organe. Le simulateur compte les voix, jamais l'IA.", "Votre propre vote doit rester cohérent avec les instructions de votre capitale."],
  ["La séance est levée. Voici ce que vous avez obtenu, et pourquoi.", "Un texte rejeté n'est pas toujours un échec : ce qui compte, ce sont vos objectifs."]
];
function phaseHelp(S) {
  const i = S.phase - 1, [what, why] = PHASE_HELP[i], seen = (S.seen || {})[S.phase];
  if (seen) return `<div class="sim-pause min"><span class="ps-k">${L(`Étape ${S.phase} sur 7`, `Step ${S.phase} of 7`)}</span><b>${H(PHASES[i])}</b><button type="button" class="sim-btn link" data-a="pause" data-x="0"${L(">Revoir l'explication</button>", ">Show the explanation again</button>")}</div>`;
  return `<section class="sim-pause"><span class="ps-k">${L(`Étape ${S.phase} sur 7`, `Step ${S.phase} of 7`)}</span><h2>${H(PHASES[i])}</h2><p>${H(what)}</p><p class="ps-why">${L("<b>Ce qui compte</b>", "<b>What matters</b>")} ${H(why)}</p>${S.phase < 7 ? `<button type="button" class="sim-btn ghost sm" data-a="pause" data-x="1"${L(">J'ai compris</button>", ">Got it</button>")}` : ""}</section>`;
}

/* =====================================================================
   POINT D'ENTRÉE : window.SIM
   Le site appelle SIM.view(contexte) depuis sa vue « jeu » ; le contexte
   est une fonction qui renvoie { lang, user, profile, sb, toast }.
   ===================================================================== */
let booted = false;
/* Polices de la scène : Newsreader (titres et grands chiffres) et IBM Plex Mono (horloge, repères) */
function injectFonts() {
  if (document.getElementById("sim-fonts")) return;
  const l = document.createElement("link");
  l.id = "sim-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.bunny.net/css?family=newsreader:500,500i,600,600i,700|ibm-plex-mono:400,500,600&display=swap";
  document.head.appendChild(l);
}
function injectCSS() {
  injectFonts();
  if (document.getElementById("sim-css")) return;
  const st = document.createElement("style");
  st.id = "sim-css"; st.textContent = SIM_CSS;
  document.head.appendChild(st);
}
function boot() {
  if (booted) return;
  booted = true;
  loadGame();
  if (G) (G.speeches || []).forEach(s => { delete s.pending; });
  document.addEventListener("click", onClick);
  document.addEventListener("change", onChange);
  document.addEventListener("input", onInput);
  document.addEventListener("keydown", onKey);
}
/* Le site peut demander d'ouvrir directement un écran : « new » (préparation
   d'une partie), « resume » (partie en cours) ou « home » (accueil du jeu) */
function openFromSite() {
  const c = ctx();
  if (typeof c.takeOpen !== "function") return;
  const o = c.takeOpen();
  if (o === "resume" && G && G.phase < 7) { UI.screen = "game"; UI.tab = G.uiTab || defaultTab(G.phase); UI.scrollTo = "top"; }
  else if (o === "new") { if (G && G.phase < 7) UI.flash = siteLang() === "en" ? "Your current game will be replaced when you open a new meeting." : "Votre partie en cours sera remplacée lorsque vous ouvrirez une nouvelle séance."; UI.screen = "setup"; UI.setup = { step: 1, bodyId: null, pc: null, player: null, gen: null, q: "" }; UI.scrollTo = "top"; }
  else if (o === "home") UI.screen = "home";
}
function checkAI() {
  const before = AI.status + AI.reason;
  AI.check(ctx()).then(() => { if (AI.status + AI.reason !== before) rerender(); }).catch(() => { /* mode démonstration */ });
}
window.SIM = {
  version: "1.2.0",
  view(context) {
    if (context) CTX = context;
    injectCSS(); boot();
    openFromSite();
    Promise.resolve().then(() => { const r = document.getElementById("sim-root"); if (r) afterRender(r); checkAI(); });
    return `<div id="sim-root" class="sim">${inner()}</div>`;
  },
  mount(el, context) {
    if (!el) return;
    if (context) CTX = context;
    injectCSS(); boot();
    openFromSite();
    el.id = "sim-root"; el.classList.add("sim");
    el.innerHTML = inner();
    afterRender(el); checkAI();
  },
  /* Accès en lecture pour le débogage depuis la console */
  get state() { return G; }
};

})();
