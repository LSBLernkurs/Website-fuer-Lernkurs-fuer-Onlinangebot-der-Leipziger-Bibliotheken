import { SCENE_KEYS } from "../common(keys)/scene-keys.js";
import { BaseRoomScene } from "../common(keys)/base-room-scene.js";
import { Player } from "../common(keys)/player.js";

/* 
In dieser Scene werden aus dem Google Sheet mit den Texten folgende IDs verwendet:
ID[] = Carl
*/

export class DritterRaumScene extends BaseRoomScene {
  #tuerlayer;
  #tuerZone;
  #tuerInteraktionsraum;
  #playerVorTuer;
  #npcZone;
  #npcInteraktionsraum;
  #playerVorNpc;
  #npcAuswahl;
  #schluessel;
  #tuerBarriere;
  #tuerOffen;
  #weiterZone;
  #playerVorWeiter;
  #neueScene;
  #linkErhalten;

  constructor() {
    super({ key: SCENE_KEYS.DRITTER_SCENE });
    console.log("dritter-raum-scene wurde erstellt");
  }

  init() {
    //Basis-Initialisierung
    super.init();

    this.raumNummer = 3;
    this.spawnFrame = 4;

    this.#ladeDialogAuswahlen();

    this.#linkErhalten = false;
    this.#schluessel = false;
    this.#tuerOffen = false;
  }

  preload() {
    this.#loadImages();
    this.#loadSpriteSheets();
  }

  create() {
    //Raum bauen
    const map = this.make.tilemap({ key: "JSONdritterRaum" });
    const tileset1 = map.addTilesetImage("BaseChip_pipo", "dritter_asset1");

    //Versatz berechnen, damit der Raum mittig auf dem Feld liegt
    this.zentriereRaum(map);

    // eslint-disable-next-line no-unused-vars
    const boden = this.erstelleLayer(map, "BodenLayer", [tileset1]);
    // eslint-disable-next-line no-unused-vars
    const waende = this.erstelleLayer(map, "WaendeLayer", [tileset1]);
    // eslint-disable-next-line no-unused-vars
    const moebel = this.erstelleLayer(map, "MoebelLayer", [tileset1]);
    this.#tuerlayer = this.erstelleLayer(map, "TuerLayer", [tileset1]);
    // eslint-disable-next-line no-unused-vars
    const kleinkram = this.erstelleLayer(map, "KleinkramLayer", [tileset1]);

    //Collision hinzufügen
    const hindernisse = this.erstelleCollisionGruppe(map);

    //Dynamische Collision an der Tür
    const tuerCollision = map.findObject(
      "TuerBarriereLayer",
      (obj) => obj.name === "TuerBarriere",
    );
    if (tuerCollision) {
      this.#tuerZone = this.add
        .zone(
          this.versetzeX(tuerCollision.x),
          this.versetzeY(tuerCollision.y),
          tuerCollision.width,
          tuerCollision.height,
        )
        .setOrigin(0);
      this.physics.add.existing(this.#tuerZone, true); //true = statistisch
    }

    //Interaktionsraum vor der Tür
    this.#tuerInteraktionsraum = this.erstelleInteraktionsZone(
      this.#tuerZone.x,
      this.#tuerZone.y,
      64,
      16,
    );
    this.#tuerInteraktionsraum.setOrigin(0, 1);

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

    //Zielscene setzen
    this.#neueScene = SCENE_KEYS.VIERTER_SCENE;

    //Spieler erstellen und mit Collision verbinden
    const spawnPoint = map.findObject(
      "SpawnLayer",
      (obj) => obj.name === "Spawn",
    );
    this.player = new Player(
      this,
      this.versetzeX(spawnPoint.x),
      this.versetzeY(spawnPoint.y),
      this.spawnFrame,
    );
    this.physics.add.collider(this.player, hindernisse);
    this.#tuerBarriere = this.physics.add.collider(this.player, this.#tuerZone);

    //Bewegung Kamera setzen
    this.cameras.main.startFollow(this.player);
    this.setzeKameraGrenzen(map);

    //NPC erstellen
    const npcStelle = map.findObject(
      "InteraktionsLayer",
      (obj) => obj.name === "npc",
    );
    this.physics.add
      .sprite(
        this.versetzeX(npcStelle.x),
        this.versetzeY(npcStelle.y),
        "carl",
        7,
      )
      .setOrigin(0);

    this.#npcZone = this.erstelleStatischeZone(
      this.versetzeX(npcStelle.x),
      this.versetzeY(npcStelle.y),
      npcStelle.width,
      npcStelle.height,
    );

    //Interaktionsraum vor NPC
    this.#npcInteraktionsraum = this.erstelleInteraktionsZone(
      this.#npcZone.x,
      this.#npcZone.y,
      48,
      32,
    );
    this.#npcInteraktionsraum.setOrigin(0);

    this.#spielerErhaeltSchluessel();
  }

  update() {
    //Dialoge
    this.#ladeDialogAuswahlen();

    //Bewegung und Menü-Taste (aus BaseRoomScene)
    super.update();

    //Overlap prüfen
    this.#playerVorNpc = this.physics.overlap(
      this.player,
      this.#npcInteraktionsraum,
    );
    this.#playerVorTuer = this.physics.overlap(
      this.player,
      this.#tuerInteraktionsraum,
    );

    //Hinweisanzeige
    const interaktionen = [
      {
        zone: this.#tuerInteraktionsraum,
        aktiv: this.#schluessel && !this.#tuerOffen,
        text: "Drücke K um den Schlüssel zu nutzen.",
      },
      {
        zone: this.#npcInteraktionsraum,
        aktiv: true,
        text: "Drücke I um zu interagieren.",
      },
    ];

    let hinweisGezeigt = false;
    for (const { zone, aktiv, text } of interaktionen) {
      const overlap = this.physics.overlap(this.player, zone);
      if (overlap && aktiv && !hinweisGezeigt) {
        this.interaktionsHinweisAnzeigen(zone.x, zone.y, text);
        hinweisGezeigt = true;
      }
      if (zone === this.#npcInteraktionsraum) {
        this.#playerVorNpc = overlap;
      }
      if (zone === this.#tuerInteraktionsraum) {
        this.#playerVorTuer = overlap;
      }
    }
    if (!hinweisGezeigt) this.hinweisAusblenden();

    //Interaktion mit NPC
    if (this.#playerVorNpc && Phaser.Input.Keyboard.JustDown(this.keys.i)) {
      if (this.#playerVorNpc) {
        this.openTextfeld("39", "carl");
      } else {
        console.log("Fehler beim Laden vom Text vom NPC");
      }
    }
    /*if (this.#npcAuswahl) {
      this.#linkErhalten = true;
    }
    if (this.#playerVorNpc && Phaser.Input.Keyboard.JustDown(this.keys.i)) {
      if (this.#linkErhalten) {
        this.openTextfeld('44', 'carl');
      } else if (this.#npcAuswahl === null) {
        this.openTextfeld('39', 'carl');
      } else if (!this.#npcAuswahl) {
        this.openTextfeld('42', 'carl');
      } else {
        console.log('Fehler beim Laden vom Text vom NPC');
      }
    }*/

    //Tür und dessen Barriere deaktivieren
    if (
      this.#schluessel &&
      !this.#tuerOffen &&
      this.#playerVorTuer &&
      Phaser.Input.Keyboard.JustDown(this.keys.k)
    ) {
      this.#openTuer();
    }

    //Wechsel zum nächsten Raum
    this.#playerVorWeiter = this.physics.overlap(this.player, this.#weiterZone);

    if (this.#tuerOffen && this.#playerVorWeiter) {
      this.raumWechsel(this.#neueScene);
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
      "carl",
      "assets/characters/pipoya-character-sprites/other/pipo-charachip_otaku01.png",
      {
        frameWidth: 32,
        frameHeight: 32,
      },
    );
  }

  #ladeDialogAuswahlen() {
    const gespeicherteAuswahlen = this.registry.get("dialogAuswahlen") || {};
    this.#npcAuswahl = gespeicherteAuswahlen["carl"] ?? null;
  }

  #spielerErhaeltSchluessel() {
    this.#schluessel = true;
  }

  #openTuer() {
    this.#schluessel = false;
    this.#tuerOffen = true;
    if (this.#tuerBarriere) {
      this.physics.world.removeCollider(this.#tuerBarriere);
    }
    this.#tuerlayer.setVisible(false);
  }
}
