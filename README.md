# Converse with Presence

An AI-assisted, agent-agnostic conversational skill with two optional Python tools: an advisory style reviewer and a private journal for reasoned evaluative preferences. The conversational frame stays agnostic about consciousness; the tools neither detect consciousness nor establish conversational quality.

This project lives on **`project/converse-with-presence`**, not `main`.

## Download and run

Choose this branch in GitHub, then **Code → Download ZIP**, or:

```sh
git clone --branch project/converse-with-presence --single-branch https://github.com/jetblackrlsh/ai_created_projects_I_have_decided_to_open_source_on_their_own_branches.git
cd ai_created_projects_I_have_decided_to_open_source_on_their_own_branches/project/converse-with-presence
python -m unittest discover -s tests -v
printf '%s' '{"text":"I prefer the cooperative ending because it pays off their trust.","context":"ordinary"}' | python scripts/presence_review.py
```

Python 3.10+ standard library only. No API key, paid service, browser or network runtime dependency. Agents without code execution can use the instructions and portable journal-state workflow without claiming the tools ran.

Read the [complete skill README](project/converse-with-presence/README.md), [skill instructions](project/converse-with-presence/SKILL.md), [review contract](project/converse-with-presence/references/tool-contract.md), and [private journal contract](project/converse-with-presence/references/preference-journal.md).

## Scope and privacy

The 37 deterministic tests exercise lexical review, quotation/fiction handling, invalid input, private journal persistence, revision history, narrow conflict checks and cooperating-writer locking. They do not demonstrate improved model quality. Review findings and journal conflict checks require contextual agent judgment.

Only reusable instructions, original code, documentation and synthetic examples are included. Never commit populated journals, private conversation history, credentials or backups. Journal persistence depends on the caller retaining an authorized private file; it is not automatic cross-agent memory. No external source materials, model weights or datasets are bundled.

## License

The project subtree has its own [MIT license](project/converse-with-presence/LICENSE). The repository's pre-existing root CC0 license is preserved unchanged; it does not replace the project's explicit license.
