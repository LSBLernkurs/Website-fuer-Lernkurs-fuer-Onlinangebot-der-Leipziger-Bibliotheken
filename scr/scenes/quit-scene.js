import { SCENE_KEYS } from "../common/scene-keys.js";
import { logger } from "../common/logger.js";
import { setzeDialogZustandZurueck } from "../common/dialog-system.js";

//Overlay zum Beenden des Spiels (Q-Taste). Läuft dauerhaft im Hintergrund mit und ist in jeder Scene erreichbar.
//Ablauf: Q => alle laufenden Scenes pausieren und Frage zeigen => 1 (Ja) beendet alles und startet von vorne,
//2 / ESC (Nein) setzt die pausierten Scenes fort.
export class QuitScene extends Phaser.Scene {
  #dialogOffen; //wird die Frage gerade angezeigt?
  #pausierteScenes; //Keys der Scenes, die für die Frage pausiert wurden (damit sie wieder fortgesetzt werden können)
  #hinweisBox;
  #hinweisText;

  constructor() {
    //active: true => startet automatisch mit dem Spiel und läuft dauerhaft mit
    super({ key: SCENE_KEYS.QUIT_SCENE, active: true });
  }

  create() {
    this.#dialogOffen = false;
    this.#pausierteScenes = [];

    const mitteX = this.cameras.main.centerX;
    const mitteY = this.cameras.main.centerY;

    //Box mit gelbem Rand. Größe 300x100 ist nur ein Startwert, sie wird in #dialogOeffnen an den Text angepasst.
    //setDepth: Box (10) liegt unter dem Text (11), beides über allem anderen in dieser Scene
    this.#hinweisBox = this.add
      .rectangle(mitteX, mitteY, 300, 100, 0x000000, 1)
      .setStrokeStyle(2, 0xffd966)
      .setDepth(10)
      .setVisible(false);

    this.#hinweisText = this.add
      .text(
        mitteX,
        mitteY,
        "Möchtest du das Spiel\nbeenden?\n\n1 = Ja     2 = Nein",
        {
          fontFamily: "QuinqueFive",
          fontSize: "14px",
          color: "#ffffff",
          align: "center",
          lineSpacing: 5,
        },
      )
      .setOrigin(0.5)
      .setDepth(11)
      .setVisible(false);

    //Die Tasten sind immer angemeldet. Die Methoden prüfen selbst, ob der Dialog offen ist (#dialogOffen)
    const kb = this.input.keyboard;
    kb.on("keydown-Q", this.#beiQ, this);
    kb.on("keydown-ONE", this.#beenden, this);
    kb.on("keydown-TWO", this.#abbrechen, this);
    kb.on("keydown-ESC", this.#abbrechen, this);
  }

  #beiQ() {
    if (this.#dialogOffen) {
      return;
    } else {
      this.#dialogOeffnen();
    }
  }

  #dialogOeffnen() {
    //beim Laden der Daten nicht reagieren
    if (this.scene.isActive(SCENE_KEYS.PRELOAD_SCENE)) return;

    //alle aktuell laufenden Scenes (außer dieser) merken und pausieren
    this.#pausierteScenes = this.scene.manager
      .getScenes(true)
      .map((s) => s.sys.settings.key)
      .filter((key) => key !== this.scene.key);
    if (this.#pausierteScenes.length === 0) return;

    this.#pausierteScenes.forEach((key) => this.scene.pause(key));

    this.#dialogOffen = true;
    this.scene.bringToTop(); //sicherstellen, dass der Dialog über allem liegt
    //+40 = 20px Innenabstand auf jeder Seite des Textes
    this.#hinweisBox
      .setSize(this.#hinweisText.width + 40, this.#hinweisText.height + 40)
      .setVisible(true);
    this.#hinweisText.setVisible(true);
  }

  //"Nein": Dialog schließen und alles fortsetzen
  #abbrechen() {
    if (!this.#dialogOffen) return;
    this.#dialogSchliessen();

    this.#pausierteScenes.forEach((key) => {
      //Tasten zurücksetzen
      this.scene.get(key).input.keyboard.resetKeys();
      this.scene.resume(key);
    });
    this.#pausierteScenes = [];
  }

  //"Ja": alles beenden und das Spiel von vorne starten
  #beenden() {
    if (!this.#dialogOffen) return;
    this.#dialogSchliessen();

    logger.log("spiel_beendet", { scenes: this.#pausierteScenes });
    this.#pausierteScenes = [];

    //gemerkte Spielstände (Dialog-Auswahlen) zurücksetzen, sonst startet das nächste Spiel mit altem Stand
    setzeDialogZustandZurueck(this.registry);

    //alles andere beenden, was läuft, pausiert oder schläft
    this.scene.manager.scenes.forEach((s) => {
      const key = s.sys.settings.key;
      if (key === this.scene.key) return;
      if (s.sys.isActive() || s.sys.isPaused() || s.sys.isSleeping()) {
        this.scene.stop(key);
      }
    });

    this.scene.launch(SCENE_KEYS.ANFANG_SCENE);
  }

  #dialogSchliessen() {
    this.#dialogOffen = false;
    this.#hinweisBox.setVisible(false);
    this.#hinweisText.setVisible(false);
  }
}
