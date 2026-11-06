import { SCENE_KEYS } from "../common/scene-keys.js";
import { logger } from "../common/logger.js";
import { dialogBeendet } from "../common/dialog-system.js";

//Textfeld (Dialog) am oberen Bildschirmrand. Es liegt über dem pausierten Raum.
//Ablauf: Text aus dem Sheet laden => in Seiten aufteilen => mit I / SPACE / ENTER durchblättern =>
//(wenn zum Text ein Link im Sheet steht: Auswahl "Ja" / "Nein") => Scene beenden und den Raum fortsetzen.
//
//Wichtig für das Sheet (Text-Tab): Hat ein Text einen Link, wird er als Frage behandelt.
//Je nach Antwort wird der Text mit der nächsten ID gezeigt:
//->  Nein = ID + 1,  Ja = ID + 2 (und bei "Ja" wird der Link geöffnet)
//Die IDs im Sheet müssen daher als Zahlen und in dieser Reihenfolge aufgebaut sein.
export class TextfeldScene extends Phaser.Scene {
  #textBox;
  #textFortsetzungsindikator;
  #text;
  //unsichtbarer Text, mit dem nur gemessen wird, wie hoch ein Textstück wäre (siehe #textAufEinzelneSeitenSchneiden)
  #dummyText;
  #seiten; //der Text, in Seiten aufgeteilt
  #aktuelleSeite;
  #textLink;
  #nachJa;
  #nachNein;
  #textSprecher;
  #textInhalt;
  #textKonfig;
  #tasten;
  #textKey;
  //Name des Objekts (NPC / Gegenstand), dem dieser Dialog gehört. Wird am Ende an das Dialogsystem weitergegeben
  #zielTyp;
  #istAuswahlModus;
  #auswahlModusIndex;
  #optionsTexte;
  #auswahlBalken;
  #spielerAuswahl;
  #aktuelleScene;
  #bisMTaste;
  #mHinweis;

  constructor() {
    super({ key: SCENE_KEYS.TEXT_SCENE });
    console.log("textfeld-scene wurde erstellt");
  }

  //data kommt von BaseRoomScene.openTextfeld bzw. von dieser Scene selbst (#zeigeText):
  //-  textKey:         ID des Textes im Sheet
  //-  zielTyp:         Name des Objekts, dem der Dialog gehört
  //-  aktuelleScene:   Key der pausierten Scene, die am Ende fortgesetzt wird
  //-  spielerAuswahl:  bisherige Ja/Nein-Antwort (true / false, sonst null)
  //-  bisMTaste:       true = Text bleibt auf der letzten Seite stehen, bis M gedrückt wird (Einführung)
  //-  nachJa / nachNein: Effekte (Flags), die nach der jeweiligen Antwort angewendet werden
  init(data) {
    this.#aktuelleScene = data.aktuelleScene;

    this.#istAuswahlModus = false;
    this.#auswahlModusIndex = 0; //0 = Ja, 1 = Nein
    this.#optionsTexte = [];

    this.#textKey = data.textKey || "default";
    this.#spielerAuswahl =
      data.spielerAuswahl !== undefined ? data.spielerAuswahl : null;
    this.#zielTyp = data.zielTyp || "default";
    this.#bisMTaste = data.bisMTaste === true;
    this.#nachJa = data.nachJa || [];
    this.#nachNein = data.nachNein || [];

    this.#tasten = this.input.keyboard.addKeys({
      m: Phaser.Input.Keyboard.KeyCodes.M,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      i: Phaser.Input.Keyboard.KeyCodes.I,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
    });

    //wordWrap: Zeilenumbruch bei Bildschirmbreite minus 50 (20px Abstand links, 30px rechts)
    this.#textKonfig = {
      fontFamily: "QuinqueFive",
      fontSize: "18px",
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
      //Fehlerfall: ID gibt es im Sheet nicht
      this.#textLink = null;
      this.#textSprecher = "System";
      this.#textInhalt = "Text für ID " + this.#textKey + " nicht gefunden.";
    }

    logger.szeneBetreten(this.scene.key);
    this.events.once("shutdown", () => logger.szeneVerlassen(this.scene.key));
  }

  create() {
    //Box über die volle Breite und ein Drittel der Höhe am oberen Rand
    this.#textBox = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height / 3, 0x000000, 0.8)
      .setOrigin(0);

    //Sprecher
    //(20px Abstand zum linken und oberen Rand der Box)
    this.add
      .text(
        this.#textBox.x + 20,
        this.#textBox.y + 20,
        this.#textSprecher,
        this.#textKonfig,
      )
      .setFontStyle("bold italic");

    //Gesprochener Text
    //(steht 20px unter dem Sprecher, daher +40)
    this.#text = this.add.text(
      this.#textBox.x + 20,
      this.#textBox.y + 40,
      "",
      this.#textKonfig,
    );

    //Text-Fortsetzungsindikator in Form eines kleinen weißen Dreiecks
    this.#textFortsetzungsindikator = this.add
      .triangle(
        this.#textBox.width - 40,
        this.#textBox.height - 30,
        5,
        10,
        0,
        0,
        10,
        0,
        0xffffff,
      )
      .setOrigin(0.5);

    //Tween für Schwebebewegung des Text-Fortsetzungsindikator (10 Pixel nach oben)
    this.tweens.add({
      targets: this.#textFortsetzungsindikator,
      y: this.#textFortsetzungsindikator.y + 10,
      duration: 1500, //Dauer in Millisekunden
      ease: "Sine.easeInOut", //Sanftes Abbremsen und Beschleunigen
      yoyo: true,
      loop: -1, //-1 = Endlosschleife
    });

    //Unsichtbarer Text, nur zum Messen der Texthöhe (siehe #textAufEinzelneSeitenSchneiden)
    this.#dummyText = this.make
      .text({
        x: 0,
        y: 0,
        text: "",
        style: this.#textKonfig,
      })
      .setVisible(false);

    this.#auswahlBalken = this.add.graphics();
    this.#auswahlBalken.setVisible(false);

    //Platz für den Text: Boxhöhe minus 60 = 40px oben (Sprecher + Abstand) und 20px unten
    const verfuegbareHoehe = this.#textBox.height - 60;
    this.#seiten = this.#textAufEinzelneSeitenSchneiden(
      this.#textInhalt,
      verfuegbareHoehe,
    );
    this.#aktuelleSeite = 0;
    this.#text.setText(this.#seiten[0] || "");
    this.#aktualisiereFortsetzungsindikator();

    //Hinweis unten rechts, nur auf der letzten Seite im "bis M"-Modus sichtbar
    //(20px Abstand zum rechten, 10px zum unteren Rand der Box; setOrigin(1, 1) verankert den Text an seiner rechten unteren Ecke)
    this.#mHinweis = this.add
      .text(
        this.#textBox.x + this.#textBox.width - 20,
        this.#textBox.y + this.#textBox.height - 10,
        "M = Menü öffnen",
        { ...this.#textKonfig, fontSize: "12px", align: "right" },
      )
      .setOrigin(1, 1)
      .setVisible(false);
    this.#aktualisiereMHinweis();
  }

  update() {
    const mJustDown = Phaser.Input.Keyboard.JustDown(this.#tasten.m);
    //I, SPACE und ENTER funktionieren alle als "weiter / bestätigen"
    const bestaetigeTastendruck =
      Phaser.Input.Keyboard.JustDown(this.#tasten.enter) ||
      Phaser.Input.Keyboard.JustDown(this.#tasten.space) ||
      Phaser.Input.Keyboard.JustDown(this.#tasten.i);

    //Auswahl "Ja" / "Nein": mit Pfeil hoch/runter wählen, mit der Bestätigungstaste abschicken
    if (this.#istAuswahlModus) {
      const upJustDown = Phaser.Input.Keyboard.JustDown(this.#tasten.up);
      const downJustDown = Phaser.Input.Keyboard.JustDown(this.#tasten.down);

      if (upJustDown && this.#auswahlModusIndex > 0) {
        this.#auswahlModusIndex = 0;
        this.#aktualisiereAuswahlBalken();
      } else if (downJustDown && this.#auswahlModusIndex < 1) {
        this.#auswahlModusIndex = 1;
        this.#aktualisiereAuswahlBalken();
      }

      if (bestaetigeTastendruck) {
        this.#bestaetigeAuswahl();
      }
      return;
    }

    //Verweilen bis M gedrückt wurde
    //(Einführung: auf der letzten Seite wird nicht weitergeblättert, nur M öffnet das Menü)
    if (this.#bisMTaste && this.#aktuelleSeite >= this.#seiten.length - 1) {
      if (mJustDown) {
        this.#oeffneMenueGesperrt();
      }
      return;
    }

    //Normales Weiterblättern
    if (bestaetigeTastendruck) {
      this.#aktuelleSeite++;
      if (this.#aktuelleSeite < this.#seiten.length) {
        this.#text.setText(this.#seiten[this.#aktuelleSeite]);
        this.#aktualisiereMHinweis();
        this.#aktualisiereFortsetzungsindikator();
      } else {
        //letzte Seite war schon gezeigt: mit Link => Frage, ohne Link => Dialog ist zu Ende
        if (this.#textLink) {
          this.#zeigeOptionen();
        } else {
          this.#beendeScene(this.#spielerAuswahl);
        }
      }
    }
  }

  //Der "M = Menü öffnen"-Hinweis wird nur auf der letzten Seite im "bis M"-Modus gezeigt
  #aktualisiereMHinweis() {
    const letzteSeite = this.#aktuelleSeite >= this.#seiten.length - 1;
    this.#mHinweis.setVisible(this.#bisMTaste && letzteSeite);
  }

  //Der Fortsetzungsindikator wird nur gezeigt, wenn nach der aktuellen Seite noch etwas kommt.
  //In der Auswahl selbst und im "bis M"-Modus (dort wird nicht weitergeblättert) bleibt er ausgeblendet.
  #aktualisiereFortsetzungsindikator() {
    const istLetzteSeite = this.#aktuelleSeite >= this.#seiten.length - 1;

    let folgtNochEtwas;
    if (this.#istAuswahlModus || (this.#bisMTaste && istLetzteSeite)) {
      folgtNochEtwas = false;
    } else if (!istLetzteSeite) {
      folgtNochEtwas = true;
    } else {
      folgtNochEtwas = Boolean(this.#textLink);
    }

    this.#textFortsetzungsindikator.setVisible(folgtNochEtwas);
  }

  //Öffnet das Menü ohne Raumwechsel (nur in der Einführung). Beim Schließen des Menüs läuft die Anfang-Scene weiter
  #oeffneMenueGesperrt() {
    this.scene.stop(SCENE_KEYS.TEXT_SCENE);
    this.scene.launch(SCENE_KEYS.MENU_SCENE, {
      raum: 0, //0 = Anfangsscene
      aktuelleScene: this.#aktuelleScene,
      raumwechselGesperrt: true,
    });
  }

  //Zeigt statt des Textes die beiden Antworten "Ja" und "Nein" an
  #zeigeOptionen() {
    this.#istAuswahlModus = true;
    this.#text.setText(""); //Haupttext ausblenden
    this.#aktualisiereFortsetzungsindikator();

    //Position wie der Text (+30 statt +20 nach rechts, damit Platz für den grauen Balken links bleibt)
    const startX = this.#textBox.x + 30;
    const startY = this.#textBox.y + 40;

    const jaText = this.add.text(startX, startY, "Ja", this.#textKonfig);
    //"Nein" steht 30px unter "Ja"
    const neinText = this.add.text(
      startX,
      startY + 30,
      "Nein",
      this.#textKonfig,
    );

    this.#optionsTexte = [jaText, neinText];
    this.#auswahlModusIndex = 0;

    this.#auswahlBalken.setVisible(true);
    this.#aktualisiereAuswahlBalken();
  }

  //Zeichnet den grauen Balken hinter die aktuell gewählte Antwort
  #aktualisiereAuswahlBalken() {
    const zielText = this.#optionsTexte[this.#auswahlModusIndex];

    this.#auswahlBalken.clear();
    this.#auswahlBalken.fillStyle(0x666666, 0.6); //Grauton, teilweise Transparent
    //Der Balken beginnt 10px links und 2px über dem Text und ist 4px höher als der Text (je 2px oben/unten),
    //Breite = Boxbreite - 40 (20px Rand auf beiden Seiten)
    this.#auswahlBalken.fillRect(
      zielText.x - 10,
      zielText.y - 2,
      this.#textBox.width - 40,
      zielText.height + 4,
    );
  }

  #bestaetigeAuswahl() {
    const istJa = this.#auswahlModusIndex === 0;
    if (istJa && this.#textLink) {
      logger.linkGeoeffnet(this.#textKey, this.#textLink);
      window.open(this.#textLink, "_blank"); //_blank = neuer Tab
    }
    this.#spielerAuswahl = istJa; //true = ja, false = nein

    //Nach der Frage steht im Sheet zuerst der "Nein"-Text (ID + 1), danach der "Ja"-Text (ID + 2)
    const naechsteID = istJa
      ? Number(this.#textKey) + 2
      : Number(this.#textKey) + 1;
    this.#zeigeText(naechsteID, this.#spielerAuswahl);
  }

  //Startet die Scene neu mit dem nächsten Text (die Auswahl wird mitgegeben, damit sie am Ende gemeldet werden kann)
  #zeigeText(textKey, spielerAuswahl) {
    this.scene.restart({
      textKey,
      zielTyp: this.#zielTyp,
      spielerAuswahl,
      aktuelleScene: this.#aktuelleScene,
      nachJa: this.#nachJa,
      nachNein: this.#nachNein,
    });
  }

  //Dialog ist zu Ende: Ergebnis an das Dialogsystem melden und den Raum fortsetzen
  //auswahlWeitergabe: true = Ja, false = Nein, null = es gab keine Frage
  #beendeScene(auswahlWeitergabe) {
    this.#text.setText("");
    this.scene.stop(SCENE_KEYS.TEXT_SCENE);
    dialogBeendet(
      this.registry,
      this.#zielTyp,
      auswahlWeitergabe,
      this.#nachJa,
      this.#nachNein,
    );
    this.scene.resume(this.#aktuelleScene);
  }

  //Teilt den Text in Seiten auf, die in die Textbox passen
  //Jeder Absatz (Zeilenumbruch im Sheet) beginnt eine neue Seite. Innerhalb eines Absatzes werden Wort für Wort
  //so lange Wörter angehängt, bis der (unsichtbare) Dummy-Text höher wäre als maxHeight, dann beginnt die nächste Seite.
  #textAufEinzelneSeitenSchneiden(text, maxHeight) {
    //Im Sheet steht der Zeilenumbruch als Zeichen "\n". Hier wird er in einen echten Umbruch umgewandelt
    const bereinigterText = text.replace(/\\n/g, "\n");
    const abschnitte = bereinigterText.split("\n");
    const seiten = [];

    for (const abschnitt of abschnitte) {
      if (abschnitt.trim() === "") continue; //leere Absätze überspringen

      const worte = abschnitt.split(" ");
      let aktuellerChunk = "";

      for (let i = 0; i < worte.length; i++) {
        const testChunk = aktuellerChunk
          ? aktuellerChunk + " " + worte[i]
          : worte[i];

        this.#dummyText.setText(testChunk);

        //aktuellerChunk !== "" verhindert eine Endlosschleife/leere Seite, falls schon ein einzelnes Wort zu hoch wäre
        if (this.#dummyText.height > maxHeight && aktuellerChunk !== "") {
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
