import bukatejaPhoto from "../assets/koridor-bukateja.png";
import bulupituPhoto from "../assets/koridor-bulupitu.png";

// Display fixtures: replace through the public content API; no operational claims.
// Current project photos illustrate the corridor, not every named shelter.
export const stationHubs = [
  { id: "bulupitu", name: "Terminal Bulupitu", subtitle: "Simpul awal Kota Purwokerto", type: "Terminal", photo: bukatejaPhoto,
    stops: { bukateja: "Terminal Bulupitu", bulupitu: "Terminal Bulupitu" }, connection: "Akses perjalanan menuju Sokaraja dan Purbalingga", feature: "Terminal & perpindahan moda" },
  { id: "sokaraja", name: "Simpang Sokaraja (Klenteng)", subtitle: "Titik singgah kawasan Sokaraja", type: "Halte", photo: bulupituPhoto,
    stops: { bukateja: "Simpang 4 Klenteng 1", bulupitu: "Simpang 4 Klenteng 2" }, connection: "Lintasan penghubung Banyumas–Purbalingga", feature: "Dua arah perjalanan" },
  { id: "margono", name: "RS Margono Soekarjo", subtitle: "Akses kawasan layanan kesehatan", type: "Halte", photo: bulupituPhoto,
    stops: { bulupitu: "RS Margono Soekarjo" }, connection: "Tersedia pada lintasan arah Terminal Bulupitu", feature: "Akses layanan kesehatan" },
  { id: "purbalingga", name: "Terminal Purbalingga", subtitle: "Simpul perjalanan Kota Purbalingga", type: "Terminal", photo: bukatejaPhoto,
    stops: { bukateja: "Terminal Purbalingga", bulupitu: "Terminal Purbalingga" }, connection: "Titik antara Bulupitu dan Bukateja", feature: "Terminal antara" },
  { id: "janatin", name: "Taman Usman Janatin", subtitle: "Kawasan publik Kota Purbalingga", type: "Halte", photo: bulupituPhoto,
    stops: { bukateja: "Usman Janatin" }, connection: "Tersedia pada lintasan arah Terminal Bukateja", feature: "Akses ruang publik" },
  { id: "bukateja", name: "Terminal Bukateja", subtitle: "Simpul ujung timur koridor", type: "Terminal", photo: bukatejaPhoto,
    stops: { bukateja: "Terminal Bukateja", bulupitu: "Terminal Bukateja" }, connection: "Awal perjalanan kembali menuju Purwokerto", feature: "Terminal awal & tujuan" }
];

export const facilityFeatures = [
  { id: "access", icon: "access", title: "Zona tunggu & aksesibilitas", description: "Ruang tunggu, jalur pemandu, dan akses naik yang mudah digunakan. Ketersediaan ramp serta akses kursi roda perlu diverifikasi per halte.", tags: ["Ruang tunggu", "Akses penumpang", "Jalur pemandu"] },
  { id: "information", icon: "map", title: "Informasi rute & kanopi peneduh", description: "Informasi arah perjalanan membantu penumpang memastikan halte tujuan. Kanopi dan penerangan mendukung kenyamanan saat menunggu.", tags: ["Papan rute", "Kanopi", "Penerangan"] },
  { id: "boarding", icon: "bus", title: "Area naik & turun penumpang", description: "Area pemberhentian yang jelas membantu penumpang naik dan turun dengan tertib. Kondisi titik naik mengikuti pemeriksaan pengelola halte.", tags: ["Titik naik", "Rambu halte", "Keselamatan"] }
];
