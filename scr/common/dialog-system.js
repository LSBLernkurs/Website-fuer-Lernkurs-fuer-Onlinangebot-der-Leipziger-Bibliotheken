//========================= Überblick =========================
//Das Dialogsystem entscheidet, welcher Text gezeigt wird, wenn der Spieler mit einem Objekt/NPC interagiert.
//Die Entscheidung kommt NICHT aus dem Code, sondern aus dem Tab "Regeln" im Google Sheet.
//
//Begriffe:
//- objekt:     Name eines NPCs oder Gegenstands (z.B. "pilzkorb"), steht auch im Regeln-Tab
//- Regel:      eine Zeile im Regeln-Tab. Spalten: objekt | bedingung | text_id | setzt | nach_ja | nach_nein
//- Flag:       ein benannter Merker, der an oder aus ist (z.B. "raum4_daemonBereitsAngesprochen").
//.             Flags mit Präfix "raumN_" werden beim Betreten von Raum N wieder gelöscht
//- Zähler:     für die Schlüssel-Anzahl pro Raum, wird beim Betreten von Raum N wieder gelöscht (z.B. "schluessel+1")
//- auswahlen:  gemerkte Ja/Nein-Antworten pro Objekt (true / false / noch keine). Werden beim Betreten des Raums gelöscht
//- fertig:     Objekt wurde mit "Ja" abgeschlossen (wird beim Betreten des Raums zurückgesetzt)
//- gesprochen: Spieler hat in diesem Raumbesuch schon mit dem Objekt gesprochen
//
//Bedingungen (Spalte "bedingung") können enthalten:
//- Funktionen:     ja(objekt), nein(objekt), offen(objekt), fertig(objekt), gesprochen(objekt)
//- Flag-Namen:     z.B. raum4_daemonBereitsAngesprochen (wahr, wenn das Flag gesetzt ist)
//- Zähler:         "schluessel+1" um Anzahl um einen zu erhöhen, "!schluessel+1" um einen zu löschen
//- "immer" oder leer: trifft immer zu
//- Verknüpfungen:  und / & / &&,  oder / | / ||,  nicht / !,  sowie Klammern
//Die erste Regel (von oben nach unten) eines Objekts, deren Bedingung zutrifft, wird gewählt.
//
//Effekte (Spalten "setzt", "nach_ja", "nach_nein"): Flag-Namen oder Zähler mit , oder ; getrennt.
//Ein ! oder - davor löscht das Flag, z.B. "!raum2_korbAllesRaus"

//Schlüssel, unter denen die Daten in der Phaser-Registry (globaler Speicher des Spiels) liegen
const REGISTRY_REGELN = "dialogRegeln";
const REGISTRY_ZUSTAND = "dialogZustand";
const REGISTRY_AUSWAHLEN = "dialogAuswahlen";

//Name des Zählers für Schlüssel (in den Sheet-Effekten z.B. "schluessel+1")
export const ZAEHLER_SCHLUESSEL = "schluessel";

//Diese Funktionsnamen sind in Bedingungen erlaubt (müssen zu erstelleKontext passen)
const FUNKTIONEN = ["ja", "nein", "offen", "fertig", "gesprochen"];

//Zustand
//Holt den Zustand aus der Registry, legt ihn beim ersten Aufruf leer an
function holeZustand(registry) {
  let zustand = registry.get(REGISTRY_ZUSTAND);
  if (!zustand) {
    zustand = { flags: {}, fertig: {}, gesprochen: {}, zaehler: {} };
    registry.set(REGISTRY_ZUSTAND, zustand);
  }
  return zustand;
}

//Setzt alles zurück (wird beim Beenden des Spiels aufgerufen, siehe quit-scene.js)
export function setzeDialogZustandZurueck(registry) {
  registry.set(REGISTRY_ZUSTAND, {
    flags: {},
    fertig: {},
    gesprochen: {},
    zaehler: {},
  });
  registry.set(REGISTRY_AUSWAHLEN, {});
}

export function hatFlag(registry, name) {
  return holeZustand(registry).flags[name] === true;
}

//wert = false löscht das Flag (es wird nicht auf false gesetzt, sondern entfernt)
export function setzeFlag(registry, name, wert = true) {
  const flags = holeZustand(registry).flags;
  if (wert) flags[name] = true;
  else delete flags[name];
}

//Zähler (Zahlen statt an/aus bzw. Flag), z.B. die Anzahl der Schlüssel
export function zaehlerWert(registry, name) {
  return holeZustand(registry).zaehler[name] ?? 0;
}

//delta > 0: erhöhen, delta < 0: verringern (nie unter 0)
export function aendereZaehler(registry, name, delta) {
  const zaehler = holeZustand(registry).zaehler;
  zaehler[name] = Math.max(0, (zaehler[name] ?? 0) + delta);
}

export function istFertig(registry, objekt) {
  return holeZustand(registry).fertig[objekt] === true;
}

export function markiereGesprochen(registry, objekt) {
  holeZustand(registry).gesprochen[objekt] = true;
}

//flags zurücksetzen wenn ein Raum neu betreten wird
//Es werden nur Flags gelöscht, die mit "raum<Nummer>_" beginnen, z.B. "raum3_schluessel"
export function setzeRaumFlagsZurueck(registry, raumNummer) {
  const praefix = `raum${raumNummer}_`;
  const zustand = holeZustand(registry);
  for (const name of Object.keys(zustand.flags)) {
    if (name.startsWith(praefix)) delete zustand.flags[name];
  }
  //Zähler (z.B. Schlüssel) gelten pro Raum und starten bei jedem Betreten bei 0
  zustand.zaehler = {};
}

//Beim Betreten eines Raums: Objekt neu initialisieren
//gemerkte Ja/Nein-Antwort, "fertig" und "gesprochen" werden gelöscht, der Raum startet immer von vorn
export function initialisiereObjekt(registry, objekt) {
  const zustand = holeZustand(registry);
  const auswahlen = registry.get(REGISTRY_AUSWAHLEN) || {};
  delete auswahlen[objekt];
  registry.set(REGISTRY_AUSWAHLEN, auswahlen);
  delete zustand.fertig[objekt];
  delete zustand.gesprochen[objekt];
}

//Wendet eine Liste von Effekten an, z.B. [{ name: "raum2_schluessel", wert: true }]
export function wendeEffekteAn(registry, effekte = []) {
  for (const effekt of effekte) {
    if (effekt.zaehler) aendereZaehler(registry, effekt.name, effekt.delta);
    else setzeFlag(registry, effekt.name, effekt.wert);
  }
}

//Wird von der textfeld-scene aufgerufen, wenn ein Dialog zu Ende ist
//auswahl: true = Spieler hat "Ja" gewählt, false = "Nein", null = es gab keine Frage
//nachJa / nachNein: Effekte, die nur bei der jeweiligen Antwort angewendet werden
export function dialogBeendet(
  registry,
  objekt,
  auswahl,
  nachJa = [],
  nachNein = [],
) {
  const auswahlen = registry.get(REGISTRY_AUSWAHLEN) || {};
  auswahlen[objekt] = auswahl;
  registry.set(REGISTRY_AUSWAHLEN, auswahlen);

  if (auswahl === true) {
    holeZustand(registry).fertig[objekt] = true;
    wendeEffekteAn(registry, nachJa);
  } else if (auswahl === false) {
    wendeEffekteAn(registry, nachNein);
  }
}

//Regeln auswerten
//Baut das "Kontext"-Objekt: Das sind die Funktionen, die in den Bedingungen benutzt werden können.
//Die Bedingungen aus dem Sheet werden zu Funktionen, die diesen Kontext als Parameter (k) bekommen.
function erstelleKontext(registry) {
  const auswahlen = registry.get(REGISTRY_AUSWAHLEN) || {};
  const zustand = holeZustand(registry);
  return {
    ja: (o) => auswahlen[o] === true,
    nein: (o) => auswahlen[o] === false,
    //offen = es gibt noch keine Ja/Nein-Antwort (undefined und null zählen beide als "keine")
    offen: (o) => (auswahlen[o] ?? null) === null,
    fertig: (o) => zustand.fertig[o] === true,
    gesprochen: (o) => zustand.gesprochen[o] === true,
    flag: (n) => zustand.flags[n] === true,
  };
}

//Gibt die passende Regel für ein Objekt zurück (oder null, wenn keine zutrifft)
//Es gilt die erste zutreffende Regel, die Reihenfolge im Regeln-Tab ist also wichtig
export function waehleDialog(registry, objekt) {
  const regeln = registry.get(REGISTRY_REGELN) || {};
  const liste = regeln[objekt];
  if (!liste) return null;
  const kontext = erstelleKontext(registry);
  return liste.find((regel) => regel.bedingung(kontext)) || null;
}

//Bedingungen einlesen
//Zerlegt den Bedingungstext in Einzelteile (Tokens), z.B. "ja(a) und nicht b" =>
//Wort "ja", Klammer, Wort "a", Klammer, "und", "nicht", Wort "b"
function tokenisiere(text) {
  //Regex: && oder || | eine einzelne Klammer bzw. ein einzelnes & | ! | oder eine Folge aus allen anderen Zeichen (ohne Leerzeichen)
  const treffer = text.match(/&&|\|\||[()&|!]|[^\s()&|!]+/g) || [];
  return treffer.map((t) => {
    const klein = t.toLowerCase();
    if (klein === "und" || t === "&" || t === "&&")
      return { typ: "und", wert: t };
    if (klein === "oder" || t === "|" || t === "||")
      return { typ: "oder", wert: t };
    if (klein === "nicht" || t === "!") return { typ: "nicht", wert: t };
    if (t === "(" || t === ")") return { typ: t, wert: t };
    return { typ: "wort", wert: t };
  });
}

//Wandelt den Bedingungstext in eine Funktion um, die den Kontext bekommt und true/false zurückgibt.
//Aufbau: "Recursive Descent Parser". Jede parse-Funktion behandelt eine Rangstufe,
//die Rangfolge ist NICHT vor UND vor ODER (wie bei "Punkt vor Strich"), Klammern gehen vor allem.
//Wirft einen Error mit verständlicher Meldung, wenn die Bedingung fehlerhaft ist.
export function parseBedingung(text) {
  const bereinigt = (text || "").trim();
  if (bereinigt === "" || bereinigt.toLowerCase() === "immer")
    return () => true;

  const tokens = tokenisiere(bereinigt);
  let pos = 0; //Position des aktuellen Tokens
  const schau = () => tokens[pos]; //aktuelles Token ansehen, ohne weiterzugehen
  const nimm = () => tokens[pos++]; //aktuelles Token nehmen und weitergehen

  //a ODER b ODER c
  function parseOder() {
    let links = parseUnd();
    while (schau()?.typ === "oder") {
      nimm();
      const l = links;
      const r = parseUnd();
      links = (k) => l(k) || r(k);
    }
    return links;
  }

  //a UND b UND c
  function parseUnd() {
    let links = parseNicht();
    while (schau()?.typ === "und") {
      nimm();
      const l = links;
      const r = parseNicht();
      links = (k) => l(k) && r(k);
    }
    return links;
  }

  //NICHT a (darf auch mehrfach hintereinander stehen)
  function parseNicht() {
    if (schau()?.typ === "nicht") {
      nimm();
      const inner = parseNicht();
      return (k) => !inner(k);
    }
    return parseAtom();
  }

  //Kleinster Baustein: (Ausdruck in Klammern), Funktionsaufruf wie ja(objekt) oder ein einzelner Flag-Name
  function parseAtom() {
    const t = nimm();
    if (!t) throw new Error("Die Bedingung ist unvollständig");
    if (t.typ === "(") {
      const ausdruck = parseOder();
      if (nimm()?.typ !== ")")
        throw new Error('Es fehlt eine schließende Klammer ")"');
      return ausdruck;
    }
    if (t.typ === "wort") {
      //Wort gefolgt von "(" => Funktionsaufruf
      if (schau()?.typ === "(") {
        nimm();
        const funktion = t.wert.toLowerCase();
        if (!FUNKTIONEN.includes(funktion)) {
          throw new Error(
            `Unbekannte Funktion "${t.wert}" (erlaubt: ${FUNKTIONEN.join(", ")})`,
          );
        }
        const arg = nimm();
        if (!arg || arg.typ !== "wort") {
          throw new Error(`Bei "${t.wert}(...)" fehlt der Name in der Klammer`);
        }
        if (nimm()?.typ !== ")")
          throw new Error('Es fehlt eine schließende Klammer ")"');
        return (k) => k[funktion](arg.wert);
      }
      if (t.wert.toLowerCase() === "immer") return () => true;
      //sonst: einzelnes Wort = Flag-Name
      const name = t.wert;
      return (k) => k.flag(name);
    }
    throw new Error(`Unerwartetes Zeichen "${t.wert}"`);
  }

  const ergebnis = parseOder();
  //Sind nach dem Ausdruck noch Tokens übrig, stimmt etwas nicht (z.B. "a b" statt "a und b")
  if (pos < tokens.length) {
    throw new Error(
      `Unerwartetes Zeichen "${tokens[pos].wert}" (fehlt ein UND / ODER?)`,
    );
  }
  return ergebnis;
}

//Zähler-Effekte: name+zahl bzw. name-zahl, z.B. "schluessel+1" (Schlüssel bekommen) oder "schluessel+3"
const ZAEHLER_MUSTER = /^([^\s+\-!]+)\s*([+-])\s*(\d+)$/;

//Wandelt Effekt-Text in eine Liste um: "a, !b" => [{ name: "a", wert: true }, { name: "b", wert: false }]
//wert = false bedeutet: Flag löschen
export function parseEffekte(text) {
  return (text || "")
    .split(/[,;]/)
    .map((teil) => teil.trim())
    .filter(Boolean)
    .map((teil) => {
      const zaehler = teil.match(ZAEHLER_MUSTER);
      if (zaehler) {
        const betrag = Number(zaehler[3]);
        return {
          name: zaehler[1],
          zaehler: true,
          delta: zaehler[2] === "+" ? betrag : -betrag,
        };
      }
      const loeschen = teil.startsWith("!") || teil.startsWith("-");
      return { name: loeschen ? teil.slice(1).trim() : teil, wert: !loeschen };
    });
}

//Regeln vom Google Sheet Tab einlesen
//Bereinigt eine Zelle: Leerzeichen und die Anführungszeichen, die Google um manche Zellen setzt, entfernen
//(innen stehende Anführungszeichen sind doppelt "" und werden wieder zu einem ")
function zelle(wert) {
  return (wert || "").trim().replace(/^"|"$/g, "").replace(/""/g, '"').trim();
}

//Liest den Regeln-Tab (Text mit Tabs als Spaltentrenner) ein.
//Spalten: 0 objekt | 1 bedingung | 2 text_id | 3 setzt | 4 nach_ja | 5 nach_nein
//Rückgabe: { regeln: { objekt: [Regel, ...] }, warnungen: [...] }. Fehlerhafte Zeilen werden übersprungen
export function parseRegelnTsv(tsv) {
  const regeln = {};
  const warnungen = [];
  //﻿ = unsichtbares Zeichen am Dateianfang (BOM), wird entfernt
  const zeilen = (tsv || "").replace(/^\uFEFF/, "").split(/\r?\n/);

  for (let i = 1; i < zeilen.length; i++) {
    //Zeile 1 = Überschriften
    const spalten = zeilen[i].split("\t");
    const objekt = zelle(spalten[0]);
    if (!objekt || objekt.startsWith("#")) continue; //leer oder auskommentiert

    const bedingungText = zelle(spalten[1]);
    const textId = zelle(spalten[2]);
    //i beginnt bei 0, im Sheet bei 1 => +1, damit die Zeilennummer in Warnungen mit dem Sheet übereinstimmt
    const zeilenNr = i + 1;

    if (!textId) {
      warnungen.push(`Regeln Zeile ${zeilenNr} (${objekt}): text_id fehlt`);
      continue;
    }
    let bedingung;
    try {
      bedingung = parseBedingung(bedingungText);
    } catch (fehler) {
      warnungen.push(
        `Regeln Zeile ${zeilenNr} (${objekt}): Bedingung "${bedingungText}" ist fehlerhaft: ${fehler.message}`,
      );
      continue;
    }

    if (!regeln[objekt]) regeln[objekt] = [];
    regeln[objekt].push({
      zeile: zeilenNr,
      bedingungText: bedingungText || "immer",
      bedingung,
      textId,
      //setzt = Effekte beim Start des Dialogs, nachJa / nachNein = Effekte nach der jeweiligen Antwort
      setzt: parseEffekte(zelle(spalten[3])),
      nachJa: parseEffekte(zelle(spalten[4])),
      nachNein: parseEffekte(zelle(spalten[5])),
    });
  }
  return { regeln, warnungen };
}

//Kontrolle und Fehlermeldungen
//Prüft die Regeln auf typische Fehler im Sheet und gibt Warnungen zurück (stoppt das Spiel nicht)
function pruefeRegeln(regeln, spielTexte) {
  const warnungen = [];
  for (const [objekt, liste] of Object.entries(regeln)) {
    liste.forEach((regel, index) => {
      //1. Verweist die Regel auf eine Text-ID, die es im Text-Tab nicht gibt?
      if (spielTexte && !spielTexte[regel.textId]) {
        warnungen.push(
          `Regeln Zeile ${regel.zeile} (${objekt}): Text-ID ${regel.textId} gibt es im Text-Tab nicht`,
        );
      }
      //2. Steht unter einer "immer"-Regel noch eine weitere? Die käme nie dran, weil die erste zutreffende gewinnt
      if (regel.bedingungText === "immer" && index < liste.length - 1) {
        warnungen.push(
          `Regeln Zeile ${liste[index + 1].zeile} (${objekt}): wird nie erreicht, weil Zeile ${regel.zeile} immer zutrifft`,
        );
      }
    });
  }
  return warnungen;
}

//Liest den TSV-Text ein und legt die Regeln in der Registry ab
//Wird einmal in der preload-scene aufgerufen. spielTexte wird nur für die Text-ID-Kontrolle benötigt
export function ladeDialogRegeln(registry, tsv, spielTexte) {
  const { regeln, warnungen } = parseRegelnTsv(tsv);
  warnungen.push(...pruefeRegeln(regeln, spielTexte));
  registry.set(REGISTRY_REGELN, regeln);
  for (const w of warnungen) console.warn("[Dialogregeln]", w);
  return { regeln, warnungen };
}
