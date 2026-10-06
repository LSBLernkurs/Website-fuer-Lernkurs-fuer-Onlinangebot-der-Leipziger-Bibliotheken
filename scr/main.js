import { SCENE_KEYS } from "./common(keys)/scene-keys.js";
import { PreloadScene } from "./scenes/preload-scene.js";
import { AnfangScene } from "./scenes/anfang-scene.js";
import { ErsterRaumScene } from "./scenes/erster-raum-scene.js";
import { ZweiterRaumScene } from "./scenes/zweiter-raum-scene.js";
import { DritterRaumScene } from "./scenes/dritter-raum-scene.js";
import { VierterRaumScene } from "./scenes/vierter-raum-scene.js";
import { EndeScene } from "./scenes/ende-scene.js";
import { MenuScene } from "./scenes/menu-scene.js";
import { TextfeldScene } from "./scenes/textfeld-scene.js";

const gameConfig = {
  type: Phaser.AUTO,
  scale: {
    width: 480, //es geht aus String mit Prozentangabe z.B. height: '100%
    height: 500, // = ca.(w: '25%', h: '55%',)
    autoCenter: Phaser.Scale.CENTER_BOTH,
    mode: Phaser.Scale.FIT,
  },
  backgroundColor: "#000000",
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
};

const game = new Phaser.Game(gameConfig);

game.scene.add(SCENE_KEYS.PRELOAD_SCENE, PreloadScene);
game.scene.add(SCENE_KEYS.ANFANG_SCENE, AnfangScene);
game.scene.add(SCENE_KEYS.ERSTER_SCENE, ErsterRaumScene);
game.scene.add(SCENE_KEYS.ZWEITER_SCENE, ZweiterRaumScene);
game.scene.add(SCENE_KEYS.DRITTER_SCENE, DritterRaumScene);
game.scene.add(SCENE_KEYS.VIERTER_SCENE, VierterRaumScene);
game.scene.add(SCENE_KEYS.ENDE_SCENE, EndeScene);
game.scene.add(SCENE_KEYS.MENU_SCENE, MenuScene);
game.scene.add(SCENE_KEYS.TEXT_SCENE, TextfeldScene);
game.scene.start(SCENE_KEYS.PRELOAD_SCENE);
