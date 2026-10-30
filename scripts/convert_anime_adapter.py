#!/usr/bin/env python3
"""Convert ONLY the pinned IDKiro anime adapter as symbolic data, never unpickle it.
Dependencies: NumPy. Unknown hashes, globals, opcodes, layouts or sizes fail closed.
"""
import argparse
import hashlib
import json
import io
from pathlib import Path
import pickletools
import struct
import zipfile
import numpy as np

SOURCE_SHA256 = '1cf076eef26ddf8be790735c50fa0b53c13e5d48cc73403339e244202586b585'
SOURCE_BYTES = 108366210
ALLOWED = {'torch._utils _rebuild_tensor_v2', 'torch FloatStorage', 'collections OrderedDict'}

def require(ok, message):
    if not ok:
        raise ValueError(message)

def digest(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()

def parse_symbols(data):
    """Bounded protocol-2 interpreter. GLOBAL names are inert tuples, never imports."""
    require(len(data) < 1_000_000, 'Pickle metadata too large')
    stack, memo = [], {}
    marker = object()
    stopped = False
    def pop():
        require(bool(stack), 'Stack underflow')
        return stack.pop()
    def marked():
        for i in range(len(stack)-1, -1, -1):
            if stack[i] is marker:
                values = stack[i+1:]
                del stack[i:]
                return values
        raise ValueError('Missing mark')
    for count, (op, arg, pos) in enumerate(pickletools.genops(data)):
        require(count < 50_000 and len(stack) < 10_000 and len(memo) < 10_000, 'Parser resource limit')
        n = op.name
        if n == 'PROTO':
            require(pos == 0 and arg == 2, 'Only protocol 2 accepted')
        elif n == 'EMPTY_DICT': stack.append({})
        elif n == 'MARK': stack.append(marker)
        elif n in ('BINUNICODE', 'BININT', 'BININT1', 'BININT2'):
            require(not isinstance(arg, str) or len(arg) < 2048, 'String too long')
            stack.append(arg)
        elif n == 'NEWFALSE': stack.append(False)
        elif n == 'GLOBAL':
            require(arg in ALLOWED, 'Unknown global: ' + str(arg))
            stack.append(('GLOBAL', arg))
        elif n in ('BINPUT', 'LONG_BINPUT'):
            require(type(arg) is int and 0 <= arg < 10_000 and bool(stack), 'Invalid memo index')
            require(arg not in memo, 'Duplicate memo index')
            memo[arg] = stack[-1]
        elif n == 'BINGET':
            require(arg in memo, 'Missing memo index')
            stack.append(memo[arg])
        elif n == 'TUPLE': stack.append(tuple(marked()))
        elif n == 'TUPLE2':
            b, a = pop(), pop()
            stack.append((a, b))
        elif n == 'EMPTY_TUPLE': stack.append(())
        elif n == 'BINPERSID':
            a = pop()
            require(type(a) is tuple and len(a) == 5, 'Invalid storage descriptor')
            require(a[0] == 'storage' and a[1] == ('GLOBAL', 'torch FloatStorage'), 'Unknown storage kind')
            require(type(a[2]) is str and a[2].isascii() and a[2].isdigit() and len(a[2]) < 8, 'Invalid storage key')
            require(a[3] == 'cuda:0' and type(a[4]) is int and 0 < a[4] < 10_000_000, 'Invalid storage bounds')
            stack.append(('STORAGE', a[2], a[4]))
        elif n == 'REDUCE':
            args, fn = pop(), pop()
            if fn == ('GLOBAL', 'collections OrderedDict'):
                require(args == (), 'Invalid OrderedDict arguments')
                stack.append({})
            else:
                require(fn == ('GLOBAL', 'torch._utils _rebuild_tensor_v2'), 'Unknown symbolic reduction')
                require(type(args) is tuple and len(args) == 6 and args[4] is False and args[5] == {}, 'Invalid tensor arguments')
                storage, offset, shape, stride = args[:4]
                require(type(storage) is tuple and len(storage) == 3 and storage[0] == 'STORAGE' and offset == 0, 'Unsupported storage or offset')
                require(type(shape) is tuple and 1 <= len(shape) <= 4 and all(type(i) is int and 0 < i < 20_000 for i in shape), 'Invalid tensor shape')
                expected, size = [], 1
                for value in reversed(shape):
                    expected.insert(0, size)
                    size *= value
                require(tuple(expected) == stride and size == storage[2] and size < 10_000_000, 'Noncontiguous or oversized tensor')
                stack.append(('TENSOR', storage, shape))
        elif n == 'SETITEMS':
            items = marked()
            require(len(items) % 2 == 0 and bool(stack) and type(stack[-1]) is dict, 'Invalid dictionary')
            for k, v in zip(items[::2], items[1::2]):
                require(type(k) is str and k not in stack[-1], 'Invalid or duplicate tensor name')
                stack[-1][k] = v
        elif n == 'STOP':
            require(pos == len(data)-1, 'Trailing pickle data')
            stopped = True
            break
        else:
            raise ValueError('Unsupported opcode: ' + n)
    require(stopped and len(stack) == 1 and type(stack[0]) is dict, 'Invalid final stack')
    require(len(stack[0]) == 222, 'Expected exactly 222 tensors')
    return stack[0]

def convert(source, output, report):
    source, output, report = map(Path, (source, output, report))
    require(source.stat().st_size == SOURCE_BYTES, 'Source size mismatch')
    with source.open('rb') as f:
        source_data = f.read(SOURCE_BYTES + 1)
    require(len(source_data) == SOURCE_BYTES and hashlib.sha256(source_data).hexdigest() == SOURCE_SHA256, 'Source SHA256 mismatch; no parsing performed')
    require(not output.exists() and not report.exists(), 'Refuse to replace existing output or report')
    require(output.resolve() != report.resolve(), 'Output and report must differ')
    manifest, payload, offset = [], [], 0
    header = {'__metadata__': {'format': 'pt', 'source_sha256': SOURCE_SHA256,
              'baked_scale': '0.125', 'description': 'Symbolic data-only conversion; B matrices multiplied by alpha/r; PEFT prefix mapped to lora.unet'}}
    with zipfile.ZipFile(io.BytesIO(source_data)) as z:
        entries = z.infolist()
        require(len(entries) < 1000 and len({i.filename for i in entries}) == len(entries), 'Invalid ZIP member count or duplicates')
        require(sum(i.file_size for i in entries) < 120_000_000, 'ZIP uncompressed size limit')
        require(all(i.file_size < 40_000_000 and i.compress_type in (zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED) for i in entries), 'ZIP member bounds')
        prefix = 'adapter_model/'
        require(z.read(prefix + 'byteorder') == b'little', 'Expected little-endian storage')
        tensors = parse_symbols(z.read(prefix + 'data.pkl'))
        for name, t in sorted(tensors.items()):
            require(name.startswith('base_model.model.') and name.endswith(('.lora_A.weight', '.lora_B.weight')), 'Unexpected tensor name')
            require(type(t) is tuple and len(t) == 3 and t[0] == 'TENSOR', 'Expected tensor descriptor')
            _, storage, shape = t
            raw = z.read(prefix + 'data/' + storage[1])
            require(len(raw) == storage[2] * 4, 'Storage length mismatch')
            arr = np.frombuffer(raw, dtype='<f4')
            require(np.isfinite(arr).all(), 'Nonfinite values')
            scale = 1
            if '.lora_A.' in name:
                require(shape[0] == 64, 'Expected LoRA rank 64')
            else:
                require(len(shape) >= 2 and shape[1] == 64, 'Expected LoRA rank 64')
                scale = .125
                arr = arr * scale
            data = arr.astype('<f4', copy=False).tobytes()
            key = 'lora.unet.' + name.removeprefix('base_model.model.')
            require(key not in header, 'Duplicate output key')
            header[key] = {'dtype': 'F32', 'shape': list(shape), 'data_offsets': [offset, offset + len(data)]}
            offset += len(data)
            payload.append(data)
            manifest.append({'source': name, 'target': key, 'shape': shape, 'source_data_sha256': hashlib.sha256(raw).hexdigest(), 'target_data_sha256': hashlib.sha256(data).hexdigest(), 'scale_applied': scale})
    encoded = json.dumps(header, separators=(',', ':')).encode()
    encoded += b' ' * ((-len(encoded)) % 8)
    with output.open('xb') as f:
        f.write(struct.pack('<Q', len(encoded)))
        f.write(encoded)
        for data in payload: f.write(data)
    result = {'source_sha256': SOURCE_SHA256, 'output_sha256': digest(output), 'output_bytes': output.stat().st_size, 'tensors': manifest}
    with report.open('x') as f: json.dump(result, f, indent=2)
    return result

if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('source', help='Exact official adapter_model.bin')
    p.add_argument('output', help='New anime.safetensors path')
    p.add_argument('report', help='New JSON provenance path')
    args = p.parse_args()
    result = convert(args.source, args.output, args.report)
    print(json.dumps({k: v for k, v in result.items() if k != 'tensors'}))
