import * as Phaser from 'phaser';
import { TextureGenerator } from '../graphics/TextureGenerator';
import { MapStorage } from '../data/DefaultMap';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  public preload() {
    // Generate all procedural pixel textures into Phaser texture cache
    TextureGenerator.generateAll(this);
  }

  public create() {
    const mapData = MapStorage.loadMap();
    // Default to Architect Scene on initial boot
    this.scene.start('ArchitectScene', { mapData });
  }
}
