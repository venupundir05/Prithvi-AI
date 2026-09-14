import argparse
import math
from pathlib import Path

import joblib
import pandas as pd


MODEL_PATH = Path(__file__).resolve().parent / "flood_random_forest.pkl"


def flood_category(risk):
    if risk < 25:
        return "Low"
    if risk < 50:
        return "Moderate"
    if risk < 75:
        return "High"
    return "Critical"


parser = argparse.ArgumentParser(description="Predict flood risk from sensor values.")
parser.add_argument("--temperature", type=float, help="Temperature in C")
parser.add_argument("--humidity", type=float, help="Humidity in percent")
parser.add_argument("--rain", type=float, help="Rain intensity proxy, 0-100 percent")
parser.add_argument("--soil", type=float, help="Soil moisture, 0-100 percent")
parser.add_argument("--water", type=float, help="Water level in cm")
args = parser.parse_args()

values = [args.temperature, args.humidity, args.rain, args.soil, args.water]
if all(value is None for value in values):
    print("Enter flood sensor values:")
    args.temperature = float(input("Temperature (C): "))
    args.humidity = float(input("Humidity (%): "))
    args.rain = float(input("Rain intensity (%): "))
    args.soil = float(input("Soil moisture (%): "))
    args.water = float(input("Water level (cm): "))
elif any(value is None for value in values):
    parser.error("provide all five values: --temperature, --humidity, --rain, --soil, and --water")

if not math.isfinite(args.temperature) or not 0 <= args.temperature <= 50:
    parser.error("temperature must be a number between 0 and 50 C")
for name, value in (
    ("humidity", args.humidity),
    ("rain", args.rain),
    ("soil", args.soil),
):
    if not math.isfinite(value) or not 0 <= value <= 100:
        parser.error(f"{name} must be a number between 0 and 100 percent")

bundle = joblib.load(MODEL_PATH)
model = bundle["model"]
features = bundle["features"]
sample = pd.DataFrame(
    [
        {
            "temperature_C": args.temperature,
            "humidity_percent": args.humidity,
            "rain_intensity_percent": args.rain,
            "soil_moisture_percent": args.soil,
            "water_level_cm": args.water,
        }
    ]
)

risk = max(0.0, min(100.0, float(model.predict(sample[features])[0])))
print(f"Flood risk: {risk:.1f}/100")
print(f"Category: {flood_category(risk)}")