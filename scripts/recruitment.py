"""Informed voluntary recruitment; explicit fictional assumptions, not psychology.

No mind-control powers, deception or repeated-until-success attempts are used.
Every target gets one ID-keyed trial whose odds are recorded in the output.
"""
from copy import deepcopy
import math
from combat_sim import _rng, POWER_PROFILES


def validate_recruitment(value, fighters):
    if value is None:return None
    if not isinstance(value,dict) or set(value)-{'persuasion','targets','mode','proposal'}:raise ValueError('Invalid recruitment settings')
    v=deepcopy(value)
    def unit(x):
        if isinstance(x,bool) or not isinstance(x,(int,float)) or not math.isfinite(x) or not 0<=x<=1:raise ValueError('Recruitment traits must be0..1')
        return x
    v.setdefault('mode','persuasion')
    if v['mode']!='character':v['persuasion']=unit(v.get('persuasion',.6))
    if v['mode'] not in ('persuasion','refusal_control','character'):raise ValueError('Unknown recruitment mode')
    if v['mode']=='character':
        proposal=v.get('proposal')
        if not isinstance(proposal,dict) or set(proposal)!={'objective','harmfulness'} or not isinstance(proposal['objective'],str) or not proposal['objective'].strip() or len(proposal['objective'])>80:raise ValueError('Character recruitment requires objective and harmfulness')
        unit(proposal['harmfulness'])
        if 'persuasion' in value:raise ValueError('Character recruitment reads recruiter persuasiveness, not a scenario persuasion override')
        for f in fighters:
            for field in ('persuasiveness','susceptibility','morality'):
                if field not in f:raise ValueError('Character recruitment requires explicit per-character social stats')
                unit(f[field])
    elif 'proposal' in v:raise ValueError('Proposal requires character mode')
    targets=v.get('targets')
    if not isinstance(targets,list) or not targets:raise ValueError('Recruitment requires targets')
    roster={f['id']:f for f in fighters};seen=set()
    for t in targets:
        if not isinstance(t,dict) or set(t)-{'id','trust','goal_alignment','moral_resistance','devastation_power'}:raise ValueError('Invalid recruitment target')
        aid=t.get('id')
        if not isinstance(aid,str) or aid not in roster or roster[aid]['team']!='heroes' or aid in seen:raise ValueError('Target must be unique original hero')
        seen.add(aid)
        if v['mode']=='character':
            if 'goal_alignment' in t or 'moral_resistance' in t:raise ValueError('Character recruitment reads target character goals and morality')
            t['trust']=unit(t.get('trust',.1))
        else:
            for key,default in [('trust',.1),('goal_alignment',0),('moral_resistance',.95)]:t[key]=unit(t.get(key,default))
        p=t.get('devastation_power')
        if p not in roster[aid]['powers'] or POWER_PROFILES[p]['damage']<=0:raise ValueError('Supporter requires held damaging devastation power')
    v['targets']=sorted(targets,key=lambda x:x['id'])
    return v


def acceptance_probability(persuasion,target):
    logit=-2+2*persuasion+target['trust']+2*target['goal_alignment']-4*target['moral_resistance']
    return 1/(1+math.exp(-logit))


def apply_recruitment(fighters,config,seed):
    """Mutates only supplied fresh fighter specs; returns full prelude evidence."""
    original={f['id']:f['team'] for f in fighters};rows={f['id']:f for f in fighters};traces=[]
    recruiter=next(f for f in fighters if f['team']=='threat')
    for t in config['targets']:
        if config['mode']=='character':
            from social_dynamics import persuasion_probability
            target=rows[t['id']];proposal=config['proposal'];alignment=target.get('goal_positions',{}).get(proposal['objective'],0)
            p=persuasion_probability(recruiter['persuasiveness'],target['susceptibility'],target['morality'],t['trust'],alignment,proposal['harmfulness'])
            roll=_rng(seed,'recruitment',t['id']).random();accepted=roll<p
            if accepted:target['team']='threat'
            traces.append({'target_id':t['id'],'proposal':deepcopy(proposal),'informed':True,'coercion':False,'mode':'character','persuasion':recruiter['persuasiveness'],'susceptibility':target['susceptibility'],'morality':target['morality'],'trust':t['trust'],'goal_alignment':alignment,'acceptance_probability':p,'roll':roll,'accepted':accepted,'original_team':'heroes','new_team':target['team'],'devastation_power':t['devastation_power']})
            continue
        p=acceptance_probability(config['persuasion'],t) if config['mode']=='persuasion' else 0.
        roll=_rng(seed,'recruitment',t['id']).random();accepted=roll<p
        if accepted:rows[t['id']]['team']='threat'
        traces.append({'target_id':t['id'],'proposal':'Join the deliberate destruction of the world population',
                       'informed':True,'coercion':False,'mode':config['mode'],'persuasion':config['persuasion'],
                       'trust':t['trust'],'goal_alignment':t['goal_alignment'],'moral_resistance':t['moral_resistance'],
                       'acceptance_probability':p,'roll':roll,'accepted':accepted,'original_team':'heroes',
                       'new_team':rows[t['id']]['team'],'devastation_power':t['devastation_power']})
    return {'original_teams':original,'trace':traces,'accepted_ids':[x['target_id'] for x in traces if x['accepted']],
            'rejected_ids':[x['target_id'] for x in traces if not x['accepted']]}
