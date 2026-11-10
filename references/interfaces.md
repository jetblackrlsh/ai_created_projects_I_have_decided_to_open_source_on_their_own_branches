# Interface contract and verification boundaries

ChatGPT Instant's interactive approach was user-tested in the originating session. This package does not claim universal ChatGPT surface support. Model intelligence and UI capability are different things. A skill cannot add a missing host API.

Embed or adapt the bundled offline widget using the surface's documented API. Bind an explicit host submit adapter only after inspecting current interface guidance. Send selection AND extra text. The engine accepts a raw roll and canonical campaign/scene/check IDs; compute outcomes again from pending state. A widget-reported success label is not authority.

Without a host adapter, use the widget's copyable message and paste it into chat, or use text choices and physical dice. No simulated callbacks, no guessed global API. The offline demo is not an autonomous AI or server.

Persist the rolled receipt locally before enabling submission. Local browser storage can preserve a roll across reload on the same browser/origin, but can be erased, unavailable, or edited. Export receipt for portability. If a roll was made but never transmitted and storage is gone, disclose that the authoritative GM does not know it; ask the player to supply their original result or explicitly authorize a replacement. Never quietly reset. This is a cooperative solo game, not a tamper-proof competitive service.

Testing separates: core math/validation tests, offline UI browser tests, and actual host integration. Only report those actually executed. Test desktop and mobile layouts where available, stale and duplicate IDs, custom empty action, natural overrides, partial bands, reload and exported receipts. Keep host and Drive adapters explicitly conditional, not fake completed integrations.
