# Serah terima integrasi SmartStop

## Status implementasi

Frontend React berjalan tanpa MySQL. Semua koneksi database, autentikasi, pemeriksaan kartu, dan perubahan jumlah penumpang menjadi tanggung jawab backend.

| Modul | Status saat ini | Titik penggantian data |
| --- | --- | --- |
| Beranda & Peta Halte | Snapshot armada bersama; demo atau GET API opsional | `Portal.jsx`, `services/fleetAdapter.js` |
| Koridor Bus | Katalog, pencarian, arah & skematik interaktif; fixture | prop `hubs` di `CorridorPage.jsx`, `serviceData.js` |
| Infrastruktur | Ilustrasi interaktif; fasilitas lokasi belum terverifikasi | prop `facilities` di `InfrastructurePage.jsx` |
| Tiket | Form, maksimal 5 orang, file teman pelajar, pembayaran & struk simulasi | `TicketPage.jsx`, `ticketModel.js`, callback `onReview` / `onComplete` di `Portal.jsx` |
| Admin | Enam halaman, perubahan React state saja | `admin/README.md` dan `AdminPanel.jsx` |
| Login / registrasi / profil / laporan | Masih demo | `main.jsx`, `Portal.jsx` |
| Dashboard supir & penugasan akun | Belum dibuat pada revisi ini | Endpoint usulan di bawah untuk fase selanjutnya |

File kartu tetap di memori browser; berpindah formulir ke pembayaran lalu kembali mempertahankan draft selama Portal masih terpasang. Refresh, logout, atau membuka halaman autentikasi menghapus state tersebut. Tidak ada upload maupun transaksi uang. Validasi file di browser bukan verifikasi kartu pelajar.

Foto katalog menggunakan dua aset koridor yang sudah ada dan diberi label ilustrasi; ganti `photo` dengan foto lokasi yang benar saat tersedia. Nama dan urutan fixture mempunyai 24 entri arah Bukateja + 44 arah Bulupitu = 68 entri arah, bukan 68 halte fisik unik. Angka 58 / 38 pada gambar tidak dipakai sebagai statistik terverifikasi.

## Menjalankan frontend

```powershell
npm ci --include=dev
npm run dev -- --host 127.0.0.1 --port 5178
npm run build
node --test tests/frontend.test.mjs
```

URL: `/#beranda`, `/#peta`, `/#koridor`, `/#infrastruktur`, `/#tiket`, `/#pembayaran`, `/#struk`, `/#admin`.

Untuk pratinjau pelajar, klik Login lalu masuk memakai `pelajar@example.com` dan kata sandi contoh bebas. Ini bukan login sebenarnya dan tidak memberi otorisasi server. Membuka situs pertama kali tetap menampilkan beranda publik.

## Pengaturan publik

Salin `.env.example` menjadi `.env.local`. Pengaturan `VITE_*` masuk ke bundle browser; hanya isi URL publik dan pilihan sumber data. Kredensial MySQL, SMTP, storage, dan rahasia token tetap di `.env` backend yang diabaikan Git.

```dotenv
VITE_API_BASE_URL=http://localhost:5000/api
VITE_FLEET_SOURCE=demo
```

Ubah `VITE_FLEET_SOURCE=api` dan mulai ulang Vite hanya setelah `/api/armada` memenuhi kontrak berikut. Flag ini **hanya mengaktifkan pembacaan armada**. Login, upload, CRUD admin, konten, jadwal, dan transaksi belum otomatis beralih ke API.

## Snapshot armada yang sudah dapat dibaca UI

`GET /api/armada`, respons `{ "data": { "buses": [...] } }` atau `{ "buses": [...] }`.

```json
{
  "data": {
    "buses": [{
      "id": "vehicle-04",
      "number": "04",
      "code": "TJ-04",
      "plate": "AA 1420 AB",
      "direction": "bukateja",
      "currentStopIndex": 6,
      "movement": "at_stop",
      "passengers": 22,
      "capacity": 40,
      "reportedAt": "2026-11-27T12:30:00Z",
      "arrivals": [{ "stopIndex": 8, "state": "approaching", "minutes": 4 }]
    }]
  }
}
```

- `id` unik; string atau angka diterima. UI tidak mengharuskan ID 1–14.
- Arah saat ini: `bukateja` / `bulupitu`, mengikuti urutan `transit.js`. Index mulai 0 dan merupakan halte terakhir yang dilaporkan, bukan koordinat GPS.
- `movement`: `at_stop`, `en_route`, `finished`. `reportedAt` ISO 8601 wajib; UI menampilkan WIB.
- `passengers` dan `capacity` bilangan bulat; `0 <= passengers <= capacity`.
- `arrivals[].state`: `approaching` (menit positif), `arrived`, `passed`, `unavailable`. ETA yang tidak diberikan ditampilkan belum tersedia; UI tidak mengarang ETA dari rumus demo saat mode API.
- Polling setiap 15 detik; permintaan dibatalkan saat unmount. Respons kosong, gagal, data invalid, ID berbeda, dan arah tanpa bus mempunyai tampilan penanganan. Saat pembaruan gagal, snapshot terakhir dipertahankan dengan pemberitahuan.
- Untuk integrasi rute dinamis, ganti fixture `transit.js` dengan adapter daftar rute/halte dan identitas stop yang stabil terlebih dahulu. Jangan mengubah urutan di server sambil tetap menggunakan index fixture versi lama.

## Endpoint usulan untuk disepakati tim

Nama endpoint pada `services/smartstopApi.js` adalah kontrak usulan, bukan bukti endpoint sudah ada. Backend yang sekarang tersedia baru memiliki `/`, `/api/test-db`, dan `GET /api/halte`.

| Kebutuhan | Endpoint usulan |
| --- | --- |
| Akun | POST `/auth/register`, `/auth/login`, `/auth/logout`; GET `/auth/me` |
| Verifikasi email | POST `/auth/verify-email`, `/auth/resend-verification` |
| Data publik | GET `/halte`, `/rute`, `/jadwal`, `/informasi`, `/simpul`, `/infrastruktur` |
| Harga & pemesanan | POST `/tiket/quote`, POST `/tiket`, GET `/tiket/:id` |
| Laporan | POST `/masukan` |
| Kartu pelajar | POST `/uploads/student-card`, POST `/uploads/student-card/confirm` |
| CRUD admin | `/admin/rute`, `/admin/halte`, `/admin/jadwal`, `/admin/informasi`, `/admin/masukan`, `/admin/akun`, `/admin/penugasan` |
| Tugas supir | GET `/driver/assignment` |
| Laporan halte | POST `/driver/status` |
| Konfirmasi naik | POST `/driver/check-in` — mekanisme QR/tombol perlu disepakati |

Client menyertakan `credentials: include`. Jika autentikasi memakai cookie lintas origin lokal, backend perlu CORS origin frontend yang tepat dan `credentials: true`. Gunakan JSON sukses `{ "data": ... }`, error `{ "message": "..." }` dengan kode HTTP yang sesuai; jangan mengirim kredensial atau rincian SQL ke browser.

Katalog menerima `hubs` berisi `id`, `name`, `subtitle`, `type`, `photo`, `stops: { bukateja?: stopName, bulupitu?: stopName }`, `connection`, `feature`. Infrastruktur menerima `facilities` berisi `stopName`, `description`, `verified`. Backend dapat memakai stop ID secara internal; adapter UI memetakan ID ke nama tampilan. Data fasilitas yang belum ada tidak diasumsikan tersedia.

## Alur tiket dan laporan supir

1. Admin menetapkan supir, bus, rute, serta **ID perjalanan/keberangkatan**. Satu bus dapat mempunyai perjalanan berbeda; tiket harus terkait perjalanan tertentu.
2. Server quote menerima trip ID, halte asal/tujuan, serta daftar penumpang dan referensi dokumen teman. Server menghitung tarif berdasarkan kategori dan verifikasi; abaikan harga/kelayakan yang dikirim browser.
3. File kartu disimpan di storage privat. MySQL menyimpan file key, pemilik, status pemeriksaan dan metadata. File key diverifikasi kepemilikannya; URL akses pemeriksaan dibatasi untuk pihak berwenang. Frontend belum mengimplementasikan upload langsung/signed URL.
4. Tiket baru `reserved` / `booked`. **Reservasi tidak langsung menjadi penumpang di dalam bus.** Konfirmasi naik memindahkan tiket ke `boarded` dan menambah penumpang sesuai jumlah orang.
5. Laporan supir minimal `{ tripId, stopId/stopIndex, movement, eventId }`. Backend memeriksa identitas supir dan penugasannya. Kirim kembali snapshot setelah perubahan berhasil.
6. Saat `at_stop` di tujuan, server menyelesaikan tiket `boarded` yang berakhir di halte tersebut dan mengurangi jumlah penumpang sesuai kuantitas. Laporan ulang memakai event ID yang sama atau tiket yang sudah selesai **tidak boleh mengurangi dua kali**. Jalankan pembaruan tiket dan okupansi dalam transaksi.
7. Kapasitas diperiksa untuk segmen perjalanan terkait agar pesanan bersamaan tidak membuat kelebihan kapasitas. Pembayaran dan QR resmi berasal dari server/penyedia pembayaran, bukan tombol simulasi frontend.
8. Beranda, peta, dan dashboard supir membaca sumber status yang sama. UI menampilkan waktu laporan agar penumpang tahu keterkinian data.

Contoh: 26 orang, 4 orang berstatus `boarded` bertujuan Jompo. Setelah supir melaporkan tiba di Jompo, server menghasilkan 22 orang. Pengulangan laporan yang sama tetap menghasilkan 22.

## Pemeriksaan saat integrasi

- Login/role admin, supir, penumpang; kategori umum/pelajar dipisahkan dari role.
- Data kosong, satu arah tanpa bus, snapshot gagal/terlambat, kapasitas penuh, halte terlewat.
- Jadwal WIB dan waktu yang sudah lewat; server tetap otoritatif.
- Kartu teman kosong/invalid/belum disetujui; jangan menganggap file yang dipilih telah diverifikasi.
- Simpan admin lalu refresh dan periksa lewat endpoint baca, bukan hanya notifikasi berhasil di UI.
- Reservasi, konfirmasi naik, tiba di tujuan, laporan ganda, dan pesanan bersamaan.
