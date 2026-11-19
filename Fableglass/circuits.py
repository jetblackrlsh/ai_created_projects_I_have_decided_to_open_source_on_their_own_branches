"""Arithmetic for compiling residual-stream coordinates and Transformer blocks."""

import numpy as np


WIDTH = 1280
HIDDEN = 4128
LAYERS = 25
HEADS = 20
KV_HEADS = 5
HEAD_SIZE = WIDTH // HEADS
CONTEXT = 256
ANCHORS = 128


class Positions:
    """Allocate independent directions in the residual stream."""

    def __init__(self):
        # Coordinate zero is a unit bias. Coordinates 1–128 stabilize RMSNorm.
        self.next = 160

    def bank(self, labels):
        labels = list(labels)
        start = self.next
        self.next += len(labels)
        if self.next > WIDTH:
            raise ValueError('Residual space exhausted')
        return {label: start + index for index, label in enumerate(labels)}


class Block:
    """Encode a saturated threshold as two SwiGLU units with opposite output weights."""

    def __init__(self):
        self.rules = []

    def threshold(self, output, weights, low, high, sharpness):
        self.rules.append((output, weights, low, high, sharpness))

    def conjunction(self, output, positive, negative=()):
        # True when all positive bits are set and every negative bit is clear.
        count = len(positive)
        weights = {column: 1 for column in positive}
        weights.update({column: -1 for column in negative})
        self.threshold(output, weights, count - 0.74, count - 0.27, 64)

    def write(self, add, number, norm, value_mapping=None):
        prefix = f'blk.{number}.'
        add(prefix + 'attn_norm.weight', norm)
        add(prefix + 'ffn_norm.weight', norm)
        add(prefix + 'attn_q.weight', np.zeros((WIDTH, WIDTH), np.float16))
        add(prefix + 'attn_k.weight', np.zeros((KV_HEADS * HEAD_SIZE, WIDTH), np.float16))
        v = np.zeros((KV_HEADS * HEAD_SIZE, WIDTH), np.float16)
        out = np.zeros((WIDTH, WIDTH), np.float16)
        for index, (source, destination) in enumerate(value_mapping or []):
            group, offset = divmod(index, HEAD_SIZE)
            # Llama replicates each KV head across four Q heads. Read just one.
            v[index, source] = 1
            out[destination, group * (HEADS // KV_HEADS) * HEAD_SIZE + offset] = 1
        add(prefix + 'attn_v.weight', v)
        add(prefix + 'attn_output.weight', out)

        gate = np.zeros((HIDDEN, WIDTH), np.float16)
        up = np.zeros((HIDDEN, WIDTH), np.float16)
        down = np.zeros((WIDTH, HIDDEN), np.float16)
        for index, (output, weights, low, high, sharpness) in enumerate(self.rules):
            pair = index * 2
            for offset, boundary in enumerate((low, high)):
                row = pair + offset
                gate[row, 0] = -boundary * sharpness
                for column, weight in weights.items():
                    gate[row, column] = weight * sharpness
                up[row, 0] = 1
                down[output, row] = (1 if offset == 0 else -1) / (sharpness * (high - low))
        add(prefix + 'ffn_gate.weight', gate)
        add(prefix + 'ffn_up.weight', up)
        add(prefix + 'ffn_down.weight', down)
