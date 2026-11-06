import { SCENE_KEYS } from "../common/scene-keys.js";
import { BaseRoomScene } from "../common/base-room-scene.js";
import { Spieler } from "../common/spieler.js";

//In diesem Raum befinden sich: mannMitHutRaum3, nerdRaum3, Topf voll Erde, Gästebuch & Karte der Literatur

export class DritterRaumScene extends BaseRoomScene {
  #weiterZone;

  constructor() {
    super({ key: SCENE_KEYS.DRITTER_SCENE });
    console.log("dritter-raum-scene wurde erstellt");
  }

  init() {
    //Basis-Initialisierung
    super.init();

    this.raumNummer = 3;
    //Startbild der Spielfigur = Blickrichtung (Frame 4 im "cat"-Spritesheet = Stehpose nach links, siehe spieler.js)
    this.spawnFrame = 4;

    //Dialog-Zustand dieses Raums zurücksetzen (Flags "raum3_...")
    this.initialisiereRaumZustand();
  }

  preload() {
    super.preload();
    this.#loadImages();
    this.#loadSpriteSheets();
  }

  create() {
    //Raum bauen
    const map = this.make.tilemap({ key: "JSONdritterRaum" });
    const tileset1 = map.addTilesetImage("BaseChip_pipo", "dritter_asset1");

    //Versatz berechnen, damit der Raum mittig auf dem Feld liegt
    this.zentriereRaum(map);

    this.erstelleLayer(map, "BodenLayer", [tileset1]);
    this.erstelleLayer(map, "WaendeLayer", [tileset1]);
    this.erstelleLayer(map, "MoebelLayer", [tileset1]);
    const tuerLayer = this.erstelleLayer(map, "TuerLayer", [tileset1]);
    this.erstelleLayer(map, "KleinkramLayer", [tileset1]);

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
    //64x16 = zwei Kacheln breit, eine halbe hoch. originY: 1 verankert die Zone an ihrer UNTERKANTE,
    //sie liegt also direkt oberhalb der Barriere statt darunter (hier steht der Spieler vor der Tür oberhalb der Barriere)
    this.richteTuerEin({
      map,
      layer: tuerLayer,
      interaktionsraum: { breite: 64, hoehe: 16, originY: 1 },
    });

    //Bewegung Kamera setzen
    this.cameras.main.startFollow(this.spieler);
    this.setzeKameraGrenzen(map);

    //-------------NPCs & Gegenstände-------------
    //interaktionsraum = Bereich, in dem der Spieler mit dem NPC sprechen kann (relativ zur oberen linken Ecke des NPCs, siehe erstelleNpcs).
    //Der NPC ist 32x32 groß, die Zone ragt über ihn hinaus, damit der Spieler sie von außen berühren kann:
    //nerd: 48 breit = 16px nach rechts, bruderEins: 48 hoch (32 + 16) = 16px nach unten
    this.erstelleNpcs(map, [
      {
        tiled: "nerd",
        objekt: "nerdRaum3",
        textur: "nerdRaum3",
        //Frame im Spritesheet = Blickrichtung des NPCs (Frame 7 = nach rechts)
        frame: 7,
        interaktionsraum: { breite: 48, hoehe: 32 },
      },
      {
        tiled: "bruderEins",
        objekt: "mannMitHutRaum3",
        textur: "mannMitHutRaum3",
        //Frame 1 = nach unten
        frame: 1,
        interaktionsraum: { breite: 32, hoehe: 32 + 16 },
      },
    ]);
    this.erstelleGegenstaende(map, ["gaestebuch", "karte", "topf"]);
  }

  update() {
    //Bewegung, Menü-Taste, Hinweise und Dialoge
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
    this.load.image("dritter_asset1", "assets/dritter-raum/BaseChip_pipo.png");
    this.load.tilemapTiledJSON(
      "JSONdritterRaum",
      "assets/dritter-raum/dritter-raum.JSON",
    );
  }

  #loadSpriteSheets() {
    this.load.spritesheet(
      "nerdRaum3",
      "assets/charaktere/pipo-charachip_otaku01.png",
      {
        frameWidth: 32,
        frameHeight: 32,
      },
    );
    this.load.spritesheet(
      "mannMitHutRaum3",
      "assets/charaktere/Male 04-1.png",
      {
        frameWidth: 32,
        frameHeight: 32,
      },
    );
  }
}
