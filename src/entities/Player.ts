import * as Phaser from 'phaser';
import { Sound } from '../audio/SoundEffects';
import type { PlayerStats } from '../types/game';

export class Player extends Phaser.Physics.Arcade.Sprite {
  public stats: PlayerStats = {
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    hearts: 25,
    maxHearts: 50,
    level: 1,
    exp: 0,
    sanguineEssence: 120,
    darkGold: 450,
    relics: {
      doubleJump: true,
      mistForm: false,
      batFlight: false,
    },
  };

  // State flags
  public isFacingLeft: boolean = false;
  public isAttacking: boolean = false;
  public isBackdashing: boolean = false;
  public isInvulnerable: boolean = false;
  public canDoubleJump: boolean = false;
  public hasDoubleJumped: boolean = false;

  // Timers & Buffers
  private coyoteTimer: number = 0;
  private jumpBufferTimer: number = 0;
  private backdashTimer: number = 0;
  private attackTimer: number = 0;
  private ghostTimer: number = 0;

  // Melee Hitbox
  public attackHitbox: Phaser.GameObjects.Zone | null = null;

  // Input Keys
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyJump!: Phaser.Input.Keyboard.Key;
  private keyAttack!: Phaser.Input.Keyboard.Key;
  private keyDash!: Phaser.Input.Keyboard.Key;
  private keySub!: Phaser.Input.Keyboard.Key;

  // Virtual Inputs for Mobile / Touch
  public virtualLeft: boolean = false;
  public virtualRight: boolean = false;
  public virtualJump: boolean = false;
  public virtualAttack: boolean = false;
  public virtualDash: boolean = false;
  public virtualSub: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player_idle');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setSize(18, 34);
    this.setOffset(3, 2);

    this.initKeyboard(scene);
    this.createAttackHitbox(scene);
  }

  private initKeyboard(scene: Phaser.Scene) {
    if (!scene.input.keyboard) return;
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keyA = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyJump = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyAttack = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.keyDash = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.keySub = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
  }

  private createAttackHitbox(scene: Phaser.Scene) {
    this.attackHitbox = scene.add.zone(this.x, this.y, 36, 32);
    scene.physics.add.existing(this.attackHitbox);
    const body = this.attackHitbox.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setAllowGravity(false);
      body.enable = false;
    }
  }

  public updatePlayer(_time: number, delta: number) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    const onGround = body.blocked.down || body.touching.down;

    // Coyote Time update
    if (onGround) {
      this.coyoteTimer = 100;
      this.canDoubleJump = this.stats.relics.doubleJump;
      this.hasDoubleJumped = false;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
    }

    // Jump Buffer update
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.keyJump) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.keyW) ||
      this.virtualJump;

    if (jumpPressed) {
      this.jumpBufferTimer = 120;
      this.virtualJump = false;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);
    }

    // Dash input
    const dashPressed =
      Phaser.Input.Keyboard.JustDown(this.keyDash) ||
      this.virtualDash;

    if (dashPressed && onGround && !this.isBackdashing) {
      this.startBackdash();
      this.virtualDash = false;
    }

    // Attack input
    const attackPressed =
      Phaser.Input.Keyboard.JustDown(this.keyAttack) ||
      this.virtualAttack;

    if (attackPressed && !this.isAttacking) {
      this.startAttack();
      this.virtualAttack = false;
    }

    // Subweapon input
    const subPressed =
      Phaser.Input.Keyboard.JustDown(this.keySub) ||
      this.virtualSub;

    if (subPressed && !this.isAttacking && this.stats.hearts >= 1) {
      this.fireSubWeapon();
      this.virtualSub = false;
    }

    // Handle Backdash State
    if (this.isBackdashing) {
      this.backdashTimer -= delta;
      this.ghostTimer -= delta;

      if (this.ghostTimer <= 0) {
        this.spawnGhostAfterimage();
        this.ghostTimer = 45;
      }

      if (this.backdashTimer <= 0) {
        this.isBackdashing = false;
        this.isInvulnerable = false;
      }
      return;
    }

    // Handle Attack State
    if (this.isAttacking) {
      this.attackTimer -= delta;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        this.setTexture('player_idle');
        if (this.attackHitbox) {
          (this.attackHitbox.body as Phaser.Physics.Arcade.Body).enable = false;
        }
      }
    }

    // Normal Movement Handling
    const moveLeft = this.cursors?.left.isDown || this.keyA?.isDown || this.virtualLeft;
    const moveRight = this.cursors?.right.isDown || this.keyD?.isDown || this.virtualRight;

    if (moveLeft) {
      body.setVelocityX(-240);
      this.isFacingLeft = true;
      this.setFlipX(true);
      if (!this.isAttacking) this.setTexture(onGround ? 'player_run' : 'player_jump');
    } else if (moveRight) {
      body.setVelocityX(240);
      this.isFacingLeft = false;
      this.setFlipX(false);
      if (!this.isAttacking) this.setTexture(onGround ? 'player_run' : 'player_jump');
    } else {
      body.setVelocityX(0);
      if (!this.isAttacking) this.setTexture(onGround ? 'player_idle' : 'player_jump');
    }

    // Jump Execution (Variable Jump Arc)
    if (this.jumpBufferTimer > 0) {
      if (this.coyoteTimer > 0) {
        // Ground Jump
        body.setVelocityY(-380);
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        Sound.playJump();
      } else if (this.canDoubleJump && !this.hasDoubleJumped) {
        // Double Jump (Leap Stone Relic)
        body.setVelocityY(-330);
        this.hasDoubleJumped = true;
        this.jumpBufferTimer = 0;
        Sound.playDoubleJump();
        this.spawnGhostAfterimage();
      }
    }

    // Cut Jump Height if Jump Key Released Early
    const jumpHeld = this.keyJump?.isDown || this.cursors?.up.isDown || this.keyW?.isDown;
    if (!jumpHeld && body.velocity.y < -80) {
      body.setVelocityY(body.velocity.y * 0.5);
    }

    // Sync Attack Hitbox Position
    if (this.attackHitbox && this.isAttacking) {
      const offsetX = this.isFacingLeft ? -28 : 28;
      this.attackHitbox.setPosition(this.x + offsetX, this.y);
    }
  }

  public startBackdash() {
    this.isBackdashing = true;
    this.isInvulnerable = true;
    this.backdashTimer = 350;
    this.ghostTimer = 0;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const dashVelocity = this.isFacingLeft ? 440 : -440;
    body.setVelocityX(dashVelocity);
    body.setVelocityY(0);

    Sound.playBackdash();
  }

  public startAttack() {
    this.isAttacking = true;
    this.attackTimer = 220;
    this.setTexture('player_attack');

    // Slight forward step on attack
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.down) {
      body.setVelocityX(this.isFacingLeft ? -40 : 40);
    }

    if (this.attackHitbox) {
      const hbBody = this.attackHitbox.body as Phaser.Physics.Arcade.Body;
      hbBody.enable = true;
      const offsetX = this.isFacingLeft ? -28 : 28;
      this.attackHitbox.setPosition(this.x + offsetX, this.y);
    }

    Sound.playSwordSlash();
    this.scene.cameras.main.shake(80, 0.003);
  }

  public fireSubWeapon() {
    this.stats.hearts -= 1;
    Sound.playSubWeapon();

    const dagger = this.scene.physics.add.sprite(
      this.x + (this.isFacingLeft ? -16 : 16),
      this.y,
      'sub_dagger'
    );
    dagger.setFlipX(this.isFacingLeft);
    const speed = this.isFacingLeft ? -450 : 450;
    dagger.setVelocityX(speed);
    (dagger.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    // Dagger despawn timer
    this.scene.time.delayedCall(1500, () => {
      dagger.destroy();
    });

    // Notify scene of active subweapon projectile
    this.scene.events.emit('playerSubweaponFired', dagger);
  }

  public takeDamage(amount: number, knockbackDir: number) {
    if (this.isInvulnerable) return;

    this.stats.hp = Math.max(0, this.stats.hp - amount);
    this.isInvulnerable = true;
    Sound.playPlayerHurt();

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(knockbackDir * 180);
    body.setVelocityY(-180);

    // Damage Flash effect
    this.setTint(0xffffff);
    this.scene.cameras.main.shake(120, 0.008);

    this.scene.time.delayedCall(120, () => {
      this.clearTint();
    });

    // Invulnerability blinking
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 80,
      yoyo: true,
      repeat: 6,
      onComplete: () => {
        this.setAlpha(1.0);
        this.isInvulnerable = false;
      },
    });

    this.scene.events.emit('playerDamaged', this.stats);
  }

  public spawnGhostAfterimage() {
    const ghost = this.scene.add.sprite(this.x, this.y, 'player_ghost');
    ghost.setFlipX(this.isFacingLeft);
    ghost.setAlpha(0.6);

    this.scene.tweens.add({
      targets: ghost,
      alpha: 0,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 250,
      onComplete: () => {
        ghost.destroy();
      },
    });
  }
}
