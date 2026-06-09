const express = require('express');
const axios   = require('axios');
const pool    = require('../config/db');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');

const router = express.Router();

const FASTAPI_URL = 'http://127.0.0.1:8000/predict';
const JWT_SECRET  = process.env.JWT_SECRET || 'prevalife_super_secret_key';

// ─── Auth Middleware ────────────────────────────────────────────────────────
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: 'Forbidden' });
        req.user = user;
        next();
    });
};

// ─── POST /api/predict ──────────────────────────────────────────────────────
// Menerima 8 biomarker klinis, kirim ke FastAPI, simpan ke DB, return hasil AI
router.post('/predict', async (req, res) => {
    const {
        nama                = 'Anonymous',
        gender,
        age,
        hypertension,
        heart_disease,
        smoking_history,
        bmi,
        HbA1c_level,
        blood_glucose_level
    } = req.body;

    // Validasi field wajib
    if (
        !gender || age === undefined || hypertension === undefined ||
        heart_disease === undefined || !smoking_history ||
        bmi === undefined || HbA1c_level === undefined ||
        blood_glucose_level === undefined
    ) {
        return res.status(400).json({ success: false, message: 'Semua field klinis wajib diisi.' });
    }

    // Payload yang dikirim ke FastAPI (sesuai schema PatientInput)
    const mlPayload = {
        gender:              String(gender),
        age:                 parseFloat(age),
        hypertension:        parseInt(hypertension),
        heart_disease:       parseInt(heart_disease),
        smoking_history:     String(smoking_history),
        bmi:                 parseFloat(bmi),
        HbA1c_level:         parseFloat(HbA1c_level),
        blood_glucose_level: parseFloat(blood_glucose_level)
    };

    let prediction   = 'TIDAK DIKETAHUI';
    let probability  = 0;
    let risk_level   = 'Tidak Diketahui';

    try {
        const mlResponse = await axios.post(FASTAPI_URL, mlPayload, { timeout: 15000 });
        prediction  = mlResponse.data.prediction;   // "DIABETES" | "TIDAK DIABETES"
        probability = mlResponse.data.probability;  // 0.0 - 1.0
        risk_level  = mlResponse.data.risk_level;   // "Rendah" | "Sedang" | "Tinggi"
    } catch (mlError) {
        console.error('Error communicating with FastAPI:', mlError.message);
        // Jika FastAPI tidak tersedia, return response error ke frontend
        return res.status(503).json({ 
            success: false, 
            message: 'Layanan AI prediksi diabetes sedang tidak tersedia. Silakan coba beberapa saat lagi.' 
        });
    }

    // Simpan ke database
    try {
        await pool.query(
            `INSERT INTO screening_history
                (FullName, gender, age, hypertension, heart_disease,
                 smoking_history, bmi, HbA1c_level, blood_glucose_level,
                 prediction, probability, risk_level)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nama,
                mlPayload.gender,
                mlPayload.age,
                mlPayload.hypertension,
                mlPayload.heart_disease,
                mlPayload.smoking_history,
                mlPayload.bmi,
                mlPayload.HbA1c_level,
                mlPayload.blood_glucose_level,
                prediction,
                probability,
                risk_level
            ]
        );
    } catch (dbError) {
        console.error('Database insert error:', dbError.message);
        // Tetap kirim hasil prediksi meski DB error
    }

    return res.status(200).json({
        success:     true,
        prediction,
        probability,
        risk_level,
        message:     'Prediksi berhasil.'
    });
});

// ─── POST /api/admin/login ──────────────────────────────────────────────────
router.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ success: false, message: 'Username dan password wajib diisi.' });

    try {
        const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);
        if (rows.length === 0)
            return res.status(401).json({ success: false, message: 'Username atau password salah.' });

        const validPassword = await bcrypt.compare(password, rows[0].password);
        if (!validPassword)
            return res.status(401).json({ success: false, message: 'Username atau password salah.' });

        const token = jwt.sign({ username: rows[0].username }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ success: true, token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// ─── GET /api/admin/data ────────────────────────────────────────────────────
router.get('/admin/data', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM screening_history ORDER BY timestamp DESC'
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Admin data error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// ─── GET /api/admin/stats ───────────────────────────────────────────────────
router.get('/admin/stats', authenticateToken, async (req, res) => {
    try {
        const [[{ total }]] = await pool.query(
            'SELECT COUNT(*) as total FROM screening_history'
        );
        const [[{ highRisk }]] = await pool.query(
            "SELECT COUNT(*) as highRisk FROM screening_history WHERE risk_level = 'Tinggi'"
        );
        const [[{ medium }]] = await pool.query(
            "SELECT COUNT(*) as medium FROM screening_history WHERE risk_level = 'Sedang'"
        );
        const [[{ lowRisk }]] = await pool.query(
            "SELECT COUNT(*) as lowRisk FROM screening_history WHERE risk_level = 'Rendah'"
        );
        const [[{ avgProb }]] = await pool.query(
            'SELECT AVG(probability) as avgProb FROM screening_history'
        );

        res.json({
            success: true,
            data: {
                total:    parseInt(total),
                highRisk: parseInt(highRisk),
                medium:   parseInt(medium),
                lowRisk:  parseInt(lowRisk),
                avgProbability: avgProb ? parseFloat(avgProb).toFixed(4) : '0'
            }
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

module.exports = router;
