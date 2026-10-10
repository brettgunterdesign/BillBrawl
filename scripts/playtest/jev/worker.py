"""Persistent JSON-lines bridge to the actual JevHarness PipelineRuntime."""
import json
import os
import sys
from pathlib import Path

from auto_jev.providers import JevClient
from auto_jev.runtime import PipelineRuntime, PipelineExecutionError
from auto_jev.spec import validate_spec

ROOT = Path(__file__).resolve().parents[3]
MOCK = os.environ.get('BILL_BRAWL_JEV_MODE') == 'mock'
TRANSPORT = os.environ.get('BILL_BRAWL_JEV_TRANSPORT', 'typesafe')
LIMIT = int(os.environ.get('BILL_BRAWL_JEV_MAX_CALLS', '40'))
if LIMIT < 1:
    raise ValueError('BILL_BRAWL_JEV_MAX_CALLS must be positive')
if not MOCK and not os.environ.get('TYPESAFE_API_KEY' if TRANSPORT == 'typesafe' else 'AI_GATEWAY_API_KEY'):
    sys.stderr.write('Missing Jev provider key. Configure TYPESAFE_API_KEY or choose vercel with AI_GATEWAY_API_KEY. Use mock mode only for offline wiring tests.\n')
    sys.exit(2)

SPEC = validate_spec(json.loads(Path(__file__).with_name('pipeline.json').read_text()))
CLIENT = JevClient(transport=TRANSPORT, mock=MOCK, timeout=12, cache_dir=ROOT/'artifacts/jev/cache')
RUNTIME = PipelineRuntime(SPEC, CLIENT, max_workers=1)
TRACE = ROOT/'artifacts/jev/decisions.jsonl'
TRACE.parent.mkdir(parents=True, exist_ok=True)
MEMORY = {}
EPISODE = None

for line in sys.stdin:
    message = json.loads(line)
    try:
        if CLIENT.stats['calls'] >= LIMIT:
            raise RuntimeError('Jev request budget reached; no further provider calls were made')
        if message['episode'] != EPISODE:
            MEMORY = {}
            EPISODE = message['episode']
        observation = {'features': message['features']}
        step = RUNTIME.run(observation, memory=MEMORY)
        if step['output']['action'] not in SPEC['nodes'][0]['questions']['action']['criteria']:
            raise ValueError('Illegal Jev output')
        MEMORY = step['memory']
        record = {'id': message['id'], 'episode': EPISODE, 'session': CLIENT.cache_namespace, 'mode': 'mock-wiring-only' if MOCK else 'live-jev', 'observation': observation, 'step': step, 'stats': dict(CLIENT.stats), 'metadata': dict(CLIENT.metadata)}
        with TRACE.open('a') as stream:
            stream.write(json.dumps(record, allow_nan=False)+'\n')
        response = {'id': message['id'], 'output': step['output'], 'mode': record['mode'], 'session': CLIENT.cache_namespace, 'stats': dict(CLIENT.stats)}
    except Exception as error:
        partial = error.partial_result if isinstance(error, PipelineExecutionError) else None
        record = {'id': message['id'], 'episode': message['episode'], 'session': CLIENT.cache_namespace, 'status': 'infrastructure-error', 'error': type(error).__name__, 'partial_result': partial, 'stats': dict(CLIENT.stats)}
        with TRACE.open('a') as stream:
            stream.write(json.dumps(record, allow_nan=False)+'\n')
        response = {'id': message['id'], 'error': {'kind': 'jev-infrastructure', 'message': str(error)}}
    print(json.dumps(response, allow_nan=False), flush=True)
