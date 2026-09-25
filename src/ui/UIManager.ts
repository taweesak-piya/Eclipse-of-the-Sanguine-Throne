import { Sound } from '../audio/SoundEffects';
import { MapStorage } from '../data/DefaultMap';
import type { GameMode, PlayerCastleMap, PlayerStats } from '../types/game';
import type { ToolType, ArchitectScene } from '../scenes/ArchitectScene';
import type { RaidScene } from '../scenes/RaidScene';

export class UIManager {
  private game: Phaser.Game;
  private currentMode: GameMode = 'architect';

  // DOM Elements
  private modeButtons!: NodeListOf<HTMLButtonElement>;
  private hudLayer!: HTMLElement;
  private architectToolbar!: HTMLElement;
  private mobileControls!: HTMLElement;
  private keyHintsBar!: HTMLElement;

  private hpFill!: HTMLElement;
  private mpFill!: HTMLElement;
  private heartsCount!: HTMLElement;
  private timerDisplay!: HTMLElement;
  private starsDisplay!: HTMLElement;

  private budgetValueText!: HTMLElement;
  private budgetFill!: HTMLElement;

  constructor(game: Phaser.Game) {
    this.game = game;
    this.initDOMReferences();
    this.bindEvents();
    this.setMode('architect');
  }

  private initDOMReferences() {
    this.modeButtons = document.querySelectorAll<HTMLButtonElement>('.mode-btn');
    this.hudLayer = document.getElementById('hud-layer')!;
    this.architectToolbar = document.getElementById('architect-toolbar')!;
    this.mobileControls = document.getElementById('mobile-controls')!;
    this.keyHintsBar = document.getElementById('key-hints-bar')!;

    this.hpFill = document.getElementById('hp-fill')!;
    this.mpFill = document.getElementById('mp-fill')!;
    this.heartsCount = document.getElementById('hearts-count')!;
    this.timerDisplay = document.getElementById('timer-display')!;
    this.starsDisplay = document.getElementById('stars-display')!;

    this.budgetValueText = document.getElementById('budget-value-text')!;
    this.budgetFill = document.getElementById('budget-fill')!;
  }

  private bindEvents() {
    // Mode Switcher buttons
    this.modeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode as GameMode;
        if (mode) this.setMode(mode);
      });
    });

    // Sound toggle
    const soundBtn = document.getElementById('btn-sound-toggle');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const isMuted = Sound.toggleMute();
        soundBtn.textContent = isMuted ? '🔇' : '🔊';
      });
    }

    // CRT Scanline toggle
    const crtBtn = document.getElementById('btn-crt-toggle');
    const crtOverlay = document.getElementById('crt-overlay');
    if (crtBtn && crtOverlay) {
      crtBtn.addEventListener('click', () => {
        crtOverlay.classList.toggle('disabled');
        Sound.playUIPress();
      });
    }

    // Architect Tools Buttons
    const toolBtns = document.querySelectorAll<HTMLButtonElement>('.tool-btn');
    toolBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        toolBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const tool = btn.dataset.tool as ToolType;
        const archScene = this.game.scene.getScene('ArchitectScene') as ArchitectScene;
        if (archScene && archScene.scene.isActive()) {
          archScene.setTool(tool);
        }
      });
    });

    // Save Castle Button
    document.getElementById('btn-save-castle')?.addEventListener('click', () => {
      const archScene = this.game.scene.getScene('ArchitectScene') as ArchitectScene;
      if (archScene && archScene.mapData) {
        MapStorage.saveMap(archScene.mapData);
        Sound.playUIPress();
        this.showToast('Castle Layout Saved to Local Grimoire!');
      }
    });

    // Reset Default Button
    document.getElementById('btn-reset-default')?.addEventListener('click', () => {
      if (confirm('Reset Castle layout to the primordial catacombs?')) {
        const fresh = MapStorage.resetToDefault();
        this.game.scene.stop('ArchitectScene');
        this.game.scene.start('ArchitectScene', { mapData: fresh });
        Sound.playUIPress();
      }
    });

    // Export JSON Button
    document.getElementById('btn-export-json')?.addEventListener('click', () => {
      const archScene = this.game.scene.getScene('ArchitectScene') as ArchitectScene;
      const data = archScene?.mapData || MapStorage.loadMap();
      this.showJsonModal('Export Castle Schema', JSON.stringify(data, null, 2), false);
    });

    // Import JSON Button
    document.getElementById('btn-import-json')?.addEventListener('click', () => {
      this.showJsonModal('Import Castle Schema', '', true, (jsonStr) => {
        try {
          const parsed = JSON.parse(jsonStr) as PlayerCastleMap;
          if (parsed && parsed.layers && parsed.gridWidth) {
            MapStorage.saveMap(parsed);
            this.game.scene.stop('ArchitectScene');
            this.game.scene.start('ArchitectScene', { mapData: parsed });
            this.showToast('Custom Castle Schema Imported!');
          }
        } catch {
          alert('Invalid JSON Schema format.');
        }
      });
    });

    // Validate (Proof of Victory) Button in Architect
    document.getElementById('btn-validate-run')?.addEventListener('click', () => {
      this.setMode('validation');
    });

    // Virtual Mobile / Touch Controls
    this.setupVirtualControls();
  }

  private setupVirtualControls() {
    const bindTouch = (id: string, onDown: () => void, onUp: () => void) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        onDown();
      });
      el.addEventListener('pointerup', (e) => {
        e.preventDefault();
        onUp();
      });
      el.addEventListener('pointerleave', (e) => {
        e.preventDefault();
        onUp();
      });
    };

    const getPlayer = () => {
      const raidScene = this.game.scene.getScene('RaidScene') as RaidScene;
      return raidScene?.player;
    };

    bindTouch('v-left', () => { const p = getPlayer(); if (p) p.virtualLeft = true; }, () => { const p = getPlayer(); if (p) p.virtualLeft = false; });
    bindTouch('v-right', () => { const p = getPlayer(); if (p) p.virtualRight = true; }, () => { const p = getPlayer(); if (p) p.virtualRight = false; });
    bindTouch('v-jump', () => { const p = getPlayer(); if (p) p.virtualJump = true; }, () => { const p = getPlayer(); if (p) p.virtualJump = false; });
    bindTouch('v-attack', () => { const p = getPlayer(); if (p) p.virtualAttack = true; }, () => { const p = getPlayer(); if (p) p.virtualAttack = false; });
    bindTouch('v-dash', () => { const p = getPlayer(); if (p) p.virtualDash = true; }, () => { const p = getPlayer(); if (p) p.virtualDash = false; });
    bindTouch('v-sub', () => { const p = getPlayer(); if (p) p.virtualSub = true; }, () => { const p = getPlayer(); if (p) p.virtualSub = false; });
  }

  public setMode(mode: GameMode) {
    this.currentMode = mode;
    Sound.playUIPress();

    // Update active nav button
    this.modeButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    const currentMap = MapStorage.loadMap();

    if (mode === 'architect') {
      this.hudLayer.style.display = 'none';
      this.architectToolbar.style.display = 'flex';
      this.keyHintsBar.style.display = 'none';
      if (this.mobileControls) this.mobileControls.style.display = 'none';

      // Switch Phaser Scene
      this.game.scene.stop('RaidScene');
      this.game.scene.start('ArchitectScene', { mapData: currentMap });

      // Listen for budget updates from architect scene
      this.timeDelayBudgetHook();
    } else {
      // Raid or Validation
      this.hudLayer.style.display = 'flex';
      this.architectToolbar.style.display = 'none';
      this.keyHintsBar.style.display = 'flex';
      if (this.mobileControls) this.mobileControls.style.display = 'flex';

      // Reset HUD bars
      this.updatePlayerStats({
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
        relics: { doubleJump: true, mistForm: false, batFlight: false },
      });

      this.timerDisplay.textContent = '04:00';
      this.starsDisplay.innerHTML = '☆☆☆';

      // Switch Phaser Scene
      this.game.scene.stop('ArchitectScene');
      this.game.scene.start('RaidScene', { mapData: currentMap, mode });

      this.timeDelayRaidHooks();
    }
  }

  private timeDelayBudgetHook() {
    setTimeout(() => {
      const archScene = this.game.scene.getScene('ArchitectScene') as ArchitectScene;
      if (archScene) {
        archScene.events.on('uiBudgetUpdated', (data: { used: number; max: number }) => {
          this.budgetValueText.textContent = `${data.used} / ${data.max} Pts`;
          const pct = Math.min(100, (data.used / data.max) * 100);
          this.budgetFill.style.width = `${pct}%`;
        });
      }
    }, 100);
  }

  private timeDelayRaidHooks() {
    setTimeout(() => {
      const raidScene = this.game.scene.getScene('RaidScene') as RaidScene;
      if (raidScene) {
        // Player Damaged event
        raidScene.events.on('playerDamaged', (stats: PlayerStats) => {
          this.updatePlayerStats(stats);
        });

        // Timer update event
        raidScene.events.on('uiTimerUpdated', (secondsLeft: number) => {
          const mins = Math.floor(secondsLeft / 60);
          const secs = secondsLeft % 60;
          this.timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
          this.timerDisplay.classList.toggle('urgent', secondsLeft <= 30);
        });

        // Stars updated event
        raidScene.events.on('uiStarsUpdated', (stars: number) => {
          let starHtml = '';
          for (let i = 1; i <= 3; i++) {
            if (i <= stars) {
              starHtml += '<span class="star-active">★</span>';
            } else {
              starHtml += '☆';
            }
          }
          this.starsDisplay.innerHTML = starHtml;
        });

        // Victory event
        raidScene.events.on('uiGameVictory', (res: { mode: GameMode; stars: number; essenceLooted: number; goldLooted: number }) => {
          this.showVictoryModal(res);
        });

        // Defeat event
        raidScene.events.on('uiGameDefeat', (res: { reason: string }) => {
          this.showDefeatModal(res.reason);
        });
      }
    }, 100);
  }

  public updatePlayerStats(stats: PlayerStats) {
    const hpPct = Math.max(0, (stats.hp / stats.maxHp) * 100);
    const mpPct = Math.max(0, (stats.mp / stats.maxMp) * 100);

    this.hpFill.style.width = `${hpPct}%`;
    this.mpFill.style.width = `${mpPct}%`;
    this.heartsCount.textContent = `♥ × ${stats.hearts}`;
  }

  private showVictoryModal(res: { mode: GameMode; stars: number; essenceLooted: number; goldLooted: number }) {
    const isValidation = res.mode === 'validation';
    const title = isValidation ? 'PROOF OF VICTORY ACHIEVED!' : 'CASTLE CORE SHATTERED!';
    const sub = isValidation
      ? 'You have personally cleared your castle layout from entrance to heart. This defensive blueprint is now VALIDATED and authorized for the global Sanguine Ledger!'
      : `Total Victory! 3 Stars secured. You plundered ${res.essenceLooted} Sanguine Essence and ${res.goldLooted} Dark Gold from the rival lord's vault!`;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-card">
        <h2 class="modal-title">${title}</h2>
        <div class="stars-display" style="font-size: 36px; margin: 10px 0;">
          <span class="star-active">★★★</span>
        </div>
        <p class="modal-body">${sub}</p>
        <button class="modal-btn" id="modal-ok-btn">RETURN TO ARCHITECT</button>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#modal-ok-btn')?.addEventListener('click', () => {
      overlay.remove();
      this.setMode('architect');
    });
  }

  private showDefeatModal(reason: string) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-card">
        <h2 class="modal-title" style="color: #ff334b;">INVASION FAILED</h2>
        <p class="modal-body">${reason}</p>
        <p class="modal-body" style="color: #8c8699; font-size: 11px;">The rival castle's defenses proved impassable. Refine your tactics or bolster your relics.</p>
        <button class="modal-btn" id="modal-retry-btn">RETRY RUN</button>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#modal-retry-btn')?.addEventListener('click', () => {
      overlay.remove();
      this.setMode(this.currentMode);
    });
  }

  private showJsonModal(title: string, defaultText: string, isEditable: boolean, onConfirm?: (val: string) => void) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-card" style="max-width: 600px;">
        <h2 class="modal-title">${title}</h2>
        <textarea class="modal-json-area" id="modal-json-input" ${isEditable ? '' : 'readonly'}>${defaultText}</textarea>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button class="action-btn" id="modal-cancel-btn">CANCEL</button>
          <button class="modal-btn" id="modal-confirm-btn">${isEditable ? 'IMPORT MAP' : 'COPY TO CLIPBOARD'}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const textarea = overlay.querySelector('#modal-json-input') as HTMLTextAreaElement;

    overlay.querySelector('#modal-cancel-btn')?.addEventListener('click', () => overlay.remove());

    overlay.querySelector('#modal-confirm-btn')?.addEventListener('click', () => {
      if (isEditable && onConfirm) {
        onConfirm(textarea.value);
        overlay.remove();
      } else {
        navigator.clipboard.writeText(textarea.value);
        this.showToast('Castle Schema Copied to Clipboard!');
        overlay.remove();
      }
    });
  }

  private showToast(msg: string) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: absolute;
      top: 90px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(18, 16, 26, 0.95);
      border: 1px solid #d4af37;
      color: #ffd700;
      padding: 8px 24px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      z-index: 200;
      box-shadow: 0 4px 20px rgba(0,0,0,0.8);
      animation: fadeIn 0.3s ease;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2400);
  }
}
