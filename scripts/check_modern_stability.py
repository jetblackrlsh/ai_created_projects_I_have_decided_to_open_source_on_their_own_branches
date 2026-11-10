#!/usr/bin/env python3
"""Reproducible scenario/invariant sweep, not political or economic validation."""
import argparse
import collections
import json
import math
from modern_society import run_modern
from simulate_world import POWER_TREE, pick_power_mutation


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--worlds',type=int,default=20)
    parser.add_argument('--years',type=int,default=100)
    args=parser.parse_args()
    if args.worlds<1 or args.years<1:parser.error('worlds and years must be positive')
    for policy in (None,'civil_rights_act','emergency_powers','ban_ranking_app'):
        outcomes=collections.Counter();freedoms=[];opportunities=[];mastered=transfers=0
        for i in range(args.worlds):
            w=run_modern(42+i*97,args.years,100,.3,.35,POWER_TREE,pick_power_mutation,policy_override=policy)
            assert len(w['agents'])<15000
            assert all(0<=w[k]<=100 for k in ('freedom','election_integrity','press_freedom'))
            assert all(math.isfinite(v) and v>=0 for v in w['world_resources'].values())
            for a in w['agents'].values():
                assert 0<=a.get('mastery_level',0)<=5 and 0<=a.get('reputation',50)<=100
                assert 0<=a.get('energy',100)<=100 and a.get('resurrections',0)<=1
                if a.get('clone_of') is not None:assert not a['children']
            for e in w['government']['elections']:assert sum(e['votes'].values())==e['eligible_voters']
            outcomes[w['society_outcome']]+=1;freedoms.append(w['freedom']);opportunities.append(w['app_opportunities'])
            mastered+=sum(a.get('mastery_level',0)>0 for a in w['agents'].values());transfers+=w['peaceful_transfers']
        print(json.dumps({'policy':policy or 'baseline','worlds':args.worlds,'years':args.years,
              'outcomes':dict(outcomes),'mean_final_freedom':round(sum(freedoms)/args.worlds,2),
              'mean_app_opportunities':round(sum(opportunities)/args.worlds,2),
              'agents_with_mastery':mastered,'peaceful_transfers':transfers}),flush=True)


if __name__=='__main__':main()
