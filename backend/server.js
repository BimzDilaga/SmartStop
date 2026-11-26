require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_ORIGIN
}));

app.use(express.json());

// Halaman utama API
app.get("/", (req, res) => {
    res.json({
        message: "SmartStop API berjalan"
    });
});

// Tes koneksi database
app.get("/api/test-db", async (req, res) => {
    try {
        await db.query("SELECT 1");

        res.json({
            success: true,
            message: "Database SmartStop berhasil terhubung!"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Database gagal terhubung!"
        });
    }
});

// Menampilkan data halte
app.get("/api/halte", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM halte"
        );

        res.json(rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Gagal mengambil data halte"
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);

    try {
        await db.query("SELECT 1");
        console.log("Database MySQL berhasil terhubung!");
    } catch (error) {
        console.error("Koneksi database gagal:", error.message);
    }
});