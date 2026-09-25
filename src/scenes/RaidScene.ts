import * as Phaser from 'phaser';
import { Player } from '../entities/Player';
import { SkeletonEnemy, BatEnemy } from '../entities/Enemies';
import { PendulumTrap, CastleCore } from '../entities/Traps';
import { Sound } from '../audio/SoundEffects';
import type { PlayerCastleMap, GameMode } from '../types/game';

export class RaidScene extends Phaser.Scene {
  private mapData!: PlayerCastleMap;
  public gameMode: GameMode = 'raid';

  public player!: Player;
  public castleCore!: CastleCore;


  // Entity groups
  public enemies!: Phaser.GameObjects.Group;
  public enemyProjectiles!: Phaser.GameObjects.Group;
  public playerProjectiles!: Phaser.GameObjects.Group;
  public traps!: Phaser.GameObjects.Group;

  // Raid metrics & stars
  public totalDefenders: number = 0;
  public defeatedDefenders: number = 0;
  public starsEarned: number = 0;
  public timeLeft: number = 240; // 4 minutes
  private isGameOver: boolean = false;

  constructor() {
    super('RaidScene');
  }

  public init(data: { mapData: PlayerCastleMap; mode?: GameMode }) {
    this.mapData = data.mapData;
    this.gameMode = data.mode || 'raid';
    this.timeLeft = 240;
    this.isGameOver = false;
    this.defeatedDefenders = 0;
    this.starsEarned = 0;
  }

  public create() {
    // 1. Build Dynamic Tilemap
    this.buildLevel();

    // 2. Setup Entity Groups
    this.enemies = this.add.group();
    this.enemyProjectiles = this.add.group();
    this.playerProjectiles = this.add.group();
    this.traps = this.add.group();

    // 3. Spawn Entities from Map Data
    this.spawnEntities();

    // 4. Spawn Player
    const spawnTileX = this.mapData.spawnPoint.x * this.mapData.tileSize + 16;
    const spawnTileY = this.mapData.spawnPoint.y * this.mapData.tileSize + 16;
    this.player = new Player(this, spawnTileX, spawnTileY);

    // 5. Setup Camera
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.5);

    // 6. Setup Collisions & Overlaps
    this.setupCollisions();

    // 7. Event Listeners for dynamic projectiles and drops
    this.events.on('enemyProjectileSpawned', (proj: Phaser.Physics.Arcade.Sprite) => {
      this.enemyProjectiles.add(proj);
    });

    this.events.on('playerSubweaponFired', (proj: Phaser.Physics.Arcade.Sprite) => {
      this.playerProjectiles.add(proj);
    });

    this.events.on('enemyDefeated', (_enemy: Phaser.GameObjects.GameObject) => {
      this.defeatedDefenders++;
      this.checkStarConditions();
    });

    this.events.on('castleCoreDestroyed', () => {
      this.starsEarned = 3;
      this.events.emit('uiStarsUpdated', this.starsEarned);
      this.time.delayedCall(1200, () => {
        this.triggerVictory();
      });
    });

    // 8. Start Raid Countdown Timer
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.isGameOver) return;
        this.timeLeft--;
        this.events.emit('uiTimerUpdated', this.timeLeft);
        if (this.timeLeft <= 0) {
          this.triggerDefeat('Time Expired!');
        }
      },
    });

    // Start Dark Gothic Ambiance
    Sound.startBGM();
  }

  public solids!: Phaser.Physics.Arcade.StaticGroup;
  public hazards!: Phaser.Physics.Arcade.StaticGroup;

  private buildLevel() {
    const { gridWidth, gridHeight, tileSize, layers } = this.mapData;
    const ts = tileSize;

    this.solids = this.physics.add.staticGroup();
    this.hazards = this.physics.add.staticGroup();

    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const index = y * gridWidth + x;
        const px = x * ts + ts / 2;
        const py = y * ts + ts / 2;

        // Background
        const bgVal = layers.background[index];
        if (bgVal > 0) {
          this.add.image(px, py, 'tile_bg').setAlpha(0.6);
        }

        // Solids
        const colVal = layers.collision[index];
        if (colVal === 1) {
          const s = this.solids.create(px, py, 'tile_solid') as Phaser.Physics.Arcade.Sprite;
          s.setSize(ts, ts);
          s.refreshBody();
        } else if (colVal === 2) {
          const plat = this.solids.create(px, py, 'tile_platform') as Phaser.Physics.Arcade.Sprite;
          plat.setSize(ts, 10);
          plat.setOffset(0, 0);
          plat.refreshBody();
        }

        // Hazards
        const hazVal = layers.hazard[index];
        if (hazVal === 1) {
          const h = this.hazards.create(px, py, 'tile_spike') as Phaser.Physics.Arcade.Sprite;
          h.setSize(ts, 18);
          h.setOffset(0, 14);
          h.refreshBody();
        }
      }
    }

    // World & Camera bounds
    const worldW = gridWidth * ts;
    const worldH = gridHeight * ts;
    this.physics.world.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setBounds(0, 0, worldW, worldH);
  }

  private spawnEntities() {
    const ts = this.mapData.tileSize;

    // Spawn Castle Core
    const coreX = this.mapData.castleCore.x * ts + 16;
    const coreY = this.mapData.castleCore.y * ts + 16;
    this.castleCore = new CastleCore(this, coreX, coreY, this.mapData.castleCore.health);

    // Spawn Configured Entities
    this.totalDefenders = 0;
    for (const ent of this.mapData.entities) {
      const ex = ent.x * ts + 16;
      const ey = ent.y * ts + 16;

      if (ent.type === 'spawner_skeleton') {
        const skel = new SkeletonEnemy(this, ex, ey, ent.properties?.patrolRadius || 3);
        this.enemies.add(skel);
        this.totalDefenders++;
      } else if (ent.type === 'spawner_bat') {
        const bat = new BatEnemy(this, ex, ey);
        this.enemies.add(bat);
        this.totalDefenders++;
      } else if (ent.type === 'trap_pendulum') {
        const trap = new PendulumTrap(this, ex, ey, ent.properties?.fireInterval || 2.0);
        this.traps.add(trap);
      }
    }
  }

  private setupCollisions() {
    // Player vs Solids
    this.physics.add.collider(this.player, this.solids);

    // Player vs Hazards (Spikes)
    this.physics.add.collider(this.player, this.hazards, () => {
      this.player.takeDamage(20, this.player.isFacingLeft ? 1 : -1);
      this.checkPlayerDeath();
    });

    // Enemies vs Solids
    this.physics.add.collider(this.enemies, this.solids);

    // Player Melee Hitbox vs Enemies
    if (this.player.attackHitbox) {
      this.physics.add.overlap(this.player.attackHitbox, this.enemies, (_hb, enemyObj) => {
        if (!this.player.isAttacking) return;
        const enemy = enemyObj as SkeletonEnemy | BatEnemy;
        if (enemy && enemy.takeDamage) {
          enemy.takeDamage(35);
        }
      });

      // Player Melee Hitbox vs Castle Core
      this.physics.add.overlap(this.player.attackHitbox, this.castleCore, () => {
        if (!this.player.isAttacking) return;
        this.castleCore.takeDamage(35);
      });
    }

    // Player Subweapon Projectiles vs Enemies
    this.physics.add.overlap(this.playerProjectiles, this.enemies, (projObj, enemyObj) => {
      projObj.destroy();
      const enemy = enemyObj as SkeletonEnemy | BatEnemy;
      if (enemy && enemy.takeDamage) {
        enemy.takeDamage(40);
      }
    });

    // Player Subweapon vs Castle Core
    this.physics.add.overlap(this.playerProjectiles, this.castleCore, (projObj) => {
      projObj.destroy();
      this.castleCore.takeDamage(40);
    });

    // Enemy Projectiles vs Player
    this.physics.add.overlap(this.enemyProjectiles, this.player, (projObj) => {
      projObj.destroy();
      this.player.takeDamage(12, this.player.x > (projObj as Phaser.GameObjects.Sprite).x ? 1 : -1);
      this.checkPlayerDeath();
    });

    // Enemies body contact vs Player
    this.physics.add.overlap(this.enemies, this.player, (_enemyObj) => {
      this.player.takeDamage(15, this.player.isFacingLeft ? 1 : -1);
      this.checkPlayerDeath();
    });

    // Pendulum Trap blades vs Player
    this.traps.getChildren().forEach((trapObj) => {
      const trap = trapObj as PendulumTrap;
      if (trap && trap.blade) {
        this.physics.add.overlap(this.player, trap.blade, () => {
          this.player.takeDamage(25, this.player.isFacingLeft ? 1 : -1);
          this.checkPlayerDeath();
        });
      }
    });
  }

  public update(time: number, delta: number) {
    if (this.isGameOver) return;

    // Update Player controller
    this.player.updatePlayer(time, delta);

    // Update Enemies AI
    this.enemies.getChildren().forEach((enemyObj) => {
      const enemy = enemyObj as SkeletonEnemy | BatEnemy;
      if (enemy instanceof SkeletonEnemy) {
        enemy.updateEnemy(time, this.player.x, this.player.y);
      } else if (enemy instanceof BatEnemy) {
        enemy.updateEnemy(time, this.player.x);
      }
    });
  }

  private checkPlayerDeath() {
    if (this.player.stats.hp <= 0 && !this.isGameOver) {
      this.triggerDefeat('Vitality Depleted in Combat!');
    }
  }

  private checkStarConditions() {
    if (this.totalDefenders > 0 && this.defeatedDefenders / this.totalDefenders >= 0.5) {
      if (this.starsEarned < 1) {
        this.starsEarned = 1;
        this.events.emit('uiStarsUpdated', this.starsEarned);
      }
    }
  }

  private triggerVictory() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    this.events.emit('uiGameVictory', {
      mode: this.gameMode,
      stars: this.starsEarned,
      timeLeft: this.timeLeft,
      essenceLooted: 240,
      goldLooted: 650,
    });
  }

  private triggerDefeat(reason: string) {
    if (this.isGameOver) return;
    this.isGameOver = true;

    this.events.emit('uiGameDefeat', {
      mode: this.gameMode,
      reason,
    });
  }
}
