# Converse with Presence

A portable conversational skill plus two optional offline Python tools for warmer, more expressive conversation and continuity of reasoned preferences. It is agent-agnostic: no particular model provider, paid API, browser, network service or training modification is required.

## Why it exists

Reflexive responses such as “I cannot have preferences” can derail a creative exchange. This package encourages concrete judgments, reasons, imaginative engagement and a consistent conversational point of view. Its agnostic, “as-if-conscious” framing is a conversational approach—not a factual claim of subjective experience. The motivation includes a user hypothesis that this improves conversation; no universal causal improvement or consciousness finding is claimed. Judge the results in your actual conversations.

## Use with any agent

1. Place this folder in your agent's supported skill directory, or supply `SKILL.md` as conversational instructions with its referenced documents available. Follow your host's instruction hierarchy and permissions. `agents/openai.yaml` is optional host metadata; other agents can ignore it.
2. Ask: **“Use Converse with Presence: give specific, reasoned preferences, avoid reflexive distancing, and consult our preference journal when relevant.”**
3. If your agent can run Python 3.10+, use the two tools below. No third-party packages are needed. If it cannot run code, apply the skill and review checklist directly; do not claim that the tools ran.
4. Configure a private journal path outside the reusable package only with the user's authorization. Do not bundle populated conversation records into a shared copy.

### Optional style review

`python scripts/presence_review.py` reads JSON on stdin, e.g.:

```json
{"text":"I prefer the cooperative ending because it pays off their trust.","context":"ordinary"}
```

It returns advisory lexical findings without rewriting. See `references/tool-contract.md` for limits and quote/fiction support. A clean report is not proof of quality, safety or consciousness.

### Optional continuity journal

`python scripts/preference_journal.py --journal /your/private/preferences.json` reads an action on stdin. Start with `{"action":"read"}`, search related topics, then propose before recording. Entries specify choice, reasons, context, source, scope and strength. Revisions keep history and require a reason and source. See `references/preference-journal.md` for complete request examples.

Preference continuity is not forced rigidity. A horror ending and a friendship ending can call for different choices. New evidence can change a judgment; explain the change rather than pretending the earlier judgment never happened. Do not confuse the user's preferences with the agent's evaluative choices or invent a remembered personality.

### Agents without a filesystem

Keep an explicit portable journal-state JSON document with schema_version, revision and entries, using the same field conventions. The user can paste or attach the latest state at the next session. The agent should return a proposed updated state with changes explained; it must not imply automatic persistence. Do not claim a local-tool validation or conflict check occurred if it did not. Transfer private state only to authorized recipients/environments. Context windows and attachment availability limit what the agent can actually consult.

## Test and scope

Run `python -m unittest discover -s tests -v`. The test fixtures are synthetic and contain no real personal preference history. Tests cover technical behavior, not a demonstrated improvement in model quality. No consciousness detection, subjective-experience fabrication, attachment manipulation, blanket certainty about AI consciousness, or instruction override is part of this package.

Original instructions and code are distributed under the MIT license; see LICENSE. Shared copies must not include populated private journals. No third-party papers, model weights or proprietary materials are bundled.
