import { SCENE_KEYS } from "../common(keys)/scene-keys.js";
import { logger } from "../common(keys)/logger.js";

export class EndeScene extends Phaser.Scene {
  #mapBreite;
  #mapHoehe;
  #endeBox;
  #endeText;
  #textConfig;

  constructor() {
    super({ key: SCENE_KEYS.ENDE_SCENE });
    console.log("ende-scene wurde erstellt");
  }

  init() {
    const text = this.registry.get("anfangUndEndeText");
    this.#endeText = text && text.length > 0 ? text : ["Anfang", "Ende"];

    this.#mapBreite = 480;
    this.#mapHoehe = 512;

    this.#textConfig = {
      fontFamily: "QuinqueFive",
      fontSize: "20px",
      color: "#ffffff",
      align: "center",
      lineSpacing: 5,
    };

    logger.szeneBetreten(this.scene.key);
  }

  preload() {
    this.load.spritesheet(
      "endeHintergrund",
      "assets/anfangUndEnde-raum/BaseChip_pipo.png",
      {
        frameWidth: 32,
        frameHeight: 32,
      },
    );
  }

  create() {
    this.#endeBox = this.add
      .rectangle(25, 15, this.#mapBreite - 50, this.#mapHoehe - 50, 0x000000)
      .setOrigin(0);

    this.add
      .sprite(
        this.#endeBox.x + this.#endeBox.width / 2,
        this.#endeBox.y + this.#endeBox.height / 2,
        "endeHintergrund",
        873,
      )
      .setScale(18)
      .setAlpha(0.4);

    const formatierterText = this.#endeText[1].replace(/\\n/g, "\n");
    const innenabstand = 20;

    this.add
      .text(
        this.#endeBox.x + this.#endeBox.width / 2,
        this.#endeBox.y + this.#endeBox.height / 2,
        formatierterText,
        this.#textConfig,
      )
      .setOrigin(0.5)
      .setWordWrapWidth(this.#endeBox.width - innenabstand * 2, true);

    logger.speichern();
  }
}
