import { SCENE_KEYS } from "./scene-keys.js";
import { logger } from "./logger.js";
import {
  waehleDialog,
  wendeEffekteAn,
  markiereGesprochen,
  hatFlag,
  setzeFlag,
  istFertig,
  setzeRaumFlagsZurueck,
  initialisiereObjekt,
  zaehlerWert,
  aendereZaehler,
  ZAEHLER_SCHLUESSEL,
} from "./dialog-system.js";
import { holeNaechsteSceneKey } from "./raum-wechsel.js";

//========================= Überblick =========================
//Basisklasse für alle Räume (erster-, zweiter-, dritter-, vierter-raum-scene). Sie enthält alles, was in jedem Raum gleich ist:
//Bewegung, Menü-Taste, Interaktionen (Hinweis + Dialog), Tür, Zentrierung der Karte und Hilfsfunktionen zum Bauen des Raums.
//
//Eine Raum-Scene muss in init() diese Werte setzen: this.raumNummer und this.spawnFrame
//und in create() this.spieler erstellen. Die Grafik der Räume wurde mit dem Programm "Tiled" gebaut. Folgende Layer werden erwartet:
//- Kachel-Layer:  z.B. BodenLayer, WaendeLayer, MoebelLayer (nur Optik, siehe erstelleLayer)
//- CollisionLayer (Objekte):        Rechtecke, durch die der Spieler nicht laufen kann
//- InteraktionsLayer (Objekte):     Position der NPCs und Gegenstände (Name = Name im Code, z.B. "buchregal")
//- SpawnLayer (Objekt "Spawn"):     Startposition des Spielers
//- WeiterLayer (Objekt "weiter"):   Zone, bei deren Betreten der nächste Raum startet
//- TuerBarriereLayer (Objekt "TuerBarriere"): unsichtbare Wand, die die Tür blockiert, bis sie offen ist
//Kachelgröße ist überall 32x32 Pixel, daher kommen im Code oft die Zahlen 32 und 16 (halbe Kachel) vor.

const HINWEIS_STANDARD = "Drücke I um zu interagieren.";

export class BaseRoomScene extends Phaser.Scene {
  spieler;
  tasten;
  textKonfig;
  hinweis;
  //Alle Zonen, mit denen der Spieler interagieren kann (NPCs, Gegenstände, Tür), siehe registriereInteraktion
  #interaktionen = [];
  #tuer = null; //null = Raum hat (noch) keine Tür
  #schluesselText;
  #schluesselIcon;
  #angezeigteSchluessel;
  //verhindert, dass der Raumwechsel mehrfach ausgelöst wird (update läuft jeden Frame, die Spieler-Zone bleibt aber mehrere Frames betreten)
  #wechselLaeuft;

  init() {
    this.tasten = this.input.keyboard.addKeys({
      k: Phaser.Input.Keyboard.KeyCodes.K,
      m: Phaser.Input.Keyboard.KeyCodes.M,
      i: Phaser.Input.Keyboard.KeyCodes.I,
    });

    this.hinweis = null;

    this.#angezeigteSchluessel = -1; //-1 = noch nie gezeichnet
    this.#schluesselText = null; //alte (zerstörte) Objekte aus einem früheren Durchlauf vergessen
    this.#schluesselIcon = null;

    //"create" wird von Phaser ausgelöst, sobald die create()-Methode der Raum-Scene durchgelaufen ist
    this.events.once("create", () => this.#erstelleSchluesselAnzeige());

    this.#wechselLaeuft = false;

    //Schrift für den Interaktions-Hinweis über den Objekten (schwarzer Hintergrund, damit er auf jedem Boden lesbar ist)
    this.textKonfig = {
      fontFamily: "QuinqueFive",
      fontSize: "12px",
      color: "#ffffff",
      backgroundColor: "#000000",
    };

    logger.szeneBetreten(this.scene.key);
    this.events.once("shutdown", () => {
      logger.szeneVerlassen(this.scene.key);
    });
  }

  //Lädt das Spritesheet für die Schlüssel-Anzeige (Frame 1031 = Schlüssel). Die Raum-Scenes rufen es mit super.preload() auf
  preload() {
    if (this.textures.exists("Schluessel")) return; //Texturen gelten global, einmal laden reicht
    this.load.spritesheet(
      "Schluessel",
      "assets/anfangUndEnde-raum (und Schluessel-UI)/BaseChip_pipo.png",
      {
        frameWidth: 32,
        frameHeight: 32,
      },
    );
  }

  //Wird jeden Frame aufgerufen. Die Raum-Scenes rufen es mit super.update() auf und ergänzen eigene Prüfungen
  update() {
    this.spieler.update();
    if (Phaser.Input.Keyboard.JustDown(this.tasten.m)) {
      this.openMenu();
    }
    this.#verarbeiteInteraktionen();
    this.#aktualisiereTuer();
    this.#aktualisiereSchluesselAnzeige();
  }

  //Dialogsystem
  //Muss in init() jeder Raum-Scene aufgerufen werden: leert die Interaktionen und setzt die Flags dieses Raums zurück
  initialisiereRaumZustand() {
    this.#interaktionen = [];
    this.#tuer = null;
    setzeRaumFlagsZurueck(this.registry, this.raumNummer);
  }

  //Interaktionszone anmelden
  //zone:        Interaktionsraum
  //objekt:      Name des Objekts im Regeln-Tab (ohne Angabe: nur Hinweis, kein Dialog)
  //aktiv:       Funktion, die sagt, ob der Hinweis angezeigt werden soll
  //text:        Hinweistext
  //automatisch: Dialog startet beim Betreten der Zone (ohne Tastendruck, ohne Hinweis)
  registriereInteraktion({
    zone,
    objekt = null,
    aktiv,
    text,
    automatisch = false,
  }) {
    if (objekt) initialisiereObjekt(this.registry, objekt);
    this.#interaktionen.push({
      zone,
      objekt,
      automatisch,
      //Standard: Hinweis wird gezeigt, außer bei automatischen Dialogen (die brauchen keinen "Drücke I"-Hinweis)
      aktiv: aktiv ?? (() => !automatisch),
      text: text ?? HINWEIS_STANDARD,
      imBereich: false, //steht der Spieler gerade in der Zone?
      warImBereich: false, //stand der Spieler im Frame davor in der Zone? (um das erste Betreten zu erkennen)
    });
  }

  //Sucht die passende Regel für das Objekt und öffnet das Textfeld
  //Gibt true zurück, wenn ein Dialog gestartet wurde, sonst false
  starteDialog(objekt) {
    const regel = waehleDialog(this.registry, objekt);
    if (!regel) {
      console.warn(
        `[Dialogregeln] Für "${objekt}" trifft keine Regel zu (oder es gibt keine). Im Tab "Regeln" prüfen.`,
      );
      return false;
    }
    wendeEffekteAn(this.registry, regel.setzt);
    markiereGesprochen(this.registry, objekt);
    this.openTextfeld(regel.textId, objekt, {
      nachJa: regel.nachJa,
      nachNein: regel.nachNein,
    });
    return true;
  }

  //Kurzformen für die Raum-Scenes (damit man nicht jedes Mal this.registry mitgeben muss)
  hatFlag(name) {
    return hatFlag(this.registry, name);
  }

  setzeFlag(name, wert = true) {
    setzeFlag(this.registry, name, wert);
  }

  //Schlüssel-Zähler (liegt im Dialogsystem, siehe dialog-system.js)
  schluesselAnzahl() {
    return zaehlerWert(this.registry, ZAEHLER_SCHLUESSEL);
  }

  //anzahl > 0: Schlüssel bekommen, anzahl < 0: Schlüssel verbraucht (nie unter 0)
  //Normalerweise vergibt das Sheet Schlüssel über "schluessel+1", das hier ist für Fälle direkt im Code
  gibSchluessel(anzahl = 1) {
    aendereZaehler(this.registry, ZAEHLER_SCHLUESSEL, anzahl);
  }

  istFertig(objekt) {
    return istFertig(this.registry, objekt);
  }

  //tür einrichten, muss nach dem Erstellen des Spielers aufgerufen werden (wegen der Collision)
  //map:           Tilemap des Raums
  //layer:         Kachel-Layer der Tür (wird beim Öffnen unsichtbar gemacht)
  //interaktionsraum: Bereich, in dem der Spieler stehen muss, um die Tür zu öffnen.
  //-                 x / y sind optional (Standard: Position der Barriere), originY (optional) verschiebt den Ankerpunkt der Zone
  //beimOeffnen:   optional, eigene Öffnen-Logik (z.B. Animation). Bekommt eine Funktion, die die Barriere entfernt
  //Die Tür kann mit K geöffnet werden, sobald der Spieler mindestens einen Schlüssel hat (verbraucht dann einen)
  richteTuerEin({ map, layer, interaktionsraum, beimOeffnen }) {
    const barriereObjekt = map.findObject(
      "TuerBarriereLayer",
      (obj) => obj.name === "TuerBarriere",
    );
    if (!barriereObjekt) {
      console.warn(
        `[Tür] Objekt "TuerBarriere" im Layer "TuerBarriereLayer" fehlt (${this.scene.key}).`,
      );
      return;
    }

    //Barriere, die den Spieler blockiert, bis die Tür offen ist
    const barriereZone = this.add
      .zone(
        this.versetzeX(barriereObjekt.x),
        this.versetzeY(barriereObjekt.y),
        barriereObjekt.width,
        barriereObjekt.height,
      )
      .setOrigin(0);
    this.physics.add.existing(barriereZone, true); //true = statisch
    const collider = this.physics.add.collider(this.spieler, barriereZone);

    //Interaktionsraum vor der Tür
    //Weil die Barriere selbst den Spieler blockiert, muss die Zone außerhalb/am Rand der Barriere liegen,
    //sonst könnte der Spieler sie nie berühren. Deshalb gibt jeder Raum seine eigene Größe/Position mit.
    const zone = this.erstelleInteraktionsZone(
      interaktionsraum.x ?? barriereZone.x,
      interaktionsraum.y ?? barriereZone.y,
      interaktionsraum.breite,
      interaktionsraum.hoehe,
    );
    zone.setOrigin(0, interaktionsraum.originY ?? 0);

    this.#tuer = {
      offen: false,
      zone,
      layer,
      collider,
      beimOeffnen,
    };

    //Der Hinweis "Drücke K ..." erscheint nur, wenn der Spieler den Schlüssel hat und die Tür noch zu ist
    this.registriereInteraktion({
      zone,
      aktiv: () => this.schluesselAnzahl() > 0 && !this.#tuer.offen,
      text: "Drücke K um den Schlüssel zu nutzen.",
    });
  }

  //Für die Raum Scenes: Ist die Tür dieses Raums offen?
  istTuerOffen() {
    return this.#tuer?.offen === true;
  }

  //Prüft pro Frame, ob der Spieler die Tür mit K öffnet
  #aktualisiereTuer() {
    const tuer = this.#tuer;
    if (!tuer || tuer.offen) return;

    const spielerVorTuer = this.physics.overlap(this.spieler, tuer.zone);
    if (
      this.schluesselAnzahl() > 0 &&
      spielerVorTuer &&
      Phaser.Input.Keyboard.JustDown(this.tasten.k)
    ) {
      this.#oeffneTuer();
    }
  }

  #oeffneTuer() {
    const tuer = this.#tuer;
    this.gibSchluessel(-1); //Schlüssel verbraucht
    tuer.offen = true;
    tuer.layer.setVisible(false);

    //Die Barriere wird erst entfernt, wenn die Tür wirklich offen ist (bei einer Animation: nach deren Ende)
    const entferneBarriere = () =>
      this.physics.world.removeCollider(tuer.collider);

    if (tuer.beimOeffnen) {
      tuer.beimOeffnen(entferneBarriere);
    } else {
      entferneBarriere();
    }
  }

  //Läuft jeden Frame: zeigt Hinweise an und startet Dialoge
  #verarbeiteInteraktionen() {
    //Hinweisanzeige (nur der erste passende Hinweis)
    let hinweisGezeigt = false;
    for (const eintrag of this.#interaktionen) {
      eintrag.imBereich = this.physics.overlap(this.spieler, eintrag.zone);
      if (eintrag.imBereich && eintrag.aktiv() && !hinweisGezeigt) {
        this.interaktionsHinweisAnzeigen(
          eintrag.zone.x,
          eintrag.zone.y,
          eintrag.text,
        );
        hinweisGezeigt = true;
      }
    }
    if (!hinweisGezeigt) this.hinweisAusblenden();

    //Dialoge
    //dialogGestartet: pro Frame darf nur ein Dialog starten, auch wenn sich mehrere Zonen überlappen
    let dialogGestartet = false;
    for (const eintrag of this.#interaktionen) {
      if (!eintrag.objekt) continue; //Einträge ohne Objekt (z.B. Tür) haben keinen Dialog

      if (eintrag.automatisch) {
        //nur beim ersten Betreten starten (jetzt in der Zone, im Frame davor nicht)
        const betreten = eintrag.imBereich && !eintrag.warImBereich;
        eintrag.warImBereich = eintrag.imBereich;
        if (betreten && !dialogGestartet) {
          dialogGestartet = this.starteDialog(eintrag.objekt);
        }
      } else if (
        !dialogGestartet &&
        eintrag.imBereich &&
        Phaser.Input.Keyboard.JustDown(this.tasten.i)
      ) {
        dialogGestartet = this.starteDialog(eintrag.objekt);
      }
    }
  }

  //Ist die Karte kleiner als der Bildschirm (480x512), wird sie in die Mitte geschoben.
  //offsetX / offsetY ist der Abstand zum Bildschirmrand, er muss bei ALLEN Koordinaten aus Tiled dazugerechnet werden (siehe versetzeX / versetzeY).
  //Math.max(0, ...): ist die Karte größer als der Bildschirm, wird nicht verschoben (die Kamera folgt dem Spieler)
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
  //Erstellt einen Kachel-Layer aus der Tilemap (mit dem Versatz zum Zentrieren).
  //Layer werden in der Reihenfolge gezeichnet, in der sie erstellt werden:
  //Alles, was VOR dem Spieler erstellt wird, liegt unter ihm, alles danach darüber (siehe "ueberSpielerLayer" in den Räumen)
  erstelleLayer(map, layerName, tilesets) {
    return map.createLayer(layerName, tilesets, this.offsetX, this.offsetY);
  }
  //Rechnet eine Koordinate aus Tiled in eine Koordinate auf dem Bildschirm um
  versetzeX(x) {
    return x + this.offsetX;
  }
  versetzeY(y) {
    return y + this.offsetY;
  }

  //statische Collision-Gruppe aus Objekt-Layer, inklusive Versatz
  //Jedes Rechteck im Layer wird zu einer unsichtbaren Zone, durch die der Spieler nicht laufen kann
  erstelleCollisionGruppe(map, layerName = "CollisionLayer") {
    const hindernisse = this.physics.add.staticGroup();
    const collision = map.getObjectLayer(layerName);
    if (collision) {
      collision.objects.forEach((obj) => {
        //Tiled gibt die obere linke Ecke an, deshalb setOrigin(0)
        const zone = this.add
          .zone(
            this.versetzeX(obj.x),
            this.versetzeY(obj.y),
            obj.width,
            obj.height,
          )
          .setOrigin(0);
        this.physics.add.existing(zone, true); //true = statisch (bewegt sich nie)
        hindernisse.add(zone);
      });
    }
    return hindernisse;
  }

  //Kameragrenzen setzen
  //Kamera und Physik-Welt dürfen nicht über den Raum hinaus. Mindestens Bildschirmgröße, damit kleine Räume nicht verrutschen
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

  //Schlüssel-Anzeige oben links auf der Spielfläche: "<Zahl> <Schlüsselbild>"
  #erstelleSchluesselAnzeige() {
    if (this.raumNummer < 1) return; //die Anfang-Scene (Raum 0) braucht keine Anzeige

    this.#schluesselText = this.add
      .text(10, 10 + 9, "0", {
        fontFamily: "QuinqueFive",
        fontSize: "16px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4, //schwarzer Rand, damit die Zahl auf jedem Boden lesbar ist
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0) //fest an der Kamera = bleibt oben links auf der Spielfläche
      .setDepth(1000);

    this.#schluesselIcon = this.add
      .image(0, 10 + 16, "Schluessel", 1055)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(1000);

    this.#aktualisiereSchluesselAnzeige();
  }

  #aktualisiereSchluesselAnzeige() {
    if (!this.#schluesselText) return;

    const anzahl = this.schluesselAnzahl();
    if (anzahl === this.#angezeigteSchluessel) return; //nur neu zeichnen, wenn sich etwas geändert hat

    this.#angezeigteSchluessel = anzahl;
    this.#schluesselText.setText(String(anzahl));
    //Das Bild steht 6px rechts neben der Zahl (rutscht bei mehrstelligen Zahlen automatisch mit)
    this.#schluesselIcon.x =
      this.#schluesselText.x + this.#schluesselText.width;
  }

  //Unsichtbare Zone, die den Spieler NICHT blockiert, aber erkennt, ob er sie berührt (this.physics.overlap)
  //x / y = obere linke Ecke (Bildschirmkoordinaten)
  erstelleInteraktionsZone(x, y, breite, hoehe) {
    const zone = this.add.zone(x, y, breite, hoehe).setOrigin(0);
    this.physics.world.enable(zone);
    zone.body.setAllowGravity(false);
    zone.body.moves = false; //Zone bleibt immer an ihrer Stelle
    return zone;
  }

  //Unsichtbare Zone, die den Spieler blockiert (z.B. unter einem NPC, damit man nicht durch ihn durchlaufen kann)
  erstelleBlockierendeZone(x, y, breite, hoehe) {
    const zone = this.add.zone(x, y, breite, hoehe).setOrigin(0);
    this.physics.add.existing(zone, true);
    this.physics.add.collider(this.spieler, zone);
    return zone;
  }

  //Sucht ein Objekt im "InteraktionsLayer" der Tilemap (Warnung, falls es fehlt)
  #sucheInteraktionsObjekt(map, name) {
    const stelle = map.findObject(
      "InteraktionsLayer",
      (obj) => obj.name === name,
    );
    if (!stelle) {
      console.warn(
        `[Raum] Objekt "${name}" fehlt im "InteraktionsLayer" (${this.scene.key}).`,
      );
    }
    return stelle;
  }

  //Gegenstände (ohne Figur) anlegen. Jeder Eintrag ist entweder
  //ein String (Name im InteraktionsLayer = Objektname im Regeln-Tab, z.B. "buchregal") oder ein Objekt:
  //{ tiled: Name im InteraktionsLayer, objekt: Name im Regeln-Tab (Standard: wie tiled), automatisch: Dialog startet beim Betreten }
  //Die Interaktionszone hat die Größe des Rechtecks aus Tiled
  erstelleGegenstaende(map, eintraege) {
    for (const eintrag of eintraege) {
      const {
        tiled,
        objekt = tiled,
        automatisch = false,
      } = typeof eintrag === "string" ? { tiled: eintrag } : eintrag;

      const stelle = this.#sucheInteraktionsObjekt(map, tiled);
      if (!stelle) continue;

      const zone = this.erstelleInteraktionsZone(
        this.versetzeX(stelle.x),
        this.versetzeY(stelle.y),
        stelle.width,
        stelle.height,
      );
      this.registriereInteraktion({ zone, objekt, automatisch });
    }
  }

  //Npcs erstellen muss NACH dem Erstellen des Spielers aufgerufen werden (wegen der Collision)
  //Jeder NPC hat: tiled (Name im InteraktionsLayer), objekt (Name im Regeln-Tab, Standard: wie tiled),
  //textur + frame (Spritesheet und Bild, das angezeigt wird = Blickrichtung des NPCs), automatisch (Dialog startet beim Betreten)
  //und interaktionsraum: { dx, dy, breite, hoehe }
  //-  dx / dy:        Verschiebung der Zone gegenüber der oberen linken Ecke des NPCs (Standard 0)
  //-  breite / hoehe: Größe der Zone
  //Der NPC selbst blockiert den Spieler (siehe erstelleBlockierendeZone). Deshalb kann der Spieler seine Kachel nie betreten
  //und die Interaktionszone muss ein Stück über den NPC hinausragen oder direkt daneben liegen,
  //sonst würde sich Spieler und Zone nie überlappen. Die Zahlen in den Räumen (z.B. 32 + 16) kommen daher:
  //32 = eine Kachel (NPC-Größe), die Zahl dazu = wie weit die Zone über den NPC hinausragen soll.
  erstelleNpcs(map, npcs) {
    for (const npc of npcs) {
      const {
        tiled,
        objekt = tiled,
        textur,
        frame,
        interaktionsraum,
        automatisch = false,
      } = npc;

      const stelle = this.#sucheInteraktionsObjekt(map, tiled);
      if (!stelle) continue;

      const x = this.versetzeX(stelle.x);
      const y = this.versetzeY(stelle.y);

      this.physics.add.sprite(x, y, textur, frame).setOrigin(0);
      this.erstelleBlockierendeZone(x, y, stelle.width, stelle.height);

      const { dx = 0, dy = 0, breite, hoehe } = interaktionsraum;
      const zone = this.erstelleInteraktionsZone(x + dx, y + dy, breite, hoehe);
      this.registriereInteraktion({ zone, objekt, automatisch });
    }
  }

  //Zeigt den Hinweistext über der Interaktionszone an (x / y = obere linke Ecke der Zone)
  interaktionsHinweisAnzeigen(x, y, text) {
    if (!this.hinweis) {
      this.hinweis = this.add.text(0, 0, "", this.textKonfig).setOrigin(0.5);
    }
    this.hinweis.setText(text);
    this.hinweis.setVisible(true);

    //+16 = halbe Kachel => Text liegt waagerecht mittig über einer 32 breiten Kachel
    //-32 -16 = eine Kachel plus eine halbe nach oben => Text steht oberhalb der Zone/des NPCs
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
  //Ist der Text breiter als der Raum (min > max), wird er mittig platziert
  #klemme(wert, min, max) {
    if (min > max) return (min + max) / 2;
    return Phaser.Math.Clamp(wert, min, max);
  }

  hinweisAusblenden() {
    if (this.hinweis) this.hinweis.setVisible(false);
  }

  //Öffnet das Textfeld über dem Raum. Der Raum wird pausiert und von der textfeld-scene wieder fortgesetzt
  //interaktionsKey: ID des Textes im Sheet
  //interaktionsTyp: Name des Objekts, dem der Dialog gehört (wird für die Ja/Nein-Auswertung gebraucht)
  //zusatzDaten (optional), z.B. { bisMTaste: true }
  openTextfeld(interaktionsKey, interaktionsTyp, zusatzDaten = {}) {
    this.scene.pause(this.scene.key);
    this.scene.launch(SCENE_KEYS.TEXT_SCENE, {
      textKey: interaktionsKey,
      zielTyp: interaktionsTyp,
      aktuelleScene: this.scene.key,
      ...zusatzDaten,
    });
  }

  //Öffnet das Menü über dem Raum (Raum wird pausiert, das Menü setzt ihn beim Schließen fort)
  openMenu() {
    this.scene.pause(this.scene.key);
    this.scene.launch(SCENE_KEYS.MENU_SCENE, {
      raum: this.raumNummer,
      aktuelleScene: this.scene.key,
    });
  }

  //Wechselt zum nächsten Raum (oder zur Ende-Scene, wenn es der letzte war)
  raumWechsel() {
    if (this.#wechselLaeuft) return;
    this.#wechselLaeuft = true;
    const zielScene = holeNaechsteSceneKey(this.scene.key);
    if (!zielScene) {
      console.warn(`Kein Nachfolger für ${this.scene.key} gefunden.`);
      return;
    }
    this.scene.stop(this.scene.key);
    this.scene.start(zielScene);
  }
}
