import React, { useRef, useState } from "react";
import ServiceLayout, { DemoNote, ServiceIcon, ServiceStats, TravelGuidelines } from "./ServiceLayout.jsx";
import { stationHubs } from "./serviceData.js";
import { routeDirections } from "./transit.js";

export default function CorridorPage({ name, category, fleet, onOpenMap, initialReverse = false, hubs = stationHubs, isDemo = true }) {
  const [filter, setFilter] = useState("semua");
  const [query, setQuery] = useState("");
  const [directionId, setDirectionId] = useState(initialReverse ? "bulupitu" : "bukateja");
  const [selectedId, setSelectedId] = useState("bulupitu");
  const diagram = useRef(null);
  const direction = routeDirections.find(item => item.id === directionId);
  const points = hubs.filter(hub => hub.stops[directionId]).sort((a, b) => direction.stops.indexOf(a.stops[directionId]) - direction.stops.indexOf(b.stops[directionId]));
  const selected = points.find(hub => hub.id === selectedId) || points[0];
  const selectedIndex = selected ? direction.stops.indexOf(selected.stops[directionId]) : -1;
  const diagramNodes = points.map((hub, index) => ({ ...hub, x: 70 + index * 860 / Math.max(1, points.length - 1), y: index === points.length - 1 ? 55 : [110, 85, 50, 68, 70][index % 5] }));
  const diagramPath = diagramNodes.map((node, index) => {
    if (!index) return `M${node.x} ${node.y}`;
    const previous = diagramNodes[index - 1];
    const midpoint = (previous.x + node.x) / 2;
    return `C${midpoint} ${previous.y} ${midpoint} ${node.y} ${node.x} ${node.y}`;
  }).join(" ");
  const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
  const results = hubs.filter(hub => (filter === "semua" || hub.stops[filter]) && [hub.name, hub.subtitle, hub.type, hub.connection, hub.feature, ...Object.values(hub.stops)].join(" ").toLocaleLowerCase("id-ID").includes(normalizedQuery));

  function inspect(hub) {
    if (!hub.stops[directionId]) setDirectionId(Object.keys(hub.stops)[0]);
    setSelectedId(hub.id);
    diagram.current?.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    diagram.current?.querySelector("h2")?.focus({ preventScroll: true });
  }
  function openStop(hub, id = directionId) {
    const targetDirection = hub.stops[id] ? id : Object.keys(hub.stops)[0];
    const bus = fleet.find(item => item.direction === targetDirection);
    if (bus) onOpenMap(bus.id, hub.stops[targetDirection]);
    else location.hash = "peta";
  }

  if (!selected) return <ServiceLayout name={name} category={category} page="koridor"><div className="service-empty"><h1 tabIndex="-1">Simpul koridor belum tersedia.</h1><p>Data simpul akan tampil setelah informasi rute tersedia.</p><a className="service-button" href="#peta">Lihat peta halte</a></div></ServiceLayout>;

  return <ServiceLayout name={name} category={category} page="koridor">
    <div className="service-page-heading"><div><p className="service-eyebrow">JARINGAN PERJALANAN SMARTSTOP</p><h1 tabIndex="-1">Satu koridor.<br /><span>Banyak tujuan.</span></h1><p>Kenali titik singgah utama di antara Purwokerto, Purbalingga, dan Bukateja sebelum memulai perjalanan.</p></div><div className="service-heading-badge"><ServiceIcon name="route" /><span>Koridor 1<strong>Bulupitu ↔ Bukateja</strong></span></div></div>
    <ServiceStats items={[
      { label: "ARMADA TERDAFTAR", value: fleet.length + " Bus", description: isDemo ? "Armada pada data contoh" : "Armada pada laporan server", icon: "bus" },
      { label: "PANJANG LINTASAN", value: "±39 KM", description: "Jarak referensi desain", icon: "route" },
      { label: "ARAH PERJALANAN", value: routeDirections.length + " Arah", description: "Lintasan pergi dan pulang berbeda", icon: "map" },
      { label: "URUTAN TITIK SINGGAH", value: routeDirections.reduce((sum, item) => sum + item.stops.length, 0) + " Entri", description: "24 arah Bukateja · 44 arah Bulupitu", icon: "pin" }
    ]} />
    <div className="corridor-search-panel" data-reveal><div className="service-tabs" role="group" aria-label="Filter katalog koridor">{[["semua", "Semua simpul"], ["bukateja", "Ke Bukateja"], ["bulupitu", "Ke Bulupitu"]].map(([id, text]) => <button key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>{text}</button>)}</div><label className="service-search"><ServiceIcon name="search" /><span className="visually-hidden">Cari simpul koridor</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari terminal, halte utama, atau fasilitas…" /></label></div>
    <section className="service-section corridor-catalog"><div className="service-section-heading"><div><p className="service-eyebrow">TEMUKAN TITIK SINGGAHMU</p><h2>Katalog rute & simpul utama.</h2><p className="service-description">Lihat skema lintasan atau lanjutkan ke peta halte untuk memantau bus.</p></div><span className="service-result-count" role="status">{results.length} simpul ditampilkan</span></div>
      <div className="hub-card-grid">{results.map(hub => <article className="hub-card" key={hub.id} data-reveal><div className="hub-card-heading"><span className="hub-type-icon"><ServiceIcon name={hub.type === "Terminal" ? "bus" : "pin"} /></span><div><h3>{hub.name}</h3><p>{hub.subtitle}</p></div><span className="service-tag">{hub.type}</span></div><div className="hub-card-image"><img src={hub.photo} alt="Ilustrasi layanan bus pada koridor Trans Jateng" loading="lazy" width="550" height="220" /><span>Foto ilustrasi koridor</span></div><div className="hub-facts"><div><small>LAYANAN</small><strong>{hub.feature}</strong></div><div><small>ARAH TERSEDIA</small><strong>{Object.keys(hub.stops).length === 2 ? "Pergi & pulang" : hub.stops.bukateja ? "Ke Bukateja" : "Ke Bulupitu"}</strong></div></div><div className="hub-connection"><small>KONEKTIVITAS</small><p>{hub.connection}</p></div><div className="hub-card-actions"><button className="service-text-button" onClick={() => openStop(hub)}>Lihat peta halte</button><button className="service-button small" onClick={() => inspect(hub)}>Skematik</button></div></article>)}</div>
      {!results.length && <div className="service-empty" role="status"><ServiceIcon name="search" /><h3>Simpul belum ditemukan</h3><p>Coba kata pencarian lain atau tampilkan semua arah.</p><button className="service-button secondary" onClick={() => { setQuery(""); setFilter("semua"); }}>Atur ulang pencarian</button></div>}
    </section>
    <section className="service-section corridor-topology" ref={diagram} data-reveal><div className="service-section-heading"><div><p className="service-eyebrow">PAHAMI URUTAN PERJALANAN</p><h2 tabIndex="-1">Skematik koneksi antarhalte.</h2><p className="service-description">Pilih simpul untuk melihat letaknya dalam urutan rute.</p></div><div className="service-tabs" role="group" aria-label="Arah skematik">{routeDirections.map(item => <button key={item.id} aria-pressed={directionId === item.id} onClick={() => setDirectionId(item.id)}>{item.id === "bukateja" ? "Ke Bukateja" : "Ke Bulupitu"}</button>)}</div></div>
      <div className="topology-visual"><div className="topology-caption"><span><ServiceIcon name="route" />{direction.title}</span><span>Skema urutan · bukan elevasi atau jarak geografis</span></div><div className="topology-scroll"><div className="topology-line"><svg viewBox="0 0 1000 160" preserveAspectRatio="none" aria-hidden="true"><path className="topology-route-shadow" d={diagramPath} /><path className="topology-route" pathLength="1" d={diagramPath} /></svg><div className="topology-nodes">{diagramNodes.map(hub => <button key={hub.id} className={hub.id === selected.id ? "is-selected" : ""} style={{ left: hub.x / 10 + "%", top: hub.y - 14 + "px" }} aria-pressed={hub.id === selected.id} onClick={() => setSelectedId(hub.id)}><span><ServiceIcon name={hub.id === selected.id ? "pin" : "bus"} /></span><strong>{hub.name}</strong><small>Titik {direction.stops.indexOf(hub.stops[directionId]) + 1}</small></button>)}</div></div></div><div className="topology-selection" key={selected.id + directionId}><span className="hub-type-icon"><ServiceIcon name="pin" /></span><div><small>SIMPUL DIPILIH</small><h3>{selected.name}</h3><p>{selectedIndex === 0 ? "Awal lintasan" : "Sebelumnya: " + direction.stops[selectedIndex - 1]} · {selectedIndex === direction.stops.length - 1 ? "Akhir lintasan" : "Berikutnya: " + direction.stops[selectedIndex + 1]}</p></div><button className="service-button" onClick={() => openStop(selected)}>Pantau di peta</button></div></div>
      <DemoNote>Skema menjelaskan hubungan dan urutan halte. Posisi bus serta estimasi tiba dapat dilihat di Peta Halte.</DemoNote>
      <div className="corridor-service-links"><div><ServiceIcon name="map" /><h3>Pahami rutenya, lalu pantau busnya.</h3><p>Laporan posisi dan kepadatan bus tersedia pada halaman peta halte.</p><a className="service-text-button" href="#peta">Buka peta halte</a></div><div><ServiceIcon name="ticket" /><h3>Siapkan tiket perjalananmu.</h3><p>Tentukan halte naik dan tujuan pada arah yang sama sebelum memesan.</p><a className="service-text-button" href="#tiket">Pilih tiket perjalanan</a></div></div>
    </section>
    <TravelGuidelines /><DemoNote />
  </ServiceLayout>;
}
