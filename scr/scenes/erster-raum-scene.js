import { SCENE_KEYS } from "../common(keys)/scene-keys.js";
import { BaseRoomScene } from "../common(keys)/base-room-scene.js";
import { Player } from "../common(keys)/player.js";

/* 
In dieser Scene werden aus dem Google Sheet mit den Texten folgende IDs verwendet:
ID[] = Alter Herr
ID[] = Computer
*/

export class ErsterRaumScene extends BaseRoomScene {
  #npcAlterHerr;
  #npcZone;
  #npcInteraktionsraum;
  #playerVorNpc;
  #npcAuswahl;
  #computerZone;
  #computerInteraktionsraum;
  #playerVorComputer;
  #computerAuswahl;
  #tuerlayer;
  #tuerZone;
  #tuerBarriere;
  #tueranimOben;
  #tueranimMitte;
  #tueranimUnten;
  #tuerInteraktionsraum;
  #playerVorTuer;
  #schluessel;
  #tuerOffen;
  #weiterZone;
  #playerVorWeiter;
  #neueScene;
  #playerEinmalMitNpcGeredet;
  #computerInhaltFertig;
  #schluesselBekommen;

  constructor() {
    super({ key: SCENE_KEYS.ERSTER_SCENE });
    console.log("erster-raum-scene wurde erstellt");
  }

  init() {
    //Basis-Initialisierung
    super.init();

    this.raumNummer = 1;
    this.spawnFrame = 10;

    this.#ladeDialogAuswahlen();

    this.#playerEinmalMitNpcGeredet = false;
    this.#computerInhaltFertig = false;
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
    const map = this.make.tilemap({ key: "JSONersterRaum" });
    const tileset1 = map.addTilesetImage("InteriorTilesLITE", "erster_asset1");
    const tileset2 = map.addTilesetImage("BaseChip_pipo", "erster_asset2");

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

    //Tür-Animation vorbereiten
    this.tuerTile = this.#tuerlayer.findTile((tile) => tile.index !== -1);
    const x = this.#tuerlayer.tileToWorldX(this.versetzeX(this.tuerTile.x));
    const y = this.#tuerlayer.tileToWorldY(this.versetzeY(this.tuerTile.y));
    this.#tueranimOben = this.add.sprite(x, y - 32, "tuer").setOrigin(0);
    this.#tueranimMitte = this.add.sprite(x, y, "tuer").setOrigin(0);
    this.#tueranimUnten = this.add.sprite(x, y + 32, "tuer").setOrigin(0);

    //Interaktionsraum vor der Tür
    this.#tuerInteraktionsraum = this.erstelleInteraktionsZone(
      x,
      y + 64,
      32,
      16,
    );
    this.#tuerInteraktionsraum.setOrigin(0);

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

    //Zone für Raumwechsel
    const weiterStelle = map.findObject(
      "WeiterLayer",
      (obj) => obj.name === "weiter",
    );
    this.#weiterZone = this.erstelleInteraktionsZone(
      weiterStelle.x,
      weiterStelle.y,
      weiterStelle.width,
      weiterStelle.height,
    );
    this.#weiterZone.setOrigin(0);

    //Zielscene setzen
    this.#neueScene = SCENE_KEYS.ZWEITER_SCENE;

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
      (obj) => obj.name === "NPC",
    );
    this.#npcAlterHerr = this.physics.add.sprite(
      this.versetzeX(npcStelle.x),
      this.versetzeY(npcStelle.y),
      "alter_Herr",
      1,
    );
    this.#npcZone = this.erstelleStatischeZone(
      this.#npcAlterHerr.x - 16,
      this.#npcAlterHerr.y - 16,
      this.#npcAlterHerr.width,
      this.#npcAlterHerr.height,
    );

    //Interaktionsraum vor NPC
    this.#npcInteraktionsraum = this.erstelleInteraktionsZone(
      this.#npcZone.x,
      this.#npcZone.y + 32,
      32,
      16,
    );
    this.#npcInteraktionsraum.setOrigin(0);

    //Computer erstellen
    const pcStelle = map.findObject(
      "InteraktionsLayer",
      (obj) => obj.name === "Computer",
    );
    this.#computerZone = this.erstelleStatischeZone(
      this.versetzeX(pcStelle.x),
      this.versetzeY(pcStelle.y),
      pcStelle.width,
      pcStelle.height,
    );

    //Interaktionsraum vor Computer
    this.#computerInteraktionsraum = this.erstelleInteraktionsZone(
      this.#computerZone.x,
      this.#computerZone.y + 32,
      32,
      16,
    );
    this.#computerInteraktionsraum.setOrigin(0);

    //Tür-Animation
    this.#createTuerAnimation();
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
    this.#playerVorComputer = this.physics.overlap(
      this.player,
      this.#computerInteraktionsraum,
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
        zone: this.#computerInteraktionsraum,
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
      if (zone === this.#npcInteraktionsraum) this.#playerVorNpc = overlap;
      if (zone === this.#computerInteraktionsraum)
        this.#playerVorComputer = overlap;
      if (zone === this.#tuerInteraktionsraum) this.#playerVorTuer = overlap;
    }
    if (!hinweisGezeigt) this.hinweisAusblenden();

    //Interaktion mit NPC
    if (this.#playerVorNpc && Phaser.Input.Keyboard.JustDown(this.keys.i)) {
      if (this.#schluesselBekommen) {
        this.openTextfeld("17", "alter_Herr");
      } else if (this.#npcAuswahl === null && !this.#computerInhaltFertig) {
        this.#playerEinmalMitNpcGeredet = true;
        this.openTextfeld("2", "alter_Herr");
      } else if (this.#npcAuswahl === null && this.#computerInhaltFertig) {
        this.openTextfeld("10", "alter_Herr");
      } else if (!this.#npcAuswahl) {
        this.openTextfeld("13", "alter_Herr");
      } else if (this.#npcAuswahl) {
        this.#spielerErhaeltSchluessel();
        this.openTextfeld("16", "alter_Herr");
      } else {
        console.log("Fehler beim Laden vom Text vom NPC");
      }
    }

    //Ineraktion mit Computer
    if (this.#computerAuswahl) {
      this.#computerInhaltFertig = true;
    }
    if (
      this.#playerVorComputer &&
      Phaser.Input.Keyboard.JustDown(this.keys.i)
    ) {
      if (this.#computerInhaltFertig) {
        this.openTextfeld("9", "computer");
      } else if (
        this.#computerAuswahl === null &&
        !this.#playerEinmalMitNpcGeredet
      ) {
        this.openTextfeld("1", "computer");
      } else if (
        this.#computerAuswahl === null &&
        this.#playerEinmalMitNpcGeredet
      ) {
        this.openTextfeld("3", "computer");
      } else if (!this.#computerAuswahl) {
        this.openTextfeld("6", "computer");
      } else {
        console.log("Fehler beim Laden vom Text vom Computer");
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
    this.load.spritesheet(
      "alter_Herr",
      "assets/characters/pipoya-character-sprites/male/Male 17-2.png",
      {
        frameWidth: 32,
        frameHeight: 32,
      },
    );
    this.load.spritesheet("tuer", "assets/erster-raum/Door2_pipo.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
  }

  #ladeDialogAuswahlen() {
    const gespeicherteAuswahlen = this.registry.get("dialogAuswahlen") || {};
    this.#npcAuswahl = gespeicherteAuswahlen["alter_Herr"] ?? null;
    this.#computerAuswahl = gespeicherteAuswahlen["computer"] ?? null;
  }

  #createTuerAnimation() {
    if (this.anims.exists("tuerOben")) return; //nur einmal global anlegen

    const tuerAnims = {
      tuerOben: [36, 37, 38],
      tuerMitte: [42, 43, 44],
      tuerUnten: [48, 49, 50],
    };
    for (const [key, frames] of Object.entries(tuerAnims)) {
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers("tuer", { frames }),
        frameRate: 2,
        repeat: 0,
      });
    }
  }

  #spielerErhaeltSchluessel() {
    this.#schluessel = true;
    this.#schluesselBekommen = true;
  }

  #openTuer() {
    this.#schluessel = false;
    this.#tuerOffen = true;

    this.#tueranimOben.play("tuerOben");
    this.#tueranimMitte.play("tuerMitte");
    this.#tueranimUnten.play("tuerUnten");

    // eslint-disable-next-line no-unused-vars
    this.#tueranimOben.once("animationcomplete", (animation, frame) => {
      //'animationcomplete' muss so heißen, da dass der Name für das Event ist, von Phaser vorgeschrieben
      if (animation.key === "tuerOben") {
        if (this.#tuerBarriere) {
          this.physics.world.removeCollider(this.#tuerBarriere);
        }
      }
    });
    this.#tuerlayer.setVisible(false);
  }
}
