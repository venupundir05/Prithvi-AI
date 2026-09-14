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
  latest.sensors = {
    mq2: Number(sensors.mq2),
    mq135: Number(sensors.mq135),
    rain: Number(sensors.rain),
    soil: Number(sensors.soil),
    water: Number(sensors.water)
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
  const required = ['mq2', 'mq135', 'rain', 'soil', 'water'];
  if (required.some((key) => !Number.isFinite(Number(req.body[key])))) {
    return res.status(400).json({ error: 'Expected numeric mq2, mq135, rain, soil, and water fields.' });
  }
  res.json(updateReadings(req.body, 'esp32'));
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
      updateReadings(JSON.parse(message.toString()), 'mqtt');
    } catch {
      console.error('Ignored malformed MQTT sensor message');
    }
  });
}

app.listen(port, () => {
  console.log(`Hazard Route Command running at http://localhost:${port}`);
});
