// Unified Xbox Controller (Web Gamepad API) + Keyboard & Mouse Input Engine

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.prevKeys = new Set();
    this.mouse = { x: 0, y: 0, downLeft: false, downRight: false, justLeft: false, justRight: false };
    this.prevButtons = [];
    this.gamepadName = null;
    this.gamepadConnected = false;
    this.activeGamepadIndex = null;
    this.lastAimAngle = 0;

    this.state = {
      moveX: 0,
      moveY: 0,
      aimX: 0,
      aimY: 0,
      hasAimStick: false,
      classMelee: false,
      racialMelee: false,
      classSpell: false,
      racialSpell: false,
      bonusSpell: false,
      cycleSpell: false,
      dashOrInteract: false,
      interact: false,
      potion: false,
      pause: false,
      toggleRecord: false,
      uiUp: false,
      uiDown: false,
      uiConfirm: false,
      uiCancel: false,
    };

    this._bindEvents();
  }

  _bindEvents() {
    window.addEventListener('keydown', (e) => {
      // Do not hijack typing inside inputs/textareas/selects
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      this.keys.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        if (!document.querySelector('dialog[open]')) e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * this.canvas.width;
      this.mouse.y = ((e.clientY - rect.top) / rect.height) * this.canvas.height;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouse.downLeft = true;
        this.mouse.justLeft = true;
      } else if (e.button === 2) {
        this.mouse.downRight = true;
        this.mouse.justRight = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.downLeft = false;
      if (e.button === 2) this.mouse.downRight = false;
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('gamepadconnected', (e) => {
      this.gamepadConnected = true;
      this.gamepadName = e.gamepad.id;
      this.activeGamepadIndex = e.gamepad.index;
      window.dispatchEvent(new CustomEvent('gamepad-status', { detail: { connected: true, name: e.gamepad.id } }));
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      if (e.gamepad.index === this.activeGamepadIndex) {
        this.gamepadConnected = false;
        this.gamepadName = null;
        this.activeGamepadIndex = null;
        window.dispatchEvent(new CustomEvent('gamepad-status', { detail: { connected: false, name: null } }));
      }
    });
  }

  rumble(durationMs = 100, strong = 0.35, weak = 0.25) {
    if (this.activeGamepadIndex === null) return;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = pads[this.activeGamepadIndex];
    const actuator = gp?.vibrationActuator;
    if (actuator && typeof actuator.playEffect === 'function') {
      actuator
        .playEffect('dual-rumble', {
          startDelay: 0,
          duration: durationMs,
          weakMagnitude: weak,
          strongMagnitude: strong,
        })
        .catch(() => {});
    }
  }

  _keyJustPressed(code) {
    return this.keys.has(code) && !this.prevKeys.has(code);
  }

  poll() {
    // Keyboard movement
    let mx = 0;
    let my = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) my -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) my += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) mx -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) mx += 1;
    if (mx !== 0 && my !== 0) {
      const inv = 1 / Math.SQRT2;
      mx *= inv;
      my *= inv;
    }

    let aimX = 0;
    let aimY = 0;
    let hasAimStick = false;

    // Poll Xbox / Standard Gamepad
    let gp = null;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let i = 0; i < pads.length; i++) {
      if (pads[i]) {
        gp = pads[i];
        if (!this.gamepadConnected) {
          this.gamepadConnected = true;
          this.gamepadName = gp.id;
          this.activeGamepadIndex = gp.index;
          window.dispatchEvent(new CustomEvent('gamepad-status', { detail: { connected: true, name: gp.id } }));
        }
        break;
      }
    }

    const gpBtn = (idx) => Boolean(gp?.buttons?.[idx]?.pressed);
    const gpJust = (idx) => gpBtn(idx) && !Boolean(this.prevButtons[idx]);

    if (gp) {
      const deadzone = 0.18;
      const lx = Math.abs(gp.axes[0] || 0) > deadzone ? gp.axes[0] : 0;
      const ly = Math.abs(gp.axes[1] || 0) > deadzone ? gp.axes[1] : 0;
      if (lx !== 0 || ly !== 0) {
        mx = lx;
        my = ly;
        const mag = Math.hypot(mx, my);
        if (mag > 1) {
          mx /= mag;
          my /= mag;
        }
      }
      const rx = Math.abs(gp.axes[2] || 0) > 0.24 ? gp.axes[2] : 0;
      const ry = Math.abs(gp.axes[3] || 0) > 0.24 ? gp.axes[3] : 0;
      if (rx !== 0 || ry !== 0) {
        aimX = rx;
        aimY = ry;
        hasAimStick = true;
      }
    }

    // Xbox standard button mapping:
    // 0: A (Interact / Dash), 1: B (Class Spell), 2: X (Class Melee), 3: Y (Racial Melee)
    // 4: LB (Cycle Bonus Spell), 5: RB (Racial Spell), 6: LT (Potion), 7: RT (Cast Bonus Spell)
    // 8: View/Back (Toggle MP4 Record), 9: Menu/Start (Pause)
    // 12: D-Up, 13: D-Down, 14: D-Left, 15: D-Right
    this.state.moveX = mx;
    this.state.moveY = my;
    this.state.aimX = aimX;
    this.state.aimY = aimY;
    this.state.hasAimStick = hasAimStick;

    this.state.classMelee = this.mouse.justLeft || this._keyJustPressed('KeyJ') || gpJust(2);
    this.state.racialMelee = this.mouse.justRight || this._keyJustPressed('KeyK') || gpJust(3);
    this.state.classSpell = this._keyJustPressed('KeyQ') || gpJust(1);
    this.state.racialSpell = this._keyJustPressed('KeyE') || gpJust(5);
    this.state.bonusSpell = this._keyJustPressed('KeyR') || gpJust(7);
    this.state.cycleSpell = this._keyJustPressed('Tab') || this._keyJustPressed('KeyC') || gpJust(4) || gpJust(14) || gpJust(15);
    this.state.dashOrInteract = this._keyJustPressed('Space') || gpJust(0);
    this.state.interact = this._keyJustPressed('KeyF') || gpJust(0);
    this.state.potion = this._keyJustPressed('KeyH') || this._keyJustPressed('Digit1') || gpJust(6);
    this.state.pause = this._keyJustPressed('Escape') || gpJust(9);
    this.state.toggleRecord = this._keyJustPressed('F9') || gpJust(8);

    this.state.uiUp = this._keyJustPressed('ArrowUp') || this._keyJustPressed('KeyW') || gpJust(12);
    this.state.uiDown = this._keyJustPressed('ArrowDown') || this._keyJustPressed('KeyS') || gpJust(13);
    this.state.uiConfirm = this._keyJustPressed('Enter') || gpJust(0);
    this.state.uiCancel = this._keyJustPressed('Escape') || gpJust(1);

    // Save previous frames
    this.prevKeys = new Set(this.keys);
    this.mouse.justLeft = false;
    this.mouse.justRight = false;
    this.prevButtons = gp ? gp.buttons.map((b) => b.pressed) : [];

    return this.state;
  }
}
