#include <DHT.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* BACKEND_URL = "http://192.168.1.100:3000/api/readings";

const unsigned long SEND_INTERVAL_MS = 5000;
unsigned long lastSendMs = 0;

// =====================================================
// PIN DEFINITIONS
// =====================================================

#define DHT_PIN 14
#define DHT_TYPE DHT11

#define MQ2_PIN 32
#define MQ135_PIN 33

#define RAIN_PIN 35
#define SOIL_PIN 34

#define TRIG_PIN 25
#define ECHO_PIN 26

#define BUZZER_PIN 4
#define LED_PIN 23


// =====================================================
// DHT SENSOR
// =====================================================

DHT dht(DHT_PIN, DHT_TYPE);


// =====================================================
// MODEL DIMENSIONS
// =====================================================

// Your physical water model is 9cm high
const float MODEL_HEIGHT_CM = 9.0;


// =====================================================
// SENSOR THRESHOLDS
// =====================================================

// IMPORTANT:
// Your current dry readings:
// Rain = 4095
// Soil = 4095
//
// Therefore, wet detection uses:
// sensor value < threshold
//
// 3000 is TEMPORARY.
// We will calibrate these after testing wet conditions.

const int RAIN_THRESHOLD = 3000;
const int SOIL_THRESHOLD = 3000;


// Ultrasonic water-level thresholds
// Temporary prototype values.

const float WATER_WARNING_CM = 5.0;
const float WATER_CRITICAL_CM = 8.0;


// Pollution thresholds
// These are temporary raw-value thresholds.

const int MQ2_THRESHOLD = 700;
const int MQ135_THRESHOLD = 1200;


// =====================================================
// ULTRASONIC WATER LEVEL
// =====================================================

float getWaterDistance() {

  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);

  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000);

  // No echo received
  if (duration == 0) {
    return -1;
  }

  float distance = duration * 0.0343 / 2.0;

  return distance;
}

void connectToWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("WiFi connected. IP: ");
  Serial.println(WiFi.localIP());
}

void sendTelemetry(float temperature,
                   float humidity,
                   int mq2Raw,
                   int mq135Raw,
                   int rainRaw,
                   int soilRaw,
                   float waterDistance,
                   float waterLevel,
                   const String& floodStatus,
                   const String& pollutionStatus,
                   bool alert) {
  if (WiFi.status() != WL_CONNECTED) {
    connectToWifi();
  }

  StaticJsonDocument<512> payload;
  payload["temperature"] = isnan(temperature) ? nullptr : temperature;
  payload["humidity"] = isnan(humidity) ? nullptr : humidity;
  payload["mq2Raw"] = mq2Raw;
  payload["mq135Raw"] = mq135Raw;
  payload["rainRaw"] = rainRaw;
  payload["soilRaw"] = soilRaw;
  payload["waterDistance"] = waterDistance >= 0 ? waterDistance : nullptr;
  payload["waterLevel"] = waterLevel;
  payload["floodStatus"] = floodStatus;
  payload["pollutionStatus"] = pollutionStatus;
  payload["alert"] = alert;

  String body;
  serializeJson(payload, body);

  HTTPClient http;
  http.begin(BACKEND_URL);
  http.addHeader("Content-Type", "application/json");

  int statusCode = http.POST(body);
  Serial.print("HTTP POST status: ");
  Serial.println(statusCode);
  Serial.print("Payload: ");
  Serial.println(body);

  http.end();
}

// =====================================================
// SETUP
// =====================================================

void setup() {

  Serial.begin(115200);

  dht.begin();

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);

  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, LOW);

  connectToWifi();

  Serial.println();
  Serial.println("==========================================");
  Serial.println(" AI ENVIRONMENTAL MONITORING SYSTEM");
  Serial.println(" ESP32 SENSOR SYSTEM");
  Serial.println("==========================================");
  Serial.println();

  delay(2000);
}


// =====================================================
// MAIN LOOP
// =====================================================

void loop() {

  // ===================================================
  // READ DHT11
  // ===================================================

  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();


  // ===================================================
  // READ ANALOG SENSORS
  // ===================================================

  int mq2Raw = analogRead(MQ2_PIN);
  int mq135Raw = analogRead(MQ135_PIN);

  int rainRaw = analogRead(RAIN_PIN);
  int soilRaw = analogRead(SOIL_PIN);


  // ===================================================
  // READ ULTRASONIC
  // ===================================================

  float waterDistance = getWaterDistance();

  float waterLevel = 0.0;

  if (waterDistance >= 0) {

    waterLevel = MODEL_HEIGHT_CM - waterDistance;

    // If sensor is above the model,
    // distance can be greater than 10 cm.
    // That simply means water level = 0.

    if (waterLevel < 0) {
      waterLevel = 0;
    }

    if (waterLevel > MODEL_HEIGHT_CM) {
      waterLevel = MODEL_HEIGHT_CM;
    }
  }


  // ===================================================
  // FLOOD DETECTION
  // ===================================================

  int floodScore = 0;

  bool rainDetected = false;
  bool wetSoil = false;
  bool waterWarning = false;
  bool waterCritical = false;


  // -----------------------------------------------
  // RAIN
  // -----------------------------------------------

  // Your sensor:
  // 4095 = dry
  // Lower value = wetter

  if (rainRaw < RAIN_THRESHOLD) {

    rainDetected = true;

    floodScore += 2;
  }


  // -----------------------------------------------
  // SOIL
  // -----------------------------------------------

  // Your sensor:
  // 4095 = dry
  // Lower value = wetter

  if (soilRaw < SOIL_THRESHOLD) {

    wetSoil = true;

    floodScore += 2;
  }


  // -----------------------------------------------
  // WATER LEVEL
  // -----------------------------------------------

  if (waterLevel >= WATER_CRITICAL_CM) {

    waterCritical = true;

    floodScore += 5;

  }

  else if (waterLevel >= WATER_WARNING_CM) {

    waterWarning = true;

    floodScore += 3;
  }


  // ===================================================
  // FLOOD STATUS
  // ===================================================

  String floodStatus;

  if (waterCritical || floodScore >= 7) {

    floodStatus = "CRITICAL";

  }

  else if (waterWarning || floodScore >= 4) {

    floodStatus = "WARNING";

  }

  else if (floodScore >= 2) {

    floodStatus = "WATCH";

  }

  else {

    floodStatus = "NORMAL";
  }


  // ===================================================
  // POLLUTION DETECTION
  // ===================================================

  int pollutionScore = 0;

  bool highMQ2 = false;
  bool highMQ135 = false;


  if (mq2Raw > MQ2_THRESHOLD) {

    highMQ2 = true;

    pollutionScore += 2;
  }


  if (mq135Raw > MQ135_THRESHOLD) {

    highMQ135 = true;

    pollutionScore += 3;
  }


  String pollutionStatus;

  if (pollutionScore >= 4) {

    pollutionStatus = "HIGH";

  }

  else if (pollutionScore >= 3) {

    pollutionStatus = "WARNING";

  }

  else {

    pollutionStatus = "NORMAL";
  }


  // ===================================================
  // ALERT SYSTEM
  // ===================================================

  bool floodAlert =
      (floodStatus == "WARNING" ||
       floodStatus == "CRITICAL");

  bool pollutionAlert =
      (pollutionStatus == "WARNING" ||
       pollutionStatus == "HIGH");


  bool alert = floodAlert || pollutionAlert;


  if (alert) {

    digitalWrite(LED_PIN, HIGH);

    digitalWrite(BUZZER_PIN, HIGH);

  }

  else {

    digitalWrite(LED_PIN, LOW);

    digitalWrite(BUZZER_PIN, LOW);
  }


  // ===================================================
  // SERIAL OUTPUT
  // ===================================================

  Serial.println();
  Serial.println("==========================================");

  // -----------------------------------------------
  // ENVIRONMENT
  // -----------------------------------------------

  Serial.println("ENVIRONMENT");

  if (isnan(temperature)) {

    Serial.println("Temperature : ERROR");

  } else {

    Serial.print("Temperature : ");
    Serial.print(temperature);
    Serial.println(" °C");
  }


  if (isnan(humidity)) {

    Serial.println("Humidity    : ERROR");

  } else {

    Serial.print("Humidity    : ");
    Serial.print(humidity);
    Serial.println(" %");
  }


  // -----------------------------------------------
  // POLLUTION SENSORS
  // -----------------------------------------------

  Serial.println();
  Serial.println("POLLUTION SENSORS");

  Serial.print("MQ-2 Raw    : ");
  Serial.println(mq2Raw);

  Serial.print("MQ-135 Raw  : ");
  Serial.println(mq135Raw);


  // -----------------------------------------------
  // FLOOD SENSORS
  // -----------------------------------------------

  Serial.println();
  Serial.println("FLOOD SENSORS");

  Serial.print("Rain Raw    : ");
  Serial.println(rainRaw);

  Serial.print("Soil Raw    : ");
  Serial.println(soilRaw);


  if (waterDistance < 0) {

    Serial.println("Water Distance : ERROR");
    Serial.println("Water Level    : ERROR");

  }

  else {

    Serial.print("Water Distance : ");
    Serial.print(waterDistance);
    Serial.println(" cm");

    Serial.print("Water Level    : ");
    Serial.print(waterLevel);
    Serial.println(" cm");
  }


  // -----------------------------------------------
  // FLOOD ANALYSIS
  // -----------------------------------------------

  Serial.println();
  Serial.println("FLOOD ANALYSIS");

  Serial.print("Rain Detected : ");
  Serial.println(rainDetected ? "YES" : "NO");

  Serial.print("Wet Soil      : ");
  Serial.println(wetSoil ? "YES" : "NO");

  Serial.print("Water Warning : ");
  Serial.println(waterWarning ? "YES" : "NO");

  Serial.print("Water Critical: ");
  Serial.println(waterCritical ? "YES" : "NO");

  Serial.print("Flood Score   : ");
  Serial.println(floodScore);

  Serial.print("Flood Status  : ");
  Serial.println(floodStatus);


  // -----------------------------------------------
  // POLLUTION ANALYSIS
  // -----------------------------------------------

  Serial.println();
  Serial.println("POLLUTION ANALYSIS");

  Serial.print("High MQ-2     : ");
  Serial.println(highMQ2 ? "YES" : "NO");

  Serial.print("High MQ-135   : ");
  Serial.println(highMQ135 ? "YES" : "NO");

  Serial.print("Pollution Score: ");
  Serial.println(pollutionScore);

  Serial.print("Pollution Status: ");
  Serial.println(pollutionStatus);


  // -----------------------------------------------
  // FINAL ALERT
  // -----------------------------------------------

  Serial.println();
  Serial.println("SYSTEM STATUS");

  if (alert) {

    Serial.println("🚨 ALERT ACTIVE");

  }

  else {

    Serial.println("✅ SYSTEM NORMAL");
  }


  Serial.println("==========================================");

  if (millis() - lastSendMs >= SEND_INTERVAL_MS) {
    lastSendMs = millis();
    sendTelemetry(temperature,
                  humidity,
                  mq2Raw,
                  mq135Raw,
                  rainRaw,
                  soilRaw,
                  waterDistance,
                  waterLevel,
                  floodStatus,
                  pollutionStatus,
                  alert);
  }

  delay(2000);
}