"""Declared initial conditions, not ongoing guarantees or arbitrary executable rules."""
from copy import deepcopy
import math
from goal_engine import validate_goals

TRAITS={'ambition','compassion','greed','curiosity','charisma'}
DREAMS={'family','freedom','knowledge','order','fame'}
MOTIVES={'money','streets','fame','revenge','country'}
JOBS={'unemployed','farmer','teacher','journalist','medic','engineer','civil_servant','security','entrepreneur','hero_contractor'}
PARTIES={'pluralist','security','populist'}
CHAR_FIELDS={'key','id','name','last_name','description','faction','powers','age','mastery_level','main_character','traits','dream','motive','role','wealth','job','income','has_phone','reputation','followers','injury','energy','alive','power_license','healer_burnout','imprisoned_years','hospitalized_years','quarantined_years','infected_years','party','goals','knowledge_points'}
SETTINGS={'mode','years','pop','power_rate','mutation_rate','seed','wheel_interval','wall_year','tribe_a','tribe_b'}
LAWS={'royal_guard','hero_charter','gifted_draft','registration_act','power_ban','royal_amnesty','civil_rights_act','election_protection','emergency_powers','free_press','ranking_app','public_health_act'}
RESOURCES={'food','materials','medicine','fortifications','infrastructure','guard','harvest_bonus'}


def bounded(value,lo,hi,name,integer=False):
    if isinstance(value,bool) or not isinstance(value,(int,float)) or not math.isfinite(value) or not lo<=value<=hi or integer and type(value) is not int:
        raise ValueError(f'{name} must be finite in [{lo}, {hi}]'+(' and an integer' if integer else ''))


def validate_custom_character(c,catalog):
    if set(c)-CHAR_FIELDS:raise ValueError('Unknown character field: '+str(sorted(set(c)-CHAR_FIELDS)))
    for field in ('last_name','faction','description'):
        if field in c and (not isinstance(c[field],str) or len(c[field])>(1000 if field=='description' else 120)):raise ValueError('Invalid '+field)
    enums={'dream':DREAMS,'motive':MOTIVES,'role':{'citizen','hero','villain'},'job':JOBS,'party':PARTIES}
    for field,options in enums.items():
        if field in c and c[field] not in options:raise ValueError('Unsupported '+field)
    for field in ('main_character','has_phone','alive','power_license'):
        if field in c and type(c[field]) is not bool:raise ValueError(field+' must be boolean')
    for field,lo,hi,integer in [('wealth',0,10000,False),('income',0,1000,False),('reputation',0,100,False),('followers',0,100000,False),('injury',0,.95,False),('energy',0,100,False),('healer_burnout',0,100,False),('knowledge_points',0,100,False),('imprisoned_years',0,1000,True),('hospitalized_years',0,100,True),('quarantined_years',0,100,True),('infected_years',0,10,True)]:
        if field in c:bounded(c[field],lo,hi,field,integer)
    if 'goals' in c:validate_goals(c['goals'],catalog)


def validate_world_settings(data):
    settings=data.setdefault('settings',{})
    if not isinstance(settings,dict) or set(settings)-SETTINGS:raise ValueError('Unknown scenario settings')
    for field,lo,hi in [('years',1,10000),('pop',1,10000),('wheel_interval',1,10000),('wall_year',1,10000)]:
        if field in settings:bounded(settings[field],lo,hi,field,True)
    for field in ('power_rate','mutation_rate'):
        if field in settings:bounded(settings[field],0,1,field)
    if 'seed' in settings and type(settings['seed']) is not int:raise ValueError('seed must be an integer')
    if 'mode' in settings and settings['mode'] not in ('modern','monarch','evolution','wheel','versus'):raise ValueError('Invalid default world mode')
    for field in ('tribe_a','tribe_b'):
        if field in settings and settings[field] not in ('speed','strength','intelligence'):raise ValueError('Invalid tribe')
    world=data.setdefault('world',{})
    if not isinstance(world,dict) or set(world)-{'resources','laws','counter_tech','society'}:raise ValueError('Unknown initial world fields')
    resources=world.get('resources',{})
    if not isinstance(resources,dict) or set(resources)-RESOURCES:raise ValueError('Unknown starting resource')
    for key,value in resources.items():bounded(value,0,10000,key)
    laws=world.get('laws',{})
    if not isinstance(laws,dict) or set(laws)-LAWS or any(type(v) is not bool for v in laws.values()):raise ValueError('Invalid starting laws')
    tech=world.get('counter_tech',[])
    if not isinstance(tech,list) or len(tech)>20 or any(not isinstance(t,str) or not t.strip() or len(t)>100 for t in tech):raise ValueError('Use at most20 named counter technologies')
    society=world.get('society',{})
    if not isinstance(society,dict) or set(society)-{'freedom','integrity','press_freedom','regime'}:raise ValueError('Unknown society condition')
    for field in ('freedom','integrity','press_freedom'):
        if field in society:bounded(society[field],0,100,field)
    if 'regime' in society and society['regime'] not in ('democracy','authoritarian'):raise ValueError('Invalid starting regime')
    relationships=data.setdefault('relationships',[])
    if not isinstance(relationships,list) or len(relationships)>128:raise ValueError('Use at most128 starting relationships')
    for r in relationships:
        if not isinstance(r,dict) or set(r)-{'type','a','b','mutual'} or r.get('type') not in ('parent','spouse','mentor','ally','enemy') or 'a' not in r or 'b' not in r or r['a']==r['b']:raise ValueError('Invalid starting relationship')
        if 'mutual' in r and type(r['mutual']) is not bool:raise ValueError('Relationship mutual must be boolean')


def apply_character(a,c,year,modern=False):
    for field in ('last_name','description','faction','dream','role','wealth','job','income','has_phone','reputation','followers','injury','energy','alive','power_license','healer_burnout','knowledge_points'):
        if field in c:a[field]=deepcopy(c[field])
    if 'motive' in c:a['goal']=c['motive']
    for prefix in ('imprisoned','hospitalized','quarantined','infected'):
        if prefix+'_years' in c:a[prefix+'_until']=year+c[prefix+'_years'] if c[prefix+'_years'] else 0
    if not a.get('alive',True):a['death_year']=year;a['death_cause']='declared starting scenario';a['_death_recorded']=False
    if modern:
        a['party']=c.get('party','pluralist' if a.get('compassion',.5)>=.55 else ('security' if a.get('ambition',.5)>=.6 else 'populist'))
    elif 'party' in c:a['party']=c['party']


def apply_relationships(agents,records,resolve):
    seen=set();antagonisms={}
    for r in records:
        a,b=resolve(r['a']),resolve(r['b']);kind=r['type']
        if a==b:raise ValueError('Self relationships are not supported')
        token=(kind,min(a,b),max(a,b)) if kind in ('spouse','ally','enemy') else (kind,a,b)
        if token in seen:raise ValueError('Duplicate relationship')
        seen.add(token);aa,bb=agents[a],agents[b]
        if kind in ('ally','enemy'):
            pair=(min(a,b),max(a,b));old=antagonisms.get(pair)
            if old and old!=kind:raise ValueError('A pair cannot start as both ally and enemy')
            antagonisms[pair]=kind
            field='ally_ids' if kind=='ally' else 'enemy_ids'
            aa.setdefault(field,[]).append(b)
            if r.get('mutual',True):bb.setdefault(field,[]).append(a)
        elif kind=='spouse':
            if aa['age']<18 or bb['age']<18:raise ValueError('Starting spouses must both be adults')
            if aa.get('spouse') not in (None,b) or bb.get('spouse') not in (None,a):raise ValueError('Conflicting starting spouses')
            aa['spouse']=b;bb['spouse']=a
        elif kind=='parent':
            if aa['age']<bb['age']+12:raise ValueError('Starting parent must be at least12 years older than child')
            slots=[k for k in ('parent_a','parent_b') if bb.get(k) is None]
            if not slots:raise ValueError('A child can start with at most two parents')
            bb[slots[0]]=a;aa.setdefault('children',[]).append(b)
        elif kind=='mentor':
            if aa['age']<16 or bb['age']<12:raise ValueError('Mentors must be16+ and pupils12+')
            if bb.get('mentor_id') not in (None,a):raise ValueError('Conflicting mentors')
            bb['mentor_id']=a;aa.setdefault('pupils',[]).append(b)

    for a in agents.values():
        if a.get('spouse') in agents:
            b=agents[a['spouse']]
            if b['id'] in (a.get('parent_a'),a.get('parent_b')) or a['id'] in (b.get('parent_a'),b.get('parent_b')) or ({a.get('parent_a'),a.get('parent_b')}-{None}) & ({b.get('parent_a'),b.get('parent_b')}-{None}):
                raise ValueError('Close kin cannot be configured as spouses')


def apply_world(scenario,powers,laws=None,counter_tech=None,society=None):
    if not scenario:return
    world=scenario.get('world',{})
    powers.r.update(deepcopy(world.get('resources',{})))
    if laws is not None:laws.update(world.get('laws',{}))
    if counter_tech is not None:
        for t in world.get('counter_tech',[]):
            if t not in counter_tech:counter_tech.append(t)
    if society is not None:
        society.update(world.get('society',{}));society['laws'].update(world.get('laws',{}))
