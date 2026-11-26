import { inboundStops, outboundStops } from "../transit.js";

// Frontend demo fixtures. No database, API, authentication, or delivery is performed here.
// Backend integration can replace this factory and the local state in AdminPanel.
export function createAdminData() {
  const stops = [outboundStops, inboundStops].flatMap((names, direction) => names.map((name, index) => ({
    id: `K1${direction ? "K" : "P"}-${index === 0 ? "OD" : String(index).padStart(2, "0")}`,
    name,
    type: name.startsWith("Terminal") ? "Terminal bus" : "Halte portabel",
    area: (direction ? index <= 14 : index >= 8) ? "Purbalingga" : "Banyumas",
    address: "", lat: "", lng: "", verified: false
  })));
  const routes = [
    { id: "K1-P", name: "Bulupitu → Bukateja", area: "Banyumas–Purbalingga", direction: "Pergi", duration: "", status: "Draf", stopIds: stops.filter(stop => stop.id.startsWith("K1P-")).map(stop => stop.id) },
    { id: "K1-K", name: "Bukateja → Bulupitu", area: "Banyumas–Purbalingga", direction: "Pulang", duration: "", status: "Draf", stopIds: stops.filter(stop => stop.id.startsWith("K1K-")).map(stop => stop.id) }
  ];
  return {
    routes, stops,
    schedules: routes.map((route, index) => ({ id: `JDW-0${index + 1}`, routeId: route.id, fleet: "", days: [], departure: "", arrival: "", status: "Draf" })),
    information: [
      { id: "INFO-01", title: "Panduan naik di titik singgah", category: "Panduan", scope: "Semua rute", content: "Sebelum berangkat, periksa rute dan jadwal perjalanan Anda.\n\nDatang ke titik singgah sesuai rute yang dipilih. Pastikan nama tujuan sebelum naik kendaraan.\n\nLokasi titik naik dan jadwal pada contoh ini masih perlu diverifikasi.", status: "Draf" },
      { id: "INFO-02", title: "Informasi jadwal hari Minggu", category: "Jadwal", scope: "Semua rute", content: "Periksa hari layanan pada jadwal sebelum merencanakan perjalanan. Informasi jadwal akan diperbarui setelah diverifikasi oleh operator.", status: "Draf" },
      { id: "INFO-03", title: "Panduan membaca rute perjalanan", category: "Rute", scope: "Semua rute", content: "Kenali halte asal, tujuan, dan urutan titik singgah. Arah pergi dan pulang dapat memiliki titik singgah yang berbeda.", status: "Draf" }
    ],
    feedback: [
      { id: "MSK-01", sender: "Budi Santoso", category: "Titik singgah", location: "Pasar Wage", message: "Titik naik di sekitar Pasar Wage ada di sebelah mana? Tolong perjelas lokasinya.", status: "Baru", response: "", note: "Periksa titik naik Pasar Wage bersama pengelola lokasi sebelum memperbarui petunjuk.", sentResponse: "" },
      { id: "MSK-02", sender: "Anonim", category: "Jadwal", location: "Purwokerto", message: "Jadwal dari Stasiun Purwokerto untuk hari Minggu belum tercantum.", status: "Diproses", response: "Informasi hari layanan sedang kami periksa bersama operator.", note: "Konfirmasi jadwal hari Minggu kepada operator.", sentResponse: "" },
      { id: "MSK-03", sender: "Siti Aminah", category: "Titik singgah", location: "GOR Satria", message: "Mohon tambahkan penanda lokasi singgah di sekitar GOR Satria.", status: "Ditanggapi", response: "Terima kasih atas masukannya. Kebutuhan penanda lokasi akan kami teruskan kepada pengelola layanan.", note: "Contoh masukan untuk demonstrasi antarmuka.", sentResponse: "Terima kasih atas masukannya. Kebutuhan penanda lokasi akan kami teruskan kepada pengelola layanan." }
    ]
  };
}

export const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
export const newId = prefix => `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
export const matches = (query, ...values) => values.join(" ").toLocaleLowerCase("id-ID").includes(query.trim().toLocaleLowerCase("id-ID"));

export function buildFeedbackCsv(records) {
  const cell = value => {
    const text = String(value ?? "");
    const safe = /^[=+@\-\t\r]/.test(text) ? "'" + text : text;
    return '"' + safe.replaceAll('"', '""') + '"';
  };
  const rows = [["Kode", "Pengirim contoh", "Kategori", "Lokasi", "Masukan", "Status", "Tanggapan demo"], ...records.map(item => [item.id, item.sender, item.category, item.location, item.message, item.status, item.sentResponse])];
  return "\ufeff" + rows.map(row => row.map(cell).join(",")).join("\r\n");
}

export function exportFeedback(records) {
  const url = URL.createObjectURL(new Blob([buildFeedbackCsv(records)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "smartstop-masukan-demo.csv";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
