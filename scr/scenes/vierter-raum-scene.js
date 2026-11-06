import { SCENE_KEYS } from "../common/scene-keys.js";
import { BaseRoomScene } from "../common/base-room-scene.js";
import { Spieler } from "../common/spieler.js";

/*In diesem Raum befinden sich: Dämon, Holzfäller, Fischer, Frau mit Wäsche, Dubioser Mann, "Gesucht"-Poster, Warnschild,
Wegweiser, Weg in den düsteren Wald, Statue, Vogelscheuche, Credits (Teil A) & Credits (Teil B)*/

//Letzter Raum: Er hat keine Tür mit Schlüssel. Stattdessen blockiert eine Barriere den Ausgang,
//bis das Gespräch mit dem Dämon (Boss) mit "Ja" abgeschlossen wurde (siehe update).
export class VierterRaumScene extends BaseRoomScene {
  #weiterBarriere;
  #weiterZone;

  constructor() {
    super({ key: SCENE_KEYS.VIERTER_SCENE });
    console.log("vierter-raum-scene wurde erstellt");
  }

  init() {
    //Basis-Initialisierung
    super.init();

    this.raumNummer = 4;
    //Startbild der Spielfigur = Blickrichtung (Frame 1 im "cat"-Spritesheet = Stehpose nach unten, siehe spieler.js)
    this.spawnFrame = 1;

    //Dialog-Zustand dieses Raums zurücksetzen (Flags "raum4_...")
    this.initialisiereRaumZustand();
  }

  preload() {
    super.preload();
    this.#loadImages();
    this.#loadSpriteSheets();
  }

  create() {
    //Raum bauen
    const map = this.make.tilemap({ key: "JSONvierterRaum" });
    const tileset1 = map.addTilesetImage("BaseChip_pipo", "vierter_asset1");
    const tileset2 = map.addTilesetImage("addwork", "vierter_asset2");
    const tileset3 = map.addTilesetImage("[A]Water_pipo", "vierter_asset3");
    const tileset4 = map.addTilesetImage("[A]Flower_pipo", "vierter_asset4");
    const tileset5 = map.addTilesetImage(
      "12_colorful_bugs_sheet",
      "vierter_asset5",
    );

    //Versatz berechnen, damit der Raum mittig auf dem Feld liegt
    this.zentriereRaum(map);

    this.erstelleLayer(map, "BodenLayer", [
      tileset1,
      tileset2,
      tileset3,
      tileset4,
      tileset5,
    ]);
    this.erstelleLayer(map, "WaendeLayer", [
      tileset1,
      tileset2,
      tileset3,
      tileset4,
      tileset5,
    ]);
    this.erstelleLayer(map, "DachLayer", [
      tileset1,
      tileset2,
      tileset3,
      tileset4,
      tileset5,
    ]);
    this.erstelleLayer(map, "TuerLayer", [
      tileset1,
      tileset2,
      tileset3,
      tileset4,
      tileset5,
    ]);
    this.erstelleLayer(map, "Objekte1Layer", [
      tileset1,
      tileset2,
      tileset3,
      tileset4,
      tileset5,
    ]);
    this.erstelleLayer(map, "Objekte2Layer", [
      tileset1,
      tileset2,
      tileset3,
      tileset4,
      tileset5,
    ]);

    //Collision hinzufügen
    const hindernisse = this.erstelleCollisionGruppe(map);

    //Dynamische Collision vor dem weiter
    //(Objekt-Layer "weiterBarriereLayer": diese Wand blockiert den Ausgang und wird in update() entfernt)
    const weiterBarriereLayer = this.erstelleCollisionGruppe(
      map,
      "weiterBarriereLayer",
    );

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
    //Der Collider wird gemerkt, damit er später wieder entfernt werden kann
    this.#weiterBarriere = this.physics.add.collider(
      this.spieler,
      weiterBarriereLayer,
    );

    //Extra Layer die über der Spielerfigur sichtbar sein sollen (damit es nicht so aussieht, als würde der Spieler über diese drüber laufen)
    this.erstelleLayer(map, "ueberSpielerLayer", [
      tileset1,
      tileset2,
      tileset3,
      tileset4,
      tileset5,
    ]);

    //Bewegung Kamera setzen
    this.cameras.main.startFollow(this.spieler);
    this.setzeKameraGrenzen(map);

    //-------------NPCs & Gegenstände-------------
    //interaktionsraum = Bereich, in dem der Spieler mit dem NPC sprechen kann (relativ zur oberen linken Ecke des NPCs, siehe erstelleNpcs).
    //Die NPCs sind 32x32 groß und blockieren den Spieler, deshalb liegt die Zone jeweils als schmaler Streifen direkt neben dem NPC:
    //- dy: 32   => direkt UNTER dem NPC (eine Kachel nach unten)
    //- dx: 32   => direkt RECHTS neben dem NPC (eine Kachel nach rechts)
    //- dy: -16  => direkt ÜBER dem NPC (halbe Kachel nach oben, Zone ist 16 hoch)
    this.erstelleNpcs(map, [
      {
        tiled: "holzNpc",
        objekt: "mannInGruenRaum4",
        textur: "mannInGruenRaum4",
        //Frame im Spritesheet = Blickrichtung des NPCs (Frame 1 = nach unten)
        frame: 1,
        interaktionsraum: { dy: 32, breite: 32, hoehe: 16 },
      },
      {
        tiled: "waescheNpc",
        objekt: "alteFrauRaum4",
        textur: "alteFrauRaum4",
        frame: 1,
        interaktionsraum: { dy: 32, breite: 32, hoehe: 16 },
      },
      {
        tiled: "fischerNpc",
        objekt: "mannInOrangeRaum4",
        textur: "mannInOrangeRaum4",
        //Frame 7 = nach rechts
        frame: 7,
        interaktionsraum: { dx: 32, breite: 16, hoehe: 32 },
      },
      {
        tiled: "dubioserNpc",
        objekt: "mannMitRobeRaum4",
        textur: "mannMitRobeRaum4",
        //Frame 10 = nach oben
        frame: 10,
        interaktionsraum: { dy: -16, breite: 32, hoehe: 16 },
      },
      //Der Dämon ist größer als die anderen NPCs: sein Sprite ist 96x96 (nicht 32x32).
      //dx: 40 / breite: 16 => der Streifen liegt waagerecht mittig (96 / 2 - 16 / 2 = 40),
      //dy: 96 => er beginnt direkt unter dem Sprite (96 = Spritehöhe) und ist 64 hoch, damit der Spieler ihn beim Herankommen sicher berührt
      {
        tiled: "boss",
        objekt: "daemonRaum4",
        textur: "daemonRaum4",
        frame: 9,
        interaktionsraum: { dx: 40, dy: 96, breite: 16, hoehe: 64 },
        automatisch: true, //Dialog startet beim Betreten der Zone
      },
    ]);
    this.erstelleGegenstaende(map, [
      "credits1",
      "credits2",
      "gesuchtPoster",
      "statuen",
      "versperrterWeg",
      "vogelscheuche",
      "warnschild",
      "wegweiser",
    ]);
  }

  update() {
    //Bewegung, Menü-Taste, Hinweise und Dialoge
    super.update();

    //Sobald der Boss mit "Ja" abgeschlossen wurde, wird die Barriere vor dem Ausgang entfernt
    if (this.istFertig("daemonRaum4") && this.#weiterBarriere) {
      this.physics.world.removeCollider(this.#weiterBarriere);
      this.#weiterBarriere = null; //null = Barriere ist weg (verhindert, dass sie jeden Frame erneut entfernt wird)
    }

    //Wechsel zum nächsten Raum
    //Hier ohne Tür-Prüfung: Die Barriere verhindert, dass der Spieler die Zone vorher erreicht
    const spielerVorWeiter = this.physics.overlap(
      this.spieler,
      this.#weiterZone,
    );

    if (spielerVorWeiter) {
      this.raumWechsel();
    }
  }

  //-------------Funktionen-------------
  #loadImages() {
    this.load.image("vierter_asset1", "assets/vierter-raum/BaseChip_pipo.png");
    this.load.image("vierter_asset2", "assets/vierter-raum/addwork.png");
    this.load.image("vierter_asset3", "assets/vierter-raum/[A]Water_pipo.png");
    this.load.image("vierter_asset4", "assets/vierter-raum/[A]Flower_pipo.png");
    this.load.image(
      "vierter_asset5",
      "assets/vierter-raum/12_colorful_bugs_sheet.png",
    );
    this.load.tilemapTiledJSON(
      "JSONvierterRaum",
      "assets/vierter-raum/vierter-raum.JSON",
    );
  }

  #loadSpriteSheets() {
    this.load.spritesheet(
      "mannInGruenRaum4",
      "assets/charaktere/Male 03-4.png",
      {
        frameWidth: 32,
        frameHeight: 32,
      },
    );
    this.load.spritesheet(
      "alteFrauRaum4",
      "assets/charaktere/Female 19-3.png",
      {
        frameWidth: 32,
        frameHeight: 32,
      },
    );
    this.load.spritesheet(
      "mannInOrangeRaum4",
      "assets/charaktere/Male 14-1.png",
      {
        frameWidth: 32,
        frameHeight: 32,
      },
    );
    this.load.spritesheet(
      "mannMitRobeRaum4",
      "assets/charaktere/Enemy 02-1.png",
      {
        frameWidth: 32,
        frameHeight: 32,
      },
    );
    //Der Dämon hat ein größeres Spritesheet: 96x96 px pro Bild statt 32x32
    this.load.spritesheet("daemonRaum4", "assets/charaktere/Boss 01.png", {
      frameWidth: 96,
      frameHeight: 96,
    });
  }
}
