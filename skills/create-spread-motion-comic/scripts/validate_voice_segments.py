#!/usr/bin/env python3
"""Validate manually attributed, source-exact caption spans. Not a dialogue classifier."""
import json,sys
VERSION="1.0"
def validate(data):
    cast=data["cast"]
    assert "narrator" in cast, "missing narrator"
    assert len(set(cast.values()))==len(cast), "cast voices must be distinct"
    ids=set()
    for caption in data["captions"]:
        assert caption["id"] not in ids, "duplicate caption"
        ids.add(caption["id"])
        text=caption["source_text"]; pos=0
        assert text and caption["segments"], "empty caption"
        for s in caption["segments"]:
            assert type(s["start"]) is int and type(s["end"]) is int
            assert s["start"]==pos and pos<s["end"]<=len(text), "gap, overlap or invalid span"
            assert s["text"]==text[pos:s["end"]], "source text mismatch"
            assert s["kind"] in ("narration","dialogue","label"), "invalid kind"
            assert s["speaker"] in cast, "unknown speaker"
            if s["kind"]=="narration": assert s["speaker"]=="narrator", "narration assigned to character"
            if s["kind"]=="dialogue": assert s["speaker"]!="narrator", "dialogue assigned to narrator"
            pos=s["end"]
        assert pos==len(text), "uncovered source suffix"
    assert ids, "no captions"
    return {"valid":True,"version":VERSION,"captions":len(ids)}
if __name__=="__main__":
    print(json.dumps(validate(json.load(open(sys.argv[1],encoding="utf-8")))))
