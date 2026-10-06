import { SCENE_KEYS } from "../common(keys)/scene-keys.js";
import { logger } from "../common(keys)/logger.js";
import { wechsleRaum, holeRaumKey } from "../common(keys)/raum-wechsel.js";

export class MenuScene extends Phaser.Scene {
  #mapBreite;
  #mapHoehe;
  #menuBox;
  #menuSteuerungTasten;
  #menuSteuerungFunktion;
  #textConfig;
  #keys;
  #karteBox;
  #karteLinie;
  #raumTitel;
  #raumNummer;
  #raumDauer;
  #raum1;
  #raum2;
  #raum3;
  #raum4;
  #raeume;
  #aktuelleScene;
  #zustand;
  #gewaehlterRaum;
  #hinweisBox;
  #hinweisText;

  constructor() {
    super({ key: SCENE_KEYS.MENU_SCENE });
    console.log("menu-scene wurde erstellt");
  }

  init(data) {
    const geladeneRaumNamen = this.registry.get("raumNamen");
    this.#raumTitel =
      geladeneRaumNamen && geladeneRaumNamen.length > 0
        ? geladeneRaumNamen
        : ["Raum 1", "Raum 2", "Raum 3", "Raum 4"];

    this.#raumDauer = [10, 10, 3, 20];

    this.#mapBreite = 480;
    this.#mapHoehe = 512;

    this.#raumNummer = data.raum - 1; //-1 wegen der anfang-scene

    this.#aktuelleScene = data.aktuelleScene;
    this.#zustand = "normal";
    this.#gewaehlterRaum = null;

    this.#keys = this.input.keyboard.addKeys({
      esc: Phaser.Input.Keyboard.KeyCodes.ESC,
      m: Phaser.Input.Keyboard.KeyCodes.M,
      eins: Phaser.Input.Keyboard.KeyCodes.ONE,
      zwei: Phaser.Input.Keyboard.KeyCodes.TWO,
      drei: Phaser.Input.Keyboard.KeyCodes.THREE,
      vier: Phaser.Input.Keyboard.KeyCodes.FOUR,
    });

    this.#textConfig = {
      fontFamily: "QuinqueFive",
      fontSize: "16px",
      color: "#ffffff",
      align: "justify",
      lineSpacing: 5,
    };

    this.#menuSteuerungTasten = [
      "Pfeiltasten",
      "Zahlen-Tasten",
      "I",
      "I/SPACE/ENTER",
      "M",
      "M/ESC",
      "K",
    ];
    this.#menuSteuerungFunktion = [
      "Bewegung im Raum",
      "Raum wechseln",
      "Mit Personen/Objekten interagieren",
      "Dialog weiter & Bestätigen",
      "Menü öffnen",
      "Menü schließen",
      "Schlüssel einsetzten",
    ];

    logger.szeneBetreten(this.scene.key);
    this.events.once("shutdown", () => logger.szeneVerlassen(this.scene.key));
  }

  preload() {}

  create() {
    this.#menuBox = this.add
      .rectangle(
        25,
        15,
        this.#mapBreite - 50,
        this.#mapHoehe - 50,
        0x000000,
        0.8,
      )
      .setOrigin(0);

    //Überschrift Menü
    this.menuUeberschrift = this.add
      .text(
        this.#menuBox.width / 2,
        this.#menuBox.y + 10,
        "Menü",
        this.#textConfig,
      )
      .setAlign("middle")
      .setFontSize("25px");

    //Überschrift Links
    this.add
      .text(
        this.#menuBox.x + 20,
        this.#menuBox.y + 40,
        "Taste",
        this.#textConfig,
      )
      .setFontStyle("bold italic");

    //Überschrift Rechts
    this.add
      .text(
        this.#menuBox.width,
        this.#menuBox.y + 40,
        "Funktion",
        this.#textConfig,
      )
      .setAlign("right")
      .setFontStyle("bold italic")
      .setOrigin(1, 0);

    //Inhalt Links
    this.add.text(
      this.#menuBox.x + 20,
      this.#menuBox.y + 65,
      this.#menuSteuerungTasten,
      this.#textConfig,
    );

    //Inhalt Rechts
    this.add
      .text(
        this.#menuBox.width,
        this.#menuBox.y + 65,
        this.#menuSteuerungFunktion,
        this.#textConfig,
      )
      .setAlign("right")
      .setOrigin(1, 0);

    //Karte
    this.#karteBox = this.add
      .rectangle(
        this.#menuBox.x + 20,
        this.#menuBox.height / 2 + 15,
        this.#menuBox.width - 40,
        this.#menuBox.height / 2 - 10,
        0x000000,
        1,
      )
      .setOrigin(0)
      .setStrokeStyle(2, 0x444444);

    //Karte Überschrift
    this.add
      .text(
        this.menuUeberschrift.x,
        this.#karteBox.y + 10,
        "Karte",
        this.#textConfig,
      )
      .setAlign("middle")
      .setFontSize("20px");

    //Karte Linie
    this.#karteLinie = this.add
      .rectangle(
        this.#karteBox.x + 30,
        this.#karteBox.y + (this.#karteBox.height * 3) / 4,
        this.#karteBox.width - 60,
        5,
        0xcccccc,
      )
      .setOrigin(0);

    //Karte Punkte
    const lineStartX = this.#karteLinie.x;
    const step = this.#karteLinie.width / 3;

    this.#raum1 = this.add
      .circle(lineStartX, this.#karteLinie.y, 10, 0x999999)
      .setOrigin(0.4);
    this.add
      .text(
        this.#raum1.x,
        this.#raum1.y - 15,
        this.#raumTitel[0] || "",
        this.#textConfig,
      )
      .setOrigin(1, 0.6)
      .setAngle(90)
      .setWordWrapWidth(130);
    this.add.text(this.#raum1.x - 1, this.#raum1.y + 15, "1", this.#textConfig);
    this.add
      .text(
        this.#raum1.x - 1,
        this.#raum1.y + 30,
        "~" + this.#raumDauer[0] + " min",
        this.#textConfig,
      )
      .setFontSize("12px")
      .setOrigin(0.5, 0);

    this.#raum2 = this.add
      .circle(lineStartX + step, this.#karteLinie.y, 10, 0x999999)
      .setOrigin(0.4);
    this.add
      .text(
        this.#raum2.x,
        this.#raum2.y - 15,
        this.#raumTitel[1] || "",
        this.#textConfig,
      )
      .setOrigin(1, 0.6)
      .setAngle(90)
      .setWordWrapWidth(130);
    this.add.text(this.#raum2.x - 1, this.#raum2.y + 15, "2", this.#textConfig);
    this.add
      .text(
        this.#raum2.x - 1,
        this.#raum2.y + 30,
        "~" + this.#raumDauer[1] + " min",
        this.#textConfig,
      )
      .setFontSize("12px")
      .setOrigin(0.5, 0);

    this.#raum3 = this.add
      .circle(lineStartX + step * 2, this.#karteLinie.y, 10, 0x999999)
      .setOrigin(0.4);
    this.add
      .text(
        this.#raum3.x,
        this.#raum3.y - 15,
        this.#raumTitel[2] || "",
        this.#textConfig,
      )
      .setOrigin(1, 0.6)
      .setAngle(90)
      .setWordWrapWidth(130);
    this.add.text(this.#raum3.x - 1, this.#raum3.y + 15, "3", this.#textConfig);
    this.add
      .text(
        this.#raum3.x + 3,
        this.#raum3.y + 30,
        "~" + this.#raumDauer[2] + " min",
        this.#textConfig,
      )
      .setFontSize("12px")
      .setOrigin(0.5, 0);

    this.#raum4 = this.add
      .circle(lineStartX + step * 3, this.#karteLinie.y, 10, 0x999999)
      .setOrigin(0.4);
    this.add
      .text(
        this.#raum4.x,
        this.#raum4.y - 15,
        this.#raumTitel[3] || "",
        this.#textConfig,
      )
      .setOrigin(1, 0.6)
      .setAngle(90)
      .setWordWrapWidth(130);
    this.add.text(this.#raum4.x - 1, this.#raum4.y + 15, "4", this.#textConfig);
    this.add
      .text(
        this.#raum4.x - 1,
        this.#raum4.y + 30,
        "~" + this.#raumDauer[3] + " min",
        this.#textConfig,
      )
      .setFontSize("12px")
      .setOrigin(0.5, 0);

    this.#raeume = [this.#raum1, this.#raum2, this.#raum3, this.#raum4];

    //Standort des Spielers
    this.add
      .circle(
        this.#raeume[this.#raumNummer].x,
        this.#raeume[this.#raumNummer].y,
        5,
        0x000000,
      )
      .setOrigin(0.3);

    //Hinweisbox
    const mitteX = this.cameras.main.centerX;
    const mitteY = this.cameras.main.centerY;

    this.#hinweisBox = this.add
      .rectangle(mitteX, mitteY, 300, 100, 0x000000, 1)
      .setStrokeStyle(2, 0xffd966)
      .setDepth(10)
      .setVisible(false);

    this.#hinweisText = this.add
      .text(mitteX, mitteY, "", this.#textConfig)
      .setAlign("center")
      .setWordWrapWidth(250)
      .setOrigin(0.5)
      .setDepth(11)
      .setVisible(false);
  }

  update() {
    for (let i = 0; i <= this.#raumNummer; i++) {
      this.#raeume[i].setFillStyle(0xffd966);
    }

    //Während der Info alle Tasten verwerfen (sonst werden sie danach nachträglich ausgelöst)
    if (this.#zustand === "info") {
      Object.values(this.#keys).forEach((taste) =>
        Phaser.Input.Keyboard.JustDown(taste),
      );
      return;
    }

    //Rückfrage: 1 = Ja, 2, ESC, M = Nein
    if (this.#zustand === "frage") {
      const ja = Phaser.Input.Keyboard.JustDown(this.#keys.eins);
      const nein = [this.#keys.zwei, this.#keys.esc, this.#keys.m]
        .map((taste) => Phaser.Input.Keyboard.JustDown(taste))
        .some(Boolean);
      Phaser.Input.Keyboard.JustDown(this.#keys.drei);
      Phaser.Input.Keyboard.JustDown(this.#keys.vier);

      if (ja) {
        wechsleRaum(this, this.#gewaehlterRaum, this.#aktuelleScene);
      } else if (nein) {
        this.#versteckeHinweis();
        this.#zustand = "normal";
      }
      return;
    }

    //Normalzustand
    if (
      Phaser.Input.Keyboard.JustDown(this.#keys.esc) ||
      Phaser.Input.Keyboard.JustDown(this.#keys.m)
    ) {
      this.scene.stop(SCENE_KEYS.MENU_SCENE);
      this.scene.resume(this.#aktuelleScene);
      return;
    }

    const raumTasten = [
      this.#keys.eins,
      this.#keys.zwei,
      this.#keys.drei,
      this.#keys.vier,
    ];
    for (let i = 0; i < raumTasten.length; i++) {
      if (Phaser.Input.Keyboard.JustDown(raumTasten[i])) {
        this.#raumGewaehlt(i + 1);
        return;
      }
    }
  }

  //-------------Funktionen-------------
  #raumGewaehlt(raumZahl) {
    const name = this.#raumTitel[raumZahl - 1];

    if (holeRaumKey(raumZahl) === this.#aktuelleScene) {
      //schon in gewähltem Raum => 2s Info, Menü währenddessen gesperrt
      this.#zustand = "info";
      this.#zeigeHinweis(
        `Du befindest dich bereits in Raum ${raumZahl}\n(${name}).`,
      );
      this.time.delayedCall(2000, () => {
        this.#versteckeHinweis();
        this.#zustand = "normal";
      });
    } else {
      //anderer Raum => erst nachfragen
      this.#zustand = "frage";
      this.#gewaehlterRaum = raumZahl;
      this.#zeigeHinweis(
        `Möchtest du zu Raum ${raumZahl}\n(${name}) wechseln?\n\n1 = Ja     2 = Nein`,
      );
    }
  }

  #zeigeHinweis(text) {
    this.#hinweisText.setText(text).setVisible(true);
    this.#hinweisBox
      .setSize(this.#hinweisText.width + 40, this.#hinweisText.height + 40)
      .setVisible(true);
  }

  #versteckeHinweis() {
    this.#hinweisText.setVisible(false);
    this.#hinweisBox.setVisible(false);
  }
}
