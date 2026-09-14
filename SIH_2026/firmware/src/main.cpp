#include <Arduino.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <WiFi.h>

const char *wifiSsid = "YOUR_WIFI_NAME";
const char *wifiPassword = "YOUR_WIFI_PASSWORD";
const char *backendUrl = "http://192.168.1.100:3000/api/readings";

// Use ADC1 pins so readings continue to work while Wi-Fi is active.
constexpr int mq2Pin = 34;
constexpr int mq135Pin = 35;
constexpr int rainPin = 32;
constexpr int soilPin = 33;
constexpr int waterPin = 36;
constexpr unsigned long sendIntervalMs = 5000;

unsigned long lastSend = 0;

float percentageFromAdc(int pin) {
  return constrain((analogRead(pin) / 4095.0f) * 100.0f, 0.0f, 100.0f);
}

void connectToWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiSsid, wifiPassword);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print('.');
  }
  Serial.print("\nESP32 IP: ");
  Serial.println(WiFi.localIP());
}

void sendReadings() {
  if (WiFi.status() != WL_CONNECTED) {
    connectToWifi();
  }

  JsonDocument payload;
  payload["mq2"] = analogRead(mq2Pin);
  payload["mq135"] = analogRead(mq135Pin);
  payload["rain"] = percentageFromAdc(rainPin);
  payload["soil"] = percentageFromAdc(soilPin);
  payload["water"] = percentageFromAdc(waterPin);

  String body;
  serializeJson(payload, body);

  HTTPClient http;
  http.begin(backendUrl);
  http.addHeader("Content-Type", "application/json");
  const int statusCode = http.POST(body);
  Serial.printf("POST %d: %s\n", statusCode, body.c_str());
  http.end();
}

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);
  connectToWifi();
}

void loop() {
  if (millis() - lastSend >= sendIntervalMs) {
    lastSend = millis();
    sendReadings();
  }
}