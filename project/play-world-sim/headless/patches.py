"""Restricted state edits, applied to a copy before core transaction validation."""
import copy
import re
import worldsim as w

SAFE_KEY=re.compile(r'^[A-Za-z0-9_-]{1,100}$')
FORBIDDEN={'__proto__','prototype','constructor'}
RESERVED={'crossover_plan','source_initialization'}
ENTITY_FIELDS={
    'places':{'name','description','public_description','connections'},
    'items':{'name','holder','quantity','visible'},
    'npcs':{'name','location','goals','knowledge','memories','relationships','conditions','visible'},
    'clocks':{'name','purpose','progress','target','unit','trigger','consequence'},
    'meters':{'name','value','min','max','visibility'},
}
OBJECT_FIELDS={
    'player':{'location','abilities','conditions','commitments'},
    'time':{'elapsed_minutes','label'},
    'world':{'title','premise','laws','seed'},
    'preferences':{'genre','tone','presentation','boundaries','adjudication'},
}
LIST_ROOTS={'facts','claims','recent_events','pending'}

def safe_key(key):
    w.require(isinstance(key,str) and SAFE_KEY.fullmatch(key) and key not in FORBIDDEN,'unsafe patch path key')

def check_value(value,depth=0):
    w.require(depth<=32,'patch value nesting limit')
    if isinstance(value,dict):
        for key,child in value.items():
            w.require(isinstance(key,str) and key not in FORBIDDEN,'unsafe patch object key')
            check_value(child,depth+1)
    elif isinstance(value,list):
        for child in value:check_value(child,depth+1)
    # JSON serializability/nonfinite values checked once for the whole request below.

def entity(state,collection,identity):
    safe_key(identity)
    xs=state.get(collection,[])
    w.require(isinstance(xs,list),'entity collection must be list')
    found=[x for x in xs if isinstance(x,dict) and x.get('id')==identity]
    w.require(len(found)==1,'unknown or ambiguous entity ID: '+identity)
    return found[0]

def target(state,path):
    w.require(isinstance(path,list) and 1<=len(path)<=12,'patch path must be1..12 keys, not a JSON pointer or filename')
    for key in path:safe_key(key)
    root=path[0]
    if root in LIST_ROOTS:
        w.require(len(path)==1,'replace the entire list; array indexes are not supported')
        return state,root
    if root in ENTITY_FIELDS:
        w.require(len(path)>=3,'entity path needs collection, stable ID and field')
        obj=entity(state,root,path[1]);key=path[2]
        w.require(key in ENTITY_FIELDS[root],'field is not patchable')
        tail=path[3:]
        w.require(not tail or (root=='npcs' and key=='relationships'),'nested entity patch only supports relationships')
    elif root in OBJECT_FIELDS:
        w.require(len(path)==2 and path[1] in OBJECT_FIELDS[root],'field is not patchable')
        return state[root],path[1]
    elif root=='extensions':
        w.require(len(path)>=2 and path[1] not in RESERVED,'reserved initialization provenance is not patchable')
        obj=state['extensions'];key=path[1];tail=path[2:]
    else:raise w.Invalid('root is not patchable; identity, branch and turn are engine controlled')
    for next_key in tail:
        w.require(key in obj and isinstance(obj[key],dict),'nested patch parent missing or not object')
        obj=obj[key];key=next_key
    return obj,key

def apply_patch(state,operations):
    """Return candidate only. Caller MUST apply ordinary full-state resolve validation."""
    w.require(isinstance(operations,list) and 1<=len(operations)<=128,'patch needs1..128 operations')
    w.require(len(w.encode(operations))<=w.MAX_BYTES,'patch size limit')
    result=copy.deepcopy(state);paths=[];entities=set()
    for operation in operations:
        w.require(isinstance(operation,dict),'patch operation must be object')
        op=operation.get('op')
        if op in ('set','delete'):
            allowed={'op','path','value'} if op=='set' else {'op','path'}
            w.require(set(operation)==allowed,'unknown or missing patch operation fields')
            path=operation['path'];obj,key=target(result,path)
            signature=tuple(path)
            w.require(not any(signature[:len(p)]==p or p[:len(signature)]==signature for p in paths),'overlapping patch paths are ambiguous')
            paths.append(signature)
            if op=='set':
                check_value(operation['value']);obj[key]=copy.deepcopy(operation['value'])
            else:
                w.require(path[0]=='extensions' and key in obj,'delete only supports an existing ordinary extension key')
                del obj[key]
        elif op in ('add_entity','remove_entity'):
            fields={'op','collection','value'} if op=='add_entity' else {'op','collection','id'}
            w.require(set(operation)==fields,'unknown or missing entity operation fields')
            collection=operation['collection'];w.require(collection in ENTITY_FIELDS,'invalid entity collection')
            if op=='add_entity':
                value=operation['value'];w.require(isinstance(value,dict),'entity must be object')
                identity=value.get('id');safe_key(identity);check_value(value)
                w.require(not any(e.get('id')==identity for e in result.get(collection,[])),'entity ID already exists')
                result.setdefault(collection,[]).append(copy.deepcopy(value))
            else:
                identity=operation['id'];entry=entity(result,collection,identity)
                result[collection].remove(entry)
            signature=(collection,identity)
            w.require(signature not in entities,'duplicate entity mutation')
            w.require(not any(p[:2]==signature for p in paths),'entity mutation overlaps field patch')
            entities.add(signature)
        else:raise w.Invalid('unknown patch operation')
        if op in ('set','delete') and len(signature)>=2:
            w.require(signature[:2] not in entities,'field patch overlaps entity mutation')
    return result
