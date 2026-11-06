import { SCENE_KEYS } from "../common/scene-keys.js";
import { BaseRoomScene } from "../common/base-room-scene.js";
import { Spieler } from "../common/spieler.js";

//In diesem Raum befinden sich: Älterer Herr, Computer, Buch auf Tresen, schönes Bild, Buchregal & Sofa

export class ErsterRaumScene extends BaseRoomScene {
  //Die Tür besteht aus drei übereinanderliegenden Sprites (jeweils 32x32 px), die gemeinsam abgespielt werden
  #tuerAnimationOben;
  #tuerAnimationMitte;
  #tuerAnimationUnten;
  #weiterZone;

  constructor() {
    super({ key: SCENE_KEYS.ERSTER_SCENE });
    console.log("erster-raum-scene wurde erstellt");
  }

  init() {
    //Basis-Initialisierung
    super.init();

    this.raumNummer = 1;
    //Startbild der Spielfigur = Blickrichtung (Frame 10 im "cat"-Spritesheet = Stehpose nach oben, siehe spieler.js)
    this.spawnFrame = 10;

    //Dialog-Zustand dieses Raums zurücksetzen (Flags "raum1_...")
    this.initialisiereRaumZustand();
  }

  preload() {
    super.preload();
    this.#loadImages();
    this.#loadSpriteSheets();
  }

  create() {
    //Raum bauen
    const map = this.make.tilemap({ key: "JSONersterRaum" });
    const tileset1 = map.addTilesetImage("InteriorTilesLITE", "erster_asset1");
    const tileset2 = map.addTilesetImage("BaseChip_pipo", "erster_asset2");

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

    //Tür-Animation vorbereiten
    const tuerStelle = map.findObject(
      "InteraktionsLayer",
      (obj) => obj.name === "tuer",
    );
    const tuerWeltX = this.versetzeX(tuerStelle.x);
    const tuerWeltY = this.versetzeY(tuerStelle.y);
    //Tür besteht aus 3 Sprites
    //Das Tiled-Objekt "tuer" markiert die mittlere Kachel. Das obere Teil liegt 32px (eine Kachel) darüber,
    //das untere Teil 32px darunter (die Tür ist also 3 Kacheln = 96px hoch)
    this.#tuerAnimationOben = this.add
      .sprite(tuerWeltX, tuerWeltY - 32, "tuer")
      .setOrigin(0);
    this.#tuerAnimationMitte = this.add
      .sprite(tuerWeltX, tuerWeltY, "tuer")
      .setOrigin(0);
    this.#tuerAnimationUnten = this.add
      .sprite(tuerWeltX, tuerWeltY + 32, "tuer")
      .setOrigin(0);

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
    //Er beginnt bei y + 64, also direkt unter dem unteren Türteil (die Tür reicht von y - 32 bis y + 64),
    //und ist 32 breit (eine Kachel, wie die Tür) und 16 hoch (halbe Kachel, genug Platz zum Davorstehen)
    this.richteTuerEin({
      map,
      layer: tuerLayer,
      interaktionsraum: {
        x: tuerWeltX,
        y: tuerWeltY + 64,
        breite: 32,
        hoehe: 16,
      },
      beimOeffnen: (entferneBarriere) =>
        this.#spieleTuerAnimation(entferneBarriere),
    });

    //Extra Layer die über der Spielerfigur sichtbar sein sollen (damit es nicht so aussieht, als würde der Spieler über diese drüber laufen)
    this.erstelleLayer(map, "ueberSpielerLayer", [tileset1, tileset2]);

    //Bewegung Kamera setzen
    this.cameras.main.startFollow(this.spieler);
    this.setzeKameraGrenzen(map);

    //-------------NPCs & Gegenstände-------------
    //interaktionsraum = Bereich, in dem der Spieler mit dem NPC sprechen kann (relativ zur oberen linken Ecke des NPCs, siehe erstelleNpcs).
    //Der NPC ist 32x32 groß. Der Interaktionsraum ist hier 10px breiter und 16px höher (32 + 10 / 32 + 16),
    //damit er über die NPC-Kachel nach rechts und unten hinausragt und der Spieler ihn von dort berühren kann
    this.erstelleNpcs(map, [
      {
        tiled: "npcAlterHerr",
        objekt: "alterHerrRaum1",
        textur: "alterHerrRaum1",
        //Frame im Spritesheet = Blickrichtung des NPCs (Frame 1 = nach unten)
        frame: 1,
        interaktionsraum: { breite: 32 + 10, hoehe: 32 + 16 },
      },
    ]);
    this.erstelleGegenstaende(map, [
      "bild",
      "buchAufTresen",
      "buchregal",
      "computer",
      "sofa",
    ]);

    //Tür-Animation
    this.#createTuerAnimation();
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
    this.load.image(
      "erster_asset1",
      "assets/erster-raum/InteriorTilesLITE.png",
    );
    this.load.image("erster_asset2", "assets/erster-raum/BaseChip_pipo.png");
    this.load.tilemapTiledJSON(
      "JSONersterRaum",
      "assets/erster-raum/erster-raum.JSON",
    );
  }

  #loadSpriteSheets() {
    this.load.spritesheet("alterHerrRaum1", "assets/charaktere/Male 17-2.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("tuer", "assets/erster-raum/Door2_pipo.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
  }

  //Legt die drei Tür-Animationen an (je eine für Oberteil, Mittelteil, Unterteil)
  #createTuerAnimation() {
    if (this.anims.exists("tuerOben")) return; //nur einmal global anlegen

    //Frame-Nummern im Spritesheet "tuer": je 3 Bilder von geschlossen bis offen.
    //Die Teile liegen jeweils 6 Frames auseinander (= eine Zeile im Spritesheet weiter)
    const tuerAnims = {
      tuerOben: [36, 37, 38],
      tuerMitte: [42, 43, 44],
      tuerUnten: [48, 49, 50],
    };
    for (const [key, frames] of Object.entries(tuerAnims)) {
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers("tuer", { frames }),
        frameRate: 2, //langsam: 2 Bilder pro Sekunde
        repeat: 0, //0 = nur einmal abspielen (die Tür bleibt danach offen)
      });
    }
  }

  //Spielt die Animation ab. beiEnde wird aufgerufen, sobald die Tür offen ist (entfernt dann die Barriere)
  #spieleTuerAnimation(beiEnde) {
    this.#tuerAnimationOben.play("tuerOben");
    this.#tuerAnimationMitte.play("tuerMitte");
    this.#tuerAnimationUnten.play("tuerUnten");

    //"animationcomplete" ist der von Phaser vorgegebene Name des Events
    //Es reicht, auf ein Teil zu warten, da alle drei Animationen gleich lang sind
    this.#tuerAnimationOben.once("animationcomplete", beiEnde);
  }
}
