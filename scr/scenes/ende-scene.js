import { SCENE_KEYS } from "../common/scene-keys.js";
import { logger } from "../common/logger.js";

//Letzte Scene des Spiels: zeigt den Abschlusstext (zweiter Eintrag aus der Spalte "Anfang und Ende" im Sheet).
//Neu starten kann man das Spiel über die Q-Taste (siehe quit-scene.js).
export class EndeScene extends Phaser.Scene {
  #kartenBreite;
  #kartenHoehe;
  #endeBox;
  #endeText;
  #textKonfig;

  constructor() {
    super({ key: SCENE_KEYS.ENDE_SCENE });
    console.log("ende-scene wurde erstellt");
  }

  init() {
    //Fallback-Texte, falls das Sheet nicht geladen werden konnte
    const text = this.registry.get("anfangUndEndeText");
    this.#endeText = text && text.length > 0 ? text : ["Anfang", "Ende"];

    this.#kartenBreite = this.scale.width;
    this.#kartenHoehe = this.scale.height;

    this.#textKonfig = {
      fontFamily: "QuinqueFive",
      fontSize: "20px",
      color: "#ffffff",
      align: "center",
      lineSpacing: 5,
    };

    logger.szeneBetreten(this.scene.key);
  }

  preload() {
    //Das Spritesheet wird nur wegen einer einzelnen Kachel geladen, die als Hintergrund dient (siehe create)
    this.load.spritesheet(
      "anfangUndEndeHintergrund",
      "assets/anfangUndEnde-raum (und Schluessel-UI)/BaseChip_pipo.png",
      {
        frameWidth: 32,
        frameHeight: 32,
      },
    );
  }

  create() {
    //Schwarze Box: 25px Abstand links/rechts (Breite -50), 15px oben, unten bleiben 35px frei (Höhe -50 bei 15px Start)
    this.#endeBox = this.add
      .rectangle(
        25,
        15,
        this.#kartenBreite - 50,
        this.#kartenHoehe - 50,
        0x000000,
      )
      .setOrigin(0);

    //Hintergrundbild in der Mitte der Box: eine einzelne Kachel (Frame 873 im Spritesheet),
    //auf das 18-fache vergrößert (32 * 18 = 576 px), damit sie die ganze Box füllt, und durchscheinend (alpha), damit der Text lesbar bleibt
    this.add
      .sprite(
        this.#endeBox.x + this.#endeBox.width / 2,
        this.#endeBox.y + this.#endeBox.height / 2,
        "anfangUndEndeHintergrund",
        706,
      )
      .setScale(18)
      .setAlpha(0.4);

    this.#konfetti();

    //Im Sheet steht der Zeilenumbruch als Zeichen "\n". Hier wird er in einen echten Umbruch umgewandelt
    const formatierterText = this.#endeText[1].replace(/\\n/g, "\n");
    //Abstand zwischen Text und Rand der Box
    const innenabstand = 20;

    //Text mittig in der Box, Zeilenumbruch automatisch bei Boxbreite minus Innenabstand auf beiden Seiten
    this.add
      .text(
        this.#endeBox.x + this.#endeBox.width / 2,
        this.#endeBox.y + this.#endeBox.height / 2,
        formatierterText,
        this.#textKonfig,
      )
      .setOrigin(0.5)
      .setStroke("#000000", 6)
      .setWordWrapWidth(this.#endeBox.width - innenabstand * 2, true);

    this.events.once("shutdown", () => logger.szeneVerlassen(this.scene.key));
  }

  #konfetti() {
    const textur = this.textures.createCanvas("particleTextur", 10, 10);
    const kontext = textur.getContext();
    kontext.fillStyle = "#999999";
    kontext.fillRect(0, 0, 10, 10);
    textur.refresh();

    this.add.particles(0, 0, "particleTextur", {
      emitZone: {
        type: "random",
        quantity: 1,
        source: new Phaser.Geom.Rectangle(0, -50, 800, 1),
      },
      speedY: { min: 100, max: 150 },
      speedX: { min: -100, max: 100 },
      accelerationY: { min: 50, max: 80 },
      lifespan: { min: 2700, max: 3000 },
      scaleX: {
        onUpdate: (particle, key, t) => {
          return Math.sin((t / 1) * Math.PI * 10);
        },
      },
      blendMode: "ADD",
      rotate: { min: -180, max: 180 },
      frequency: 50,
      quantity: 2,
      tint: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff],
      blendMode: "ADD",
    });
  }
}
