import { logger } from "./logger.js";

export class Player extends Phaser.Physics.Arcade.Sprite {
  #geschwindigkeit = 160;
  #cursor;

  constructor(scene, x, y, startFrame) {
    super(scene, x, y, "cat", startFrame);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setCircle(16).setOffset(0, 0);
    this.setCollideWorldBounds(true);

    this.#cursor = scene.input.keyboard.createCursorKeys();
    this.#erstelleAnimationenFallsNoetig(scene);
  }

  #erstelleAnimationenFallsNoetig(scene) {
    //AnimationManager ist global, also scene-übergreifend (ohne diesen Check gibt's beim zweiten Raum einen Fehler, weil der Key schon existiert)
    if (scene.anims.exists("laufe_runter")) return;

    const anims = {
      laufe_runter: [0, 1, 2],
      laufe_links: [3, 4, 5],
      laufe_rechts: [6, 7, 8],
      laufe_hoch: [9, 10, 11],
    };
    for (const [key, frames] of Object.entries(anims)) {
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers("cat", { frames }),
        frameRate: 8,
        repeat: -1,
      });
    }
  }

  update() {
    this.setVelocity(0);
    if (this.#cursor.left.isDown) {
      logger.spielerBewegt();
      this.setVelocityX(-this.#geschwindigkeit);
      this.play("laufe_links", true);
    } else if (this.#cursor.right.isDown) {
      logger.spielerBewegt();
      this.setVelocityX(this.#geschwindigkeit);
      this.play("laufe_rechts", true);
    } else if (this.#cursor.up.isDown) {
      logger.spielerBewegt();
      this.setVelocityY(-this.#geschwindigkeit);
      this.play("laufe_hoch", true);
    } else if (this.#cursor.down.isDown) {
      logger.spielerBewegt();
      this.setVelocityY(this.#geschwindigkeit);
      this.play("laufe_runter", true);
    } else {
      this.stop();
    }
  }
}
