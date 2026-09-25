import * as Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { ArchitectScene } from './scenes/ArchitectScene';
import { RaidScene } from './scenes/RaidScene';
import { UIManager } from './ui/UIManager';
import './style.css';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'phaser-game',
  width: 960,
  height: 540,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 980, x: 0 },
      debug: false,
    },
  },
  scene: [BootScene, ArchitectScene, RaidScene],
};

window.addEventListener('DOMContentLoaded', () => {
  const game = new Phaser.Game(config);
  new UIManager(game);
});
