import { SCENE_KEYS } from "./scene-keys.js";
import { logger } from "./logger.js";

//Reihenfolge der Räume im Spiel. Wer einen Raum hinzufügt, trägt ihn hier ein
//Index 0 = Taste "1" = erster Raum
const RAUM_SCENES = [
  SCENE_KEYS.ERSTER_SCENE,
  SCENE_KEYS.ZWEITER_SCENE,
  SCENE_KEYS.DRITTER_SCENE,
  SCENE_KEYS.VIERTER_SCENE,
];

//Wird vom Menü (Karte) und der Raumauswahl benutzt, um die Anzahl der Punkte/Tasten zu bestimmen
export const ANZAHL_RAEUME = RAUM_SCENES.length;

//Raumnummer (1-basiert, wie die Zahlen-Taste) => Scene-Key. Gibt es den Raum nicht, kommt undefined zurück
export function holeRaumKey(raumZahl) {
  return RAUM_SCENES[raumZahl - 1];
}

//Welche Scene kommt nach der aktuellen? Nach dem letzten Raum folgt die Ende-Scene.
export function holeNaechsteSceneKey(aktuelleScene) {
  const index = RAUM_SCENES.indexOf(aktuelleScene);
  if (index === -1) return undefined; //aktuelle Scene ist kein Raum
  return RAUM_SCENES[index + 1] ?? SCENE_KEYS.ENDE_SCENE;
}

//Raumwechsel über das Menü bzw. die Raumauswahl (menuScene = die Scene, aus der aufgerufen wird)
//raumZahl:       gewählter Raum (1-basiert)
//aktuelleScene:  Key des Raums, in dem der Spieler gerade ist (wird beendet)
export function wechsleRaum(menuScene, raumZahl, aktuelleScene) {
  const zielKey = holeRaumKey(raumZahl);
  if (!zielKey || zielKey === aktuelleScene) return; //falls Fehler oder Spieler bereits in diesem Raum

  logger.log("raum_gewaehlt", { von: aktuelleScene, nach: zielKey });

  menuScene.scene.stop(aktuelleScene); //pausierten Raum beenden
  menuScene.scene.start(zielKey); //beendet das Menü und startet den Zielraum
}
