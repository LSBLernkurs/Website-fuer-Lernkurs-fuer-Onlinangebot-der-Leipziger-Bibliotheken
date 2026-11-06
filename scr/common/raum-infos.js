import { ANZAHL_RAEUME } from "../common/raum-wechsel.js";

//Holt Raumnamen und Raumdauer aus der Registry (kommen aus dem Google Sheet).
//Sind keine Daten geladen, werden Platzhalter zurückgegeben.
//Rückgabe: { titel: [...], dauer: [...] }, Index 0 = Raum 1
export function holeRaumInfos(registry) {
  //wurden in der preload-scene aus dem Sheet gelesen und in der Registry abgelegt
  const geladeneNamen = registry.get("raumNamen");
  const geladeneDauern = registry.get("raumDauer");

  //Platzhalter: "Raum 1", "Raum 2", ...
  const titel =
    geladeneNamen?.length > 0
      ? geladeneNamen
      : Array.from({ length: ANZAHL_RAEUME }, (_, i) => `Raum ${i + 1}`);

  //Platzhalter: leere Texte
  const dauer =
    geladeneDauern?.length > 0 ? geladeneDauern : Array(ANZAHL_RAEUME).fill("");

  return { titel, dauer };
}
