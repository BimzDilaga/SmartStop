import React, { useState, useMemo } from "react";
import "./admin.css";

const INITIAL_STOPS = [
  { id: "HLT-01", name: "Halte Terminal Bulupitu", area: "Purwokerto Selatan", lat: "-7.4478", lng: "109.2451", status: "Aktif" },
  { id: "HLT-02", name: "Halte Alun-Alun Purwokerto", area: "Purwokerto Timur", lat: "-7.4244", lng: "109.2302", status: "Aktif" },
  { id: "HLT-03", name: "Halte Stasiun Purwokerto", area: "Purwokerto Barat", lat: "-7.4192", lng: "109.2221", status: "Aktif" },
  { id: "HLT-04", name: "Halte GOR Satria", area: "Purwokerto Utara", lat: "-7.4145", lng: "109.2489", status: "Maintenance" },
  { id: "HLT-05", name: "Halte UNSOED Karangwangkal", area: "Purwokerto Utara", lat: "-7.4087", lng: "109.2542", status: "Aktif" },
];

const INITIAL_ROUTES = [
  { id: "K-01", code: "KORIDOR 1", name: "Bulupitu — Pasar Pon — UNSOED", stopsCount: 14, headway: "10 mnt", fare: "Rp 4.000", status: "Beroperasi" },
  { id: "K-02", code: "KORIDOR 2", name: "Terminal Notog — Alun-Alun — Baturraden", stopsCount: 18, headway: "15 mnt", fare: "Rp 5.000", status: "Beroperasi" },
  { id: "K-03", code: "KORIDOR 3", name: "Stasiun PWT — GOR Satria — Dukuhwaluh", stopsCount: 12, headway: "12 mnt", fare: "Rp 4.000", status: "Gangguan" },
];

const INITIAL_SCHEDULES = [
  { id: "JDW-101", route: "KORIDOR 1", fleet: "Bus Trans-04", departure: "06:00 WIB", arrival: "06:45 WIB", status: "Tepat Waktu" },
  { id: "JDW-102", route: "KORIDOR 1", fleet: "Bus Trans-07", departure: "06:15 WIB", arrival: "07:00 WIB", status: "Tepat Waktu" },
  { id: "JDW-103", route: "KORIDOR 2", fleet: "Bus Trans-11", departure: "06:30 WIB", arrival: "07:25 WIB", status: "Terlambat 5m" },
  { id: "JDW-104", route: "KORIDOR 3", fleet: "Bus Trans-02", departure: "07:00 WIB", arrival: "07:40 WIB", status: "Dijadwalkan" },
];

export default function AdminDashboard({ onExit }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [stops, setStops] = useState(INITIAL_STOPS);
  const [routes, setRoutes] = useState(INITIAL_ROUTES);
  const [schedules, setSchedules] = useState(INITIAL_SCHEDULES);

  // State Modal Tambah Data
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStop, setNewStop] = useState({ name: "", area: "", lat: "", lng: "", status: "Aktif" });
  const [newRoute, setNewRoute] = useState({ code: "", name: "", stopsCount: 10, headway: "10 mnt", fare: "Rp 4.000", status: "Beroperasi" });

  // Filter pencarian
  const filteredStops = useMemo(() => {
    return stops.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stops, searchQuery]);

  const filteredRoutes = useMemo(() => {
    return routes.filter(
      (r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [routes, searchQuery]);

  // Handler Tambah Halte
  function handleAddStop(e) {
    e.preventDefault();
    if (!newStop.name.trim()) return;
    const nextId = `HLT-0${stops.length + 1}`;
    setStops([{ id: nextId, ...newStop }, ...stops]);
    setNewStop({ name: "", area: "", lat: "", lng: "", status: "Aktif" });
    setIsModalOpen(false);
  }

  // Handler Tambah Rute
  function handleAddRoute(e) {
    e.preventDefault();
    if (!newRoute.name.trim()) return;
    const nextId = `K-0${routes.length + 1}`;
    setRoutes([{ id: nextId, ...newRoute }, ...routes]);
    setNewRoute({ code: "", name: "", stopsCount: 10, headway: "10 mnt", fare: "Rp 4.000", status: "Beroperasi" });
    setIsModalOpen(false);
  }

  function toggleStopStatus(id) {
    setStops((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: item.status === "Aktif" ? "Maintenance" : "Aktif" } : item
      )
    );
  }

  function deleteStop(id) {
    setStops((prev) => prev.filter((item) => item.id !== id));
  }

  function deleteRoute(id) {
    setRoutes((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="adm-layout">
      {/* SIDEBAR */}
      <aside className="adm-sidebar">
        <div className="adm-brand">
          <div className="adm-brand-logo">S</div>
          <div>
            <h2>SmartStop</h2>
            <span>Admin Control</span>
          </div>
        </div>

        <nav className="adm-nav">
          <button
            className={`adm-nav-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
            Ringkasan
          </button>

          <button
            className={`adm-nav-item ${activeTab === "stops" ? "active" : ""}`}
            onClick={() => setActiveTab("stops")}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 21s-6-5.686-6-10a6 6 0 1 1 12 0c0 4.314-6 10-6 10z" />
              <circle cx="12" cy="11" r="2" />
            </svg>
            Data Halte
          </button>

          <button
            className={`adm-nav-item ${activeTab === "routes" ? "active" : ""}`}
            onClick={() => setActiveTab("routes")}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="6" cy="19" r="3" />
              <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
              <circle cx="18" cy="5" r="3" />
            </svg>
            Rute & Koridor
          </button>

          <button
            className={`adm-nav-item ${activeTab === "schedules" ? "active" : ""}`}
            onClick={() => setActiveTab("schedules")}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
            Jadwal Armada
          </button>
        </nav>

        <div className="adm-sidebar-footer">
          <div className="adm-user-card">
            <div className="adm-avatar">AD</div>
            <div className="adm-user-info">
              <strong>Admin Dishub</strong>
              <span>operator@smartstop.id</span>
            </div>
          </div>
          <button
            className="adm-logout-btn"
            onClick={() => {
              if (onExit) onExit();
              else window.location.hash = "masuk";
            }}
          >
            Keluar ke Portal
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="adm-main">
        <header className="adm-topbar">
          <div>
            <h1>
              {activeTab === "overview" && "Ringkasan Operasional"}
              {activeTab === "stops" && "Manajemen Titik Halte"}
              {activeTab === "routes" && "Manajemen Rute & Koridor"}
              {activeTab === "schedules" && "Jadwal Keberangkatan Bus"}
            </h1>
            <p>Sistem pemantauan transportasi publik SmartStop real-time</p>
          </div>

          <div className="adm-topbar-actions">
            {activeTab !== "overview" && (
              <input
                type="text"
                className="adm-search"
                placeholder="Cari kode, nama halte, atau rute..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            )}
            {(activeTab === "stops" || activeTab === "routes") && (
              <button className="adm-btn-primary" onClick={() => setIsModalOpen(true)}>
                + Tambah {activeTab === "stops" ? "Halte" : "Rute"}
              </button>
            )}
          </div>
        </header>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="adm-content">
            <section className="adm-stats-grid">
              <div className="adm-stat-card">
                <span className="adm-stat-label">Total Halte Terdaftar</span>
                <div className="adm-stat-value">{stops.length}</div>
                <span className="adm-stat-trend positive">
                  {stops.filter((s) => s.status === "Aktif").length} beroperasi aktif
                </span>
              </div>
              <div className="adm-stat-card">
                <span className="adm-stat-label">Koridor Aktif</span>
                <div className="adm-stat-value">{routes.length}</div>
                <span className="adm-stat-trend positive">100% jalur terhubung</span>
              </div>
              <div className="adm-stat-card">
                <span className="adm-stat-label">Armada Beroperasi</span>
                <div className="adm-stat-value">18 Unit</div>
                <span className="adm-stat-trend neutral">2 unit cadangan di pool</span>
              </div>
              <div className="adm-stat-card">
                <span className="adm-stat-label">Estimasi Penumpang Hari Ini</span>
                <div className="adm-stat-value">2.480</div>
                <span className="adm-stat-trend positive">+12.4% dari kemarin</span>
              </div>
            </section>

            <section className="adm-panel">
              <div className="adm-panel-header">
                <h3>Status Keberangkatan Terkini</h3>
                <button className="adm-link-btn" onClick={() => setActiveTab("schedules")}>
                  Lihat Semua Jadwal →
                </button>
              </div>
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>ID Jadwal</th>
                      <th>Koridor</th>
                      <th>Armada</th>
                      <th>Berangkat</th>
                      <th>Tiba</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((item) => (
                      <tr key={item.id}>
                        <td className="adm-mono">{item.id}</td>
                        <td><strong>{item.route}</strong></td>
                        <td>{item.fleet}</td>
                        <td>{item.departure}</td>
                        <td>{item.arrival}</td>
                        <td>
                          <span className={`adm-badge ${item.status.includes("Terlambat") ? "warning" : "success"}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: DATA HALTE */}
        {activeTab === "stops" && (
          <div className="adm-content">
            <section className="adm-panel">
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Kode</th>
                      <th>Nama Halte</th>
                      <th>Wilayah / Kecamatan</th>
                      <th>Koordinat</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStops.map((stop) => (
                      <tr key={stop.id}>
                        <td className="adm-mono">{stop.id}</td>
                        <td><strong>{stop.name}</strong></td>
                        <td>{stop.area}</td>
                        <td className="adm-mono">{stop.lat}, {stop.lng}</td>
                        <td>
                          <span className={`adm-badge ${stop.status === "Aktif" ? "success" : "warning"}`}>
                            {stop.status}
                          </span>
                        </td>
                        <td className="adm-actions-cell">
                          <button className="adm-btn-sm" onClick={() => toggleStopStatus(stop.id)}>
                            Ubah Status
                          </button>
                          <button className="adm-btn-sm danger" onClick={() => deleteStop(stop.id)}>
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* TAB 3: RUTE & KORIDOR */}
        {activeTab === "routes" && (
          <div className="adm-content">
            <section className="adm-panel">
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Kode Koridor</th>
                      <th>Trayek / Rute Utama</th>
                      <th>Jumlah Halte</th>
                      <th>Headway</th>
                      <th>Tarif</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoutes.map((route) => (
                      <tr key={route.id}>
                        <td className="adm-mono"><strong>{route.code}</strong></td>
                        <td>{route.name}</td>
                        <td>{route.stopsCount} Halte</td>
                        <td>{route.headway}</td>
                        <td>{route.fare}</td>
                        <td>
                          <span className={`adm-badge ${route.status === "Beroperasi" ? "success" : "danger"}`}>
                            {route.status}
                          </span>
                        </td>
                        <td>
                          <button className="adm-btn-sm danger" onClick={() => deleteRoute(route.id)}>
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* TAB 4: JADWAL ARMADA */}
        {activeTab === "schedules" && (
          <div className="adm-content">
            <section className="adm-panel">
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>ID Jadwal</th>
                      <th>Koridor</th>
                      <th>Armada Bus</th>
                      <th>Jam Berangkat</th>
                      <th>Estimasi Tiba</th>
                      <th>Ketepatan Waktu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((item) => (
                      <tr key={item.id}>
                        <td className="adm-mono">{item.id}</td>
                        <td><strong>{item.route}</strong></td>
                        <td>{item.fleet}</td>
                        <td>{item.departure}</td>
                        <td>{item.arrival}</td>
                        <td>
                          <span className={`adm-badge ${item.status.includes("Terlambat") ? "warning" : "success"}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* MODAL TAMBAH DATA */}
      {isModalOpen && (
        <div className="adm-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Tambah {activeTab === "stops" ? "Halte Baru" : "Koridor Baru"}</h3>

            {activeTab === "stops" ? (
              <form onSubmit={handleAddStop} className="adm-form">
                <label>
                  Nama Halte
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Halte Pasar Wage"
                    value={newStop.name}
                    onChange={(e) => setNewStop({ ...newStop, name: e.target.value })}
                  />
                </label>
                <label>
                  Wilayah / Kecamatan
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Purwokerto Timur"
                    value={newStop.area}
                    onChange={(e) => setNewStop({ ...newStop, area: e.target.value })}
                  />
                </label>
                <div className="adm-form-row">
                  <label>
                    Latitude
                    <input
                      type="text"
                      placeholder="-7.4251"
                      value={newStop.lat}
                      onChange={(e) => setNewStop({ ...newStop, lat: e.target.value })}
                    />
                  </label>
                  <label>
                    Longitude
                    <input
                      type="text"
                      placeholder="109.2391"
                      value={newStop.lng}
                      onChange={(e) => setNewStop({ ...newStop, lng: e.target.value })}
                    />
                  </label>
                </div>
                <div className="adm-modal-actions">
                  <button type="button" className="adm-btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Batal
                  </button>
                  <button type="submit" className="adm-btn-primary">
                    Simpan Halte
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddRoute} className="adm-form">
                <label>
                  Kode Koridor
                  <input
                    type="text"
                    required
                    placeholder="Contoh: KORIDOR 4"
                    value={newRoute.code}
                    onChange={(e) => setNewRoute({ ...newRoute, code: e.target.value })}
                  />
                </label>
                <label>
                  Trayek / Nama Rute
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Sokaraja — Alun-Alun — Karanglewas"
                    value={newRoute.name}
                    onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })}
                  />
                </label>
                <div className="adm-form-row">
                  <label>
                    Headway
                    <input
                      type="text"
                      value={newRoute.headway}
                      onChange={(e) => setNewRoute({ ...newRoute, headway: e.target.value })}
                    />
                  </label>
                  <label>
                    Tarif
                    <input
                      type="text"
                      value={newRoute.fare}
                      onChange={(e) => setNewRoute({ ...newRoute, fare: e.target.value })}
                    />
                  </label>
                </div>
                <div className="adm-modal-actions">
                  <button type="button" className="adm-btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Batal
                  </button>
                  <button type="submit" className="adm-btn-primary">
                    Simpan Koridor
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}