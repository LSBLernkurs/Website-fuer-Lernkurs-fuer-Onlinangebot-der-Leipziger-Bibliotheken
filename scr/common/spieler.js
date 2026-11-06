//Die Spielfigur (Katze). Wird in jedem Raum neu erstellt und bewegt sich mit den Pfeiltasten.
//Nutzt das Spritesheet "cat" (wird in der preload-scene geladen).
//Aufbau des Spritesheets: 4 Zeilen mit je 3 Frames (runter, links, rechts, hoch), jeder Frame 32x32 px.
//Der mittlere Frame jeder Zeile (1, 4, 7, 10) ist die Stehpose und wird deshalb als startFrame genutzt
//(= Blickrichtung beim Spawnen: 1 = runter, 4 = links, 7 = rechts, 10 = hoch).
export class Spieler extends Phaser.Physics.Arcade.Sprite {
  //Geschwindigkeit in Pixel pro Sekunde
  #geschwindigkeit = 160;
  #cursor;

  constructor(scene, x, y, startFrame) {
    super(scene, x, y, "cat", startFrame);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    //Kreisförmige Hitbox mit Radius 16 = halbe Kachelgröße. Der Kreis (Durchmesser 32) füllt den 32x32 Sprite genau aus,
    //offset (0, 0) = Kreis startet in der oberen linken Ecke des Sprites
    this.body.setCircle(16).setOffset(0, 0);
    //Spieler kann die Raumgrenzen (physics.world.setBounds, siehe setzeKameraGrenzen) nicht verlassen
    this.setCollideWorldBounds(true);

    this.#cursor = scene.input.keyboard.createCursorKeys();
    this.#erstelleAnimationenFallsNoetig(scene);
  }

  #erstelleAnimationenFallsNoetig(scene) {
    //AnimationManager ist global, also scene-übergreifend (ohne diesen Check gibt's beim zweiten Raum einen Fehler, weil der Key schon existiert)
    if (scene.anims.exists("laufe_runter")) return;

    //Frame-Nummern im Spritesheet "cat" (Zählung beginnt bei 0, zeilenweise)
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
        frameRate: 8, //8 Bilder pro Sekunde
        repeat: -1, //-1 = Endlosschleife (solange die Taste gedrückt ist)
      });
    }
  }

  //Wird jeden Frame von der Raum-Scene aufgerufen (siehe BaseRoomScene.update)
  update() {
    //Erst anhalten, dann je nach Taste neu loslaufen => Figur stoppt, sobald keine Taste gedrückt ist
    this.setVelocity(0);
    //else-if: es wird immer nur in eine Richtung gelaufen (keine Diagonalen), links/rechts hat Vorrang vor hoch/runter
    if (this.#cursor.left.isDown) {
      this.setVelocityX(-this.#geschwindigkeit);
      this.play("laufe_links", true); //true = Animation nicht neu starten, wenn sie schon läuft
    } else if (this.#cursor.right.isDown) {
      this.setVelocityX(this.#geschwindigkeit);
      this.play("laufe_rechts", true);
    } else if (this.#cursor.up.isDown) {
      this.setVelocityY(-this.#geschwindigkeit);
      this.play("laufe_hoch", true);
    } else if (this.#cursor.down.isDown) {
      this.setVelocityY(this.#geschwindigkeit);
      this.play("laufe_runter", true);
    } else {
      //keine Taste: Animation anhalten, die Figur bleibt im aktuellen Frame stehen
      this.stop();
    }
  }
}
