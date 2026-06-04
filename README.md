# 🩺 PrevaLife: Sistem Deteksi Dini Risiko Diabetes

[![Tema](https://img.shields.io/badge/Tema-Healthy%20Lives%20%26%20Well--being-emerald)](https://github.com/)
[![Framework](https://img.shields.io/badge/AI-TensorFlow%20%7C%20FastAPI-blue)](https://github.com/)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%20%7C%20MySQL-orange)](https://github.com/)
[![Frontend](https://img.shields.io/badge/Frontend-Vite%20%7C%20Tailwind%20CSS-cyan)](https://github.com/)

**PrevaLife** adalah platform digital komprehensif untuk deteksi dini risiko diabetes tipe 2 menggunakan kecerdasan buatan berbasis *Deep Learning*. Sistem ini dirancang untuk mendemokratisasi akses skrining kesehatan mandiri dengan antarmuka yang modern, cepat, serta aman.

Proyek ini dikembangkan sebagai **Capstone Project** pada program **Coding Camp 2026 powered by DBS Foundation**.

---

## 👥 Profil Tim Capstone (CC26-PSU317)

| Identitas / ID | Nama Anggota | Peran / Learning Path | Status |
| :--- | :--- | :--- | :--- |
| **CFCC887D6Y1484** | Zacky Anugrah Akbar | Full-Stack Web Developer | Aktif |
| **CFCC887D6Y2806** | Ahmad Khoiril Anwar | Full-Stack Web Developer | Aktif |
| **CDCC001D6X1036** | Najwa Salsabila M.N | Data Scientist | Aktif |
| **CDCC001D6Y1194** | Andhias Abdillah Ridho | Data Scientist | Aktif |
| **CACC589D6Y0476** | Vinaldo Tambunan | AI Engineer | Aktif |
| **CACC589D6Y0455** | Ibran Faza Hafasi | AI Engineer | Aktif |

---

## 🏗️ Arsitektur Sistem (Microservices)

PrevaLife membagi tanggung jawab sistem ke dalam tiga pilar utama untuk menjaga modularitas, skalabilitas, dan efisiensi performa:

```mermaid
graph TD
    subgraph Frontend [Web Client - Port 5173]
        UI[Vite + Vanilla JS + Tailwind]
        Form[Formulir Satu Halaman - 3 Bagian (8 Kolom)]
        AdminPanel[Dashboard Admin UI]
    end

    subgraph Backend [Backend API - Port 3000]
        Server[Express.js Middleware]
        Auth[JWT Authentication & Bcrypt]
        DB_Conn[(MySQL Database)]
    end

    subgraph AI_Engine [AI & Analytics Services]
        FastAPI[FastAPI ML Server - Port 8000]
        KerasModel[Model TensorFlow .keras]
        Streamlit[Streamlit Dashboard - Port 8501]
    end

    UI -->|1. Submit Form| Server
    Server -->|2. Log & Simpan Riwayat| DB_Conn
    Server -->|3. Forward features| FastAPI
    FastAPI -->|4. Predict Risk| KerasModel
    KerasModel -->|5. Return Probability| FastAPI
    FastAPI -->|6. Return Prediction| Server
    Server -->|7. Return Result| UI
    AdminPanel -->|Monitor Data & Stats| Server
    Streamlit -->|Direct EDA & Prediction| KerasModel
```

### 1. AI & Machine Learning Component
*   **Model Core**: Deep Neural Network (DNN) biner yang dibangun dengan **TensorFlow Functional API** menggunakan dataset kesehatan.
*   **Komponen Kustom**: Mengimplementasikan custom layer `ResidualDenseBlock` (untuk stabilitas gradien pada data tabular), custom loss function `FocalLoss` (untuk menangani *class imbalance*), dan custom callback `TrainingMonitor`.
*   **Pipeline Eksperimen**: Tercatat dalam [main.ipynb](file:///c:/Users/Vinaldo%20Tambunan/OneDrive/Pictures/Documents/captone%20baru/AI/main.ipynb) yang meliputi pembersihan data, penanganan imbalance dengan komparasi 6 sampler (SMOTE, SMOTEENN, TomekLinks, dll.) × 6 model ML tradisional (XGBoost, LightGBM, Random Forest, dll.) hingga training loop kustom dengan `tf.GradientTape` dan visualisasi **TensorBoard**.
*   **FastAPI REST API (`AI/app_api.py`)**: Menyediakan endpoint `POST /predict` untuk menerima 8 parameter klinis utama dan mengembalikan hasil probabilitas risiko serta tingkat keparahan risiko.
*   **Streamlit Dashboard (`AI/app_dashboard.py`)**: Dashboard visualisasi analisis data eksploratif (EDA) dan pengujian prediksi interaktif secara langsung.

### 2. Backend (Node.js & Express.js)
*   **Lokasi**: [/backend](file:///c:/Users/Vinaldo%20Tambunan/OneDrive/Pictures/Documents/captone%20baru/backend)
*   **Database**: **MySQL** untuk penyimpanan riwayat skrining pasien dan kredensial administrator secara aman menggunakan enkripsi password **Bcrypt**.
*   **Autentikasi**: Sistem login admin berbasis **JWT (JSON Web Token)** untuk melindungi endpoint admin data.
*   **Fitur Utama**:
    *   `POST /api/predict` - Menyimpan riwayat 8 biomarker klinis, meneruskan permintaan ke FastAPI, dan mengembalikan status prediksi.
    *   `POST /api/admin/login` - Otentikasi masuk administrator.
    *   `GET /api/admin/data` - Mengambil log seluruh riwayat pemeriksaan (terproteksi JWT).
    *   `GET /api/admin/stats` - Mengambil statistik ringkasan tingkat risiko (Rendah, Sedang, Tinggi) untuk visualisasi diagram.

### 3. Frontend (Vite & Tailwind CSS)
*   **Lokasi**: [/frontend](file:///c:/Users/Vinaldo%20Tambunan/OneDrive/Pictures/Documents/captone%20baru/frontend)
*   **Desain Modern**: Memanfaatkan estetika *glassmorphism*, gradient warna teal/emerald yang menenangkan, efek hover mikro-interaktif, serta tata letak responsif (*mobile-first*).
*   **Halaman Utama**:
    *   `index.html`: Landing page informatif mengenai risiko diabetes dan pengenalan aplikasi.
    *   `screening.html`: Formulir kuesioner satu halaman dengan 3 bagian (Informasi Diri, Riwayat Medis, dan Parameter Klinis) serta kalkulator BMI dinamis.
    *   `result.html`: Halaman laporan hasil skrining berdasarkan evaluasi model AI.
    *   `dashboard-admin.html`: Portal administrator untuk memantau data rekam medis skrining masuk secara real-time lengkap dengan chart analitik.

---

## 📅 Rencana Proyek (Project Plan) & Jadwal Pengerjaan

Berdasarkan dokumen resmi [Project Plan - CC26-PSU317.pdf](file:///c:/Users/Vinaldo%20Tambunan/OneDrive/Pictures/Documents/captone%20baru/Project%20Plan%20-%20CC26-PSU317.pdf), berikut adalah pembagian fase pengerjaan proyek:

| Fase Pengerjaan | Waktu Pelaksanaan | Penanggung Jawab | Output Utama |
| :--- | :--- | :--- | :--- |
| **Fase I: Data Engineering** | 14 Apr - 24 Apr | Data Scientist | Dataset bersih & berimbang (Handling Imbalance & Scaling) |
| **Fase IV: Web Construction** | 14 Apr - 8 Mei | Full-Stack Developer | Antarmuka Web UI & Form Dinamis 8 Parameter |
| **Fase II: AI Modeling** | 27 Apr - 8 Mei | AI Engineer | Model TensorFlow Teroptimasi (Akurasi ≥ 85%, MAE ≤ 0.02) |
| **Fase III: Model Conversion** | 11 Mei - 15 Mei | AI Engineer & Dev | Konversi Model Python ke format JSON/Weight Shards TFJS |
| **Fase V: System Integration** | 18 Mei - 29 Mei | Full-Stack & AI | Integrasi API, Database MySQL, Proxy Server, & Alur Data |
| **Fase VI: Deployment & QA** | 1 Jun - 5 Jun | Seluruh Anggota Tim | Pengujian Sistem Lengkap, Dokumentasi, & Website Live |

---

## 📂 Struktur Repositori

```text
captone baru/
├── AI/                           # Aset Kecerdasan Buatan & ML
│   ├── logs/                     # Folder log Tensorboard hasil training
│   ├── app_api.py                # REST API FastAPI penampung model prediksi (CORS enabled)
│   ├── app_dashboard.py          # Dashboard visualisasi EDA berbasis Streamlit
│   ├── run_apps.py               # Launcher otomatis Python untuk FastAPI & Streamlit
│   ├── requirements.txt          # Dependensi Python untuk layanan AI
│   ├── main.py / main.ipynb      # Skrip & dokumentasi lengkap siklus ML
│   ├── diabetes_model.keras      # Model Deep Learning Keras hasil ekspor
│   ├── scaler.joblib             # Objek StandardScaler yang telah dilatih
│   ├── metadata.json             # Kamus data kategori & feature engineering
│   └── diabetes_prediction_dataset.csv # Dataset training model
├── backend/                      # Source code Backend API Node.js/Express
│   ├── config/                   # Konfigurasi koneksi MySQL database (db.js)
│   ├── src/
│   │   ├── ml/                   # Modul integrasi lokal ML (opsional)
│   │   └── routes/               # API Routes Express (api.js)
│   ├── package.json              # File konfigurasi npm backend
│   └── server.js                 # Entry point aplikasi backend
├── frontend/                     # Source code Frontend Web Vite
│   ├── dist/                     # Hasil kompilasi static build (siap deploy)
│   ├── public/                   # Aset gambar dan ikon publik
│   ├── src/
│   │   ├── css/                  # File styling CSS (style.css & Tailwind)
│   │   └── js/                   # Logika interaksi frontend (screening.js, dll)
│   ├── index.html                # Landing page utama
│   ├── screening.html            # Halaman form skrining kesehatan
│   ├── result.html               # Halaman laporan hasil skrining
│   ├── dashboard-admin.html      # Halaman monitoring admin panel
│   ├── package.json              # File konfigurasi npm frontend
│   ├── tailwind.config.js        # Konfigurasi utility Tailwind CSS
│   └── vite.config.js            # Konfigurasi bundler Vite
├── Laporan/                      # Dokumen pendukung laporan capstone
├── README.md                     # File dokumentasi utama
├── Panduan_Penggunaan.md         # Panduan penggunaan lengkap
├── Presentasi.md                 # Materi presentasi proyek
└── Project Plan - CC26-PSU317.pdf# Dokumen resmi rencana pengerjaan proyek
```

---

## 🚀 Panduan Menjalankan Sistem Secara Lokal

### 1. Menjalankan AI Engine (FastAPI & Streamlit)
Kami telah menyediakan skrip python pembantu untuk menjalankan kedua server AI secara bersamaan:
1. Pastikan Python 3.9+ telah terinstal.
2. Buka terminal pada root direktori proyek, lalu jalankan:
   ```bash
   cd AI
   python run_apps.py
   ```
   *Skrip ini secara otomatis akan mendeteksi dan menginstal dependensi yang kurang dari `requirements.txt`, lalu menyalakan:*
   *   **FastAPI API** pada `http://localhost:8000`
   *   **Streamlit Dashboard** pada `http://localhost:8501`

### 2. Menjalankan Backend API (Node.js)
1. Masuk ke direktori backend:
   ```bash
   cd backend
   ```
2. Instal semua pustaka dependensi:
   ```bash
   npm install
   ```
3. Buat database MySQL lokal, lalu impor tabel `admins` dan `screening_history`. Sesuaikan kredensial database Anda pada berkas [backend/src/config/db.js](file:///c:/Users/Vinaldo%20Tambunan/OneDrive/Pictures/Documents/captone%20baru/backend/src/config/db.js).
4. Jalankan server backend:
   ```bash
   npm run dev
   ```
   *Backend kini berjalan pada port `3000` (`http://localhost:3000`).*

### 3. Menjalankan Frontend (Vite)
1. Masuk ke direktori frontend:
   ```bash
   cd frontend
   ```
2. Instal dependensi:
   ```bash
   npm install
   ```
3. Jalankan server pengembangan Vite:
   ```bash
   npm run dev
   ```
   *Buka URL local yang tampil di terminal (biasanya `http://localhost:5173`) di peramban Anda.*

---

## 🌐 Panduan Deployment Lengkap ke aaPanel (VPS Linux)

Ikuti langkah-langkah di bawah ini untuk meng-host arsitektur mikroservis PrevaLife secara publik menggunakan panel kontrol **aaPanel**:

### Langkah 1: Pengaturan Database MySQL
1. Buka dashboard **aaPanel**.
2. Masuk ke menu **Databases** -> klik **Add Database**.
3. Buat database baru (misal: `db_prevalife`) dan catat detail **Username** dan **Password**.
4. Impor skema tabel yang dibutuhkan.
5. Perbarui berkas [backend/src/config/db.js](file:///c:/Users/Vinaldo%20Tambunan/OneDrive/Pictures/Documents/captone%20baru/backend/src/config/db.js) dengan informasi kredensial database baru.

### Langkah 2: Deploy Python FastAPI (AI API)
1. Di aaPanel, masuk ke menu **Website** -> pilih tab **Python Project** -> klik **Add Python Project**.
2. Konfigurasikan form proyek:
   *   **Path**: Pilih folder `AI` di dalam repositori (`captone baru/AI`).
   *   **Python Version**: Pilih versi `3.10` atau yang lebih baru.
   *   **Framework**: `FastAPI`
   *   **Run command**: `uvicorn app_api:app --host 127.0.0.1 --port 8000`
   *   **Port**: `8000`
   *   Centang **Install modules dependencies** untuk otomatis memasang modul dari `requirements.txt`.
3. Klik **Submit** dan pastikan status proyek adalah **Running**.

### Langkah 3: Deploy Node.js Backend API
1. Pastikan aaPanel sudah terpasang ekstensi **Node.js Version Manager**.
2. Buka menu **Website** -> pilih tab **Node Project** -> klik **Add Node Project**.
3. Konfigurasikan form proyek:
   *   **Path**: Pilih folder `/backend`.
   *   **Run command / Startup file**: `server.js`
   *   **Project name**: `prevalife-backend`
   *   **Port**: `3000`
4. Jalankan perintah instalasi paket dependensi (via terminal: `cd backend && npm install`).
5. Klik **Submit** dan pastikan statusnya adalah **Running**.

### Langkah 4: Compile & Deploy Frontend (Web Statis)
1. Buka koneksi SSH ke VPS Anda, arahkan ke folder frontend, lalu lakukan build produksi:
   ```bash
   cd /www/wwwroot/captone-baru/frontend
   npm install
   npm run build
   ```
   *(Proses ini akan menghasilkan aset teroptimasi di dalam folder `frontend/dist`).*
2. Di aaPanel, masuk ke menu **Website** -> tab **PHP Project** (untuk web statis) -> klik **Add Site**.
3. Masukkan domain publik Anda (contoh: `prevalife.kyuhost.web.id`).
4. Atur **Document Root** langsung mengarah ke folder hasil build: `/www/wwwroot/captone-baru/frontend/dist`.
5. Klik **Submit**.

### Langkah 5: Konfigurasi Nginx Reverse Proxy (Kunci Integrasi)
Untuk menghindari kendala CORS dan menyederhanakan akses API dari frontend ke backend Node.js, konfigurasikan reverse proxy pada nginx domain frontend:
1. Pada menu **Website**, klik nama domain Anda (`prevalife.kyuhost.web.id`).
2. Masuk ke menu **Reverse Proxy** -> klik **Add reverse proxy**.
3. Konfigurasikan detail proxy:
   *   **Proxy Name**: `NodeAPI`
   *   **Advanced**: Aktifkan fitur *Advanced* (untuk filter direktori).
   *   **Target Directory**: `/api`
   *   **Target URL**: `http://127.0.0.1:3000`
4. Simpan konfigurasi.

**Bagaimana Alur Komunikasi Bekerja?**
*   Pengguna membuka situs web di domain utama `https://prevalife.kyuhost.web.id`.
*   Saat kuesioner dikirim, frontend mengirimkan request ke path internal `https://prevalife.kyuhost.web.id/api/predict`.
*   Nginx aaPanel menangkap prefix `/api` dan melakukan proxy request tersebut secara internal ke Node.js Backend di `http://127.0.0.1:3000/api/predict`.
*   Node.js Backend mencatat riwayat data ke database MySQL, lalu meneruskan request ke FastAPI AI Engine di `http://127.0.0.1:8000/predict` untuk mendapatkan hasil evaluasi model TensorFlow, sebelum akhirnya meneruskan jawaban akhir kembali ke client.

---

## ⚠️ Disclaimer (Penafian Medis)

Aplikasi **PrevaLife** dirancang sebagai alat bantu **skrining awal dan edukasi** untuk mengukur tingkat risiko diabetes berdasarkan data statistik gaya hidup dan riwayat kesehatan. Hasil dari aplikasi ini **bukan merupakan diagnosis medis resmi**. Pengguna disarankan untuk tetap berkonsultasi secara langsung dengan dokter atau tenaga medis profesional untuk pemeriksaan kesehatan dan diagnosis klinis formal.
