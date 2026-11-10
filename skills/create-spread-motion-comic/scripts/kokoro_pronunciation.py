"""Deterministic English AI initialism override for kokoro-onnx.

Keep source/caption text untouched. Pass the returned string to engine.create
with is_phonemes=True; this is NOT Misaki markup or ordinary text.
"""
import re

PRONUNCIATION_VERSION = 'english-ai-phonemes-v1'
AI_PHONEMES = 'ˌeɪˈaɪ'
# Uppercase only; do not alter rain, said, lowercase ai, OpenAI or other acronyms.
# Accept legacy A I and dotted A.I.; retain possessives/plurals as /z/.
AI_PATTERN = re.compile(r"(?<!\w)(?:A[ \t]+I|A\.I\.(?!\w)|AI)(?P<suffix>['’]s|s)?(?!\w)")


def phonemize_for_kokoro(text, tokenizer, lang='en-us'):
    """Return vocabulary-checked phonemes with AI pronounced 'A eye'."""
    matches = list(AI_PATTERN.finditer(text))
    if not matches:
        return tokenizer.phonemize(text, lang=lang)
    if lang not in ('en-us', 'en-gb'):
        raise ValueError('AI pronunciation override supports en-us/en-gb only')
    unknown = set(AI_PHONEMES + 'z') - set(tokenizer.vocab)
    if unknown:
        raise ValueError(f'Kokoro vocabulary lacks override phonemes: {unknown}')
    parts=[]; last=0
    for match in matches:
        before=text[last:match.start()]
        if before.strip(): parts.append(tokenizer.phonemize(before, lang=lang))
        parts.append(AI_PHONEMES + ('z' if match.group('suffix') else ''))
        last=match.end()
    if text[last:].strip(): parts.append(tokenizer.phonemize(text[last:], lang=lang))
    return ' '.join(parts)
