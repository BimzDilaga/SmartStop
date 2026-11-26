import React, { useRef, useState } from "react";
import { exportFeedback, matches, newId } from "./data.js";
import { Badge, DataTable, Field, Filter, FormActions, PageHeading, Panel, Search, Stats, TableFooter, useEditor } from "./ui.jsx";

function revealForm(ref) {
  ref.current?.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  ref.current?.querySelector("input,textarea")?.focus({ preventScroll: true });
}

function InformationPreview({ record }) {
  return <article className="admin-info-preview"><p>{record.category} · {record.scope}</p><h3>{record.title || "Judul informasi"}</h3><div>{record.content || "Isi informasi akan muncul di sini saat Anda mengetik."}</div></article>;
}

export function InformationPage({ data, save, guard, onDirty, ask }) {
  const blank = () => ({ id: "", title: "", category: "Panduan", scope: "Semua rute", content: "", status: "Draf" });
  const { draft, change, reset, dirty } = useEditor(data.information[0] || blank(), onDirty);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const form = useRef(null);
  const results = data.information.filter(item => matches(search, item.title, item.content) && (!category || item.category === category) && (!status || item.status === status));
  const begin = record => guard(() => { reset(record); setError(""); revealForm(form); });
  function valid() {
    if (!form.current.reportValidity()) return false;
    if (!draft.title.trim() || !draft.content.trim()) { setError("Judul dan isi informasi wajib diisi."); return false; }
    setError("");
    return true;
  }
  function persist(status) {
    const record = { ...draft, id: draft.id || newId("INFO"), title: draft.title.trim(), content: draft.content.trim(), status };
    save("information", record, status === "Terpublikasi" ? "Informasi dipublikasikan pada demo. Website publik tidak berubah." : undefined);
    reset(record);
  }
  function review() {
    if (!valid()) return;
    ask({ title: "Tinjau informasi sebelum publikasi", description: "Publikasi ini hanya disimulasikan. Tidak mengubah website atau database.", body: <InformationPreview record={draft} />, label: "Publikasikan di demo", action: () => persist("Terpublikasi") });
  }
  return <>
    <PageHeading title="Info Layanan" description="Kelola pengumuman dan informasi untuk pengguna SmartStop." action={<button className="admin-button" onClick={() => begin(blank())}>+ Buat informasi</button>} />
    <Stats items={[["Total informasi", data.information.length, "Konten contoh tersimpan"], ["Draf", data.information.filter(item => item.status === "Draf").length, "Belum tampil di website"], ["Terpublikasi", data.information.filter(item => item.status === "Terpublikasi").length, "Publikasi pada demo ini"], ["Kategori", new Set(data.information.map(item => item.category)).size, "Panduan, jadwal & rute"]]} />
    <Panel title="Daftar informasi layanan" description="Kelola informasi yang akan ditampilkan di website." className="admin-list-panel">
      <div className="admin-filters"><Search value={search} onChange={setSearch} placeholder="Cari judul atau isi informasi" /><Filter label="Filter kategori informasi" value={category} onChange={setCategory} options={[["", "Semua kategori"], "Panduan", "Jadwal", "Rute"]} /><Filter label="Filter status informasi" value={status} onChange={setStatus} options={[["", "Semua status"], "Draf", "Terpublikasi"]} /></div>
      <DataTable columns={[{ key: "title", label: "Judul informasi" }, { key: "category", label: "Kategori" }, { key: "scope", label: "Cakupan" }, { key: "status", label: "Status" }, { key: "action", label: "Aksi" }]} rows={results.map(item => ({ id: item.id, selected: item.id === draft.id, title: <><strong>{item.title}</strong><small className="admin-table-excerpt">{item.content}</small></>, category: item.category, scope: item.scope, status: <Badge>{item.status}</Badge>, action: <button className="admin-text-button" aria-label={"Ubah informasi " + item.title} onClick={() => begin(item)}>Ubah</button> }))} /><TableFooter count={results.length} total={data.information.length} />
    </Panel>
    <div className="admin-two-columns"><Panel title={draft.id ? "Ubah informasi layanan" : "Buat informasi layanan"} description="Siapkan konten yang singkat, jelas, dan mudah dipahami."><form className="admin-editor" ref={form} onSubmit={event => { event.preventDefault(); if (valid()) persist("Draf"); }}>
      <Field label="Judul informasi"><input required maxLength={120} value={draft.title} onChange={event => change({ title: event.target.value })} /></Field>
      <div className="admin-field-row"><Field label="Kategori"><select value={draft.category} onChange={event => change({ category: event.target.value })}><option>Panduan</option><option>Jadwal</option><option>Rute</option></select></Field><Field label="Cakupan rute"><select value={draft.scope} onChange={event => change({ scope: event.target.value })}><option>Semua rute</option>{data.routes.map(route => <option key={route.id} value={route.id}>{route.id} · {route.name}</option>)}</select></Field></div>
      <Field label="Isi informasi" hint={`${draft.content.length}/4000 karakter`}><textarea required rows={9} maxLength={4000} value={draft.content} onChange={event => change({ content: event.target.value })} /></Field>
      {error && <p className="admin-form-error" role="alert">{error}</p>}<FormActions dirty={dirty} onCancel={() => begin(data.information.find(item => item.id === draft.id) || blank())} />
    </form></Panel><Panel title="Pratinjau informasi" description="Tampilan ringkas untuk pengguna website"><InformationPreview record={draft} /><p className="admin-preview-status"><Badge>{dirty ? "Draf" : draft.status}</Badge><span>{draft.status === "Terpublikasi" && !dirty ? "Terpublikasi pada demo" : "Hanya terlihat oleh admin"}</span></p><p className="admin-form-hint">Verifikasi isi sebelum publikasi. Konten contoh belum menjadi informasi resmi.</p><button className="admin-button secondary full" onClick={review}>Tinjau sebelum publikasi</button></Panel></div>
  </>;
}

export function FeedbackPage({ data, save, guard, onDirty, ask, notify, intent }) {
  const first = data.feedback.find(item => item.id === intent?.id) || data.feedback[0];
  const { draft, change, reset, dirty } = useEditor(first, onDirty);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const form = useRef(null);
  const results = data.feedback.filter(item => matches(search, item.sender, item.message, item.location) && (!category || item.category === category) && (!status || item.status === status));
  const begin = record => guard(() => { reset(record); setError(""); revealForm(form); });
  function persist(record, message) {
    save("feedback", record, message);
    reset(record);
    setError("");
  }
  function send() {
    if (!draft.response.trim()) { setError("Isi tanggapan admin sebelum melakukan simulasi kirim."); form.current.querySelector("textarea").focus(); return; }
    ask({ title: "Kirim tanggapan demo?", description: "Ini simulasi frontend. Pesan tidak dikirim kepada warga atau layanan lain.", body: <div className="admin-response-review"><strong>Kepada: {draft.sender} (data contoh)</strong><p>{draft.response}</p><small>Catatan internal tidak disertakan dalam tanggapan.</small></div>, label: "Kirim tanggapan demo", action: () => persist({ ...draft, response: draft.response.trim(), sentResponse: draft.response.trim(), status: "Ditanggapi" }, "Simulasi tanggapan selesai. Tidak ada pesan yang dikirim keluar.") });
  }
  return <>
    <PageHeading title="Kritik dan Saran" description="Tinjau masukan warga dan siapkan tanggapan layanan." action={<button className="admin-button" disabled={!results.length} onClick={() => { exportFeedback(results); notify(`${results.length} masukan contoh diekspor sebagai CSV.`); }}>Ekspor masukan</button>} />
    <Stats items={[["Total masukan", data.feedback.length, "Masukan warga contoh"], ["Baru", data.feedback.filter(item => item.status === "Baru").length, "Belum ditanggapi"], ["Diproses", data.feedback.filter(item => item.status === "Diproses").length, "Sedang ditindaklanjuti"], ["Ditanggapi", data.feedback.filter(item => item.status === "Ditanggapi").length, "Tanggapan demo tersedia"]]} />
    <Panel title="Masukan warga" description={`${data.feedback.length} masukan · ${data.feedback.filter(item => item.status === "Baru").length} masukan baru perlu ditanggapi`} className="admin-list-panel"><div className="admin-filters"><Search value={search} onChange={setSearch} placeholder="Cari nama pengirim atau isi masukan" /><Filter label="Filter kategori masukan" value={category} onChange={setCategory} options={[["", "Semua kategori"], "Titik singgah", "Jadwal"]} /><Filter label="Filter status masukan" value={status} onChange={setStatus} options={[["", "Semua status"], "Baru", "Diproses", "Ditanggapi"]} /></div>
      <DataTable columns={[{ key: "sender", label: "Pengirim" }, { key: "message", label: "Isi masukan" }, { key: "category", label: "Kategori" }, { key: "status", label: "Status" }, { key: "action", label: "Aksi" }]} rows={results.map(item => ({ id: item.id, selected: item.id === draft.id, sender: <strong>{item.sender}</strong>, message: <span className="admin-table-message">{item.message}</span>, category: item.category, status: <Badge>{item.status}</Badge>, action: <button className="admin-text-button" aria-label={"Tanggapi masukan " + item.sender} onClick={() => begin(item)}>{item.status === "Baru" ? "Tanggapi" : "Detail"}</button> }))} /><TableFooter count={results.length} total={data.feedback.length} /></Panel>
    <form className="admin-two-columns admin-feedback-form" ref={form} onSubmit={event => { event.preventDefault(); persist(draft, "Draf tanggapan disimpan di demo. Belum dikirim kepada pengguna."); }}>
      <Panel title="Detail masukan" action={<Badge>{draft.status}</Badge>}><p className="admin-strong">{draft.sender}</p><p className="admin-form-hint">Kategori: {draft.category} · Lokasi: {draft.location}</p><blockquote className="admin-feedback-quote">{draft.message}</blockquote>
        <Field label="Tanggapan admin"><textarea rows={6} maxLength={2000} value={draft.response} placeholder="Tulis tanggapan yang jelas dan membantu." onChange={event => change({ response: event.target.value })} /></Field>
        {error && <p className="admin-form-error" role="alert">{error}</p>}<p className="admin-form-hint" role="status">{dirty ? "Ada perubahan yang belum disimpan." : draft.sentResponse ? "Tanggapan terakhir tersimpan pada demo." : "Draf tanggapan · belum dikirim kepada pengguna"}</p>
        <div className="admin-form-actions"><button className="admin-button secondary" type="submit">Simpan draf</button><button className="admin-button" type="button" onClick={send}>Kirim tanggapan (demo)</button></div>
      </Panel>
      <Panel title="Tindak lanjut"><Field label="Status penanganan"><select value={draft.status} onChange={event => change({ status: event.target.value })}><option>Baru</option><option>Diproses</option>{draft.sentResponse && <option>Ditanggapi</option>}</select></Field><p className="admin-form-hint">Status Ditanggapi diberikan setelah simulasi kirim.</p><h3 className="admin-subheading">Admin penanggung jawab</h3><p>Admin Operasional</p><Field label="Catatan internal" hint="Catatan hanya untuk admin, tidak disertakan saat kirim."><textarea rows={5} maxLength={2000} value={draft.note} onChange={event => change({ note: event.target.value })} /></Field><h3 className="admin-subheading">Alur penanganan</h3><ol className="admin-feedback-flow">{["Baru", "Diproses", "Ditanggapi"].map(item => <li key={item} aria-current={draft.status === item ? "step" : undefined}>{item}</li>)}</ol>
        {draft.sentResponse && <details className="admin-last-response"><summary>Tanggapan demo terakhir</summary><p>{draft.sentResponse}</p></details>}
      </Panel>
    </form>
  </>;
}
