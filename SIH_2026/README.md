# Hazard Route Command

JavaScript prototype for the SIH 2026 environmental hazard pipeline:

`MQ-2 / MQ-135 / rain / soil / water -> ESP32 -> HTTP or MQTT -> Node.js hazard engine -> live map -> rerouting`

## Run

Install Node.js 18+ first, then:

```powershell
npm install
npm start
```

Open http://localhost:3000.

Use **Simulate hazard** to switch between safe and threatening telemetry. The browser refreshes readings every five seconds.

## Connect a real ESP32

1. Install PlatformIO and open this folder in VS Code.
2. In `firmware/src/main.cpp`, replace `YOUR_WIFI_NAME`, `YOUR_WIFI_PASSWORD`, and `192.168.1.100` with your Wi-Fi details and the computer's local IPv4 address. The ESP32 and computer must be on the same network.
3. Connect the sensors using the default pins below, then run **PlatformIO: Upload**.
4. Open **PlatformIO: Monitor** at `115200` baud. The ESP32 should print HTTP status `200` every five seconds.

| Sensor | ESP32 pin | Value sent |
| --- | ---: | --- |
| MQ-2 analog output | GPIO 34 | raw ADC value |
| MQ-135 analog output | GPIO 35 | raw ADC value |
| Rain sensor analog output | GPIO 32 | 0-100% |
| Soil moisture analog output | GPIO 33 | 0-100% |
| Water level analog output | GPIO 36 | 0-100% |

Use a common GND. ESP32 ADC pins accept a maximum of 3.3V: add a voltage divider to any sensor output that can produce 5V, especially MQ sensor modules. Calibrate dry/wet and empty/full values for your specific sensors before relying on hazard thresholds.

The computer's address can be found with `ipconfig`. Start the backend with `npm start`, then watch the dashboard at `http://localhost:3000`. The dashboard will show `ESP32 gateway connected` after the first successful packet.

## AQI model

The AQI training script ignores `rain_mm` completely. It drops that CSV column before training and uses only temperature, humidity, MQ-2, and MQ-135 features.

The flood model is trained separately with:

```powershell
cd D:\SIH_2026\model
.\venv\Scripts\python.exe train_flood_model.py
```

It reads `synthetic_flood_10000.csv` and saves `flood_random_forest.pkl`.

To predict a custom flood scenario without retraining:

```powershell
cd D:\SIH_2026\model
.\venv\Scripts\python.exe predict_flood.py --temperature 30 --humidity 75 --rain 80 --soil 82 --water 38
```

Arguments are temperature in C, humidity percentage, rain intensity proxy percentage, soil moisture percentage, and water level in cm. The rain value is a sensor proxy from 0-100, not rainfall in millimetres.
You can also click Run on `predict_flood.py` without arguments and enter the five values interactively in the terminal.

To predict pollution AQI with custom sensor values without retraining:

```powershell
cd D:\SIH_2026\model
.\venv\Scripts\python.exe predict_aqi.py --temperature 30 --humidity 60 --mq2 700 --mq135 850
```

The pollution model uses only temperature, humidity, raw MQ-2, and raw MQ-135 values. AQI categories are Good (0-50), Satisfactory (51-100), Moderate (101-200), Poor (201-300), Very Poor (301-400), and Severe (above 400).

You can also click Run on `predict_aqi.py` without arguments and enter the four values interactively in the terminal.
The sensor input limits are enforced: temperature must be 0-50 C and percentage values must be 0-100%; invalid values stop with an error.

## ESP32 HTTP payload

POST JSON to `http://localhost:3000/api/readings`:

```json
{
  "mq2": 180,
  "mq135": 270,
  "rain": 18,
  "soil": 38,
  "water": 42
}
```

## MQTT

Set `MQTT_URL` and optionally `MQTT_TOPIC` before starting. The default topic is `hazards/esp32/readings`.
