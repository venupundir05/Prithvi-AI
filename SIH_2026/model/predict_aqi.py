import argparse
import math
from pathlib import Path

import joblib
import pandas as pd


MODEL_PATH = Path(__file__).resolve().parent / "aqi_random_forest.pkl"


def aqi_category(aqi):
    if aqi <= 50:
        return "Good"
    if aqi <= 100:
        return "Satisfactory"
    if aqi <= 200:
        return "Moderate"
    if aqi <= 300:
        return "Poor"
    if aqi <= 400:
        return "Very Poor"
    return "Severe"


parser = argparse.ArgumentParser(description="Predict AQI from pollution sensor values.")
parser.add_argument("--temperature", type=float, help="Temperature in C")
parser.add_argument("--humidity", type=float, help="Humidity in percent")
parser.add_argument("--mq2", type=float, help="Raw MQ-2 sensor value")
parser.add_argument("--mq135", type=float, help="Raw MQ-135 sensor value")
args = parser.parse_args()

values = [args.temperature, args.humidity, args.mq2, args.mq135]
if all(value is None for value in values):
    print("Enter pollution sensor values:")
    args.temperature = float(input("Temperature (C): "))
    args.humidity = float(input("Humidity (%): "))
    args.mq2 = float(input("MQ-2 raw value: "))
    args.mq135 = float(input("MQ-135 raw value: "))
elif any(value is None for value in values):
    parser.error("provide all four values: --temperature, --humidity, --mq2, and --mq135")

if not math.isfinite(args.humidity) or not 0 <= args.humidity <= 100:
    parser.error("humidity must be a number between 0 and 100 percent")
if not math.isfinite(args.temperature) or not 0 <= args.temperature <= 50:
    parser.error("temperature must be a number between 0 and 50 C")

bundle = joblib.load(MODEL_PATH)
model = bundle["model"]
features = bundle["features"]
sample = pd.DataFrame(
    [
        {
            "temperature_C": args.temperature,
            "humidity_percent": args.humidity,
            "MQ2_raw": args.mq2,
            "MQ135_raw": args.mq135,
        }
    ]
)

aqi = max(0.0, float(model.predict(sample[features])[0]))
print(f"AQI: {aqi:.1f}")
print(f"Category: {aqi_category(aqi)}")