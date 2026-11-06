import { SCENE_KEYS } from "../common/scene-keys.js";
import { logger } from "../common/logger.js";
import { wechsleRaum, holeRaumKey } from "../common/raum-wechsel.js";
import { ANZAHL_RAEUME } from "../common/raum-wechsel.js";
import { holeRaumInfos } from "../common/raum-infos.js";

//Menü (M-Taste): zeigt die Steuerung und eine Karte mit allen Räumen. Es liegt über dem pausierten Raum.
//Zustände (#zustand):
//"normal" => Menü offen, Tasten werden ausgewertet
//"info"   => kurze Meldung "Du befindest dich bereits in Raum X" (2 Sekunden, Eingaben gesperrt)
//"frage"  => Rückfrage "Möchtest du zu Raum X wechseln?" (1 = Ja, 2 / ESC / M = Nein)
export class MenuScene extends Phaser.Scene {
  #kartenBreite;
  #kartenHoehe;
  #menuBox;
  #menuUeberschrift;
  #menuSteuerungTasten;
  #menuSteuerungFunktion;
  #textKonfig;
  #tasten;
  #karteBox;
  #karteLinie;
  #raumTitel;
  #raumNummer;
  #raumDauer;
  #raeume;
  #aktuelleScene;
  #raumwechselGesperrt;
  #zustand;
  #gewaehlterRaum;
  #hinweisBox;
  #hinweisText;

  constructor() {
    super({ key: SCENE_KEYS.MENU_SCENE });
    console.log("menu-scene wurde erstellt");
  }

  //data kommt vom Aufrufer (BaseRoomScene.openMenu bzw. TextfeldScene):
  //raum:                 Nummer des Raums, in dem der Spieler ist (0 = Anfang)
  //aktuelleScene:        Key der pausierten Scene, die beim Schließen fortgesetzt wird
  //raumwechselGesperrt:  true = Menü kann nur angeschaut und geschlossen werden (in der Einführung)
  init(data) {
    const { titel, dauer } = holeRaumInfos(this.registry);
    this.#raumTitel = titel;
    this.#raumDauer = dauer;

    this.#kartenBreite = this.scale.width;
    this.#kartenHoehe = this.scale.height;

    //Index in der Liste der Karten-Punkte (0 = erster Raum)
    this.#raumNummer = data.raum - 1; //-1 wegen der anfang-scene, die muss abgezogen werden

    this.#aktuelleScene = data.aktuelleScene;
    this.#raumwechselGesperrt = data.raumwechselGesperrt === true; //damit Menü nur geschlossen werden kann
    this.#zustand = "normal";
    this.#gewaehlterRaum = null;

    this.#tasten = this.input.keyboard.addKeys({
      esc: Phaser.Input.Keyboard.KeyCodes.ESC,
      m: Phaser.Input.Keyboard.KeyCodes.M,
      eins: Phaser.Input.Keyboard.KeyCodes.ONE,
      einsNum: Phaser.Input.Keyboard.KeyCodes.NUMPAD_ONE,
      zwei: Phaser.Input.Keyboard.KeyCodes.TWO,
      zweiNum: Phaser.Input.Keyboard.KeyCodes.NUMPAD_TWO,
      drei: Phaser.Input.Keyboard.KeyCodes.THREE,
      dreiNum: Phaser.Input.Keyboard.KeyCodes.NUMPAD_THREE,
      vier: Phaser.Input.Keyboard.KeyCodes.FOUR,
      vierNum: Phaser.Input.Keyboard.KeyCodes.NUMPAD_FOUR,
    });

    this.#textKonfig = {
      fontFamily: "QuinqueFive",
      fontSize: "14px",
      color: "#ffffff",
      align: "justify",
      lineSpacing: 5,
    };

    //Die beiden Listen gehören zusammen: gleicher Index = gleiche Zeile in der Tabelle
    this.#menuSteuerungTasten = [
      "Pfeiltasten",
      "Zahlen-Tasten",
      "I",
      "I/SPACE/ENTER",
      "M",
      "M/ESC",
      "K",
      "Q",
    ];
    this.#menuSteuerungFunktion = [
      "Bewegung im Raum",
      "Raum im Menü wechseln",
      "Mit Personen/Objekten interagieren",
      "Dialog weiter & Bestätigen",
      "Menü öffnen",
      "Menü schließen",
      "Schlüssel einsetzen",
      "Spiel beenden",
    ];

    logger.szeneBetreten(this.scene.key);
    this.events.once("shutdown", () => logger.szeneVerlassen(this.scene.key));
  }

  create() {
    //Halbtransparente Box (alpha 0.8), damit der pausierte Raum dahinter noch schwach zu sehen ist.
    //25px Abstand links/rechts (Breite -50), 15px oben, unten bleiben 35px frei (Höhe -50 bei 15px Start)
    this.#menuBox = this.add
      .rectangle(
        25,
        15,
        this.#kartenBreite - 50,
        this.#kartenHoehe - 50,
        0x000000,
        0.8,
      )
      .setOrigin(0);

    //Überschrift Menü
    //(x = halbe Boxbreite, der Text ist linksbündig verankert und steht daher ungefähr in der Mitte; y + 10 = Abstand zum oberen Boxrand)
    this.#menuUeberschrift = this.add
      .text(
        this.#menuBox.width / 2,
        this.#menuBox.y + 10,
        "Menü",
        this.#textKonfig,
      )
      .setAlign("center")
      .setFontSize("25px");

    //Überschrift Links
    //+20 = Innenabstand zum linken Boxrand, +40 = Platz für die große Überschrift "Menü"
    this.add
      .text(
        this.#menuBox.x + 20,
        this.#menuBox.y + 40,
        "Taste",
        this.#textKonfig,
      )
      .setFontStyle("bold italic")
      .setFontSize("16px");

    //Überschrift Rechts
    //x = menuBox.width mit setOrigin(1, 0) => der Text endet rechtsbündig bei dieser x-Position (die Box beginnt bei x = 25)
    this.add
      .text(
        this.#menuBox.width,
        this.#menuBox.y + 40,
        "Funktion",
        this.#textKonfig,
      )
      .setAlign("right")
      .setFontStyle("bold italic")
      .setFontSize("16px")
      .setOrigin(1, 0);

    //Inhalt Links
    //+60 = 20px unter den Überschriften "Taste" / "Funktion" (die bei +40 stehen)
    this.add.text(
      this.#menuBox.x + 20,
      this.#menuBox.y + 60,
      this.#menuSteuerungTasten,
      this.#textKonfig,
    );

    //Inhalt Rechts
    this.add
      .text(
        this.#menuBox.width,
        this.#menuBox.y + 60,
        this.#menuSteuerungFunktion,
        this.#textKonfig,
      )
      .setAlign("right")
      .setOrigin(1, 0);

    //Karte
    //Untere Hälfte des Menüs: Start bei der halben Höhe (+15 = Abstand zur Steuerung), 20px Rand links/rechts (Breite -40)
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
    //(gleiche x-Position wie die Überschrift "Menü", damit beide untereinander stehen)
    this.add
      .text(
        this.#menuUeberschrift.x,
        this.#karteBox.y + 10,
        "Karte",
        this.#textKonfig,
      )
      .setAlign("center")
      .setFontSize("20px");

    //Karte Linie
    //Waagerechte Linie (5px dick) bei drei Vierteln der Kartenhöhe, mit 30px Abstand links/rechts (Breite -60).
    //Auf ihr liegen die Punkte der Räume
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
    //Die Punkte werden gleichmäßig auf der Linie verteilt: Abstand = Linienbreite / (Anzahl Räume - 1)
    const linienStartX = this.#karteLinie.x;
    const abstand = this.#karteLinie.width / (ANZAHL_RAEUME - 1);
    this.#raeume = [];

    for (let i = 0; i < ANZAHL_RAEUME; i++) {
      //Radius 10, grau. setOrigin(0.4) ist eine Feinjustierung, damit der Punkt optisch mittig auf der Linie sitzt
      const punkt = this.add
        .circle(linienStartX + abstand * i, this.#karteLinie.y, 10, 0x999999)
        .setOrigin(0.4);
      this.#raeume.push(punkt);

      //Titel (um 90° gedreht über dem Punkt)
      //-15 = Abstand über dem Punkt, Zeilenumbruch bei 130px damit lange Titel nicht aus der Karte ragen.
      //Die Ursprungswerte (1, 0.6) sind Feinjustierung der gedrehten Textposition
      this.add
        .text(punkt.x, punkt.y - 15, this.#raumTitel[i] || "", this.#textKonfig)
        .setOrigin(1, 0.6)
        .setAngle(90)
        .setWordWrapWidth(130);

      //Raumnummer unter dem Punkt
      //(-1 / +15: Feinjustierung, damit die Zahl mittig unter dem Punkt steht)
      this.add.text(punkt.x - 1, punkt.y + 15, String(i + 1), this.#textKonfig);

      //Dauer unter der Nummer
      this.add
        .text(
          punkt.x - 1,
          punkt.y + 30,
          this.#raumDauer[i] || "",
          this.#textKonfig,
        )
        .setFontSize("12px")
        .setOrigin(0.5, 0);
    }

    //Markierung des aktuellen Raums: kleiner schwarzer Punkt (Radius 5) in der Mitte des größeren Punktes
    if (this.#raeume[this.#raumNummer]) {
      this.add
        .circle(
          this.#raeume[this.#raumNummer].x,
          this.#raeume[this.#raumNummer].y,
          5,
          0x000000,
        )
        .setOrigin(0.3);
    }

    //Hinweisbox
    //Für die Rückfrage und die Info "Du befindest dich bereits in Raum X". Gelber Rand (0xffd966).
    //Die Größe 300x100 ist nur ein Startwert, #zeigeHinweis passt sie an den Text an.
    //setDepth: Box (10) liegt unter dem Text (11), beides über dem Rest der Scene
    const mitteX = this.cameras.main.centerX;
    const mitteY = this.cameras.main.centerY;

    this.#hinweisBox = this.add
      .rectangle(mitteX, mitteY, 300, 100, 0x000000, 1)
      .setStrokeStyle(2, 0xffd966)
      .setDepth(10)
      .setVisible(false);

    this.#hinweisText = this.add
      .text(mitteX, mitteY, "", this.#textKonfig)
      .setAlign("center")
      .setWordWrapWidth(250)
      .setOrigin(0.5)
      .setDepth(11)
      .setVisible(false);
  }

  update() {
    //Alle Punkte bis zum aktuellen Raum werden gelb (= in der Theorie schon besucht bzw. erreicht)
    for (let i = 0; i <= this.#raumNummer; i++) {
      this.#raeume[i].setFillStyle(0xffd966);
    }

    //Während der Info alle Tasten verwerfen (sonst werden sie danach nachträglich ausgelöst)
    if (this.#zustand === "info") {
      Object.values(this.#tasten).forEach((taste) =>
        Phaser.Input.Keyboard.JustDown(taste),
      );
      return;
    }

    //Rückfrage: 1 = Ja, 2, ESC, M = Nein
    if (this.#zustand === "frage") {
      const ja =
        Phaser.Input.Keyboard.JustDown(this.#tasten.eins) ||
        Phaser.Input.Keyboard.JustDown(this.#tasten.einsNum);
      //JustDown muss für jede Taste aufgerufen werden (sonst bleibt ein Tastendruck "übrig"), deshalb map statt some
      const nein = [
        this.#tasten.zwei,
        this.#tasten.zweiNum,
        this.#tasten.esc,
        this.#tasten.m,
      ]
        .map((taste) => Phaser.Input.Keyboard.JustDown(taste))
        .some(Boolean);
      Phaser.Input.Keyboard.JustDown(this.#tasten.drei);
      Phaser.Input.Keyboard.JustDown(this.#tasten.dreiNum);
      Phaser.Input.Keyboard.JustDown(this.#tasten.vier);
      Phaser.Input.Keyboard.JustDown(this.#tasten.vierNum);

      if (ja) {
        wechsleRaum(this, this.#gewaehlterRaum, this.#aktuelleScene);
      } else if (nein) {
        this.#versteckeHinweis();
        this.#zustand = "normal";
      }
      return;
    }

    //Normalzustand
    //Menü schließen: Menü beenden und die pausierte Scene fortsetzen
    if (
      Phaser.Input.Keyboard.JustDown(this.#tasten.esc) ||
      Phaser.Input.Keyboard.JustDown(this.#tasten.m)
    ) {
      this.scene.stop(SCENE_KEYS.MENU_SCENE);
      this.scene.resume(this.#aktuelleScene);
      return;
    }

    //Zahlen-Tasten 1 bis 4 = Raum wählen (Index 0 = Raum 1)
    const raumTasten = [
      [this.#tasten.eins, this.#tasten.einsNum],
      [this.#tasten.zwei, this.#tasten.zweiNum],
      [this.#tasten.drei, this.#tasten.dreiNum],
      [this.#tasten.vier, this.#tasten.vierNum],
    ];
    for (let i = 0; i < raumTasten.length; i++) {
      const gedrueckt = raumTasten[i].some((taste) =>
        Phaser.Input.Keyboard.JustDown(taste),
      );
      if (gedrueckt) {
        if (this.#raumwechselGesperrt) continue; //Raumwechsel gesperrt => Zahlen-Taste einfach verwerfen
        this.#raumGewaehlt(i + 1);
        return;
      }
    }
  }

  //-------------Funktionen-------------
  //Der Spieler hat eine Zahlen-Taste gedrückt (raumZahl 1-basiert)
  #raumGewaehlt(raumZahl) {
    const name = this.#raumTitel[raumZahl - 1];

    if (holeRaumKey(raumZahl) === this.#aktuelleScene) {
      //schon in gewähltem Raum => 2s Info, Menü währenddessen gesperrt
      this.#zustand = "info";
      this.#zeigeHinweis(
        `Du befindest dich bereits in Raum ${raumZahl}\n(${name}).`,
      );
      //2000 = 2 Sekunden (in Millisekunden)
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

  //Zeigt die Hinweisbox mit dem Text an. +40 = 20px Innenabstand auf jeder Seite des Textes
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
