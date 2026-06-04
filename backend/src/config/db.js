const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
    host:     process.env.DB_HOST     || '127.0.0.1',
    user:     process.env.DB_USER     || 'dicoding',
    password: process.env.DB_PASSWORD || 'dicoding2026',
    database: process.env.DB_NAME     || 'dicoding'
};

const pool = mysql.createPool(dbConfig);

const initDB = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to MySQL database.');

        // Tabel riwayat skrining menggunakan 8 biomarker klinis (sesuai model AI)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS screening_history (
                id                   INT AUTO_INCREMENT PRIMARY KEY,
                FullName             VARCHAR(255)    DEFAULT 'Anonymous',
                timestamp            DATETIME        DEFAULT CURRENT_TIMESTAMP,
                gender               VARCHAR(10),
                age                  FLOAT,
                hypertension         TINYINT(1)      DEFAULT 0,
                heart_disease        TINYINT(1)      DEFAULT 0,
                smoking_history      VARCHAR(20),
                bmi                  FLOAT,
                HbA1c_level          FLOAT,
                blood_glucose_level  FLOAT,
                prediction           VARCHAR(20),
                probability          FLOAT,
                risk_level           VARCHAR(10)
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id       INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50)  UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL
            )
        `);

        const [rows] = await connection.query('SELECT * FROM admins WHERE username = ?', ['admin']);
        if (rows.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await connection.query('INSERT INTO admins (username, password) VALUES (?, ?)', ['admin', hashedPassword]);
            console.log('Default admin created (username: admin, password: admin123)');
        }

        connection.release();
    } catch (err) {
        console.error('MySQL database error:', err.message);
        console.log('Pastikan MySQL berjalan dan database sudah ada.');
    }
};

initDB();

module.exports = pool;
