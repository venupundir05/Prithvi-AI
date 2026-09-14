from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split


MODEL_DIR = Path(__file__).resolve().parent
DATASET = MODEL_DIR.parent / "synthetic_flood_10000.csv"
OUTPUT = MODEL_DIR / "flood_random_forest.pkl"

FEATURES = [
    "temperature_C",
    "humidity_percent",
    "rain_intensity_percent",
    "soil_moisture_percent",
    "water_level_cm",
]
TARGET = "Flood_Risk"


def flood_category(risk):
    if risk < 25:
        return "Low"
    if risk < 50:
        return "Moderate"
    if risk < 75:
        return "High"
    return "Critical"


df = pd.read_csv(DATASET)
required_columns = FEATURES + [TARGET]
missing_columns = [column for column in required_columns if column not in df.columns]
if missing_columns:
    raise ValueError(f"Missing required flood columns: {missing_columns}")

X = df[FEATURES]
y = df[TARGET]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42
)

model = RandomForestRegressor(
    n_estimators=100,
    max_depth=10,
    min_samples_leaf=3,
    random_state=42,
    n_jobs=-1,
)
model.fit(X_train, y_train)

pred = model.predict(X_test)
mae = mean_absolute_error(y_test, pred)
rmse = mean_squared_error(y_test, pred) ** 0.5
r2 = r2_score(y_test, pred)

print("=== FLOOD MODEL RESULTS ===")
print(f"MAE  : {mae:.2f} risk points")
print(f"RMSE : {rmse:.2f} risk points")
print(f"R²   : {r2:.3f}")
print("\n=== FEATURE IMPORTANCE ===")
for feature, importance in sorted(
    zip(FEATURES, model.feature_importances_),
    key=lambda item: item[1],
    reverse=True,
):
    print(f"{feature}: {importance:.3f}")

joblib.dump(
    {
        "model": model,
        "features": FEATURES,
        "target": TARGET,
        "categories": {
            "low": "0-24.9",
            "moderate": "25-49.9",
            "high": "50-74.9",
            "critical": "75-100",
        },
    },
    OUTPUT,
)

sample = pd.DataFrame(
    [
        {
            "temperature_C": 30,
            "humidity_percent": 75,
            "rain_intensity_percent": 80,
            "soil_moisture_percent": 82,
            "water_level_cm": 38,
        }
    ]
)
sample_risk = float(model.predict(sample[FEATURES])[0])
print(f"\nExample predicted flood risk: {sample_risk:.1f} ({flood_category(sample_risk)})")
print(f"Saved model: {OUTPUT}")