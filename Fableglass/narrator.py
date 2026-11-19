"""Narrative choices and dialogue fragments for the weight compiler."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Beat:
    name: str
    requires: tuple
    excludes: tuple
    score: float
    prose: tuple
    dialogue: tuple


# Prose uses named fields from the world state. Selecting a beat is a model decision.
BEATS = [
    Beat('opening', ('intent:begin',), (), 12, (
        '{premise}\n\n{npc} takes stock of the situation. {status}',
        '{premise}\n\n{status} {npc} stays close enough to hear you.',
    ), (
        '“What’s your first move?”',
        '',
    )),
    Beat('status', ('intent:status',), (), 7, (
        '{npc} gives you the short version. {status}',
        '{npc} glances toward {problem}. {status}',
        '{status} {npc} lets you take that in.',
    ), (
        '“{stakes}”',
        '“{lead}”',
    )),
    Beat('urgent', ('intent:status', 'pressure'), (), 9, (
        '{warning} {npc} catches you up. {status}',
        '{status} Then {warningLower}',
    ), (
        '“{stakes}”',
        '“{lead}”',
    )),
    Beat('explain', ('intent:explain', 'target'), (), 8, (
        '{npc} studies {target}. “{capability}”',
        '“About {target}?” {npc} considers it. “{capability}”',
        '{npc} points to {target}. “{capability}”',
    ), (
        '{hint}',
        '',
    )),
    Beat('history', ('intent:recall', 'memory'), (), 9, (
        '“Here’s what we found,” {npc} says. {memory}',
        '{npc} goes over the sequence with you. {memory}',
    ), (
        '',
        '“{lead}”',
    )),
    Beat('question', ('intent:question', 'subject'), (), 7, (
        '“About {subject}?” {npc} looks up. “I don’t have the whole story. {lead}”',
        '{npc} takes the question seriously. “I can tell you what I’ve seen. {lead}”',
    ), (
        '',
        '“What have you heard?”',
    )),
    Beat('learn', ('intent:inspect', 'target'), ('examined', 'interface'), 8, (
        'Up close, {target} yields something concrete. {observation}',
        '{npc} watches while you examine {target}. {observation}',
        '{observation} You couldn’t have seen it from where you were standing.',
    ), (
        '“{inference}”',
        '',
        '“{test}”',
    )),
    Beat('interface', ('intent:inspect', 'target', 'interface'), ('control-known',), 10, (
        '{observation} {npc} looks back at you.',
        'Looking specifically for a control pays off. {observation}',
        'You work your way around {target}. {observation}',
    ), (
        '“{test}”',
        '“{inference}”',
    )),
    Beat('revisit', ('intent:inspect', 'target', 'examined'), (), 7, (
        'On a second look, {target} matches what you saw before. {observation}',
        'The details of {target} haven’t changed. {observation}',
    ), (
        '“{test}”',
        '',
    )),
    Beat('test', ('intent:use', 'target'), ('tested', 'fit'), 8, (
        'You {method}. {effect}',
        '{effect} {npc} follows the change all the way back to {problem}.',
        '{npc} gives you room as you {method}. {effect}',
    ), (
        '“{inference}”',
        '“{lead}”',
        '',
    )),
    Beat('repeat-test', ('intent:use', 'target', 'tested'), ('fit',), 8, (
        'The second attempt produces the same result. {effect}',
        '{targetCap} responds as it did before. The result holds for a moment, then fades.',
    ), (
        '“{lead}”',
        '',
    )),
    Beat('partial', ('intent:solve',), ('fit', 'handoff'), 9, (
        'You try to {attempt}. {setback}',
        '{npc} works beside you. {setback}',
    ), (
        '“{lead}”',
        '“{test}”',
    )),
    Beat('compromised', ('exposed',), ('handoff',), 12, (
        'The plan reaches the weak point, then you have to pull back. {warning}',
        '{npc} stops you just short of committing to the attempt. {warning}',
    ), (
        '“{lead}”',
        '“We can still try it, if someone holds the other side.”',
    )),
    Beat('resolve', ('fit',), ('handoff',), 12, (
        'You {attempt}. {resolution}',
        '{resolution} {npc} watches long enough to be sure the change holds.',
    ), (
        '“{handoff}”',
        '{handoff}',
    )),
    Beat('approach', ('intent:travel', 'destination'), ('blocked',), 8, (
        'You make your way to {destination}. {arrival}',
        '{npc} follows you as far as {destination}. {arrival}',
    ), (
        '',
        '“{lead}”',
    )),
    Beat('blocked', ('intent:travel', 'blocked'), (), 10, (
        'You reach the edge of the way forward. {setback}',
        '{npc} stops beside you instead of pressing ahead. {setback}',
    ), (
        '“{lead}”',
        '',
    )),
    Beat('offer', ('intent:offer',), ('trust',), 8, (
        '{npc} hears out your offer, then commits to helping. {help}',
        '{npc} takes a moment to weigh what you’re offering. Then {helpLower}',
    ), (
        '“{lead}”',
        '',
    )),
    Beat('agreement', ('intent:offer', 'trust'), (), 8, (
        '{npc} stays with the deal you already made. {help}',
        '{npc} gives you a quick nod. “You have my word.”',
    ), (
        '',
        '“{lead}”',
    )),
    Beat('declare', ('intent:declare', 'subject'), (), 8, (
        '{npc} takes that in. {declaration}',
        'That changes what the two of you know. {declaration}',
    ), (
        '',
        '“{lead}”',
    )),
    Beat('take', ('intent:take', 'target'), ('carried',), 8, (
        'You take {target}. {npc} keeps watch while you secure it.',
        '{targetCap} is yours to carry now. {npc} waits for you to be ready.',
    ), (
        '',
        '{hint}',
    )),
    Beat('carried', ('intent:take', 'target', 'carried'), (), 8, (
        'You already have {target} with you.',
        '{targetCap} is still among the things you took with you.',
    ), (
        '',
        '“{lead}”',
    )),
    Beat('escalate', ('urgent',), ('handoff',), 11, (
        '{warning} This time, the change doesn’t go away on its own.',
        '{npc} breaks off in mid-sentence. {warning}',
    ), (
        '“{stakes}”',
        '“{lead}”',
    )),
    Beat('next-signal', ('handoff', 'tech'), (), 10, (
        '{continuation} {npc} traces it back to {newProblem}.',
        '{npc} listens for a second time. {continuation}',
    ), (
        '“{newLead}”',
        '',
    )),
    Beat('next-witness', ('handoff',), (), 8, (
        '{continuation} {newLead}',
        '{npc} had started to relax. Then {continuationLower} {newLead}',
    ), (
        '',
        '“{newStakes}”',
    )),
    Beat('next-cost', ('handoff',), (), 8, (
        'The first problem stays solved. Then {continuationLower}',
        '{continuation} {npc} takes a step back to think.',
    ), (
        '“{newLead}”',
        '“{newStakes}”',
    )),
    Beat('wait', ('intent:wait',), (), 3, (
        'You let a moment pass. {status}',
        '{npc} keeps watch while you wait. {status}',
    ), (
        '',
        '“{lead}”',
    )),
    Beat('respond', (), ('arena', 'no-conflict'), 0, (
        '{npc} takes a moment before replying. “{lead}”',
        '{npc} turns back to the problem. {status}',
        '{npc} makes room for you to finish. “{lead}”',
    ), (
        '',
        '“{stakes}”',
    )),
]


def arena_beat(name, intent, *, extra=(), excludes=(), score=10):
    return Beat('arena-' + name, ('arena', 'intent:' + intent, *extra), excludes, score,
                ('{arenaLine}',), ('{arenaHint}',))


# These events change encounter state. Their prose draws on the exact action,
# combatants, and prior outcomes supplied by the story state.
BEATS += [
    arena_beat('opening', 'begin', score=18),
    arena_beat('clarify', 'arena-clarify'),
    arena_beat('ready', 'arena-ready'),
    arena_beat('enter', 'arena-enter'),
    arena_beat('light', 'arena-identify', excludes=('arena-rival-known',)),
    arena_beat('heavy', 'arena-identify', excludes=('arena-rival-known',)),
    arena_beat('rival', 'arena-identify', extra=('arena-rival-known',)),
    arena_beat('counter', 'arena-attack', excludes=('arena-exposed',)),
    arena_beat('hit', 'arena-attack', extra=('arena-exposed',), excludes=('arena-finisher',)),
    arena_beat('bite', 'arena-bite', excludes=('arena-repeat', 'arena-finisher')),
    arena_beat('repeat-bite', 'arena-bite', extra=('arena-repeat',)),
    arena_beat('boost', 'arena-boost', extra=('arena-careful',)),
    arena_beat('feedback', 'arena-boost', excludes=('arena-careful',)),
    arena_beat('axe', 'arena-combine', excludes=('arena-finisher',)),
    arena_beat('reverse', 'arena-reverse', extra=('arena-feedback',)),
    arena_beat('reverse-unknown', 'arena-reverse', excludes=('arena-feedback',)),
    arena_beat('read', 'arena-read'),
    arena_beat('tactic', 'arena-tactic'),
    arena_beat('talk', 'arena-talk'),
    arena_beat('yield', 'arena-yield', score=18),
    arena_beat('ended', 'arena-ended', score=18),
    Beat('arena-win', ('arena', 'arena-finisher'), (), 17, ('{arenaLine}',), ('{arenaHint}',)),
    Beat('open-grounded', ('intent:begin', 'no-conflict'), (), 17, ('{premise}\n\n{grounded}',),
         ('What do you do?', '')),
    Beat('respond-grounded', ('no-conflict',), (), 2, ('{grounded}',), ('',)),
    Beat('clarify-action', ('unrecognized',), (), 9, ('{clarification}',), ('',)),
]

for action in ('advice', 'focus', 'source', 'inspect', 'obtain', 'use'):
    name = 'pursuit-' + action
    BEATS.append(Beat(name, ('pursuit', 'intent:' + name), (), 15, ('{pursuitLine}',), ('{pursuitHint}',)))


def check_beat(event, requires, excludes=(), score=15):
    return Beat('check-' + event, tuple('check:' + flag for flag in requires),
                tuple('check:' + flag for flag in excludes), score, ('{checkBody}',), ('',))


BEATS += [
    check_beat('yes', ('boolean', 'yes')),
    check_beat('no', ('boolean', 'no')),
    check_beat('unknown', ('boolean',), ('known', 'open')),
    check_beat('yes', ('boolean', 'open'), ('known',)),
    check_beat('no', ('boolean', 'open'), ('known',)),
    check_beat('number-known', ('number', 'known')),
    check_beat('name-known', ('name', 'known')),
    check_beat('information', ('information',)),
    check_beat('action-success', ('action',), ('blocked', 'risk', 'retry')),
    check_beat('action-success', ('action', 'risk', 'ready'), ('blocked', 'retry'), 15.75),
    check_beat('action-partial', ('action', 'risk'), ('blocked', 'retry')),
    check_beat('action-failure', ('action', 'risk'), ('ready',), 14),
    check_beat('action-failure', ('action', 'blocked'), score=18),
    check_beat('action-failure', ('action', 'retry'), score=17),
]

for index in range(6):
    BEATS.append(check_beat('number-' + str(index), ('number',), ('known',)))
    BEATS.append(check_beat('name-' + str(index), ('name',), ('known',)))
