"""
Fase 11 — Dashboard Streamlit
Jalankan: streamlit run app_dashboard.py
Deploy: Streamlit Cloud (https://share.streamlit.io)
"""
import streamlit as st
import pandas as pd
import numpy as np
import tensorflow as tf
import joblib
import json

st.set_page_config(page_title="Diabetes Prediction Dashboard", layout="wide")
st.title("🩺 Dashboard Prediksi Diabetes")

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

# Load assets
@st.cache_resource
def load_assets():
    model = tf.keras.models.load_model("diabetes_model.keras", custom_objects={'ResidualDenseBlock': ResidualDenseBlock, 'FocalLoss': FocalLoss})
    scaler = joblib.load("scaler.joblib")
    with open("metadata.json") as f:
        meta = json.load(f)
    data = pd.read_csv("diabetes_prediction_dataset.csv")
    return model, scaler, meta, data

model, scaler, meta, data = load_assets()
GENDER_MAP = meta["categorical_mappings"]["gender"]
SMOKING_MAP = meta["categorical_mappings"]["smoking_history"]
FE = meta["feature_engineering"]

tab1, tab2 = st.tabs(["📊 Insight EDA", "🔮 Prediksi"])

# === TAB 1: EDA Insights ===
with tab1:
    st.header("Exploratory Data Analysis")
    col1, col2, col3 = st.columns(3)
    col1.metric("Total Pasien", f"{len(data):,}")
    col2.metric("Pasien Diabetes", f"{data['diabetes'].sum():,}")
    col3.metric("Prevalensi", f"{data['diabetes'].mean()*100:.1f}%")

    st.subheader("Distribusi Target")
    st.bar_chart(data['diabetes'].value_counts())

    st.subheader("Statistik Deskriptif")
    st.dataframe(data.describe())

    st.subheader("Korelasi")
    numeric_data = data.select_dtypes(include=[np.number])
    st.dataframe(numeric_data.corr().round(2))

# === TAB 2: Prediksi ===
with tab2:
    st.header("Prediksi Diabetes")
    col1, col2 = st.columns(2)
    with col1:
        gender = st.selectbox("Gender", list(GENDER_MAP.keys()))
        age = st.slider("Usia", 1, 100, 45)
        hypertension = st.selectbox("Hipertensi", [0, 1])
        heart_disease = st.selectbox("Penyakit Jantung", [0, 1])
    with col2:
        smoking = st.selectbox("Riwayat Merokok", list(SMOKING_MAP.keys()))
        bmi = st.number_input("BMI", 10.0, 60.0, 27.0)
        hba1c = st.number_input("HbA1c Level", 3.0, 15.0, 5.5)
        glucose = st.number_input("Blood Glucose Level", 50, 500, 140)

    if st.button("🔍 Prediksi", type="primary"):
        g = GENDER_MAP[gender]
        s = SMOKING_MAP[smoking]
        age_group = np.digitize(age, FE["age_group"]["bins"][1:-1])
        bmi_cat = np.digitize(bmi, FE["bmi_category"]["bins"][1:-1])
        glc_risk = np.digitize(glucose, FE["glucose_risk"]["bins"][1:-1])
        hba_risk = np.digitize(hba1c, FE["hba1c_risk"]["bins"][1:-1])
        comorbidity = hypertension + heart_disease
        metabolic = (bmi * age) / 100

        features = [[g, age, hypertension, heart_disease, s, bmi, hba1c, glucose,
                      age_group, bmi_cat, glc_risk, hba_risk, comorbidity, metabolic]]
        scaled = scaler.transform(features)
        prob = float(model.predict(scaled.astype("float32")).flatten()[0])

        if prob >= 0.5:
            st.error(f"⚠️ **DIABETES** (Probabilitas: {prob:.2%})")
        else:
            st.success(f"✅ **TIDAK DIABETES** (Probabilitas: {prob:.2%})")
        st.progress(prob)

st.markdown("---")
st.caption("Capstone Project - Klasifikasi Diabetes dengan Deep Learning")
