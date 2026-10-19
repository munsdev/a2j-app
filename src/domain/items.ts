export interface Bilingual<T> {
  en: T;
  de: T;
}
/** [name, description] */
type NameDesc = readonly [string, string];
export interface AptGroup {
  id: "think" | "work" | "people" | "hands";
  en: string;
  de: string;
}
export interface Aptitude {
  id: string;
  g: AptGroup["id"];
  /** the ESCO transversal skill group the aptitude belongs to */
  esco: string;
  en: NameDesc;
  de: NameDesc;
  /** three statements, [en, de] each */
  items: readonly NameDesc[];
}
export type InterestId = "R" | "I" | "A" | "S" | "E" | "C";
export interface Interest {
  id: InterestId;
  en: NameDesc;
  de: NameDesc;
  items: readonly NameDesc[];
}
export interface SettingRow {
  id: "people" | "outdoors" | "physical" | "variety" | "hours" | "customers";
  /** [left end, right end] of the scale */
  en: NameDesc;
  de: NameDesc;
}
export interface RuledOut {
  id: string;
  g: "time" | "body" | "travel" | "work";
  en: string;
  de: string;
  /** wording for prompts, when it differs */
  p?: Bilingual<string>;
}
export interface WorkValue {
  id: string;
  en: NameDesc;
  de: NameDesc;
}
export interface AssessItem {
  id: string;
  /** aptitude or interest id */
  apt: string;
  en: string;
  de: string;
}

/* Self-assessment content: aptitudes, interests, work setting and values.
   All items are written for this tool. Plain language (Einfache Sprache in German),
   one concrete behaviour per item, no reverse-worded items.
   Aptitude groups follow the ESCO transversal skills hierarchy (CC BY 4.0).
   Interest types follow Holland's RIASEC model. The six values follow the
   O*NET work values (O*NET 30.2 database, CC BY 4.0), reworded. */

export const APT_GROUPS: readonly AptGroup[] = [
  { id: "think", en: "Thinking", de: "Denken" },
  { id: "work", en: "How you work", de: "Arbeitsweise" },
  { id: "people", en: "With people", de: "Mit Menschen" },
  { id: "hands", en: "Hands-on", de: "Praktisch" },
];

/* esco: the ESCO transversal skill group the aptitude belongs to */
export const APTITUDES: readonly Aptitude[] = [
  {
    id: "info",
    g: "think",
    esco: "processing information, ideas and concepts",
    en: [
      "Making sense of information",
      "Reading carefully, comparing options and spotting what does not add up.",
    ],
    de: ["Informationen auswerten", "Genau lesen, Angebote vergleichen und merken, wenn etwas nicht stimmt."],
    items: [
      [
        "I compare offers carefully before I decide.",
        "Ich vergleiche Angebote genau, bevor ich mich entscheide.",
      ],
      [
        "I read instructions or contracts all the way through.",
        "Ich lese Anleitungen oder Verträge bis zum Ende.",
      ],
      [
        "I notice when numbers or facts don't add up.",
        "Mir fällt auf, wenn Zahlen oder Angaben nicht stimmen.",
      ],
    ],
  },
  {
    id: "plan",
    g: "think",
    esco: "planning and organising",
    en: [
      "Planning and organizing",
      "Thinking ahead, putting things in order and keeping track of what comes next.",
    ],
    de: [
      "Planen und organisieren",
      "Vorausdenken, Dinge ordnen und den Überblick behalten, was als Nächstes kommt.",
    ],
    items: [
      ["I plan my week in advance.", "Ich plane meine Woche im Voraus."],
      ["I make a list before I start a bigger task.", "Vor einer größeren Aufgabe mache ich mir eine Liste."],
      [
        "Other people ask me to organize things, like a trip or a party.",
        "Andere bitten mich, etwas zu organisieren, zum Beispiel einen Ausflug oder ein Fest.",
      ],
    ],
  },
  {
    id: "solve",
    g: "think",
    esco: "dealing with problems",
    en: ["Solving problems", "Finding out why something goes wrong and working out a way to fix it."],
    de: ["Probleme lösen", "Herausfinden, warum etwas schiefgeht, und einen Weg finden, es zu beheben."],
    items: [
      [
        "When something doesn't work, I find out why.",
        "Wenn etwas nicht funktioniert, finde ich heraus, woran es liegt.",
      ],
      [
        "When my first try doesn't work, I try a different way.",
        "Wenn mein erster Versuch nicht klappt, probiere ich einen anderen Weg.",
      ],
      ["I break a big problem into small steps.", "Ich zerlege ein großes Problem in kleine Schritte."],
    ],
  },
  {
    id: "ideas",
    g: "think",
    esco: "thinking creatively and innovatively",
    en: ["Coming up with ideas", "Thinking of new ways to do things and making things of your own."],
    de: ["Neue Ideen", "Neue Wege finden, Dinge zu tun, und Eigenes gestalten."],
    items: [
      ["I think of new ways to get a task done.", "Mir fallen neue Wege ein, eine Aufgabe zu erledigen."],
      [
        "When a group is stuck, I come up with an idea.",
        "Wenn eine Gruppe nicht weiterkommt, habe ich eine Idee.",
      ],
      [
        "I make things of my own, like pictures, music, recipes or furniture.",
        "Ich gestalte eigene Dinge, zum Beispiel Bilder, Musik, Rezepte oder Möbel.",
      ],
    ],
  },
  {
    id: "care",
    g: "work",
    esco: "working efficiently",
    en: ["Care and accuracy", "Working carefully, keeping things in order and catching mistakes."],
    de: ["Sorgfalt", "Genau arbeiten, Ordnung halten und Fehler finden."],
    items: [
      ["I check my work before I hand it in.", "Ich kontrolliere meine Arbeit, bevor ich sie abgebe."],
      ["I keep my papers and things in order.", "Ich halte meine Unterlagen und Sachen in Ordnung."],
      ["I notice small mistakes that others miss.", "Mir fallen kleine Fehler auf, die andere übersehen."],
    ],
  },
  {
    id: "initiative",
    g: "work",
    esco: "taking a proactive approach",
    en: [
      "Working on your own initiative",
      "Starting without being asked and deciding for yourself how to get things done.",
    ],
    de: ["Selbstständig arbeiten", "Von sich aus anfangen und selbst entscheiden, wie man etwas erledigt."],
    items: [
      [
        "I start tasks without anyone reminding me.",
        "Ich fange mit einer Aufgabe an, ohne dass mich jemand erinnert.",
      ],
      [
        "When I see something that needs doing, I do it.",
        "Wenn ich sehe, dass etwas zu tun ist, mache ich es.",
      ],
      ["I decide for myself how to do a task.", "Ich entscheide selbst, wie ich eine Aufgabe erledige."],
    ],
  },
  {
    id: "calm",
    g: "work",
    esco: "maintaining a positive attitude",
    en: [
      "Staying calm under pressure",
      "Keeping a clear head when things get busy and getting back on track after a setback.",
    ],
    de: [
      "Ruhe unter Druck",
      "Einen klaren Kopf behalten, wenn es hektisch wird, und nach einem Rückschlag weitermachen.",
    ],
    items: [
      ["When things get hectic, I stay calm.", "Wenn es hektisch wird, bleibe ich ruhig."],
      ["I keep working well under time pressure.", "Unter Zeitdruck arbeite ich gut weiter."],
      [
        "After a setback, I get back on track quickly.",
        "Nach einem Rückschlag komme ich schnell wieder in Gang.",
      ],
    ],
  },
  {
    id: "persist",
    g: "work",
    esco: "working efficiently",
    en: ["Sticking with it", "Finishing what you start, even when it is boring or hard."],
    de: ["Dranbleiben", "Zu Ende bringen, was man anfängt, auch wenn es langweilig oder schwer ist."],
    items: [
      [
        "I finish tasks even when they are boring.",
        "Ich bringe Aufgaben zu Ende, auch wenn sie langweilig sind.",
      ],
      [
        "I keep going with something difficult until it works.",
        "Bei etwas Schwierigem mache ich weiter, bis es klappt.",
      ],
      ["I stick to a goal for months.", "Ich verfolge ein Ziel über Monate."],
    ],
  },
  {
    id: "learn",
    g: "work",
    esco: "demonstrating willingness to learn",
    en: ["Learning new things", "Teaching yourself, trying out new tools and asking until you understand."],
    de: [
      "Neues lernen",
      "Sich selbst etwas beibringen, Neues ausprobieren und nachfragen, bis man es versteht.",
    ],
    items: [
      [
        "I teach myself new things, for example with videos.",
        "Ich bringe mir selbst Neues bei, zum Beispiel mit Videos.",
      ],
      ["I try out new devices or programs.", "Ich probiere neue Geräte oder Programme aus."],
      [
        "I ask questions until I really understand something.",
        "Ich frage nach, bis ich etwas wirklich verstanden habe.",
      ],
    ],
  },
  {
    id: "explain",
    g: "people",
    esco: "communicating",
    en: ["Explaining", "Making things clear so other people can follow and do them."],
    de: ["Erklären", "Dinge so erklären, dass andere sie verstehen und umsetzen können."],
    items: [
      [
        "Others ask me when they don't understand something.",
        "Andere fragen mich, wenn sie etwas nicht verstehen.",
      ],
      ["I explain things so that others can follow.", "Ich erkläre Dinge so, dass andere sie verstehen."],
      ["I show new people how something works.", "Ich zeige neuen Leuten, wie etwas funktioniert."],
    ],
  },
  {
    id: "help",
    g: "people",
    esco: "supporting others",
    en: ["Helping and caring", "Noticing how others are doing and looking after people who need it."],
    de: [
      "Helfen und betreuen",
      "Merken, wie es anderen geht, und sich um Menschen kümmern, die Hilfe brauchen.",
    ],
    items: [
      ["I look after people who need help.", "Ich kümmere mich um Menschen, die Hilfe brauchen."],
      ["I notice when someone is not doing well.", "Ich merke, wenn es jemandem nicht gut geht."],
      [
        "I listen when someone tells me about their worries.",
        "Ich höre zu, wenn mir jemand von seinen Sorgen erzählt.",
      ],
    ],
  },
  {
    id: "team",
    g: "people",
    esco: "collaborating in teams and networks",
    en: ["Working in a team", "Agreeing things with others, helping out and finding solutions together."],
    de: ["Im Team arbeiten", "Sich mit anderen absprechen, mithelfen und gemeinsam Lösungen finden."],
    items: [
      [
        "I check with others before I change something.",
        "Ich spreche mich mit anderen ab, bevor ich etwas ändere.",
      ],
      ["I help others finish their part.", "Ich helfe anderen, ihren Teil fertig zu machen."],
      [
        "In a group, I look for a solution everyone can live with.",
        "In einer Gruppe suche ich eine Lösung, mit der alle leben können.",
      ],
    ],
  },
  {
    id: "lead",
    g: "people",
    esco: "leading others",
    en: ["Leading", "Taking charge, giving clear directions and making decisions."],
    de: ["Führen", "Die Leitung übernehmen, klare Ansagen machen und Entscheidungen treffen."],
    items: [
      ["In a group, I take the lead.", "In einer Gruppe übernehme ich die Leitung."],
      ["I tell others clearly what needs to be done.", "Ich sage anderen klar, was zu tun ist."],
      ["I make decisions when others hesitate.", "Ich treffe Entscheidungen, wenn andere zögern."],
    ],
  },
  {
    id: "meet",
    g: "people",
    esco: "communicating",
    en: [
      "Meeting new people",
      "Starting conversations easily and getting in touch with people you don't know.",
    ],
    de: [
      "Auf Menschen zugehen",
      "Leicht ins Gespräch kommen und Kontakt zu Menschen knüpfen, die man nicht kennt.",
    ],
    items: [
      ["I start conversations with people I don't know.", "Ich spreche fremde Menschen von mir aus an."],
      [
        "I find it easy to talk to customers or strangers.",
        "Mit Kundschaft oder Fremden komme ich leicht ins Gespräch.",
      ],
      [
        "I make new contacts, for example at events.",
        "Ich knüpfe neue Kontakte, zum Beispiel bei Veranstaltungen.",
      ],
    ],
  },
  {
    id: "hands",
    g: "hands",
    esco: "manipulating and controlling objects and equipment",
    en: ["Working with hands and tools", "Fixing, building and installing things, using tools or machines."],
    de: ["Mit Händen und Werkzeug", "Dinge reparieren, bauen und einbauen, mit Werkzeug oder Maschinen."],
    items: [
      ["I fix things myself.", "Ich repariere Dinge selbst."],
      ["I build, assemble or install things.", "Ich baue, montiere oder installiere Dinge."],
      ["I work with tools or machines.", "Ich arbeite mit Werkzeug oder Maschinen."],
    ],
  },
];

/* RIASEC interest types */
export const INTERESTS: readonly Interest[] = [
  {
    id: "R",
    en: ["Hands-on", "Working with your hands, tools, machines, plants or animals, often outdoors."],
    de: [
      "Handwerklich-technisch",
      "Mit den Händen arbeiten, mit Werkzeug, Maschinen, Pflanzen oder Tieren, oft draußen.",
    ],
    items: [
      ["Repair a machine or a bike", "Eine Maschine oder ein Fahrrad reparieren"],
      ["Build something out of wood or metal", "Etwas aus Holz oder Metall bauen"],
      [
        "Work outdoors, for example in a garden or on a building site",
        "Draußen arbeiten, zum Beispiel im Garten oder auf einer Baustelle",
      ],
    ],
  },
  {
    id: "I",
    en: ["Investigating", "Finding out how things work, testing, researching and solving puzzles."],
    de: [
      "Untersuchend-forschend",
      "Herausfinden, wie etwas funktioniert, testen, recherchieren und knifflige Fragen lösen.",
    ],
    items: [
      ["Find out why a plant is sick", "Herausfinden, warum eine Pflanze krank ist"],
      [
        "Read how something works, like an engine or the human body",
        "Lesen, wie etwas funktioniert, zum Beispiel ein Motor oder der Körper",
      ],
      ["Test something in a lab or a workshop", "Etwas im Labor oder in der Werkstatt testen"],
    ],
  },
  {
    id: "A",
    en: ["Creative", "Designing, writing, making music, pictures or spaces, and expressing ideas."],
    de: [
      "Künstlerisch-kreativ",
      "Gestalten, schreiben, Musik, Bilder oder Räume machen und Ideen ausdrücken.",
    ],
    items: [
      ["Redesign a room", "Einen Raum neu gestalten"],
      ["Write a text, a story or a song", "Einen Text, eine Geschichte oder ein Lied schreiben"],
      ["Take photos or make videos", "Fotos oder Videos machen"],
    ],
  },
  {
    id: "S",
    en: ["Helping", "Teaching, caring for, advising and supporting other people."],
    de: ["Erziehend-pflegend", "Anderen etwas beibringen, sie betreuen, beraten und unterstützen."],
    items: [
      ["Teach someone something", "Jemandem etwas beibringen"],
      ["Care for sick or older people", "Kranke oder ältere Menschen betreuen"],
      ["Help people with their problems", "Menschen bei ihren Problemen helfen"],
    ],
  },
  {
    id: "E",
    en: ["Leading and selling", "Convincing people, selling, leading and starting things."],
    de: ["Führend-verkaufend", "Menschen überzeugen, verkaufen, leiten und Neues anstoßen."],
    items: [
      ["Run a market stall", "Einen Verkaufsstand leiten"],
      ["Win people over to an idea", "Menschen für eine Idee gewinnen"],
      ["Start a small business of your own", "Ein eigenes kleines Geschäft gründen"],
    ],
  },
  {
    id: "C",
    en: ["Organizing", "Working with lists, numbers, forms and clear rules, keeping things in order."],
    de: [
      "Ordnend-verwaltend",
      "Mit Listen, Zahlen, Formularen und klaren Regeln arbeiten und Ordnung halten.",
    ],
    items: [
      ["Sort receipts into a spreadsheet", "Belege sortieren und in eine Tabelle eintragen"],
      ["Keep a stock list up to date", "Eine Lagerliste aktuell halten"],
      ["Fill in forms carefully and file them", "Formulare sorgfältig ausfüllen und ablegen"],
    ],
  },
];

/* work setting: two-sided preferences, 1 = left, 5 = right */
export const SETTING: readonly SettingRow[] = [
  { id: "people", en: ["On my own", "With many people"], de: ["Allein", "Mit vielen Menschen"] },
  { id: "outdoors", en: ["Indoors", "Outdoors"], de: ["Drinnen", "Draußen"] },
  {
    id: "physical",
    en: ["At a desk", "On my feet, physical"],
    de: ["Am Schreibtisch", "In Bewegung, körperlich"],
  },
  { id: "variety", en: ["Fixed routines", "Lots of variety"], de: ["Feste Abläufe", "Viel Abwechslung"] },
  { id: "hours", en: ["Fixed hours", "Flexible hours"], de: ["Feste Zeiten", "Flexible Zeiten"] },
  {
    id: "customers",
    en: ["Little customer contact", "Lots of customer contact"],
    de: ["Wenig Kundenkontakt", "Viel Kundenkontakt"],
  },
];
export const RULED_OUT: readonly RuledOut[] = [
  { id: "nights", g: "time", en: "Night shifts", de: "Nachtschichten" },
  { id: "earlylate", g: "time", en: "Early or late shifts", de: "Früh- oder Spätschichten" },
  { id: "weekends", g: "time", en: "Weekend work", de: "Wochenendarbeit" },
  { id: "oncall", g: "time", en: "Being on call", de: "Bereitschaftsdienst" },
  { id: "standing", g: "body", en: "Standing for long periods", de: "Viel Stehen" },
  { id: "lifting", g: "body", en: "Heavy lifting", de: "Schweres Heben" },
  { id: "bending", g: "body", en: "Kneeling or bending a lot", de: "Viel Knien oder Bücken" },
  {
    id: "weather",
    g: "body",
    en: "Working outdoors in all weather",
    de: "Draußen arbeiten bei jedem Wetter",
  },
  { id: "heights", g: "body", en: "Working at heights", de: "Arbeit in der Höhe" },
  { id: "noise", g: "body", en: "Noise, dirt or chemicals", de: "Lärm, Schmutz oder Chemikalien" },
  { id: "driving", g: "travel", en: "A lot of driving", de: "Viel Autofahren" },
  { id: "travel", g: "travel", en: "Travel with nights away from home", de: "Reisen mit Übernachtung" },
  { id: "commute", g: "travel", en: "A long commute", de: "Ein langer Arbeitsweg" },
  {
    id: "nolicence",
    g: "travel",
    en: "I have no driving licence",
    de: "Ich habe keinen Führerschein",
    p: {
      en: "jobs that need a driving licence (I have none)",
      de: "Stellen mit Führerschein (ich habe keinen)",
    },
  },
  { id: "phone", g: "work", en: "A lot of phone calls", de: "Viel Telefonieren" },
  { id: "upset", g: "work", en: "Upset or difficult customers", de: "Verärgerte oder schwierige Kundschaft" },
  { id: "sales", g: "work", en: "Sales targets", de: "Verkaufsziele" },
  { id: "samework", g: "work", en: "The same task all day", de: "Den ganzen Tag dieselbe Aufgabe" },
  {
    id: "alone",
    g: "work",
    en: "Working alone most of the day",
    de: "Den Großteil des Tages allein arbeiten",
  },
  { id: "screen", g: "work", en: "Screen work all day", de: "Den ganzen Tag Bildschirmarbeit" },
  { id: "animals", g: "work", en: "Working with animals", de: "Arbeit mit Tieren" },
  {
    id: "bodycare",
    g: "work",
    en: "Caring for people's bodies, such as washing or nursing",
    de: "Körperpflege bei anderen, etwa Waschen oder Pflegen",
  },
];
export const RULED_GROUPS = ["time", "body", "travel", "work"] as const;

/* work values, after O*NET */
export const VALUES: readonly WorkValue[] = [
  {
    id: "achievement",
    en: ["Seeing results", "Using your abilities and seeing what you have achieved."],
    de: ["Erfolg sehen", "Die eigenen Fähigkeiten nutzen und sehen, was man geschafft hat."],
  },
  {
    id: "independence",
    en: ["Deciding for myself", "Working on your own and making your own decisions."],
    de: ["Selbst entscheiden", "Selbstständig arbeiten und eigene Entscheidungen treffen."],
  },
  {
    id: "recognition",
    en: ["Recognition", "Being respected for your work and having chances to move up."],
    de: ["Anerkennung", "Für die eigene Arbeit geschätzt werden und aufsteigen können."],
  },
  {
    id: "relationships",
    en: ["Good colleagues", "Working with friendly people and being able to help others."],
    de: ["Gute Kolleginnen und Kollegen", "Mit netten Menschen arbeiten und anderen helfen können."],
  },
  {
    id: "support",
    en: ["Good support", "An employer who backs you, with fair managers and training."],
    de: [
      "Gute Unterstützung",
      "Ein Arbeitgeber, der hinter einem steht, mit fairer Leitung und Weiterbildung.",
    ],
  },
  {
    id: "conditions",
    en: ["Security and good conditions", "Job security, good pay and pleasant working conditions."],
    de: [
      "Sicherheit und gute Bedingungen",
      "Sicherer Arbeitsplatz, gute Bezahlung und angenehme Arbeitsbedingungen.",
    ],
  },
];

/* answer scales */
export const FREQ: Bilingual<readonly string[]> = {
  en: ["Never", "Rarely", "Sometimes", "Often", "Almost always"],
  de: ["Nie", "Selten", "Manchmal", "Oft", "Fast immer"],
};
export const LIKE: Bilingual<readonly string[]> = {
  en: ["Not at all", "Not really", "Not sure", "Quite like it", "Really like it"],
  de: ["Gar nicht gern", "Eher nicht gern", "Teils, teils", "Eher gern", "Sehr gern"],
};

/* question order: one item of each aptitude per round, so no scale comes in a block */
export const APT_ITEMS: readonly AssessItem[] = [0, 1, 2].flatMap((k) =>
  APTITUDES.map((a) => ({ id: a.id + "_" + (k + 1), apt: a.id, en: a.items[k][0], de: a.items[k][1] })),
);
export const INT_ITEMS: readonly AssessItem[] = [0, 1, 2].flatMap((k) =>
  INTERESTS.map((t) => ({ id: t.id + "_" + (k + 1), apt: t.id, en: t.items[k][0], de: t.items[k][1] })),
);
