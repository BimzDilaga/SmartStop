import React, { useRef, useState } from "react";
import { BusPicker } from "../RoutePickers.jsx";
import { dayNames, matches, newId } from "./data.js";
import { AdminDialog, Badge, DataTable, Field, Filter, FormActions, PageHeading, Panel, RouteSummary, Search, Stats, TableFooter, useEditor } from "./ui.jsx";

function focusEditor(ref) {
  ref.current?.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  ref.current?.querySelector("input,select")?.focus({ preventScroll: true });
}

export function SchedulesPage({ data, save, guard, onDirty, intent }) {
  const blank = () => ({ id: "", routeId: data.routes[0]?.id || "", fleet: "", days: [], departure: "", arrival: "", status: "Draf" });
  const first = intent?.create ? blank() : data.schedules.find(item => item.id === intent?.id || item.routeId === intent?.routeId) || data.schedules[0] || blank();
  const editor = useEditor(first, onDirty);
  const { draft, change, reset, dirty } = editor;
  const [search, setSearch] = useState("");
  const [day, setDay] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const form = useRef(null);
  const selectedRoute = data.routes.find(route => route.id === draft.routeId);
  const results = data.schedules.filter(item => {
    const route = data.routes.find(route => route.id === item.routeId);
    return matches(search, item.id, route?.id, route?.name) && (!day || item.days.includes(day)) && (!status || item.status === status);
  });
  const begin = record => guard(() => { reset(record); setError(""); focusEditor(form); });
  function submit(event) {
    event.preventDefault();
    if (draft.departure && draft.arrival && draft.arrival <= draft.departure) {
      setError("Estimasi tiba harus setelah jam berangkat pada hari yang sama. Semua waktu menggunakan WIB.");
      return;
    }
    const record = { ...draft, id: draft.id || newId("JDW") };
    save("schedules", record);
    reset(record);
    setError("");
  }
  return <>
    <PageHeading title="Kelola Jadwal" description="Atur hari layanan, armada, dan waktu keberangkatan." action={<button className="admin-button" onClick={() => begin(blank())}>+ Tambah jadwal</button>} />
    <Stats items={[["Total jadwal", data.schedules.length, "Seluruh jadwal contoh"], ["Jadwal draf", data.schedules.filter(item => item.status === "Draf").length, "Belum dipublikasikan"], ["Rute terjadwal", new Set(data.schedules.map(item => item.routeId)).size, "Arah perjalanan terdaftar"], ["Zona waktu", "WIB", "Jam layanan setempat"]]} />
    <Panel title="Daftar jadwal" description="Jadwal menunggu verifikasi operator" className="admin-list-panel">
      <div className="admin-filters"><Search value={search} onChange={setSearch} placeholder="Cari kode atau nama rute" /><Filter label="Filter hari layanan" value={day} onChange={setDay} options={[["", "Semua hari"], ...dayNames]} /><Filter label="Filter status jadwal" value={status} onChange={setStatus} options={[["", "Semua status"], "Draf"]} /></div>
      <DataTable columns={[{ key: "code", label: "Kode" }, { key: "route", label: "Rute" }, { key: "days", label: "Hari layanan" }, { key: "departure", label: "Berangkat" }, { key: "arrival", label: "Tiba (est.)" }, { key: "status", label: "Status" }, { key: "action", label: "Aksi" }]} rows={results.map(item => {
        const route = data.routes.find(route => route.id === item.routeId);
        return { id: item.id, selected: item.id === draft.id, code: <strong className="admin-accent">{route?.id}</strong>, route: <><strong>{route?.name || "Rute belum tersedia"}</strong><small>{route?.stopIds.length || 0} titik · {item.fleet ? "Bus " + item.fleet : "Armada belum dipilih"}</small></>, days: item.days.length ? item.days.join(", ") : "Belum diisi", departure: item.departure || "—", arrival: item.arrival || "—", status: <Badge>{item.status}</Badge>, action: <button className="admin-text-button" aria-label={"Ubah jadwal " + item.id} onClick={() => begin(item)}>Ubah</button> };
      })} /><TableFooter count={results.length} total={data.schedules.length} />
    </Panel>
    <div className="admin-two-columns">
      <Panel title={draft.id ? "Ubah jadwal " + (selectedRoute?.id || "") : "Tambah jadwal"} description="Perubahan disimpan sebagai draf sebelum dipublikasikan." action={<Badge>Draf</Badge>}><form ref={form} className="admin-editor" onSubmit={submit}>
        <Field label="Rute perjalanan"><select required value={draft.routeId} onChange={event => change({ routeId: event.target.value })}>{data.routes.map(route => <option key={route.id} value={route.id}>{route.id} — {route.name}</option>)}</select></Field>
        <div className="admin-field"><span>Kendaraan / armada</span><BusPicker value={draft.fleet} onChange={fleet => change({ fleet })} placeholder="Pilih kendaraan" /><small>Armada dan foto contoh untuk demonstrasi.</small></div>
        <fieldset className="admin-days"><legend>Hari layanan</legend><div>{dayNames.map(item => <button type="button" key={item} aria-pressed={draft.days.includes(item)} onClick={() => change({ days: dayNames.filter(name => name === item ? !draft.days.includes(name) : draft.days.includes(name)) })}>{item}</button>)}</div></fieldset>
        <div className="admin-field-row"><Field label="Jam berangkat (WIB)"><input type="time" value={draft.departure} onInput={event => change({ departure: event.currentTarget.value })} onChange={event => change({ departure: event.target.value })} /></Field><Field label="Estimasi tiba (WIB)"><input type="time" value={draft.arrival} onInput={event => change({ arrival: event.currentTarget.value })} onChange={event => change({ arrival: event.target.value })} /></Field></div>
        {error && <p className="admin-form-error" role="alert">{error}</p>}
        <p className="admin-form-hint">Draf boleh belum lengkap. Jam, hari layanan, dan armada harus diverifikasi sebelum publikasi.</p>
        <FormActions dirty={dirty} onCancel={() => begin(data.schedules.find(item => item.id === draft.id) || blank())} />
      </form></Panel>
      <Panel title="Ringkasan perjalanan"><RouteSummary route={selectedRoute} stops={data.stops} /><div className="admin-callout"><strong>Sebelum dipublikasikan</strong><p>Pilih armada dan verifikasi jam di setiap titik singgah. Pastikan hari layanan sudah sesuai.</p></div><p className="admin-form-hint">Jadwal demo belum tampil sebagai layanan resmi di website.</p></Panel>
    </div>
  </>;
}

function RouteEditor({ record, data, onSave, onDirty, onCancel }) {
  const { draft, change, dirty } = useEditor(record, onDirty);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const candidates = data.stops.filter(stop => !draft.stopIds.includes(stop.id) && matches(query, stop.id, stop.name));
  function move(index, delta) {
    const ids = [...draft.stopIds];
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    change({ stopIds: ids });
  }
  return <form className="admin-editor" onSubmit={event => {
    event.preventDefault();
    if (draft.stopIds.length < 2) { setError("Pilih setidaknya dua titik singgah untuk asal dan tujuan."); return; }
    if (!draft.id.trim() || !draft.name.trim()) { setError("Kode dan nama rute harus diisi."); return; }
    if (data.routes.some(route => route.id === draft.id.trim() && route.id !== record.id)) { setError("Kode rute sudah digunakan. Pilih kode lain."); return; }
    onSave({ ...draft, id: draft.id.trim().toUpperCase(), name: draft.name.trim() });
  }}>
    <div className="admin-field-row"><Field label="Kode rute"><input required data-initial-focus value={draft.id} readOnly={Boolean(record.id)} maxLength={24} placeholder="Contoh: K2-P" onChange={event => change({ id: event.target.value.toUpperCase() })} /></Field><Field label="Arah perjalanan"><select value={draft.direction} onChange={event => change({ direction: event.target.value })}><option>Pergi</option><option>Pulang</option></select></Field></div>
    <Field label="Nama rute"><input required maxLength={100} value={draft.name} onChange={event => change({ name: event.target.value })} placeholder="Contoh: Bulupitu → Bukateja" /></Field>
    <div className="admin-field-row"><Field label="Wilayah"><input required value={draft.area} maxLength={100} onChange={event => change({ area: event.target.value })} /></Field><Field label="Durasi estimasi (menit)"><input type="number" min="1" max="1440" value={draft.duration} placeholder="Belum diisi" onChange={event => change({ duration: event.target.value })} /></Field></div>
    <div className="admin-route-editor"><h3>Urutan titik singgah <span>{draft.stopIds.length} titik</span></h3><p>Posisi pertama menjadi asal, posisi terakhir menjadi tujuan.</p>
      <ol className="admin-sort-stops">{draft.stopIds.map((id, index) => <li key={id}><span>{index === 0 ? "OD" : String(index).padStart(2, "0")}</span><strong>{data.stops.find(stop => stop.id === id)?.name}</strong><div><button type="button" disabled={index === 0} aria-label={"Naikkan " + data.stops.find(stop => stop.id === id)?.name} onClick={() => move(index, -1)}>↑</button><button type="button" disabled={index === draft.stopIds.length - 1} aria-label={"Turunkan " + data.stops.find(stop => stop.id === id)?.name} onClick={() => move(index, 1)}>↓</button><button type="button" aria-label={"Keluarkan " + data.stops.find(stop => stop.id === id)?.name + " dari rute"} onClick={() => change({ stopIds: draft.stopIds.filter(item => item !== id) })}>×</button></div></li>)}</ol>
      <Search value={query} onChange={setQuery} placeholder="Cari halte untuk ditambahkan" />
      <div className="admin-add-stops">{candidates.map(stop => <button type="button" key={stop.id} onClick={() => change({ stopIds: [...draft.stopIds, stop.id] })}><span><strong>{stop.name}</strong><small>{stop.id}</small></span><span>+</span></button>)}{!candidates.length && <p>Tidak ada halte lain yang cocok.</p>}</div>
    </div>
    {error && <p className="admin-form-error" role="alert">{error}</p>}
    <FormActions dirty={dirty} onCancel={onCancel} />
  </form>;
}

export function RoutesPage({ data, save, guard, onDirty, intent }) {
  const blank = () => ({ id: "", name: "", area: "Banyumas–Purbalingga", direction: "Pergi", duration: "", status: "Draf", stopIds: [] });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [direction, setDirection] = useState("");
  const [editing, setEditing] = useState(() => intent?.create ? blank() : data.routes.find(item => item.id === intent?.id) || null);
  const results = data.routes.filter(route => matches(search, route.id, route.name, route.area) && (!status || route.status === status) && (!direction || route.direction === direction));
  return <>
    <PageHeading title="Kelola Rute" description="Kelola dua arah Koridor 1 beserta urutan titik singgah." action={<button className="admin-button" onClick={() => setEditing(blank())}>+ Tambah rute</button>} />
    <Stats items={[["Total rute", data.routes.length, "Satu arah perjalanan per rute"], ["Rute draf", data.routes.filter(route => route.status === "Draf").length, "Jadwal belum diverifikasi"], ["Entri halte / arah", data.routes.reduce((sum, route) => sum + route.stopIds.length, 0), "Dihitung dari urutan setiap rute"], ["Wilayah", "Banyumas–PBG", "Dua kabupaten"]]} />
    <Panel title="Daftar rute" description={`${data.routes.length} arah perjalanan · Termasuk titik asal setiap arah`} className="admin-list-panel"><div className="admin-filters"><Search value={search} onChange={setSearch} placeholder="Cari kode, asal, atau tujuan" /><Filter label="Filter arah rute" value={direction} onChange={setDirection} options={[["", "Semua arah"], "Pergi", "Pulang"]} /><Filter label="Filter status rute" value={status} onChange={setStatus} options={[["", "Semua status"], "Draf"]} /></div>
      <DataTable columns={[{ key: "code", label: "Kode" }, { key: "name", label: "Asal → tujuan" }, { key: "count", label: "Titik singgah" }, { key: "duration", label: "Durasi (est.)" }, { key: "status", label: "Status" }, { key: "action", label: "Aksi" }]} rows={results.map(route => ({ id: route.id, code: <strong className="admin-accent">{route.id}</strong>, name: <><strong>{route.name}</strong><small>{route.area} · Arah {route.direction.toLowerCase()}</small></>, count: route.stopIds.length + " titik", duration: route.duration ? route.duration + " menit" : "Belum diisi", status: <Badge>{route.status}</Badge>, action: <button className="admin-text-button" aria-label={"Ubah rute " + route.id} onClick={() => setEditing(route)}>Ubah</button> }))} /><TableFooter count={results.length} total={data.routes.length} /></Panel>
    <Panel title="Urutan lengkap titik singgah" description="Urutan arah pulang dapat berbeda dari arah pergi."><div className="admin-full-routes">{data.routes.map(route => <div key={route.id}><h3>{route.id} · Arah {route.direction.toLowerCase()} — {route.stopIds.length} titik</h3><ol>{route.stopIds.map((id, index) => <li key={id}><span>{index === 0 ? "OD" : String(index).padStart(2, "0")}</span><span>{data.stops.find(stop => stop.id === id)?.name}</span></li>)}</ol></div>)}</div></Panel>
    <AdminDialog open={Boolean(editing)} onClose={() => setEditing(null)} requestClose={close => guard(close)} title={editing?.id ? "Ubah rute " + editing.id : "Tambah rute"} description="Atur titik singgah dan urutannya. Penyimpanan hanya pada demo ini.">{close => editing && <RouteEditor key={editing.id || "new"} record={editing} data={data} onDirty={onDirty} onCancel={() => guard(close)} onSave={record => { save("routes", record); onDirty(false); close(); }} />}</AdminDialog>
  </>;
}

export function StopsPage({ data, save, guard, onDirty }) {
  const blank = () => ({ id: "", name: "", type: "Halte portabel", area: "Banyumas", address: "", lat: "", lng: "", verified: false });
  const { draft, change, reset, dirty } = useEditor(data.stops[1] || blank(), onDirty);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [area, setArea] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const form = useRef(null);
  const results = data.stops.filter(stop => matches(search, stop.id, stop.name, stop.address) && (!type || stop.type === type) && (!area || stop.area === area));
  const pages = Math.max(1, Math.ceil(results.length / 8));
  const shownPage = Math.min(page, pages);
  const visible = results.slice((shownPage - 1) * 8, shownPage * 8);
  const uses = data.routes.filter(route => route.stopIds.includes(draft.id));
  const begin = record => guard(() => { reset(record); setError(""); focusEditor(form); });
  function submit(event) {
    event.preventDefault();
    if (!draft.name.trim()) { setError("Nama titik singgah wajib diisi."); return; }
    if ((draft.lat === "") !== (draft.lng === "")) { setError("Isi latitude dan longitude bersama-sama, atau kosongkan keduanya untuk draf."); return; }
    const record = { ...draft, id: draft.id || newId("HLT"), name: draft.name.trim(), verified: false };
    save("stops", record);
    reset(record);
    setError("");
  }
  return <>
    <PageHeading title="Titik Singgah" description="Kelola nama, urutan, dan petunjuk lokasi halte." action={<button className="admin-button" onClick={() => begin(blank())}>+ Tambah titik</button>} />
    <Stats items={[["Entri halte", data.stops.length, "Data titik singgah tersimpan"], ["Arah pergi", data.routes.filter(route => route.direction === "Pergi").reduce((sum, route) => sum + route.stopIds.length, 0), "Bulupitu → Bukateja"], ["Arah pulang", data.routes.filter(route => route.direction === "Pulang").reduce((sum, route) => sum + route.stopIds.length, 0), "Bukateja → Bulupitu"], ["Arah perjalanan", data.routes.length, "Urutan lengkap di Kelola Rute"]]} />
    <Panel title="Daftar titik singgah" description="Cari lokasi dan lengkapi petunjuk titik naik." className="admin-list-panel"><div className="admin-filters"><Search value={search} onChange={value => { setSearch(value); setPage(1); }} placeholder="Cari nama terminal atau titik singgah" /><Filter label="Filter jenis lokasi" value={type} onChange={value => { setType(value); setPage(1); }} options={[["", "Semua jenis"], "Terminal bus", "Halte portabel"]} /><Filter label="Filter wilayah halte" value={area} onChange={value => { setArea(value); setPage(1); }} options={[["", "Semua wilayah"], "Banyumas", "Purbalingga"]} /></div>
      <DataTable columns={[{ key: "code", label: "Kode" }, { key: "name", label: "Nama lokasi" }, { key: "type", label: "Jenis" }, { key: "area", label: "Wilayah" }, { key: "status", label: "Titik naik" }, { key: "action", label: "Aksi" }]} rows={visible.map(stop => ({ id: stop.id, selected: stop.id === draft.id, code: <strong className="admin-accent">{stop.id}</strong>, name: <strong>{stop.name}</strong>, type: stop.type, area: stop.area, status: <Badge>{stop.verified ? "Terverifikasi" : "Belum diverifikasi"}</Badge>, action: <button className="admin-text-button" aria-label={"Ubah halte " + stop.id} onClick={() => begin(stop)}>Ubah</button> }))} /><TableFooter count={visible.length} total={results.length} page={shownPage} pages={pages} onPage={setPage} /></Panel>
    <div className="admin-two-columns"><Panel title={draft.id ? "Ubah titik singgah" : "Tambah titik singgah"} description={draft.id ? draft.id + " · " + draft.name : "Siapkan titik singgah baru sebagai draf."}><form className="admin-editor" ref={form} onSubmit={submit}>
      <div className="admin-field-row"><Field label="Nama titik singgah"><input required maxLength={100} value={draft.name} onChange={event => change({ name: event.target.value })} /></Field><Field label="Jenis lokasi"><select value={draft.type} onChange={event => change({ type: event.target.value })}><option>Halte portabel</option><option>Terminal bus</option></select></Field></div>
      <Field label="Wilayah"><select value={draft.area} onChange={event => change({ area: event.target.value })}><option>Banyumas</option><option>Purbalingga</option></select></Field>
      <Field label="Alamat / petunjuk titik naik"><textarea rows={3} maxLength={500} placeholder="Tambahkan petunjuk lokasi setelah diverifikasi." value={draft.address} onChange={event => change({ address: event.target.value })} /></Field>
      <div className="admin-field-row"><Field label="Latitude"><input type="number" step="any" min="-90" max="90" placeholder="Belum diisi" value={draft.lat} onChange={event => change({ lat: event.target.value })} /></Field><Field label="Longitude"><input type="number" step="any" min="-180" max="180" placeholder="Belum diisi" value={draft.lng} onChange={event => change({ lng: event.target.value })} /></Field></div>
      {error && <p className="admin-form-error" role="alert">{error}</p>}<FormActions dirty={dirty} onCancel={() => begin(data.stops.find(stop => stop.id === draft.id) || blank())} />
    </form></Panel><Panel title="Verifikasi lokasi"><div className="admin-callout"><strong>Lokasi belum dikonfirmasi</strong><p>Koordinat dan petunjuk titik naik perlu diperiksa sebelum digunakan sebagai informasi resmi.</p></div><h3 className="admin-subheading">Daftar pemeriksaan</h3><ol className="admin-checklist"><li>Nama lokasi sesuai di lapangan</li><li>Koordinat titik naik akurat</li><li>Petunjuk mudah dipahami</li><li>Akses penumpang aman</li></ol><p className="admin-accent">{uses.length ? "Digunakan pada " + uses.map(route => route.id).join(", ") : "Belum digunakan pada rute"}</p><p className="admin-form-hint">Verifikasi lokasi resmi akan ditangani melalui layanan backend.</p></Panel></div>
  </>;
}
