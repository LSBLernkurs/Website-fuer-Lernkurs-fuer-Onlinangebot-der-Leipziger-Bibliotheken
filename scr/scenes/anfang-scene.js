import { SCENE_KEYS } from "../common(keys)/scene-keys.js";
import { BaseRoomScene } from "../common(keys)/base-room-scene.js";
import { wechsleRaum } from "../common(keys)/raum-wechsel.js";
import { logger } from "../common(keys)/logger.js";

export class AnfangScene extends BaseRoomScene {
  #mapBreite;
  #mapHoehe;
  #anfangBox;
  #anfangText;
  #hinweis;
  #textConfig;
  #hinweisBox;
  #hinweisText;
  #raumTitel;
  #raumDauer;
  #zustand;
  #gewaehlterRaum;
  #sTaste;
  #zahlenTasten;

  constructor() {
    super({ key: SCENE_KEYS.ANFANG_SCENE });
    console.log("anfang-scene wurde erstellt");
  }

  init() {
    //Basis-Initialisierung (loggt Betreten/Verlassen bereits selbst)
    super.init();

    this.raumNummer = 0;

    const text = this.registry.get("anfangUndEndeText");
    this.#anfangText = text && text.length > 0 ? text : ["Anfang", "Ende"];
    const geladeneRaumNamen = this.registry.get("raumNamen");
    this.#raumTitel =
      geladeneRaumNamen && geladeneRaumNamen.length > 0
        ? geladeneRaumNamen
        : ["Raum 1", "Raum 2", "Raum 3", "Raum 4"];

    this.#raumDauer = [10, 10, 3, 20];

    this.#mapBreite = 480;
    this.#mapHoehe = 512;

    this.#zustand = "einfuehrung";
    this.#gewaehlterRaum = null;

    this.#sTaste = this.input.keyboard.addKey("S");
    const keyCodes = Phaser.Input.Keyboard.KeyCodes;
    const tasten = this.input.keyboard.addKeys({
      eins: keyCodes.ONE,
      zwei: keyCodes.TWO,
      drei: keyCodes.THREE,
      vier: keyCodes.FOUR,
    });
    this.#zahlenTasten = [tasten.eins, tasten.zwei, tasten.drei, tasten.vier];

    this.#textConfig = {
      fontFamily: "QuinqueFive",
      fontSize: "20px",
      color: "#ffffff",
      align: "center",
      lineSpacing: 5,
    };
  }

  preload() {
    this.load.spritesheet(
      "anfangHintergrund",
      "assets/anfangUndEnde-raum/BaseChip_pipo.png",
      {
        frameWidth: 32,
        frameHeight: 32,
      },
    );
  }

  create() {
    this.#anfangBox = this.add
      .rectangle(25, 15, this.#mapBreite - 50, this.#mapHoehe - 50, 0x000000)
      .setOrigin(0);

    this.add
      .sprite(
        this.#anfangBox.x + this.#anfangBox.width / 2,
        this.#anfangBox.y + this.#anfangBox.height / 2,
        "anfangHintergrund",
        704,
      )
      .setScale(18)
      .setAlpha(0.3);

    const formatierterText = this.#anfangText[0].replace(/\\n/g, "\n");
    const innenabstand = 20;

    this.add
      .text(
        this.#anfangBox.x + this.#anfangBox.width / 2,
        this.#anfangBox.y + this.#anfangBox.height / 4,
        formatierterText,
        this.#textConfig,
      )
      .setOrigin(0.5)
      .setFontSize("35px")
      .setWordWrapWidth(this.#anfangBox.width - innenabstand * 2, true);

    this.#hinweis = this.add
      .text(
        this.#anfangBox.x + this.#anfangBox.width / 2,
        this.#anfangBox.y +
          this.#anfangBox.height / 2 +
          this.#anfangBox.height / 4,
        "Drücke die i-Taste um fortzufahren",
        this.#textConfig,
      )
      .setOrigin(0.5)
      .setWordWrapWidth(this.#anfangBox.width - innenabstand * 2, true);

    //Hinweisbox in der Bildschirmmitte (zunächst unsichtbar)
    const mitteX = this.cameras.main.centerX;
    const mitteY = this.cameras.main.centerY;

    this.#hinweisBox = this.add
      .rectangle(mitteX, mitteY, 300, 100, 0x000000, 1)
      .setStrokeStyle(2, 0xffd966)
      .setDepth(10)
      .setVisible(false);

    this.#hinweisText = this.add
      .text(mitteX, mitteY, "", {
        ...this.#textConfig,
        fontSize: "16px",
        wordWrap: { width: 340 },
      })
      .setOrigin(0.5)
      .setDepth(11)
      .setVisible(false);
  }

  update() {
    const tasten = this.#zahlenTasten;

    //Einführungstext
    if (this.#zustand === "einfuehrung") {
      if (Phaser.Input.Keyboard.JustDown(this.#sTaste)) {
        logger.dateiFuerAutosaveWaehlen();
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.i)) {
        this.#zustand = "dialog";
        this.events.once("resume", () => this.#zeigeAuswahl());
        this.openTextfeld("0", "einführung");
      }
      return;
    }

    //Raumauswahl
    if (this.#zustand === "auswahl") {
      for (let i = 0; i < this.#raumTitel.length; i++) {
        if (tasten[i] && Phaser.Input.Keyboard.JustDown(tasten[i])) {
          this.#gewaehlterRaum = i + 1;
          this.#zeigeFrage();
          return;
        }
      }
      return;
    }

    //Rückfrage: 1 = Ja, 2 = Nein
    if (this.#zustand === "frage") {
      const ja = Phaser.Input.Keyboard.JustDown(tasten[0]);
      const nein = Phaser.Input.Keyboard.JustDown(tasten[1]);
      Phaser.Input.Keyboard.JustDown(tasten[2]); //andere Zahlen verwerfen, damit sie nicht nachträglich ausgelöst werden
      Phaser.Input.Keyboard.JustDown(tasten[3]);

      if (ja) {
        wechsleRaum(this, this.#gewaehlterRaum, this.scene.key);
      } else if (nein) {
        this.#zeigeAuswahl();
      }
    }
  }

  //-------------Funktionen-------------
  #zeigeAuswahl() {
    this.#zustand = "auswahl";
    this.#gewaehlterRaum = null;
    this.#hinweis.setVisible(false);

    const zeilen = this.#raumTitel.map((titel, i) => {
      const dauer = this.#raumDauer[i];
      const dauerText = dauer !== undefined ? ` ~${dauer}min` : "";
      return `${i + 1}  ${titel}${dauerText}`;
    });
    this.#setzeHinweis(["Wähle einen Raum:", "", ...zeilen].join("\n"), "left");
  }

  #zeigeFrage() {
    this.#zustand = "frage";
    const name = this.#raumTitel[this.#gewaehlterRaum - 1];
    this.#setzeHinweis(
      `Möchtest du zu Raum ${this.#gewaehlterRaum}\n(${name}) wechseln?\n\n1 = Ja     2 = Nein`,
      "center",
    );
  }

  #setzeHinweis(text, ausrichtung) {
    this.#hinweisText.setText(text).setAlign(ausrichtung).setVisible(true);
    this.#hinweisBox
      .setSize(this.#hinweisText.width + 40, this.#hinweisText.height + 40)
      .setVisible(true);
  }
}
