import React, { useEffect, useRef, useState } from "react";
import { corridor, findJourney, outboundStops, inboundStops, rupiah } from "./transit.js";
import Landing from "./Landing.jsx";
import "./portal.css";

const pageNames = {
  beranda: "Beranda", jadwal: "Jadwal dan rute", peta: "Peta halte", koridor: "Koridor bus",
  infrastruktur: "Infrastruktur", tiket: "Tiket pelajar", pembayaran: "Pembayaran",
  struk: "Struk tiket", lapor: "Lapor masalah", profil: "Profil"
};
const { stops } = corridor;
const routeFromHash = () => Object.hasOwn(pageNames, location.hash.slice(1)) ? location.hash.slice(1) : "beranda";

function StopList({ items }) {
  return <ol className="line-list">{items.map(stop => <li key={stop}>{stop}</li>)}</ol>;
}

export default function Portal({ name, category, onLogout }) {
  const student = category === "pelajar";
  const label = student ? "Pelajar" : "Umum";
  const fare = student ? corridor.studentFare : corridor.generalFare;
  const pages = { ...pageNames, tiket: "Tiket " + category };
  const [page, setPage] = useState(routeFromHash);
  const [trip, setTrip] = useState({ from: outboundStops[0], to: outboundStops.at(-1) });
  const [stop, setStop] = useState(stops[0]);
  const [reverse, setReverse] = useState(false);
  const [order, setOrder] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [reports, setReports] = useState([]);
  const heading = useRef(null);
  useEffect(() => {
    const update = () => setPage(routeFromHash());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  useEffect(() => {
    document.title = pages[page] + " · SmartStop";
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("reveal");
        observer.unobserve(entry.target);
      }
    }));
    document.querySelectorAll(".portal .surface").forEach(el => {
      if (el.getBoundingClientRect().top >= innerHeight) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [page, category]);
  const journey = findJourney(trip.from, trip.to);
  function book(e) {
    e.preventDefault();
    if (!journey) return;
    const form = new FormData(e.currentTarget);
    setOrder({ fare, time: form.get("departure"), quantity: Number(form.get("quantity")), ...trip });
    location.hash = "pembayaran";
  }
  if (page === "beranda" || page === "jadwal") {
    return <Landing name={name} category={category} trip={trip} setTrip={setTrip} onChooseCorridor={setReverse} />;
  }
  return <div className="portal">
    <header className="mast"><a className="wordmark" href="#beranda">Smart<span>Stop</span></a>
      <div className="mast-links">{["beranda","jadwal","peta","tiket"].map(key =>
        <a key={key} aria-current={page === key ? "page" : undefined} href={"#"+key}>{pages[key]}</a>)}</div>
      <a className="account-link" href={name ? "#profil" : "#masuk"}>{name ? "Profil" : "Login"}</a></header>
    <div className="portal-body" key={page}>
      <p className="context">Purbalingga ↔ Purwokerto <span>Data contoh</span></p>
      {page !== "beranda" && <a href="#beranda">← Beranda</a>}
      <h1 ref={heading} tabIndex="-1">{pages[page]}</h1>
      {page === "koridor" && <article className="surface"><h2>{corridor.name} · Bulupitu ↔ Bukateja</h2><button className="outline" onClick={()=>setReverse(!reverse)}>Balik arah ⇄</button><StopList items={reverse ? inboundStops : outboundStops}/><a href="#peta">Buka peta halte →</a></article>}
      {(page === "peta" || page === "infrastruktur") && <article className="surface">
        <h2>{page === "peta" ? "Skema halte Koridor 1" : "Fasilitas per halte"}</h2>
        <div className="station-grid"><div className="stations">{stops.map(s=><button key={s} aria-pressed={s === stop} onClick={()=>setStop(s)}>{s}</button>)}</div>
        <div className="station-info"><small>{corridor.name}</small><h3>{stop}</h3>
        {page === "peta" ? <><p>Titik singgah {stops.indexOf(stop)+1} dari {stops.length}</p><p>Posisi bus belum tersedia.</p><a href="#infrastruktur">Lihat fasilitas →</a></> : <p>Informasi akses kursi roda, tempat duduk, dan kondisi halte belum tersedia.</p>}</div></div></article>}
      {page === "tiket" && <form className="surface" onSubmit={book}><h2>{pages.tiket} · {rupiah(fare)}</h2>
        <p>{trip.from} → {trip.to} · <a href="#jadwal">Ubah rute</a></p><label>Keberangkatan contoh (WIB)<select name="departure">{corridor.departures.map(t=><option key={t}>{t}</option>)}</select></label>
        <label>Jumlah penumpang<input type="number" name="quantity" min="1" max="10" defaultValue="1" required/></label>
        {!journey && <p>Pilih dua halte pada lintasan yang sama di halaman jadwal.</p>}
        <button className="go" disabled={!journey}>Tinjau pesanan</button></form>}
      {page === "pembayaran" && <article className="surface"><h2>Ringkasan pesanan</h2>{order ? <><p>{order.from} → {order.to}</p><p>{order.time} WIB · {order.quantity} penumpang</p><h3>Total {rupiah(order.quantity*order.fare)}</h3><p>Simulasi pembayaran tanpa transaksi uang.</p>
        <button className="go" onClick={()=>{setReceipt(order);setOrder(null);location.hash="struk";}}>Selesaikan simulasi</button></> : <a href="#tiket">Pilih tiket dahulu →</a>}</article>}
      {page === "struk" && <article className="surface"><h2>{receipt ? "Bukti simulasi tiket" : "Belum ada tiket"}</h2>{receipt && <><p>{receipt.from} → {receipt.to}</p><p>{receipt.time} WIB · {receipt.quantity} penumpang · {rupiah(receipt.quantity*receipt.fare)}</p><p>Tiket contoh ini tidak berlaku untuk perjalanan.</p></>}<a href="#tiket">Kembali ke tiket →</a></article>}
      {page === "lapor" && <form className="surface" onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);setReports([...reports,{stop:data.get("stop"),issue:data.get("issue")}]);e.currentTarget.reset();}}>
        <h2>Laporan halte</h2><label>Lokasi<select name="stop">{stops.map(s=><option key={s}>{s}</option>)}</select></label><label>Kendala<textarea name="issue" required maxLength="1000" rows="3"/></label>
        <button className="go">Simpan laporan demo</button><div role="status">{reports.length>0 && <h3>Laporan demo tersimpan sementara</h3>}{reports.map((r,i)=><p key={i}><strong>{r.stop}</strong> · {r.issue}</p>)}</div></form>}
      {page === "profil" && <article className="surface">{name ? <><h2>{name}</h2><p>Akun {label} · sesi demo</p><a href="#struk">Lihat tiket terakhir →</a><p><button className="outline" onClick={onLogout}>Keluar</button></p></> : <a href="#masuk">Login untuk melihat profil</a>}</article>}
    </div><footer>SmartStop <span>Pesan · Naik · Sampai</span></footer>
  </div>;
}
