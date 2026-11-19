"""Compile the custom-only Fableglass model with no optimizer or checkpoint input."""

import argparse
import json
from pathlib import Path

import gguf
import numpy as np

from circuits import ANCHORS, Block, CONTEXT, HEADS, HEAD_SIZE, HIDDEN, KV_HEADS, LAYERS, Positions, WIDTH
from narrator import BEATS


def compile_story(model_path, protocol_path):
    signals = sorted({flag for beat in BEATS for flag in (*beat.requires, *beat.excludes)})
    stages = ['select', 'end', *((beat.name, part) for beat in BEATS for part in ('prose', 'dialogue'))]
    pieces = []
    for beat in BEATS:
        pieces.append(('select', (beat.name, 'prose'), f'⟦{beat.name}⟧', beat.name, beat.requires, beat.excludes, beat.score))
        for prose in beat.prose:
            pieces.append(((beat.name, 'prose'), (beat.name, 'dialogue'), prose, None, (), (), 0))
        for dialogue in beat.dialogue:
            pieces.append(((beat.name, 'dialogue'), 'end', '\n\n' + dialogue if dialogue else '', None, (), (), 0))

    axes = Positions()
    phase = axes.bank(stages)
    source, pooled, bit = (axes.bank(signals) for _ in range(3))
    variants = [i for i, piece in enumerate(pieces) if piece[3] is None]
    alternatives = {}
    for i in variants:
        stage, _, text, *_ = pieces[i]
        alternatives.setdefault(stage, set()).add(text)
    # Repetition penalties only help stages that can choose different wording.
    varied = [i for i in variants if len(alternatives[pieces[i][0]]) > 1]
    used_source, used_pooled, used_bit = (axes.bank(varied) for _ in range(3))
    patterns = list(dict.fromkeys((stage, yes, no) for stage, _, _, _, yes, no, _ in pieces))
    eligible = axes.bank(patterns)
    blocks = [Block() for _ in range(LAYERS)]
    for key in signals:
        blocks[1].threshold(bit[key], {pooled[key]: 1}, .0025, .0055, 4096)
    for i in varied:
        blocks[2].threshold(used_bit[i], {used_pooled[i]: 1}, .0025, .0055, 4096)
    for i, (stage, yes, no) in enumerate(patterns):
        blocks[3 + i % (LAYERS - 3)].conjunction(eligible[stage, yes, no], [phase[stage], *(bit[k] for k in yes)], [bit[k] for k in no])
    collect = [(source[key], pooled[key]) for key in signals] + [(used_source[i], used_pooled[i]) for i in varied]
    assert len(collect) <= KV_HEADS * HEAD_SIZE

    vocab = ['<unk>', '<s>', '</s>', *[f'<0x{i:02X}>' for i in range(256)], '<turn>']
    turn = len(vocab) - 1
    signal_id = {signal: len(vocab) + i for i, signal in enumerate(signals)}
    vocab.extend(f'<{signal}>' for signal in signals)
    first_piece = len(vocab)
    seen = set(vocab)
    for _, _, prose, _, _, _, _ in pieces:
        token = prose.replace(' ', '▁') or '\u2063'
        while token in seen:
            token += '\u2063'
        seen.add(token)
        vocab.append(token)
    token_type = gguf.TokenType
    types = [token_type.UNKNOWN, token_type.CONTROL, token_type.CONTROL] + [token_type.BYTE] * 256
    types += [token_type.CONTROL] * (len(signals) + 1) + [token_type.NORMAL] * len(pieces)

    writer = gguf.GGUFWriter(model_path, 'llama', use_temp_file=True)
    writer.add_name('Fableglass 0.5B - Story Engine')
    writer.add_description('Weight-programmed narrative policy and dialogue grammar')
    writer.add_file_type(1)
    writer.add_context_length(CONTEXT)
    writer.add_embedding_length(WIDTH)
    writer.add_block_count(LAYERS)
    writer.add_feed_forward_length(HIDDEN)
    writer.add_head_count(HEADS)
    writer.add_head_count_kv(KV_HEADS)
    writer.add_rope_dimension_count(HEAD_SIZE)
    writer.add_layer_norm_rms_eps(1.0e-6)
    writer.add_tokenizer_model('llama')
    writer.add_token_list(vocab)
    writer.add_token_types(types)
    writer.add_token_scores([0.0] * len(vocab))
    writer.add_bos_token_id(1)
    writer.add_eos_token_id(2)
    writer.add_unk_token_id(0)
    writer.add_add_bos_token(True)

    parameters = nonzero = 0

    def add(name, value):
        nonlocal parameters, nonzero
        parameters += value.size
        nonzero += int(np.count_nonzero(value))
        writer.add_tensor(name, value)

    embedding = np.zeros((len(vocab), WIDTH), np.float16)
    embedding[:, 0] = 1
    embedding[:, 1:ANCHORS + 1] = 8
    embedding[turn, phase['select']] = 1
    for signal, token in signal_id.items():
        embedding[token, source[signal]] = 1
    projection = np.zeros((len(vocab), WIDTH), np.float16)
    projection[:, 0] = -32
    projection[2, phase['end']] = 51
    for i, (stage, next_stage, _, _, yes, no, score) in enumerate(pieces):
        token = first_piece + i
        embedding[token, phase[next_stage]] = 1
        projection[token, eligible[stage, yes, no]] = 32 + score
        if i in used_source:
            embedding[token, used_source[i]] = 1
            projection[token, used_bit[i]] = -2.2
    add('token_embd.weight', embedding)
    norm = np.full(WIDTH, np.sqrt((1 + ANCHORS * 8 ** 2) / WIDTH), dtype=np.float32)
    for number, block in enumerate(blocks):
        block.write(add, number, norm, collect if number == 0 else None)
    add('output_norm.weight', norm)
    add('output.weight', projection)
    writer.write_header_to_file()
    writer.write_kv_data_to_file()
    writer.write_tensors_to_file(progress=True)
    writer.close()

    manifest = {
        'format': 3, 'bos': 1, 'eos': 2, 'turn': turn, 'signals': signal_id,
        'architecture': dict(parameters=parameters, nonzeroFp16Parameters=nonzero, context=CONTEXT,
                             layers=LAYERS, width=WIDTH, hidden=HIDDEN, heads=HEADS, kvHeads=KV_HEADS),
        'events': {first_piece + i: piece[3] for i, piece in enumerate(pieces) if piece[3]},
        'fragments': {first_piece + i: [piece[0][0], piece[0][1], piece[2]] for i, piece in enumerate(pieces) if not piece[3]},
    }
    protocol_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{parameters:,} coefficients, {nonzero:,} nonzero in F16, {len(BEATS)} event tokens, {len(variants)} prose/dialogue variants')


if __name__ == '__main__':
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument('--model', type=Path, required=True)
    cli.add_argument('--protocol', type=Path, required=True)
    args = cli.parse_args()
    compile_story(args.model, args.protocol)
