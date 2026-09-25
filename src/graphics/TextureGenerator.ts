import * as Phaser from 'phaser';

export class TextureGenerator {
  public static generateAll(scene: Phaser.Scene) {
    this.createPlayerTextures(scene);
    this.createCastleTiles(scene);
    this.createEnemyTextures(scene);
    this.createTrapTextures(scene);
    this.createCastleCoreTexture(scene);
    this.createSubweaponTextures(scene);
  }

  // --- PLAYER TEXTURES (Alucard Archetype) ---
  private static createPlayerTextures(scene: Phaser.Scene) {
    if (scene.textures.exists('player_idle')) return;

    // Idle Frame (24x36)
    const idleCanvas = scene.textures.createCanvas('player_idle', 24, 36);
    if (idleCanvas) {
      const ctx = idleCanvas.context;
      // Cape (Black/crimson)
      ctx.fillStyle = '#1a0005';
      ctx.fillRect(4, 8, 16, 26);
      ctx.fillStyle = '#8a0f1e';
      ctx.fillRect(6, 10, 12, 22);

      // Body / Coat (Charcoal & gold trim)
      ctx.fillStyle = '#22222a';
      ctx.fillRect(8, 12, 8, 16);
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(8, 12, 2, 16);
      ctx.fillRect(14, 12, 2, 16);

      // Legs / Boots
      ctx.fillStyle = '#111116';
      ctx.fillRect(8, 28, 3, 8);
      ctx.fillRect(13, 28, 3, 8);

      // Head & Pale Skin
      ctx.fillStyle = '#e8d7cf';
      ctx.fillRect(9, 4, 6, 8);

      // Silver Hair (SotN signature)
      ctx.fillStyle = '#d8e2eb';
      ctx.fillRect(7, 2, 10, 4);
      ctx.fillRect(5, 5, 4, 12); // long silver locks down back

      // Red Eyes
      ctx.fillStyle = '#e60033';
      ctx.fillRect(12, 7, 2, 2);

      idleCanvas.refresh();
    }

    // Run Frame (24x36)
    const runCanvas = scene.textures.createCanvas('player_run', 24, 36);
    if (runCanvas) {
      const ctx = runCanvas.context;
      // Trailing Cape (flaring back)
      ctx.fillStyle = '#1a0005';
      ctx.fillRect(1, 10, 18, 20);
      ctx.fillStyle = '#8a0f1e';
      ctx.fillRect(2, 12, 14, 16);

      // Body (forward lean)
      ctx.fillStyle = '#22222a';
      ctx.fillRect(10, 12, 8, 16);
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(10, 12, 2, 16);

      // Running legs (stride)
      ctx.fillStyle = '#111116';
      ctx.fillRect(6, 26, 4, 9);
      ctx.fillRect(15, 27, 4, 8);

      // Head
      ctx.fillStyle = '#e8d7cf';
      ctx.fillRect(11, 4, 6, 8);
      ctx.fillStyle = '#d8e2eb';
      ctx.fillRect(8, 2, 11, 4);
      ctx.fillRect(6, 5, 5, 10);
      ctx.fillStyle = '#e60033';
      ctx.fillRect(15, 7, 2, 2);

      runCanvas.refresh();
    }

    // Jump Frame (24x36)
    const jumpCanvas = scene.textures.createCanvas('player_jump', 24, 36);
    if (jumpCanvas) {
      const ctx = jumpCanvas.context;
      // Flowing Cape
      ctx.fillStyle = '#8a0f1e';
      ctx.fillRect(4, 14, 16, 20);

      // Body
      ctx.fillStyle = '#22222a';
      ctx.fillRect(8, 10, 8, 14);

      // Tucked Legs
      ctx.fillStyle = '#111116';
      ctx.fillRect(8, 24, 4, 6);
      ctx.fillRect(13, 22, 4, 6);

      // Head
      ctx.fillStyle = '#e8d7cf';
      ctx.fillRect(9, 2, 6, 8);
      ctx.fillStyle = '#d8e2eb';
      ctx.fillRect(6, 1, 12, 4);
      ctx.fillRect(5, 4, 4, 14);

      jumpCanvas.refresh();
    }

    // Attack Slash Arc Sprite (48x36)
    const attackCanvas = scene.textures.createCanvas('player_attack', 48, 36);
    if (attackCanvas) {
      const ctx = attackCanvas.context;
      // Player body
      ctx.fillStyle = '#22222a';
      ctx.fillRect(8, 12, 8, 16);
      ctx.fillStyle = '#d8e2eb';
      ctx.fillRect(7, 2, 10, 6);
      ctx.fillStyle = '#e8d7cf';
      ctx.fillRect(9, 6, 6, 6);
      ctx.fillStyle = '#111116';
      ctx.fillRect(6, 28, 5, 8);
      ctx.fillRect(13, 28, 5, 8);

      // Extended Sword Blade
      ctx.fillStyle = '#eaf6ff';
      ctx.fillRect(16, 16, 18, 4);
      ctx.fillStyle = '#a8c6e2';
      ctx.fillRect(16, 15, 18, 1);
      ctx.fillRect(16, 20, 18, 1);

      // Luminous Slash Arc (Cyan/White blade trail)
      const grad = ctx.createLinearGradient(20, 4, 46, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      grad.addColorStop(0.5, 'rgba(120, 210, 255, 0.7)');
      grad.addColorStop(1, 'rgba(60, 110, 220, 0)');

      ctx.beginPath();
      ctx.arc(20, 18, 22, -Math.PI * 0.45, Math.PI * 0.35, false);
      ctx.lineWidth = 5;
      ctx.strokeStyle = grad;
      ctx.stroke();

      attackCanvas.refresh();
    }

    // Ghost / Afterimage (Cyan/Violet spectral silhouette)
    const ghostCanvas = scene.textures.createCanvas('player_ghost', 24, 36);
    if (ghostCanvas) {
      const ctx = ghostCanvas.context;
      ctx.fillStyle = '#4dc9ff';
      ctx.globalAlpha = 0.5;
      ctx.fillRect(4, 2, 16, 32);
      ghostCanvas.refresh();
    }
  }

  // --- CASTLE TILES ---
  private static createCastleTiles(scene: Phaser.Scene) {
    if (scene.textures.exists('tile_solid')) return;

    // Solid Stone Block (32x32)
    const solidCanvas = scene.textures.createCanvas('tile_solid', 32, 32);
    if (solidCanvas) {
      const ctx = solidCanvas.context;
      ctx.fillStyle = '#2c2b38';
      ctx.fillRect(0, 0, 32, 32);
      // Gothic Masonry lines
      ctx.fillStyle = '#3c3a4d';
      ctx.fillRect(2, 2, 13, 13);
      ctx.fillRect(17, 2, 13, 13);
      ctx.fillRect(2, 17, 28, 13);
      // Highlights & Bevel
      ctx.fillStyle = '#504d66';
      ctx.fillRect(2, 2, 13, 2);
      ctx.fillRect(17, 2, 13, 2);
      ctx.fillRect(2, 17, 28, 2);
      ctx.fillStyle = '#18171f';
      ctx.fillRect(0, 0, 32, 2);
      ctx.fillRect(0, 15, 32, 2);
      ctx.fillRect(15, 0, 2, 16);
      solidCanvas.refresh();
    }

    // One-Way Platform (Carved Marble) (32x32)
    const platCanvas = scene.textures.createCanvas('tile_platform', 32, 32);
    if (platCanvas) {
      const ctx = platCanvas.context;
      // Thin top platform
      ctx.fillStyle = '#6e6982';
      ctx.fillRect(0, 0, 32, 8);
      ctx.fillStyle = '#9b94b5';
      ctx.fillRect(0, 0, 32, 2);
      // Decorative iron brackets
      ctx.fillStyle = '#2a2833';
      ctx.fillRect(4, 8, 4, 10);
      ctx.fillRect(24, 8, 4, 10);
      platCanvas.refresh();
    }

    // Breakable Wall (Cracked stone with mortar lines) (32x32)
    const breakCanvas = scene.textures.createCanvas('tile_breakable', 32, 32);
    if (breakCanvas) {
      const ctx = breakCanvas.context;
      ctx.fillStyle = '#3a3430';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#574e47';
      ctx.fillRect(2, 2, 28, 28);
      // Cracks
      ctx.strokeStyle = '#1a1614';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8, 4);
      ctx.lineTo(16, 14);
      ctx.lineTo(12, 22);
      ctx.lineTo(24, 28);
      ctx.stroke();
      breakCanvas.refresh();
    }

    // Background Wall (Dark gloomy background arches) (32x32)
    const bgCanvas = scene.textures.createCanvas('tile_bg', 32, 32);
    if (bgCanvas) {
      const ctx = bgCanvas.context;
      ctx.fillStyle = '#14131c';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#1e1c29';
      ctx.fillRect(1, 1, 30, 30);
      ctx.fillStyle = '#0f0e17';
      ctx.fillRect(0, 0, 32, 1);
      ctx.fillRect(0, 0, 1, 32);
      bgCanvas.refresh();
    }

    // Spike Hazard (32x32)
    const spikeCanvas = scene.textures.createCanvas('tile_spike', 32, 32);
    if (spikeCanvas) {
      const ctx = spikeCanvas.context;
      ctx.fillStyle = '#555566';
      // 3 sharp metal spikes
      [4, 14, 24].forEach((sx) => {
        ctx.beginPath();
        ctx.moveTo(sx - 3, 32);
        ctx.lineTo(sx + 2, 8);
        ctx.lineTo(sx + 7, 32);
        ctx.closePath();
        ctx.fill();
        // Blood stained tip
        ctx.fillStyle = '#a30d1d';
        ctx.beginPath();
        ctx.moveTo(sx - 1, 18);
        ctx.lineTo(sx + 2, 8);
        ctx.lineTo(sx + 5, 18);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#555566';
      });
      spikeCanvas.refresh();
    }
  }

  // --- ENEMIES ---
  private static createEnemyTextures(scene: Phaser.Scene) {
    if (scene.textures.exists('enemy_skeleton')) return;

    // Patrolling Skeleton (24x32)
    const skelCanvas = scene.textures.createCanvas('enemy_skeleton', 24, 32);
    if (skelCanvas) {
      const ctx = skelCanvas.context;
      ctx.fillStyle = '#e6e4dc';
      // Skull
      ctx.fillRect(7, 2, 10, 8);
      ctx.fillStyle = '#1b1a20';
      ctx.fillRect(9, 5, 2, 3); // Eye socket
      ctx.fillRect(13, 5, 2, 3);
      // Spine & Ribcage
      ctx.fillStyle = '#e6e4dc';
      ctx.fillRect(11, 10, 2, 12);
      ctx.fillRect(7, 12, 10, 2);
      ctx.fillRect(8, 16, 8, 2);
      // Limbs
      ctx.fillRect(4, 11, 2, 10);
      ctx.fillRect(18, 11, 2, 10);
      ctx.fillRect(8, 22, 2, 10);
      ctx.fillRect(14, 22, 2, 10);
      skelCanvas.refresh();
    }

    // Bone Projectile (12x12)
    const boneCanvas = scene.textures.createCanvas('proj_bone', 12, 12);
    if (boneCanvas) {
      const ctx = boneCanvas.context;
      ctx.fillStyle = '#f0efe9';
      ctx.fillRect(2, 4, 8, 4);
      ctx.fillRect(1, 2, 3, 8);
      ctx.fillRect(8, 2, 3, 8);
      boneCanvas.refresh();
    }

    // Blood Bat (28x20)
    const batCanvas = scene.textures.createCanvas('enemy_bat', 28, 20);
    if (batCanvas) {
      const ctx = batCanvas.context;
      // Wings (Vampiric crimson)
      ctx.fillStyle = '#820c1a';
      ctx.beginPath();
      ctx.moveTo(14, 8);
      ctx.lineTo(2, 2);
      ctx.lineTo(6, 16);
      ctx.lineTo(14, 10);
      ctx.lineTo(22, 16);
      ctx.lineTo(26, 2);
      ctx.closePath();
      ctx.fill();

      // Body & Head
      ctx.fillStyle = '#260408';
      ctx.fillRect(11, 6, 6, 8);
      // Glowing Eyes
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(12, 8, 1, 2);
      ctx.fillRect(15, 8, 1, 2);

      batCanvas.refresh();
    }

    // Axe Armor Knight (32x40)
    const knightCanvas = scene.textures.createCanvas('enemy_axe_armor', 32, 40);
    if (knightCanvas) {
      const ctx = knightCanvas.context;
      // Heavy Steel Armor Plate
      ctx.fillStyle = '#4a505b';
      ctx.fillRect(6, 10, 20, 20);
      ctx.fillStyle = '#6b7482';
      ctx.fillRect(8, 12, 16, 16);
      // Horned Great Helm
      ctx.fillStyle = '#3a3e47';
      ctx.fillRect(10, 2, 12, 10);
      ctx.fillStyle = '#ff2a2a'; // glowing visor
      ctx.fillRect(12, 6, 8, 2);
      // Legs
      ctx.fillStyle = '#2c3038';
      ctx.fillRect(8, 30, 6, 10);
      ctx.fillRect(18, 30, 6, 10);
      // Battle Axe
      ctx.fillStyle = '#9e813a';
      ctx.fillRect(26, 4, 3, 34);
      ctx.fillStyle = '#d0dbe5';
      ctx.beginPath();
      ctx.arc(27, 8, 9, -Math.PI * 0.5, Math.PI * 0.5, false);
      ctx.fill();
      knightCanvas.refresh();
    }
  }

  // --- TRAPS & DOORS ---
  private static createTrapTextures(scene: Phaser.Scene) {
    if (scene.textures.exists('trap_pendulum_blade')) return;

    // Pendulum Blade (24x48)
    const penCanvas = scene.textures.createCanvas('trap_pendulum_blade', 24, 48);
    if (penCanvas) {
      const ctx = penCanvas.context;
      // Chain rod
      ctx.fillStyle = '#4f5359';
      ctx.fillRect(11, 0, 2, 32);
      // Crescent Scythe Blade
      ctx.fillStyle = '#d6e1eb';
      ctx.beginPath();
      ctx.arc(12, 32, 11, 0, Math.PI, false);
      ctx.lineTo(23, 44);
      ctx.closePath();
      ctx.fill();
      // Razor edge highlight
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
      penCanvas.refresh();
    }

    // Relic Door (Gated Portcullis with glowing rune) (32x64)
    const doorCanvas = scene.textures.createCanvas('door_relic', 32, 64);
    if (doorCanvas) {
      const ctx = doorCanvas.context;
      // Iron Grate Frame
      ctx.fillStyle = '#222329';
      ctx.fillRect(0, 0, 32, 64);
      // Vertical Bars
      ctx.fillStyle = '#585c69';
      for (let i = 4; i < 32; i += 6) {
        ctx.fillRect(i, 0, 3, 64);
      }
      // Glowing Sanguine Relic Sigil Lock
      ctx.fillStyle = '#d41535';
      ctx.beginPath();
      ctx.arc(16, 32, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd1dc';
      ctx.fillRect(15, 28, 2, 8);
      doorCanvas.refresh();
    }
  }

  // --- CASTLE CORE ("Heart of Dracula") ---
  private static createCastleCoreTexture(scene: Phaser.Scene) {
    if (scene.textures.exists('castle_core')) return;

    // Giant Pulsating Biomechanical Vampire Heart (48x48)
    const coreCanvas = scene.textures.createCanvas('castle_core', 48, 48);
    if (coreCanvas) {
      const ctx = coreCanvas.context;
      // Outer gothic iron cage ring
      ctx.strokeStyle = '#c49a31';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(24, 24, 21, 0, Math.PI * 2);
      ctx.stroke();

      // Pulsating Heart Core
      ctx.fillStyle = '#8f0c1e';
      ctx.beginPath();
      ctx.moveTo(24, 38);
      ctx.bezierCurveTo(8, 24, 8, 12, 20, 12);
      ctx.bezierCurveTo(24, 12, 24, 16, 24, 16);
      ctx.bezierCurveTo(24, 16, 24, 12, 28, 12);
      ctx.bezierCurveTo(40, 12, 40, 24, 24, 38);
      ctx.fill();

      // Blood vessels & Arteries
      ctx.strokeStyle = '#ff334b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(24, 18);
      ctx.lineTo(20, 26);
      ctx.lineTo(28, 30);
      ctx.stroke();

      // Luminous Core Highlight
      ctx.fillStyle = '#ff8594';
      ctx.beginPath();
      ctx.arc(20, 18, 4, 0, Math.PI * 2);
      ctx.fill();

      coreCanvas.refresh();
    }
  }

  // --- SUB-WEAPONS ---
  private static createSubweaponTextures(scene: Phaser.Scene) {
    if (scene.textures.exists('sub_dagger')) return;

    // Throwing Dagger (16x16)
    const daggerCanvas = scene.textures.createCanvas('sub_dagger', 16, 16);
    if (daggerCanvas) {
      const ctx = daggerCanvas.context;
      ctx.fillStyle = '#e8f4fc';
      ctx.fillRect(4, 7, 10, 2);
      ctx.fillStyle = '#94a7b5';
      ctx.fillRect(14, 6, 2, 4); // tip
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(2, 5, 2, 6); // hilt
      daggerCanvas.refresh();
    }

    // Holy Water Bottle (16x16)
    const holyCanvas = scene.textures.createCanvas('sub_holywater', 16, 16);
    if (holyCanvas) {
      const ctx = holyCanvas.context;
      ctx.fillStyle = '#2db8ff';
      ctx.beginPath();
      ctx.arc(8, 10, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e0c068';
      ctx.fillRect(6, 3, 4, 4);
      holyCanvas.refresh();
    }

    // Holy Water Blue Fire Patch (32x24)
    const fireCanvas = scene.textures.createCanvas('effect_blue_fire', 32, 24);
    if (fireCanvas) {
      const ctx = fireCanvas.context;
      const grad = ctx.createLinearGradient(0, 0, 0, 24);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#38d9ff');
      grad.addColorStop(0.8, '#0b40b3');
      grad.addColorStop(1, 'rgba(11, 64, 179, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(2, 24);
      ctx.lineTo(8, 4);
      ctx.lineTo(14, 18);
      ctx.lineTo(20, 2);
      ctx.lineTo(26, 16);
      ctx.lineTo(30, 24);
      ctx.closePath();
      ctx.fill();
      fireCanvas.refresh();
    }
  }
}
