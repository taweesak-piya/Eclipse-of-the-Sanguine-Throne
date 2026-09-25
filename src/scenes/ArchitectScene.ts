import * as Phaser from 'phaser';
import { Sound } from '../audio/SoundEffects';
import { MapStorage } from '../data/DefaultMap';
import type { PlayerCastleMap, EntityConfig } from '../types/game';

export type ToolType =
  | 'tile_solid'
  | 'tile_platform'
  | 'tile_spike'
  | 'spawner_skeleton'
  | 'spawner_bat'
  | 'trap_pendulum'
  | 'spawn_point'
  | 'castle_core'
  | 'eraser';

export class ArchitectScene extends Phaser.Scene {
  public mapData!: PlayerCastleMap;
  public selectedTool: ToolType = 'tile_solid';

  private gridGraphics!: Phaser.GameObjects.Graphics;
  private previewGraphics!: Phaser.GameObjects.Graphics;
  private renderedSprites: Phaser.GameObjects.GameObject[] = [];

  private isDragging: boolean = false;
  private lastPaintedTileX: number = -1;
  private lastPaintedTileY: number = -1;

  constructor() {
    super('ArchitectScene');
  }

  public init(data: { mapData?: PlayerCastleMap }) {
    this.mapData = data.mapData || MapStorage.loadMap();
  }

  public create() {
    // Background tint
    this.cameras.main.setBackgroundColor('#0d0c12');
    this.cameras.main.setZoom(1.3);

    // Setup Graphics layers
    this.gridGraphics = this.add.graphics();
    this.previewGraphics = this.add.graphics();

    // Render initial base
    this.redrawAll();

    // Mouse Input Handlers
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.handlePointerAction(pointer);
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.updateCursorPreview(pointer);
      if (this.isDragging) {
        this.handlePointerAction(pointer);
      }
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
      this.lastPaintedTileX = -1;
      this.lastPaintedTileY = -1;
    });

    // Center Camera over map
    const totalW = this.mapData.gridWidth * this.mapData.tileSize;
    const totalH = this.mapData.gridHeight * this.mapData.tileSize;
    this.cameras.main.centerOn(totalW / 2, totalH / 2);

    // Initial budget event
    this.emitBudgetUpdate();
  }

  public setTool(tool: ToolType) {
    this.selectedTool = tool;
    Sound.playUIPress();
  }

  private handlePointerAction(pointer: Phaser.Input.Pointer) {
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const ts = this.mapData.tileSize;

    const tx = Math.floor(worldPoint.x / ts);
    const ty = Math.floor(worldPoint.y / ts);

    // Boundary check (exclude outer perimeter walls)
    if (tx <= 0 || tx >= this.mapData.gridWidth - 1 || ty <= 0 || ty >= this.mapData.gridHeight - 1) {
      return;
    }

    if (tx === this.lastPaintedTileX && ty === this.lastPaintedTileY) {
      return;
    }

    this.lastPaintedTileX = tx;
    this.lastPaintedTileY = ty;

    const index = ty * this.mapData.gridWidth + tx;

    // Execute Tool Action
    switch (this.selectedTool) {
      case 'tile_solid':
        this.clearTileEntity(tx, ty);
        this.mapData.layers.collision[index] = 1;
        this.mapData.layers.hazard[index] = 0;
        break;

      case 'tile_platform':
        this.clearTileEntity(tx, ty);
        this.mapData.layers.collision[index] = 2;
        this.mapData.layers.hazard[index] = 0;
        break;

      case 'tile_spike':
        this.clearTileEntity(tx, ty);
        this.mapData.layers.collision[index] = 0;
        this.mapData.layers.hazard[index] = 1;
        break;

      case 'spawner_skeleton':
        this.clearTileEntity(tx, ty);
        this.mapData.layers.collision[index] = 0;
        this.mapData.layers.hazard[index] = 0;
        this.addEntity('spawner_skeleton', tx, ty, { patrolRadius: 3 });
        break;

      case 'spawner_bat':
        this.clearTileEntity(tx, ty);
        this.mapData.layers.collision[index] = 0;
        this.mapData.layers.hazard[index] = 0;
        this.addEntity('spawner_bat', tx, ty);
        break;

      case 'trap_pendulum':
        this.clearTileEntity(tx, ty);
        this.mapData.layers.collision[index] = 0;
        this.mapData.layers.hazard[index] = 0;
        this.addEntity('trap_pendulum', tx, ty, { fireInterval: 2.2 });
        break;

      case 'spawn_point':
        this.mapData.spawnPoint = { x: tx, y: ty };
        break;

      case 'castle_core':
        this.mapData.castleCore.x = tx;
        this.mapData.castleCore.y = ty;
        break;

      case 'eraser':
        this.clearTileEntity(tx, ty);
        this.mapData.layers.collision[index] = 0;
        this.mapData.layers.hazard[index] = 0;
        break;
    }

    this.recalculateBudget();
    MapStorage.saveMap(this.mapData);
    this.redrawAll();
    Sound.playUIPress();
  }

  private addEntity(type: EntityConfig['type'], x: number, y: number, props?: Record<string, unknown>) {
    this.mapData.entities.push({
      instanceId: `ent_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type,
      x,
      y,
      properties: props,
    });
  }

  private clearTileEntity(x: number, y: number) {
    this.mapData.entities = this.mapData.entities.filter((e) => !(e.x === x && e.y === y));
  }

  private recalculateBudget() {
    let budget = 0;
    // Count collision blocks
    for (const tile of this.mapData.layers.collision) {
      if (tile === 1) budget += 1;
      else if (tile === 2) budget += 2;
    }
    // Count hazards
    for (const haz of this.mapData.layers.hazard) {
      if (haz === 1) budget += 3;
    }
    // Count entities
    for (const ent of this.mapData.entities) {
      if (ent.type === 'spawner_skeleton') budget += 15;
      else if (ent.type === 'spawner_bat') budget += 10;
      else if (ent.type === 'trap_pendulum') budget += 20;
    }

    this.mapData.budgetUsed = budget;
    this.emitBudgetUpdate();
  }

  private emitBudgetUpdate() {
    this.events.emit('uiBudgetUpdated', {
      used: this.mapData.budgetUsed,
      max: this.mapData.maxBudget,
    });
  }

  private updateCursorPreview(pointer: Phaser.Input.Pointer) {
    this.previewGraphics.clear();
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const ts = this.mapData.tileSize;

    const tx = Math.floor(worldPoint.x / ts);
    const ty = Math.floor(worldPoint.y / ts);

    if (tx >= 0 && tx < this.mapData.gridWidth && ty >= 0 && ty < this.mapData.gridHeight) {
      this.previewGraphics.lineStyle(2, 0xd4af37, 0.9);
      this.previewGraphics.strokeRect(tx * ts, ty * ts, ts, ts);
    }
  }

  private redrawAll() {
    // Clean old sprites
    this.renderedSprites.forEach((s) => s.destroy());
    this.renderedSprites = [];

    const { gridWidth, gridHeight, tileSize, layers } = this.mapData;
    const ts = tileSize;

    // Draw Grid Lines & Outer Border
    this.gridGraphics.clear();
    this.gridGraphics.lineStyle(1, 0x1f1d2b, 0.6);

    for (let x = 0; x <= gridWidth; x++) {
      this.gridGraphics.lineBetween(x * ts, 0, x * ts, gridHeight * ts);
    }
    for (let y = 0; y <= gridHeight; y++) {
      this.gridGraphics.lineBetween(0, y * ts, gridWidth * ts, y * ts);
    }

    // Render Background & Collision & Hazard Tiles
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const index = y * gridWidth + x;
        const px = x * ts + ts / 2;
        const py = y * ts + ts / 2;

        // Background
        const bgVal = layers.background[index];
        if (bgVal > 0) {
          const bg = this.add.image(px, py, 'tile_bg').setAlpha(0.6);
          this.renderedSprites.push(bg);
        }

        // Solids
        const colVal = layers.collision[index];
        if (colVal === 1) {
          const solid = this.add.image(px, py, 'tile_solid');
          this.renderedSprites.push(solid);
        } else if (colVal === 2) {
          const plat = this.add.image(px, py, 'tile_platform');
          this.renderedSprites.push(plat);
        }

        // Hazards (Spikes)
        const hazVal = layers.hazard[index];
        if (hazVal === 1) {
          const spk = this.add.image(px, py, 'tile_spike');
          this.renderedSprites.push(spk);
        }
      }
    }

    // Render Entities
    for (const ent of this.mapData.entities) {
      const ex = ent.x * ts + ts / 2;
      const ey = ent.y * ts + ts / 2;

      let key = 'enemy_skeleton';
      if (ent.type === 'spawner_skeleton') key = 'enemy_skeleton';
      else if (ent.type === 'spawner_bat') key = 'enemy_bat';
      else if (ent.type === 'trap_pendulum') key = 'trap_pendulum_blade';

      const spr = this.add.image(ex, ey, key);
      this.renderedSprites.push(spr);

      // Entity label indicator
      const tag = this.add
        .text(ex, ey - 22, ent.type.replace('spawner_', '').replace('trap_', ''), {
          fontSize: '9px',
          color: '#ffcc00',
          fontFamily: 'monospace',
          backgroundColor: '#111116',
        })
        .setOrigin(0.5);
      this.renderedSprites.push(tag);
    }

    // Render Hero Spawn Point
    const spX = this.mapData.spawnPoint.x * ts + ts / 2;
    const spY = this.mapData.spawnPoint.y * ts + ts / 2;
    const heroMarker = this.add.image(spX, spY, 'player_idle').setAlpha(0.85);
    const heroTag = this.add
      .text(spX, spY - 26, 'HERO SPAWN', {
        fontSize: '10px',
        color: '#4dc9ff',
        fontFamily: 'monospace',
        backgroundColor: '#002244',
      })
      .setOrigin(0.5);
    this.renderedSprites.push(heroMarker, heroTag);

    // Render Castle Core ("Heart of Dracula")
    const ccX = this.mapData.castleCore.x * ts + ts / 2;
    const ccY = this.mapData.castleCore.y * ts + ts / 2;
    const coreSpr = this.add.image(ccX, ccY, 'castle_core');
    const coreTag = this.add
      .text(ccX, ccY - 30, 'CASTLE CORE', {
        fontSize: '10px',
        color: '#ff334b',
        fontFamily: 'monospace',
        backgroundColor: '#440011',
      })
      .setOrigin(0.5);
    this.renderedSprites.push(coreSpr, coreTag);
  }
}
