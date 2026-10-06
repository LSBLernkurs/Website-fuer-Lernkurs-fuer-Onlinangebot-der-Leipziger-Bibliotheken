import { SCENE_KEYS } from "../common(keys)/scene-keys.js";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.PRELOAD_SCENE });
    console.log("preload-scene wurde erstellt");
  }

  init() {}

  preload() {
    //Spieler-Spritesheet laden
    this.load.spritesheet(
      "cat",
      "assets/characters/pipoya-character-sprites/animal/Cat 01-1.png",
      {
        frameWidth: 32,
        frameHeight: 32,
      },
    );

    //Google Sheet TSV URL
    const csvUrl =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vS_Svxiw_JLf9tU93z9xO2Ec0R6y7rzJKrENHUiDDaWGg4G89Xg1qLF0JOUfcf0qCXr-LQD27V0oYnk/pub?gid=0&single=true&output=tsv";
    this.load.text("spielSheet", csvUrl);
  }

  create() {
    const csvText = this.cache.text.get("spielSheet");
    const textDaten = {};
    const raumNamen = [];
    const anfangUndEndeText = [];

    if (csvText) {
      const zeilen = csvText.split("\n");
      for (let i = 1; i < zeilen.length; i++) {
        const spalten = zeilen[i].split("\t");
        const raumName = (spalten[0] || "").trim();
        const anfangUndEnde = (spalten[1] || "").trim().replace(/^"|"$/g, "");
        const id = (spalten[2] || "").trim();
        const link = (spalten[3] || "").trim();
        const sprecher = (spalten[4] || "").trim();
        const inhalt = (spalten[5] || "").trim().replace(/^"|"$/g, "");

        if (id) textDaten[id] = { link, sprecher, inhalt };
        if (raumName) raumNamen.push(raumName);
        if (anfangUndEnde) anfangUndEndeText.push(anfangUndEnde);
      }
    }

    //Daten global in Registry speichern
    this.registry.set("spielTexte", textDaten);
    this.registry.set("raumNamen", raumNamen);
    this.registry.set("anfangUndEndeText", anfangUndEndeText);
    console.log("Google Sheet erfolgreich vorgeladen", {
      textDaten,
      raumNamen,
      anfangUndEndeText,
    });
    this.scene.start(SCENE_KEYS.ANFANG_SCENE);
  }
}
