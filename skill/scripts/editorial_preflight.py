"""Structural editorial gate; not a truth or intent verifier."""
import json, re, sys
CHECKS = ('intent_preserved','host_voice','source_conflicts_resolved','visuals_and_metadata_aligned','no_unnecessary_hedging')
PHRASES = ('the document says','the document argues','the author argues','in the source document','this video was generated from','the supplied document')
def validate(data):
    errors=[]
    for key in ('host','thesis','audience','takeaway','script'):
        if not isinstance(data.get(key),str) or not data[key].strip(): errors.append(f'Missing {key}')
    if data.get('mode') not in ('host_video','document_review','behind_the_scenes'): errors.append('Invalid mode')
    if not data.get('must_preserve'): errors.append('Missing must_preserve')
    for key in CHECKS:
        if data.get('checks',{}).get(key) is not True: errors.append(f'Review incomplete: {key}')
        if not str(data.get('review_notes',{}).get(key,'')).strip(): errors.append(f'Missing review evidence: {key}')
    script=str(data.get('script','')).casefold()
    if data.get('mode')=='host_video':
        for phrase in PHRASES:
            if phrase in script and not (phrase in data.get('allowed_phrases',[]) and data.get('exception_reason','').strip()): errors.append(f'Production/report phrasing: {phrase}')
    if not isinstance(data.get('claims'),list): errors.append('Missing claims list (empty only if no factual claims)')
    for claim in data.get('claims',[]):
        if claim.get('status') not in ('verified','attributed','creative','unresolved'): errors.append('Invalid claim status')
        if claim.get('status')=='unresolved': errors.append(f"Unresolved claim: {claim.get('id')}")
        for key in ('id','statement','source','observed_at','reasoning'):
            if not claim.get(key): errors.append(f'Missing claim {key}')
        if claim.get('kind')=='availability' and claim.get('status')=='verified' and claim.get('evidence_type') not in ('access_verified','official_release'):
            errors.append('Availability is not verified by marketing or a single firsthand report')
    return errors
if __name__=='__main__':
    errors=validate(json.load(open(sys.argv[1])))
    print(json.dumps({'passed':not errors,'errors':errors,'limitation':'Requires substantive human/agent semantic review; no automated truth verification.'},indent=2))
    sys.exit(bool(errors))
