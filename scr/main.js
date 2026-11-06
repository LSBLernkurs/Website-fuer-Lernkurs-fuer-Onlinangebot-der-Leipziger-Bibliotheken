import { SCENE_KEYS } from "./common/scene-keys.js";
import { PreloadScene } from "./scenes/preload-scene.js";
import { AnfangScene } from "./scenes/anfang-scene.js";
import { ErsterRaumScene } from "./scenes/erster-raum-scene.js";
import { ZweiterRaumScene } from "./scenes/zweiter-raum-scene.js";
import { DritterRaumScene } from "./scenes/dritter-raum-scene.js";
import { VierterRaumScene } from "./scenes/vierter-raum-scene.js";
import { EndeScene } from "./scenes/ende-scene.js";
import { MenuScene } from "./scenes/menu-scene.js";
import { TextfeldScene } from "./scenes/textfeld-scene.js";
import { QuitScene } from "./scenes/quit-scene.js";

//Einstiegspunkt des Spiels (Phaser wird in der index.html eingebunden, deshalb ist "Phaser" hier global verfügbar)
const gameConfig = {
  type: Phaser.AUTO, //Phaser wählt selbst WebGL oder Canvas
  scale: {
    //Spielfläche in Pixeln. Alle Positionen im Code (z.B. Menü, Textfeld) beziehen sich auf diese Größe
    width: 480,
    height: 512,
    autoCenter: Phaser.Scale.CENTER_BOTH, //Spiel liegt mittig im Browserfenster
    mode: Phaser.Scale.FIT, //Spiel wird passend zum Fenster vergrößert/verkleinert (Seitenverhältnis bleibt)
  },
  backgroundColor: "#000000",
  pixelArt: true, //scharfe Pixel statt weichgezeichneter Vergrößerung
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 }, //Draufsicht-Spiel => keine Schwerkraft
      debug: false, //true zeigt Hitboxen und Zonen an (praktisch zum Testen der Interaktionsräume)
    },
  },
};

const game = new Phaser.Game(gameConfig);

//Scenes registrieren. Sie werden hier nur hinzugefügt, gestartet wird erst unten die PRELOAD_SCENE
//(die QuitScene startet von selbst, siehe active: true in quit-scene.js)
game.scene.add(SCENE_KEYS.PRELOAD_SCENE, PreloadScene);
game.scene.add(SCENE_KEYS.ANFANG_SCENE, AnfangScene);
game.scene.add(SCENE_KEYS.ERSTER_SCENE, ErsterRaumScene);
game.scene.add(SCENE_KEYS.ZWEITER_SCENE, ZweiterRaumScene);
game.scene.add(SCENE_KEYS.DRITTER_SCENE, DritterRaumScene);
game.scene.add(SCENE_KEYS.VIERTER_SCENE, VierterRaumScene);
game.scene.add(SCENE_KEYS.ENDE_SCENE, EndeScene);
game.scene.add(SCENE_KEYS.MENU_SCENE, MenuScene);
game.scene.add(SCENE_KEYS.TEXT_SCENE, TextfeldScene);
game.scene.add(SCENE_KEYS.QUIT_SCENE, QuitScene);
game.scene.start(SCENE_KEYS.PRELOAD_SCENE);
