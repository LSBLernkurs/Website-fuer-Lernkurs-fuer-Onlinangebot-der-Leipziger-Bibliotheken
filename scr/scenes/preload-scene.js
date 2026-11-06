import { SCENE_KEYS } from "../common/scene-keys.js";
import { SHEET_URLS } from "../common/sheet-config.js";
import { ladeDialogRegeln } from "../common/dialog-system.js";

//Spalten im Tab mit den Texten (Google Sheet, 0 = erste Spalte)
//Die Spalten sind unabhängig voneinander: Raumnamen/-dauer/Anfang & Ende sind einfache Listen (eine Zeile = ein Eintrag),
//ID, LINK, SPRECHER und INHALT gehören zusammen und beschreiben einen Text im Dialogfeld
const SPALTE = {
  RAUM_NAMEN: 0,
  RAUM_DAUER: 1,
  ANFANG_UND_ENDE_TEXT: 2,
  ID: 3,
  LINK: 4,
  SPRECHER: 5,
  INHALT: 6,
};

//Lädt alle Daten, die das Spiel braucht (Spielerfigur und Google Sheet), bevor es losgeht
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.PRELOAD_SCENE });
    console.log("preload-scene wurde erstellt");
  }

  preload() {
    //Spieler-Spritesheet laden
    this.load.spritesheet("cat", "assets/charaktere/Cat 01-1.png", {
      frameWidth: 32,
      frameHeight: 32,
    });

    //Google Sheet: Tab mit den Texten und Tab mit den Dialogregeln
    //Als reiner Text geladen, ausgewertet wird er in create()
    this.load.text("spielSheet", SHEET_URLS.texte);
    if (SHEET_URLS.regeln) this.load.text("regelnSheet", SHEET_URLS.regeln);
  }

  create() {
    //Das Sheet kommt als Text mit Tabs zwischen den Spalten
    const tsvText = this.cache.text.get("spielSheet");
    const textDaten = {}; //ID => { link, sprecher, inhalt }
    const raumNamen = [];
    const raumDauer = [];
    const anfangUndEndeText = []; //[0] = Text der Anfang-Scene, [1] = Text der Ende-Scene

    if (tsvText) {
      const zeilen = tsvText.split(/\r?\n/);
      //Start bei 1, weil Zeile 0 die Überschriften enthält
      for (let i = 1; i < zeilen.length; i++) {
        const spalten = zeilen[i].split("\t");
        const raumName = (spalten[SPALTE.RAUM_NAMEN] || "").trim();
        const dauerText = (spalten[SPALTE.RAUM_DAUER] || "").trim();
        //replace entfernt die Anführungszeichen am Anfang/Ende, die Google um Zellen mit Sonderzeichen setzt
        const anfangUndEnde = (spalten[SPALTE.ANFANG_UND_ENDE_TEXT] || "")
          .trim()
          .replace(/^"|"$/g, "");
        const id = (spalten[SPALTE.ID] || "").trim();
        const link = (spalten[SPALTE.LINK] || "").trim();
        const sprecher = (spalten[SPALTE.SPRECHER] || "").trim();
        const inhalt = (spalten[SPALTE.INHALT] || "")
          .trim()
          .replace(/^"|"$/g, "");

        //Leere Zellen werden übersprungen, so können die Listen unterschiedlich lang sein
        if (id) textDaten[id] = { link, sprecher, inhalt };
        if (raumName) raumNamen.push(raumName);
        if (dauerText) raumDauer.push(dauerText);
        if (anfangUndEnde) anfangUndEndeText.push(anfangUndEnde);
      }
    }

    //Dialogregeln
    const regelnText = this.cache.text.get("regelnSheet");
    if (!regelnText && SHEET_URLS.regeln) {
      console.warn("[Dialogregeln] Regeln-Tab nicht erreichbar.");
    }
    ladeDialogRegeln(this.registry, regelnText, textDaten);

    //Daten global in Registry speichern
    //(die Registry ist der Speicher, auf den alle Scenes zugreifen können)
    this.registry.set("spielTexte", textDaten);
    this.registry.set("raumNamen", raumNamen);
    this.registry.set("raumDauer", raumDauer);
    this.registry.set("anfangUndEndeText", anfangUndEndeText);
    console.log("Google Sheet erfolgreich vorgeladen", {
      textDaten,
      raumNamen,
      raumDauer,
      anfangUndEndeText,
    });
    this.scene.start(SCENE_KEYS.ANFANG_SCENE);
  }
}
