# Lumenweave: The Unbound Accord

An original, offline fairy card-battle adventure. Seven adult Waykeepers defend connected dimensions from conquerors who would own their roads, histories, futures, and identities.

## Play

Open `index.html` in a modern browser. Keep `app.js`, `data.js`, `styles.css`, and `assets/` beside it. No account, API key, model download, payment, build step, or network connection is required. For development, optionally run `python3 -m http.server 8000` in this folder and visit `http://localhost:8000`.

Choose a fairy and battle through seven chapters. Play cards using mana, combine attacks and defensive effects, and build Accord for a powerful ultimate. Story progression unlocks card upgrades. Versus mode lets you experiment without changing campaign progression. Local saves are stored only in your browser; clearing site data can erase them. Level codes provide another way to resume.

## The Waykeepers

| Fairy | Magic |
|---|---|
| Tavra | Dragon fire |
| Oru | Sun and moon light |
| Veska | Nature and flora |
| Pella | Soundwaves and harmony |
| Iman | Technology magic |
| Sile | Water and Shapeflow, a flexible shapeable magical fluid |
| Nemi | Wild animal magic |

The game has 56 cards, each with a base and upgraded form, seven passive abilities, seven ultimates, and seven campaign adversaries. The fictional world, dialogue, character identities, and newly generated illustrations are original to this release. Broad elemental concepts are not intended to reproduce another franchise's characters or visual designs.

## Development

The application is plain HTML, CSS, and JavaScript. It does not bundle third-party runtime packages. `data.js` contains the cast, cards, and campaign; `app.js` handles the battle and interface. Art is local under `assets/`.

See `tests/` for the available regression checks and `TESTING.md` for the exact validation performed and its limitations. Do not treat test coverage as a promise that every browser or accessibility configuration is supported.

## Licensing and provenance

Original project code and text are offered under the MIT license in `LICENSE`. Generated illustrations are covered separately by `ART_LICENSE.md`; see `ART_PROVENANCE.md` for generation and processing details. No model weights are distributed. No third-party franchise artwork, logos, external image hotlinks, personal credentials, or private development history are included.

This release is AI-assisted. It is not affiliated with, sponsored by, or endorsed by any entertainment franchise. The licenses grant only rights the contributors can grant and do not provide trademark clearance or a legal guarantee.
