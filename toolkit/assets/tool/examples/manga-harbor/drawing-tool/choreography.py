"""Explicit 2D contact placement, not physics, IK or automatic choreography."""
import copy,math
from modules.action_characters import contact_points

def align_contact(anchor,anchor_point,movable,movable_point,offset=(0,0)):
    """Return copied movable figure translated to contact+offset; preserve its pose."""
    if len(offset)!=2 or any(type(v) not in (int,float) or not math.isfinite(v) for v in offset):raise ValueError('Finite 2D offset required')
    a=contact_points(anchor);b=contact_points(movable)
    if anchor_point not in a or movable_point not in b:raise ValueError('Unknown contact point')
    out=copy.deepcopy(movable);x,y=out.get('position',[400,400]);p=a[anchor_point];q=b[movable_point]
    out['position']=[x+p[0]-q[0]+offset[0],y+p[1]-q[1]+offset[1]]
    return out

def contact_distance(a,ap,b,bp):return math.dist(contact_points(a)[ap],contact_points(b)[bp])
