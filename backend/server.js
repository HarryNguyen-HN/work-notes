require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Cấu hình kết nối SQL Server
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT),
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// Kết nối SQL Server
sql.connect(dbConfig)
    .then(() => console.log('Connected to SQL Server'))
    .catch(err => console.error('Database connection failed:', err));
//
app.get("/", (req, res) => {
    res.send("Backend đang chạy!");
});

// API GET: Lấy danh sách dữ liệu từ bảng "Products"
app.get('/api/account', async (req, res) => {
    try {
        const result = await sql.query`SELECT * FROM account`;
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// API POST: Thêm dữ liệu vào bảng "Products"
app.post('/api/products', async (req, res) => {
    const { name, price } = req.body;
    try {
        await sql.query`INSERT INTO Products (name, price) VALUES (${name}, ${price})`;
        res.status(201).send('Product added successfully');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Chạy server
const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port http://10.150.32.91:${PORT}`));

