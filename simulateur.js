/* =====================================================================
   SOMUN — Le jeu diplomatique (simulateur de négociation ONU / UNESCO)
   Version 1.0 — module autonome : à charger après le script du site.
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
const deName = code => DE_FORMS[code] || ("de " + COUNTRIES[code].name);
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
   MOTEUR DE SIMULATION
   Toutes les règles (compétences, votes, seuils) sont calculées ici de
   façon déterministe. Le hasard (graine enregistrée) ne sert qu'à varier
   les scénarios, les personnalités et l'issue des tentatives de persuasion.
   ===================================================================== */

/* ---------- Outils ---------- */
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const r2 = x => Math.round(x * 100) / 100;
const fmtN = n => Math.round(n).toLocaleString("fr-FR");
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
    s = s.replace(/(^|[\s(«])(à|de) \{(\w+)\}/g, (m, pre, prep, k) => {
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
const sortFr = codes => codes.slice().sort((a, b) => cname(a).localeCompare(cname(b), "fr"));

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
    UNGA: "engager, au sein d'un comité intergouvernemental ouvert à tous les États, la négociation d'une convention internationale relative à {objet}",
    ECOSOC: "établir un projet de convention relative à {objet}, en vue de le soumettre à l'Assemblée générale",
    UNHRC: "créer un groupe de travail intergouvernemental chargé d'élaborer un instrument juridiquement contraignant relatif à {objet}",
    UNESCO_GC: "adopter la Convention internationale sur {objet} figurant en annexe et la soumettre à la ratification des États membres",
    UNESCO_EB: "recommander à la Conférence générale d'élaborer une convention internationale relative à {objet}",
    UNESCO_PC: "engager l'élaboration d'une convention internationale relative à {objet}"
  }[b.id] || "engager l'élaboration d'un instrument relatif à {objet}";
  return Object.assign({}, i.v, sc.vars, { sg: b.sg, act: b.act, stay: b.stay, conv, mois: sc.vars.mois, Preoccupe: b.g === "f" ? "Préoccupée" : "Préoccupé", trigger: sc.triggerShort });
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
  if (v === "Demande" || v === "Recommande") return `${v} ${aForm(obj)} ${de(inf)}`;
  if (v === "Souligne") return `Souligne l'importance, pour ${obj}, ${de(inf)}`;
  return `${v} ${obj} à ${inf}`;
}
function clauseText(S, c) {
  const b = bodyOf(S);
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
  if (!kindAllowed(k, b.id)) return { ok: false, why: (KINDS[k] && KINDS[k].why) || `Cette mesure (${(KINDS[k] || {}).name || k}) ne relève pas des compétences ${b.de}.` };
  if (c.form === "free") {
    const t = (c.text || "").toLowerCase();
    if (b.id !== "UNSC" && /sanction|embargo|gel des avoirs|geler les/.test(t)) return { ok: false, why: "Seul le Conseil de sécurité peut décider de sanctions (article 41 de la Charte)." };
    if (b.id !== "UNSC" && c.v === "Décide" && /tous les états (doivent|devront)|obligation pour les états/.test(t)) return { ok: false, why: KINDS.binding.why };
    if (!["UNGA", "UNESCO_GC", "UNESCO_PC"].includes(b.id) && /contributions? (obligatoires?|statutaires?)|budget ordinaire/.test(t) && !/recommande/i.test(c.v)) return { ok: false, why: KINDS.assessed.why };
    if (b.id !== "WHC" && /patrimoine mondial en péril/.test(t)) return { ok: false, why: KINDS.danger.why };
    if (b.id !== "UNHRC" && /rapporteur spécial/.test(t)) return { ok: false, why: KINDS.rapporteur.why };
    if (b.id !== "UNSC" && /maintien de la paix|casques bleus|force internationale/.test(t)) return { ok: false, why: KINDS.mission.why };
  }
  if (KINDS[k] && KINDS[k].needs7 && !S.draft.pre.some(p => p.id === "ch7")) return { ok: true, warn: "Les mesures de l'article 41 supposent que le Conseil agisse en vertu du Chapitre VII : ajoutez ce paragraphe au préambule." };
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
    bodyId, pc, issueId: issue.id, title: issue.title, vars, triggerShort, facts, constraints, members,
    weeks: ri(S, 2, 6), sessionNo: ri(S, 7, 74), chairF: rngNext(S) < 0.5, extraordinary: rngNext(S) < 0.3, year
  };
  return { scen, seed: S.seed, rng: S.rng };
}

/* ---------- Création d'une partie ---------- */
function newGame(gen, player) {
  const { scen } = gen;
  const S = {
    v: 1, id: "s" + Date.now().toString(36), seed: gen.seed, rng: gen.rng, created: Date.now(), updated: Date.now(),
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
  S.chairName = scen.chairF ? "Madame la Présidente" : "Monsieur le Président";
  logE(S, "procedure", `Ouverture de la ${body.session} ${body.de}.`);
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
  logE(S, "procedure", `Votre délégation retient l'orientation « ${o.name} ».`, S.player);
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
  if (b.vote.rule === "unsc") return { type: "unsc", label: "9 voix pour au moins, sans vote contre d'un membre permanent" };
  if (b.vote.rule === "twothirds") return { type: "23", label: "majorité des deux tiers des membres présents et votants (Convention de 1972, art. 13.8)" };
  if (b.vote.conv23 && kinds.includes("convention")) return { type: "23", label: "majorité des deux tiers : adoption d'une convention internationale (Acte constitutif, art. IV.4)" };
  if (b.vote.important && (issue.important || kinds.includes("assessed"))) return { type: "23", label: issue.important ? "majorité des deux tiers : question importante relative à la paix et à la sécurité (Charte, art. 18.2)" : "majorité des deux tiers : question budgétaire, considérée comme importante (Charte, art. 18.2)" };
  return { type: "maj", label: "majorité simple des membres présents et votants" };
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
  logE(S, "bilateral", `Échange bilatéral avec la délégation ${deName(code)} : elle expose ses priorités.`, code);
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
  logE(S, "bilateral", ok ? `La délégation ${deName(code)} se montre sensible à votre ${A.name.toLowerCase()} (${AXES[axis].name.toLowerCase()}).` : `La délégation ${deName(code)} n'est pas convaincue par votre ${A.name.toLowerCase()}.`, code);
  return { ok, p: r2(p), axis, effect, fit: r2(fit) };
}
/* Offres possibles dans un accord bilatéral */
function dealOffers(S, code) {
  const d = S.dels[code], R = textVec(S), out = [];
  if (d.pet && !hasSrc(S, d.pet)) { const t = tplById(S, d.pet); if (t) out.push({ kind: "pet", src: d.pet, label: "Intégrer au texte le paragraphe « " + capFirst(clauseText(S, instClausePreview(S, t))) + " »" }); }
  // la clause qui la gêne le plus
  let worst = null, wd = 0;
  for (const c of S.draft.ops) {
    if (c.form === "raw" || !checkClause(S, c).ok) continue;
    const R0 = textVec(S, { without: c.uid }); const delta = baseU(d, R) - baseU(d, R0);
    if (delta < wd) { wd = delta; worst = c; }
  }
  if (worst && wd < -0.02) {
    const vs = verbsForClause(S, worst), weaker = vs.filter(v => verbStrength(v) < verbStrength(worst.v)).sort((a, b) => verbStrength(b) - verbStrength(a));
    if (weaker.length) out.push({ kind: "soften", uid: worst.uid, verb: weaker[Math.min(1, weaker.length - 1)], label: `Remplacer « ${worst.v} » par « ${weaker[Math.min(1, weaker.length - 1)]} » au paragraphe « ${clauseShort(S, worst)} »` });
    out.push({ kind: "delete", uid: worst.uid, label: `Retirer le paragraphe « ${clauseShort(S, worst)} »` });
  }
  if (issueOf(S).axes.includes("fin") && d.pos.fin > 0.2 && !hasSrc(S, "g_cap")) out.push({ kind: "fund", src: "g_cap", label: "Ajouter un paragraphe sur l'assistance technique et financière aux pays en développement" });
  out.push({ kind: "support", label: "Promettre votre soutien à une initiative de sa délégation dans un autre forum" });
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
    logE(S, "bilateral", `La délégation ${deName(code)} refuse votre offre : le texte franchirait sa ligne rouge (${AXES[sim.hard.axis].name.toLowerCase()}).`, code);
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
    logE(S, "bilateral", `Accord conclu avec la délégation ${deName(code)} : ${ASKS[askKey].they} ; en échange, vous acceptez ${de(lcFirst(offer.label))}.`, code);
    return { ok: true, gain: r2(u - before) };
  }
  if (u >= need - 0.1) {
    S.stats.counters++;
    const alt = dealOffers(S, code).find(o => o.kind !== offer.kind && o.kind !== "support");
    logE(S, "bilateral", `La délégation ${deName(code)} juge votre offre insuffisante et fait une contre-proposition.`, code);
    return { ok: false, reason: "counter", counter: alt || null };
  }
  d.rel = clamp(d.rel - 2, -100, 100);
  logE(S, "bilateral", `La délégation ${deName(code)} décline votre proposition d'accord.`, code);
  return { ok: false, reason: "far" };
}
function actCosponsor(S, code) {
  const d = S.dels[code], P = PERSONALITIES[d.pers], u = uOf(S, code);
  spend(S, 5);
  d.known.pos = true;
  if (u >= P.yes + 0.05 && d.rel >= -10 && !hardBreach(d, textVec(S))) {
    d.cosponsor = true; if (!S.draft.cosponsors.includes(code)) S.draft.cosponsors.push(code);
    d.rel = clamp(d.rel + 4, -100, 100);
    logE(S, "coalition", `La délégation ${deName(code)} accepte de se porter coauteur du projet.`, code);
    return { ok: true };
  }
  logE(S, "bilateral", `La délégation ${deName(code)} ne souhaite pas, à ce stade, se porter coauteur.`, code);
  return { ok: false, u: r2(u), need: r2(P.yes + 0.05) };
}
function actConsult(S) {
  for (const code of S.scen.members) if (code !== S.player) S.dels[code].known.pos = true;
  spend(S, 30);
  logE(S, "procedure", "Consultations informelles ouvertes à toutes les délégations sur le projet de texte.");
  aiRound(S, true);
}
/* Rencontre avec un groupe (bloc ou groupe régional) */
/* Groupes de négociation : groupes régionaux et groupes qui s'expriment
   d'une seule voix dans les enceintes multilatérales */
const NEGO_BLOCS = { UE: "les États membres de l'Union européenne", G77: "le Groupe des 77", ASEAN: "les États membres de l'ASEAN", OCI: "les États membres de l'Organisation de la coopération islamique", LigueArabe: "le Groupe des États arabes", PEID: "les petits États insulaires en développement" };
const groupLabel = g => g.label || g.name;
function groupsPresent(S) {
  const out = [];
  const others = S.scen.members.filter(m => m !== S.player);
  const blocs = {};
  for (const m of others) for (const b of COUNTRIES[m].blocs) if (NEGO_BLOCS[b]) (blocs[b] = blocs[b] || []).push(m);
  for (const b in blocs) if (blocs[b].length >= 2) out.push({ id: "b:" + b, name: BLOC_NAMES[b] || b, label: NEGO_BLOCS[b], members: blocs[b] });
  const key = BODIES[S.bodyId].org === "UNESCO" ? "unesco" : "un";
  const gs = {}; for (const m of others) (gs[COUNTRIES[m][key]] = gs[COUNTRIES[m][key]] || []).push(m);
  for (const g in gs) if (gs[g].length >= 2) { const name = key === "un" ? UN_GROUPS[g] : UNESCO_GROUPS[g].replace(/^Groupe/, "Groupe électoral"); out.push({ id: "g:" + g, name, label: "le " + name, members: gs[g] }); }
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
  if (won.length < Math.ceil(grp.members.length / 2)) { S.draft = JSON.parse(snap); S.uid = su; won.forEach(m => { S.dels[m].lobbied = false; }); logE(S, "coalition", `Réunion avec ${groupLabel(grp)} : pas de majorité au sein du groupe pour soutenir votre texte.`); return { ok: false, won, lost }; }
  if (offer) S.deals.push(Object.assign({ id: "d" + (S.deals.length + 1), with: grp.members[0], group: grp.name, ask: "group", kind: offer.kind, label: offer.label, status: "active", t: clockStr(S) }, {}));
  S.stats.successes++; S.stats.attempts++;
  logE(S, "coalition", `Réunion avec ${groupLabel(grp)} : ${won.length} délégation(s) sur ${grp.members.length} soutiennent désormais votre texte.`);
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
    logE(S, "ai", `Les délégations ${deName(x)} et ${deName(y)} s'opposent sur la question ${axisDe(ax)} : la première défend ${poleNP(S, ax, dx.pos[ax])}, la seconde ${poleNP(S, ax, dy.pos[ax])}.`, x);
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
    logE(S, "coalition", `Concertation au sein ${deForm(groupLabel(g))} : position commune en faveur ${deForm(poleNP(S, ax, avg[ax]))}.`);
    events.push("group");
  }
  // 3. Proposition concurrente défendue par son auteur
  const rival = S.proposals.filter(p => p.sponsor && p.core && !hasSrc(S, p.core) && !S.aiSeen["r:" + p.id]);
  if (rival.length && rngNext(S) < 0.65) {
    const p = pick(S, rival), fans = others.filter(m => m !== p.sponsor && avgDist(S.dels[m].pos, p.vec) < 0.55);
    seen("r:" + p.id);
    for (const m of fans) S.dels[m].rel = clamp(S.dels[m].rel - 2, -100, 100);
    logE(S, "ai", `La délégation ${deName(p.sponsor)} fait circuler sa proposition : ${p.name}. ${fans.length ? fans.length + " délégation(s) y sont favorables." : "Elle peine à rallier des soutiens."}`, p.sponsor);
    events.push("rival");
  }
  // 4. Offre spontanée adressée au joueur
  const near = others.filter(m => { const d = S.dels[m], P = PERSONALITIES[d.pers], u = uOf(S, m, R); return !d.cosponsor && !S.deals.some(x => x.with === m && x.status === "active") && u < P.yes && u >= P.yes - 0.14 && !S.inbox.some(x => x.from === m && x.status === "pending"); });
  if (near.length) {
    const m = pick(S, near), offers = dealOffers(S, m).filter(o => o.kind !== "support");
    if (offers.length) {
      const o = offers[0];
      S.inbox.push({ id: "m" + (S.inbox.length + 1), from: m, offer: o, ask: "vote", status: "pending", t: clockStr(S) });
      logE(S, "ai", `La délégation ${deName(m)} vous propose un accord : elle votera pour le texte si vous acceptez ${de(lcFirst(o.label))}.`, m);
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
const axisDe = ax => ({ obl: "de la portée juridique du texte", sup: "du suivi international", fin: "du financement", reg: "de l'échelle d'action", prv: "du rôle du secteur privé", rgl: "de l'encadrement des technologies", opn: "de l'accès et du partage", res: "des mesures restrictives", dro: "de l'approche fondée sur les droits" }[ax]);
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
  logE(S, "amend", `La délégation ${deName(code)} propose un amendement : ${amendLabel(S, am)}.`, code);
  return am;
}
function amendLabel(S, am) {
  const n = am.target ? clauseNum(S, am.target) : 0;
  if (am.type === "soften") return `remplacer « ${(S.draft.ops.find(c => c.uid === am.target) || {}).v} » par « ${am.verb} » au paragraphe ${n}`;
  if (am.type === "delete") return `supprimer le paragraphe ${n}`;
  if (am.type === "add") { const t = tplById(S, am.src); return `ajouter un paragraphe : « ${t ? clauseText(S, instClausePreview(S, t)) : ""} »`; }
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
    logE(S, "amend", `Vous acceptez l'amendement de la délégation ${deName(am.by)}.`, am.by);
  } else if (decision === "reject") {
    am.status = "rejected"; S.stats.amendRej++;
    d.rel = clamp(d.rel - (d.pers === "intransigeante" ? 10 : 6), -100, 100); (am.sup || []).forEach(m => { S.dels[m].rel = clamp(S.dels[m].rel - 2, -100, 100); });
    logE(S, "amend", `Vous rejetez l'amendement de la délégation ${deName(am.by)}.`, am.by);
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
    logE(S, "amend", ok ? `La délégation ${deName(am.by)} accepte votre contre-proposition.` : `La délégation ${deName(am.by)} refuse votre contre-proposition ; son amendement est considéré comme rejeté.`, am.by);
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
    logE(S, "bilateral", `Vous acceptez l'offre de la délégation ${deName(m.from)} : elle votera pour le texte.`, m.from);
  } else { d.rel = clamp(d.rel - 3, -100, 100); logE(S, "bilateral", `Vous déclinez l'offre de la délégation ${deName(m.from)}.`, m.from); }
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
      logE(S, "bilateral", `Promesse rompue : la délégation ${deName(dl.with)} constate que l'engagement « ${dl.label} » n'a pas été tenu.`, dl.with);
    }
  }
}

/* ---------- Édition du texte par le joueur ---------- */
function addClause(S, tplId) {
  const t = tplById(S, tplId); if (!t) return null;
  const c = instClause(S, t, S.player);
  const stay = S.draft.ops.findIndex(x => x.src === "g_stay");
  S.draft.ops.splice(stay < 0 ? S.draft.ops.length : stay, 0, c);
  if (KINDS[effKind(c)] && KINDS[effKind(c)].needs7 && !S.draft.pre.some(p => p.id === "ch7")) { S.draft.pre.push({ id: "ch7", txt: GENERIC_PREAMBLE.ch7 }); logE(S, "procedure", "Le paragraphe « Agissant en vertu du Chapitre VII » est ajouté au préambule, condition des mesures de l'article 41."); }
  logE(S, "amend", `Vous ajoutez un paragraphe au projet : « ${capFirst(clauseText(S, c))} ».`, S.player);
  checkDeals(S);
  return c;
}
function addFreeClause(S, verb, text, kind, fx) {
  const c = { uid: newUid(S), src: "free", k: kind || "rec", form: "free", v: verb, text: String(text).trim().replace(/[.;]\s*$/, ""), fx: fx || {}, tech: /\d/.test(text) ? 1 : 0, by: S.player };
  const stay = S.draft.ops.findIndex(x => x.src === "g_stay");
  S.draft.ops.splice(stay < 0 ? S.draft.ops.length : stay, 0, c);
  logE(S, "amend", `Vous rédigez un nouveau paragraphe : « ${capFirst(clauseText(S, c))} ».`, S.player);
  checkDeals(S);
  return c;
}
function setVerb(S, uid, verb) { const c = S.draft.ops.find(x => x.uid === uid); if (!c) return; c.v = verb; checkDeals(S); }
function removeClause(S, uid) { const c = S.draft.ops.find(x => x.uid === uid); if (!c || c.form === "raw") return; S.draft.ops = S.draft.ops.filter(x => x.uid !== uid); logE(S, "amend", `Vous retirez le paragraphe « ${capFirst(clauseText(S, c)).slice(0, 90)}… ».`, S.player); checkDeals(S); }
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
  logE(S, "vote", `Vote enregistré : ${t.yes} pour, ${t.no} contre, ${t.abs} abstention(s). ${t.adopted ? "Le projet est adopté." : "Le projet n'est pas adopté."}${t.veto.length ? " Vote négatif d'un membre permanent : " + t.veto.map(cname).join(", ") + "." : ""}`);
  return S.vote;
}

/* ---------- Bilan ---------- */
function playerU(S, R) { return baseU(S.dels[S.player], R); }
function objectives(S) {
  const me = S.dels[S.player], issue = issueOf(S), out = [];
  const top = issue.axes.slice().sort((a, b) => me.w[b] - me.w[a]);
  const a1 = top[0], p1 = me.pos[a1];
  if (p1 >= 0) { const thr = r2(clamp(p1 * 0.55, 0.15, 0.55)); out.push({ id: "axis", axis: a1, dir: "min", thr, text: `Obtenir un texte adopté orienté vers ${poleNP(S, a1, 1)} (indicateur « ${AXES[a1].name} » au moins à ${fmtSigned(thr)})` }); }
  else { const thr = r2(clamp(p1 * 0.3 + 0.25, -0.2, 0.3)); out.push({ id: "axis", axis: a1, dir: "max", thr, text: `Éviter l'adoption d'un texte trop orienté vers ${poleNP(S, a1, 1)} (indicateur « ${AXES[a1].name} » au plus à ${fmtSigned(thr)})` }); }
  if (me.pet) { const t = tplById(S, me.pet); if (t) out.push({ id: "pet", src: me.pet, text: `Faire figurer dans le texte adopté : « ${capFirst(clauseText(S, instClausePreview(S, t)))} »` }); }
  const k = S.scen.members.length <= 6 ? 1 : 3;
  out.push({ id: "co", k, text: `Rassembler au moins ${k} coauteur${k > 1 ? "s" : ""}, dont un hors de votre groupe régional` });
  return out;
}
const fmtSigned = x => (x > 0 ? "+" : x < 0 ? "−" : "") + Math.abs(x).toFixed(2).replace(".", ",");
function evalObjectives(S) {
  const R = S.vote ? S.vote.R : textVec(S), adopted = S.vote && S.vote.t.adopted, me = COUNTRIES[S.player];
  const key = BODIES[S.bodyId].org === "UNESCO" ? "unesco" : "un";
  return objectives(S).map(o => {
    let ok = false, note = "";
    if (o.id === "axis") {
      if (o.dir === "min") { ok = adopted && R[o.axis] >= o.thr; note = adopted ? `valeur obtenue : ${fmtSigned(r2(R[o.axis]))}` : "aucun texte adopté"; }
      else { ok = !adopted || R[o.axis] <= o.thr; note = adopted ? `valeur obtenue : ${fmtSigned(r2(R[o.axis]))}` : "aucun texte contraire à vos intérêts n'a été adopté"; }
    } else if (o.id === "pet") { ok = adopted && hasSrc(S, o.src); note = ok ? "paragraphe présent dans le texte adopté" : (adopted ? "paragraphe absent du texte" : "aucun texte adopté"); }
    else if (o.id === "co") { const co = S.draft.cosponsors; ok = co.length >= o.k && co.some(c => COUNTRIES[c][key] !== me[key]); note = `${co.length} coauteur(s)`; }
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
    { k: "Qualité des interventions", v: sQuality, c: sQuality >= 70 ? "Vos interventions étaient claires et argumentées." : sQuality >= 45 ? "Des interventions correctes, qui auraient gagné à être plus précises." : "Vos interventions ont peu pesé sur le débat." },
    { k: "Capacité de négociation", v: sNego, c: S.stats.attempts ? `${S.stats.successes} succès sur ${S.stats.attempts} démarches${S.stats.broken ? ", mais " + S.stats.broken + " promesse(s) rompue(s)" : ""}.` : "Vous n'avez engagé aucune démarche bilatérale." },
    { k: "Construction de coalitions", v: sCoal, c: `${S.draft.cosponsors.length} coauteur(s) ; votes favorables venus de ${yesGroups.size} groupe(s) régional(aux).` },
    { k: "Cohérence avec la position nationale", v: sCons, c: hardMe && t.adopted ? "Le texte adopté franchit l'une de vos lignes rouges." : "Le résultat reste cohérent avec les instructions de votre capitale." },
    { k: "Capacité à obtenir des compromis", v: sComp, c: conv ? `${conv} évolution(s) de vote en votre faveur depuis le début des négociations.` : "Peu de délégations ont fait évoluer leur vote." },
    { k: "Influence sur le résultat final", v: sInfl, c: `${mine} paragraphe(s) sur ${total} portent votre empreinte ; ${objOk} objectif(s) sur ${objs.length} atteint(s).` }
  ];
  const overall = Math.round(scores.reduce((s, x) => s + x.v, 0) / scores.length);
  let verdict;
  const defended = objs.filter(o => o.ok).length >= 2;
  if (t.adopted && defended) verdict = { k: "Succès diplomatique", c: "Le texte est adopté et vos priorités y figurent." };
  else if (t.adopted) verdict = { k: "Adoption, priorités partielles", c: "Le texte est adopté, mais vos objectifs ne sont que partiellement atteints." };
  else if (defended) verdict = { k: "Échec du texte, intérêts préservés", c: "Le texte n'est pas adopté, mais vous avez défendu efficacement les intérêts de votre pays." };
  else verdict = { k: "Échec diplomatique", c: "Le texte n'est pas adopté et vos objectifs ne sont pas atteints." };
  // Relations : évolutions marquantes
  const rel = S.scen.members.filter(c => c !== S.player).map(c => ({ code: c, d: S.dels[c].rel - S.dels[c].rel0 })).sort((a, b) => b.d - a.d);
  const concessions = S.amendments.filter(a => a.status === "accepted" || a.status === "countered").map(a => ({ by: a.by, label: amendLabelFinal(a) }))
    .concat(S.deals.map(dl => ({ by: dl.with, label: dl.label, deal: dl.status })));
  const coalitions = [];
  for (const g of groupsPresent(S)) { const y = g.members.filter(m => S.vote.votes[m] === "yes").length; if (y >= 2) coalitions.push(`${g.name} : ${y} sur ${g.members.length} ont voté pour`); }
  S.report = { scores, overall, verdict, objs, rel, concessions, coalitions: coalitions.slice(0, 4), consequences: consequences(S) };
  return S.report;
}
function amendLabelFinal(a) {
  if (a.type === "soften") return `verbe remplacé par « ${a.verb} »`;
  if (a.type === "delete") return a.status === "countered" ? "paragraphe adouci plutôt que supprimé" : "paragraphe supprimé";
  return "paragraphe ajouté";
}
function consequences(S) {
  const b = bodyOf(S), t = S.vote.t, issue = issueOf(S), out = [];
  const kinds = S.draft.ops.filter(c => checkClause(S, c).ok).map(effKind);
  if (t.adopted) {
    if (b.id === "UNSC" && (kinds.includes("binding") || kinds.includes("art41"))) out.push("Les décisions du Conseil prises au titre de l'article 25 s'imposent désormais à tous les États membres.");
    else if (b.id === "UNESCO_PC") out.push("Le projet de résolution est transmis à la plénière de la Conférence générale, qui devra encore l'adopter.");
    else if (b.id === "UNESCO_GC" && kinds.includes("convention")) out.push("La convention est ouverte à la ratification : elle n'engagera que les États qui la ratifieront.");
    else out.push(`Le texte adopté a valeur de recommandation : sa mise en œuvre dépendra de la volonté des États.`);
    if (kinds.includes("report")) out.push(`${capFirst(b.sg)} présentera un rapport de suivi dans les délais prévus (scénario fictif).`);
    if (kinds.includes("volfund") || kinds.includes("assessed")) out.push("Les moyens financiers prévus devront être mobilisés : leur montant sera un test de la crédibilité du texte.");
    if (t.no + t.abs > t.yes * 0.6) out.push("Le nombre d'abstentions et de votes contre fragilise la portée politique du texte.");
  } else {
    out.push("La question reste inscrite à l'ordre du jour : les délégations devront reprendre les négociations à une session ultérieure.");
    if (t.veto.length) out.push(`Le vote négatif ${t.veto.map(deName).join(" et ")} a empêché l'adoption, malgré ${t.yes} voix pour.`);
    const rival = S.proposals.find(p => p.sponsor && S.vote.votes[p.sponsor] !== "yes");
    if (rival) out.push(`La délégation ${deName(rival.sponsor)} annonce qu'elle portera sa propre proposition (${rival.name}) dans un autre cadre.`);
  }
  const broken = S.deals.filter(d => d.status === "broken");
  if (broken.length) out.push(`${broken.length} engagement(s) non tenu(s) entament la confiance de vos partenaires pour les prochaines négociations.`);
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
  const T = {
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
    Pres: S.chairName, org: b.org === "UNESCO" ? "l'UNESCO" : "l'Organisation",
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
const sentence = s => { s = capFirst(String(s).trim()); return /[.!?…»]$/.test(s) ? s : s + "."; };

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

function axisSentence(S, axis, p, V) {
  if (Math.abs(p) < 0.25) return fill(`Sur la question ${axisDe(axis)}, ma délégation reste ouverte aux différentes options.`, V);
  const bank = SPEECH[axis][p > 0 ? "pos" : "neg"][Math.abs(p) >= 0.55 ? "strong" : "mid"];
  return fill(pickPhr(S, `ax_${axis}_${p > 0 ? 1 : 0}_${Math.abs(p) >= 0.55 ? 1 : 0}`, bank), V);
}
function topAxes(pos, w, n) {
  return Object.keys(pos).filter(a => Math.abs(pos[a]) >= 0.25).sort((a, b) => w[b] * Math.abs(pos[b]) - w[a] * Math.abs(pos[a])).slice(0, n);
}
function redSentence(S, rl, soft) {
  const pair = REDLINE[rl.axis][rl.dir];
  return soft ? `Nous le disons dans un esprit d'ouverture : ${pair[1]}.` : pair[0];
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
  const who = `la délégation ${deName(ref.code)}`, theirs = poleNP(S, ref.axis, ref.theirs), mine = poleNP(S, ref.axis, ref.mine);
  if (ref.type === "dis") return pickPhr(S, "ref_dis", [
    `Ma délégation ne partage pas l'approche défendue par ${who}. Là où elle plaide pour ${theirs}, nous privilégions ${mine}.`,
    `Nous avons entendu les arguments de ${who} en faveur ${deForm(theirs)}. Nous ne pouvons y souscrire : ma délégation privilégie ${mine}.`,
    `Contrairement à ${who}, nous ne pensons pas ${que(theirs)} soit la bonne réponse.`
  ]);
  return pickPhr(S, "ref_agr", [
    `Nous rejoignons ${who}, qui a plaidé à juste titre pour ${mine}.`,
    `Comme ${who}, ma délégation souhaite ${mine}.`,
    `Ma délégation partage l'analyse de ${who} sur la question ${axisDe(ref.axis)}.`
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
    if (bloc && rngNext(S) < 0.45) p1.push(`Ma délégation s'associe à la déclaration prononcée au nom ${BLOC_STATEMENT[bloc]} et souhaite ajouter quelques remarques à titre national.`);
  }
  const axes = topAxes(d.pos, d.w, 2);
  if (!axes.length) p2.push(axisSentence(S, issue.axes[0], 0, V));
  for (const a of axes) p2.push(axisSentence(S, a, d.pos[a], V));
  if (d.pers === "technocratique" && S.scen.facts.length) { const f = pick(S, S.scen.facts); p2.push(`Les données communiquées par le Secrétariat le montrent (${f.label.charAt(0).toLowerCase() + f.label.slice(1)} : ${fmtFact(f)}).`); }
  const ref = pickReference(S, code);
  if (ref && (ref.type === "dis" || rngNext(S) < 0.6)) p3.push(referenceSentence(S, ref));
  const prop = S.proposals.find(p => p.sponsor === code);
  if (prop) p3.push(pickPhr(S, "prop", [`C'est pourquoi ma délégation propose ${prop.name}.`, `Ma délégation soumettra à l'examen de tous une proposition précise : ${prop.name}.`]));
  if (d.red.length) p3.push(redSentence(S, d.red[0], ["mediatrice", "cooperative"].includes(d.pers)));
  if (d.pers === "mediatrice") { const ax = consensusAxis(S); if (ax) p3.push(`Ma délégation invite chacun à partir des points de convergence, qui existent, notamment en faveur ${deForm(poleNP(S, ax.axis, ax.avg))}.`); }
  p3.push(pickPhr(S, "close_" + d.pers, CLOSINGS[d.pers] || CLOSINGS.prudente) + " Je vous remercie.");
  return { code, paras: [p1.join(" "), p2.join(" "), p3.join(" ")].filter(Boolean), ref: ref ? { code: ref.code, type: ref.type, axis: ref.axis } : null, kind: "debate", t: clockStr(S) };
}
function fmtFact(f) { return (f.value >= 1000 ? fmtN(f.value) : String(f.value).replace(".", ",")) + (f.unit || ""); }
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
  paras.push(`Excellences, mesdames et messieurs les délégués, je déclare ouverte la ${b.session} ${b.de}${b.id === "UNESCO_PC" && b.commissions[sc.pc] ? " (commission « " + b.commissions[sc.pc] + " »)" : ""}.`);
  paras.push(`Notre ordre du jour appelle l'examen de la question intitulée « ${fill(issue.title, V)} ». ` + (sc.extraordinary ? fill(`Cette séance a été convoquée à la suite ${deForm(sc.triggerShort)}.`, V) : fill(`Cette question a pris une acuité nouvelle à la suite ${deForm(sc.triggerShort)}.`, V)));
  paras.push(fill(issue.background, V) + " " + issue.history.map(h => fill(h, Object.assign({}, V, sc.vars))).join(" "));
  paras.push(`Nos travaux se dérouleront en plusieurs temps : un débat général, des consultations informelles, puis l'examen d'un projet de ${b.act} et sa mise aux voix. Je rappelle les règles de vote : ${b.ruleText.charAt(0).toLowerCase() + b.ruleText.slice(1)}` + (issue.important && b.vote.important ? " La présente question relève des questions importantes : la majorité des deux tiers s'appliquera." : ""));
  const cons = sc.constraints.map(id => CONSTRAINTS.find(c => c.id === id).text);
  paras.push(`J'appelle enfin l'attention des délégations sur deux éléments de contexte. ${cons.join(" ")}`);
  paras.push(`Je rappelle que les faits et les données présentés pour ce scénario sont fictifs. Les délégations vont maintenant recevoir les instructions de leur capitale.`);
  return paras;
}
function chairLine(S, key, x) {
  const b = bodyOf(S);
  switch (key) {
    case "debate": return `Nous passons au débat général. ${x} délégations sont inscrites sur la liste des orateurs. Je donne la parole à la délégation ${deName(S.order[0])}.`;
    case "next": return `Je remercie la délégation ${deName(x.prev)} et donne la parole à la délégation ${deName(x.next)}.`;
    case "you": return `Je remercie la délégation ${deName(x.prev)}. La parole est à la délégation ${deName(S.player)}.`;
    case "endDebate": return `Le débat général est clos. La séance est suspendue pour permettre la tenue de consultations informelles.`;
    case "draft": return `La séance est reprise. Le projet de ${b.act} présenté par la délégation ${deName(S.player)} a été distribué. Nous allons l'examiner paragraphe par paragraphe et statuer sur les amendements proposés.`;
    case "vote": return `Nous allons maintenant nous prononcer sur le projet de ${b.act}. Je rappelle la règle applicable : ${needRule(S).label}.`;
    case "reply": return `La délégation ${deName(x)} a demandé à exercer son droit de réponse. Elle a la parole.`;
  }
  return "";
}
function voteAnnounce(S) {
  const t = S.vote.t, b = bodyOf(S);
  const counts = `Le résultat du vote est le suivant : ${t.yes} voix pour, ${t.no} voix contre et ${t.abs} abstention${t.abs > 1 ? "s" : ""}.`;
  if (t.adopted) return `${counts} Le projet de ${b.act} est adopté.`;
  if (t.veto.length) return `${counts} Le projet de ${b.act} n'est pas adopté en raison du vote négatif d'un membre permanent du Conseil.`;
  return `${counts} Le projet de ${b.act} n'est pas adopté, la majorité requise n'ayant pas été atteinte.`;
}
function voteExplanation(S, code, v, why) {
  const adopted = S.vote.t.adopted, a = why && why.axis ? axisName(why.axis) : null;
  if (v === "no" && why && why.why === "red") return `Ma délégation a voté contre ce texte, qui franchit une limite fondamentale pour nous en matière ${de(a)}.`;
  if (v === "no") return `Ma délégation a voté contre : le texte ne répond pas à ses préoccupations essentielles.`;
  if (v === "abs" && why && why.why === "soft") return `Ma délégation s'est abstenue : le texte reste en deçà de nos attentes en matière ${de(axisName(S.dels[code].red.find(r => r.dir === "min").axis))}.`;
  if (v === "abs") return `Ma délégation s'est abstenue : certains éléments du texte ne nous paraissent pas suffisamment équilibrés.`;
  if (why && why.why === "deal") return `Ma délégation a voté pour ce texte, conformément à l'accord conclu pendant les consultations.`;
  if (why && why.why === "cosponsor") return adopted ? `Coauteur du texte, ma délégation se félicite de son adoption.` : `Coauteur du texte, ma délégation regrette qu'il n'ait pas été adopté.`;
  return adopted ? `Ma délégation a voté pour ce texte, qui constitue un pas dans la bonne direction.` : `Ma délégation a voté pour ce texte et regrette qu'il n'ait pas recueilli la majorité requise.`;
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
function briefing(S) {
  const me = S.dels[S.player], c = COUNTRIES[S.player], issue = issueOf(S), V = speechVars(S);
  const imp = w => w >= 0.8 ? "priorité majeure" : w >= 0.55 ? "point important" : "point secondaire";
  const axes = issue.axes.slice().sort((a, b) => me.w[b] - me.w[a]).map(a => {
    const p = me.pos[a];
    const how = Math.abs(p) >= 0.55 ? "fermement" : Math.abs(p) >= 0.25 ? "plutôt" : null;
    const text = how ? `Votre capitale privilégie ${how} ${poleNP(S, a, p)}.` : me.w[a] >= 0.55 ? `Votre capitale recherche un point d'équilibre entre ${poleNP(S, a, -1)} et ${poleNP(S, a, 1)}.` : `Pas de position arrêtée : vous disposez d'une marge de manœuvre.`;
    return { axis: a, name: AXES[a].name, p, w: me.w[a], importance: imp(me.w[a]), text };
  });
  const keys = [...new Set([...issue.tags, "sov", "mul", "dev", "don"])].filter(k => INTERESTS[k]);
  const interests = keys.sort((a, b) => c.t[b] - c.t[a]).slice(0, 3).map(k => INTERESTS[k]);
  const sim = code => { const d = S.dels[code]; let s = 0, n = 0; for (const a of issue.axes) { s += me.w[a] * Math.abs(d.pos[a] - me.pos[a]); n += me.w[a]; } return 1 - s / n / 2; };
  const others = S.scen.members.filter(m => m !== S.player).sort((a, b) => sim(b) - sim(a));
  const red = me.red.map(rl => ({ axis: rl.axis, text: rl.dir === "max" ? `Ne pas accepter un texte qui irait trop loin vers ${poleNP(S, rl.axis, 1)}. Si c'est le cas, votre capitale vous demande de voter contre.` : `Ne pas soutenir un texte qui renoncerait à ${poleNP(S, rl.axis, 1)}. Dans ce cas, abstenez-vous.` }));
  return {
    title: `Note confidentielle à l'attention de la délégation ${deName(S.player)}`,
    lead: fill(`Votre délégation participe à l'examen de la question « ${issue.title} ». Votre gouvernement souhaite que la séance aboutisse à {objectif}, sans que vous perdiez de vue les intérêts nationaux exposés ci-dessous.`, Object.assign({}, V, { objectif: fill(issue.objectif, V) })),
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
    last.push("Ma délégation défendra cette position tout au long des consultations. Je vous remercie.");
    ps.push(last.join(" "));
    out.push({ id: "ferme", name: "Défendre la ligne de votre capitale", hint: "Clair et cohérent. Rassure les délégations proches, peut braquer les plus éloignées.", stance: line, quality: 0.76, paras: ps });
  }
  // 2. Main tendue
  {
    const soft = {}; for (const a of issue.axes) soft[a] = r2(line[a] * 0.55);
    const ax = consensusAxis(S);
    const ps = [open + " " + fill(OPENINGS_2.open[0], V), axes.map(a => axisSentence(S, a, soft[a] || line[a] * 0.5, V)).join(" ")];
    ps.push((ax ? `Des convergences existent, notamment en faveur ${deForm(poleNP(S, ax.axis, ax.avg))}. ` : "") + "Ma délégation est prête à examiner toutes les propositions et à travailler avec chacun pour parvenir à un texte largement soutenu. Je vous remercie.");
    out.push({ id: "ouverture", name: "Tendre la main", hint: "Améliore vos relations avec la plupart des délégations, mais affirme moins vos priorités.", stance: soft, quality: 0.7, open: true, paras: ps });
  }
  // 3. Proposition concrète
  {
    const pet = me.pet ? tplById(S, me.pet) : null;
    const f = S.scen.facts[0];
    const ps = [open + ` Les données communiquées par le Secrétariat appellent une réponse concrète (${f.label.charAt(0).toLowerCase() + f.label.slice(1)} : ${fmtFact(f)}).`];
    ps.push(axisSentence(S, axes[0], line[axes[0]], V));
    ps.push((pet ? `Ma délégation proposera d'inscrire dans le texte le paragraphe suivant : « ${capFirst(clauseText(S, instClausePreview(S, pet)))}. » ` : "") + "Nous souhaitons un texte précis, assorti d'un calendrier et d'un rapport de suivi. Je vous remercie.");
    out.push({ id: "proposition", name: "Présenter une proposition concrète", hint: "Apprécié des délégations attachées à la précision. Fait connaître votre proposition.", stance: line, quality: 0.84, paras: ps, tech: true });
  }
  // 4. Répondre à un orateur
  const prev = [...new Set(S.speeches.filter(s => s.code && s.code !== S.player).map(s => s.code))];
  let target = null, ts = 0;
  for (const p of prev) { const d = S.dels[p]; for (const a of axes) { const s = Math.abs(d.pos[a] - line[a]) * me.w[a]; if (Math.sign(d.pos[a]) !== Math.sign(line[a]) && s > ts) { ts = s; target = { code: p, axis: a }; } } }
  if (target && ts > 0.5) {
    const d = S.dels[target.code];
    const ps = [open, `Ma délégation ne peut souscrire aux propos de la délégation ${deName(target.code)}. Là où elle défend ${poleNP(S, target.axis, d.pos[target.axis])}, nous estimons ${que(poleNP(S, target.axis, line[target.axis]))} répond mieux à l'enjeu.`];
    ps.push(axes.filter(a => a !== target.axis).map(a => axisSentence(S, a, line[a], V)).join(" ") + " Je vous remercie.");
    out.push({ id: "reponse", name: `Répondre à la délégation ${deName(target.code)}`, hint: "Marque votre différence et rapproche les délégations qui partagent vos vues. La délégation visée le prendra mal.", stance: line, quality: 0.66, paras: ps.filter(Boolean), target: target.code });
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
const NEGATORS = /(\bpas\b|\bni\b|\baucun\w*|\bsans\b|\brefus\w*|\brejet\w*|\bcontre\b|\bnon\b|\bjamais\b|\bopposons\b|\bopposé\w*)/;
function lexScan(text, axes) {
  const t = " " + text.toLowerCase().replace(/[’]/g, "'") + " ", out = {}, hits = {};
  for (const a of axes) {
    let pos = 0, neg = 0;
    for (const [pole, list] of [["pos", LEX[a].pos], ["neg", LEX[a].neg]]) for (const w of list) {
      let i = t.indexOf(w);
      while (i >= 0) {
        const before = t.slice(Math.max(0, i - 28), i);
        const flip = NEGATORS.test(before.split(/[.,;:!?]/).pop());
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
  if (/président|présidente/.test(low)) q += 0.04;
  const conn = (low.match(/\b(d'abord|premièrement|deuxièmement|ensuite|enfin|c'est pourquoi|en conséquence|par ailleurs|en outre|ainsi)\b/g) || []).length;
  q += Math.min(0.12, conn * 0.04);
  if (conn >= 2) notes.push("intervention structurée");
  if (/propos|suggér|recommand|nous demandons|nous souhaitons/.test(low)) { q += 0.08; notes.push("propositions concrètes"); }
  if (/\d/.test(raw)) { q += 0.05; notes.push("appui sur des données"); }
  const topicWords = (issue.v.court + " " + issue.v.objet).toLowerCase().split(/[\s,'’]+/).filter(w => w.length >= 6);
  const onTopic = topicWords.some(w => low.includes(w.slice(0, 7)));
  if (onTopic) q += 0.06;
  const coop = (low.match(/\b(ensemble|compromis|dialogue|partenaires|consensus|coopération|convergence)\b/g) || []).length;
  if (coop) q += Math.min(0.08, coop * 0.03);
  const open = coop >= 2;
  if (open) notes.push("ton constructif");
  const caps = raw.split(/\s+/).filter(w => w.length > 3 && w === w.toUpperCase() && /[A-ZÉ]/.test(w)).length;
  const rude = /(honte|scandal|ridicule|inadmissible|mensong|hypocris|absurde|stupide|idiot|nul\b|!!)/.test(low) || caps >= 3;
  if (rude) { q -= 0.25; notes.push("ton jugé agressif, peu conforme aux usages diplomatiques"); }
  const signal = Object.keys(stance).length;
  if (!signal && !onTopic) { q -= 0.15; notes.push("position difficile à identifier"); }
  else if (!signal) notes.push("position peu explicite");
  if (words < 15) notes.push("intervention très brève");
  return { stance, quality: r2(clamp(q, 0.15, 0.95)), notes, open, rude, hits, words };
}
/* Paragraphe libre : nature probable et effets sur les axes */
function analyzeClause(S, verb, text) {
  const t = String(text || "").toLowerCase(), issue = issueOf(S);
  let k = "rec";
  if (/contributions? (obligatoires?|statutaires?)|budget ordinaire/.test(t)) k = "assessed";
  else if (/rapport|rendre compte/.test(t)) k = "report";
  else if (/fonds|contributions? volontaires?/.test(t)) k = "volfund";
  else if (/convention/.test(t)) k = "convention";
  else if (/groupe de travail|comité|observatoire|mécanisme|organe/.test(t) && /^(décide|crée|établit)/i.test(verb)) k = "body";
  else if (/coopération|échange d'informations|renforcement des capacités|partage d'expérience/.test(t)) k = "coop";
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
  const parts = [`${S.chairName}, je remercie la délégation ${deName(S.player)} pour sa question.`];
  if (axes.length) parts.push(`Ma délégation privilégie ${poleNP(S, axes[0], d.pos[axes[0]])}${axes[1] ? ", ainsi " + que(poleNP(S, axes[1], d.pos[axes[1]])) : ""}.`);
  else parts.push("Ma délégation n'a pas de position arrêtée et reste ouverte aux différentes options.");
  if (d.red.length) parts.push(d.red[0].dir === "max" ? `Je le précise : ${REDLINE[d.red[0].axis].max[1]}, au point de nous conduire à voter contre.` : `Je le précise : ${REDLINE[d.red[0].axis].min[1]}.`);
  else parts.push("Nous serons attentifs à l'équilibre d'ensemble du texte.");
  return parts.join(" ");
}
function rightOfReply(S, code) {
  const d = S.dels[code], a = topAxes(d.pos, d.w, 1)[0] || issueOf(S).axes[0];
  const hard = d.pers === "intransigeante";
  return (hard ? "Ma délégation rejette la présentation qui vient d'être faite de sa position. " : "Ma délégation regrette la présentation qui a été faite de sa position. ") +
    `Nous défendons ${poleNP(S, a, d.pos[a])} parce que c'est, selon nous, la condition d'une mise en œuvre effective.` + (hard ? " Nous ne changerons pas de ligne." : " Nous restons ouverts au dialogue.");
}
function supportText(S, code) {
  const d = S.dels[code], a = topAxes(d.pos, d.w, 1)[0];
  return `Ma délégation souhaite appuyer l'intervention de la délégation ${deName(code)}` + (a ? `, en particulier lorsqu'elle plaide pour ${poleNP(S, a, d.pos[a])}.` : ".");
}

/* ---------- Réponses en négociation bilatérale ---------- */
function probeReply(S, code) {
  const d = S.dels[code], axes = topAxes(d.pos, d.w, 2), vi = voteIntent(S, code);
  const parts = [];
  parts.push(axes.length ? `Nous privilégions ${poleNP(S, axes[0], d.pos[axes[0]])}${axes[1] ? ", ainsi " + que(poleNP(S, axes[1], d.pos[axes[1]])) : ""}.` : "Nous n'avons pas de position arrêtée sur ce sujet.");
  if (d.red.length) parts.push(d.red.map(rl => rl.dir === "max" ? `En revanche, ${REDLINE[rl.axis].max[1]} : ce serait pour nous un motif de vote contre.` : `Par ailleurs, ${REDLINE[rl.axis].min[1]}.`).join(" "));
  else parts.push("Nous n'avons pas de ligne rouge sur ce texte, mais nous resterons attentifs à son équilibre.");
  if (d.pet) { const t = tplById(S, d.pet); if (t && !hasSrc(S, d.pet)) parts.push(`Nous aimerions voir figurer dans le texte le paragraphe suivant : « ${capFirst(clauseText(S, instClausePreview(S, t)))}. »`); }
  if (S.draft.ops.length) parts.push(vi.v === "yes" ? "En l'état, nous voterions pour le texte." : vi.v === "no" ? "En l'état, nous voterions contre le texte." : "En l'état, nous nous abstiendrions.");
  return parts.join(" ");
}
function persuadeReply(S, code, r) {
  const d = S.dels[code];
  if (r.ok && r.effect === "reassure") return "Vos garanties nous rassurent : ce point nous préoccupe désormais moins.";
  if (r.ok) return pickPhr(S, "pers_ok", ["Votre argument mérite réflexion. Nous pourrions faire évoluer notre position sur ce point.", "Nous sommes sensibles à cet argument et en tiendrons compte.", "C'est un point que notre capitale entendra. Nous allons revoir notre position."]);
  if (d.red.some(x => x.axis === r.axis)) return "Sur ce point, notre position est arrêtée : elle ne changera pas.";
  return pickPhr(S, "pers_ko", ["Nous comprenons votre point de vue, mais il ne répond pas à nos préoccupations.", "Cet argument ne nous convainc pas.", "Nous ne voyons pas les choses de cette manière."]);
}
function dealReply(S, code, askKey, r) {
  if (r.ok) return ({ vote: "Marché conclu : nous voterons pour le texte si cet engagement est tenu.", cosponsor: "Marché conclu : nous nous porterons coauteur du texte si cet engagement est tenu.", group: "Marché conclu : nous plaiderons en faveur du texte au sein de notre groupe." })[askKey];
  if (r.reason === "red") return "Ce que vous proposez conduirait le texte au-delà d'une limite que notre capitale ne nous permet pas de franchir.";
  if (r.reason === "nogroup") return "Notre délégation ne fait partie d'aucun groupe représenté ici dont elle pourrait rallier les membres.";
  if (r.reason === "counter") return r.counter ? `Votre offre ne suffit pas. Nous pourrions en revanche accepter si vous acceptiez ${de(r.counter.label.charAt(0).toLowerCase() + r.counter.label.slice(1))}.` : "Votre offre ne suffit pas, mais nous restons ouverts à la discussion.";
  return "Nous ne pouvons pas accepter cet arrangement.";
}
function cosponsorReply(S, code, r) {
  return r.ok ? "Nous acceptons de nous porter coauteur du texte." : "Il est trop tôt pour que nous nous portions coauteur : le texte doit encore évoluer.";
}

/* =====================================================================
   DÉROULEMENT D'UNE PARTIE : les sept phases
   1 Ouverture · 2 Briefing · 3 Débat général · 4 Négociations
   5 Rédaction · 6 Vote · 7 Débriefing
   ===================================================================== */
const PHASES = ["Ouverture", "Briefing", "Débat général", "Négociations", "Rédaction", "Vote", "Bilan"];
const MAX_REACTIONS = 3;

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
function startBriefing(S) { if (S.phase !== 1) return; S.phase = 2; advance(S, 10); logE(S, "procedure", "Les délégations reçoivent les instructions de leur capitale."); }

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
  logE(S, "debate", "Ouverture du débat général.");
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
  logE(S, "debate", `Intervention de la délégation ${deName(code)}${sp.ref && sp.ref.code === S.player ? (sp.ref.type === "dis" ? ", qui conteste votre position" : ", qui rejoint votre position") : ""}.`, code);
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
  logE(S, "debate", `Votre délégation prononce son intervention${extra.target ? " et répond à la délégation " + deName(extra.target) : ""}.`, S.player);
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
    logE(S, "debate", `Votre délégation appuie l'intervention de la délégation ${deName(code)}.`, code);
  } else if (kind === "contest") {
    d.rel = clamp(d.rel - 9, -100, 100);
    for (const m of others) { if (near(m, code) > 0.78) S.dels[m].rel = clamp(S.dels[m].rel - 3, -100, 100); else if (1 - avgDist(S.dels[m].pos, S.line) / 2 > 0.75) S.dels[m].rel = clamp(S.dels[m].rel + 2, -100, 100); }
    const a = topAxes(d.pos, d.w, 1)[0] || issueOf(S).axes[0];
    const np = poleNP(S, a, d.pos[a]);
    insertAfter(S, code, [{ code: S.player, mine: true, kind: "contest", about: code, paras: [`Ma délégation conteste l'analyse de la délégation ${deName(code)}. ${capFirst(np)} ne nous ${/^des /.test(np) ? "paraissent" : "paraît"} pas répondre à l'enjeu : nous privilégions ${poleNP(S, a, S.line[a] || -d.pos[a])}.`], t: clockStr(S) },
      { code, kind: "reply", paras: [rightOfReply(S, code)], t: clockStr(S) }]);
    logE(S, "debate", `Votre délégation conteste l'intervention de la délégation ${deName(code)}, qui exerce son droit de réponse.`, code);
  } else {
    d.known.pos = true; d.known.red = true;
    d.rel = clamp(d.rel + 2, -100, 100);
    insertAfter(S, code, [{ code: S.player, mine: true, kind: "question", about: code, paras: [`Ma délégation souhaiterait que la délégation ${deName(code)} précise ses priorités et les limites qu'elle ne pourrait pas accepter.`], t: clockStr(S) },
      { code, kind: "reply", paras: [clarifyReply(S, code)], t: clockStr(S) }]);
    logE(S, "debate", `La délégation ${deName(code)} précise sa position à votre demande.`, code);
  }
  return true;
}
/* Phase 3 → 4 */
function endDebate(S) {
  if (S.phase !== 3) return;
  if (!S.playerSpoke) S.stats.quality.push(0.1);
  let n = 0; while (!debateOver(S) && n++ < 40) { if (isMyTurn(S)) { S.debateIdx++; logE(S, "debate", "Votre délégation renonce à son temps de parole.", S.player); } else debateNext(S); }
  S.speeches.push({ chair: true, kind: "chair", paras: [chairLine(S, "endDebate")], t: clockStr(S) });
  S.phase = 4;
  advance(S, 15);
  initialDraft(S);
  S.initial = { proj: projection(S), uPlayer: r2(playerU(S, textVec(S))) };
  logE(S, "procedure", `Votre délégation fait circuler un avant-projet de ${bodyOf(S).act} comprenant ${S.draft.ops.length} paragraphes.`, S.player);
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
function offerPromise(S, o) {
  const c = o.uid ? S.draft.ops.find(x => x.uid === o.uid) : null, short = c ? clauseShort(S, c) : "";
  switch (o.kind) {
    case "pet": { const t = tplById(S, o.src); return `nous intégrerons au texte le paragraphe que vous proposez : « ${t ? capFirst(clauseText(S, instClausePreview(S, t))) : ""} »`; }
    case "soften": return `nous remplacerons « ${c ? c.v : ""} » par « ${o.verb} » au paragraphe « ${short} »`;
    case "delete": return `nous retirerons le paragraphe « ${short} »`;
    case "fund": return "nous ajouterons un paragraphe sur l'assistance technique et financière aux pays en développement";
    default: return "nous soutiendrons une initiative de votre délégation dans un autre forum";
  }
}
const ASK_MSG = { vote: "voter pour le texte", cosponsor: "vous porter coauteur du texte", group: "rallier votre groupe à notre texte" };
function doProbe(S, code) {
  if (!canAct(S, "probe")) return { ok: false, reason: "time" };
  talk(S, code, "me", "Pourriez-vous nous préciser vos priorités et vos limites sur ce texte ?");
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
  talk(S, code, "me", `Nous vous proposons l'arrangement suivant : ${offerPromise(S, offer)}. En contrepartie, nous comptons sur votre délégation pour ${ASK_MSG[askKey]}.`);
  const r = actDeal(S, code, askKey, offer);
  r.reply = dealReply(S, code, askKey, r);
  talk(S, code, "them", r.reply);
  maybeAi(S);
  return r;
}
function doCosponsor(S, code) {
  if (!canAct(S, "cosponsor")) return { ok: false, reason: "time" };
  talk(S, code, "me", "Accepteriez-vous de vous porter coauteur de notre projet ?");
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
  logE(S, "procedure", "Reprise de la séance : examen du projet de texte et des amendements.");
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
  logE(S, "vote", `Le projet de ${bodyOf(S).act} est mis aux voix.`);
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
  logE(S, "procedure", `Fin de la séance. Bilan : ${rep.verdict.k.toLowerCase()}.`);
  return rep;
}
function summarize(S) {
  return {
    id: S.id, date: S.updated || Date.now(), bodyId: S.bodyId, pc: S.scen.pc, issueId: S.issueId, title: issueOf(S).title,
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
    if (this.status === "on") return "IA connectée : les délégations s'expriment avec leurs propres mots.";
    if (this.status === "checking") return "Vérification de l'IA…";
    return "Mode démonstration : textes générés par le simulateur, sans IA.";
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
      task: "speech", kind: kind || "debate",
      body: b.name, org: b.org, issue: issueOf(S).title, chair: S.chairName,
      speaker: COUNTRIES[sp.code].name, attitude: d ? (PERSONALITIES[d.pers] || {}).name || "" : "",
      text: sp.paras.join("\n\n").slice(0, 2400)
    });
    const t = r && typeof r.text === "string" ? r.text.trim() : "";
    if (t.length < 60 || t.length > 2400) return null;
    return t.replace(/\r/g, "").split(/\n{2,}/).map(x => x.replace(/\s+/g, " ").trim()).filter(Boolean).slice(0, 5);
  },
  /* Analyse d'une intervention libre : position sur les axes et qualité */
  async classifySpeech(S, text) {
    const issue = issueOf(S);
    const r = await this.call(S, {
      task: "classify", mode: "speech", issue: issue.title,
      axes: issue.axes.map(a => ({ id: a, name: AXES[a].name, neg: AXES[a].neg, pos: AXES[a].pos })),
      text: String(text).slice(0, 3000)
    });
    if (!r || !r.result || typeof r.result !== "object") return null;
    const out = { stance: {}, quality: null, notes: [] };
    for (const a of issue.axes) { const v = Number((r.result.stance || {})[a]); if (Number.isFinite(v) && Math.abs(v) >= 0.05) out.stance[a] = r2(clamp(v, -1, 1)); }
    const q = Number(r.result.quality); if (Number.isFinite(q)) out.quality = clamp(q, 0, 1);
    if (Array.isArray(r.result.notes)) out.notes = r.result.notes.filter(x => typeof x === "string").map(x => x.slice(0, 120)).slice(0, 3);
    return out;
  },
  /* Analyse d'un paragraphe libre : effets sur les axes uniquement.
     La nature du paragraphe et sa recevabilité restent déterminées par le moteur. */
  async classifyClause(S, verb, text) {
    const issue = issueOf(S);
    const r = await this.call(S, {
      task: "classify", mode: "clause", issue: issue.title, body: bodyOf(S).name,
      axes: issue.axes.map(a => ({ id: a, name: AXES[a].name, neg: AXES[a].neg, pos: AXES[a].pos })),
      text: (verb + " " + String(text)).slice(0, 1200)
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
  if (!LS.set(KEY_CUR, G) && !save.warned) { save.warned = true; toast("La sauvegarde automatique n'est pas disponible dans ce navigateur : la partie sera perdue si vous fermez la page."); }
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
const voteWord = v => ({ yes: "Pour", no: "Contre", abs: "Abstention" })[v] || "Inconnu";
const relLabel = r => r >= 45 ? ["Excellente", "r5"] : r >= 15 ? ["Bonne", "r4"] : r > -15 ? ["Neutre", "r3"] : r > -45 ? ["Tendue", "r2"] : ["Difficile", "r1"];
const relMeter = r => { const k = Number(relLabel(r)[1].slice(1)); return `<span class="sim-relm r${k}" aria-hidden="true">${[1, 2, 3, 4, 5].map(i => `<i${i <= k ? ' class="on"' : ""}></i>`).join("")}</span>`; };
const inflLabel = n => n >= 5 ? "très forte" : n >= 4 ? "forte" : n >= 3 ? "moyenne" : "modeste";
const groupName = code => { const b = BODIES[G.bodyId]; return b.org === "UNESCO" ? UNESCO_GROUPS[COUNTRIES[code].unesco] : UN_GROUPS[COUNTRIES[code].un]; };
const mins = n => `${n} min`;
const orgName = b => b.org === "ONU" ? "Nations Unies" : "UNESCO";
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
const sizeText = b => b.sim.p5only ? "5 membres permanents" : b.realSize >= 190 ? `${b.realSize} États membres · ${b.sim.size || 15} délégations simulées` : `${b.realSize} membres${(b.sim.size || 15) !== b.realSize ? ` · ${b.sim.size} simulés` : ""}`;
function eligible(bodyId) {
  const b = BODIES[bodyId];
  if (b.sim.p5only) return P5.slice();
  return Object.values(COUNTRIES).filter(c => !(b.org === "UNESCO" && c.noUnesco)).map(c => c.code);
}
function aiNote() {
  const c = ctx();
  if (AI.status === "on") return `<span class="sim-mode on">${H(AI.label())}</span>`;
  const why = AI.reason === "login" ? " Connectez-vous pour utiliser l'IA si elle est activée pour l'association." : AI.reason === "limit" ? " La limite quotidienne d'appels à l'IA est atteinte." : "";
  return `<span class="sim-mode">${H(AI.label() + (c.lang === "en" ? "" : why))}</span>`;
}

/* ---------- Écran d'accueil ---------- */
function miniTally(x) {
  const t = Math.max(1, (x.yes || 0) + (x.no || 0) + (x.abs || 0));
  return `<span class="sim-mt" title="${x.yes} pour, ${x.no} contre, ${x.abs} abstention(s)"><i class="v-yes" style="width:${(x.yes / t * 100).toFixed(1)}%"></i><i class="v-abs" style="width:${(x.abs / t * 100).toFixed(1)}%"></i><i class="v-no" style="width:${(x.no / t * 100).toFixed(1)}%"></i></span>`;
}
function vHome() {
  const hist = LS.get(KEY_HIST, []);
  const cur = G && G.phase < 7 ? G : null;
  return `<div class="sim-home">
  <section class="sim-hero">
    <div class="h-txt">
      <p class="sim-kick">Simulation diplomatique de SOMUN</p>
      <h1 class="h-title"><em>1</em> voix sur 193</h1>
      <p class="h-lead">Chaque État membre des Nations Unies dispose d'une voix. Le temps d'une séance, vous représentez l'un d'eux : vous écoutez, vous négociez, vous rédigez, puis la salle vote.</p>
      <p class="h-lead2">Vous ne choisissez pas les autres délégations. Vous choisissez ce que vous leur dites.</p>
      ${cur ? `<div class="sim-resume"><span class="sim-kick">Séance en cours · étape ${cur.phase} sur 7 : ${H(PHASES[cur.phase - 1].toLowerCase())}</span><b>${H(issueOf(cur).title)}</b><span class="sim-mute">${H(BODIES[cur.bodyId].name)} · délégation ${H(deName(cur.player))}</span><div class="sim-row">${btn("Reprendre la séance", "resume", { cls: "primary" })}${btn("Nouvelle simulation", "new", { cls: "ghost" })}${btn("Abandonner", "abandon", { cls: "link" })}</div></div>${aiNote()}`
      : `<div class="sim-cta">${btn("Nouvelle simulation", "new", { cls: "primary lg" })}${aiNote()}</div>`}
    </div>
    <figure class="h-art">${heroDots()}<figcaption><span><i class="hd-k"></i>193 États membres de l'ONU</span><span><i class="hd-k c"></i>15 siègent au Conseil de sécurité</span><span><i class="hd-k me"></i>1 délégation : la vôtre</span></figcaption></figure>
  </section>
  <section class="sim-how"><h2>Comment ça marche ?</h2><div class="how-grid">
    <div><h3>Une délégation parmi d'autres</h3><p>Vous recevez un organe, un pays et une question fictive. Les autres délégations ont leurs intérêts, leurs alliés et leurs lignes rouges : à vous de les découvrir.</p></div>
    <div><h3>Le temps de la séance</h3><p>Sept étapes, de l'ouverture au vote. Pendant les négociations, chaque démarche consomme du temps de séance : vous ne pourrez pas tout faire.</p></div>
    <div><h3>Des règles réelles</h3><p>Le vote suit la règle exacte de chaque organe : 9 voix sans veto au Conseil de sécurité, deux tiers pour certaines décisions. Le simulateur compte les voix, jamais l'IA.</p></div>
  </div></section>
  <section><h2>Les sept étapes d'une séance</h2><ol class="sim-phases">${PHASES.map((p, i) => `<li><span class="s7-n">${i + 1}</span><b>${H(p)}</b><span>${H(PHASE_DESC[i])}</span></li>`).join("")}</ol></section>
  <section><h2>Vos séances</h2>
  ${hist.length ? `<div class="sim-hist">${hist.map(x => `<article class="hist-c"><span class="sim-kick">${new Date(x.date).toLocaleDateString("fr-FR")}</span><b>${H(x.title)}</b><span class="sim-mute">${H((BODIES[x.bodyId] || {}).name || "")} · délégation ${H(deName(x.player))}</span>${miniTally(x)}<div class="hist-r"><span class="sim-res ${x.adopted ? "ok" : "ko"}">${x.adopted ? "Adopté" : "Non adopté"} · ${x.yes} pour, ${x.no} contre, ${x.abs} abst.</span>${x.score != null ? `<span class="sim-hist-score">${x.score}<small>/100</small></span>` : ""}</div>${x.genOpts ? btn("Rejouer", "replay", { cls: "ghost sm", x: x.id }) : ""}</article>`).join("")}</div>
  <p>${btn("Effacer l'historique", "clearHist", { cls: "link" })}</p>` : `<p class="sim-mute">Vos séances terminées apparaîtront ici, avec leur résultat et votre score.</p>`}</section>
  <p class="sim-fine">Les scénarios sont fictifs. Les profils des États sont des simplifications pédagogiques et ne reflètent pas les positions officielles des gouvernements. Les règles de vote appliquées sont celles des textes constitutifs de chaque organe.</p>
</div>`;
}

/* ---------- Préparation d'une partie ---------- */
function vSetup() {
  const st = UI.setup, steps = ["Organe", "Délégation", "Scénario"];
  const crumbs = `<ol class="sim-crumbs">${steps.map((s, i) => `<li class="${i + 1 === st.step ? "on" : i + 1 < st.step ? "done" : ""}"><span class="cr-n">${i + 1}</span>${i + 1 < st.step ? `<button type="button" data-a="setupStep" data-x="${i + 1}">${s}</button>` : s}</li>`).join("")}</ol>`;
  let body = "";
  if (st.step === 1) {
    const card = id => { const b = BODIES[id], [d, r] = BODY_SHORT[id]; return `<button type="button" class="sim-body${st.bodyId === id ? " on" : ""}" data-a="pickBody" data-x="${id}" aria-pressed="${st.bodyId === id}"><span class="sim-body-n">${H(b.name.replace(" (session pédagogique)", ""))}${id === "TRUST" ? ` <span class="sim-tag">pédagogique</span>` : ""}</span><span class="sim-body-d">${H(d)}</span>${seatGlyph(b)}<span class="sim-body-m">${H(sizeText(b))}</span>${ruleGlyph(b)}<span class="sim-body-v">${H(r)}</span></button>`; };
    body = `<h1>Choisissez un organe</h1><p class="sim-lead">Chaque organe a ses propres pouvoirs et sa propre règle de vote. La barre dorée indique la part des voix qu'il faut réunir ; le simulateur refuse les mesures qui sortent des compétences de l'organe.</p>
    <h2 class="sim-org-h">Nations Unies</h2><div class="sim-bodies">${BODY_ORDER["Nations Unies"].map(card).join("")}</div>
    <h2 class="sim-org-h">UNESCO</h2><div class="sim-bodies">${BODY_ORDER.UNESCO.map(card).join("")}</div>
    ${st.bodyId === "UNESCO_PC" ? `<div class="sim-pcpick"><b>Commission</b><div class="sim-chips">${Object.entries(BODIES.UNESCO_PC.commissions).map(([k, v]) => `<button type="button" class="sim-chip${st.pc === k ? " on" : ""}" data-a="pickPc" data-x="${k}" aria-pressed="${st.pc === k}">${H(v)}</button>`).join("")}</div></div>` : ""}
    <div class="sim-cta">${st.bodyId === "UNESCO_PC" ? btn("Continuer", "setupStep", { cls: "primary", x: 2, dis: !st.pc }) : ""}${btn("Retour", "home", { cls: "ghost" })}</div>`;
  } else if (st.step === 2) {
    const b = BODIES[st.bodyId];
    body = `<h1>Choisissez votre délégation</h1><p class="sim-lead">${H(b.name)}${st.pc ? " · " + H(b.commissions[st.pc]) : ""}. ${b.id === "UNSC" ? "Les cinq membres permanents siègent toujours ; les dix autres sièges sont répartis entre les groupes régionaux." : b.sim.p5only ? "Le Conseil de tutelle ne compte plus que les cinq membres permanents." : "La composition simulée respecte la répartition entre groupes régionaux."}</p>
    <div class="sim-row sim-search"><input type="search" data-k="q" data-live="countries" placeholder="Rechercher un pays" aria-label="Rechercher un pays" value="${H(st.q)}">${btn("Tirer au sort", "pickCountry", { cls: "ghost", x: "__random" })}</div>
    <div id="sim-countries">${countryList()}</div>
    <div class="sim-cta">${btn("Retour", "setupStep", { cls: "ghost", x: 1 })}</div>`;
  } else {
    body = scenarioPreview();
  }
  return `<div class="sim-setup">${crumbs}${body}</div>`;
}
function countryList() {
  const st = UI.setup, b = BODIES[st.bodyId], key = b.org === "UNESCO" ? "unesco" : "un", names = key === "un" ? UN_GROUPS : UNESCO_GROUPS;
  const q = st.q.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const list = eligible(st.bodyId).filter(c => !q || cnm(c).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(q));
  if (!list.length) return `<p class="sim-mute">Aucun pays ne correspond à cette recherche.</p>`;
  const groups = {};
  for (const c of list) (groups[COUNTRIES[c][key]] = groups[COUNTRIES[c][key]] || []).push(c);
  return Object.keys(names).filter(g => groups[g]).map(g => `<div class="sim-cgroup"><h3><i class="sim-gdot" style="background:${GROUP_COLORS[g]}"></i>${H(names[g])}</h3><div class="sim-countries">${sortFr(groups[g]).map(c => `<button type="button" class="sim-country" data-a="pickCountry" data-x="${c}">${H(cnm(c))}${b.id === "UNSC" && P5.includes(c) ? `<small>membre permanent</small>` : ""}</button>`).join("")}</div></div>`).join("");
}
function scenarioPreview() {
  const st = UI.setup, sc = st.gen.scen, issue = ISSUE_BY_ID[sc.issueId], b = BODIES[sc.bodyId];
  const V = Object.assign({}, issue.v, sc.vars);
  const cons = sc.constraints.map(id => CONSTRAINTS.find(c => c.id === id).text);
  const P = { bodyId: sc.bodyId, scen: sc, player: st.player };
  return `<p class="sim-kick">Scénario fictif · ${H(orgName(b))} · ${H(b.name)}${sc.pc ? " · " + H(b.commissions[sc.pc]) : ""}</p>
  <h1 class="sc-title">${H(issue.title)}</h1>
  <p class="sc-who">Vous représentez <b>${H(cnm(st.player))}</b>, une délégation sur ${sc.members.length}.</p>
  <p class="sim-lead sc-lead">${H(capFirst(sc.triggerShort))}.</p>
  ${statCards(sc.facts, "Données du scénario, fictives")}
  <div class="sim-cols">
    <div><h3>Contexte</h3><p>${H(fill(issue.background, V))}</p>
      <h3>Ce qui pèse sur la séance</h3><ul class="sim-ul">${cons.map(c => `<li>${H(c)}</li>`).join("")}</ul></div>
    <div><h3>Règle de vote</h3><p>${H(b.ruleText)}</p>${ruleGlyph(b)}
      <h3>Délégations présentes</h3><div class="sim-plqs">${sc.members.map(c => plq(c, c === st.player ? "me" : "")).join("")}</div></div>
  </div>
  <figure class="sim-mapbox">${dotMap(P, "group", { click: false, player: st.player })}${mapLegend(P, "group")}</figure>
  <div class="sim-cta">${btn("Ouvrir la séance", "start", { cls: "primary lg" })}${btn("Autre scénario", "reroll", { cls: "ghost" })}${btn("Changer de délégation", "setupStep", { cls: "ghost", x: 2 })}</div>`;
}

/* ---------- Partie : en-tête, étapes, salles, barre « Maintenant » ---------- */
const TABS = [["board", "Ma délégation"], ["room", "Salle de conférence"], ["diplo", "Espace diplomatique"], ["draft", "Salle de rédaction"], ["vote", "Salle de vote"], ["log", "Chronologie"]];
function defaultTab(phase) { return ({ 1: "room", 2: "board", 3: "room", 4: "diplo", 5: "draft", 6: "vote", 7: "board" })[phase] || "board"; }
function nowBar() {
  const S = G;
  let txt = "", action = "";
  switch (S.phase) {
    case 1: txt = "La présidence a ouvert la séance. Recevez les instructions de votre capitale."; action = btn("Recevoir mes instructions", "brief", { cls: "primary" }); break;
    case 2: txt = "Lisez vos instructions confidentielles, puis choisissez votre ligne de négociation."; action = UI.tab !== "board" ? btn("Lire mes instructions", "tab", { cls: "primary", x: "board" }) : btn("Choisir ma ligne", "jump", { cls: "primary", x: ".sim-orients" }); break;
    case 3: {
      const pos = S.order.indexOf(S.player) + 1;
      if (isMyTurn(S)) { txt = "La présidence vous donne la parole."; action = UI.tab !== "room" ? btn("Prendre la parole", "tab", { cls: "primary", x: "room" }) : btn("Préparer mon intervention", "jump", { cls: "primary", x: ".sim-myturn" }); }
      else if (debateOver(S)) { txt = "Toutes les délégations inscrites se sont exprimées."; action = btn("Ouvrir les négociations", "endDebate", { cls: "primary" }); }
      else { txt = S.playerSpoke ? "Débat général : les dernières délégations s'expriment." : `Débat général : vous êtes ${pos === 1 ? "le premier orateur" : `le ${pos}e orateur`} inscrit.`; action = btn(UI.busy ? "La délégation s'exprime…" : "Orateur suivant", "next", { cls: "primary", dis: !!UI.busy }); }
      break;
    }
    case 4: txt = `Négociations : il vous reste ${mins(timeLeft(S))}.`; action = btn("Passer à l'examen du texte", "endNego", { cls: "primary" }); break;
    case 5: txt = `Examen du texte : il vous reste ${mins(timeLeft(S))}. Traitez les amendements, puis mettez le texte aux voix.`; action = UI.tab !== "draft" ? btn("Ouvrir la salle de rédaction", "tab", { cls: "primary", x: "draft" }) : btn("Voir les amendements", "jump", { cls: "primary", x: ".sim-tools" }); break;
    case 6: txt = S.vote ? "Le vote est terminé." : "Le texte est mis aux voix. Exprimez le vote de votre délégation."; action = S.vote ? btn("Voir le bilan", "finish", { cls: "primary" }) : (UI.tab !== "vote" ? btn("Aller à la salle de vote", "tab", { cls: "primary", x: "vote" }) : btn("Voter", "jump", { cls: "primary", x: ".sim-votebtns" })); break;
    case 7: txt = "La séance est levée."; action = btn("Nouvelle simulation", "new", { cls: "primary" }); break;
  }
  return `<div class="sim-now" role="region" aria-label="Prochaine étape"><span class="now-k">Maintenant</span><p>${H(txt)}</p>${action}</div>`;
}
function vGame() {
  const S = G, b = bodyOf(S), issue = issueOf(S);
  const pend = pendingAmendments(S).length, inbox = S.inbox.filter(m => m.status === "pending").length;
  const badge = S.phase <= 5 ? { diplo: inbox, draft: pend } : {};
  const mast = `<div class="sim-mast">
    <div class="m-top"><span class="m-org">${H(orgName(b))}</span><span class="m-body">${H(b.name.replace(" (session pédagogique)", ""))}${S.scen.pc ? " · " + H(b.commissions[S.scen.pc]) : ""}</span><span class="sim-tag">Scénario fictif</span><time class="m-clock" title="Horloge de séance">${H(clockStr(S))}</time></div>
    <h1 class="m-title">${H(issue.title)}</h1>
    <div class="m-me"><span>Vous représentez</span>${plq(S.player)}<span class="m-of">1 délégation sur ${S.scen.members.length}</span>${btn("Menu du jeu", "home", { cls: "link" })}</div>
  </div>`;
  const rail = `<ol class="sim-rail" aria-label="Étapes de la séance" style="--p:${((S.phase - 1) / 6).toFixed(3)}">${PHASES.map((p, i) => `<li class="${i + 1 === S.phase ? "on" : i + 1 < S.phase ? "done" : ""}"${i + 1 === S.phase ? ' aria-current="step"' : ""}><span class="n">${i + 1}</span><span class="l">${H(p)}</span></li>`).join("")}</ol>`;
  const tabs = `<div class="sim-tabs" role="tablist">${TABS.map(([k, l]) => `<button type="button" role="tab" aria-selected="${UI.tab === k}" class="${UI.tab === k ? "on" : ""}" data-a="tab" data-x="${k}">${H(l)}${badge[k] ? `<span class="sim-badge" aria-label="${badge[k]} en attente">${badge[k]}</span>` : ""}</button>`).join("")}</div>`;
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
    parts.push(`<div class="sim-sit sim-sit-room"><h3>Dans la salle</h3>${roomSVG(S, { mini: true })}<p class="sim-mute">${last ? `À la parole : <b>${H(cnm(last.code))}</b>.` : "La présidence ouvre le débat."}${nx ? ` Prochain orateur : ${nx === S.player ? "<b>vous</b>" : H(cnm(nx))}.` : ""}</p></div>`);
  }
  if (S.phase === 3) {
    const others = S.scen.members.filter(c => c !== S.player), known = others.filter(c => S.dels[c].known.pos);
    parts.push(`<div class="sim-sit"><h3>Ce que vous savez</h3><div class="sim-known">${others.map(c => `<i class="${S.dels[c].known.pos ? "on" : ""}" title="${H(cnm(c))}${S.dels[c].known.pos ? "" : " : position inconnue"}"></i>`).join("")}</div><p class="sim-mute"><b>${known.length} position${known.length > 1 ? "s" : ""} connue${known.length > 1 ? "s" : ""}</b> sur ${others.length}. Pour connaître une position, demandez une précision à la délégation après son intervention ; pendant les négociations, vous pourrez la sonder.</p></div>`);
  }
  if (S.phase === 4 || S.phase === 5) {
    const tot = S.phase === 4 ? 120 : 60, left = timeLeft(S);
    parts.push(`<div class="sim-sit"><h3>Temps ${S.phase === 4 ? "de négociation" : "d'examen du texte"}</h3><div class="sim-time"><b>${left}</b><span>min sur ${tot}</span></div><div class="sim-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${tot}" aria-valuenow="${left}"><i style="width:${Math.round(left / tot * 100)}%"></i></div><p class="sim-mute">Horloge de séance : ${H(clockStr(S))}</p></div>`);
  }
  if (S.phase >= 4 && S.phase <= 6 && !S.vote) parts.push(`<div class="sim-sit"><h3>Si l'on votait maintenant</h3>${voteDots(S)}</div>`);
  if (S.phase >= 2 && S.phase < 7) {
    const objs = S.vote ? evalObjectives(S) : S.phase >= 4 ? liveObjectives(S) : objectives(S).map(o => Object.assign({}, o, { ok: null }));
    const done = objs.filter(o => o.ok === true).length;
    parts.push(`<div class="sim-sit"><h3>Vos objectifs${S.phase >= 4 ? ` <span class="sim-count">${done} sur ${objs.length}</span>` : ""}</h3><ul class="sim-objs">${objs.map(o => `<li class="${o.ok === true ? "ok" : o.ok === false ? "no" : ""}"><span class="sim-dot" aria-hidden="true"></span>${H(o.text)}${o.ok === true ? `<span class="sr">(atteint pour l'instant)</span>` : ""}</li>`).join("")}</ul></div>`);
  }
  if (S.phase >= 4 && S.phase < 7) parts.push(`<div class="sim-sit"><h3>Soutiens</h3><p>${S.draft.cosponsors.length ? `Coauteurs : ${S.draft.cosponsors.map(c => H(cnm(c))).join(", ")}.` : "Aucun coauteur pour l'instant."} ${S.deals.filter(d => d.status === "active").length ? `${S.deals.filter(d => d.status === "active").length} accord(s) en cours.` : ""}</p></div>`);
  parts.push(`<div class="sim-sit sim-sit-mode">${aiNote()}</div>`);
  return parts.join("");
}

/* ---------- Ma délégation (tableau de bord) ---------- */
function tBoard() {
  const S = G, b = bodyOf(S), issue = issueOf(S), V = speechVars(S), out = [];
  if (S.phase === 7 && S.report) out.push(debrief());
  if (S.phase < 7) out.push(`<div class="sim-inline-sit">${situation()}</div>`);
  if (S.phase >= 2) out.push(briefNote());
  out.push(`<section class="sim-card"><h2>La question</h2>
    <p class="sim-qlead">${H(capFirst(S.scen.triggerShort))}.</p><p>${H(fill(issue.background, V))}</p>
    ${statCards(S.scen.facts, "Données du scénario, fictives")}
    <p class="sim-fine">Les faits et les données de ce scénario sont fictifs ; les textes juridiques cités sont réels.</p></section>`);
  out.push(`<section class="sim-card"><h2>Les délégations présentes</h2>${mapBlock(S, S.phase >= 4 ? ["group", "vote", "rel"] : S.phase >= 3 ? ["group", "rel"] : ["group"], UI.mapMode || "group")}</section>`);
  out.push(`<section class="sim-card"><h2>${H(b.name)}</h2><p>${H(b.desc)}</p>
    <div class="sim-cols"><div><h3>Ce que l'organe peut faire</h3><ul class="sim-ul ok">${b.powers.map(p => `<li>${H(p)}</li>`).join("")}</ul></div><div><h3>Ce qu'il ne peut pas faire</h3><ul class="sim-ul ko">${b.limits.map(p => `<li>${H(p)}</li>`).join("")}</ul></div></div>
    <h3>Règle de vote</h3><p>${H(b.ruleText)}</p>${ruleDiagram(S)}</section>`);
  return out.join("");
}
/* Positions sur les points clés, en curseurs « vers où penche… » */
function axisBars(S, code, opts = {}) {
  const d = S.dels[code], issue = issueOf(S), R = textVec(S), showR = S.phase >= 4, mine = code === S.player;
  const known = mine || d.known.pos, red = mine || d.known.red, me = S.dels[S.player];
  const rows = issue.axes.map(a => {
    const rl = red ? d.red.find(r => r.axis === a) : null;
    const marks = [known ? { v: d.pos[a], k: mine ? "cap" : "del", t: mine ? "Position de votre capitale" : "Position de la délégation" } : null, !mine ? { v: me.pos[a], k: "cap sm", t: "Position de votre capitale" } : null, showR ? { v: R[a], k: "txt", t: "Texte actuel" } : null];
    const tag = mine ? (d.w[a] >= 0.8 ? "priorité majeure" : d.w[a] >= 0.55 ? "point important" : "point secondaire") : (known ? "" : "position inconnue");
    const say = mine ? `Votre capitale penche ${H(leanWord(d.pos[a], a))}${showR ? ` ; le texte, ${H(leanWord(R[a], a))}` : ""}.` : known ? `Penche ${H(leanWord(d.pos[a], a))}.` : "";
    return leanRow(a, marks, { red: rl, tag, say });
  }).join("");
  const legend = opts.legend === false ? "" : `<p class="sim-legend"><span><i class="lg-cap"></i>${mine ? "position de votre capitale" : "votre capitale"}</span>${!mine && known ? `<span><i class="lg-del"></i>cette délégation</span>` : ""}${showR ? `<span><i class="lg-txt"></i>texte actuel</span>` : ""}${red && d.red.length ? `<span><i class="lg-red"></i>ligne rouge</span>` : ""}</p>`;
  return `<div class="sim-axes">${rows}${legend}</div>`;
}
function briefNote() {
  const S = G, br = briefing(S), b = bodyOf(S);
  const orient = S.phase === 2 ? `<h3>Choisissez votre ligne de négociation</h3><p class="sim-mute">Votre ligne combine les instructions de votre capitale et l'orientation choisie. Elle guide vos interventions et le premier projet de texte.</p>
    <div class="sim-orients">${br.orientations.map(o => `<button type="button" class="sim-orient" data-a="orient" data-x="${o.k}"><b>${H(o.name)}</b>${o.recommended ? `<span class="sim-tag gold">conseillée par votre capitale</span>` : ""}<span>${H(o.desc)}</span><span class="sim-fit"><span class="fit-bar"><i style="width:${Math.round(o.fit * 100)}%"></i></span>Compatibilité avec vos instructions : ${Math.round(o.fit * 100)} %</span></button>`).join("")}</div>`
    : `<p class="sim-mute">Ligne retenue : <b>${H(ORIENTATIONS[S.orientation].name)}</b>.</p>`;
  return `<section class="sim-card sim-brief">
    <div class="tg-head"><span>Télégramme diplomatique</span><span class="sim-conf">Confidentiel</span></div>
    <dl class="tg-meta"><div><dt>De</dt><dd>Votre capitale</dd></div><div><dt>À</dt><dd>Délégation ${H(deName(S.player))} auprès ${H(b.de)}</dd></div><div><dt>Objet</dt><dd>${H(issueOf(S).title)}</dd></div></dl>
    <h2>${H(br.title)}</h2><p>${H(br.lead)}</p>
    <h3>Intérêts nationaux</h3><ul class="sim-ul">${br.interests.map(x => `<li>${H(capFirst(x))}</li>`).join("")}</ul>
    <h3>Où penche votre capitale</h3><p class="sim-mute">Sur chaque point clé, le curseur montre la position que votre capitale vous demande de défendre.</p>
    ${axisBars(S, S.player)}
    <ul class="sim-ul sim-axnotes">${br.axes.map(a => `<li><b>${H(a.name)}</b> : ${H(a.text)}</li>`).join("")}</ul>
    ${br.red.length ? `<h3>Lignes rouges</h3><ul class="sim-ul sim-redlist">${br.red.map(r => `<li>${H(r.text)}</li>`).join("")}</ul>` : ""}
    ${br.domestic ? `<h3>Contrainte intérieure</h3><p>${H(br.domestic)}</p>` : ""}
    <div class="sim-cols"><div><h3>Partenaires probables</h3><div class="sim-plqs">${br.allies.map(c => plq(c)).join("")}</div></div><div><h3>Positions éloignées</h3><div class="sim-plqs">${br.rivals.map(c => plq(c)).join("")}</div></div></div>
    <h3>Objectifs de la délégation</h3><ul class="sim-ul">${br.objectives.map(o => `<li>${H(o.text)}</li>`).join("")}</ul>
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
    <div class="sim-verdict ${({ "Succès diplomatique": "ok", "Échec diplomatique": "ko" })[R.verdict.k] || "mid"}"><div><span class="sim-kick">Bilan de la séance</span><div class="sim-verdict-k">${H(R.verdict.k)}</div><p>${H(R.verdict.c)}</p><p class="sim-verdict-v">${t.yes} pour, ${t.no} contre, ${t.abs} abstention${t.abs > 1 ? "s" : ""} · ${t.adopted ? "texte adopté" : "texte non adopté"}${t.veto.length ? ` (vote négatif ${t.veto.map(deName).join(", ")})` : ""}</p></div><div class="sim-overall"><b>${R.overall}</b><span>sur 100</span></div></div>
    <div class="sim-grain"><div class="gr-fig">${scoreFlower(R)}</div><div><h2>Votre performance</h2><p class="sim-mute">Chaque pétale mesure l'un des six aspects de votre travail, sur 100 : plus il est long, meilleur est le score.</p>
      <ul class="sim-scorelist">${R.scores.map(s => `<li><div class="sl-h"><span>${H(s.k)}</span><b>${s.v}</b></div><span class="sl-bar"><i style="width:${s.v}%"></i></span><p>${H(s.c)}</p></li>`).join("")}</ul></div></div>
    ${trace ? `<h2>La salle, démarche après démarche</h2><p class="sim-mute">Chaque colonne montre les intentions de vote que vous connaissiez après une démarche : vous découvrez les positions, puis vous les faites bouger.</p>${trace}` : ""}
    <h2>Objectifs de votre capitale <span class="sim-count">${ok} sur ${R.objs.length}</span></h2><ul class="sim-objs final">${R.objs.map(o => `<li class="${o.ok ? "ok" : "no"}"><span class="sim-dot" aria-hidden="true"></span><span>${H(o.text)}<small>${o.ok ? "Atteint" : "Non atteint"} : ${H(o.note)}</small></span></li>`).join("")}</ul>
    <div class="sim-cols"><div><h2>Conséquences</h2><ul class="sim-ul">${R.consequences.map(c => `<li>${H(c)}</li>`).join("")}</ul></div>
    <div><h2>Concessions et accords</h2>${R.concessions.length ? `<ul class="sim-ul">${R.concessions.map(c => `<li>${H(cnm(c.by))} : ${H(c.label)}${c.deal ? ` <span class="sim-deal ${c.deal}">${c.deal === "broken" ? "promesse rompue" : c.deal === "honored" ? "tenu" : "en cours"}</span>` : ""}</li>`).join("")}</ul>` : `<p class="sim-mute">Aucune concession ni aucun accord.</p>`}
    ${R.coalitions.length ? `<h3>Coalitions</h3><ul class="sim-ul">${R.coalitions.map(c => `<li>${H(c)}</li>`).join("")}</ul>` : ""}</div></div>
    <h2>Le vote sur la carte</h2><figure class="sim-mapbox">${dotMap(S, "vote")}${mapLegend(S, "vote")}</figure>
    <h2>Relations</h2><div class="sim-cols"><div><h3>En progrès</h3>${up.length ? up.map(relRow).join("") : `<p class="sim-mute">Aucune évolution notable.</p>`}</div><div><h3>En recul</h3>${down.length ? down.map(relRow).join("") : `<p class="sim-mute">Aucune dégradation notable.</p>`}</div></div>
    <div class="sim-cta">${btn("Nouvelle simulation", "new", { cls: "primary" })}${btn("Rejouer ce scénario", "replayCur", { cls: "ghost" })}${btn("Revoir la chronologie", "tab", { cls: "ghost", x: "log" })}</div>
  </section>`;
}

/* ---------- Salle de conférence ---------- */
const chairTitle = S => S.scen.chairF ? bodyOf(S).chairTitle.replace(/^Président/, "Présidente") : bodyOf(S).chairTitle;
const KIND_LABEL = { debate: "Intervention", reply: "Réponse", support: "Appui", contest: "Objection", question: "Question" };
function speechHTML(S, sp, i) {
  if (sp.chair) return `<div class="sim-chair"><span>${H(chairTitle(S))}</span>${sp.paras.map(p => `<p>${H(p)}</p>`).join("")}</div>`;
  const can = S.phase === 3 && !sp.mine && sp.kind === "debate" && (S.reactions || 0) < MAX_REACTIONS && !(S.reacted || {})[sp.code];
  return `<article class="sim-sp ${sp.mine ? "mine" : ""} k-${sp.kind}" id="sim-sp-${i}"><div class="sim-sp-h">${plq(sp.code)}<span class="sim-sp-m">${H(KIND_LABEL[sp.kind] || "")}${sp.t ? ` <time>${H(sp.t)}</time>` : ""}${sp.ai ? " · formulée par l'IA" : ""}</span></div>
    ${sp.pending ? `<p class="sim-wait">La délégation prend la parole…</p>` : sp.paras.map(p => `<p>${H(p)}</p>`).join("")}
    ${sp.mine && sp.notes && sp.notes.length ? `<p class="sim-notes">Perception de votre intervention : ${H(sp.notes.join(", "))}.</p>` : ""}
    ${can ? `<div class="sim-react">${btn("Appuyer", "react", { cls: "ghost sm", x: sp.code, y: "support" })}${btn("Contester", "react", { cls: "ghost sm", x: sp.code, y: "contest" })}${btn("Demander une précision", "react", { cls: "ghost sm", x: sp.code, y: "clarify" })}</div>` : ""}</article>`;
}
function tRoom() {
  const S = G;
  const cam = camera(S) + roomLegend(S);
  if (S.phase <= 2) {
    return `<section class="sim-card sim-roomcard"><h2>Ouverture de la séance</h2>${cam}<div class="sim-chair big"><span>${H(chairTitle(S))}</span>${chairOpening(S).map(p => `<p>${H(p)}</p>`).join("")}</div>
    ${S.phase === 1 ? `<div class="sim-cta">${btn("Recevoir les instructions de ma capitale", "brief", { cls: "primary" })}</div>` : `<div class="sim-cta">${btn("Lire mes instructions", "tab", { cls: "primary", x: "board" })}</div>`}</section>`;
  }
  const speakers = `<div class="sim-queue"><span class="sim-kick">Liste des orateurs</span><ol class="sim-speakers" aria-label="Liste des orateurs">${S.order.map((c, i) => `<li class="${i < S.debateIdx ? "done" : i === S.debateIdx && S.phase === 3 ? "cur" : ""}${c === S.player ? " me" : ""}"><span>${i + 1}</span>${H(cnm(c))}</li>`).join("")}</ol></div>`;
  const feed = `<div class="sim-feed">${S.speeches.map((sp, i) => speechHTML(S, sp, i)).join("")}</div>`;
  let ctrl = "";
  if (S.phase === 3) {
    if (isMyTurn(S)) ctrl = myTurn();
    else if (debateOver(S)) ctrl = `<div class="sim-cta">${btn("Clore le débat et ouvrir les négociations", "endDebate", { cls: "primary" })}</div>`;
    else ctrl = `<div class="sim-cta">${btn(UI.busy ? "La délégation s'exprime…" : "Orateur suivant", "next", { cls: "primary", dis: !!UI.busy })}${!S.playerSpoke ? btn("Aller jusqu'à mon tour", "toMe", { cls: "ghost", dis: !!UI.busy }) : btn("Entendre les dernières délégations", "toEnd", { cls: "ghost", dis: !!UI.busy })}</div>
      <p class="sim-mute">Réactions possibles : ${MAX_REACTIONS - (S.reactions || 0)} sur ${MAX_REACTIONS}. Appuyer une délégation améliore vos relations ; la contester marque votre différence.</p>`;
  }
  return `<section class="sim-card sim-roomcard"><h2>${S.phase === 3 ? "Débat général" : "Compte rendu des débats"}</h2>${cam}${speakers}${feed}${ctrl}</section>`;
}
function myTurn() {
  const S = G, opts = playerOptions(S);
  const mode = UI.speakMode;
  const seg = `<div class="sim-seg" role="group" aria-label="Mode d'intervention">${btn("Interventions préparées", "speakMode", { x: "opts", cls: mode === "opts" ? "on" : "", pressed: mode === "opts" })}${btn("Rédiger mon intervention", "speakMode", { x: "free", cls: mode === "free" ? "on" : "", pressed: mode === "free" })}</div>`;
  let body;
  if (mode === "opts") body = `<div class="sim-opts">${opts.map(o => `<div class="sim-opt"><h3>${H(o.name)}</h3><p class="sim-mute">${H(o.hint)}</p><div class="sim-opt-t">${o.paras.map(p => `<p>${H(p)}</p>`).join("")}</div>${btn("Prononcer cette intervention", "speakOpt", { cls: "primary sm", x: o.id, dis: !!UI.busy })}</div>`).join("")}</div>`;
  else body = `<label class="sim-lbl" for="sim-speech">Votre intervention (trois minutes environ, soit 80 à 200 mots)</label>
    <textarea id="sim-speech" rows="9" data-k="speech" data-live="speech" placeholder="${H(S.chairName)}, ma délégation…">${H(UI.drafts.speech || "")}</textarea>
    <div id="sim-live-speech" aria-live="polite">${liveSpeech()}</div>
    <div class="sim-cta">${btn(UI.busy ? "Analyse en cours…" : "Prononcer mon intervention", "speakFree", { cls: "primary", dis: !!UI.busy || !(UI.drafts.speech || "").trim() })}</div>`;
  return `<section class="sim-myturn"><span class="sim-kick">La présidence vous donne la parole</span><h3>À vous de parler</h3>${seg}${body}</section>`;
}
function liveSpeech() {
  const S = G, txt = UI.drafts.speech || "";
  if (!txt.trim()) return `<p class="sim-mute">Exposez vos priorités, appuyez-vous sur les données, proposez des solutions et restez courtois : la qualité de l'intervention et la position qu'elle exprime auront un effet sur les autres délégations.</p>`;
  const a = analyzeSpeech(S, txt);
  const st = Object.keys(a.stance);
  return `<div class="sim-analysis"><div><b>Position perçue</b> ${st.length ? st.map(ax => `<span class="sim-chip sm">${H(AXES[ax].name)} : ${H(a.stance[ax] > 0 ? AXES[ax].pos : AXES[ax].neg)}</span>`).join("") : `<span class="sim-mute">aucune position claire pour l'instant</span>`}</div>
    <div><b>Qualité estimée</b> <span class="sim-q"><i style="width:${Math.round(a.quality * 100)}%"></i></span> ${Math.round(a.quality * 100)}/100${a.notes.length ? ` · ${H(a.notes.join(", "))}` : ""}</div>
    <div class="sim-mute">${a.words} mots${AI.usable(S) ? " · l'analyse finale sera faite par l'IA" : ""}</div></div>`;
}

/* ---------- Espace diplomatique ---------- */
function tDiplo() {
  const S = G;
  if (S.phase < 4) return `<section class="sim-card"><h2>Espace diplomatique</h2><p>Les consultations informelles s'ouvriront à la clôture du débat général. Vous pourrez alors sonder les délégations, proposer des accords et réunir des groupes.</p>${S.phase === 3 ? `<h3>Carte des positions</h3>${positionBlock(S)}` : ""}${delegList(false)}</section>`;
  const live = S.phase === 4 || S.phase === 5;
  const inbox = S.inbox.filter(m => m.status === "pending");
  const groups = groupsPresent(S);
  return `<section class="sim-card"><h2>Espace diplomatique</h2>
    ${live && timeLeft(S) < 5 ? `<p class="sim-warn soft">Le temps ${S.phase === 4 ? "de négociation" : "d'examen"} est écoulé. ${S.phase === 4 ? "Passez à l'examen du texte." : "Vous pouvez encore modifier le texte, puis le mettre aux voix."}</p>` : ""}
    ${live ? `<div class="sim-diptop"><p>Chaque démarche consomme du temps : il vous reste <b>${timeLeft(S)} min</b>.</p>${btn("Consultations ouvertes · 30 min", "consult", { cls: "ghost", dis: !canAct(S, "consult"), title: "Toutes les délégations exposent leur position ; certaines proposent des amendements." })}</div>` : ""}
    ${inbox.length && live ? `<div class="sim-inbox"><h3>Propositions reçues</h3>${inbox.map(m => `<div class="sim-offer">${plq(m.from)}<p>Elle votera pour le texte si vous acceptez ${H(de(lcFirst(m.offer.label)))}.</p><div class="sim-row">${btn("Accepter", "inbox", { cls: "primary sm", x: m.id, y: "1" })}${btn("Décliner", "inbox", { cls: "ghost sm", x: m.id, y: "0" })}</div></div>`).join("")}</div>` : ""}
    <div class="sim-dipgrid"><div>${delegList(true)}</div><div class="sim-detail">${UI.sel && S.dels[UI.sel] && UI.sel !== S.player ? delegDetail(UI.sel, live) : `<p class="sim-mute">Sélectionnez une délégation pour voir ce que vous savez d'elle et engager une démarche.</p>`}</div></div>
    <h3>Carte des positions</h3><p class="sim-mute">Chaque délégation est placée selon ses positions connues sur deux points clés. Les délégations proches de votre ligne sont vos partenaires naturels ; cliquez sur un point pour ouvrir la fiche.</p>${positionBlock(S)}
    <h3>Carte du monde</h3>${mapBlock(S, ["vote", "rel", "group"], UI.mapMode && UI.mapMode !== "group" ? UI.mapMode : "vote")}
    ${groups.length ? `<h3>Groupes représentés</h3><div class="sim-groups">${groups.map(g => `<div class="sim-group"><b>${H(g.name)}</b><div class="sim-plqs">${g.members.map(c => plq(c, "sm")).join("")}</div>${live ? btn("Réunir le groupe · 25 min", "group", { cls: "ghost sm", x: g.id, dis: !canAct(S, "group") }) : ""}</div>`).join("")}</div>` : ""}
    ${S.deals.length ? `<h3>Accords conclus</h3><ul class="sim-ul">${S.deals.map(d => `<li>${H(cnm(d.with))}${d.group ? " (" + H(d.group) + ")" : ""} : ${H(ASKS[d.ask] ? ASKS[d.ask].they : "")} ; vous acceptez ${H(de(lcFirst(d.label)))}. <span class="sim-deal ${d.status}">${({ active: "en cours", broken: "rompu", honored: "tenu" })[d.status] || ""}</span></li>`).join("")}</ul>` : ""}
  </section>`;
}
function delegList(full) {
  const S = G, proj = full ? projection(S) : null;
  const others = sortFr(S.scen.members.filter(c => c !== S.player));
  return `<div class="sim-dels">${others.map(c => {
    const d = S.dels[c], [rl] = relLabel(d.rel), v = proj && d.known.pos ? proj.votes[c] : null;
    return `<button type="button" class="sim-delrow${UI.sel === c ? " on" : ""}" data-a="sel" data-x="${c}" aria-pressed="${UI.sel === c}">${plq(c, "sm")}<span class="sim-rel" title="Relation : ${H(rl.toLowerCase())}">${relMeter(d.rel)}<span class="sr">Relation : ${H(rl.toLowerCase())}</span></span>${full ? `<span class="sim-vchip v-${v || "unk"}">${v ? voteWord(v) : "?"}</span>` : ""}${d.cosponsor ? `<span class="sim-tag">coauteur</span>` : ""}</button>`;
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
    panel = `<div class="sim-panel"><h4>Quel argument présenter ?</h4><div class="sim-args">${Object.entries(ARGS).map(([k, A]) => `<button type="button" class="sim-arg${UI.arg.key === k ? " on" : ""}" data-a="argKey" data-x="${k}" aria-pressed="${UI.arg.key === k}"><b>${H(A.name)}</b><span>${H(A.desc)}</span></button>`).join("")}</div>
      <label class="sim-lbl" for="sim-argax">Sur quel point ?</label><select id="sim-argax" data-a="argAxis">${issueOf(S).axes.map(a => `<option value="${a}"${a === ax ? " selected" : ""}>${H(AXES[a].name)}</option>`).join("")}</select>
      <div class="sim-row">${btn("Présenter l'argument · 15 min", "persuade", { cls: "primary sm", dis: !UI.arg.key || !canAct(S, "persuade") })}${btn("Annuler", "panel", { cls: "ghost sm", x: "" })}</div></div>`;
  } else if (live && UI.panel === "deal") {
    const offers = dealOffers(S, code), oi = Math.min(UI.deal.offer, offers.length - 1);
    panel = `<div class="sim-panel"><h4>Ce que vous demandez</h4><div class="sim-chips">${Object.entries(ASKS).map(([k, A]) => `<button type="button" class="sim-chip${UI.deal.ask === k ? " on" : ""}" data-a="dealAsk" data-x="${k}" aria-pressed="${UI.deal.ask === k}">${H(A.name)}</button>`).join("")}</div>
      <h4>Ce que vous offrez</h4><div class="sim-offers">${offers.map((o, i) => `<button type="button" class="sim-arg${i === oi ? " on" : ""}" data-a="dealOffer" data-x="${i}" aria-pressed="${i === oi}"><span>${H(o.label)}</span></button>`).join("")}</div>
      <p class="sim-mute">Une promesse non tenue rompt l'accord et dégrade vos relations avec la délégation et ses partenaires.</p>
      <div class="sim-row">${btn("Proposer l'accord · 20 min", "deal", { cls: "primary sm", dis: !canAct(S, "deal") || !offers.length })}${btn("Annuler", "panel", { cls: "ghost sm", x: "" })}</div></div>`;
  }
  const [rl] = relLabel(d.rel);
  return `<div class="sim-dhead">${plq(code)}<span class="sim-mute">${H(groupName(code))}${blocs.length ? " · " + H(blocs.join(", ")) : ""}</span></div>
    <div class="sim-kv"><div><span class="kv-k">Relation</span><span class="kv-v">${relMeter(d.rel)} ${H(rl)} (${d.rel > 0 ? "+" : ""}${d.rel})</span></div><div><span class="kv-k">Influence</span><span class="kv-v">${H(inflLabel(c.infl))}</span></div><div><span class="kv-k">Vote estimé</span><span class="kv-v"><span class="sim-vchip v-${vi ? vi.v : "unk"}">${vi ? voteWord(vi.v) : "inconnu"}</span></span></div><div class="kv-w"><span class="kv-k">Attitude</span><span class="kv-v">${d.known.pet ? H(PERSONALITIES[d.pers].name) + " : " + H(PERSONALITIES[d.pers].desc) : "à découvrir en la sondant"}</span></div></div>
    ${axisBars(S, code)}
    ${pet ? `<p class="sim-pet">Souhaite voir figurer dans le texte : « ${H(capFirst(clauseText(S, instClausePreview(S, pet))))} ».</p>` : ""}
    ${talks.length ? `<div class="sim-talk">${talks.slice(-8).map(t => `<div class="sim-msg ${t.who}"><span>${t.who === "me" ? "Votre délégation" : H(cnm(code))} · ${H(t.t)}</span><p>${H(t.text)}</p></div>`).join("")}</div>` : ""}
    ${live ? `<div class="sim-acts">${btn(d.known.pet ? "Déjà sondée" : "Sonder · 10 min", "probe", { cls: "ghost sm", dis: d.known.pet || !canAct(S, "probe"), title: "Connaître ses priorités, ses lignes rouges et son vote probable" })}${btn("Convaincre · 15 min", "panel", { cls: "ghost sm" + (UI.panel === "persuade" ? " on" : ""), x: "persuade", dis: !canAct(S, "persuade") })}${btn("Proposer un accord · 20 min", "panel", { cls: "ghost sm" + (UI.panel === "deal" ? " on" : ""), x: "deal", dis: !canAct(S, "deal") })}${btn("Demander le coparrainage · 5 min", "cosponsor", { cls: "ghost sm", dis: d.cosponsor || !canAct(S, "cosponsor") })}</div>${panel}` : ""}`;
}

/* ---------- Salle de rédaction ---------- */
function splitVerb(S, c) {
  const t = capFirst(clauseText(S, c)).replace(/[;.]\s*$/, "");
  const v = c.form === "raw" ? t.split(" ")[0] : (t.startsWith(c.v) ? c.v : t.split(" ")[0]);
  return [v, t.slice(v.length)];
}
function effectsText(S, fx) {
  const issue = issueOf(S), parts = [];
  for (const a of issue.axes) { const v = fx[a] || 0; if (Math.abs(v) >= 0.1) parts.push(v > 0 ? AXES[a].pos : AXES[a].neg); }
  return parts.length ? "Oriente le texte vers : " + parts.join(", ") : "Effet limité sur les points clés";
}
function tDraft() {
  const S = G, b = bodyOf(S);
  if (S.phase < 4) return `<section class="sim-card"><h2>Salle de rédaction</h2><p>Le projet de texte de votre délégation circulera à l'ouverture des négociations. Vous pourrez alors modifier chaque paragraphe, en ajouter et traiter les amendements des autres délégations.</p></section>`;
  const edit = S.phase === 4 || S.phase === 5;
  const ops = S.draft.ops, last = ops.length - 1;
  const authors = [S.player].concat(S.draft.cosponsors);
  const doc = `<div class="sim-doc${S.phase === 7 ? (S.vote.t.adopted ? " adopted" : " rejected") : ""}">
    ${S.phase === 7 ? `<div class="sim-stamp">${S.vote.t.adopted ? "Adopté" : "Non adopté"}</div>` : ""}
    <div class="sim-doc-h"><div class="sim-doc-org">${H(b.org === "ONU" ? "Nations Unies" : "Organisation des Nations Unies pour l'éducation, la science et la culture")}</div><div class="sim-doc-b">${H(b.name.replace(" (session pédagogique)", ""))}${S.scen.pc ? " · " + H(b.commissions[S.scen.pc]) : ""}</div>
    <div class="sim-doc-t">${H(b.doc || "Projet de " + b.act)}</div><div class="sim-doc-a">${authors.map(c => H(cnm(c))).join(", ")} : projet de ${H(b.act)}</div></div>
    <h3 class="sim-doc-title">${H(S.draft.title)}</h3>
    <p class="sim-doc-head"><i>${H(b.head)}</i>,</p>
    ${S.draft.pre.map(p => { const w = p.txt.split(" "); const k = /^(Préoccupée?|Gravement|Profondément|Conscient|Consciente|Prenant|Ayant)$/.test(w[0]) && w[1] && /^(par|de|note|à)$/.test(w[1]) ? 2 : 1; return `<p class="sim-pre"><i>${H(w.slice(0, k).join(" "))}</i> ${H(w.slice(k).join(" "))},</p>`; }).join("")}
    <ol class="sim-ops">${ops.map((c, i) => opItem(S, c, i, i === last, edit)).join("")}</ol>
  </div>`;
  const tools = edit ? draftTools() : "";
  return `<section class="sim-card sim-draftcard"><h2>Salle de rédaction</h2>${edit ? `<p class="sim-mute">Le texte vous appartient : modifiez le verbe d'un paragraphe pour en changer la portée, déplacez-le, retirez-le ou ajoutez-en. Sous chaque paragraphe, la barre montre les réactions des délégations dont vous connaissez la position.</p>` : ""}${doc}${tools}</section>`;
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
    const chip = (cls, list, label) => list.length ? `<span class="${cls}" title="${H(list.map(cnm).join(", "))}">${label} : ${list.length}</span>` : "";
    react = `<div class="sim-op-r"><span class="rb">${seg("r-sup", sup.length)}${seg("r-mod", mod.length)}${seg("r-neu", neu.length)}${seg("r-unk", unk)}${seg("r-opp", opp.length)}</span><span class="rt">${chip("r-sup", sup, "soutien")}${chip("r-mod", mod, "demandes de modification")}${chip("r-opp", opp, "opposition")}${chip("r-neu", neu, "abstention")}${unk ? `<span class="r-unk">${unk} position${unk > 1 ? "s" : ""} inconnue${unk > 1 ? "s" : ""}</span>` : ""}</span></div>`;
  }
  const verbs = verbsForClause(S, c);
  const tools = edit && c.form !== "raw" ? `<div class="sim-op-t">${verbs.length > 1 ? `<label class="sr" for="sim-v-${c.uid}">Verbe du paragraphe ${i + 1}</label><select id="sim-v-${c.uid}" data-a="verb" data-x="${c.uid}">${verbs.map(x => `<option${x === c.v ? " selected" : ""}>${H(x)}</option>`).join("")}</select>` : ""}${btn("Monter", "move", { cls: "ghost xs", x: c.uid, y: "-1", dis: i === 0 })}${btn("Descendre", "move", { cls: "ghost xs", x: c.uid, y: "1", dis: isLast || (S.draft.ops[i + 1] && S.draft.ops[i + 1].form === "raw") })}${btn("Retirer", "remove", { cls: "ghost xs danger", x: c.uid })}</div>` : "";
  return `<li class="sim-op${chk.ok ? "" : " bad"}"><p><i>${H(v)}</i>${H(rest)}${isLast ? "." : " ;"}</p>
    ${!chk.ok ? `<p class="sim-warn">Irrecevable : ${H(chk.why)} La présidence ne retiendra pas ce paragraphe.</p>` : chk.warn ? `<p class="sim-warn soft">${H(chk.warn)}</p>` : ""}
    ${c.by && c.by !== S.player ? `<p class="sim-by">Proposé par la délégation ${H(deName(c.by))}</p>` : ""}${tools}${react}</li>`;
}
function draftTools() {
  const S = G, b = bodyOf(S);
  const pend = pendingAmendments(S), done = S.amendments.filter(a => a.status !== "pending");
  const has = id => S.draft.pre.some(p => p.id === id);
  const pre = `<div class="sim-tool"><h3>Préambule</h3><div class="sim-chips">${btn("Rappel de la souveraineté des États", "pre", { cls: "chip" + (has("sov") ? " on" : ""), x: "sov", pressed: has("sov") })}${btn("Appel à la coopération", "pre", { cls: "chip" + (has("coop") ? " on" : ""), x: "coop", pressed: has("coop") })}${b.id === "UNSC" ? btn("Agissant en vertu du Chapitre VII", "pre", { cls: "chip" + (has("ch7") ? " on" : ""), x: "ch7", pressed: has("ch7") }) : ""}</div></div>`;
  const amend = `<div class="sim-tool"><h3>Amendements${pend.length ? ` en attente (${pend.length})` : ""}</h3>${pend.length ? pend.map(a => { const kn = x => (x || []).filter(m => S.dels[m].known.pos).length; return `<div class="sim-amend">${plq(a.by, "sm")}<p>${H(capFirst(amendLabel(S, a)))}.${a.tag === "compromis" ? " Proposition de compromis." : ""}</p><p class="sim-mute">Soutiens connus : ${kn(a.sup)} · oppositions connues : ${kn(a.opp)}</p>${S.phase >= 4 && S.phase <= 5 ? `<div class="sim-row">${btn("Accepter · 5 min", "amend", { cls: "primary xs", x: a.id, y: "accept", dis: !canAct(S, "amend") })}${btn("Contre-proposer", "amend", { cls: "ghost xs", x: a.id, y: "counter", dis: !canAct(S, "amend") })}${btn("Rejeter", "amend", { cls: "ghost xs", x: a.id, y: "reject", dis: !canAct(S, "amend") })}</div>` : ""}</div>`; }).join("") : `<p class="sim-mute">Aucun amendement en attente.${S.phase === 4 ? " Les délégations en déposeront à l'examen du texte." : ""}</p>`}${done.length ? `<details class="sim-done"><summary>Amendements traités (${done.length})</summary><ul class="sim-ul">${done.map(a => `<li>${H(cnm(a.by))} : ${H(({ accepted: "accepté", rejected: "rejeté", countered: "compromis trouvé", lapsed: "devenu caduc", moot: "sans objet" })[a.status] || a.status)}</li>`).join("")}</ul></details>` : ""}</div>`;
  const bank = clauseBank(S).filter(t => t.id !== "g_stay" && !S.draft.ops.some(c => c.src === t.id));
  const add = UI.panel === "add" ? `<div class="sim-panel"><h4>Paragraphes disponibles</h4><ul class="sim-bank">${bank.map(t => { const c = instClausePreview(S, t); return `<li><p>${H(capFirst(clauseText(S, c)))}</p><p class="sim-mute">${H((KINDS[effKind(c)] || {}).name || "")} · ${H(effectsText(S, c.fx))}</p>${btn("Ajouter", "addClause", { cls: "ghost xs", x: t.id })}</li>`; }).join("")}</ul>${btn("Fermer", "panel", { cls: "ghost sm", x: "" })}</div>` : "";
  const free = UI.panel === "free" ? freeClausePanel() : "";
  const submit = S.phase === 5 ? (UI.confirmVote ? `<div class="sim-confirm"><p>${pend.length ? `${pend.length} amendement(s) en attente deviendront caducs, ce que leurs auteurs regretteront. ` : ""}Une fois le texte mis aux voix, il ne pourra plus être modifié.</p><div class="sim-row">${btn("Confirmer la mise aux voix", "submit", { cls: "primary" })}${btn("Continuer l'examen", "confirmVote", { cls: "ghost", x: "0" })}</div></div>` : `<div class="sim-cta">${btn("Mettre le texte aux voix", "confirmVote", { cls: "primary", x: "1" })}</div>`) : `<p class="sim-mute">Pendant les négociations, vous pouvez modifier librement le texte et traiter les amendements déjà déposés. Les autres délégations déposeront la plupart de leurs amendements à l'examen du texte.</p>`;
  return `<div class="sim-tools">${amend}${pre}<div class="sim-tool"><h3>Ajouter un paragraphe</h3><div class="sim-row">${btn("Choisir un paragraphe type", "panel", { cls: "ghost sm" + (UI.panel === "add" ? " on" : ""), x: UI.panel === "add" ? "" : "add" })}${btn("Rédiger un paragraphe", "panel", { cls: "ghost sm" + (UI.panel === "free" ? " on" : ""), x: UI.panel === "free" ? "" : "free" })}</div>${add}${free}</div>${submit}</div>`;
}
function freeClausePreview() {
  const S = G, v = UI.drafts.fverb || "Encourage", txt = UI.drafts.ftext || "";
  if (!txt.trim()) return `<p class="sim-mute">Choisissez le verbe, puis écrivez la suite du paragraphe. Le simulateur vérifie qu'il relève bien des compétences de l'organe.</p>`;
  const a = analyzeClause(S, v, txt), c = { uid: "preview", src: "free", k: a.k, form: "free", v, text: txt.trim().replace(/[.;]\s*$/, ""), fx: a.fx };
  const chk = checkClause(S, c);
  return `<div class="sim-analysis"><div><b>Aperçu</b> ${H(capFirst(clauseText(S, c)))}</div><div><b>Nature</b> ${H((KINDS[effKind(c)] || {}).name || "")}${chk.ok ? "" : ` · <span class="sim-bad">irrecevable : ${H(chk.why)}</span>`}</div><div><b>Effet estimé</b> ${H(effectsText(S, a.fx))}${AI.usable(S) ? " (affiné par l'IA à l'ajout)" : ""}</div></div>`;
}
function freeClausePanel() {
  const S = G, verbs = verbsFor(S.bodyId), v = UI.drafts.fverb || "Encourage", txt = UI.drafts.ftext || "";
  const prev = freeClausePreview();
  return `<div class="sim-panel"><h4>Rédiger un paragraphe du dispositif</h4><div class="sim-free"><label class="sr" for="sim-fverb">Verbe</label><select id="sim-fverb" data-a="fverb">${verbs.map(x => `<option${x === v ? " selected" : ""}>${H(x)}</option>`).join("")}</select>
    <label class="sr" for="sim-ftext">Suite du paragraphe</label><textarea id="sim-ftext" rows="3" data-k="ftext" data-live="clause" placeholder="les États à…">${H(txt)}</textarea></div>
    <div id="sim-live-clause">${prev}</div><div class="sim-row">${btn(UI.busy ? "Analyse…" : "Ajouter au texte", "addFree", { cls: "primary sm", dis: !!UI.busy || !txt.trim() })}${btn("Fermer", "panel", { cls: "ghost sm", x: "" })}</div></div>`;
}

/* ---------- Salle de vote ---------- */
function tVote() {
  const S = G, b = bodyOf(S);
  if (S.phase < 6) return `<section class="sim-card"><h2>Salle de vote</h2><p>Le vote aura lieu lorsque vous mettrez le texte aux voix, à l'issue de son examen.</p><p><b>Règle applicable en l'état :</b> ${H(needRule(S).label)}.</p>${S.phase >= 4 ? `<h3>Si l'on votait maintenant</h3>${voteDots(S)}` : ""}</section>`;
  if (!S.vote) {
    const me = S.dels[S.player], R = textVec(S), hard = hardBreach(me, R);
    return `<section class="sim-card"><h2>Salle de vote</h2><p class="sim-qlead">${H(chairLine(S, "vote"))}</p>
      ${hard ? `<p class="sim-warn">Attention : ce texte franchit l'une des lignes rouges fixées par votre capitale (${H(AXES[hard.axis].name.toLowerCase())}).</p>` : ""}
      <h3>Si l'on votait maintenant</h3>${voteDots(S)}
      ${ruleDiagram(S)}
      <h3>Vote de votre délégation</h3><div class="sim-votebtns">${btn("Pour", "vote", { cls: "v-yes", x: "yes" })}${btn("Contre", "vote", { cls: "v-no", x: "no" })}${btn("Abstention", "vote", { cls: "v-abs", x: "abs" })}</div></section>`;
  }
  const V = S.vote, t = V.t, anim = !V.shown && !reduceMotion();
  const n = V.rollOrder.length;
  const board = `<div class="sim-board${anim ? " anim" : ""}" style="--n:${n}">
    <div class="sim-board-h"><div class="sim-board-t">${H(b.name.replace(" (session pédagogique)", ""))} · vote enregistré</div>
      <div class="sim-tallies"><div class="t-yes"><b>${t.yes}</b><span>pour</span></div><div class="t-no"><b>${t.no}</b><span>contre</span></div><div class="t-abs"><b>${t.abs}</b><span>abstentions</span></div></div>
      <div class="sim-board-rule">${H(capFirst(t.rule.label))}</div></div>
    <ul class="sim-lights">${V.rollOrder.map((c, i) => `<li class="v-${V.votes[c]}${c === S.player ? " me" : ""}" style="--i:${i}"><i aria-hidden="true"></i><span>${H(cnm(c))}${S.bodyId === "UNSC" && P5.includes(c) ? "<sup>P</sup>" : ""}</span><em>${voteWord(V.votes[c])}${t.veto.includes(c) ? " (veto)" : ""}</em></li>`).join("")}</ul>
    <div class="sim-result ${t.adopted ? "ok" : "ko"}">${t.adopted ? "Adopté" : "Non adopté"}</div></div>`;
  const checks = [];
  if (t.rule.type === "unsc") {
    checks.push([t.yes >= 9, `Voix pour : ${t.yes} sur les 9 requises`]);
    checks.push([!t.veto.length, t.veto.length ? `Vote contre d'un membre permanent : ${t.veto.map(cnm).join(", ")}` : "Aucun vote contre d'un membre permanent"]);
  } else if (t.rule.type === "23") {
    checks.push([t.yes + t.no > 0 && t.yes >= 2 * t.no, `Voix exprimées : ${t.yes + t.no} (les ${t.abs} abstentions ne comptent pas). Deux tiers requis : ${Math.ceil((t.yes + t.no) * 2 / 3)} voix pour au moins ; obtenues : ${t.yes}`]);
  } else {
    checks.push([t.yes > t.no, `Voix exprimées : ${t.yes + t.no} (les ${t.abs} abstentions ne comptent pas). Majorité : plus de voix pour (${t.yes}) que de voix contre (${t.no})`]);
  }
  const verify = `<div class="sim-verify"><h3>Vérification de la règle</h3><ul>${checks.map(([ok, txt]) => `<li class="${ok ? "ok" : "no"}"><span class="sim-dot" aria-hidden="true"></span>${H(txt)} : <b>${ok ? "condition remplie" : "condition non remplie"}</b></li>`).join("")}</ul><p class="sim-mute">Règle appliquée : ${H(t.rule.label)}. Le résultat est calculé par le simulateur, jamais par l'IA.</p></div>`;
  return `<section class="sim-card"><h2>Salle de vote</h2>${board}<p class="sim-announce">${H(V.announce)}</p>${verify}
    ${camera(S, { compact: true })}${roomLegend(S)}
    ${V.expl.length ? `<h3>Explications de vote</h3><div class="sim-expl">${V.expl.map(x => `<div class="sim-sp">${plq(x.code)}<p>${H(x.text)}</p></div>`).join("")}</div>` : ""}
    ${S.phase === 6 ? `<div class="sim-cta">${btn("Voir le bilan", "finish", { cls: "primary" })}</div>` : ""}</section>`;
}

/* ---------- Chronologie ---------- */
const CAT = { procedure: "Procédure", debate: "Débat", bilateral: "Entretien", coalition: "Groupe", ai: "Initiative", amend: "Texte", vote: "Vote" };
function tLog() {
  const S = G, by = {};
  for (const e of S.log) (by[e.phase] = by[e.phase] || []).push(e);
  return `<section class="sim-card"><h2>Chronologie de la séance</h2><p class="sim-mute">Tout ce qui s'est passé, minute par minute, à l'horloge de la séance.</p>${Object.keys(by).sort((a, b) => a - b).map(ph => `<div class="sim-logph"><h3><span class="s7-n">${ph}</span>${H(PHASES[ph - 1])}</h3><ol class="sim-log">${by[ph].map(e => `<li class="c-${e.cat}"><time>${H(e.t)}</time><span class="sim-logcat">${H(CAT[e.cat] || "")}</span><p>${H(e.text)}</p></li>`).join("")}</ol></div>`).join("")}</section>`;
}

/* ---------- Rendu ---------- */
function inner() {
  const c = ctx();
  const en = c.lang === "en" ? `<p class="sim-en">The diplomatic simulator is currently available in French only.</p>` : "";
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
  const genOpts = { seed: (Math.random() * 4294967295) >>> 0, avoid: recentIssues(bodyId).concat(extraAvoid || []), pc: pc || undefined, player };
  const gen = generateScenario(bodyId, genOpts);
  return { gen, genOpts };
}
function setupFromOpts(bodyId, genOpts) {
  const gen = generateScenario(bodyId, genOpts);
  UI.setup = { step: 3, bodyId, pc: gen.scen.pc, player: genOpts.player, gen, genOpts, q: "" };
  UI.screen = "setup"; UI.scrollTo = "top";
}
function mySpeechSel(S) { const i = S.speeches.map(s => !!(s.mine && s.kind === "debate")).lastIndexOf(true); return i >= 0 ? "#sim-sp-" + i : null; }
function goTab(k) { UI.tab = k; UI.panel = null; UI.confirmVote = false; }
function phaseChanged() { goTab(defaultTab(G.phase)); UI.scrollTo = "top"; }

async function act(a, x, y) {
  const S = G;
  switch (a) {
    /* --- accueil et préparation --- */
    case "home": UI.screen = "home"; UI.scrollTo = "top"; break;
    case "new":
      if (G && G.phase < 7) UI.flash = "Votre partie en cours sera remplacée lorsque vous ouvrirez une nouvelle séance.";
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
      if (x === S.player) { toast("Votre délégation : " + cnm(x) + "."); break; }
      if (S.phase === 3 || (S.phase <= 2 && UI.tab === "room")) {
        const i = S.speeches.map(sp => sp.code === x && sp.kind === "debate").lastIndexOf(true);
        if (i >= 0) { goTab("room"); UI.scrollTo = "#sim-sp-" + i; }
        else toast(`${cnm(x)} (${groupName(x)}) n'a pas encore pris la parole.`);
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
    case "endDebate": endDebate(S); UI.sel = null; phaseChanged(); UI.flash = "Votre avant-projet circule parmi les délégations. Consultez-le dans la salle de rédaction."; break;
    /* --- phases 4 et 5 : négociations --- */
    case "sel": UI.sel = x; UI.panel = null; UI.arg = { key: null, axis: null }; UI.deal = { ask: "vote", offer: 0 }; if (window.innerWidth < 900) UI.scrollTo = ".sim-detail"; break;
    case "panel": UI.panel = x || null; break;
    case "argKey": UI.arg.key = x; break;
    case "argAxis": UI.arg.axis = y; break;
    case "dealAsk": UI.deal.ask = x; break;
    case "dealOffer": UI.deal.offer = Number(x) || 0; break;
    case "probe": if (UI.sel) { const r = doProbe(S, UI.sel); if (!r.ok) toast("Il ne vous reste plus assez de temps pour cette démarche."); UI.scrollTo = ".sim-talk"; } break;
    case "persuade": if (UI.sel && UI.arg.key) { const r = doPersuade(S, UI.sel, UI.arg.key, UI.arg.axis || biggestGap(S, UI.sel)); if (r.reason === "time") toast("Il ne vous reste plus assez de temps pour cette démarche."); UI.panel = null; UI.scrollTo = ".sim-talk"; } break;
    case "deal": if (UI.sel) { const offers = dealOffers(S, UI.sel), o = offers[Math.min(UI.deal.offer, offers.length - 1)]; if (o) { const r = doDeal(S, UI.sel, UI.deal.ask, o); if (r.reason === "time") toast("Il ne vous reste plus assez de temps pour cette démarche."); } UI.panel = null; UI.scrollTo = ".sim-talk"; } break;
    case "cosponsor": if (UI.sel) { const r = doCosponsor(S, UI.sel); if (r.reason === "time") toast("Il ne vous reste plus assez de temps pour cette démarche."); UI.scrollTo = ".sim-talk"; } break;
    case "consult": { const r = doConsult(S); toast(r.ok ? "Consultations tenues : toutes les positions sont désormais connues." : "Il ne vous reste plus assez de temps pour des consultations ouvertes."); break; }
    case "group": { const r = doGroup(S, x, null); if (r.reason === "time") toast("Il ne vous reste plus assez de temps pour réunir ce groupe."); else toast(r.ok ? `Réunion fructueuse : ${r.won.length} délégation(s) soutiennent désormais votre texte.` : "Pas de majorité au sein du groupe pour soutenir votre texte."); break; }
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
    case "amend": { const r = doAmend(S, x, y); if (!r.ok) toast("Il ne vous reste plus assez de temps pour examiner cet amendement."); break; }
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
      if (r.notes.length) a.notes = r.notes.concat(a.rude ? ["ton jugé agressif"] : []);
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
  act(el.dataset.a, el.dataset.x, el.dataset.y).catch(err => { UI.busy = null; console.error("[simulateur]", err); toast("Une erreur est survenue. La partie a été sauvegardée."); rerender(); });
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
const shortName = c => SHORT[c] || cnm(c);
const hashCode = s => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
const f1 = n => Math.round(n * 10) / 10;

/* ---------- Personnages ---------- */
/* teintes moyennes : les silhouettes restent lisibles sur le fond sombre de la salle */
const SUITS = ["#5865b8", "#6a5cae", "#4a6fa8", "#5d6596", "#7462a8", "#4f7f99", "#6b6fa0"];
const HEADS = ["#eef0fa", "#e4e7f6", "#f3f4fb"];
function avatar(x, y, s, o = {}) {
  const h = hashCode(o.seed || "x"), suit = o.suit || SUITS[h % SUITS.length], head = HEADS[(h >> 3) % HEADS.length], hair = o.hair != null ? o.hair : (h >> 6) % 4;
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
      <rect x="${cx - 70}" y="${cy + 10}" width="140" height="34" rx="6" class="sim-desk"/><text x="${cx}" y="${cy + 31}" class="sim-room-note">Secrétariat</text>`;
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
    decor += `<rect x="${cx - 30}" y="${cy - 6}" width="60" height="26" rx="5" class="sim-desk rostrum"/><text x="${cx}" y="${cy + 11}" class="sim-room-note">Tribune</text><rect x="${cx - 130}" y="${cy + 74}" width="260" height="30" rx="6" class="sim-desk"/>`;
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
    <rect x="330" y="${(y0 + y1) / 2 + 20}" width="140" height="34" rx="6" class="sim-desk"/><text x="400" y="${(y0 + y1) / 2 + 41}" class="sim-room-note">Secrétariat</text>`;
  return { W, H, seats, chair: { x: 400, y: y0 - 20, lx: 400, ly: y0 + 34 }, decor };
}
/* Placement des sièges : ordre alphabétique, comme dans la plupart des salles */
function roomSVG(S, opts = {}) {
  const b = bodyOf(S), kind = ROOM_KIND[b.id] || "hemicycle", mini = !!opts.mini, sc = mini ? 1.5 : 1.12;
  const members = sortFr(S.scen.members), L = roomLayout(kind, members.length);
  const lastSpeech = [...S.speeches].reverse().find(sp => sp.code && sp.kind === "debate");
  const speaking = S.phase === 3 && lastSpeech ? lastSpeech.code : null;
  const chairSpeaks = S.phase <= 2 || (S.phase === 3 && !lastSpeech) || S.phase === 5 || (S.phase === 6 && !S.vote);
  const votes = S.vote ? S.vote.votes : null;
  const est = opts.estimate && !votes ? projection(S).votes : null;
  const seats = members.map((code, i) => {
    const p = L.seats[i], me = code === S.player, d = S.dels[code];
    const v = votes ? votes[code] : est && (me || d.known.pos) ? est[code] : null;
    const name = H(shortName(code));
    const tw = Math.max(34, name.length * 5.4 + 10);
    const plate = mini ? "" : p.plate
      ? `<rect x="${f1(p.lx - tw / 2)}" y="${f1(p.ly - 7.5)}" width="${f1(tw)}" height="11" rx="1.5" class="sim-plate"/><text x="${f1(p.lx)}" y="${f1(p.ly + 0.7)}" class="sim-seat-l" text-anchor="middle">${name}</text>`
      : `<text x="${f1(p.lx)}" y="${f1(p.ly)}" class="sim-seat-l" text-anchor="${p.anchor}">${name}</text>`;
    const light = v ? `<circle cx="${f1(p.ax + 15 * sc)}" cy="${f1(p.ay - 18 * sc)}" r="${f1(6 * sc)}" class="sim-light v-${v}"/>` : "";
    const co = S.draft && S.draft.cosponsors.includes(code) ? `<circle cx="${f1(p.ax - 15 * sc)}" cy="${f1(p.ay - 18 * sc)}" r="${f1(4 * sc)}" class="sim-co"/>` : "";
    return `<g class="sim-seat${me ? " me" : ""}${code === speaking ? " speaking" : ""}${v ? " v-" + v : ""}" data-a="seat" data-x="${code}" tabindex="0" role="button" aria-label="${H(cnm(code))}${v ? " : " + voteWord(v) : ""}"><title>${H(cnm(code))}${v ? " · " + voteWord(v) : ""}${me ? " · votre délégation" : ""}</title>
      ${avatar(p.ax, p.ay, sc, { seed: code, ring: me || code === speaking, speak: code === speaking, cls: me ? "me" : "" })}${plate}${light}${co}${code === speaking ? bubble(p.ax + (p.anchor === "end" ? 28 : p.anchor === "start" ? -28 : 26) * sc, p.ay - 34 * sc) : ""}</g>`;
  }).join("");
  const C = L.chair;
  const chair = `<g class="sim-chairfig${chairSpeaks ? " speaking" : ""}"><title>${H(chairTitle(S))}</title>${avatar(C.x, C.y, mini ? 1.6 : 1.25, { seed: "chair-" + S.id, suit: "#8d95d8", ring: chairSpeaks, speak: chairSpeaks, hair: 1 })}${gavel(C.x + 24, C.y + 6)}${mini ? "" : `<text x="${f1(C.lx)}" y="${f1(C.ly)}" class="sim-seat-l chair" text-anchor="${C.anchor || "middle"}">Présidence</text>`}${chairSpeaks ? bubble(C.x + (C.bub || 1) * 34, C.y - 30) : ""}</g>`;
  const gid = uid("simfloor");
  return `<svg class="sim-room k-${kind}${mini ? " mini" : ""}" viewBox="0 0 ${L.W} ${L.H}" role="group" aria-label="${H("Salle " + b.de + " : " + members.length + " délégations")}">
    <defs><radialGradient id="${gid}" cx="50%" cy="${kind === "hemicycle" ? "78%" : "45%"}" r="70%"><stop offset="0" class="fl-a"/><stop offset="1" class="fl-b"/></radialGradient></defs>
    <rect x="6" y="6" width="${L.W - 12}" height="${L.H - 12}" rx="26" class="sim-floor" fill="url(#${gid})"/>${L.decor}${chair}${seats}</svg>`;
}
function roomLegend(S) {
  const parts = [`<span><i class="lg-me"></i>votre délégation</span>`];
  if (S.phase === 3) parts.push(`<span><i class="lg-speak"></i>à la parole</span>`);
  if (S.draft && S.draft.cosponsors.length) parts.push(`<span><i class="lg-co"></i>coauteur</span>`);
  if (S.vote) parts.push(`<span><i class="lg-v yes"></i>pour</span><span><i class="lg-v no"></i>contre</span><span><i class="lg-v abs"></i>abstention</span>`);
  return `<p class="sim-legend sim-camlegend">${parts.join("")}<span>Touchez ou cliquez un siège pour en savoir plus.</span></p>`;
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
  if (mode === "vote") return `<p class="sim-legend"><span><i class="lg-sq" style="background:#ebc000"></i>votre délégation</span>${Object.entries({ yes: "pour", no: "contre", abs: "abstention", unk: "position inconnue" }).map(([k, l]) => `<span><i class="lg-sq" style="background:${VOTE_COLORS[k]}"></i>${l}</span>`).join("")}</p>`;
  if (mode === "rel") return `<p class="sim-legend"><span><i class="lg-sq" style="background:#ebc000"></i>votre délégation</span>${[["r5", "excellente"], ["r4", "bonne"], ["r3", "neutre"], ["r2", "tendue"], ["r1", "difficile"]].map(([k, l]) => `<span><i class="lg-sq" style="background:${REL_COLORS[k]}"></i>${l}</span>`).join("")}</p>`;
  const key = bodyOf(S).org === "UNESCO" ? "unesco" : "un", names = key === "un" ? UN_GROUPS_SHORT : UNESCO_GROUPS;
  const present = [...new Set(S.scen.members.map(c => COUNTRIES[c][key]))];
  return `<p class="sim-legend"><span><i class="lg-sq" style="background:#ebc000"></i>votre délégation</span>${Object.keys(names).filter(g => present.includes(g)).map(g => `<span><i class="lg-sq" style="background:${GROUP_COLORS[g]}"></i>${H(key === "un" ? names[g] : names[g].replace(/^Groupe /, "Groupe "))}</span>`).join("")}</p>`;
}
function mapBlock(S, modes, cur) {
  const m = modes.includes(cur) ? cur : modes[0];
  const label = { group: "Groupes régionaux", vote: S.vote ? "Vote final" : "Vote estimé", rel: "Relations" };
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
  const meMark = `<g class="sim-pm-me"><circle cx="${f1(mx)}" cy="${f1(my)}" r="9"/><text x="${f1(mx)}" y="${f1(my - 13)}" text-anchor="middle" class="sim-pm-l b">Vous</text></g>`;
  const txt = R ? `<g class="sim-pm-txt"><rect x="${f1(X(R[ax]) - 6)}" y="${f1(Y(R[ay]) - 6)}" width="12" height="12" transform="rotate(45 ${f1(X(R[ax]))} ${f1(Y(R[ay]))})"/><text x="${f1(X(R[ax]))}" y="${f1(Y(R[ay]) + 22)}" text-anchor="middle" class="sim-pm-l b">Texte</text></g>` : "";
  return { svg: `<svg class="sim-pmap" viewBox="0 0 ${W} ${Hh}" role="group" aria-label="Carte des positions des délégations">${grid}${dots}${labels}${txt}${meMark}</svg>`, unknown };
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
    <p class="sim-legend"><span><i class="lg-me"></i>votre ligne</span>${S.phase >= 4 ? `<span><i class="lg-txt"></i>texte actuel</span>${Object.entries({ yes: "votera pour", no: "votera contre", abs: "s'abstiendra" }).map(([k, l]) => `<span><i class="lg-sq round" style="background:${VOTE_COLORS[k]}"></i>${l}</span>`).join("")}` : `<span>couleur : relation avec votre délégation</span>`}<span>taille : influence</span></p>
    ${unknown.length ? `<p class="sim-mute">Positions encore inconnues : ${unknown.map(c => H(cnm(c))).join(", ")}.</p>` : ""}</div>`;
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
    return `<div class="sim-rd"><div class="sim-rd-h"><b>9 voix pour sur 15</b><span>et aucun vote contre d'un membre permanent</span></div><div class="sim-rd-row">${cells}</div><div class="sim-rd-ticks"><span style="left:${(9 / 15) * 100}%">seuil : 9</span></div>
      <div class="sim-rd-p5s"><span class="sim-mute">Membres permanents :</span>${p5}</div><p class="sim-mute">Un seul vote contre d'un membre permanent bloque l'adoption (veto). Son abstention, elle, ne bloque pas.</p></div>`;
  }
  const yes = counts ? counts.yes : 0, no = counts ? counts.no : 0, vot = Math.max(1, yes + no);
  const th = rule.type === "23" ? 2 / 3 : 0.5;
  return `<div class="sim-rd"><div class="sim-rd-h"><b>${rule.type === "23" ? "Deux tiers des voix exprimées" : "Majorité des voix exprimées"}</b><span>${rule.type === "23" ? "au moins deux fois plus de voix pour que de voix contre" : "plus de voix pour que de voix contre"} ; les abstentions ne comptent pas</span></div>
    <div class="sim-rd-bar"><i class="yes" style="width:${counts ? (yes / vot) * 100 : 0}%"></i><i class="no" style="width:${counts ? (no / vot) * 100 : 0}%"></i><span class="sim-rd-th" style="left:${th * 100}%"></span></div>
    <div class="sim-rd-legend">${counts ? `<span class="yes">${yes} pour</span><span class="no">${no} contre</span><span>${counts.abs} abstention${counts.abs > 1 ? "s" : ""}${counts.unk ? ` · ${counts.unk} inconnue${counts.unk > 1 ? "s" : ""}` : ""}</span>` : `<span class="sim-mute">Le seuil se calcule sur les seules voix pour et contre.</span>`}</div></div>`;
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
const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;

/* ---------- Votes : connus, estimés ou inconnus ---------- */
function voteState(S) {
  if (S.vote) return { votes: Object.assign({}, S.vote.votes), final: true, rule: S.vote.t.rule };
  const p = projection(S), votes = {};
  for (const c of S.scen.members) votes[c] = c === S.player || S.dels[c].known.pos ? p.votes[c] : "unk";
  return { votes, final: false, rule: p.t.rule };
}
const VORDER = { yes: 0, abs: 1, unk: 2, no: 3 };
const VWORD = { yes: "pour", no: "contre", abs: "abstention", unk: "position inconnue" };
function voteDots(S, o = {}) {
  const vs = voteState(S), rule = vs.rule, n = S.scen.members.length, unsc = rule.type === "unsc";
  const list = S.scen.members.slice().sort((a, b) => VORDER[vs.votes[a]] - VORDER[vs.votes[b]] || (a === S.player ? -1 : b === S.player ? 1 : cnm(a).localeCompare(cnm(b), "fr")));
  const c = { yes: 0, no: 0, abs: 0, unk: 0 };
  for (const k of list) c[vs.votes[k]]++;
  const big = n > 24;
  const dots = list.map(code => `<i class="vd v-${vs.votes[code]}${code === S.player ? " me" : ""}${S.bodyId === "UNSC" && P5.includes(code) ? " p5" : ""}" title="${H(cnm(code))} : ${H(VWORD[vs.votes[code]])}"></i>`).join("");
  const th = unsc ? `<span class="vd-th" style="left:calc(${(9 / n) * 100}% - 1px)"><span>9 voix</span></span>` : "";
  let say;
  const vetoes = S.bodyId === "UNSC" ? P5.filter(p => vs.votes[p] === "no") : [];
  if (unsc) say = `<b>${c.yes} pour</b> sur ${n}. Il en faut 9, sans vote contre d'un membre permanent.${vetoes.length ? ` ${H(vetoes.map(cnm).join(" et "))} ${vetoes.length > 1 ? "voteraient" : "voterait"} contre : ce serait un veto.` : ""}`;
  else if (rule.type === "23") say = `<b>${c.yes} pour, ${c.no} contre.</b> Il faut au moins deux fois plus de voix pour que de voix contre ; les abstentions ne comptent pas.`;
  else say = `<b>${c.yes} pour, ${c.no} contre.</b> Il faut plus de voix pour que de voix contre ; les abstentions ne comptent pas.`;
  if (!vs.final && c.unk) say += ` ${plural(c.unk, "position reste inconnue", "positions restent inconnues")}.`;
  let status = "";
  if (!vs.final && o.status !== false) {
    const e = estimate(S);
    status = `<p class="vd-status ${e.status}">${e.status === "ok" ? "En l'état, le texte serait adopté." : e.status === "ko" ? "En l'état, le texte serait rejeté." : "Issue incertaine : tout dépend des positions inconnues."}</p>`;
  }
  const legend = o.legend === false ? "" : `<p class="vd-legend"><span><i class="vd v-yes"></i>pour</span><span><i class="vd v-abs"></i>abstention</span><span><i class="vd v-unk"></i>inconnue</span><span><i class="vd v-no"></i>contre</span><span><i class="vd me"></i>vous</span>${S.bodyId === "UNSC" ? `<span><i class="vd p5"></i>membre permanent</span>` : ""}</p>`;
  return `<div class="sim-vd${big ? " big" : ""}"><div class="vd-row" style="--n:${n}">${dots}${th}</div><p class="vd-say">${say}</p>${status}${legend}</div>`;
}

/* ---------- Curseurs : vers quel côté penche une position ---------- */
function leanWord(v, a) {
  const x = clamp(v, -1, 1), side = x > 0 ? AXES[a].pos : AXES[a].neg;
  return Math.abs(x) < 0.15 ? "à l'équilibre" : Math.abs(x) < 0.5 ? `un peu vers « ${side} »` : `nettement vers « ${side} »`;
}
/* marks : [{ v, k: "cap" | "del" | "txt" | "oth", t: libellé }] ; red : { thr, dir } */
function leanRow(a, marks, o = {}) {
  const A = AXES[a];
  const m = marks.filter(x => x && x.v != null).map(x => `<span class="ln-m ${x.k}" style="left:${pctOf(x.v).toFixed(1)}%" title="${H(x.t || "")}"></span>`).join("");
  const red = o.red ? `<span class="ln-red ${o.red.dir}" style="left:${pctOf(o.red.thr).toFixed(1)}%" title="Ligne rouge"></span>` : "";
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
  return `<svg class="sim-dmap" viewBox="0 0 ${MAP.w} ${MAP.h}" role="group" aria-label="Carte des délégations présentes">
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
  if (S.vote) return { who: chairTitle(S), role: "Résultat du vote", line: S.vote.announce, chair: true };
  if (S.phase <= 2 || !sp) { const op = chairOpening(S); return { who: chairTitle(S), role: "Ouverture de la séance", line: op[0], chair: true }; }
  if (S.phase === 4) return { who: chairTitle(S), role: "Suspension de séance", line: "La séance est suspendue pour des consultations informelles. Les délégations se retrouvent dans les couloirs.", chair: true };
  if (S.phase === 5) return { who: chairTitle(S), role: "Examen du projet", line: "La présidence invite les délégations à examiner le projet de texte paragraphe par paragraphe.", chair: true };
  if (S.phase === 6) return { who: chairTitle(S), role: "Mise aux voix", line: chairLine(S, "vote"), chair: true };
  if (sp.chair) return { who: chairTitle(S), role: "Présidence", line: sp.paras[0], chair: true };
  return { who: cnm(sp.code), role: `${KIND_LABEL[sp.kind] || "Intervention"}${sp.t ? " · " + sp.t : ""}`, line: sp.paras[0], me: sp.mine, code: sp.code };
}
function camera(S, o = {}) {
  const b = bodyOf(S), st = camState(S), live = S.phase < 7 && !S.vote;
  return `<figure class="sim-cam${o.compact ? " compact" : ""}">
    <div class="cam-top"><span class="cam-tag${live ? " rec" : ""}">${live ? "En direct" : "Rediffusion"}</span><span class="cam-tag dim">Caméra 1</span><span class="cam-where">${H(b.room || "Salle " + b.de)}</span><time class="cam-clock">${H(clockStr(S))}</time></div>
    <div class="cam-view sim-roombox">${roomSVG(S)}</div>
    <figcaption class="cam-sub"><span class="cam-name${st.me ? " me" : ""}">${H(st.who)}</span><span class="cam-role">${H(st.role)}</span><p>« ${H(firstSentence(st.line))} »</p></figcaption>
  </figure>`;
}

/* ---------- Fleur des scores du bilan ---------- */
const SCORE_SHORT = { "Qualité des interventions": "Interventions", "Capacité de négociation": "Négociation", "Construction de coalitions": "Coalitions", "Cohérence avec la position nationale": "Cohérence", "Capacité à obtenir des compromis": "Compromis", "Influence sur le résultat final": "Influence" };
function scoreFlower(R) {
  const sc = R.scores, n = sc.length, cx = 200, cy = 190, rMax = 122, rMin = 30;
  const petals = sc.map((s, i) => {
    const ang = -90 + i * 360 / n, L = rMin + (rMax - rMin) * clamp(s.v, 0, 100) / 100, w = Math.max(15, L * 0.27);
    return `<ellipse cx="0" cy="${f1(-L / 2)}" rx="${f1(w)}" ry="${f1(L / 2)}" transform="translate(${cx},${cy}) rotate(${f1(ang + 90)})" class="fl-p" style="opacity:${(0.45 + 0.55 * s.v / 100).toFixed(2)}"><title>${H(s.k)} : ${s.v} sur 100</title></ellipse>`;
  }).join("");
  const rings = [0.25, 0.5, 0.75, 1].map(f => `<circle cx="${cx}" cy="${cy}" r="${f1(rMin + (rMax - rMin) * f)}" class="fl-ring"/>`).join("");
  const labels = sc.map((s, i) => {
    const a = rad(-90 + i * 360 / n), r = rMax + 30, x = cx + r * Math.cos(a), y = cy + r * Math.sin(a), an = Math.abs(Math.cos(a)) < 0.3 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
    return `<text x="${f1(x)}" y="${f1(y - 2)}" text-anchor="${an}" class="fl-l">${H(SCORE_SHORT[s.k] || s.k.split(" ")[0])}</text><text x="${f1(x)}" y="${f1(y + 15)}" text-anchor="${an}" class="fl-v">${s.v}</text>`;
  }).join("");
  return `<svg class="sim-flower" viewBox="-70 0 540 390" role="img" aria-label="Vos six scores : ${H(sc.map(s => (SCORE_SHORT[s.k] || s.k) + " " + s.v).join(", "))}">${rings}${petals}<circle cx="${cx}" cy="${cy}" r="27" class="fl-c"/><text x="${cx}" y="${cy + 8}" text-anchor="middle" class="fl-o">${R.overall}</text>${labels}</svg>`;
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
  const th = thr.type === "unsc" ? `<line x1="${pl}" y1="${f1(Y(9))}" x2="${W - pr}" y2="${f1(Y(9))}" class="tr-th"/><text x="${W - pr - 2}" y="${f1(Y(9) - 5)}" text-anchor="end" class="tr-t b">seuil : 9 voix pour</text>` : "";
  const yAxis = [0, Math.round(N / 2), N].map(v => `<text x="${pl - 6}" y="${f1(Y(v) + 4)}" text-anchor="end" class="tr-t">${v}</text>`).join("");
  return `<figure class="sim-trace"><svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Composition de la salle au fil de la séance">${areas}${phaseMarks}${th}${yAxis}</svg>
    <figcaption class="vd-legend"><span><i class="vd v-yes"></i>pour</span><span><i class="vd v-abs"></i>abstention</span><span><i class="vd v-unk"></i>position inconnue</span><span><i class="vd v-no"></i>contre</span></figcaption></figure>`;
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
  if (n > 60) return `<div class="sim-seatn"><b>${n}</b><span>États membres</span></div>`;
  const p5 = b.id === "UNSC" || b.id === "TRUST";
  return `<div class="sim-seatd" style="--c:${n <= 15 ? n : Math.ceil(n / 2)}" aria-label="${n} membres">${Array.from({ length: n }, (_, i) => `<i${p5 && i < 5 ? ' class="p5"' : ""}></i>`).join("")}</div>`;
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
  if (seen) return `<div class="sim-pause min"><span class="ps-k">Étape ${S.phase} sur 7</span><b>${H(PHASES[i])}</b><button type="button" class="sim-btn link" data-a="pause" data-x="0">Revoir l'explication</button></div>`;
  return `<section class="sim-pause"><span class="ps-k">Étape ${S.phase} sur 7</span><h2>${H(PHASES[i])}</h2><p>${H(what)}</p><p class="ps-why"><b>Ce qui compte</b> ${H(why)}</p>${S.phase < 7 ? `<button type="button" class="sim-btn ghost sm" data-a="pause" data-x="1">J'ai compris</button>` : ""}</section>`;
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
  else if (o === "new") { if (G && G.phase < 7) UI.flash = "Votre partie en cours sera remplacée lorsque vous ouvrirez une nouvelle séance."; UI.screen = "setup"; UI.setup = { step: 1, bodyId: null, pc: null, player: null, gen: null, q: "" }; UI.scrollTo = "top"; }
  else if (o === "home") UI.screen = "home";
}
function checkAI() {
  const before = AI.status + AI.reason;
  AI.check(ctx()).then(() => { if (AI.status + AI.reason !== before) rerender(); }).catch(() => { /* mode démonstration */ });
}
window.SIM = {
  version: "1.1.0",
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
