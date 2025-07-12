import Phaser from "phaser";

export interface PlayerConfig {
  x: number;
  y: number;
  speed: number;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  speed: number;
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, speed: number) {
    super(scene, x, y, texture);
    this.speed = speed;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setDepth(10);
  }
  move(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
    const vel = this.speed;
    let vx = 0, vy = 0;
    if (cursors.left?.isDown) vx = -vel;
    else if (cursors.right?.isDown) vx = vel;
    if (cursors.up?.isDown) vy = -vel;
    else if (cursors.down?.isDown) vy = vel;
    this.setVelocity(vx, vy);
    if (vx !== 0 || vy !== 0) this.anims.play('walk', true);
    else this.anims.stop();
  }
}
