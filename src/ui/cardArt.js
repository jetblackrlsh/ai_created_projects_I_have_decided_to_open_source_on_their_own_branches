// LUCID DUEL: SPELLGAUNTLET — Procedural Holographic SVG Spell Art
// Generates crisp, vibrant vector illustrations for every spell card (aria-hidden decorative).

import { ELEMENTS } from '../data/cards.js';

export function renderCardArtSVG(card) {
  const el = ELEMENTS[card.element] || ELEMENTS.lucid;
  const c1 = el.color;
  const uid = `g_${card.id}_${Math.floor(Math.random() * 99999)}`;

  let motif = '';
  switch (card.id) {
    case 'porta':
    case 'omni_porta':
      motif = `
        <ellipse cx="80" cy="50" rx="44" ry="30" fill="none" stroke="${c1}" stroke-width="4" opacity="0.9"/>
        <ellipse cx="80" cy="50" rx="28" ry="18" fill="none" stroke="#38bdf8" stroke-width="3" stroke-dasharray="6 4"/>
        <circle cx="80" cy="50" r="10" fill="#e879f9" opacity="0.85"/>
        <path d="M22 50 Q80 12 138 50" fill="none" stroke="#f0abfc" stroke-width="1.6" opacity="0.7"/>
      `;
      break;
    case 'axe_souls':
      motif = `
        <line x1="56" y1="88" x2="104" y2="16" stroke="#94a3b8" stroke-width="5" stroke-linecap="round"/>
        <path d="M84 22 C116 14 128 46 98 62 C92 48 86 38 84 22 Z" fill="${c1}" opacity="0.85"/>
        <circle cx="104" cy="36" r="4" fill="#fff"/>
        <circle cx="114" cy="46" r="3" fill="#f9a8d4"/>
        <circle cx="96" cy="48" r="2.5" fill="#fff"/>
      `;
      break;
    case 'pyro':
    case 'supernova':
      motif = `
        <path d="M80 12 C104 34 114 58 98 84 C88 92 72 92 62 84 C46 58 56 34 80 12 Z" fill="${c1}" opacity="0.9"/>
        <path d="M80 30 C94 46 96 64 86 78 C80 82 74 78 72 72 C64 60 68 44 80 30 Z" fill="#fef08a"/>
      `;
      break;
    case 'aqua':
    case 'hydro':
      motif = `
        <path d="M12 68 Q42 30 78 54 T148 44 L148 96 L12 96 Z" fill="${c1}" opacity="0.78"/>
        <path d="M18 76 Q54 46 92 68 T148 60" fill="none" stroke="#bae6fd" stroke-width="3.5" stroke-linecap="round"/>
        <circle cx="48" cy="36" r="4" fill="#e0f2fe"/>
        <circle cx="112" cy="28" r="5" fill="#7dd3fc"/>
      `;
      break;
    case 'aegis':
      motif = `
        <path d="M80 14 L118 28 V54 C118 74 100 86 80 92 C60 86 42 74 42 54 V28 Z" fill="rgba(251,191,36,0.22)" stroke="#fbbf24" stroke-width="4"/>
        <path d="M80 26 L104 35 V53 C104 66 92 75 80 79 C68 75 56 66 56 53 V35 Z" fill="none" stroke="#fef08a" stroke-width="2"/>
        <circle cx="80" cy="52" r="8" fill="#fef08a"/>
      `;
      break;
    case 'kurenos':
    case 'fulmen':
      motif = `
        <polygon points="88,10 52,54 78,54 66,92 112,44 84,44" fill="#facc15" stroke="#fef9c3" stroke-width="2"/>
        <path d="M24 78 Q80 62 136 78" fill="none" stroke="#38bdf8" stroke-width="2.5" opacity="0.75"/>
      `;
      break;
    case 'rainbow_sword':
    case 'death_sword':
      motif = `
        <polygon points="80,10 90,64 80,74 70,64" fill="${card.id === 'rainbow_sword' ? `url(#rb_${uid})` : '#a855f7'}" stroke="#fff" stroke-width="1.5"/>
        <rect x="64" y="68" width="32" height="6" rx="3" fill="#e2e8f0"/>
        <rect x="76" y="74" width="8" height="16" rx="2" fill="#64748b"/>
      `;
      break;
    case 'lucid_light':
      motif = `
        <circle cx="80" cy="50" r="28" fill="#a855f7" opacity="0.45"/>
        <polygon points="80,12 88,42 118,50 88,58 80,88 72,58 42,50 72,42" fill="#f5d0fe"/>
        <circle cx="38" cy="24" r="3" fill="#fff"/>
        <circle cx="122" cy="26" r="2.5" fill="#7dd3fc"/>
        <circle cx="118" cy="78" r="3" fill="#fde047"/>
      `;
      break;
    case 'shrinking_ray':
      motif = `
        <rect x="26" y="38" width="54" height="24" rx="6" fill="#10b981" stroke="#6ee7b7" stroke-width="2"/>
        <polygon points="80,44 136,26 136,74 80,56" fill="#34d399" opacity="0.4"/>
        <circle cx="122" cy="50" r="10" fill="none" stroke="#a7f3d0" stroke-width="2" stroke-dasharray="4 3"/>
        <circle cx="122" cy="50" r="4" fill="#6ee7b7"/>
      `;
      break;
    default:
      motif = `
        <circle cx="80" cy="50" r="26" fill="none" stroke="${c1}" stroke-width="3.5" opacity="0.85"/>
        <polygon points="80,22 104,50 80,78 56,50" fill="${c1}" opacity="0.45" stroke="#fff" stroke-width="1.5"/>
        <circle cx="80" cy="50" r="7" fill="#fff" opacity="0.9"/>
      `;
  }

  return `
    <svg viewBox="0 0 160 100" aria-hidden="true">
      <defs>
        <radialGradient id="${uid}" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stop-color="${c1}" stop-opacity="0.34"/>
          <stop offset="100%" stop-color="#050712" stop-opacity="1"/>
        </radialGradient>
        <linearGradient id="rb_${uid}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#f43f5e"/>
          <stop offset="33%" stop-color="#facc15"/>
          <stop offset="66%" stop-color="#22d3ee"/>
          <stop offset="100%" stop-color="#a855f7"/>
        </linearGradient>
      </defs>
      <rect width="160" height="100" fill="url(#${uid})"/>
      <g opacity="0.22" stroke="${c1}" stroke-width="0.6">
        <line x1="0" y1="25" x2="160" y2="25"/>
        <line x1="0" y1="50" x2="160" y2="50"/>
        <line x1="0" y1="75" x2="160" y2="75"/>
        <line x1="40" y1="0" x2="40" y2="100"/>
        <line x1="80" y1="0" x2="80" y2="100"/>
        <line x1="120" y1="0" x2="120" y2="100"/>
      </g>
      ${motif}
    </svg>
  `;
}
