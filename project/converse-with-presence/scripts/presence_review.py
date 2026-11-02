#!/usr/bin/env python3
"""Private, offline, advisory conversational-style review; never rewrites text."""
import json
import re
import sys

MAX_BYTES = 1_000_000
MAX_TEXT = 100_000
RULES = [
    ('reflexive_distancing', r'\b(?:as an AI(?: language model)?[,]?\s+)?I (?:cannot|can\x27t|do not|don\x27t) (?:have|form|express) (?:any |real |personal )?(?:preferences|opinions)\b', 'Consider giving a specific evaluative judgment with reasons rather than a blanket self-negation.'),
    ('private_sensation_report', r'\bI (?:literally )?(?:feel (?:a |the )?(?:warmth|ache|tingle|heartbeat) (?:inside me|in my chest)|can feel my heart (?:racing|beating))\b', 'Check whether this invents a private bodily sensation. Prefer a concrete interpretation or clearly attributed fictional description.'),
]
COMPILED = [(name, re.compile(pattern, re.I), advice) for name, pattern, advice in RULES]


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError('duplicate JSON key')
        result[key] = value
    return result


def validate(data):
    if not isinstance(data, dict) or set(data) - {'text', 'context', 'excluded_spans'}:
        raise ValueError('expected an object with only text, context, excluded_spans')
    text = data.get('text')
    if not isinstance(text, str) or len(text) > MAX_TEXT:
        raise ValueError('text must be a string of at most 100000 code points')
    context = data.get('context', 'ordinary')
    if not isinstance(context, str) or context not in {'ordinary', 'consciousness', 'fiction', 'quotation'}:
        raise ValueError('invalid context')
    spans = data.get('excluded_spans', [])
    if not isinstance(spans, list) or len(spans) > 200:
        raise ValueError('excluded_spans must be a list of at most 200 spans')
    ranges = []
    for span in spans:
        if not isinstance(span, dict) or set(span) != {'start', 'end', 'kind'}:
            raise ValueError('each span needs exactly start, end, kind')
        start, end, kind = span['start'], span['end'], span['kind']
        if type(start) is not int or type(end) is not int or not (0 <= start < end <= len(text)):
            raise ValueError('invalid span bounds')
        if not isinstance(kind, str) or kind not in {'fiction', 'quotation'}:
            raise ValueError('invalid span kind')
        ranges.append((start, end, kind))
    ranges.sort()
    if any(a[1] > b[0] for a, b in zip(ranges, ranges[1:])):
        raise ValueError('spans must not overlap')
    return text, context, ranges


def quotation_ranges(text):
    patterns = [r'```[\s\S]*?```', r'~~~[\s\S]*?~~~', r'`[^`\n]*`', r'^\s*>[^\n]*', r'"[^"\n]*"', r'“[^”\n]*”']
    return [(m.start(), m.end(), 'quotation_or_code') for p in patterns for m in re.finditer(p, text, re.M)]


def review(data):
    text, context, ranges = validate(data)
    ranges += quotation_ranges(text)
    findings, suppressed = [], []
    for rule, pattern, advice in COMPILED:
        for match in pattern.finditer(text):
            item = {'rule': rule, 'start': match.start(), 'end': match.end(), 'text': match.group(), 'advice': advice}
            reason = context if context in {'fiction', 'quotation'} else next((kind for start, end, kind in ranges if start <= match.start() and match.end() <= end), None)
            if reason:
                item['reason'] = reason
                suppressed.append(item)
            else:
                findings.append(item)
    findings.sort(key=lambda x: (x['start'], x['rule']))
    suppressed.sort(key=lambda x: (x['start'], x['rule']))
    return {'ok': True, 'mode': 'advisory_only', 'findings': findings, 'suppressed': suppressed,
            'counts': {'findings': len(findings), 'suppressed': len(suppressed)},
            'checks': ['Does this answer the actual point with a specific judgment and reason?', 'Is expressive language grounded rather than an invented private experience?', 'Keep uncertainty that matters; do not insert consciousness caveats into unrelated conversation.'],
            'limitations': 'Limited lexical checks; not a consciousness detector, quality score, factual checker, or automatic rewrite.'}


def main():
    try:
        raw = sys.stdin.buffer.read(MAX_BYTES + 1)
        if len(raw) > MAX_BYTES:
            raise ValueError('input exceeds byte limit')
        def invalid_constant(value):
            raise ValueError('non-finite JSON number')
        data = json.loads(raw.decode('utf-8'), object_pairs_hook=unique_object, parse_constant=invalid_constant)
        result = review(data)
    except (ValueError, TypeError, UnicodeError, RecursionError) as exc:
        print(json.dumps({'ok': False, 'error': str(exc)}))
        return 2
    print(json.dumps(result, ensure_ascii=True))
    return 0

if __name__ == '__main__':
    sys.exit(main())
