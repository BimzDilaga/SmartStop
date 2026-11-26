import React, { useEffect, useId, useState } from "react";
import PickerDialog from "../PickerDialog.jsx";
import "../pickers.css";

export function Icon({ name, ...props }) {
  const shapes = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 3" /></>,
    route: <><circle cx="6" cy="4" r="2" /><circle cx="18" cy="20" r="2" /><path d="M6 6v11a3 3 0 0 0 6 0V7a3 3 0 0 1 6 0v11" /></>,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18M5 6h14M5 18h14" /></>,
    message: <path d="M3 4h18v13H8l-5 4V4Z" />,
    bus: <><rect x="5" y="2" width="14" height="18" rx="3" /><path d="M5 12h14M8 20v2m8-2v2M8 16h.01M16 16h.01M9 6h6" /></>,
    user: <><circle cx="12" cy="7" r="3" /><path d="M5 21v-3a7 7 0 0 1 14 0v3H5Z" /></>,
    external: <><path d="M14 3h7v7m-1-6-9 9M11 5H4v15h15v-7" /></>,
    logout: <><path d="M9 3H3v18h6m6-14 5 5-5 5M8 12h12" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    check: <path d="m5 12 4 4L19 6" />,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10v.01" /></>
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{shapes[name]}</svg>;
}

export function Badge({ children }) {
  const tone = ["Terpublikasi", "Ditanggapi", "Terverifikasi"].includes(children) ? "green" : children === "Diproses" ? "blue" : "amber";
  return <span className={"admin-badge " + tone}>{children}</span>;
}

export function PageHeading({ title, description, action }) {
  return <><div className="admin-page-heading"><div><h1 tabIndex={-1}>{title}</h1><p>{description}</p></div>{action}</div>
    <div className="admin-demo-notice"><Icon name="info" /><p><strong>Demo frontend.</strong> Perubahan hanya berlaku selama panel terbuka. Data belum tersimpan ke database atau dikirim kepada pengguna.</p></div></>;
}

export function Stats({ items }) {
  return <div className="admin-stats">{items.map(([label, value, description]) => <div className="admin-stat" key={label}><p>{label}</p><strong className={String(value).length > 12 ? "compact" : ""}>{value}</strong><span>{description}</span></div>)}</div>;
}

export function Panel({ title, description, action, children, className = "", ...props }) {
  return <section className={"admin-panel " + className} {...props}>
    {(title || action) && <div className="admin-panel-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>}{children}
  </section>;
}

export function Search({ value, onChange, placeholder }) {
  return <div className="admin-search"><Icon name="search" /><input type="search" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} /></div>;
}

export function Filter({ label, value, onChange, options }) {
  return <select className="admin-filter" aria-label={label} value={value} onChange={event => onChange(event.target.value)}>{options.map(option => {
    const [key, text] = Array.isArray(option) ? option : [option, option];
    return <option value={key} key={key}>{text}</option>;
  })}</select>;
}

export function DataTable({ columns, rows, empty = "Tidak ada data yang cocok. Coba kata kunci atau filter lain." }) {
  return <div className="admin-table-scroll" tabIndex={0} role="region" aria-label="Tabel data, dapat digeser mendatar"><table className="admin-table"><thead><tr>{columns.map(column => <th scope="col" key={column.key}>{column.label}</th>)}</tr></thead><tbody>
    {rows.map(row => <tr key={row.id} className={row.selected ? "is-selected" : ""}>{columns.map(column => <td key={column.key}>{row[column.key]}</td>)}</tr>)}
    {rows.length === 0 && <tr><td colSpan={columns.length} className="admin-empty"><Icon name="search" /><strong>Belum ada hasil</strong><p>{empty}</p></td></tr>}
  </tbody></table></div>;
}

export function TableFooter({ count, total, page, pages, onPage }) {
  return <div className="admin-table-footer"><span>Menampilkan {count} dari {total} data</span>{pages > 1 ? <div className="admin-pagination"><button disabled={page === 1} onClick={() => onPage(page - 1)}>Sebelumnya</button><span>{page} / {pages}</span><button disabled={page === pages} onClick={() => onPage(page + 1)}>Berikutnya</button></div> : <span>Halaman 1</span>}</div>;
}

export function Field({ label, children, hint }) {
  const id = useId();
  const hintId = id + "-hint";
  return <div className="admin-field"><label htmlFor={id}>{label}</label>{React.cloneElement(children, { id, "aria-describedby": hint ? hintId : undefined })}{hint && <small id={hintId}>{hint}</small>}</div>;
}

export function RouteSummary({ route, stops }) {
  if (!route) return <p className="admin-muted">Pilih rute terlebih dahulu.</p>;
  const records = route.stopIds.map(id => stops.find(stop => stop.id === id)).filter(Boolean);
  const terminals = records.map((stop, index) => ({ ...stop, index })).filter(stop => stop.type === "Terminal bus");
  return <><p className="admin-accent">{route.id} · {records.length} titik singgah</p><ol className="admin-route-summary">{terminals.map(stop => <li key={stop.id}><span>{stop.index === 0 ? "OD" : String(stop.index).padStart(2, "0")}</span><div><strong>{stop.name}</strong><p>{stop.index === 0 ? "Titik keberangkatan" : stop.index === records.length - 1 ? "Tujuan akhir" : "Terminal antara"}</p></div></li>)}</ol></>;
}

export function AdminDialog({ open, onClose, requestClose, title, description, children }) {
  return <PickerDialog open={open} onClose={onClose} onRequestClose={requestClose} title={title} description={description} className="admin-dialog">{close => <div className="admin-dialog-body">{typeof children === "function" ? children(close) : children}</div>}</PickerDialog>;
}

export function useEditor(initial, onDirty) {
  const [draft, setDraft] = useState(() => structuredClone(initial));
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const dirty = JSON.stringify(draft) !== baseline;
  useEffect(() => { onDirty(dirty); }, [dirty, onDirty]);
  useEffect(() => () => onDirty(false), [onDirty]);
  const reset = record => { setDraft(structuredClone(record)); setBaseline(JSON.stringify(record)); };
  const change = patch => setDraft(current => ({ ...current, ...patch }));
  return { draft, change, reset, dirty };
}

export function FormActions({ dirty, onCancel, label = "Simpan draf" }) {
  return <><p className="admin-form-hint" role="status">{dirty ? "Ada perubahan yang belum disimpan." : "Perubahan demo akan tersimpan di panel ini selama sesi terbuka."}</p><div className="admin-form-actions"><button className="admin-button secondary" type="button" onClick={onCancel}>Batal</button><button className="admin-button" type="submit">{label}</button></div></>;
}
