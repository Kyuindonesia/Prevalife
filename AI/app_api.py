"""
Fase 10 — REST API dengan FastAPI
Jalankan: uvicorn app_api:app --reload
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import tensorflow as tf
import numpy as np
import joblib
import json
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Diabetes Prediction API", version="1.0")

# Daftarkan domain website Anda yang diizinkan mengakses API ini
origins = [
    "http://localhost",
    "http://localhost:3000", # Port aplikasi React/Vue
    "https://website-anda.com", # Domain produksi Anda
    "*", # Gunakan "*" untuk mengizinkan semua domain (tidak disarankan untuk produksi komersial)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@tf.keras.utils.register_keras_serializable()
class ResidualDenseBlock(tf.keras.layers.Layer):
    def __init__(self, units, dropout_rate=0.3, **kwargs):
        super().__init__(**kwargs)
        self.units = units
        self.dropout_rate = dropout_rate

    def build(self, input_shape):
        self.dense1 = tf.keras.layers.Dense(self.units, activation='relu')
        self.bn1 = tf.keras.layers.BatchNormalization()
        self.drop1 = tf.keras.layers.Dropout(self.dropout_rate)
        self.dense2 = tf.keras.layers.Dense(self.units, activation='relu')
        self.bn2 = tf.keras.layers.BatchNormalization()
        if input_shape[-1] != self.units:
            self.proj = tf.keras.layers.Dense(self.units, use_bias=False)
        else:
            self.proj = None

    def call(self, inputs, training=False):
        x = self.dense1(inputs)
        x = self.bn1(x, training=training)
        x = self.drop1(x, training=training)
        x = self.dense2(x)
        x = self.bn2(x, training=training)
        shortcut = self.proj(inputs) if self.proj else inputs
        return tf.keras.activations.relu(x + shortcut)

    def get_config(self):
        cfg = super().get_config()
        cfg.update({"units": self.units, "dropout_rate": self.dropout_rate})
        return cfg

@tf.keras.utils.register_keras_serializable()
class FocalLoss(tf.keras.losses.Loss):
    def __init__(self, gamma=2.0, alpha=0.75, **kwargs):
        super().__init__(**kwargs)
        self.gamma = gamma
        self.alpha = alpha

    def call(self, y_true, y_pred):
        y_true = tf.cast(y_true, tf.float32)
        y_pred = tf.clip_by_value(y_pred, 1e-7, 1-1e-7)
        bce = -y_true * tf.math.log(y_pred) - (1-y_true) * tf.math.log(1-y_pred)
        p_t = y_true * y_pred + (1-y_true) * (1-y_pred)
        alpha_t = y_true * self.alpha + (1-y_true) * (1-self.alpha)
        return tf.reduce_mean(alpha_t * tf.pow(1-p_t, self.gamma) * bce)

# Load model, scaler, metadata
model = tf.keras.models.load_model("diabetes_model.keras", custom_objects={'ResidualDenseBlock': ResidualDenseBlock, 'FocalLoss': FocalLoss})
scaler = joblib.load("scaler.joblib")
with open("metadata.json") as f:
    meta = json.load(f)

GENDER_MAP = meta["categorical_mappings"]["gender"]
SMOKING_MAP = meta["categorical_mappings"]["smoking_history"]
FE = meta["feature_engineering"]


class PatientInput(BaseModel):
    gender: str  # "Female", "Male", "Other"
    age: float
    hypertension: int  # 0 or 1
    heart_disease: int  # 0 or 1
    smoking_history: str  # "never","No Info","current","former","ever","not current"
    bmi: float
    HbA1c_level: float
    blood_glucose_level: float


def engineer_features(d: dict) -> list:
    """Apply same feature engineering as training."""
    bins_age = FE["age_group"]["bins"]
    bins_bmi = FE["bmi_category"]["bins"]
    bins_glc = FE["glucose_risk"]["bins"]
    bins_hba = FE["hba1c_risk"]["bins"]

    age_group = np.digitize(d["age"], bins_age[1:-1])
    bmi_cat = np.digitize(d["bmi"], bins_bmi[1:-1])
    glc_risk = np.digitize(d["blood_glucose_level"], bins_glc[1:-1])
    hba_risk = np.digitize(d["HbA1c_level"], bins_hba[1:-1])
    comorbidity = d["hypertension"] + d["heart_disease"]
    metabolic = (d["bmi"] * d["age"]) / 100

    return [
        d["gender"], d["age"], d["hypertension"], d["heart_disease"],
        d["smoking_history"], d["bmi"], d["HbA1c_level"], d["blood_glucose_level"],
        age_group, bmi_cat, glc_risk, hba_risk, comorbidity, metabolic
    ]


@app.post("/predict")
def predict(patient: PatientInput):
    try:
        d = patient.dict()
        d["gender"] = GENDER_MAP.get(d["gender"], 0)
        d["smoking_history"] = SMOKING_MAP.get(d["smoking_history"], 1)

        features = engineer_features(d)
        scaled = scaler.transform([features])
        prob = float(model.predict(scaled.astype("float32")).flatten()[0])

        return {
            "prediction": "DIABETES" if prob >= 0.5 else "TIDAK DIABETES",
            "probability": round(prob, 4),
            "risk_level": "Tinggi" if prob > 0.65 else "Sedang" if prob >= 0.5 else "Rendah"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/")
def root():
    return {"message": "Diabetes Prediction API", "endpoint": "POST /predict"}
