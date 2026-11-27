import React, { useEffect, useRef } from "react";
import { SiteFooter, SiteHeader } from "./Landing.jsx";
import "./services.css";

export function ServiceIcon({ name, ...props }) {
  const paths = {
    bus: <><rect x="5" y="3" width="14" height="16" rx="3" /><path d="M5 12h14M8 19v2m8-2v2M8 16h.01M16 16h.01M9 6h6" /></>,
    route: <><circle cx="5" cy="5" r="2" /><circle cx="19" cy="19" r="2" /><path d="M7 5h8a4 4 0 0 1 0 8H9a4 4 0 0 0 0 8h8" /></>,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" /></>,
    search: <><circle cx="10" cy="10" r="6.5" /><path d="m15 15 6 6" /></>,
    map: <><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5ZM9 3v16m6-14v16" /></>,
    shelter: <><path d="m2 8 10-5 10 5M5 8v13m14-13v13M2 21h20M8 15h8m-8 3h8M9 8h6v4H9Z" /></>,
    access: <><circle cx="12" cy="4" r="2" /><path d="M4 9h16m-8-3v9m0 0-5 7m5-7 5 7" /></>,
    network: <><rect x="9" y="2" width="6" height="5" rx="1" /><rect x="2" y="17" width="6" height="5" rx="1" /><rect x="16" y="17" width="6" height="5" rx="1" /><path d="M12 7v5M5 17v-5h14v5" /></>,
    ticket: <><path d="M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4V5Z" /><path d="M15 6v2m0 3v2m0 3v2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    shield: <><path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6l8-4Z" /><path d="m8 12 3 3 5-6" /></>,
    upload: <><path d="M12 16V3m-5 5 5-5 5 5M4 14v6h16v-6" /></>,
    file: <><path d="M5 2h9l5 5v15H5V2Zm9 0v6h5M8 12h8m-8 4h6" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M7 2v6m10-6v6M7 14h3m4 0h3m-10 3h3" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10h.01" /></>,
    seat: <><path d="M6 3v10a3 3 0 0 0 3 3h11M5 20h15m-10-4v5m8-5v5M10 6v6h8" /></>,
    leaf: <><path d="M20 3C7 2 1 10 6 16s14 3 14-13Z" /><path d="M3 22 17 7" /></>
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.info}</svg>;
}

export default function ServiceLayout({ name, category, page, children }) {
  const root = useRef(null);
  useEffect(() => {
    root.current?.querySelector("h1")?.focus({ preventScroll: true });
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
    }), { threshold: .08 });
    root.current.querySelectorAll("[data-reveal]").forEach(element => {
      if (element.getBoundingClientRect().top >= innerHeight) { element.classList.add("await-reveal"); observer.observe(element); }
    });
    return () => observer.disconnect();
  }, [page]);
  return <div className={"landing service-page service-" + page} ref={root}>
    <a className="skip" href="#service-main">Langsung ke konten</a>
    <SiteHeader name={name} category={category} activePage={["pembayaran", "struk"].includes(page) ? "tiket" : page} />
    <main id="service-main" className="service-container">{children}</main>
    <SiteFooter />
  </div>;
}

export function ServiceStats({ items }) {
  return <div className="service-stats">{items.map(item => <article className="service-stat" key={item.label} data-reveal>
    <div><span>{item.label}</span><ServiceIcon name={item.icon} /></div><strong>{item.value}</strong><p>{item.description}</p>
  </article>)}</div>;
}

export function DemoNote({ children }) {
  return <p className="service-demo-note"><ServiceIcon name="info" /><span>{children || "Pratinjau frontend. Informasi operasional dan fasilitas menunggu verifikasi operator."}</span></p>;
}

export function TravelGuidelines() {
  const items = [
    ["clock", "Periksa jadwal perjalanan", "Pilih arah, tanggal, dan waktu keberangkatan. Jadwal pada pratinjau ini menggunakan data contoh."],
    ["ticket", "Tarif yang transparan", "Contoh tarif Rp4.000 untuk umum dan Rp2.000 untuk pelajar. Kelayakan tarif pelajar diperiksa oleh operator."],
    ["access", "Utamakan akses bersama", "Berikan ruang untuk lansia dan penumpang difabel. Periksa informasi fasilitas halte sebelum berangkat."],
    ["leaf", "Nyaman selama perjalanan", "Jaga kebersihan bus dan halte. Laporkan fasilitas yang perlu diperbaiki melalui menu Lapor."]
  ];
  return <section className="service-section" data-reveal><p className="service-eyebrow">BERSIAP SEBELUM BERANGKAT</p><h2>Panduan perjalanan yang lebih nyaman.</h2><p className="service-description">Informasi singkat untuk perjalanan bersama Trans Jateng.</p><div className="guideline-grid">{items.map(([icon, title, text]) => <article key={title}><ServiceIcon name={icon} /><h3>{title}</h3><p>{text}</p></article>)}</div></section>;
}
