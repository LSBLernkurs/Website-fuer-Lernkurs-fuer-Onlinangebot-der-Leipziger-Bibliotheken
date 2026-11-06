import { SCENE_KEYS } from "../common/scene-keys.js";
import { BaseRoomScene } from "../common/base-room-scene.js";
import { wechsleRaum } from "../common/raum-wechsel.js";
import { holeRaumInfos } from "../common/raum-infos.js";

//Startbildschirm mit Einführung und Raumauswahl.
//Die Scene arbeitet wie ein kleiner Ablaufplan, der aktuelle Schritt steht in #zustand:
//"einfuehrung" => Titel + "Drücke i": warten auf I
//"text0"       => Einführungstext 0 im Textfeld (bleibt, bis der Spieler M drückt und das Menü öffnet)
//"text1"       => Einführungstext 1 im Textfeld (nach dem Schließen des Menüs)
//"auswahl"     => Raumauswahl mit den Zahlen-Tasten
//"frage"       => Rückfrage "Möchtest du zu Raum X wechseln?" (1 = Ja, 2 = Nein)
//Sie erbt von BaseRoomScene, um das Textfeld (openTextfeld) und die Tasten (this.tasten) zu nutzen.
export class AnfangScene extends BaseRoomScene {
  #kartenBreite;
  #kartenHoehe;
  #anfangBox;
  #anfangText;
  #fortfahrenText;
  #textKonfig;
  #hinweisBox;
  #hinweisText;
  #raumTitel;
  #raumDauer;
  #zustand;
  #gewaehlterRaum;
  #zahlenTasten;

  constructor() {
    super({ key: SCENE_KEYS.ANFANG_SCENE });
    console.log("anfang-scene wurde erstellt");
  }

  init() {
    //Basis-Initialisierung
    super.init();

    //0 = Anfang (die Räume sind 1 bis 4). Wird vom Menü gebraucht
    this.raumNummer = 0;

    //Fallback-Texte, falls das Sheet nicht geladen werden konnte
    const text = this.registry.get("anfangUndEndeText");
    this.#anfangText = text && text.length > 0 ? text : ["Anfang", "Ende"];

    const { titel, dauer } = holeRaumInfos(this.registry);
    this.#raumTitel = titel;
    this.#raumDauer = dauer;

    this.#kartenBreite = this.scale.width;
    this.#kartenHoehe = this.scale.height;

    this.#zustand = "einfuehrung";
    this.#gewaehlterRaum = null;

    //Zahlen-Tasten 1 bis 4 (Index 0 = Taste 1 = Raum 1), jeweils normale Taste + Numpad-Taste
    const keyCodes = Phaser.Input.Keyboard.KeyCodes;
    const tasten = this.input.keyboard.addKeys({
      eins: keyCodes.ONE,
      einsNum: keyCodes.NUMPAD_ONE,
      zwei: keyCodes.TWO,
      zweiNum: keyCodes.NUMPAD_TWO,
      drei: keyCodes.THREE,
      dreiNum: keyCodes.NUMPAD_THREE,
      vier: keyCodes.FOUR,
      vierNum: keyCodes.NUMPAD_FOUR,
    });
    this.#zahlenTasten = [
      [tasten.eins, tasten.einsNum],
      [tasten.zwei, tasten.zweiNum],
      [tasten.drei, tasten.dreiNum],
      [tasten.vier, tasten.vierNum],
    ];

    this.#textKonfig = {
      fontFamily: "QuinqueFive",
      fontSize: "20px",
      color: "#ffffff",
      align: "center",
      lineSpacing: 5,
    };

    //"resume" wird ausgelöst, wenn das Textfeld oder Menü beendet wurde und diese Scene fortgesetzt wird.
    //Erst off, dann on: init läuft bei jedem Neustart der Scene, so wird der Listener nie doppelt angemeldet
    this.events.off("resume", this.#beiFortsetzen, this);
    this.events.on("resume", this.#beiFortsetzen, this);
    this.events.once("shutdown", () =>
      this.events.off("resume", this.#beiFortsetzen, this),
    );
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
    this.#anfangBox = this.add
      .rectangle(
        25,
        15,
        this.#kartenBreite - 50,
        this.#kartenHoehe - 50,
        0x000000,
      )
      .setOrigin(0);

    //Hintergrundbild in der Mitte der Box: eine einzelne Kachel (Frame 704 im Spritesheet),
    //auf das 18-fache vergrößert (32 * 18 = 576 px), damit sie die ganze Box füllt, und durchscheinend (alpha), damit der Text lesbar bleibt
    this.add
      .sprite(
        this.#anfangBox.x + this.#anfangBox.width / 2,
        this.#anfangBox.y + this.#anfangBox.height / 2,
        "anfangUndEndeHintergrund",
        704,
      )
      .setScale(18)
      .setAlpha(0.3);

    //Im Sheet steht der Zeilenumbruch als Zeichen "\n". Hier wird er in einen echten Umbruch umgewandelt
    const formatierterText = this.#anfangText[0].replace(/\\n/g, "\n");
    //Abstand zwischen Text und Rand der Box
    const innenabstand = 20;

    //Titel: waagerecht mittig, senkrecht auf einem Viertel der Boxhöhe (height / 4)
    this.add
      .text(
        this.#anfangBox.x + this.#anfangBox.width / 2,
        this.#anfangBox.y + this.#anfangBox.height / 4,
        formatierterText,
        this.#textKonfig,
      )
      .setOrigin(0.5)
      .setFontSize("35px")
      .setWordWrapWidth(this.#anfangBox.width - innenabstand * 2, true);

    //"Drücke die i-Taste": waagerecht mittig, senkrecht bei drei Vierteln der Boxhöhe (height / 2 + height / 4)
    this.#fortfahrenText = this.add
      .text(
        this.#anfangBox.x + this.#anfangBox.width / 2,
        this.#anfangBox.y +
          this.#anfangBox.height / 2 +
          this.#anfangBox.height / 4,
        "Drücke die i-Taste um fortzufahren",
        this.#textKonfig,
      )
      .setOrigin(0.5)
      .setWordWrapWidth(this.#anfangBox.width - innenabstand * 2, true);

    //Tween für Schwebebewegung des Textes (20 Pixel nach oben)
    this.tweens.add({
      targets: this.#fortfahrenText,
      y: this.#fortfahrenText.y - 20,
      duration: 1500, //Dauer in Millisekunden
      ease: "Sine.easeInOut", //Sanftes Abbremsen und Beschleunigen
      yoyo: true,
      loop: -1, //-1 = Endlosschleife
    });

    //Hinweisbox in der Bildschirmmitte
    //Sie wird für die Raumauswahl und die Rückfrage verwendet. Gelber Rand (0xffd966).
    //Die Größe 300x100 ist nur ein Startwert, #setzeHinweis passt sie an den Text an.
    //setDepth: Box (10) liegt unter dem Text (11), beides über dem Rest der Scene
    const mitteX = this.cameras.main.centerX;
    const mitteY = this.cameras.main.centerY;

    this.#hinweisBox = this.add
      .rectangle(mitteX, mitteY, 300, 100, 0x000000, 1)
      .setStrokeStyle(2, 0xffd966)
      .setDepth(10)
      .setVisible(false);

    this.#hinweisText = this.add
      .text(mitteX, mitteY, "", {
        ...this.#textKonfig,
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
      if (Phaser.Input.Keyboard.JustDown(this.tasten.i)) {
        this.#zustand = "text0";
        //bisMTaste: der Text bleibt stehen, bis der Spieler M drückt (und damit das Menü kennenlernt)
        this.openTextfeld("0", "einführung", { bisMTaste: true });
      }
      return;
    }

    //Raumauswahl
    if (this.#zustand === "auswahl") {
      for (let i = 0; i < this.#raumTitel.length; i++) {
        if (tasten[i] && this.#zahlGedrueckt(tasten[i])) {
          this.#gewaehlterRaum = i + 1;
          this.#zeigeFrage();
          return;
        }
      }
      return;
    }

    //Rückfrage: 1 = Ja, 2 = Nein
    if (this.#zustand === "frage") {
      const ja = this.#zahlGedrueckt(tasten[0]);
      const nein = this.#zahlGedrueckt(tasten[1]);
      this.#zahlGedrueckt(tasten[2]); //andere Zahlen verwerfen, damit sie nicht nachträglich ausgelöst werden
      this.#zahlGedrueckt(tasten[3]);

      if (ja) {
        wechsleRaum(this, this.#gewaehlterRaum, this.scene.key);
      } else if (nein) {
        this.#zeigeAuswahl();
      }
    }
  }

  //-------------Funktionen-------------
  //Prüft, ob eine der Tasten einer Zahl (normale Taste oder Numpad) gerade gedrückt wurde.
  //JustDown muss für jede Taste aufgerufen werden (sonst bleibt ein Tastendruck "übrig"), deshalb map statt some direkt auf den Tasten
  #zahlGedrueckt(tastenEinerZahl) {
    return tastenEinerZahl
      .map((taste) => Phaser.Input.Keyboard.JustDown(taste))
      .some(Boolean);
  }

  //Wird aufgerufen, sobald das Textfeld bzw. das Menü geschlossen wurde und diese Scene weiterläuft.
  //Ablauf: Text 0 (wartet auf M) => Menü öffnen und schließen => Text 1 => Textfeld schließen => Raumauswahl
  #beiFortsetzen() {
    if (this.#zustand === "text0") {
      this.#zustand = "text1";
      this.openTextfeld("1", "einführung");
    } else if (this.#zustand === "text1") {
      //Textfeld id 1 wurde durchgeklickt => Raumauswahl
      this.#zeigeAuswahl();
    }
  }

  //Zeigt die Liste aller Räume (Name + Dauer) in der Hinweisbox
  #zeigeAuswahl() {
    this.#zustand = "auswahl";
    this.#gewaehlterRaum = null;
    this.#fortfahrenText.setVisible(false);

    const zeilen = this.#raumTitel.map((titel, i) => {
      const dauerText = " " + this.#raumDauer[i];
      return `${i + 1}${". Raum"}   ${titel}${dauerText}`;
    });
    this.#setzeHinweis(
      [
        "Wähle einen Raum durch Drücken der passenden Zahlen-Taste:",
        "",
        ...zeilen,
      ].join("\n"),
      "left",
    );
  }

  //Rückfrage, ob in den gewählten Raum gewechselt werden soll
  #zeigeFrage() {
    this.#zustand = "frage";
    const name = this.#raumTitel[this.#gewaehlterRaum - 1];
    this.#setzeHinweis(
      `Möchtest du zu Raum ${this.#gewaehlterRaum}\n(${name}) wechseln?\n\n1 = Ja     2 = Nein`,
      "center",
    );
  }

  //Setzt den Text der Hinweisbox, richtet ihn aus ("left" / "center") und passt die Box an die Textgröße an
  //+40 = 20px Innenabstand auf jeder Seite des Textes
  #setzeHinweis(text, ausrichtung) {
    this.#hinweisText.setText(text).setAlign(ausrichtung).setVisible(true);
    this.#hinweisBox
      .setSize(this.#hinweisText.width + 40, this.#hinweisText.height + 40)
      .setVisible(true);
  }
}
