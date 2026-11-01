import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { materialityFrom } from '../src/lib/materiality-rules.ts';

const dbPath = path.join(process.cwd(), 'data', 'esg.db');
const skip = !fs.existsSync(dbPath) && 'data/esg.db not found; run `npm run seed` first';

test('seeded data honours the double materiality rules', { skip }, () => {
  const db = new Database(dbPath, { readonly: true });
  try {
    const mismatches = db.prepare(`
      SELECT code, impact_score, financial_score, materiality FROM iros
      WHERE materiality != CASE
        WHEN impact_score >= 3.2 AND financial_score >= 3.2 THEN 'both'
        WHEN impact_score >= 3.2 THEN 'impact'
        WHEN financial_score >= 3.2 THEN 'financial'
        ELSE 'not' END
    `).all();
    assert.deepEqual(mismatches, [], 'materiality must match the independent thresholds');

    const missingScores = db.prepare(`
      SELECT code FROM iros WHERE impact_score IS NULL OR financial_score IS NULL
    `).all();
    assert.deepEqual(missingScores, [], 'every IRO needs both scores');

    const orphanTopics = db.prepare(`
      SELECT i.code FROM iros i LEFT JOIN topics t ON t.code = i.topic_code WHERE t.code IS NULL
    `).all();
    assert.deepEqual(orphanTopics, [], 'every IRO must reference a known topic');

    // Criticality comes from severity (>= 4.4) or from a human-rights
    // priority judgement, which may be recorded below the score threshold.
    const badCritical = db.prepare(`
      SELECT code FROM iros
      WHERE critical = 1 AND impact_score < 4.4 AND financial_score < 4.4
        AND (rights IS NULL OR TRIM(rights) = '' OR rights = '—')
    `).all();
    assert.deepEqual(badCritical, [], 'critical flags must be backed by severity or a human-rights dimension');

    const rightsCritical = db.prepare(`
      SELECT COUNT(*) n FROM iros
      WHERE critical = 1 AND impact_score < 4.4 AND financial_score < 4.4
        AND rights IS NOT NULL AND TRIM(rights) != '' AND rights != '—'
    `).get().n;
    assert.ok(rightsCritical > 0, 'the demo should show human-rights priority overriding a lower score');

    const companies = db.prepare('SELECT COUNT(*) n FROM companies').get().n;
    assert.equal(companies, 8, 'the demo portfolio must contain eight companies');

    const withoutAssessment = db.prepare(`
      SELECT c.id FROM companies c
      LEFT JOIN assessments a ON a.company_id = c.id
      WHERE a.id IS NULL
    `).all();
    assert.deepEqual(withoutAssessment, [], 'every company needs an assessment');

    const badThresholds = db.prepare(`
      SELECT id FROM assessments WHERE threshold_impact != 3.2 OR threshold_financial != 3.2
    `).all();
    assert.deepEqual(badThresholds, [], 'assessment thresholds must stay at 3.2/3.2');
  } finally {
    db.close();
  }
});

test('topic aggregation keeps the maximum of each axis instead of an average', { skip }, () => {
  const db = new Database(dbPath, { readonly: true });
  try {
    const rows = db.prepare(`
      SELECT company_id, topic_code,
             MAX(impact_score) AS max_impact, MAX(financial_score) AS max_financial,
             AVG(impact_score) AS avg_impact, AVG(financial_score) AS avg_financial
      FROM iros GROUP BY company_id, topic_code
    `).all();
    assert.ok(rows.length > 0);

    let hiddenByAveraging = 0;
    for (const row of rows) {
      assert.ok(row.max_impact >= 0 && row.max_impact <= 5);
      assert.ok(row.max_financial >= 0 && row.max_financial <= 5);
      const byMaximum = materialityFrom(row.max_impact, row.max_financial);
      const byAverage = materialityFrom(row.avg_impact, row.avg_financial);
      if (byMaximum !== byAverage) hiddenByAveraging += 1;
    }

    // This guards the core methodological claim: averaging the axes would
    // downgrade at least one real topic in the demo dataset.
    assert.ok(hiddenByAveraging > 0, 'expected at least one topic where averaging hides materiality');  } finally {
    db.close();
  }
});
