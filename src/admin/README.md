# Panel admin SmartStop

Frontend React untuk enam referensi gambar admin. Buka `/#admin` pada dev server.

| URL hash | Halaman |
| --- | --- |
| `#admin` | Dashboard |
| `#admin/jadwal` | Kelola Jadwal |
| `#admin/rute` | Kelola Rute |
| `#admin/halte` | Titik Singgah |
| `#admin/informasi` | Info Layanan |
| `#admin/masukan` | Kritik dan Saran |

## Batas demo

Semua data berasal dari `createAdminData()` di `data.js`. Perubahan memakai React state di `AdminPanel.jsx`, bertahan ketika berpindah menu admin, dan kembali ke fixture ketika panel ditutup atau halaman dimuat ulang. Tidak ada HTTP request, database, publikasi website, atau pengiriman tanggapan. Ekspor CSV berjalan di browser dan tidak menyertakan catatan internal.

Route admin adalah pratinjau frontend, bukan autentikasi admin. Tim backend perlu menyediakan autentikasi, otorisasi, validasi, dan penyimpanan sebelum digunakan sebagai panel operasional.

## Titik integrasi backend

- Ganti inisialisasi `data` dan fungsi `save(collection, record)` di `AdminPanel.jsx` dengan adapter layanan. Tambahkan status memuat, gagal, serta sukses sesuai hasil API.
- Koleksi `routes`: `id`, `name`, `area`, `direction`, `duration`, `status`, `stopIds` (urutan ID halte).
- Koleksi `stops`: `id`, `name`, `type`, `area`, `address`, `lat`, `lng`, `verified`. Koordinat awal dikosongkan.
- Koleksi `schedules`: `id`, `routeId`, `fleet`, `days`, `departure`, `arrival`, `status`. Waktu berupa `HH:mm` dalam WIB. Draf boleh belum lengkap; editor saat ini memakai perjalanan pada hari yang sama.
- Koleksi `information`: `id`, `title`, `category`, `scope`, `content`, `status`.
- Koleksi `feedback`: `id`, `sender`, `category`, `location`, `message`, `status`, `response`, `note`, `sentResponse`. `note` adalah catatan internal; pisahkan dari respons publik pada API.
- Ganti aksi publikasi dan kirim demo di `Communication.jsx` dengan layanan backend, lalu ubah status setelah server mengonfirmasi keberhasilan.

Jumlah fixture konsisten dengan daftar rute yang tersedia: **24 titik pergi + 44 titik pulang = 68 entri dalam dua arah**, termasuk titik asal masing-masing arah. Fixture ini belum mewakili verifikasi layanan resmi.
