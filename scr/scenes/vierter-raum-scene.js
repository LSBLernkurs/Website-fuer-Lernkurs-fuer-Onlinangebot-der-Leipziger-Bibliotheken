import { SCENE_KEYS } from "../common(keys)/scene-keys.js";
import { BaseRoomScene } from "../common(keys)/base-room-scene.js";
import { Player } from "../common(keys)/player.js";

/* 
In dieser Scene werden aus dem Google Sheet mit den Texten folgende IDs verwendet:
ID[] = Dämon
ID[] = Holzfäller
ID[] = Fischer
ID[] = Frau mit Wäsche
ID[] = Dubioser Mann
ID[] = Wegweiser
ID[] = Warnschild
ID[] = Weg in den düsteren Wald
ID[] = "Gesucht"-Poster
ID[] = Statuen
ID[] = Vogelscheuche
ID[] = Credits (Teil A)
ID[] = Credits (Teil B)
*/

export class VierterRaumScene extends BaseRoomScene {
  #tuerlayer;

  #holzNpcZone;
  #holzNpcInteraktionsraum;
  #playerVorHolzNpc;
  #holzNpcAuswahl;
  #waescheNpcZone;
  #waescheNpcInteraktionsraum;
  #playerVorWaescheNpc;
  #waescheNpcAuswahl;
  #fischerNpcZone;
  #fischerNpcInteraktionsraum;
  #playerVorFischerNpc;
  #fischerNpcAuswahl;
  #dubioserNpcZone;
  #dubioserNpcInteraktionsraum;
  #playerVorDubioserNpc;
  #dubioserNpcAuswahl;
  #bossNpcZone;
  #bossNpcInteraktionsraum;
  #playerVorBossNpc;
  #bossNpcZoneBetretenVorher;
  #bossNpcAuswahl;

  #credits1Interaktionsraum;
  #playerVorCredits1;
  #credits2Interaktionsraum;
  #playerVorCredits2;
  #gesuchtPosterInteraktionsraum;
  #playerVorGesuchtPoster;
  #statuenInteraktionsraum;
  #playerVorStatuen;
  #vogelscheucheInteraktionsraum;
  #playerVorVogelscheuche;
  #warnschildInteraktionsraum;
  #playerVorWarnschild;
  #wegweiserInteraktionsraum;
  #playerVorWegweiser;
  #versperrterWegInteraktionsraum;
  #playerVorVersperrterWeg;

  #bossNpcBereitsEinmalAngesprochen;
  #versperrtenWegGesehen;
  #personAufGesuchtPlakatErkannt;
  #holzNpcInhaltFertig;
  #waescheNpcInhaltFertig;
  #fischerNpcInhaltFertig;
  #dubioserNpcInhaltFertig;
  #bossNpcInhaltFertig;

  #weiterBarriere;
  #weiterZone;
  #playerVorWeiter;
  #neueScene;

  constructor() {
    super({ key: SCENE_KEYS.VIERTER_SCENE });
    console.log("vierter-raum-scene wurde erstellt");
  }

  init() {
    //Basis-Initialisierung
    super.init();

    this.raumNummer = 4;
    this.spawnFrame = 1;

    this.#ladeDialogAuswahlen();

    this.#bossNpcZoneBetretenVorher = false;
    this.#bossNpcBereitsEinmalAngesprochen = false;
    this.#versperrtenWegGesehen = false;
    this.#personAufGesuchtPlakatErkannt = false;
    this.#holzNpcInhaltFertig = false;
    this.#waescheNpcInhaltFertig = false;
    this.#fischerNpcInhaltFertig = false;
    this.#dubioserNpcInhaltFertig = false;
    this.#bossNpcInhaltFertig = false;
  }

  preload() {
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

    //Versatz berechnen, damit der Raum mittig auf dem Feld liegt
    this.zentriereRaum(map);

    // eslint-disable-next-line no-unused-vars
    const boden = this.erstelleLayer(map, "BodenLayer", [
      tileset1,
      tileset2,
      tileset3,
      tileset4,
    ]);
    // eslint-disable-next-line no-unused-vars
    const waende = this.erstelleLayer(map, "WaendeLayer", [
      tileset1,
      tileset2,
      tileset3,
      tileset4,
    ]);
    // eslint-disable-next-line no-unused-vars
    const dach = this.erstelleLayer(map, "DachLayer", [
      tileset1,
      tileset2,
      tileset3,
      tileset4,
    ]);
    this.#tuerlayer = this.erstelleLayer(map, "TuerLayer", [
      tileset1,
      tileset2,
      tileset3,
      tileset4,
    ]);
    // eslint-disable-next-line no-unused-vars
    const objekte1 = this.erstelleLayer(map, "Objekte1Layer", [
      tileset1,
      tileset2,
      tileset3,
      tileset4,
    ]);
    // eslint-disable-next-line no-unused-vars
    const objekte2 = this.erstelleLayer(map, "Objekte2Layer", [
      tileset1,
      tileset2,
      tileset3,
      tileset4,
    ]);

    //Collision hinzufügen
    const hindernisse = this.erstelleCollisionGruppe(map);

    //Dynamische Collision vor dem weiter
    const weiterBarriere = this.erstelleCollisionGruppe(
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

    //Zielscene setzen
    this.#neueScene = SCENE_KEYS.ENDE_SCENE;

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
    this.#weiterBarriere = this.physics.add.collider(
      this.player,
      weiterBarriere,
    );

    //Extra Layer die über der Spielerfigur sichtbar sein sollen (damit es nicht so aussieht, als würde der Spieler über diese drüber laufen)
    // eslint-disable-next-line no-unused-vars
    const ueberSpieler = this.erstelleLayer(map, "ueberSpielerLayer", [
      tileset1,
      tileset2,
      tileset3,
      tileset4,
    ]);

    //Bewegung Kamera setzen
    this.cameras.main.startFollow(this.player);
    this.setzeKameraGrenzen(map);

    //-------------NPCs-------------
    //holzNPC erstellen
    const holzNpcStelle = map.findObject(
      "InteraktionsLayer",
      (obj) => obj.name === "holzNpc",
    );
    this.physics.add
      .sprite(
        this.versetzeX(holzNpcStelle.x),
        this.versetzeY(holzNpcStelle.y),
        "holzNpc",
        1,
      )
      .setOrigin(0);
    this.#holzNpcZone = this.erstelleStatischeZone(
      this.versetzeX(holzNpcStelle.x),
      this.versetzeY(holzNpcStelle.y),
      holzNpcStelle.width,
      holzNpcStelle.height,
    );
    //Interaktionsraum vor holzNPC
    this.#holzNpcInteraktionsraum = this.erstelleInteraktionsZone(
      this.#holzNpcZone.x,
      this.#holzNpcZone.y + 32,
      32,
      16,
    );
    this.#holzNpcInteraktionsraum.setOrigin(0);

    //waescheNPC erstellen
    const waescheNpcStelle = map.findObject(
      "InteraktionsLayer",
      (obj) => obj.name === "waescheNpc",
    );
    this.physics.add
      .sprite(
        this.versetzeX(waescheNpcStelle.x),
        this.versetzeY(waescheNpcStelle.y),
        "waescheNpc",
        1,
      )
      .setOrigin(0);
    this.#waescheNpcZone = this.erstelleStatischeZone(
      this.versetzeX(waescheNpcStelle.x),
      this.versetzeY(waescheNpcStelle.y),
      waescheNpcStelle.width,
      waescheNpcStelle.height,
    );
    //Interaktionsraum vor waescheNPC
    this.#waescheNpcInteraktionsraum = this.erstelleInteraktionsZone(
      this.#waescheNpcZone.x,
      this.#waescheNpcZone.y + 32,
      32,
      16,
    );
    this.#waescheNpcInteraktionsraum.setOrigin(0);

    //fischerNPC erstellen
    const fischerNpcStelle = map.findObject(
      "InteraktionsLayer",
      (obj) => obj.name === "fischerNpc",
    );
    this.physics.add
      .sprite(
        this.versetzeX(fischerNpcStelle.x),
        this.versetzeY(fischerNpcStelle.y),
        "fischerNpc",
        7,
      )
      .setOrigin(0);
    this.#fischerNpcZone = this.erstelleStatischeZone(
      this.versetzeX(fischerNpcStelle.x),
      this.versetzeY(fischerNpcStelle.y),
      fischerNpcStelle.width,
      fischerNpcStelle.height,
    );
    //Interaktionsraum vor fischerNPC
    this.#fischerNpcInteraktionsraum = this.erstelleInteraktionsZone(
      this.#fischerNpcZone.x + 32,
      this.#fischerNpcZone.y,
      16,
      32,
    );
    this.#fischerNpcInteraktionsraum.setOrigin(0);

    //dubioserNPC erstellen
    const dubioserNpcStelle = map.findObject(
      "InteraktionsLayer",
      (obj) => obj.name === "dubioserNpc",
    );
    this.physics.add
      .sprite(
        this.versetzeX(dubioserNpcStelle.x),
        this.versetzeY(dubioserNpcStelle.y),
        "dubioserNpc",
        10,
      )
      .setOrigin(0);
    this.#dubioserNpcZone = this.erstelleStatischeZone(
      this.versetzeX(dubioserNpcStelle.x),
      this.versetzeY(dubioserNpcStelle.y),
      dubioserNpcStelle.width,
      dubioserNpcStelle.height,
    );
    //Interaktionsraum vor dubioserNPC
    this.#dubioserNpcInteraktionsraum = this.erstelleInteraktionsZone(
      this.#dubioserNpcZone.x,
      this.#dubioserNpcZone.y - 16,
      32,
      16,
    );
    this.#dubioserNpcInteraktionsraum.setOrigin(0);

    //bossNPC erstellen
    const bossNpcStelle = map.findObject(
      "InteraktionsLayer",
      (obj) => obj.name === "boss",
    );
    this.physics.add
      .sprite(
        this.versetzeX(bossNpcStelle.x),
        this.versetzeY(bossNpcStelle.y),
        "bossNpc",
        9,
      )
      .setOrigin(0);
    this.#bossNpcZone = this.erstelleStatischeZone(
      this.versetzeX(bossNpcStelle.x),
      this.versetzeY(bossNpcStelle.y),
      bossNpcStelle.width,
      bossNpcStelle.height,
    );
    //Interaktionsraum vor bossNPC
    this.#bossNpcInteraktionsraum = this.erstelleInteraktionsZone(
      this.#bossNpcZone.x + 40,
      this.#bossNpcZone.y + 96,
      16,
      64,
    );
    this.#bossNpcInteraktionsraum.setOrigin(0);

    //-------------Gegenstände-------------
    //Credits1 erstellen
    const credits1Stelle = map.findObject(
      "InteraktionsLayer",
      (obj) => obj.name === "credits1",
    );
    //Interaktionsraum vor den credits1
    this.#credits1Interaktionsraum = this.erstelleInteraktionsZone(
      this.versetzeX(credits1Stelle.x),
      this.versetzeY(credits1Stelle.y),
      credits1Stelle.width,
      credits1Stelle.height,
    );
    this.#credits1Interaktionsraum.setOrigin(0);

    //Credits2 erstellen
    const credits2Stelle = map.findObject(
      "InteraktionsLayer",
      (obj) => obj.name === "credits2",
    );
    //Interaktionsraum vor den credits2
    this.#credits2Interaktionsraum = this.erstelleInteraktionsZone(
      this.versetzeX(credits2Stelle.x),
      this.versetzeY(credits2Stelle.y),
      credits2Stelle.width,
      credits2Stelle.height,
    );
    this.#credits2Interaktionsraum.setOrigin(0);

    //Gesucht Poster erstellen
    const gesuchtPosterStelle = map.findObject(
      "InteraktionsLayer",
      (obj) => obj.name === "gesuchtPoster",
    );
    //Interaktionsraum vor dem gesuchtPoster
    this.#gesuchtPosterInteraktionsraum = this.erstelleInteraktionsZone(
      this.versetzeX(gesuchtPosterStelle.x),
      this.versetzeY(gesuchtPosterStelle.y),
      gesuchtPosterStelle.width,
      gesuchtPosterStelle.height,
    );
    this.#gesuchtPosterInteraktionsraum.setOrigin(0);

    //Statuen erstellen
    const statuenStelle = map.findObject(
      "InteraktionsLayer",
      (obj) => obj.name === "statuen",
    );
    //Interaktionsraum vor den statuen
    this.#statuenInteraktionsraum = this.erstelleInteraktionsZone(
      this.versetzeX(statuenStelle.x),
      this.versetzeY(statuenStelle.y),
      statuenStelle.width,
      statuenStelle.height,
    );
    this.#statuenInteraktionsraum.setOrigin(0);

    //versperrterWeg erstellen
    const versperrterWegStelle = map.findObject(
      "InteraktionsLayer",
      (obj) => obj.name === "versperrterWeg",
    );
    //Interaktionsraum vor dem versperrten Weg
    this.#versperrterWegInteraktionsraum = this.erstelleInteraktionsZone(
      this.versetzeX(versperrterWegStelle.x),
      this.versetzeY(versperrterWegStelle.y),
      versperrterWegStelle.width,
      versperrterWegStelle.height,
    );
    this.#versperrterWegInteraktionsraum.setOrigin(0);

    //Vogelscheuche erstellen
    const vogelscheucheStelle = map.findObject(
      "InteraktionsLayer",
      (obj) => obj.name === "vogelscheuche",
    );
    //Interaktionsraum vor der Vogelscheuche
    this.#vogelscheucheInteraktionsraum = this.erstelleInteraktionsZone(
      this.versetzeX(vogelscheucheStelle.x),
      this.versetzeY(vogelscheucheStelle.y),
      vogelscheucheStelle.width,
      vogelscheucheStelle.height,
    );
    this.#vogelscheucheInteraktionsraum.setOrigin(0);

    //Warnschild erstellen
    const warnschildStelle = map.findObject(
      "InteraktionsLayer",
      (obj) => obj.name === "warnschild",
    );
    //Interaktionsraum vor dem Warnschild
    this.#warnschildInteraktionsraum = this.erstelleInteraktionsZone(
      this.versetzeX(warnschildStelle.x),
      this.versetzeY(warnschildStelle.y),
      warnschildStelle.width,
      warnschildStelle.height,
    );
    this.#warnschildInteraktionsraum.setOrigin(0);

    //Wegweiser erstellen
    const wegweiserStelle = map.findObject(
      "InteraktionsLayer",
      (obj) => obj.name === "wegweiser",
    );
    //Interaktionsraum vor dem Wegweiser
    this.#wegweiserInteraktionsraum = this.erstelleInteraktionsZone(
      this.versetzeX(wegweiserStelle.x),
      this.versetzeY(wegweiserStelle.y),
      wegweiserStelle.width,
      wegweiserStelle.height,
    );
    this.#wegweiserInteraktionsraum.setOrigin(0);
  }

  update() {
    //Dialoge
    this.#ladeDialogAuswahlen();

    //Bewegung und Menü-Taste (aus BaseRoomScene)
    super.update();

    //Overlap prüfen
    this.#playerVorHolzNpc = this.physics.overlap(
      this.player,
      this.#holzNpcInteraktionsraum,
    );
    this.#playerVorWaescheNpc = this.physics.overlap(
      this.player,
      this.#waescheNpcInteraktionsraum,
    );
    this.#playerVorFischerNpc = this.physics.overlap(
      this.player,
      this.#fischerNpcInteraktionsraum,
    );
    this.#playerVorDubioserNpc = this.physics.overlap(
      this.player,
      this.#dubioserNpcInteraktionsraum,
    );
    this.#playerVorBossNpc = this.physics.overlap(
      this.player,
      this.#bossNpcInteraktionsraum,
    );
    this.#playerVorCredits1 = this.physics.overlap(
      this.player,
      this.#credits1Interaktionsraum,
    );
    this.#playerVorCredits2 = this.physics.overlap(
      this.player,
      this.#credits2Interaktionsraum,
    );
    this.#playerVorGesuchtPoster = this.physics.overlap(
      this.player,
      this.#gesuchtPosterInteraktionsraum,
    );
    this.#playerVorStatuen = this.physics.overlap(
      this.player,
      this.#statuenInteraktionsraum,
    );
    this.#playerVorVersperrterWeg = this.physics.overlap(
      this.player,
      this.#versperrterWegInteraktionsraum,
    );
    this.#playerVorVogelscheuche = this.physics.overlap(
      this.player,
      this.#vogelscheucheInteraktionsraum,
    );
    this.#playerVorWarnschild = this.physics.overlap(
      this.player,
      this.#warnschildInteraktionsraum,
    );
    this.#playerVorWegweiser = this.physics.overlap(
      this.player,
      this.#wegweiserInteraktionsraum,
    );

    //Hinweisanzeige
    const interaktionen = [
      {
        zone: this.#holzNpcInteraktionsraum,
        aktiv: true,
        text: "Drücke I um zu interagieren.",
      },
      {
        zone: this.#waescheNpcInteraktionsraum,
        aktiv: true,
        text: "Drücke I um zu interagieren.",
      },
      {
        zone: this.#fischerNpcInteraktionsraum,
        aktiv: true,
        text: "Drücke I um zu interagieren.",
      },
      {
        zone: this.#dubioserNpcInteraktionsraum,
        aktiv: true,
        text: "Drücke I um zu interagieren.",
      },
      {
        zone: this.#bossNpcInteraktionsraum,
        aktiv: false, //kein Hinweis, Dialog automatisch beim Betreten
        text: "",
      },
      {
        zone: this.#credits1Interaktionsraum,
        aktiv: true,
        text: "Drücke I um zu interagieren.",
      },
      {
        zone: this.#credits2Interaktionsraum,
        aktiv: true,
        text: "Drücke I um zu interagieren.",
      },
      {
        zone: this.#gesuchtPosterInteraktionsraum,
        aktiv: true,
        text: "Drücke I um zu interagieren.",
      },
      {
        zone: this.#statuenInteraktionsraum,
        aktiv: true,
        text: "Drücke I um zu interagieren.",
      },
      {
        zone: this.#versperrterWegInteraktionsraum,
        aktiv: true,
        text: "Drücke I um zu interagieren.",
      },
      {
        zone: this.#vogelscheucheInteraktionsraum,
        aktiv: true,
        text: "Drücke I um zu interagieren.",
      },
      {
        zone: this.#warnschildInteraktionsraum,
        aktiv: true,
        text: "Drücke I um zu interagieren.",
      },
      {
        zone: this.#wegweiserInteraktionsraum,
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
      if (zone === this.#holzNpcInteraktionsraum) {
        this.#playerVorHolzNpc = overlap;
      }
      if (zone === this.#waescheNpcInteraktionsraum) {
        this.#playerVorWaescheNpc = overlap;
      }
      if (zone === this.#fischerNpcInteraktionsraum) {
        this.#playerVorFischerNpc = overlap;
      }
      if (zone === this.#dubioserNpcInteraktionsraum) {
        this.#playerVorDubioserNpc = overlap;
      }
      if (zone === this.#bossNpcInteraktionsraum) {
        this.#playerVorBossNpc = overlap;
      }
      if (zone === this.#credits1Interaktionsraum) {
        this.#playerVorCredits1 = overlap;
      }
      if (zone === this.#credits2Interaktionsraum) {
        this.#playerVorCredits2 = overlap;
      }
      if (zone === this.#gesuchtPosterInteraktionsraum) {
        this.#playerVorGesuchtPoster = overlap;
      }
      if (zone === this.#statuenInteraktionsraum) {
        this.#playerVorStatuen = overlap;
      }
      if (zone === this.#versperrterWegInteraktionsraum) {
        this.#playerVorVersperrterWeg = overlap;
      }
      if (zone === this.#vogelscheucheInteraktionsraum) {
        this.#playerVorVogelscheuche = overlap;
      }
      if (zone === this.#warnschildInteraktionsraum) {
        this.#playerVorWarnschild = overlap;
      }
      if (zone === this.#wegweiserInteraktionsraum) {
        this.#playerVorWegweiser = overlap;
      }
    }
    if (!hinweisGezeigt) this.hinweisAusblenden();

    //-------------Dialoge-------------
    //Interaktion mit holzNPC
    if (this.#holzNpcAuswahl) {
      this.#holzNpcInhaltFertig = true;
    }
    if (this.#playerVorHolzNpc && Phaser.Input.Keyboard.JustDown(this.keys.i)) {
      if (this.#holzNpcAuswahl || this.#holzNpcInhaltFertig) {
        this.openTextfeld("50", "holzNpc");
      } else if (this.#holzNpcAuswahl === null || !this.#holzNpcAuswahl) {
        this.openTextfeld("47", "holzNpc");
      } else {
        console.log("Fehler beim Laden vom Text vom holzNPC");
      }
    }

    //Interaktion mit waescheNPC
    if (this.#waescheNpcAuswahl) {
      this.#waescheNpcInhaltFertig = true;
    }
    if (
      this.#playerVorWaescheNpc &&
      Phaser.Input.Keyboard.JustDown(this.keys.i)
    ) {
      if (this.#waescheNpcAuswahl || this.#waescheNpcInhaltFertig) {
        this.openTextfeld("58", "waescheNpc");
      } else if (this.#waescheNpcAuswahl === null || !this.#waescheNpcAuswahl) {
        this.openTextfeld("55", "waescheNpc");
      } else {
        console.log("Fehler beim Laden vom Text vom waescheNPC");
      }
    }

    //Interaktion mit fischerNPC
    if (this.#fischerNpcAuswahl) {
      this.#fischerNpcInhaltFertig = true;
    }
    if (
      this.#playerVorFischerNpc &&
      Phaser.Input.Keyboard.JustDown(this.keys.i)
    ) {
      if (this.#fischerNpcAuswahl || this.#fischerNpcInhaltFertig) {
        this.openTextfeld("54", "fischerNpc");
      } else if (this.#fischerNpcAuswahl === null || !this.#fischerNpcAuswahl) {
        this.openTextfeld("51", "fischerNpc");
      } else {
        console.log("Fehler beim Laden vom Text vom fischerNPC");
      }
    }

    //Interaktion mit dubioserNPC
    if (this.#dubioserNpcAuswahl) {
      this.#dubioserNpcInhaltFertig = true;
    }
    if (
      this.#playerVorDubioserNpc &&
      Phaser.Input.Keyboard.JustDown(this.keys.i)
    ) {
      if (this.#personAufGesuchtPlakatErkannt) {
        this.openTextfeld("64", "dubioserNpc");
      } else if (this.#dubioserNpcAuswahl || this.#dubioserNpcInhaltFertig) {
        this.openTextfeld("63", "dubioserNpc");
      } else if (
        this.#waescheNpcInhaltFertig &&
        (this.#dubioserNpcAuswahl === null || !this.#dubioserNpcAuswahl)
      ) {
        this.openTextfeld("60", "dubioserNpc");
      } else if (
        !this.#waescheNpcInhaltFertig &&
        (this.#dubioserNpcAuswahl === null || !this.#dubioserNpcAuswahl)
      ) {
        this.openTextfeld("59", "dubioserNpc");
      } else {
        console.log("Fehler beim Laden vom Text von dubioserNPC");
      }
    }

    //Interaktion mit bossNPC (automatisch beim Betreten)
    if (this.#bossNpcAuswahl) {
      this.#bossNpcInhaltFertig = true;
      this.physics.world.removeCollider(this.#weiterBarriere);
    }
    if (this.#playerVorBossNpc && !this.#bossNpcZoneBetretenVorher) {
      this.#bossNpcDialogStarten();
    }
    //Zustand für den nächsten Frame merken
    this.#bossNpcZoneBetretenVorher = this.#playerVorBossNpc;

    //Interaktion mit den Credits1
    if (
      this.#playerVorCredits1 &&
      Phaser.Input.Keyboard.JustDown(this.keys.i)
    ) {
      if (this.#playerVorCredits1) {
        this.openTextfeld("80", "credits1");
      } else {
        console.log("Fehler beim Laden vom Text von den Credits1");
      }
    }

    //Interaktion mit den Credits2
    if (
      this.#playerVorCredits2 &&
      Phaser.Input.Keyboard.JustDown(this.keys.i)
    ) {
      if (this.#playerVorCredits2) {
        this.openTextfeld("83", "credits2");
      } else {
        console.log("Fehler beim Laden vom Text von den Credits2");
      }
    }

    //Interaktion mit dem Gesucht Poster
    if (
      this.#playerVorGesuchtPoster &&
      Phaser.Input.Keyboard.JustDown(this.keys.i)
    ) {
      if (this.#dubioserNpcInhaltFertig) {
        this.#personAufGesuchtPlakatErkannt = true;
        this.openTextfeld("77", "gesuchtPoster");
      } else if (!this.#dubioserNpcInhaltFertig) {
        this.openTextfeld("76", "gesuchtPoster");
      } else {
        console.log("Fehler beim Laden vom Text von dem Gesucht Poster");
      }
    }

    //Interaktion mit den Statuen
    if (this.#playerVorStatuen && Phaser.Input.Keyboard.JustDown(this.keys.i)) {
      if (this.#playerVorStatuen) {
        this.openTextfeld("78", "statuen");
      } else {
        console.log("Fehler beim Laden vom Text von den Statuen");
      }
    }

    //Interaktion mit dem versperrten Weg
    if (
      this.#playerVorVersperrterWeg &&
      Phaser.Input.Keyboard.JustDown(this.keys.i)
    ) {
      if (this.#playerVorVersperrterWeg) {
        this.#versperrtenWegGesehen = true;
        this.openTextfeld("75", "versperrterWeg");
      } else {
        console.log("Fehler beim Laden vom Text von dem versperrten Weg");
      }
    }

    //Interaktion mit Vogelscheuche
    if (
      this.#playerVorVogelscheuche &&
      Phaser.Input.Keyboard.JustDown(this.keys.i)
    ) {
      if (this.#playerVorVogelscheuche) {
        this.openTextfeld("79", "vogelscheuche");
      } else {
        console.log("Fehler beim Laden vom Text von der Vogelscheuche");
      }
    }

    //Interaktion mit Warnschild
    if (
      this.#playerVorWarnschild &&
      Phaser.Input.Keyboard.JustDown(this.keys.i)
    ) {
      if (this.#versperrtenWegGesehen) {
        this.openTextfeld("74", "warnschild");
      } else if (!this.#versperrtenWegGesehen) {
        this.openTextfeld("73", "warnschild");
      } else {
        console.log("Fehler beim Laden vom Text von dem Warnschild");
      }
    }

    //Interaktion mit Warnschild
    if (
      this.#playerVorWegweiser &&
      Phaser.Input.Keyboard.JustDown(this.keys.i)
    ) {
      if (this.#playerVorWegweiser) {
        this.openTextfeld("72", "wegweiser");
      } else {
        console.log("Fehler beim Laden vom Text von dem Wegweiser");
      }
    }

    //Wechsel zum nächsten Raum
    this.#playerVorWeiter = this.physics.overlap(this.player, this.#weiterZone);

    if (this.#playerVorWeiter) {
      this.raumWechsel(this.#neueScene);
    }
  }

  //-------------Funktionen-------------
  #loadImages() {
    this.load.image("vierter_asset1", "assets/vierter-raum/BaseChip_pipo.png");
    this.load.image("vierter_asset2", "assets/vierter-raum/addwork.png");
    this.load.image("vierter_asset3", "assets/vierter-raum/[A]Water_pipo.png");
    this.load.image("vierter_asset4", "assets/vierter-raum/[A]Flower_pipo.png");
    this.load.tilemapTiledJSON(
      "JSONvierterRaum",
      "assets/vierter-raum/vierter-raum.JSON",
    );
  }

  #loadSpriteSheets() {
    this.load.spritesheet(
      "holzNpc",
      "assets/characters/pipoya-character-sprites/male/Male 03-4.png",
      {
        frameWidth: 32,
        frameHeight: 32,
      },
    );
    this.load.spritesheet(
      "waescheNpc",
      "assets/characters/pipoya-character-sprites/female/Female 19-3.png",
      {
        frameWidth: 32,
        frameHeight: 32,
      },
    );
    this.load.spritesheet(
      "fischerNpc",
      "assets/characters/pipoya-character-sprites/male/Male 14-1.png",
      {
        frameWidth: 32,
        frameHeight: 32,
      },
    );
    this.load.spritesheet(
      "dubioserNpc",
      "assets/characters/pipoya-character-sprites/enemy/Enemy 02-1.png",
      {
        frameWidth: 32,
        frameHeight: 32,
      },
    );
    this.load.spritesheet(
      "bossNpc",
      "assets/characters/pipoya-character-sprites/boss/Boss 01.png",
      {
        frameWidth: 96,
        frameHeight: 96,
      },
    );
  }

  #ladeDialogAuswahlen() {
    const gespeicherteAuswahlen = this.registry.get("dialogAuswahlen") || {};
    this.#holzNpcAuswahl = gespeicherteAuswahlen["holzNpc"] ?? null;
    this.#waescheNpcAuswahl = gespeicherteAuswahlen["waescheNpc"] ?? null;
    this.#fischerNpcAuswahl = gespeicherteAuswahlen["fischerNpc"] ?? null;
    this.#dubioserNpcAuswahl = gespeicherteAuswahlen["dubioserNpc"] ?? null;
    this.#bossNpcAuswahl = gespeicherteAuswahlen["bossNpc"] ?? null;
  }

  #bossNpcDialogStarten() {
    if (this.#bossNpcAuswahl || this.#bossNpcInhaltFertig) {
      this.openTextfeld("71", "bossNpc");
    } else if (this.#bossNpcAuswahl === false) {
      this.openTextfeld("68", "bossNpc");
    } else if (
      this.#bossNpcAuswahl === null &&
      this.#holzNpcInhaltFertig &&
      this.#waescheNpcInhaltFertig &&
      this.#fischerNpcInhaltFertig &&
      this.#dubioserNpcInhaltFertig
    ) {
      this.openTextfeld("65", "bossNpc");
    } else if (
      this.#bossNpcAuswahl === null &&
      this.#bossNpcBereitsEinmalAngesprochen
    ) {
      this.openTextfeld("46", "bossNpc");
    } else if (
      this.#bossNpcAuswahl === null &&
      !this.#bossNpcBereitsEinmalAngesprochen
    ) {
      this.#bossNpcBereitsEinmalAngesprochen = true;
      this.openTextfeld("45", "bossNpc");
    } else {
      console.log("Fehler beim Laden vom Text von bossNPC");
    }
  }
}
