/* Example profiles. {en,de} pairs are localized at build time; numbers in
   covers/uses are ESCO skill indices and become the label in that language. */
const b=(en,de)=>({en,de});

export const SPECS={

/* ============================== SHERLOCK HOLMES ============================== */
holmes:{
  pick:b("Private investigator moving into fraud analysis","Privatermittler auf dem Weg in die Betrugsanalyse"),
  profile:{
    name:"Sherlock Holmes",
    tagline:b("investigator to fraud analyst, sample profile","Ermittler zum Betrugsanalysten, Beispielprofil"),
    pitch:b("I have solved cases for twenty years by noticing what others miss and testing every explanation until one is left. I work fast, alone or with the police, and I write up evidence so it holds. I want to bring this to fraud analysis in a company with steady work.",
            "Seit zwanzig Jahren löse ich Fälle, indem ich bemerke, was andere übersehen, und jede Erklärung prüfe, bis eine übrig bleibt. Ich arbeite schnell, allein oder mit der Polizei, und ich dokumentiere Beweise so, dass sie halten. Das möchte ich in die Betrugsanalyse eines Unternehmens mit fester Arbeit einbringen."),
    location:b("Munich, open to hybrid","München, offen für hybrid"),
    languages:b("English native, German B2, French B1","Englisch Muttersprache, Deutsch B2, Französisch B1"),
    contact:"s.holmes@example.org",website:"",german:"b2",computer:"work",
    stats:[[ "20",b("years as an investigator","Jahre als Ermittler")],["60+",b("cases documented","dokumentierte Fälle")],["14",b("cases with the police","Fälle mit der Polizei")],["140",b("types of tobacco ash told apart","Tabakaschen unterschieden")]],
    facts:[[b("Prefers","Bevorzugt"),b("Working alone on hard problems, no fixed routine","Allein an schweren Problemen arbeiten, keine feste Routine")],[b("Avoids","Meidet"),b("Customer hotlines, small talk","Kundenhotlines, Small Talk")]]
  },
  intake:{situation:"seeking",current:b("Closing my investigation office, looking for employment","Ich schließe mein Ermittlungsbüro und suche eine Anstellung"),
    targets:b("Fraud investigator, Data analyst","Betrugsermittler, Datenanalyst"),
    want:b("Hard cases, a team that leaves me room to think, steady income","Schwierige Fälle, ein Team, das mir Raum zum Denken lässt, festes Einkommen"),
    avoid:b("Phone hotlines, sales targets, routine paperwork all day","Telefonhotlines, Verkaufsziele, den ganzen Tag Routinepapierkram"),
    hours:"flex",place:"hybrid",limits:b("None","Keine"),
    hobbies:b("Violin, chemistry experiments at home, boxing, beekeeping on the roof","Geige, Chemieversuche zu Hause, Boxen, Imkerei auf dem Dach"),
    projects:b("Wrote short studies on tobacco ash, tyre tracks and footprints","Kurze Studien über Tabakasche, Reifenspuren und Fußabdrücke geschrieben")},
  jobs:[
    {title:b("Private investigator","Privatermittler"),role:"past",occ:1479,org:b("Own office, Munich and London","Eigenes Büro, München und London"),when:b("2005 to 2026","2005 bis 2026"),
      desc:b("Consulting detective for private clients and, on hard cases, the police.","Beratender Detektiv für Privatkunden und, bei schweren Fällen, für die Polizei.")},
    {title:b("Chemistry lab assistant","Chemielaborant"),role:"past",occ:996,org:b("University hospital lab","Labor eines Universitätsklinikums"),when:b("2001 to 2005","2001 bis 2005"),
      desc:b("Ran tests and analyses during and after university.","Tests und Analysen während und nach dem Studium.")},
    {title:b("Fraud investigator","Betrugsermittler"),role:"goal",status:"goal",occ:1993,
      fit:b("Finding what does not add up is what I have done for twenty years. Insurers need exactly that, with steady hours.","Finden, was nicht zusammenpasst, mache ich seit zwanzig Jahren. Versicherer brauchen genau das, mit festen Zeiten."),
      watch:b("Insurance law and claims processes are new to me.","Versicherungsrecht und Schadenprozesse sind neu für mich.")},
    {title:b("Data analyst","Datenanalyst"),role:"explore",status:"fallback",occ:2579,
      fit:b("Same reasoning, applied to data instead of people.","Dasselbe Denken, angewendet auf Daten statt auf Menschen."),
      watch:b("Needs SQL and a data tool first.","Braucht zuerst SQL und ein Datenwerkzeug.")},
    {title:b("Forensic lab technician","Kriminaltechniker im Labor"),role:"explore",status:"explore",occ:1082,
      fit:b("Uses my chemistry and my eye for traces.","Nutzt meine Chemie und meinen Blick für Spuren."),
      watch:b("Labs want strict safety routines, not my strong side.","Labore wollen strenge Sicherheitsroutinen, nicht meine Stärke.")}
  ],
  rated:{1479:{654:3,1641:5,1721:4,1856:5,2679:4,2776:4,3572:3,5367:5,5737:2,6339:3,6918:4,7485:3,7548:4,8046:1,8477:5,10601:2,13483:4,13495:5,13904:5,177:4,2784:4,5759:5,6366:5,7371:5,8870:4},
         996:{614:4,2661:5,2789:3,2950:2,5340:1,6130:1,7176:4,7211:2,7576:2,9350:5,9877:4,10646:4,11041:3,11160:4,12106:5,11195:5,2748:3},
         extra:{4617:3,13340:3,10247:4}},
  cats:{
    inv:{name:b("Investigation","Ermittlung"),color:"blue",desc:b("Finding, testing and documenting what happened.","Herausfinden, prüfen und dokumentieren, was passiert ist."),skills:[1641,1721,1856,2679,5367,6918,8477,13483,13495,13904,177,2784,5759,6366,7371,4617,13340]},
    ppl:{name:b("People and interviews","Menschen und Befragungen"),color:"amber",desc:b("Clients, witnesses and suspects.","Kunden, Zeugen und Verdächtige."),skills:[654,2776,5737,6339,7548,8870,10247]},
    law:{name:b("Law","Recht"),color:"slate",desc:b("What I know of criminal and civil law from casework.","Was ich aus der Fallarbeit über Straf- und Zivilrecht weiß."),skills:[3572,7485,8046,10601]},
    lab:{name:b("Lab and chemistry","Labor und Chemie"),color:"green",desc:b("Analyses, tests and the home lab.","Analysen, Tests und das Heimlabor."),skills:[614,2661,2789,2950,5340,6130,7176,7211,7576,9350,9877,10646,11041,11160,12106,11195,2748]},
    fraud:{name:b("Fraud and insurance","Betrug und Versicherung"),color:"red",desc:b("What the goal job needs that I still have to learn.","Was der Zieljob braucht und ich noch lernen muss."),gapsDefault:true,skills:[]},
    side:{name:b("Side skills","Weitere Fähigkeiten"),color:"purple",desc:b("Hobbies that show up in the work.","Hobbys, die in der Arbeit auftauchen."),skills:[]}
  },
  own:[
    {name:b("Disguise and role play","Verkleidung und Rollenspiel"),cat:"inv",level:5,desc:b("Passing as a groom, a priest or a sailor long enough to get the facts.","Lange genug als Stallknecht, Pfarrer oder Seemann durchgehen, um an die Fakten zu kommen."),from:b("Undercover work on cases","Verdeckte Arbeit in Fällen"),lead:b("Mystery shopping, field audits","Testkäufe, Prüfungen vor Ort")},
    {name:b("Violin","Geige"),cat:"side",level:4,desc:b("Plays daily, composes short pieces.","Spielt täglich, komponiert kurze Stücke."),details:[[b("Improvising","Improvisieren"),5],[b("Sight reading","Vom Blatt spielen"),3]]},
    {name:b("Boxing","Boxen"),cat:"side",level:4,desc:b("Amateur boxer, still trains twice a week.","Amateurboxer, trainiert noch zweimal pro Woche.")},
    {name:b("Beekeeping","Imkerei"),cat:"side",level:3,desc:b("Four hives on the roof of the building.","Vier Bienenstöcke auf dem Dach des Hauses.")},
    {name:b("Writing short studies","Kurze Fachtexte schreiben"),cat:"side",level:3,desc:b("Short papers on traces, ash and footprints.","Kurze Texte über Spuren, Asche und Fußabdrücke.")}
  ],
  ownGaps:[
    {name:b("SQL and data tools","SQL und Datenwerkzeuge"),cat:"fraud",level:1,need:b("Course in data analysis with SQL","Kurs Datenanalyse mit SQL")},
    {name:b("Working in a large team","Arbeiten in einem großen Team"),cat:"fraud",level:2,need:b("Practice in the first months, ask for a mentor","In den ersten Monaten üben, um einen Mentor bitten")}
  ],
  projects:[
    {name:b("Study of 140 types of tobacco ash","Studie zu 140 Tabakaschen"),status:b("Finished","Abgeschlossen"),desc:b("A reference guide that tells cigar, cigarette and pipe ash apart.","Ein Nachschlagewerk, das Zigarren-, Zigaretten- und Pfeifenasche unterscheidet."),uses:[b("Writing short studies","Kurze Fachtexte schreiben"),11195]},
    {name:b("Home chemistry lab","Chemielabor zu Hause"),status:b("Ongoing","Laufend"),desc:b("Tests on stains, inks and poisons for cases.","Tests zu Flecken, Tinten und Giften für Fälle."),uses:[2661,9350]},
    {name:b("Case notes archive","Archiv der Fallnotizen"),status:b("Ongoing","Laufend"),desc:b("Indexed notes on more than 60 cases.","Verschlagwortete Notizen zu mehr als 60 Fällen."),uses:[6918,1856]}
  ],
  courses:[
    {name:b("Data analysis with SQL and Power BI","Datenanalyse mit SQL und Power BI"),match:4,provider:b("Example Bildungszentrum Munich","Beispiel Bildungszentrum München"),url:"https://example.org/courses/data-analysis-sql",start:b("12 January 2027","12. Januar 2027"),length:b("16 weeks","16 Wochen"),schedule:b("Full time, Mon to Fri","Vollzeit, Mo bis Fr"),format:b("Hybrid","Hybrid"),language:b("German","Deutsch"),price:b("6,800 euros","6.800 Euro"),funding:b("Bildungsgutschein possible, AZAV certified","Bildungsgutschein möglich, AZAV-zertifiziert"),cert:b("Provider certificate and Microsoft PL-300 exam","Trägerzertifikat und Microsoft-Prüfung PL-300"),prereq:b("Good computer skills, German B2","Gute PC-Kenntnisse, Deutsch B2"),desc:b("SQL, data cleaning, dashboards and statistics basics.","SQL, Datenbereinigung, Dashboards und Grundlagen der Statistik."),fit:b("Closes the biggest gap for both the goal and the backup.","Schließt die größte Lücke für Ziel und Plan B."),watch:b("Full time for four months.","Vier Monate Vollzeit."),qualifies:[b("Data analyst","Datenanalyst"),b("Fraud investigator","Betrugsermittler")],covers:[b("SQL and data tools","SQL und Datenwerkzeuge")],status:"applied",notes:b("Info day attended. Counsellor supports the voucher.","Infotag besucht. Beraterin unterstützt den Gutschein.")},
    {name:b("Certified fraud investigator (IHK)","Zertifizierter Betrugsermittler (IHK)"),match:5,provider:b("Example Akademie for Insurance","Beispiel Akademie für Versicherungen"),url:"https://example.org/courses/fraud-investigator",start:b("1 March 2027","1. März 2027"),length:b("10 weeks, part time","10 Wochen, Teilzeit"),schedule:b("Evenings and two Saturdays","Abends und zwei Samstage"),format:b("Online with two days on site","Online mit zwei Präsenztagen"),language:b("German","Deutsch"),price:b("2,950 euros","2.950 Euro"),funding:b("Check Bildungsgutschein, otherwise employer","Bildungsgutschein prüfen, sonst Arbeitgeber"),cert:b("IHK certificate","IHK-Zertifikat"),prereq:b("Experience in investigation or claims","Erfahrung in Ermittlung oder Schadenbearbeitung"),desc:b("Insurance law, claims fraud patterns, interviews and reports.","Versicherungsrecht, Betrugsmuster bei Schäden, Befragungen und Berichte."),fit:b("Exactly the gaps for the goal job.","Genau die Lücken für den Zieljob."),watch:b("Not every provider of this course is AZAV certified.","Nicht jeder Anbieter dieses Kurses ist AZAV-zertifiziert."),qualifies:[b("Fraud investigator","Betrugsermittler")],covers:[1169,12241,9371],status:"interested",notes:b("Ask counsellor whether it can follow the SQL course.","Beraterin fragen, ob er nach dem SQL-Kurs möglich ist.")},
    {name:b("Lab safety refresher","Auffrischung Laborsicherheit"),match:2,provider:b("Example Chemie Schule","Beispiel Chemieschule"),url:"https://example.org/courses/lab-safety",start:b("Monthly","Monatlich"),length:b("2 days","2 Tage"),schedule:b("Full days","Ganztags"),format:b("On site","Vor Ort"),language:b("German","Deutsch"),price:b("390 euros","390 Euro"),funding:b("Self pay","Selbstzahler"),cert:b("Certificate of attendance","Teilnahmebescheinigung"),prereq:b("None","Keine"),desc:b("Hazardous substances, protective gear, safe lab routines.","Gefahrstoffe, Schutzausrüstung, sichere Laborabläufe."),fit:b("Only useful for the lab option.","Nur für die Labor-Option nützlich."),watch:b("Low priority.","Geringe Priorität."),qualifies:[b("Forensic lab technician","Kriminaltechniker im Labor")],covers:[6130,5340],status:"rejected",notes:b("Not now, the goal is fraud analysis.","Nicht jetzt, Ziel ist die Betrugsanalyse.")}
  ],
  jobads:[
    {name:b("Fraud analyst claims (m/f/d)","Betrugsanalyst Schaden (m/w/d)"),org:b("Example Versicherung AG","Beispiel Versicherung AG"),place:b("Munich, 2 days remote","München, 2 Tage remote"),url:"https://example.org/jobs/fraud-analyst",hours:b("Full time","Vollzeit"),pay:b("58,000 to 66,000 euros","58.000 bis 66.000 Euro"),deadline:b("30 November 2026","30. November 2026"),reqs:b("Experience in investigation, police, audit or claims. Analytical thinking. SQL or Excel a plus. German C1.","Erfahrung in Ermittlung, Polizei, Revision oder Schaden. Analytisches Denken. SQL oder Excel von Vorteil. Deutsch C1."),desc:b("Check suspicious claims, interview claimants, work with police and lawyers.","Verdächtige Schäden prüfen, Anspruchsteller befragen, mit Polizei und Anwälten arbeiten."),for:[b("Fraud investigator","Betrugsermittler")],status:"applied",notes:b("Applied 10 October. German C1 asked, I have B2: mention the course.","Beworben am 10. Oktober. Deutsch C1 gefordert, ich habe B2: den Kurs erwähnen.")},
    {name:b("Investigator for financial crime (m/f/d)","Ermittler Finanzkriminalität (m/w/d)"),org:b("Example Bank Bayern","Beispiel Bank Bayern"),place:b("Munich","München"),url:"https://example.org/jobs/financial-crime",hours:b("Full time","Vollzeit"),pay:b("Not stated","Nicht angegeben"),deadline:"",reqs:b("Investigation background, knowledge of money laundering rules, English fluent.","Hintergrund in Ermittlung, Kenntnis der Geldwäscheregeln, fließend Englisch."),desc:b("Investigate suspicious transactions and write reports for the authorities.","Verdächtige Transaktionen untersuchen und Berichte für Behörden schreiben."),for:[b("Fraud investigator","Betrugsermittler")],status:"interested",notes:b("English is a plus here.","Englisch ist hier ein Vorteil.")},
    {name:b("Junior data analyst (m/f/d)","Junior Datenanalyst (m/w/d)"),org:b("Example Logistik GmbH","Beispiel Logistik GmbH"),place:b("Garching","Garching"),url:"https://example.org/jobs/junior-data-analyst",hours:b("Full time","Vollzeit"),pay:b("48,000 euros","48.000 Euro"),deadline:b("15 December 2026","15. Dezember 2026"),reqs:b("SQL, Power BI, curiosity.","SQL, Power BI, Neugier."),desc:b("Reports and analyses for the operations team.","Berichte und Analysen für das Betriebsteam."),for:[b("Data analyst","Datenanalyst")],status:"interested",notes:b("Only after the SQL course.","Erst nach dem SQL-Kurs.")}
  ],
  assess:{apt:{info:5,plan:3,solve:5,ideas:4,care:4,initiative:5,calm:4,persist:4,learn:4,explain:3,help:2,team:1.5,lead:3,meet:2,hands:3.5},
    int:{R:3.5,I:5,A:3,S:1.5,E:3,C:2},setting:{people:1,outdoors:2,physical:2,variety:5,hours:5,customers:2},ruledOut:["phone","sales","samework"],values:["independence","achievement","recognition"]},
  /* skill results: what the person wants to use more or less of (English catalogue names) */
  want:{more:["examine crime scenes","detect financial crime","analyse legal evidence","trace people","fraud detection"],less:["mix chemicals","maintain laboratory equipment","work safely with chemicals"]},
  /* reactions on Paths: d is the verdict on the job, sk and ctx rate its parts */
  votes:[{occ:"police detective",d:-1,sk:{"examine crime scenes":1,"lead police investigations":-1},ctx:{phone:-1}},
    {occ:"medical laboratory assistant",d:-1,sk:{"transport blood samples":-1},ctx:{routine:-1}},
    {occ:"criminal investigator",d:1,sk:{"examine crime scenes":1,"document evidence":1}}],
  summary:{goal:b("Fraud investigator","Betrugsermittler"),course:b("Data analysis with SQL and Power BI","Datenanalyse mit SQL und Power BI"),
    why:b("It matches my interests (Investigating, Practical). My strengths include making sense of information, solving problems and working on my own initiative. I already bring 20 years of investigation.","Es passt zu meinen Interessen (Untersuchen, Praktisch). Zu meinen Stärken gehören Informationen auswerten, Probleme lösen und Eigeninitiative. Ich bringe schon 20 Jahre Ermittlungsarbeit mit."),
    other:b("If insurers want more data skills first, I start as a data analyst and move into fraud from there.","Wenn Versicherer zuerst mehr Datenkenntnisse wollen, starte ich als Datenanalyst und wechsle von dort in die Betrugsermittlung."),
    next:b("Bildungsgutschein for the SQL course by end of November\nApply to two more insurers\nGerman C1 course in the evenings","Bildungsgutschein für den SQL-Kurs bis Ende November\nBei zwei weiteren Versicherern bewerben\nAbends Deutschkurs C1")}
},

/* ================================ ROBIN HOOD ================================ */
robin:{
  pick:b("Adventure guide moving into fundraising","Abenteuerguide auf dem Weg ins Fundraising"),
  profile:{
    name:"Robin Hood",
    tagline:b("adventure guide to fundraiser, sample profile","Abenteuerguide zum Fundraiser, Beispielprofil"),
    pitch:b("For five years I have taken groups into the woods and up mountains, taught archery and kept everyone safe and in good spirits. I am good at getting people to give their best and at bringing resources to those who need them. Now I want a job with room to grow, ideally raising money for a good cause.",
            "Seit fünf Jahren führe ich Gruppen in den Wald und auf Berge, unterrichte Bogenschießen und sorge dafür, dass alle sicher und gut gelaunt sind. Ich kann Menschen dazu bringen, ihr Bestes zu geben, und Mittel dorthin bringen, wo sie gebraucht werden. Jetzt will ich einen Job mit Entwicklung, am liebsten Spenden sammeln für einen guten Zweck."),
    location:b("Kassel, open to travel in Hesse","Kassel, Reisen in Hessen möglich"),
    languages:b("English native, German B2","Englisch Muttersprache, Deutsch B2"),
    contact:"robin.hood@example.org",website:"",german:"b2",computer:"daily",
    stats:[["5",b("years guiding","Jahre als Guide")],["1,200+",b("guests led","geführte Gäste")],["400",b("kids at free archery days","Kinder bei Gratis-Bogentagen")],["0",b("accidents on tours","Unfälle auf Touren")]],
    facts:[[b("Prefers","Bevorzugt"),b("Mixed indoor and outdoor work, lots of people","Gemischt drinnen und draußen, viele Menschen")],[b("Avoids","Meidet"),b("Pure desk jobs","Reine Schreibtischjobs")]]
  },
  intake:{situation:"employed",current:b("Self-employed guide, seasonal, wants a job with prospects","Selbstständiger Guide, saisonal, sucht einen Job mit Perspektive"),
    targets:b("Fundraiser, Procurement assistant, Forest manager","Fundraiser, Einkaufsassistent, Forstwirtschaftsmeister"),
    want:b("Room to grow, a cause I believe in, working with people","Entwicklungsmöglichkeiten, eine Sache, an die ich glaube, Arbeit mit Menschen"),
    avoid:b("Sitting at a desk all day, selling things people do not need","Den ganzen Tag am Schreibtisch sitzen, Dinge verkaufen, die niemand braucht"),
    hours:"full",place:"hybrid",limits:b("None","Keine"),
    hobbies:b("Traditional archery tournaments, wild camping, cooking for big groups, free archery days for kids from poor families","Turniere im traditionellen Bogenschießen, Wildcampen, Kochen für große Gruppen, kostenlose Bogentage für Kinder aus armen Familien"),
    projects:b("Runs free archery days for kids, raised money for bows and arrows from local businesses","Organisiert kostenlose Bogentage für Kinder, hat Geld für Bögen und Pfeile bei lokalen Firmen gesammelt")},
  jobs:[
    {title:b("Adventure and nature guide","Abenteuer- und Naturguide"),role:"past",occ:1063,org:b("Self-employed, Kaufunger Wald and the Alps","Selbstständig, Kaufunger Wald und Alpen"),when:b("2021 to now","2021 bis heute"),current:true,
      desc:b("Day tours, survival courses and team events in the forest.","Tagestouren, Survivalkurse und Teamevents im Wald.")},
    {title:b("Trekking and camping guide","Trekking- und Campingguide"),role:"past",occ:1673,org:b("Example Jugendreisen","Beispiel Jugendreisen"),when:b("Summers 2020 to 2024","Sommer 2020 bis 2024"),
      desc:b("Multi-day hut and camping tours for youth groups.","Mehrtägige Hütten- und Campingtouren für Jugendgruppen.")},
    {title:b("Archery trainer","Bogenschießtrainer"),role:"past",occ:223,org:b("Bow sports club Kassel","Bogensportverein Kassel"),when:b("2019 to now","2019 bis heute"),current:true,
      desc:b("Beginner and youth training twice a week.","Anfänger- und Jugendtraining zweimal pro Woche.")},
    {title:b("Fundraiser","Fundraiser"),role:"goal",status:"goal",occ:2382,
      fit:b("Taking from the rich and giving to the poor, legally. I already convince people and organise events.","Von den Reichen nehmen und den Armen geben, legal. Ich überzeuge schon Menschen und organisiere Events."),
      watch:b("Budgets, donor databases and grant writing are new.","Budgets, Spenderdatenbanken und Förderanträge sind neu.")},
    {title:b("Procurement assistant","Einkaufsassistent"),role:"explore",status:"fallback",occ:526,
      fit:b("Getting goods to where they are needed, for a food bank network.","Waren dorthin bringen, wo sie gebraucht werden, für ein Tafel-Netzwerk."),
      watch:b("More office work than I like.","Mehr Büroarbeit, als mir lieb ist.")},
    {title:b("Forest manager","Forstwirtschaftsmeister"),role:"explore",status:"explore",occ:2862,
      fit:b("I know the forest better than most.","Ich kenne den Wald besser als die meisten."),
      watch:b("Needs the Forstwirt training first, about three years.","Braucht zuerst die Forstwirt-Ausbildung, etwa drei Jahre.")}
  ],
  rated:{1063:{344:5,969:4,1570:4,1728:5,4786:4,4924:3,6377:5,8538:3,9470:4,9749:5,9947:3,10090:4,11494:2,11621:4,12403:4,12837:5,13352:5,2736:5,4032:5,5468:5,8547:5,12716:4,13235:5,13897:4},
         1673:{1263:3,1684:5,2239:3,2880:2,2940:3,2992:4,3189:2,3569:3,4827:4,5798:5,6491:4,6502:3,7030:4,8327:4,8805:4,9169:5,9837:5,10157:2,11144:2,12094:4,12973:4,13158:4,13610:4,2430:5,2963:5,12813:4,9724:4},
         223:{60:0,1119:4,1487:3,3207:3,3532:3,4065:3,5594:4,6365:3,7965:4,8714:3,9423:5,11939:5,11956:0,12064:4},
         extra:{1784:4,10386:3,4522:3,10141:3}},
  cats:{
    guide:{name:b("Guiding and outdoors","Führen und Outdoor"),color:"green",desc:b("Tours, routes, weather and safety outside.","Touren, Routen, Wetter und Sicherheit draußen."),skills:[344,6377,8538,2736,4032,5468,8547,13235,13897,1684,2992,3189,5798,7030,8805,9837,10157,13158,13610,2430,2963,12813,9724,1263,2940,6502,12973]},
    teach:{name:b("Teaching and coaching","Unterrichten und Trainieren"),color:"amber",desc:b("Archery, outdoor skills and sport training.","Bogenschießen, Outdoorfähigkeiten und Sporttraining."),skills:[1728,4786,4924,9749,10090,11494,11621,12837,13352,1119,1487,3207,5594,6365,7965,8714,9423,11939,12064,3532,4065]},
    safe:{name:b("Safety","Sicherheit"),color:"red",desc:b("Keeping groups safe.","Gruppen sicher halten."),skills:[969,1570,9470,9947,8327,12403]},
    ppl:{name:b("People and groups","Menschen und Gruppen"),color:"pink",desc:b("Welcoming, leading and organising groups.","Gruppen begrüßen, führen und organisieren."),skills:[12716,4827,6491,9169,12094,3569,2239,2880,11144,1784,10386,4522,10141]},
    fund:{name:b("Fundraising and finance","Fundraising und Finanzen"),color:"purple",desc:b("What the goal job needs that I still have to learn.","Was der Zieljob braucht und ich noch lernen muss."),gapsDefault:true,skills:[]},
    side:{name:b("Archery and camp life","Bogensport und Lagerleben"),color:"orange",desc:b("Skills from hobbies and volunteering.","Fähigkeiten aus Hobbys und Ehrenamt."),skills:[]}
  },
  own:[
    {name:b("Traditional archery","Traditionelles Bogenschießen"),cat:"side",level:5,desc:b("Longbow and recurve, regional tournament winner.","Langbogen und Recurve, regionaler Turniersieger."),from:b("Club and tournaments since age 12","Verein und Turniere seit dem 12. Lebensjahr"),lead:b("Trainer licence, archery events","Trainerlizenz, Bogensport-Events"),details:[[b("Longbow","Langbogen"),5],[b("Recurve","Recurve"),5],[b("Arrow making","Pfeilbau"),4]]},
    {name:b("Cooking for large groups","Kochen für große Gruppen"),cat:"side",level:4,desc:b("Camp kitchen for up to 40 people.","Lagerküche für bis zu 40 Personen.")},
    {name:b("Organising charity events","Benefizveranstaltungen organisieren"),cat:"ppl",level:4,desc:b("Free archery days for kids, with local sponsors.","Kostenlose Bogentage für Kinder, mit lokalen Sponsoren."),from:b("Volunteer since 2022","Ehrenamtlich seit 2022"),lead:b("Fundraising, event management","Fundraising, Eventmanagement")},
    {name:b("Persuading people","Menschen überzeugen"),cat:"ppl",level:5,desc:b("Gets businesses to donate and nervous guests to climb.","Bringt Firmen zum Spenden und ängstliche Gäste zum Klettern.")}
  ],
  ownGaps:[
    {name:b("Office software","Bürosoftware"),cat:"fund",level:2,need:b("Excel and CRM basics in the fundraising course","Excel- und CRM-Grundlagen im Fundraising-Kurs")}
  ],
  projects:[
    {name:b("Free archery days for kids","Kostenlose Bogentage für Kinder"),status:b("Ongoing, since 2022","Laufend, seit 2022"),desc:b("Eight days a year for kids from families with little money. 400 kids so far, bows paid for by local businesses.","Acht Tage im Jahr für Kinder aus Familien mit wenig Geld. Bisher 400 Kinder, Bögen bezahlt von lokalen Firmen."),uses:[b("Organising charity events","Benefizveranstaltungen organisieren"),b("Persuading people","Menschen überzeugen"),b("Traditional archery","Traditionelles Bogenschießen")]},
    {name:b("Trail map of the Kaufunger Wald","Wanderkarte Kaufunger Wald"),status:b("Finished","Abgeschlossen"),desc:b("Hand-drawn map of 12 routes, sold at the visitor centre.","Handgezeichnete Karte mit 12 Routen, verkauft im Besucherzentrum."),uses:[1684,9837]}
  ],
  courses:[
    {name:b("Fundraising manager certificate","Zertifikat Fundraising-Manager"),match:5,provider:b("Example Fundraising Akademie","Beispiel Fundraising Akademie"),url:"https://example.org/courses/fundraising-manager",start:b("8 February 2027","8. Februar 2027"),length:b("6 months, part time","6 Monate, berufsbegleitend"),schedule:b("Two evenings a week, four weekends","Zwei Abende pro Woche, vier Wochenenden"),format:b("Hybrid","Hybrid"),language:b("German","Deutsch"),price:b("4,200 euros","4.200 Euro"),funding:b("Bildungsgutschein possible, AZAV certified","Bildungsgutschein möglich, AZAV-zertifiziert"),cert:b("Certified fundraising manager","Zertifizierter Fundraising-Manager"),prereq:b("First experience in a nonprofit or volunteering","Erste Erfahrung in Verein oder Ehrenamt"),desc:b("Donor relations, major gifts, campaigns, CRM and grant writing.","Spenderbetreuung, Großspenden, Kampagnen, CRM und Förderanträge."),fit:b("Part time, so I can keep guiding while I learn.","Berufsbegleitend, ich kann weiter guiden, während ich lerne."),watch:b("Weekends clash with the tour season.","Wochenenden kollidieren mit der Tour-Saison."),qualifies:[b("Fundraiser","Fundraiser")],covers:[10301,4553,1823,b("Office software","Bürosoftware")],status:"applied",notes:b("Interview with the academy on 4 November.","Gespräch mit der Akademie am 4. November.")},
    {name:b("Purchasing and procurement basics","Grundlagen Einkauf und Beschaffung"),match:3,provider:b("Example IHK Bildungszentrum","Beispiel IHK-Bildungszentrum"),url:"https://example.org/courses/procurement-basics",start:b("Every quarter","Jedes Quartal"),length:b("8 weeks","8 Wochen"),schedule:b("Full time","Vollzeit"),format:b("Online","Online"),language:b("German","Deutsch"),price:b("2,100 euros","2.100 Euro"),funding:b("Bildungsgutschein possible","Bildungsgutschein möglich"),cert:b("IHK certificate","IHK-Zertifikat"),prereq:b("None","Keine"),desc:b("Suppliers, orders, contracts and negotiation.","Lieferanten, Bestellungen, Verträge und Verhandlung."),fit:b("Backup route if fundraising does not work out.","Plan B, falls Fundraising nicht klappt."),watch:b("Full time, no guiding during the course.","Vollzeit, kein Guiding während des Kurses."),qualifies:[b("Procurement assistant","Einkaufsassistent")],covers:[938,6338,10867],status:"interested",notes:""},
    {name:b("Retraining as Forstwirt","Umschulung zum Forstwirt"),match:3,provider:b("Example Forstliches Bildungszentrum","Beispiel Forstliches Bildungszentrum"),url:"https://example.org/courses/forstwirt",start:b("1 August 2027","1. August 2027"),length:b("24 months","24 Monate"),schedule:b("Full time","Vollzeit"),format:b("On site with forest practice","Vor Ort mit Praxis im Wald"),language:b("German","Deutsch"),price:b("Funded","Gefördert"),funding:b("Bildungsgutschein","Bildungsgutschein"),cert:b("Forstwirt, chamber exam","Forstwirt, Kammerprüfung"),prereq:b("Physically fit","Körperlich fit"),desc:b("Tree felling, planting, forest protection and machinery.","Holzernte, Pflanzung, Waldschutz und Maschinen."),fit:b("The first step toward forest manager.","Der erste Schritt zum Forstwirtschaftsmeister."),watch:b("Two years with little income.","Zwei Jahre mit wenig Einkommen."),qualifies:[b("Forest manager","Forstwirtschaftsmeister")],covers:[3377,4491,12333],status:"contacted",notes:b("Asked about places for 2027.","Nach Plätzen für 2027 gefragt.")}
  ],
  jobads:[
    {name:b("Fundraising officer major donors (m/f/d)","Referent Großspenden (m/w/d)"),org:b("Example Kinderhilfe e.V.","Beispiel Kinderhilfe e.V."),place:b("Kassel","Kassel"),url:"https://example.org/jobs/fundraising-officer",hours:b("Full time, 39 hours","Vollzeit, 39 Stunden"),pay:b("TVöD E9b","TVöD E9b"),deadline:b("20 November 2026","20. November 2026"),reqs:b("Experience with donors or sponsors, events, confident communication. Fundraising training welcome.","Erfahrung mit Spendern oder Sponsoren, Events, sicheres Auftreten. Fundraising-Weiterbildung erwünscht."),desc:b("Look after major donors and businesses, plan donor events, write thank-you reports.","Großspender und Firmen betreuen, Spenderevents planen, Dankesberichte schreiben."),for:[b("Fundraiser","Fundraiser")],status:"applied",notes:b("Mention the 400 kids and the sponsors.","Die 400 Kinder und die Sponsoren erwähnen.")},
    {name:b("Procurement assistant (m/f/d)","Assistenz Einkauf (m/w/d)"),org:b("Example Tafel-Verband Hessen","Beispiel Tafel-Verband Hessen"),place:b("Kassel","Kassel"),url:"https://example.org/jobs/procurement-assistant",hours:b("Part time, 30 hours","Teilzeit, 30 Stunden"),pay:b("Not stated","Nicht angegeben"),deadline:"",reqs:b("Organisational talent, driving licence, team spirit.","Organisationstalent, Führerschein, Teamgeist."),desc:b("Organise food donations from supermarkets and producers for 40 food banks.","Lebensmittelspenden von Supermärkten und Herstellern für 40 Tafeln organisieren."),for:[b("Procurement assistant","Einkaufsassistent")],status:"interested",notes:""},
    {name:b("Forest worker trainee (m/f/d)","Auszubildender Forstwirt (m/w/d)"),org:b("Example Forstamt","Beispiel Forstamt"),place:b("Hann. Münden","Hann. Münden"),url:"https://example.org/jobs/forstwirt-trainee",hours:b("Full time","Vollzeit"),pay:b("Training pay by agreement","Ausbildungsvergütung nach Tarif"),deadline:b("31 January 2027","31. Januar 2027"),reqs:b("Love of nature, physically fit.","Liebe zur Natur, körperlich fit."),desc:b("Three-year training in a state forest.","Dreijährige Ausbildung im Staatswald."),for:[b("Forest manager","Forstwirtschaftsmeister")],status:"interested",notes:""}
  ],
  assess:{apt:{info:3,plan:4,solve:4,ideas:4,care:3,initiative:4,calm:5,persist:4,learn:4,explain:4,help:4.5,team:4,lead:5,meet:5,hands:4},
    int:{R:4,I:2,A:3,S:5,E:5,C:2},setting:{people:5,outdoors:4,physical:4,variety:5,hours:3,customers:4},ruledOut:["nights","screen","samework"],values:["support","relationships","achievement"]},
  want:{more:["perform fundraising activities","establish contact with potential donors","coordinate events","engage local communities in the management of natural protected areas"],less:["collect visitor fees","register visitors","administer tour contract details"]},
  votes:[{occ:"volunteer manager",d:1,sk:{"coordinate events":1,"work within communities":1}},
    {occ:"golf instructor",d:-1,sk:{"golf":-1}},
    {occ:"tourist guide",d:-1,sk:{"collect visitor fees":-1,"select visitor routes":1}}],
  summary:{goal:b("Fundraiser","Fundraiser"),course:b("Fundraising manager certificate","Zertifikat Fundraising-Manager"),
    why:b("It matches my interests (Helping, Leading and selling). My strengths include leading, meeting new people and staying calm under pressure. I have already raised money from local businesses for free archery days.","Es passt zu meinen Interessen (Helfen, Führen und Verkaufen). Zu meinen Stärken gehören Führen, neue Menschen kennenlernen und Ruhe unter Druck. Ich habe schon Geld bei lokalen Firmen für kostenlose Bogentage gesammelt."),
    other:b("Backup: procurement for a food bank network. Long term: forest manager.","Plan B: Einkauf für ein Tafel-Netzwerk. Langfristig: Forstwirtschaftsmeister."),
    next:b("Bildungsgutschein for the fundraising course\nApply to two more charities in Kassel\nAsk the club for a reference about the kids' days","Bildungsgutschein für den Fundraising-Kurs\nBei zwei weiteren Vereinen in Kassel bewerben\nDen Verein um ein Zeugnis für die Kindertage bitten")}
},

/* ============================ GEPPETTO POLENDINA ============================ */
geppetto:{
  pick:b("Toymaker moving into CNC woodworking","Spielzeugmacher auf dem Weg zur CNC-Holzbearbeitung"),
  profile:{
    name:"Geppetto Polendina",
    tagline:b("woodcarver to CNC machinist, sample profile","Holzschnitzer zum CNC-Maschinenbediener, Beispielprofil"),
    pitch:b("I have carved wood for 35 years. I made toys, puppets and furniture by hand and repaired anything with a mechanism. My workshop no longer pays, but my hands and my eye for wood are as good as ever. I want to learn to run CNC machines and keep making good things.",
            "Ich schnitze seit 35 Jahren Holz. Ich habe Spielzeug, Marionetten und Möbel von Hand gemacht und alles repariert, was eine Mechanik hat. Meine Werkstatt trägt sich nicht mehr, aber meine Hände und mein Blick für Holz sind so gut wie immer. Ich will lernen, CNC-Maschinen zu bedienen, und weiter gute Dinge machen."),
    location:b("Nuremberg","Nürnberg"),
    languages:b("Italian native, German A2","Italienisch Muttersprache, Deutsch A2"),
    contact:"geppetto@example.org",website:"",german:"a2",computer:"low",
    stats:[["35",b("years at the workbench","Jahre an der Werkbank")],["2,000+",b("toys made by hand","handgemachte Spielzeuge")],["1",b("puppet that came to life","lebendig gewordene Marionette")],["40",b("clocks repaired","reparierte Uhren")]],
    facts:[[b("Prefers","Bevorzugt"),b("Quiet workshop, small team, day shifts only","Ruhige Werkstatt, kleines Team, nur Tagschicht")],[b("Limits","Einschränkungen"),b("Back problems: no heavy lifting","Rückenprobleme: kein schweres Heben")]]
  },
  intake:{situation:"seeking",current:b("Closed my toy workshop this year","Habe dieses Jahr meine Spielzeugwerkstatt geschlossen"),
    targets:b("CNC machine operator, Quality inspector for toys","CNC-Maschinenbediener, Qualitätsprüfer für Spielzeug"),
    want:b("Working with wood, a calm workshop, a few good colleagues","Arbeit mit Holz, eine ruhige Werkstatt, ein paar gute Kollegen"),
    avoid:b("Night shifts, heavy lifting, call centres","Nachtschichten, schweres Heben, Callcenter"),
    hours:"full",place:"onsite",limits:b("No heavy lifting because of my back","Kein schweres Heben wegen meines Rückens"),
    hobbies:b("Puppetry, telling stories to the neighbourhood children, fixing old clocks","Puppenspiel, Geschichten für die Kinder aus der Nachbarschaft, alte Uhren reparieren"),
    projects:b("Puppet theatre for the neighbourhood, a collection of restored clocks","Marionettentheater für die Nachbarschaft, eine Sammlung restaurierter Uhren")},
  jobs:[
    {title:b("Woodcarver and toymaker","Holzschnitzer und Spielzeugmacher"),role:"past",occ:1174,org:b("Own workshop, Florence and Nuremberg","Eigene Werkstatt, Florenz und Nürnberg"),when:b("1990 to 2026","1990 bis 2026"),
      desc:b("Wooden toys, puppets and repairs, sold in the shop and at markets.","Holzspielzeug, Marionetten und Reparaturen, verkauft im Laden und auf Märkten.")},
    {title:b("Woodcarver","Holzbildhauer"),role:"past",occ:2270,org:b("Workshop of Master Cherry, Florence","Werkstatt von Meister Kirsche, Florenz"),when:b("1985 to 1990","1985 bis 1990"),
      desc:b("Apprentice and journeyman carver.","Lehrling und Geselle im Schnitzen.")},
    {title:b("Carpenter's assistant","Zimmererhelfer"),role:"past",occ:530,org:b("Example Holzbau","Beispiel Holzbau"),when:b("1982 to 1985","1982 bis 1985"),
      desc:b("Roof and floor work before the carving apprenticeship.","Dach- und Bodenarbeiten vor der Schnitzlehre.")},
    {title:b("Market stall seller","Marktstandverkäufer"),role:"past",occ:2448,org:b("Christmas markets in Nuremberg and Fürth","Weihnachtsmärkte in Nürnberg und Fürth"),when:b("Winters 2015 to 2025","Winter 2015 bis 2025"),
      desc:b("Sold own toys at the Christkindlesmarkt.","Eigenes Spielzeug auf dem Christkindlesmarkt verkauft.")},
    {title:b("CNC machine operator","CNC-Maschinenbediener"),role:"goal",status:"goal",occ:1151,
      fit:b("Same wood, same eye for quality, but the machine does the heavy work.","Dasselbe Holz, derselbe Blick für Qualität, aber die Maschine macht die schwere Arbeit."),
      watch:b("Computers and programming are new to me, and my German is A2.","Computer und Programmieren sind neu für mich, und mein Deutsch ist A2.")},
    {title:b("Quality inspector for toys","Qualitätsprüfer für Spielzeug"),role:"explore",status:"fallback",occ:1220,
      fit:b("I know what makes a toy safe and well made.","Ich weiß, was ein Spielzeug sicher und gut gemacht macht."),
      watch:b("Lots of reports and standards.","Viele Berichte und Normen.")},
    {title:b("Cabinet maker","Tischler"),role:"explore",status:"explore",occ:2714,
      fit:b("Close to my craft.","Nah an meinem Handwerk."),
      watch:b("Heavy panels, hard on my back.","Schwere Platten, schlecht für meinen Rücken.")}
  ],
  rated:{2270:{844:5,2187:5,2254:4,2570:5,3749:5,4128:5,4129:5,5160:5,7527:5,9241:4,9490:4,10170:5,11253:5,12165:4,12390:3,12681:4,13205:3,1230:4,1762:4,4778:4,10989:5,12801:4,3240:3},
         1174:{1294:1,1649:5,3375:4,4388:3,5571:1,5630:3,5721:3,6491:4,6846:0,7183:3,7440:1,7449:4,7465:4,7651:5,8026:5,8198:5,8842:2,9665:0,10222:4,12098:3,13198:4,13247:4,4463:5,7511:5,13771:4,11692:4},
         2448:{36:4,676:2,1824:2,2963:3,4709:3,5365:4,6583:4,6751:1,9592:1,10287:2,11679:4},
         530:{914:3,958:3,1153:1,2524:3,4068:2,4439:3,5153:5,5593:4,7078:3,7396:2,7842:2,7897:4,8995:4,9329:2,9430:3,10060:4,10635:5,10775:2,12145:3},
         extra:{2831:3,3635:2}},
  cats:{
    wood:{name:b("Woodwork","Holzarbeit"),color:"orange",desc:b("Carving, joining, finishing.","Schnitzen, Verbinden, Oberflächen."),skills:[844,2187,2254,2570,3749,4128,4129,5160,7527,9241,9490,10170,11253,12165,12390,12681,13205,1230,1762,4778,10989,12801,5153,5593,7897,10635,8995,8198,7465,13198]},
    toys:{name:b("Toys and repair","Spielzeug und Reparatur"),color:"amber",desc:b("Making, repairing and checking toys.","Spielzeug bauen, reparieren und prüfen."),skills:[1294,1649,3375,4388,5571,5630,5721,6846,7183,7440,7449,7651,8026,8842,9665,10222,13247,4463,7511,13771,2831,3635]},
    build:{name:b("Building site","Baustelle"),color:"slate",desc:b("From the years as a carpenter's assistant.","Aus den Jahren als Zimmererhelfer."),skills:[914,958,1153,2524,4068,4439,7078,7396,7842,9329,9430,10060,10775,12145]},
    sell:{name:b("Selling","Verkauf"),color:"pink",desc:b("Shop and market stall.","Laden und Marktstand."),skills:[36,676,1824,2963,4709,5365,6583,6751,9592,10287,11679,6491,12098,3240,11692]},
    cnc:{name:b("CNC and machines","CNC und Maschinen"),color:"blue",desc:b("What the goal job needs that I still have to learn.","Was der Zieljob braucht und ich noch lernen muss."),gapsDefault:true,skills:[]},
    side:{name:b("Puppets and clocks","Marionetten und Uhren"),color:"purple",desc:b("Skills from hobbies.","Fähigkeiten aus Hobbys."),skills:[]}
  },
  own:[
    {name:b("Puppetry","Puppenspiel"),cat:"side",level:5,desc:b("Builds and plays string puppets.","Baut und spielt Marionetten."),from:b("Neighbourhood puppet theatre","Marionettentheater in der Nachbarschaft"),lead:b("Toy design, theatre workshops","Spielzeugdesign, Theaterwerkstätten"),details:[[b("Building marionettes","Marionetten bauen"),5],[b("Playing shows","Vorstellungen spielen"),4]]},
    {name:b("Clock repair","Uhrenreparatur"),cat:"side",level:4,desc:b("Fixes old mechanical clocks.","Repariert alte mechanische Uhren."),lead:b("Precision mechanics, quality inspection","Feinmechanik, Qualitätsprüfung")},
    {name:b("Storytelling for children","Geschichten für Kinder"),cat:"side",level:5,desc:b("Tells stories every Saturday in the courtyard.","Erzählt jeden Samstag Geschichten im Hof.")}
  ],
  ownGaps:[
    {name:b("Computer basics","Computergrundlagen"),cat:"cnc",level:1,need:b("Short computer course before the CNC course","Kurzer Computerkurs vor dem CNC-Kurs")},
    {name:b("German for work (B1)","Deutsch für den Beruf (B1)"),cat:"cnc",level:2,need:b("Job-related German course B1","Berufsbezogener Deutschkurs B1")}
  ],
  projects:[
    {name:b("Puppet theatre in the courtyard","Marionettentheater im Hof"),status:b("Ongoing","Laufend"),desc:b("Monthly shows for the neighbourhood with self-made marionettes.","Monatliche Vorstellungen für die Nachbarschaft mit selbstgebauten Marionetten."),uses:[b("Puppetry","Puppenspiel"),b("Storytelling for children","Geschichten für Kinder"),5160]},
    {name:b("Restored clock collection","Sammlung restaurierter Uhren"),status:b("Ongoing","Laufend"),desc:b("40 clocks from flea markets brought back to work.","40 Uhren vom Flohmarkt wieder zum Laufen gebracht."),uses:[b("Clock repair","Uhrenreparatur"),7449]},
    {name:b("The marionette that came to life","Die Marionette, die lebendig wurde"),status:b("Finished","Abgeschlossen"),desc:b("My best piece of work. He is a real boy now and helps in the workshop.","Mein bestes Stück. Er ist jetzt ein echter Junge und hilft in der Werkstatt."),uses:[5160,7651,10989]}
  ],
  courses:[
    {name:b("CNC basics for woodworking","CNC-Grundlagen Holzbearbeitung"),match:5,provider:b("Example Holzfachschule Franken","Beispiel Holzfachschule Franken"),url:"https://example.org/courses/cnc-wood",start:b("11 January 2027","11. Januar 2027"),length:b("12 weeks","12 Wochen"),schedule:b("Full time, day","Vollzeit, tagsüber"),format:b("On site in the training workshop","Vor Ort in der Lehrwerkstatt"),language:b("German, simple language","Deutsch, einfache Sprache"),price:b("5,400 euros","5.400 Euro"),funding:b("Bildungsgutschein possible, AZAV certified","Bildungsgutschein möglich, AZAV-zertifiziert"),cert:b("Provider certificate CNC operator wood","Trägerzertifikat CNC-Bediener Holz"),prereq:b("Woodworking experience, German A2","Erfahrung mit Holz, Deutsch A2"),desc:b("Machine setup, CAM basics, program changes, measuring and maintenance.","Maschine einrichten, CAM-Grundlagen, Programme anpassen, Messen und Warten."),fit:b("Built for people from the trade. Simple German is accepted.","Gemacht für Leute aus dem Handwerk. Einfaches Deutsch reicht."),watch:b("Needs basic computer skills first.","Braucht zuerst Computergrundlagen."),qualifies:[b("CNC machine operator","CNC-Maschinenbediener")],covers:[10397,11830,6727,3635],status:"applied",notes:b("Counsellor wants the computer course first.","Berater will zuerst den Computerkurs.")},
    {name:b("Computer basics for the workshop","Computergrundlagen für die Werkstatt"),match:4,provider:b("Example VHS Nürnberg","Beispiel VHS Nürnberg"),url:"https://example.org/courses/computer-basics",start:b("16 November 2026","16. November 2026"),length:b("4 weeks","4 Wochen"),schedule:b("Mornings","Vormittags"),format:b("On site","Vor Ort"),language:b("German","Deutsch"),price:b("Funded","Gefördert"),funding:b("Through the job centre","Über das Jobcenter"),cert:b("Certificate of attendance","Teilnahmebescheinigung"),prereq:b("None","Keine"),desc:b("Mouse, keyboard, files, email and a first look at a CAD program.","Maus, Tastatur, Dateien, E-Mail und ein erster Blick auf ein CAD-Programm."),fit:b("The step before the CNC course.","Der Schritt vor dem CNC-Kurs."),watch:b("",""),qualifies:[b("CNC machine operator","CNC-Maschinenbediener")],covers:[b("Computer basics","Computergrundlagen")],status:"accepted",notes:b("Starts on 16 November.","Beginnt am 16. November.")},
    {name:b("German for work B1","Deutsch für den Beruf B1"),match:4,provider:b("Example Sprachschule","Beispiel Sprachschule"),url:"https://example.org/courses/german-b1-work",start:b("Every month","Jeden Monat"),length:b("6 months","6 Monate"),schedule:b("Afternoons","Nachmittags"),format:b("On site","Vor Ort"),language:b("German","Deutsch"),price:b("Funded","Gefördert"),funding:b("BAMF job-related German course","BAMF Berufssprachkurs"),cert:b("Telc B1","Telc B1"),prereq:b("A2","A2"),desc:b("German for the workplace: instructions, safety, talking with colleagues.","Deutsch für den Arbeitsplatz: Anweisungen, Sicherheit, Gespräche mit Kollegen."),fit:b("Every job ad asks for B1.","Jede Stellenanzeige verlangt B1."),watch:b("Can run alongside the CNC course in the afternoons.","Kann nachmittags parallel zum CNC-Kurs laufen."),qualifies:[b("CNC machine operator","CNC-Maschinenbediener"),b("Quality inspector for toys","Qualitätsprüfer für Spielzeug")],covers:[b("German for work (B1)","Deutsch für den Beruf (B1)")],status:"contacted",notes:""}
  ],
  jobads:[
    {name:b("CNC operator woodworking (m/f/d)","CNC-Bediener Holzbearbeitung (m/w/d)"),org:b("Example Möbelwerkstätten","Beispiel Möbelwerkstätten"),place:b("Schwabach","Schwabach"),url:"https://example.org/jobs/cnc-operator-wood",hours:b("Full time, day shift","Vollzeit, Tagschicht"),pay:b("17.50 euros an hour","17,50 Euro pro Stunde"),deadline:"",reqs:b("Training in a wood trade, CNC experience or course, German B1.","Ausbildung im Holzhandwerk, CNC-Erfahrung oder Kurs, Deutsch B1."),desc:b("Run CNC routers for furniture parts, check quality, small maintenance.","CNC-Fräsen für Möbelteile bedienen, Qualität prüfen, kleine Wartung."),for:[b("CNC machine operator","CNC-Maschinenbediener")],status:"interested",notes:b("Apply after the CNC course. They train older starters.","Nach dem CNC-Kurs bewerben. Sie lernen auch ältere Quereinsteiger an.")},
    {name:b("Quality inspector toys (m/f/d)","Qualitätsprüfer Spielwaren (m/w/d)"),org:b("Example Spielwaren GmbH","Beispiel Spielwaren GmbH"),place:b("Fürth","Fürth"),url:"https://example.org/jobs/toy-quality",hours:b("Full time","Vollzeit"),pay:b("By agreement","Nach Vereinbarung"),deadline:b("15 January 2027","15. Januar 2027"),reqs:b("Experience with toys or wood products, eye for detail, German B1.","Erfahrung mit Spielwaren oder Holzprodukten, Auge fürs Detail, Deutsch B1."),desc:b("Check wooden toys against safety standards, write short test reports.","Holzspielzeug nach Sicherheitsnormen prüfen, kurze Prüfberichte schreiben."),for:[b("Quality inspector for toys","Qualitätsprüfer für Spielzeug")],status:"applied",notes:b("Applied with photos of my toys. Waiting.","Mit Fotos meiner Spielzeuge beworben. Warte auf Antwort.")}
  ],
  assess:{apt:{info:3,plan:3,solve:4,ideas:4.5,care:5,initiative:4,calm:4,persist:5,learn:3,explain:3,help:4,team:3,lead:2,meet:3,hands:5},
    int:{R:5,I:2.5,A:4.5,S:3,E:1.5,C:3},setting:{people:2,outdoors:1,physical:3,variety:3,hours:2,customers:2},ruledOut:["nights","earlylate","lifting","sales"],values:["achievement","conditions","relationships"]},
  want:{more:["create wood joints","carve materials","turn wood","interpret 3D plans","operate precision measuring equipment"],less:["operate cash register","process payments","arrange permit for market stall","pack goods"]},
  votes:[{occ:"cabinet maker",d:1,sk:{"join wood elements":1,"design original furniture":1}},
    {occ:"sawmill operator",d:-1,sk:{"manipulate wood":1},ctx:{routine:-1}},
    {occ:"furniture assembler",d:1}],
  summary:{goal:b("CNC machine operator","CNC-Maschinenbediener"),course:b("CNC basics for woodworking","CNC-Grundlagen Holzbearbeitung"),
    why:b("It matches my interests (Practical, Creative). My strengths include working with hands and tools, care and accuracy, and sticking with it. I know wood after 35 years.","Es passt zu meinen Interessen (Praktisch, Kreativ). Zu meinen Stärken gehören Arbeit mit Händen und Werkzeug, Sorgfalt und Ausdauer. Ich kenne Holz nach 35 Jahren."),
    other:b("Backup: quality inspector for toys. Also possible: cabinet maker, if the work is light enough.","Plan B: Qualitätsprüfer für Spielzeug. Auch möglich: Tischler, wenn die Arbeit leicht genug ist."),
    next:b("Computer course from 16 November\nBildungsgutschein for the CNC course\nGerman B1 course in the afternoons","Computerkurs ab 16. November\nBildungsgutschein für den CNC-Kurs\nNachmittags Deutschkurs B1")}
}
};
