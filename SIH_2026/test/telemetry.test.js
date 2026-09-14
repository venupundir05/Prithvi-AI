const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeTelemetry, determineHazard } = require('../server.js');

test('normalizes the ESP32 payload into dashboard-safe sensor values', () => {
  const payload = {
    temperature: 28.3,
    humidity: 62.5,
    mq2Raw: 1200,
    mq135Raw: 900,
    rainRaw: 2500,
    soilRaw: 1700,
    waterLevel: 6.8,
    floodStatus: 'WARNING',
    pollutionStatus: 'HIGH'
  };

  const normalized = normalizeTelemetry(payload);

  assert.equal(normalized.mq2, 1200);
  assert.equal(normalized.mq135, 900);
  assert.ok(normalized.rain >= 0 && normalized.rain <= 100);
  assert.ok(normalized.soil >= 0 && normalized.soil <= 100);
  assert.ok(normalized.water >= 0 && normalized.water <= 100);
  assert.equal(normalized.source, 'esp32');
});

test('computes hazard level from raw ESP32 signals', () => {
  const score = determineHazard({ mq2: 1100, mq135: 850, rain: 74, soil: 69, water: 76 });
  assert.ok(['low', 'warning', 'critical'].includes(score.level));
  assert.ok(score.score >= 0);
});
