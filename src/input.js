/**
 * Unified Xbox Controller (HTML5 Gamepad API) + Keyboard/Mouse input manager.
 */
export const PAD_BTN = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  BACK: 8,
  START: 9,
  L3: 10,
  R3: 11,
  UP: 12,
  DOWN: 13,
  LEFT: 14,
  RIGHT: 15,
};

function applyDeadzone(val, dz = 0.16) {
  if (Math.abs(val) < dz) return 0;
  const sign = Math.sign(val);
  return sign * ((Math.abs(val) - dz) / (1 - dz));
}

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.justKeys = new Set();
    this.mouseButtons = new Set();
    this.justMouse = new Set();
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;

    this.padIndex = null;
    this.padConnected = false;
    this.padName = '';
    this.prevPadBtns = new Array(17).fill(false);
    this.currPadBtns = new Array(17).fill(false);
    this.padAxes = [0, 0, 0, 0];
    this.ltValue = 0;
    this.rtValue = 0;
    this.prevRtHeld = false;
    this.prevLtHeld = false;

    this._bindEvents();
  }

  _bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (!this.keys.has(e.code)) {
        this.justKeys.add(e.code);
      }
      this.keys.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (document.pointerLockElement !== this.canvas && e.button === 0) {
        this.canvas.requestPointerLock?.();
      }
      if (!this.mouseButtons.has(e.button)) {
        this.justMouse.add(e.button);
      }
      this.mouseButtons.add(e.button);
    });

    window.addEventListener('mouseup', (e) => {
      this.mouseButtons.delete(e.button);
    });

    window.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === this.canvas) {
        this.mouseDeltaX += e.movementX;
        this.mouseDeltaY += e.movementY;
      }
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('gamepadconnected', (e) => {
      this.padIndex = e.gamepad.index;
      this.padConnected = true;
      this.padName = e.gamepad.id;
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      if (this.padIndex === e.gamepad.index) {
        this.padIndex = null;
        this.padConnected = false;
        this.padName = '';
      }
    });
  }

  poll() {
    this.prevPadBtns = [...this.currPadBtns];
    this.prevRtHeld = this.rtValue > 0.35;
    this.prevLtHeld = this.ltValue > 0.35;

    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let activePad = null;
    if (this.padIndex !== null && pads[this.padIndex]) {
      activePad = pads[this.padIndex];
    } else {
      for (const p of pads) {
        if (p && p.connected) {
          activePad = p;
          this.padIndex = p.index;
          this.padConnected = true;
          this.padName = p.id;
          break;
        }
      }
    }

    if (activePad) {
      this.padAxes = [
        applyDeadzone(activePad.axes[0] ?? 0),
        applyDeadzone(activePad.axes[1] ?? 0),
        applyDeadzone(activePad.axes[2] ?? 0),
        applyDeadzone(activePad.axes[3] ?? 0),
      ];
      for (let i = 0; i < 16; i++) {
        const b = activePad.buttons[i];
        this.currPadBtns[i] = Boolean(b && (b.pressed || b.value > 0.35));
      }
      this.ltValue = activePad.buttons[PAD_BTN.LT]?.value ?? 0;
      this.rtValue = activePad.buttons[PAD_BTN.RT]?.value ?? 0;
    } else {
      this.padConnected = false;
      this.padAxes = [0, 0, 0, 0];
      this.currPadBtns.fill(false);
      this.ltValue = 0;
      this.rtValue = 0;
    }
  }

  endFrame() {
    this.justKeys.clear();
    this.justMouse.clear();
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
  }

  padJustPressed(btn) {
    return this.currPadBtns[btn] && !this.prevPadBtns[btn];
  }

  padHeld(btn) {
    return this.currPadBtns[btn];
  }

  keyJustPressed(code) {
    return this.justKeys.has(code);
  }

  getMoveVector() {
    let x = this.padAxes[0];
    let y = this.padAxes[1];
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    return { x, y, magnitude: Math.min(1, len) };
  }

  getCameraLook(dt) {
    // Right stick + mouse delta
    let yaw = -this.padAxes[2] * 2.5 * dt;
    let pitch = this.padAxes[3] * 1.8 * dt;
    yaw -= this.mouseDeltaX * 0.0028;
    pitch += this.mouseDeltaY * 0.0022;
    return { yaw, pitch };
  }

  isSprinting() {
    return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.padHeld(PAD_BTN.L3);
  }

  isAttackPressed() {
    const rtJust = this.rtValue > 0.35 && !this.prevRtHeld;
    return rtJust || this.justMouse.has(0) || this.keyJustPressed('KeyJ');
  }

  isHeavyPressed() {
    return this.padJustPressed(PAD_BTN.RB) || this.keyJustPressed('KeyK');
  }

  isGuarding() {
    return this.ltValue > 0.35 || this.mouseButtons.has(2) || this.keys.has('KeyL');
  }

  isDodgePressed() {
    return this.padJustPressed(PAD_BTN.B) || this.keyJustPressed('Space') || this.keyJustPressed('KeyQ');
  }

  isInteractPressed() {
    return this.padJustPressed(PAD_BTN.X) || this.keyJustPressed('KeyE') || this.keyJustPressed('KeyF');
  }

  isSwapWeaponPressed() {
    return this.padJustPressed(PAD_BTN.Y) || this.keyJustPressed('KeyR') || this.keyJustPressed('Tab');
  }

  isPausePressed() {
    return this.padJustPressed(PAD_BTN.START) || this.keyJustPressed('Escape');
  }

  rumble(weak = 0.3, strong = 0.3, duration = 120) {
    if (this.padIndex === null) return;
    const pad = navigator.getGamepads?.()[this.padIndex];
    const actuator = pad?.vibrationActuator;
    if (actuator && typeof actuator.playEffect === 'function') {
      actuator.playEffect('dual-rumble', {
        startDelay: 0,
        duration,
        weakMagnitude: Math.min(1, Math.max(0, weak)),
        strongMagnitude: Math.min(1, Math.max(0, strong)),
      }).catch(() => {});
    }
  }
}
