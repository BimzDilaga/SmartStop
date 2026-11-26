import React, { useState } from "react";
import { matches } from "./data.js";
import { Badge, DataTable, PageHeading, Panel, RouteSummary, Search, Stats, TableFooter } from "./ui.jsx";

export default function Overview({ data, navigate }) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(data.routes[0].id);
  const selected = data.routes.find(route => route.id === selectedId) || data.routes[0];
  const results = data.routes.filter(route => matches(search, route.id, route.name, ...route.stopIds.map(id => data.stops.find(stop => stop.id === id)?.name)));
  const newFeedback = data.feedback.filter(item => item.status === "Baru");
  return <>
    <PageHeading title="Dashboard" description="Kelola layanan Trans Jateng Banyumas–Purbalingga dari satu tempat." action={<button className="admin-button" onClick={() => navigate("jadwal", { create: true })}>+ Tambah jadwal</button>} />
    <Stats items={[["Jadwal contoh", data.schedules.length, "Atur hari dan jam keberangkatan"], ["Rute tersimpan", data.routes.length, "Lihat asal dan tujuan"], ["Entri halte / arah", data.routes.reduce((sum, route) => sum + route.stopIds.length, 0), "Termasuk titik asal setiap arah"], ["Masukan baru", newFeedback.length, "Perlu ditanggapi"]]} />
    <Panel title="Rute & jadwal" description={`${data.routes.length} arah perjalanan · Kelola lintasan dan hari layanan`} action={<button className="admin-button" onClick={() => navigate("rute", { create: true })}>+ Tambah rute</button>} className="admin-list-panel">
      <div className="admin-filters"><Search value={search} onChange={setSearch} placeholder="Cari nama rute, terminal, atau titik singgah" /><span className="admin-filter-label">Banyumas–Purbalingga</span><span className="admin-muted">Data contoh</span></div>
      <DataTable columns={[{ key: "code", label: "Kode" }, { key: "route", label: "Asal → tujuan" }, { key: "departure", label: "Berangkat" }, { key: "arrival", label: "Tiba (est.)" }, { key: "stops", label: "Titik singgah" }, { key: "status", label: "Status" }, { key: "action", label: "Aksi" }]} rows={results.map(route => {
        const schedule = data.schedules.find(item => item.routeId === route.id);
        const via = route.stopIds.some(id => data.stops.find(stop => stop.id === id)?.name === "Terminal Purbalingga");
        return { id: route.id, selected: route.id === selected.id, code: <strong className="admin-accent">{route.id}</strong>, route: <><strong>{route.name}</strong><small>{via ? "Via Terminal Purbalingga · " : ""}Arah {route.direction.toLowerCase()}</small></>, departure: schedule?.departure || "—", arrival: schedule?.arrival || "—", stops: `${route.stopIds.length} titik`, status: <Badge>{route.status}</Badge>, action: <button className="admin-text-button" aria-label={"Detail rute " + route.id} aria-pressed={selected.id === route.id} onClick={() => setSelectedId(route.id)}>Detail</button> };
      })} />
      <TableFooter count={results.length} total={data.routes.length} />
    </Panel>
    <div className="admin-two-columns even">
      <Panel title={"Ringkasan rute " + selected.id} action={<Badge>{selected.status}</Badge>}><p className="admin-strong">{selected.name}</p><RouteSummary route={selected} stops={data.stops} /><p className="admin-form-hint">Jam dan durasi layanan menunggu verifikasi operator.</p><div className="admin-inline-actions"><button className="admin-button secondary" onClick={() => navigate("rute", { id: selected.id })}>Ubah rute</button><button className="admin-button" onClick={() => navigate("jadwal", { routeId: selected.id })}>Atur jadwal</button></div></Panel>
      <Panel title="Apa yang bisa dikelola?"><div className="admin-quick-links">{[["jadwal", "Jadwal", "Atur armada, hari layanan, dan jam berangkat."], ["rute", "Rute", "Tentukan asal, tujuan, dan urutan titik singgah."], ["halte", "Titik singgah", "Lengkapi nama, jenis, dan lokasi halte."], ["informasi", "Informasi layanan", "Tulis panduan, perubahan rute, dan pengumuman."]].map(([page, title, text]) => <button key={page} onClick={() => navigate(page)}><strong>{title}</strong><span>{text}</span></button>)}</div><p className="admin-accent admin-form-hint">Simpan sebagai draf sebelum dipublikasikan.</p></Panel>
    </div>
    <Panel title="Masukan warga" description={`${data.feedback.length} masukan contoh · ${newFeedback.length} belum ditanggapi`} action={<button className="admin-text-button" onClick={() => navigate("masukan")}>Lihat semua masukan</button>}><div className="admin-feedback-cards">{(newFeedback.length ? newFeedback : data.feedback.slice(0, 1)).map(item => <article key={item.id}><div><strong>{item.sender}</strong><Badge>{item.status}</Badge></div><p>{item.message}</p><button className="admin-text-button" onClick={() => navigate("masukan", { id: item.id })}>Beri tanggapan</button></article>)}</div></Panel>
  </>;
}
