import * as Phaser from 'phaser';
import { Sound } from '../audio/SoundEffects';

export class PendulumTrap extends Phaser.GameObjects.Container {
  public blade: Phaser.Physics.Arcade.Sprite;
  private swingTween!: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number, interval: number = 2.0) {
    super(scene, x, y);
    scene.add.existing(this);

    // Anchor pivot point at (0, 0)
    this.blade = scene.physics.add.sprite(0, 36, 'trap_pendulum_blade');
    (this.blade.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    (this.blade.body as Phaser.Physics.Arcade.Body).setSize(20, 24);
    (this.blade.body as Phaser.Physics.Arcade.Body).setOffset(2, 22);

    this.add(this.blade);

    // Swinging tween
    this.setAngle(-60);
    this.swingTween = scene.tweens.add({
      targets: this,
      angle: 60,
      duration: interval * 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  public destroyTrap() {
    if (this.swingTween) this.swingTween.stop();
    this.destroy();
  }
}

export class CastleCore extends Phaser.Physics.Arcade.Sprite {
  public maxHealth: number = 800;
  public health: number = 800;
  public isDestroyed: boolean = false;
  private pulseTween!: Phaser.Tweens.Tween;
  private hpBarGfx: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, maxHealth: number = 800) {
    super(scene, x, y, 'castle_core');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.maxHealth = maxHealth;
    this.health = maxHealth;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    this.setSize(44, 44);

    // Beating Heart animation tween
    this.pulseTween = scene.tweens.add({
      targets: this,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Quad.easeInOut',
    });

    this.hpBarGfx = scene.add.graphics();
    this.renderHpBar();
  }

  public renderHpBar() {
    this.hpBarGfx.clear();
    if (this.isDestroyed) return;

    const barW = 48;
    const barH = 6;
    const barX = this.x - barW / 2;
    const barY = this.y - 32;

    // Background
    this.hpBarGfx.fillStyle(0x1a0505, 0.9);
    this.hpBarGfx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

    // HP Fill
    const pct = Math.max(0, this.health / this.maxHealth);
    this.hpBarGfx.fillStyle(pct > 0.3 ? 0xcc1835 : 0xff3333, 1.0);
    this.hpBarGfx.fillRect(barX, barY, barW * pct, barH);

    // Gold frame border
    this.hpBarGfx.lineStyle(1, 0xd4af37, 0.8);
    this.hpBarGfx.strokeRect(barX - 1, barY - 1, barW + 2, barH + 2);
  }

  public takeDamage(damage: number): boolean {
    if (this.isDestroyed) return true;

    this.health = Math.max(0, this.health - damage);
    this.renderHpBar();
    Sound.playHitEnemy();

    // Damage flash
    this.setTint(0xffffff);
    this.scene.time.delayedCall(80, () => {
      this.clearTint();
    });

    this.scene.cameras.main.shake(100, 0.005);

    if (this.health <= 0) {
      this.explode();
      return true;
    }
    return false;
  }

  private explode() {
    this.isDestroyed = true;
    this.pulseTween.stop();
    this.hpBarGfx.clear();

    Sound.playCoreExplode();
    this.scene.cameras.main.flash(500, 255, 30, 40);
    this.scene.cameras.main.shake(800, 0.02);

    // Cataclysmic shatter particle effect
    const particles = this.scene.add.particles(this.x, this.y, 'sub_holywater', {
      speed: { min: 80, max: 280 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      blendMode: 'ADD',
      lifespan: 800,
      gravityY: 100,
      quantity: 30,
    });

    this.scene.time.delayedCall(900, () => {
      particles.destroy();
      this.destroy();
    });

    this.scene.events.emit('castleCoreDestroyed');
  }
}
