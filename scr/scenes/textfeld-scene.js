import { SCENE_KEYS } from "../common(keys)/scene-keys.js";
import { logger } from "../common(keys)/logger.js";

export class TextfeldScene extends Phaser.Scene {
  #textBox;
  #textLink;
  #textSprecher;
  #textInhalt;
  #textConfig;
  #keys;
  #textKey;
  #zielTyp;
  #istAuswahlModus;
  #auswahlModusIndex;
  #optionsTexte;
  #auswahlBalken;
  #playerAuswahl;
  #aktuelleScene;

  constructor() {
    super({ key: SCENE_KEYS.TEXT_SCENE });
    console.log("textfeld-scene wurde erstellt");
  }

  init(data) {
    this.#aktuelleScene = data.aktuelleScene;

    this.#istAuswahlModus = false;
    this.#auswahlModusIndex = 0; //0 = Ja, 1 = Nein
    this.#optionsTexte = [];

    this.#textKey = data.textKey || "default";
    this.#playerAuswahl =
      data.playerAuswahl !== undefined ? data.playerAuswahl : null;
    this.#zielTyp = data.zielTyp || "default";

    this.#keys = this.input.keyboard.addKeys({
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      i: Phaser.Input.Keyboard.KeyCodes.I,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
    });

    this.#textConfig = {
      fontFamily: "QuinqueFive",
      fontSize: "16px",
      color: "#ffffff",
      align: "justify",
      lineSpacing: 3,
      wordWrap: {
        width: this.scale.width - 50,
        useAdvancedWrap: true,
      },
    };

    //Daten aus Registry holen
    const alleTexte = this.registry.get("spielTexte") || {};
    const aktuellerEintrag = alleTexte[this.#textKey];

    if (aktuellerEintrag) {
      this.#textLink = aktuellerEintrag.link || null;
      this.#textSprecher = aktuellerEintrag.sprecher;
      this.#textInhalt = aktuellerEintrag.inhalt;
    } else {
      this.#textLink = null;
      this.#textSprecher = "System";
      this.#textInhalt = "Text für ID " + this.#textKey + " nicht gefunden.";
    }

    logger.szeneBetreten(this.scene.key);
    this.events.once("shutdown", () => logger.szeneVerlassen(this.scene.key));
  }

  preload() {}

  create() {
    this.#textBox = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height / 3, 0x000000, 0.8)
      .setOrigin(0);

    //Sprecher
    this.add
      .text(
        this.#textBox.x + 20,
        this.#textBox.y + 20,
        this.#textSprecher,
        this.#textConfig,
      )
      .setFontStyle("bold italic");

    //Gesprochener Text
    this.text = this.add.text(
      this.#textBox.x + 20,
      this.#textBox.y + 40,
      "",
      this.#textConfig,
    );

    this.dummyText = this.make
      .text({
        x: 0,
        y: 0,
        text: "",
        style: this.#textConfig,
      })
      .setVisible(false);

    this.#auswahlBalken = this.add.graphics();
    this.#auswahlBalken.setVisible(false);

    const verfuegbareHoehe = this.#textBox.height - 60;
    this.seiten = this.#textAufEinzeleSeitenSchneiden(
      this.#textInhalt,
      verfuegbareHoehe,
    );
    this.aktuelleSeite = 0;
    this.text.setText(this.seiten[0] || "");
  }

  update() {
    const confirmJustDown =
      Phaser.Input.Keyboard.JustDown(this.#keys.enter) ||
      Phaser.Input.Keyboard.JustDown(this.#keys.space) ||
      Phaser.Input.Keyboard.JustDown(this.#keys.i);

    if (this.#istAuswahlModus) {
      const upJustDown = Phaser.Input.Keyboard.JustDown(this.#keys.up);
      const downJustDown = Phaser.Input.Keyboard.JustDown(this.#keys.down);

      if (upJustDown && this.#auswahlModusIndex > 0) {
        this.#auswahlModusIndex = 0;
        this.#updateauswahlBalken();
      } else if (downJustDown && this.#auswahlModusIndex < 1) {
        this.#auswahlModusIndex = 1;
        this.#updateauswahlBalken();
      }

      if (confirmJustDown) {
        this.#confirmSelection();
      }
      return;
    }

    if (confirmJustDown) {
      this.aktuelleSeite++;
      if (this.aktuelleSeite < this.seiten.length) {
        this.text.setText(this.seiten[this.aktuelleSeite]);
      } else {
        if (this.#textLink) {
          this.#showOptions();
        } else {
          this.#closeScene(this.#playerAuswahl);
        }
      }
    }
  }

  #showOptions() {
    this.#istAuswahlModus = true;
    this.text.setText(""); //Haupttext ausblenden

    const startX = this.#textBox.x + 30;
    const startY = this.#textBox.y + 40;

    const jaText = this.add.text(startX, startY, "Ja", this.#textConfig);
    const neinText = this.add.text(
      startX,
      startY + 30,
      "Nein",
      this.#textConfig,
    );

    this.#optionsTexte = [jaText, neinText];
    this.#auswahlModusIndex = 0;

    this.#auswahlBalken.setVisible(true);
    this.#updateauswahlBalken();
  }

  #updateauswahlBalken() {
    const zielText = this.#optionsTexte[this.#auswahlModusIndex];

    this.#auswahlBalken.clear();
    this.#auswahlBalken.fillStyle(0x666666, 0.6); //Grauton, teilweise Transparent
    this.#auswahlBalken.fillRect(
      zielText.x - 10,
      zielText.y - 2,
      this.#textBox.width - 40,
      zielText.height + 4,
    );
  }

  #confirmSelection() {
    if (this.#auswahlModusIndex === 0) {
      if (this.#textLink) {
        logger.linkGeoeffnet(this.#textKey, this.#textLink);
        window.open(this.#textLink, "_blank");
      }
      this.#playerAuswahl = true; //=ja
      const naechsteID = Number(this.#textKey) + 2;
      this.scene.restart({
        textKey: naechsteID,
        zielTyp: this.#zielTyp,
        playerAuswahl: this.#playerAuswahl,
        aktuelleScene: this.#aktuelleScene,
      });
    } else {
      this.#playerAuswahl = false; //=nein
      const naechsteID = Number(this.#textKey) + 1;
      this.scene.restart({
        textKey: naechsteID,
        zielTyp: this.#zielTyp,
        playerAuswahl: this.#playerAuswahl,
        aktuelleScene: this.#aktuelleScene,
      });
    }
  }

  #closeScene(auswahlWeitergabe) {
    this.text.setText("");
    this.scene.stop(SCENE_KEYS.TEXT_SCENE);
    const bisherigeAuswahl = this.registry.get("dialogAuswahlen") || {};
    bisherigeAuswahl[this.#zielTyp] = auswahlWeitergabe;
    this.registry.set("dialogAuswahlen", bisherigeAuswahl);
    this.scene.resume(this.#aktuelleScene);
  }

  #textAufEinzeleSeitenSchneiden(text, maxHeight) {
    const bereinigterText = text.replace(/\\n/g, "\n");
    const abschnitte = bereinigterText.split("\n");
    const seiten = [];

    for (const abschnitt of abschnitte) {
      if (abschnitt.trim() === "") continue;

      const worte = abschnitt.split(" ");
      let aktuellerChunk = "";

      for (let i = 0; i < worte.length; i++) {
        const testChunk = aktuellerChunk
          ? aktuellerChunk + " " + worte[i]
          : worte[i];

        this.dummyText.setText(testChunk);

        if (this.dummyText.height > maxHeight && aktuellerChunk !== "") {
          seiten.push(aktuellerChunk);
          aktuellerChunk = worte[i];
        } else {
          aktuellerChunk = testChunk;
        }
      }

      if (aktuellerChunk) {
        seiten.push(aktuellerChunk);
      }
    }
    return seiten;
  }
}
