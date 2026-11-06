//Eindeutige Namen (Keys) aller Scenes.
//Damit man sich nirgends im Code bei einem String vertippt, wird überall SCENE_KEYS.XYZ verwendet.
//Object.freeze verhindert, dass die Werte später versehentlich verändert werden.
export const SCENE_KEYS = Object.freeze({
  //Lade-Scene (holt das Google Sheet) und Start des Spiels
  PRELOAD_SCENE: "PRELOAD_SCENE",
  ANFANG_SCENE: "ANFANG_SCENE",
  //Die vier Räume (Reihenfolge der Räume steht in raum-wechsel.js)
  ERSTER_SCENE: "ERSTER_SCENE",
  ZWEITER_SCENE: "ZWEITER_SCENE",
  DRITTER_SCENE: "DRITTER_SCENE",
  VIERTER_SCENE: "VIERTER_SCENE",
  ENDE_SCENE: "ENDE_SCENE",
  //Overlays, die über der aktuellen Scene liegen (Menü, Textfeld, Beenden-Abfrage)
  MENU_SCENE: "MENU_SCENE",
  TEXT_SCENE: "TEXT_SCENE",
  QUIT_SCENE: "QUIT_SCENE",
});
