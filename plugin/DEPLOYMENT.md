# Deploy your own private plugin

## ChatGPT Sites target
This implementation targets the Sites Worker/D1 contract and MCP protocol version `2026-07-28`. Sites access gates authenticate visitors before forwarding requests and inject `oai-authenticated-user-id`. That is a platform-provided identity, not a client field.

1. Create **your own** private Site with Worker ESM support. Keep its default owner-only audience. Register its returned project ID in `.openai/hosting.json` using your environment's documented Sites workflow. The public manifest intentionally has no project ID.
2. Bind D1 as `DB`. Include `drizzle/0000_fast_masque.sql` and its migration metadata through the Sites artifact packager so the table is migrated before serving. The SQL creates `roll_receipts` with `receipt_key` primary key, `declaration_hash`, nullable `raw_roll`, and `created_at`. Do not skip migrations; rolls fail closed when DB is absent.
3. Run the tests/build/validate commands in README. The source must be pushed to the Site's own repository, and the deployment archive built from that exact commit using your environment's documented Sites packaging flow. Keep the manifest and D1 migrations in the deployment archive. Do not publish the source folder as static assets.
4. Privately deploy the saved version. Verify successful status, owner-only access, `/mcp` discovery, and tool registration. Retrieve the platform-issued plugin ID and offer/install it through the supported plugin UI. Do not invent or reuse somebody else's ID.
5. Enable the plugin plus Pages/Google Docs in the conversation, run a synthetic campaign through a declared check, verify once-only retry behavior and the saved Page, then export a test Google Doc. Make no real-user-data/public-sharing changes as part of tests.

The companion `/` page explains use; it is not a second game session UI. There are no outbound API keys or model services to configure. Dependencies are development-only. Never expose a service bypass credential or trust it as a visitor identity.

## Other hosting
This is not drop-in for an arbitrary unauthenticated HTTP server. Supply a D1-compatible transactional binding and an authentication gateway that strips user-supplied identity headers and injects its own verified account ID. Without that gateway, attackers can spoof `oai-authenticated-user-id`. Implement the authentication/OAuth and MCP protocol required by your client; this package does not bundle a generic OAuth server. Do not expose the Worker directly on a public route while trusting raw client headers.

## Host adapter responsibilities
The assistant reads/updates Pages and creates Google Docs through its existing authorized connectors, with guarded writes and readback. The plugin itself has no connector credentials. Keep campaigns private. End-session export includes the complete chronology, not just a summary. Add the verified Doc link to the Page and preserve the resume point. Do not store GM secrets in player-visible exports. Check platform-specific Page size limits and create explicit checkpoints before reaching them.

Receipt storage is durable but not the campaign database. Never delete receipts merely to retry a failed Page save; retry with the same campaign/check IDs. An installation without a functioning authenticated D1 receipt path must report failure rather than invent dice.
