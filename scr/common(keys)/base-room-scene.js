import { SCENE_KEYS } from "../common(keys)/scene-keys.js";
// eslint-disable-next-line no-unused-vars
import { Player } from "./player.js";
import { logger } from "./logger.js";

export class BaseRoomScene extends Phaser.Scene {
  player;
  keys;
  textConfig;
  hinweis;

  init() {
    this.keys = this.input.keyboard.addKeys({
      k: Phaser.Input.Keyboard.KeyCodes.K,
      m: Phaser.Input.Keyboard.KeyCodes.M,
      i: Phaser.Input.Keyboard.KeyCodes.I,
    });
    this.textConfig = {
      fontFamily: "QuinqueFive",
      fontSize: "12px",
      color: "#ffffff",
      backgroundColor: "#000000",
    };

    logger.szeneBetreten(this.scene.key);
    this.events.once("shutdown", () => {
      logger.szeneVerlassen(this.scene.key);
      logger.zwischenstandSpeichern();
    });
  }

  update() {
    this.player.update();
    if (Phaser.Input.Keyboard.JustDown(this.keys.m)) {
      this.openMenu();
    }
  }

  //Raum mittig ausrichten
  zentriereRaum(map) {
    this.offsetX = Math.max(
      0,
      Math.round((this.cameras.main.width - map.widthInPixels) / 2),
    );
    this.offsetY = Math.max(
      0,
      Math.round((this.cameras.main.height - map.heightInPixels) / 2),
    );
    //Raumgrenzen merken
    this.raumBreite = map.widthInPixels;
    this.raumHoehe = map.heightInPixels;
  }
  erstelleLayer(map, layerName, tilesets) {
    return map.createLayer(layerName, tilesets, this.offsetX, this.offsetY);
  }
  versetzeX(x) {
    return x + this.offsetX;
  }
  versetzeY(y) {
    return y + this.offsetY;
  }

  //statische Collision-Gruppe aus Objekt-Layer, inklusive Versatz
  erstelleCollisionGruppe(map, layerName = "CollisionLayer") {
    const hindernisse = this.physics.add.staticGroup();
    const collision = map.getObjectLayer(layerName);
    if (collision) {
      collision.objects.forEach((obj) => {
        const zone = this.add
          .zone(
            this.versetzeX(obj.x),
            this.versetzeY(obj.y),
            obj.width,
            obj.height,
          )
          .setOrigin(0);
        this.physics.add.existing(zone, true);
        hindernisse.add(zone);
      });
    }
    return hindernisse;
  }

  //Kameragrenzen setzen
  setzeKameraGrenzen(map) {
    const breite = Math.max(
      map.widthInPixels + this.offsetX,
      this.cameras.main.width,
    );
    const hoehe = Math.max(
      map.heightInPixels + this.offsetY,
      this.cameras.main.height,
    );

    this.cameras.main.setBounds(0, 0, breite, hoehe);
    this.physics.world.setBounds(0, 0, breite, hoehe);
  }

  erstelleInteraktionsZone(x, y, breite, hoehe) {
    const zone = this.add.zone(x, y, breite, hoehe).setOrigin(0);
    this.physics.world.enable(zone);
    zone.body.setAllowGravity(false);
    zone.body.moves = false;
    return zone;
  }

  erstelleStatischeZone(x, y, breite, hoehe) {
    const zone = this.add.zone(x, y, breite, hoehe).setOrigin(0);
    this.physics.add.existing(zone, true);
    this.physics.add.collider(this.player, zone);
    return zone;
  }

  interaktionsHinweisAnzeigen(x, y, text) {
    if (!this.hinweis) {
      this.hinweis = this.add.text(0, 0, "", this.textConfig).setOrigin(0.5);
    }
    this.hinweis.setText(text);
    this.hinweis.setVisible(true);

    let zielX = x + 16;
    let zielY = y - 32 - 16;

    //Text an die Raumgrenzen klemmen, falls er sonst darüber hinausragen würde
    const halbeBreite = this.hinweis.width / 2;
    const halbeHoehe = this.hinweis.height / 2;
    zielX = this.#klemme(
      zielX,
      this.offsetX + halbeBreite,
      this.offsetX + this.raumBreite - halbeBreite,
    );
    zielY = this.#klemme(
      zielY,
      this.offsetY + halbeHoehe,
      this.offsetY + this.raumHoehe - halbeHoehe,
    );

    this.hinweis.setPosition(zielX, zielY);
  }

  //Hilfsfunktion (Wert zwischen min und max halten)
  #klemme(wert, min, max) {
    if (min > max) return (min + max) / 2;
    return Phaser.Math.Clamp(wert, min, max);
  }

  hinweisAusblenden() {
    if (this.hinweis) this.hinweis.setVisible(false);
  }

  openTextfeld(interaktionsKey, interaktionsTyp) {
    this.scene.pause(this.scene.key);
    this.scene.launch(SCENE_KEYS.TEXT_SCENE, {
      textKey: interaktionsKey,
      zielTyp: interaktionsTyp,
      aktuelleScene: this.scene.key,
    });
  }

  openMenu() {
    this.scene.pause(this.scene.key);
    this.scene.launch(SCENE_KEYS.MENU_SCENE, {
      width: this.mapWidth,
      height: this.mapHeight,
      raum: this.raumNummer,
      aktuelleScene: this.scene.key,
    });
  }

  raumWechsel(neueScene) {
    this.scene.stop(this.scene.key);
    this.scene.start(neueScene);
  }
}
