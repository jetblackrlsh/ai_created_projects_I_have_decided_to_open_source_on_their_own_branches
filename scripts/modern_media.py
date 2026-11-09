"""Bounded simulated internet, evidence, motives and rank-mediated social life.

No network access or real accounts. Views are abstract impressions, not unique
people; all content is synthetic event metadata, never generated real-person fakes.
"""
import math


def init(society):
    return society.setdefault('internet', {'posts': [], 'next_post_id': 1,
        'posts_created': 0, 'viral_posts': 0, 'fakes_created': 0, 'corrections': 0,
        'grievance_turns': 0, 'dating_matches': 0, 'bullying_events': 0,
        'fraud_exposures': 0, 'app_active_years': 0})


def clamp(x, low=0, high=100):
    return max(low, min(high, x))


def abilities(a):
    return set(([a.get('power')] + list(a.get('powers') or []))) - {None}


def setup(a, rng):
    if 'goal' not in a:
        a['goal'] = rng.choices(['money','streets','fame','revenge','country'],weights=[7,5,4,3,1])[0]
    a.setdefault('grievance',0.0)
    a.setdefault('pending_grievances',[])
    a.setdefault('wellbeing',80.0)
    a.setdefault('networking_invites',0)


def add_post(society, agents, rng, year, author, subject, kind='heroism', fake=False, impersonation=False):
    """Publish fictional metadata; update visible standing and lingering grievance."""
    net=init(society)
    if not author.get('has_phone') or author.get('account_banned_until',0)>=year:
        return None
    views=int((author.get('followers',0)+30)*rng.uniform(2,15)+rng.randint(20,1500))
    if rng.random()<.12: views*=30
    views=min(1000000,views)
    post={'id':net['next_post_id'],'year':year,'author_id':author['id'],
          'subject_id':subject['id'],'kind':kind,'fake':bool(fake),
          'impersonation':bool(impersonation),'corrected':False,'views':views,
          'evidence':'fabricated' if fake else 'witnessed','processed':True}
    net['next_post_id']+=1;net['posts_created']+=1
    if fake:net['fakes_created']+=1
    if views>=10000:net['viral_posts']+=1
    net['posts'].append(post)
    del net['posts'][:-200]
    author['followers']=min(100000,author.get('followers',0)+math.sqrt(views))
    if fake:
        subject['reputation']=clamp(subject.get('reputation',50)-10)
        subject['grievance']=clamp(subject.get('grievance',0)+15)
        pending=subject.setdefault('pending_grievances',[])
        pending.append({'post_id':post['id'],'due_year':year+3,'target_id':author['id']})
        del pending[:-8]
    elif kind=='crime':subject['reputation']=clamp(subject.get('reputation',50)-6)
    else:subject['reputation']=clamp(subject.get('reputation',50)+(5 if views>=10000 else 2))
    return post


def correct_post(society,agents,post,year,evidence='forensic provenance'):
    if not post['fake'] or post['corrected']:return False
    net=init(society);post['corrected']=True;post['corrected_year']=year;post['correction_evidence']=evidence
    net['corrections']+=1;net['fraud_exposures']+=1
    victim=agents.get(post['subject_id']);creator=agents.get(post['author_id'])
    if victim:
        victim['reputation']=clamp(victim.get('reputation',50)+7)
        # A correction repairs public standing, but not all trauma or social damage.
        victim['grievance']=max(0,victim.get('grievance',0)-2)
    if creator:
        creator['reputation']=clamp(creator.get('reputation',50)-12)
        creator['proven_fraud_until']=year+3
        creator['fraud_victim_id']=post['subject_id']
        creator['account_banned_until']=year+2
    return True


def tick(agents,society,powers,rng,year):
    net=init(society);events=[]
    def emit(cat,text,truth=None):
        events.append({'year':year,'category':cat,'true_event':truth or text,'public_belief':text,'secret':truth is not None and truth!=text})
    living=[a for a in agents.values() if a['alive']]
    for a in living:setup(a,rng)
    if society.get('laws',{}).get('ranking_app'):net['app_active_years']+=1
    # A bounded feed of witnessed public power incidents.
    witnessed=[e for e in powers.events if e.get('actor_id') in agents and not e.get('secret') and 'died from' not in e['true_event']]
    rng.shuffle(witnessed)
    for e in witnessed[:3]:
        person=agents[e['actor_id']]
        phone_users=[a for a in living if a.get('has_phone') and a['age']>=12]
        if not phone_users:break
        author=person if person.get('has_phone') else rng.choice(phone_users)
        kind='crime' if person.get('role')=='villain' else 'heroism'
        post=add_post(society,agents,rng,year,author,person,kind=kind)
        if post and post['views']>=10000:
            emit('viral_media',f"A {kind} clip about {person['name']} reached {post['views']} simulated impressions.")
    # Programmers and face-changing powers can manufacture false evidence.
    makers=[a for a in living if a['age']>=18 and a.get('has_phone') and
            (('Shapeshifting' in abilities(a)) or a.get('job')=='engineer' and a.get('curiosity',0)>.65) and
            (a.get('role')=='villain' or a.get('greed',0)>.5)]
    if makers and len(living)>2 and rng.random()<.22:
        author=rng.choice(makers);victims=[a for a in living if a['id']!=author['id'] and a['age']>=16]
        if victims:
            victim=rng.choice(victims)
            impersonation='Shapeshifting' in abilities(author) and author.get('energy',100)>=25 and author.get('suppressed_until',0)<year and author.get('power_ready_year',0)<=year and len(powers.activated_this_year)<24
            if impersonation:
                author['impersonating_id']=victim['id'];author['impersonating_until']=year+1
                author['energy']-=25;author['power_ready_year']=year+3
                author['power_xp']=author.get('power_xp',0)+1;author['power_uses_total']=author.get('power_uses_total',0)+1
                author['last_power_use_year']=year;author['mastery_level']=min(5,author['power_xp']//10)
                powers.activated_this_year.add(author['id'])
                powers.state['usage']['Shapeshifting']=powers.state['usage'].get('Shapeshifting',0)+1
            post=add_post(society,agents,rng,year,author,victim,'alleged crime',True,impersonation)
            if post:
                emit('misinformation',f"A clip appeared to implicate {victim['name']} in wrongdoing.",
                     f"{author['name']} fabricated a {'human-impersonation' if impersonation else 'AI-edited'} clip framing {victim['name']}; it reached {post['views']} simulated impressions.")
    investigators=[a for a in living if {'Psychometry','Perfect Memory'}&abilities(a) or
                   a.get('job')=='journalist' and a.get('curiosity',0)>.7 and society.get('laws',{}).get('free_press')]
    for post in net['posts']:
        if post['fake'] and not post['corrected'] and post['year']<year and investigators and rng.random()<min(.85,.15*len(investigators)):
            detective=rng.choice(investigators)
            if correct_post(society,agents,post,year,'Psychometry provenance' if 'Psychometry' in abilities(detective) else 'record comparison/investigation'):
                victim=agents.get(post['subject_id'],{'name':'a citizen'})
                emit('correction',f"{detective['name']} proved the clip about {victim['name']} was fabricated; the correction did not erase every grievance.")
    # Corrections do not simply delete grievances; delayed choices can change roles.
    for a in living:
        for pending in list(a.get('pending_grievances',[])):
            if pending['due_year']<=year:
                if a['grievance']>=12 and rng.random()<min(.8,a['grievance']/40)*(1-a.get('compassion',.5)*.5):
                    a['role']='villain';a['goal']='revenge';a['revenge_target_id']=pending['target_id']
                    net['grievance_turns']+=1
                    emit('grievance',f"{a['name']} embraced revenge after years of damaged trust and humiliation.")
                a['pending_grievances'].remove(pending)
        if a.get('role')=='villain':
            # Motives affect actual behavior, not just a descriptive label.
            if a['goal']=='money' and rng.random()<.12:
                others=[b for b in living if b['id']!=a['id'] and b.get('wealth',0)>=3]
                if others:
                    victim=rng.choice(others);victim['wealth']-=3;a['wealth']=min(10000,a.get('wealth',0)+3)
                    a['property_crime_until']=year+1;a['crime_victim_id']=victim['id']
            elif a['goal']=='country' and rng.random()<.06:
                society['integrity']=clamp(society['integrity']-2);society['freedom']=clamp(society['freedom']-1)
                emit('threat',f"{a['name']} attempted to intimidate the national government.")
            elif a['goal']=='streets':powers.r['guard']=max(0,powers.r['guard']-.1)
            elif a['goal']=='fame' and a.get('has_phone') and rng.random()<.15:
                add_post(society,agents,rng,year,a,a,'crime')
            elif a['goal']=='revenge' and a.get('revenge_target_id') in agents and rng.random()<.12:
                target=agents[a['revenge_target_id']]
                if target['alive']:powers.damage(target,.08,'revenge attack')
    # Rank affects peer treatment and adult matching; no real demographics are modeled.
    if True:
        vulnerable=[a for a in living if society.get('laws',{}).get('ranking_app') and 6<=a['age']<18 and a.get('app_rank') in ('E','F')]
        for child in vulnerable[:20]:
            if rng.random()<.05:
                child['wellbeing']=clamp(child['wellbeing']-5);child['grievance']=clamp(child['grievance']+3)
                net['bullying_events']+=1
                peers=[b for b in living if b['id']!=child['id'] and b['age']<20]
                if peers:
                    bully=rng.choice(peers)
                    pending=child.setdefault('pending_grievances',[])
                    pending.append({'post_id':None,'due_year':max(year+3,year+18-child['age']),'target_id':bully['id'],'reason':'rank bullying'})
                    del pending[:-8]
        singles=[a for a in living if a['age']>=18 and a.get('clone_of') is None and
                 (a.get('spouse') is None or not agents.get(a['spouse'],{}).get('alive',False))]
        rng.shuffle(singles)
        labels={'S':6,'A':5,'B':4,'C':3,'D':2,'E':1,'F':0,'Unranked':0}
        for i in range(0,min(40,len(singles)-1),2):
            a,b=singles[i:i+2]
            kin=a['id'] in (b.get('parent_a'),b.get('parent_b')) or b['id'] in (a.get('parent_a'),a.get('parent_b')) or bool(({a.get('parent_a'),a.get('parent_b')}-{None}) & ({b.get('parent_a'),b.get('parent_b')}-{None}))
            chance=.25/(1+abs(labels.get(a.get('app_rank'),0)-labels.get(b.get('app_rank'),0))) if society.get('laws',{}).get('ranking_app') else .25
            if not kin and rng.random()<chance:
                a['spouse']=b['id'];b['spouse']=a['id'];net['dating_matches']+=1
                emit('social',f"{a['name']} and {b['name']} formed a partnership {'through the simulated ranking app' if society.get('laws',{}).get('ranking_app') else 'through offline social life'}.")
    return events
