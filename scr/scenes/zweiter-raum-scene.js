import { SCENE_KEYS } from "../common/scene-keys.js";
import { BaseRoomScene } from "../common/base-room-scene.js";
import { Spieler } from "../common/spieler.js";

//In diesem Raum befinden sich: frauInBlauRaum2, Tasse, Pilzkorb, Ofen & Kuchen

export class ZweiterRaumScene extends BaseRoomScene {
  #weiterZone;

  constructor() {
    super({ key: SCENE_KEYS.ZWEITER_SCENE });
    console.log("zweiter-raum-scene wurde erstellt");
  }

  init() {
    //Basis-Initialisierung
    super.init();

    this.raumNummer = 2;
    //Startbild der Spielfigur = Blickrichtung (Frame 10 im "cat"-Spritesheet = Stehpose nach oben, siehe spieler.js)
    this.spawnFrame = 10;

    //Dialog-Zustand dieses Raums zurücksetzen (Flags "raum2_...")
    this.initialisiereRaumZustand();
  }

  preload() {
    super.preload();
    this.#loadImages();
    this.#loadSpriteSheets();
  }

  create() {
    //Raum bauen
    const map = this.make.tilemap({ key: "JSONzweiterRaum" });
    const tileset1 = map.addTilesetImage("kitchen_v1", "zweiter_asset1");
    const tileset2 = map.addTilesetImage("BaseChip_pipo", "zweiter_asset2");

    //Versatz berechnen, damit der Raum mittig auf dem Feld liegt
    this.zentriereRaum(map);

    this.erstelleLayer(map, "BodenLayer", [tileset1, tileset2]);
    this.erstelleLayer(map, "WaendeLayer", [tileset1, tileset2]);
    this.erstelleLayer(map, "MoebelLayer", [tileset1, tileset2]);
    const tuerLayer = this.erstelleLayer(map, "TuerLayer", [
      tileset1,
      tileset2,
    ]);
    this.erstelleLayer(map, "KleinkramLayer", [tileset1, tileset2]);

    //Collision hinzufügen
    const hindernisse = this.erstelleCollisionGruppe(map);

    //Zone für Raumwechsel
    const weiterStelle = map.findObject(
      "WeiterLayer",
      (obj) => obj.name === "weiter",
    );
    this.#weiterZone = this.erstelleInteraktionsZone(
      this.versetzeX(weiterStelle.x),
      this.versetzeY(weiterStelle.y),
      weiterStelle.width,
      weiterStelle.height,
    );
    this.#weiterZone.setOrigin(0);

    //Spieler erstellen und mit Collision verbinden
    const spawnPoint = map.findObject(
      "SpawnLayer",
      (obj) => obj.name === "Spawn",
    );
    this.spieler = new Spieler(
      this,
      this.versetzeX(spawnPoint.x),
      this.versetzeY(spawnPoint.y),
      this.spawnFrame,
    );
    this.physics.add.collider(this.spieler, hindernisse);

    //Interaktionsraum der Tür (Bereich, in dem der Spieler K drücken kann):
    //Ohne x / y beginnt er an der oberen linken Ecke der Barriere. 24x32 = etwas schmaler als eine Kachel, eine Kachel hoch
    this.richteTuerEin({
      map,
      layer: tuerLayer,
      interaktionsraum: { breite: 24, hoehe: 32 },
    });

    //Extra Layer die über der Spielerfigur sichtbar sein sollen (damit es nicht so aussieht, als würde der Spieler über diese drüber laufen)
    this.erstelleLayer(map, "ueberSpielerLayer", [tileset1, tileset2]);

    //Bewegung Kamera setzen
    this.cameras.main.startFollow(this.spieler);
    this.setzeKameraGrenzen(map);

    //-------------NPCs & Gegenstände-------------
    //interaktionsraum = Bereich, in dem der Spieler mit dem NPC sprechen kann (relativ zur oberen linken Ecke des NPCs, siehe erstelleNpcs).
    //Der NPC ist 32x32 groß. dx: -16 verschiebt die Zone um eine halbe Kachel nach links, sie ist 16 breit und 32 hoch:
    //ein schmaler Streifen direkt links neben dem NPC
    this.erstelleNpcs(map, [
      {
        tiled: "npc",
        objekt: "frauInBlauRaum2",
        textur: "frauInBlauRaum2",
        //Frame im Spritesheet = Blickrichtung des NPCs (Frame 4 = nach links)
        frame: 4,
        interaktionsraum: { dx: -16, breite: 16, hoehe: 32 },
      },
    ]);
    this.erstelleGegenstaende(map, [
      "kuchen",
      "ofen",
      { tiled: "schluessel", objekt: "pilzkorb" }, //Pilzkorb, in dem der Schlüssel liegt
      "tasse",
    ]);
  }

  update() {
    //Bewegung, Menü-Taste, Hinweise, Dialoge und Tür
    super.update();

    //Wechsel zum nächsten Raum
    //Nur möglich, wenn die Tür offen ist
    const spielerVorWeiter = this.physics.overlap(
      this.spieler,
      this.#weiterZone,
    );
    if (this.istTuerOffen() && spielerVorWeiter) {
      this.raumWechsel();
    }
  }

  //-------------Funktionen-------------
  #loadImages() {
    this.load.image("zweiter_asset1", "assets/zweiter-raum/kitchen_v1.png");
    this.load.image("zweiter_asset2", "assets/zweiter-raum/BaseChip_pipo.png");
    this.load.tilemapTiledJSON(
      "JSONzweiterRaum",
      "assets/zweiter-raum/zweiter-raum.JSON",
    );
  }

  #loadSpriteSheets() {
    this.load.spritesheet(
      "frauInBlauRaum2",
      "assets/charaktere/Teacher fmale 01.png",
      {
        frameWidth: 32,
        frameHeight: 32,
      },
    );
  }
}
