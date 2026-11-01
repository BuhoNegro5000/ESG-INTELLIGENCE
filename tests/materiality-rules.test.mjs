import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CRITICAL_THRESHOLD,
  FINANCIAL_THRESHOLD,
  IMPACT_THRESHOLD,
  materialityFrom,
  scoreIsCritical,
} from '../src/lib/materiality-rules.ts';

test('thresholds are the approved values', () => {
  assert.equal(IMPACT_THRESHOLD, 3.2);
  assert.equal(FINANCIAL_THRESHOLD, 3.2);
  assert.equal(CRITICAL_THRESHOLD, 4.4);
});

test('materiality requires each axis independently', () => {
  assert.equal(materialityFrom(3.2, 3.2), 'both');
  assert.equal(materialityFrom(3.2, 3.19), 'impact');
  assert.equal(materialityFrom(3.19, 3.2), 'financial');
  assert.equal(materialityFrom(3.19, 3.19), 'not');
});

test('a severe impact is never averaged away by a low financial score', () => {
  assert.equal(materialityFrom(5, 0), 'impact');
  assert.equal(materialityFrom(0, 5), 'financial');
  assert.equal(materialityFrom(4.9, 1.1), 'impact');
});

test('the boundary is inclusive on both axes', () => {
  assert.equal(materialityFrom(3.2, 0), 'impact');
  assert.equal(materialityFrom(0, 3.2), 'financial');
  assert.equal(materialityFrom(3.199999, 3.199999), 'not');
});

test('custom thresholds are respected per axis', () => {
  assert.equal(materialityFrom(2.6, 3.9, 2.5, 4), 'impact');
  assert.equal(materialityFrom(2.4, 4.1, 2.5, 4), 'financial');
  assert.equal(materialityFrom(2.6, 4.1, 2.5, 4), 'both');
  assert.equal(materialityFrom(2.4, 3.9, 2.5, 4), 'not');
});

test('classification never blends the two axes', () => {
  for (let impact = 0; impact <= 5; impact += 0.25) {
    for (let financial = 0; financial <= 5; financial += 0.25) {
      const result = materialityFrom(impact, financial);
      const expected = impact >= 3.2
        ? (financial >= 3.2 ? 'both' : 'impact')
        : (financial >= 3.2 ? 'financial' : 'not');
      assert.equal(result, expected, `impact=${impact} financial=${financial}`);
    }
  }
});

test('criticality triggers at 4.4 on either axis only', () => {
  assert.equal(scoreIsCritical(4.4, 0), true);
  assert.equal(scoreIsCritical(0, 4.4), true);
  assert.equal(scoreIsCritical(4.39, 4.39), false);
  assert.equal(scoreIsCritical(5, 0), true);
});
