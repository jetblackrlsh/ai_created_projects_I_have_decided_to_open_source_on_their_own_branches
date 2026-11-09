#!/usr/bin/env python3
import copy
import random
import unittest
from test_power_effects import fixture
from modern_media import init,add_post,correct_post,tick
from modern_society import society_state,setup_citizen


class ZeroRandom(random.Random):
    def random(self):return 0.0


class MediaTests(unittest.TestCase):
    def world(self):
        w=fixture('Psychometry');s=society_state();s['year']=1
        for a in w.agents.values():
            a.update(age=25,compassion=.3,greed=.2,curiosity=.2,ambition=.5,charisma=.5,dream='family',parent_a=None,parent_b=None)
            setup_citizen(a,random.Random(a['id']));a.update(has_phone=True,job='farmer',app_rank='E',reputation=50,followers=0)
        return w,s

    def test_fake_correction_changes_standing_not_all_grievance(self):
        w,s=self.world();author,victim=w.agents[1],w.agents[2]
        post=add_post(s,w.agents,ZeroRandom(),1,author,victim,fake=True)
        self.assertEqual(victim['reputation'],40)
        self.assertTrue(correct_post(s,w.agents,post,2))
        self.assertEqual(victim['reputation'],47)
        self.assertGreater(victim['grievance'],0)
        self.assertEqual(author['fraud_victim_id'],victim['id'])
        victim['role']='hero'
        tick(w.agents,s,w,ZeroRandom(),4)
        self.assertEqual(victim['goal'],'revenge')
        self.assertEqual(victim['role'],'villain')
        self.assertTrue(post['corrected'])

    def test_virality_and_bounded_feed(self):
        w,s=self.world();a=w.agents[1]
        a['followers']=100000
        for _ in range(230):add_post(s,w.agents,ZeroRandom(),1,a,a)
        self.assertEqual(len(init(s)['posts']),200)
        self.assertEqual(init(s)['posts_created'],230)
        self.assertGreater(init(s)['viral_posts'],0)
        self.assertLessEqual(a['followers'],100000)
        self.assertTrue(all(p['views']<=1000000 for p in init(s)['posts']))

    def test_psychometry_corrects_provenance_and_offline_life_exists(self):
        w,s=self.world();p=add_post(s,w.agents,ZeroRandom(),1,w.agents[3],w.agents[2],fake=True)
        s['laws']['ranking_app']=False
        events=tick(w.agents,s,w,ZeroRandom(),2)
        self.assertTrue(p['corrected'])
        self.assertIn('Psychometry',p['correction_evidence'])
        self.assertGreater(init(s)['dating_matches'],0)
        self.assertTrue(any('offline' in e['true_event'] for e in events))

    def test_human_impersonation_spends_a_real_power_action(self):
        w,s=self.world();a=w.agents[1]
        a.update(power='Shapeshifting',powers=['Shapeshifting'],greed=.9,role='villain',power_ready_year=0,energy=100)
        w.events=[]
        tick(w.agents,s,w,ZeroRandom(),1)
        fakes=[p for p in init(s)['posts'] if p['fake']]
        self.assertTrue(fakes)
        self.assertTrue(fakes[0]['impersonation'])
        self.assertLess(a['energy'],100)
        self.assertEqual(w.state['usage']['Shapeshifting'],1)
        self.assertIn('impersonating_id',a)


if __name__=='__main__':unittest.main(verbosity=2)
