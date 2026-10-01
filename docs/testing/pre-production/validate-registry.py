#!/usr/bin/env python3
"""Validate canonical accounting and evidence; never infer test PASS from totals."""
import collections
import json
from pathlib import Path
import re

DIRECTORY = Path(__file__).resolve().parent
EXPECTED = 776
EXPECTED_SHA = 'dd835cad364493038b6c28cd0dd0434c5ded2781'
STATUSES = {'PASS', 'FAIL', 'BLOCKED', 'NOT_APPLICABLE'}
REQUIRED = {'id','number','category','scenario','priority','environment','commit','tester','execution_type','date_time','preconditions','steps','expected','actual','result','evidence','api_evidence','db_evidence','aws_evidence','bug_id','agent_qa','human_verification'}
registry = json.loads((DIRECTORY / 'canonical-scenarios.json').read_text())
results = json.loads((DIRECTORY / 'results.json').read_text())
additional = json.loads((DIRECTORY / 'additional-results.json').read_text())
assert len(registry) == EXPECTED
assert sorted(row['number'] for row in registry) == list(range(1, EXPECTED + 1))
registry_ids = {row['id'] for row in registry}
assert len(registry_ids) == EXPECTED
assert all(re.fullmatch(r'[A-Z-]+-\d{3}', row['id']) for row in registry)
result_ids = {row['id'] for row in results}
assert len(result_ids) == len(results), 'Duplicate result ID'
assert result_ids == registry_ids, 'Missing or extra canonical result'
assert len({row['id'] for row in additional}) == len(additional)
assert not registry_ids.intersection(row['id'] for row in additional)
originals = {row['id']: row for row in registry}
for row in results + additional:
    assert REQUIRED.issubset(row), (row['id'], 'Missing required result field')
    assert row['commit'] == EXPECTED_SHA
    assert row['result'] in STATUSES
    assert row['agent_qa'] in {'PASS','FAIL'}
    assert row['human_verification'] in {'PENDING','PASS','FAIL'}
    if row['id'] in originals:
        original = originals[row['id']]
        assert all(row[key] == original[key] for key in ['number','category','scenario'])
    assert row['actual'] and row['evidence'] and row['steps']
    for evidence in row['evidence']:
        assert (DIRECTORY / evidence).is_file(), (row['id'], 'Missing evidence', evidence)
    if row['result'] == 'FAIL':
        assert row['bug_id'] and row['bug_id'] in (DIRECTORY / 'BUG-REPORT.md').read_text()
    if row['result'] == 'PASS':
        assert row['agent_qa'] == 'PASS'
        assert row['execution_type'] != 'not executed / BLOCKED'

mapping = json.loads((DIRECTORY / 'assertion-mapping.json').read_text())
for entry in mapping:
    assert entry['id'] in registry_ids
    assert entry['assertion'] in (DIRECTORY / entry['log']).read_text(), entry['id']
    assert '✓' in entry['assertion']
    assert next(row for row in results if row['id'] == entry['id'])['result'] == 'PASS'

counts = collections.Counter(row['result'] for row in results)
summary = {'expected':EXPECTED,'parsed':len(registry),'accounted':len(results),'missing':len(registry_ids-result_ids),'duplicates':len(results)-len(result_ids),'unclassified':sum(row['result'] not in STATUSES for row in results),'counts':{status:counts[status] for status in sorted(STATUSES)},'additional':dict(collections.Counter(row['result'] for row in additional)),'additional_total':len(additional)}
assert sum(counts.values()) == EXPECTED
(DIRECTORY / 'canonical-validation.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps(summary,indent=2))
