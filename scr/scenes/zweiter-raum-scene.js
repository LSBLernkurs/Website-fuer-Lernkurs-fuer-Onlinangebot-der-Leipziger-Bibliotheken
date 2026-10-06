import { SCENE_KEYS } from "../common(keys)/scene-keys.js";
import { BaseRoomScene } from "../common(keys)/base-room-scene.js";
import { Player } from "../common(keys)/player.js";

/* 
In dieser Scene werden aus dem Google Sheet mit den Texten folgende IDs verwendet:
ID[] = Jennifer
ID[] = Tasse
ID[] = Pilzkorb
*/

export class ZweiterRaumScene extends BaseRoomScene {
  #tuerlayer;
  #tuerZone;
  #tuerInteraktionsraum;
  #playerVorTuer;
  #npcZone;
  #npcInteraktionsraum;
  #playerVorNpc;
  #npcAuswahl;
  #tasseInteraktionsraum;
  #playerVorTasse;
  #tasseAuswahl;
  #pilzkorbInteraktionsraum;
  #playerVorPilzkorb;
  #schluessel;
  #tuerBarriere;
  #tuerOffen;
  #weiterZone;
  #playerVorWeiter;
  #neueScene;
  #spielerMitNpcGeredet;
  #tasseInhaltFertig;
  #tippVonNpc;
  #schluesselBekommen;

  constructor() {
    super({ key: SCENE_KEYS.ZWEITER_SCENE });
    console.log("zweiter-raum-scene wurde erstellt");
  }

  init() {
    //Basis-Initialisierung
    super.init();

    this.raumNummer = 2;
    this.spawnFrame = 10;

    this.#ladeDialogAuswahlen();

    this.#spielerMitNpcGeredet = false;
    this.#tasseInhaltFertig = false;
    this.#tippVonNpc = false;
    this.#schluesselBekommen = false;
    this.#schluessel = false;
    this.#tuerOffen = false;
  }

  preload() {
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

    // eslint-disable-next-line no-unused-vars
    const boden = this.erstelleLayer(map, "BodenLayer", [tileset1, tileset2]);
    // eslint-disable-next-line no-unused-vars
    const waende = this.erstelleLayer(map, "WaendeLayer", [tileset1, tileset2]);
    // eslint-disable-next-line no-unused-vars
    const moebel = this.erstelleLayer(map, "MoebelLayer", [tileset1, tileset2]);
    this.#tuerlayer = this.erstelleLayer(map, "TuerLayer", [
      tileset1,
      tileset2,
    ]);
    // eslint-disable-next-line no-unused-vars
    const kleinkram = this.erstelleLayer(map, "KleinkramLayer", [
      tileset1,
      tileset2,
    ]);

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
      24,
      32,
    );
    this.#tuerInteraktionsraum.setOrigin(0);

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
    this.#neueScene = SCENE_KEYS.DRITTER_SCENE;

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

    //Extra Layer die über der Spielerfigur sichtbar sein sollen (damit es nicht so aussieht, als würde der Spieler über diese drüber laufen)
    // eslint-disable-next-line no-unused-vars
    const ueberSpieler = this.erstelleLayer(map, "ueberSpielerLayer", [
      tileset1,
      tileset2,
    ]);

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
        "jennifer",
        4,
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
      this.#npcZone.x - 16,
      this.#npcZone.y,
      16,
      32,
    );
    this.#npcInteraktionsraum.setOrigin(0);

    //Tasse erstellen
    const tasseStelle = map.findObject(
      "InteraktionsLayer",
      (obj) => obj.name === "tasse",
    );

    //Interaktionsraum vor der Tasse
    this.#tasseInteraktionsraum = this.erstelleInteraktionsZone(
      this.versetzeX(tasseStelle.x),
      this.versetzeY(tasseStelle.y),
      tasseStelle.width,
      tasseStelle.height,
    );
    this.#tasseInteraktionsraum.setOrigin(0);

    //Pilzkorb (wo der Schlüssel liegt) erstellen
    const pilzkorbStelle = map.findObject(
      "InteraktionsLayer",
      (obj) => obj.name === "schluessel",
    );

    //Interaktionsraum vorm Pilzkorb
    this.#pilzkorbInteraktionsraum = this.erstelleInteraktionsZone(
      this.versetzeX(pilzkorbStelle.x),
      this.versetzeY(pilzkorbStelle.y),
      pilzkorbStelle.width,
      pilzkorbStelle.height,
    );
    this.#pilzkorbInteraktionsraum.setOrigin(0);
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
    this.#playerVorTasse = this.physics.overlap(
      this.player,
      this.#tasseInteraktionsraum,
    );
    this.#playerVorPilzkorb = this.physics.overlap(
      this.player,
      this.#pilzkorbInteraktionsraum,
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
      {
        zone: this.#tasseInteraktionsraum,
        aktiv: true,
        text: "Drücke I um zu interagieren.",
      },
      {
        zone: this.#pilzkorbInteraktionsraum,
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
      if (zone === this.#tasseInteraktionsraum) {
        this.#playerVorTasse = overlap;
      }
      if (zone === this.#pilzkorbInteraktionsraum) {
        this.#playerVorPilzkorb = overlap;
      }
      if (zone === this.#tuerInteraktionsraum) {
        this.#playerVorTuer = overlap;
      }
    }
    if (!hinweisGezeigt) this.hinweisAusblenden();

    //Interaktion mit NPC
    if (this.#npcAuswahl === true) {
      this.#tippVonNpc = true;
    }
    if (this.#playerVorNpc && Phaser.Input.Keyboard.JustDown(this.keys.i)) {
      if (this.#schluesselBekommen) {
        this.openTextfeld("35", "jennifer");
      } else if (this.#tippVonNpc && !this.#schluesselBekommen) {
        this.openTextfeld("34", "jennifer");
      } else if (this.#npcAuswahl === null && !this.#spielerMitNpcGeredet) {
        this.#spielerMitNpcGeredet = true;
        this.openTextfeld("19", "jennifer");
      } else if (
        this.#npcAuswahl === null &&
        this.#spielerMitNpcGeredet &&
        !this.#tasseInhaltFertig
      ) {
        this.openTextfeld("20", "jennifer");
      } else if (this.#npcAuswahl === null && this.#tasseInhaltFertig) {
        this.openTextfeld("28", "jennifer");
      } else if (!this.#npcAuswahl) {
        this.openTextfeld("31", "jennifer");
      } else {
        console.log("Fehler beim Laden vom Text vom NPC");
      }
    }

    //Interaktion mit Tasse
    if (this.#tasseAuswahl) {
      this.#tasseInhaltFertig = true;
    }
    if (this.#playerVorTasse && Phaser.Input.Keyboard.JustDown(this.keys.i)) {
      if (this.#tasseInhaltFertig) {
        this.openTextfeld("27", "tasse");
      } else if (this.#tasseAuswahl === null && !this.#spielerMitNpcGeredet) {
        this.openTextfeld("18", "tasse");
      } else if (this.#tasseAuswahl === null && this.#spielerMitNpcGeredet) {
        this.openTextfeld("21", "tasse");
      } else if (!this.#tasseAuswahl) {
        this.openTextfeld("24", "tasse");
      } else {
        console.log("Fehler beim Laden vom Text von der Tasse");
      }
    }

    //Interaktion mit Pilzkorb
    if (
      this.#playerVorPilzkorb &&
      Phaser.Input.Keyboard.JustDown(this.keys.i)
    ) {
      if (!this.#schluessel && this.#tippVonNpc) {
        this.#spielerErhaeltSchluessel();
        this.openTextfeld("36", "pilzkorb");
      } else if (this.#schluessel && this.#tippVonNpc) {
        this.openTextfeld("37", "pilzkorb");
      } else if (!this.#tippVonNpc) {
        this.openTextfeld("38", "pilzkorb");
      } else {
        console.log("Fehler beim Laden vom Text beim Pilzkorb");
      }
    }

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
    this.load.image("zweiter_asset1", "assets/zweiter-raum/kitchen_v1.png");
    this.load.image("zweiter_asset2", "assets/zweiter-raum/BaseChip_pipo.png");
    this.load.tilemapTiledJSON(
      "JSONzweiterRaum",
      "assets/zweiter-raum/zweiter-raum.JSON",
    );
  }

  #loadSpriteSheets() {
    this.load.spritesheet(
      "jennifer",
      "assets/characters/pipoya-character-sprites/japanese-school-characters/teachers/Teacher fmale 01.png",
      {
        frameWidth: 32,
        frameHeight: 32,
      },
    );
  }

  #ladeDialogAuswahlen() {
    const gespeicherteAuswahlen = this.registry.get("dialogAuswahlen") || {};
    this.#npcAuswahl = gespeicherteAuswahlen["jennifer"] ?? null;
    this.#tasseAuswahl = gespeicherteAuswahlen["tasse"] ?? null;
  }

  #spielerErhaeltSchluessel() {
    this.#schluessel = true;
    this.#schluesselBekommen = true;
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
