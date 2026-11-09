#!/usr/bin/env python3
"""Optional reproducible multi-seed stability check, not a balance certification."""
import argparse
import collections
import json
import math
from simulate_world import run_single_world_evolution_or_monarch_or_wheel


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--worlds', type=int, default=20)
    parser.add_argument('--years', type=int, default=200)
    args = parser.parse_args()
    if args.worlds < 1 or args.years < 1:
        parser.error('worlds and years must be positive')
    for mode in ('evolution', 'monarch', 'wheel'):
        usage = collections.Counter()
        extinct = revived = clones = maxpop = 0
        for index in range(args.worlds):
            w = run_single_world_evolution_or_monarch_or_wheel(
                mode, 42 + index * 97, args.years, 100, .35, .35,
                wheel_interval=20, total_years=args.years)
            assert len(w['agents']) < 20000, 'unexpected unbounded population growth'
            for a in w['agents'].values():
                assert 0 <= a.get('injury', 0) <= 1
                assert 0 <= a.get('energy', 100) <= 100
                assert a.get('resurrections', 0) <= 1
                if a.get('clone_of') is not None:
                    assert not a['children'], 'a clone reproduced'
            assert all(math.isfinite(v) and v >= 0 for v in w['world_resources'].values())
            assert sum(w['power_usage'].values()) <= args.years * 24
            usage.update(w['power_usage'])
            extinct += w['final_population'] == 0
            revived += w['resurrections']
            clones += w['clones_created']
            maxpop = max(maxpop, w['final_population'])
        print(json.dumps({'mode': mode, 'worlds': args.worlds, 'years': args.years,
              'extinctions': extinct, 'largest_final_population': maxpop,
              'resurrections': revived, 'clones_created': clones,
              'distinct_powers_used': len(usage), 'usage': dict(usage)}), flush=True)


if __name__ == '__main__':
    main()
