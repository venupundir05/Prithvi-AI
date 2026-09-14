const express = require('express');
const path = require('path');
const mqtt = require('mqtt');

const app = express();
const port = process.env.PORT || 3000;
const mqttUrl = process.env.MQTT_URL;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const latest = {
  updatedAt: new Date().toISOString(),
  source: 'simulation',
  sensors: {
    mq2: 180,
    mq135: 270,
    rain: 18,
    soil: 38,
    water: 42
  },
  hazard: {
    level: 'low',
    score: 0,
    reasons: []
  }
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizePercent(rawValue, direction = 'inverse') {
  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric)) return 0;

  if (direction === 'direct') {
    return clamp((numeric / 4095) * 100, 0, 100);
  }

  return clamp(((4095 - numeric) / 4095) * 100, 0, 100);
}

function normalizeTelemetry(payload = {}) {
  const source = payload.source || 'esp32';

  const mq2 = Number(payload.mq2 ?? payload.mq2Raw ?? 0);
  const mq135 = Number(payload.mq135 ?? payload.mq135Raw ?? 0);

  const rainRaw = Number(payload.rain ?? payload.rainRaw ?? 0);
  const soilRaw = Number(payload.soil ?? payload.soilRaw ?? 0);

  const waterLevelCm = Number(payload.water ?? payload.waterLevel ?? 0);
  const waterPercent = Number.isFinite(waterLevelCm)
    ? clamp((waterLevelCm / 9) * 100, 0, 100)
    : normalizePercent(payload.water ?? payload.waterRaw ?? 0, 'inverse');

  const normalized = {
    mq2: Number.isFinite(mq2) ? mq2 : 0,
    mq135: Number.isFinite(mq135) ? mq135 : 0,
    rain: Number.isFinite(rainRaw) ? normalizePercent(rainRaw, 'inverse') : 0,
    soil: Number.isFinite(soilRaw) ? normalizePercent(soilRaw, 'inverse') : 0,
    water: Number.isFinite(waterPercent) ? waterPercent : 0,
    source
  };

  if (payload.floodStatus) {
    normalized.floodStatus = String(payload.floodStatus).toUpperCase();
  }

  if (payload.pollutionStatus) {
    normalized.pollutionStatus = String(payload.pollutionStatus).toUpperCase();
  }

  return normalized;
}

function determineHazard(sensors) {
  const reasons = [];
  let score = 0;

  if (Number(sensors.mq2) >= 650) {
    score += 35;
    reasons.push('Combustible gas detected');
  } else if (Number(sensors.mq2) >= 350) {
    score += 15;
    reasons.push('Rising combustible gas');
  }

  if (Number(sensors.mq135) >= 700) {
    score += 30;
    reasons.push('Poor air quality detected');
  } else if (Number(sensors.mq135) >= 450) {
    score += 12;
    reasons.push('Air quality is deteriorating');
  }

  if (Number(sensors.rain) >= 75) {
    score += 25;
    reasons.push('Heavy rainfall detected');
  } else if (Number(sensors.rain) >= 45) {
    score += 10;
    reasons.push('Rainfall is increasing');
  }

  if (Number(sensors.soil) >= 78) {
    score += 25;
    reasons.push('Soil moisture indicates flood risk');
  } else if (Number(sensors.soil) >= 55) {
    score += 10;
    reasons.push('Soil is becoming saturated');
  }

  if (Number(sensors.water) >= 80) {
    score += 35;
    reasons.push('Water level is critical');
  } else if (Number(sensors.water) >= 58) {
    score += 15;
    reasons.push('Water level is rising');
  }

  const level = score >= 60 ? 'critical' : score >= 30 ? 'warning' : 'low';
  return { level, score: Math.min(score, 100), reasons };
}

function updateReadings(sensors, source = 'esp32') {
  const normalized = normalizeTelemetry({ ...sensors, source });
  latest.sensors = {
    mq2: Number(normalized.mq2),
    mq135: Number(normalized.mq135),
    rain: Number(normalized.rain),
    soil: Number(normalized.soil),
    water: Number(normalized.water)
  };
  latest.hazard = determineHazard(latest.sensors);
  latest.source = source;
  latest.updatedAt = new Date().toISOString();
  return latest;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'hazard-route-command', updatedAt: latest.updatedAt });
});

app.get('/api/readings', (_req, res) => {
  res.json(latest);
});

app.post('/api/readings', (req, res) => {
  const payload = req.body || {};
  const normalized = normalizeTelemetry(payload);
  const hasNumericSensorData = [normalized.mq2, normalized.mq135, normalized.rain, normalized.soil, normalized.water]
    .every((value) => Number.isFinite(value));

  if (!hasNumericSensorData) {
    return res.status(400).json({ error: 'Expected numeric sensor fields or valid ESP32 raw readings.' });
  }

  res.json(updateReadings(normalized, 'esp32'));
});

app.post('/api/simulate', (_req, res) => {
  const isThreatening = latest.hazard.level === 'low';
  const readings = isThreatening
    ? { mq2: 720, mq135: 760, rain: 82, soil: 84, water: 78 }
    : { mq2: 180, mq135: 270, rain: 18, soil: 38, water: 42 };
  res.json(updateReadings(readings, 'simulation'));
});

if (mqttUrl) {
  const mqttClient = mqtt.connect(mqttUrl);
  mqttClient.on('connect', () => {
    mqttClient.subscribe(process.env.MQTT_TOPIC || 'hazards/esp32/readings');
  });
  mqttClient.on('message', (_topic, message) => {
    try {
      const parsed = JSON.parse(message.toString());
      updateReadings(parsed, 'mqtt');
    } catch {
      console.error('Ignored malformed MQTT sensor message');
    }
  });
}

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Hazard Route Command running at http://localhost:${port}`);
  });
}

module.exports = { app, latest, normalizeTelemetry, determineHazard, updateReadings };
