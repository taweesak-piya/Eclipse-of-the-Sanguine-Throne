import * as Phaser from 'phaser';
import { Sound } from '../audio/SoundEffects';

export class SkeletonEnemy extends Phaser.Physics.Arcade.Sprite {
  public hp: number = 30;
  private patrolStartX: number;
  private patrolDist: number;
  private moveSpeed: number = 50;
  private isDead: boolean = false;
  private attackCooldown: number = 2200;
  private lastAttackTime: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, patrolRadius: number = 3) {
    super(scene, x, y, 'enemy_skeleton');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.patrolStartX = x;
    this.patrolDist = patrolRadius * 32;
    this.setSize(18, 30);
    this.setOffset(3, 2);
    this.setVelocityX(this.moveSpeed);
  }

  public updateEnemy(time: number, playerX: number, playerY: number) {
    if (this.isDead) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    // Turn around at patrol limits
    if (this.x > this.patrolStartX + this.patrolDist) {
      this.setVelocityX(-this.moveSpeed);
      this.setFlipX(true);
    } else if (this.x < this.patrolStartX - this.patrolDist) {
      this.setVelocityX(this.moveSpeed);
      this.setFlipX(false);
    }

    // Bone throw attack if player is nearby
    const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
    if (distToPlayer < 240 && time > this.lastAttackTime + this.attackCooldown) {
      this.lastAttackTime = time;
      this.throwBone(playerX, playerY);
    }
  }

  private throwBone(targetX: number, _targetY: number) {
    const bone = this.scene.physics.add.sprite(this.x, this.y - 6, 'proj_bone');
    const throwDir = targetX > this.x ? 1 : -1;
    bone.setVelocityX(throwDir * 140);
    bone.setVelocityY(-220);
    bone.setAngularVelocity(360);

    this.scene.events.emit('enemyProjectileSpawned', bone);

    this.scene.time.delayedCall(2500, () => {
      if (bone && bone.active) bone.destroy();
    });
  }

  public takeDamage(damage: number): boolean {
    if (this.isDead) return true;
    this.hp -= damage;
    Sound.playHitEnemy();

    // Damage flash
    this.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => {
      this.clearTint();
    });

    if (this.hp <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  private die() {
    this.isDead = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;

    // Dissolve / Bone scatter effect
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleY: 0.2,
      duration: 300,
      onComplete: () => {
        this.destroy();
      },
    });

    this.scene.events.emit('enemyDefeated', this);
  }
}

export class BatEnemy extends Phaser.Physics.Arcade.Sprite {
  public hp: number = 15;
  private startY: number;
  private angleOffset: number = 0;
  private isDead: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy_bat');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.startY = y;
    this.setSize(22, 16);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
  }

  public updateEnemy(_time: number, playerX: number) {
    if (this.isDead) return;

    this.angleOffset += 0.05;
    // Sinusoidal swooping wave flight
    const waveY = this.startY + Math.sin(this.angleOffset) * 36;
    this.setY(waveY);

    // Slowly advance toward player
    const dir = playerX > this.x ? 1 : -1;
    (this.body as Phaser.Physics.Arcade.Body).setVelocityX(dir * 70);
    this.setFlipX(dir > 0);
  }

  public takeDamage(damage: number): boolean {
    if (this.isDead) return true;
    this.hp -= damage;
    Sound.playHitEnemy();

    if (this.hp <= 0) {
      this.isDead = true;
      (this.body as Phaser.Physics.Arcade.Body).enable = false;
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        scale: 0.1,
        duration: 200,
        onComplete: () => this.destroy(),
      });
      this.scene.events.emit('enemyDefeated', this);
      return true;
    }
    return false;
  }
}
