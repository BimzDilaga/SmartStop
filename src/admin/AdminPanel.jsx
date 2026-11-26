import React, { useEffect, useRef, useState } from "react";
import Overview from "./Overview.jsx";
import { RoutesPage, SchedulesPage, StopsPage } from "./Operations.jsx";
import { FeedbackPage, InformationPage } from "./Communication.jsx";
import { createAdminData } from "./data.js";
import { AdminDialog, Icon } from "./ui.jsx";
import "./admin.css";

const tabs = [
  ["dashboard", "Dashboard", "dashboard"], ["jadwal", "Kelola Jadwal", "clock"],
  ["rute", "Kelola Rute", "route"], ["halte", "Titik Singgah", "pin"],
  ["informasi", "Info Layanan", "globe"], ["masukan", "Kritik dan Saran", "message"]
];
const currentPage = () => tabs.some(([id]) => id === location.hash.split("/")[1]) ? location.hash.split("/")[1] : "dashboard";

export default function AdminPanel({ onExit }) {
  const [page, setPage] = useState(currentPage);
  const [data, setData] = useState(createAdminData);
  const [dirty, setDirty] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [notice, setNotice] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [intent, setIntent] = useState(null);
  const content = useRef(null);
  useEffect(() => {
    const update = () => setPage(currentPage());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  useEffect(() => {
    document.title = `${tabs.find(([id]) => id === page)?.[1]} · Admin SmartStop`;
    window.scrollTo(0, 0);
    content.current?.querySelector("h1")?.focus({ preventScroll: true });
  }, [page]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!dirty) return;
    const warn = event => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function guard(action) {
    if (!dirty) { action(); return; }
    setConfirmation({ title: "Buang perubahan yang belum disimpan?", description: "Perubahan pada formulir ini belum masuk ke draf demo.", label: "Buang perubahan", action: () => { setDirty(false); action(); } });
  }
  function navigate(next, nextIntent = null) {
    setMenuOpen(false);
    guard(() => {
      setIntent(nextIntent);
      location.hash = next === "dashboard" ? "admin" : "admin/" + next;
      setPage(next);
    });
  }
  function save(collection, record, message = "Draf tersimpan di demo. Belum mengubah website.") {
    setData(current => ({ ...current, [collection]: current[collection].some(item => item.id === record.id)
      ? current[collection].map(item => item.id === record.id ? structuredClone(record) : item)
      : [...current[collection], structuredClone(record)] }));
    setNotice(message);
  }
  const newFeedback = data.feedback.filter(item => item.status === "Baru").length;
  const navigation = <nav className="admin-navigation" aria-label="Menu admin">{tabs.map(([id, text, icon]) => <a href={id === "dashboard" ? "#admin" : "#admin/" + id} key={id} aria-current={page === id ? "page" : undefined} onClick={event => { event.preventDefault(); navigate(id); }}><Icon name={icon} /><span>{text}</span>{id === "masukan" && newFeedback > 0 && <span className="admin-nav-count">{newFeedback}</span>}</a>)}</nav>;
  const context = { data, save, navigate, guard, onDirty: setDirty, ask: setConfirmation, notify: setNotice, intent };

  return <div className="admin-shell">
    <a className="admin-skip" href="#admin-content" onClick={event => { event.preventDefault(); content.current.querySelector("h1")?.focus(); }}>Langsung ke konten admin</a>
    <aside className="admin-sidebar"><a className="admin-brand" href="#admin" onClick={event => { event.preventDefault(); navigate("dashboard"); }}><span className="admin-brand-icon"><Icon name="bus" /></span><span><strong>SmartStop</strong><small>PURWOKERTO</small></span></a>
      {navigation}
      <div className="admin-sidebar-bottom"><div className="admin-user-card"><span className="admin-avatar"><Icon name="user" /></span><div><strong>Admin SmartStop</strong><span>Admin Operasional · demo</span></div></div><button className="admin-logout" onClick={() => guard(onExit)}><Icon name="logout" />Keluar</button></div>
    </aside>
    <div className="admin-main">
      <header className="admin-topbar"><button className="admin-mobile-menu" aria-label="Buka menu admin" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Icon name="menu" /></button><p>SmartStop <span>/ Panel admin / Purwokerto</span></p><div><a className="admin-view-site" href="#beranda" target="_blank" rel="noreferrer"><Icon name="external" /><span>Lihat Website</span></a><span className="admin-topbar-user"><span className="admin-avatar"><Icon name="user" /></span><strong>Admin SmartStop</strong></span></div></header>
      <main className="admin-content" id="admin-content" ref={content}>
        <div className="admin-page" key={page}>
          {page === "dashboard" && <Overview {...context} />}
          {page === "jadwal" && <SchedulesPage {...context} />}
          {page === "rute" && <RoutesPage {...context} />}
          {page === "halte" && <StopsPage {...context} />}
          {page === "informasi" && <InformationPage {...context} />}
          {page === "masukan" && <FeedbackPage {...context} />}
        </div>
      </main>
    </div>
    <div className={"admin-toast" + (notice ? " is-visible" : "")} role="status" aria-live="polite">{notice && <><Icon name="check" /><span>{notice}</span><button aria-label="Tutup pemberitahuan" onClick={() => setNotice("")}>×</button></>}</div>
    <AdminDialog open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu admin" description="Panel operasional SmartStop.">{navigation}<button className="admin-logout" onClick={() => { setMenuOpen(false); guard(onExit); }}><Icon name="logout" />Keluar dari demo</button></AdminDialog>
    <AdminDialog open={Boolean(confirmation)} onClose={() => setConfirmation(null)} title={confirmation?.title || "Konfirmasi"} description={confirmation?.description || "Tinjau perubahan demo."}>
      <div className="admin-confirm-copy">{confirmation?.body}</div><div className="admin-form-actions"><button className="admin-button secondary" onClick={() => setConfirmation(null)}>Batal</button><button className="admin-button" onClick={() => { const action = confirmation.action; setConfirmation(null); action(); }}>{confirmation?.label || "Lanjutkan"}</button></div>
    </AdminDialog>
  </div>;
}
