import { SCENE_KEYS } from "./scene-keys.js";
import { logger } from "./logger.js";

// Index 0 = Taste "1" = erster Raum
const RAUM_SCENES = [
  SCENE_KEYS.ERSTER_SCENE,
  SCENE_KEYS.ZWEITER_SCENE,
  SCENE_KEYS.DRITTER_SCENE,
  SCENE_KEYS.VIERTER_SCENE,
];

export function holeRaumKey(raumZahl) {
  return RAUM_SCENES[raumZahl - 1];
}

export function wechsleRaum(menuScene, raumZahl, aktuelleScene) {
  const zielKey = holeRaumKey(raumZahl);
  if (!zielKey || zielKey === aktuelleScene) return; //falls Fehler oder Spieler bereits in diesem Raum

  logger.log("raum_gewaehlt", { von: aktuelleScene, nach: zielKey });

  menuScene.scene.stop(aktuelleScene); //pausierten Raum beenden
  menuScene.scene.start(zielKey); //beendet das Menü und startet den Zielraum
}
