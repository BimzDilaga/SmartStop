import React, { useEffect, useRef, useState } from "react";
import { corridor, outboundStops } from "./transit.js";
import Landing, { SiteHeader } from "./Landing.jsx";
import StopMap from "./StopMap.jsx";
import CorridorPage from "./CorridorPage.jsx";
import InfrastructurePage from "./InfrastructurePage.jsx";
import TicketPage, { TicketCheckout } from "./TicketPage.jsx";
import { createTicketDraft } from "./ticketModel.js";
import { advanceDemoFleet, createDemoFleet, busLocation } from "./fleet.js";
import { smartStopApi } from "./services/smartstopApi.js";
import { normalizeFleetSnapshot } from "./services/fleetAdapter.js";
import "./portal.css";

const pageNames = {
  beranda: "Beranda", jadwal: "Jadwal dan rute", peta: "Peta halte", koridor: "Koridor bus",
  infrastruktur: "Infrastruktur", tiket: "Tiket pelajar", pembayaran: "Pembayaran",
  struk: "Struk tiket", lapor: "Lapor masalah", profil: "Profil"
};
const { stops } = corridor;
const configuredFleetSource = import.meta.env?.VITE_FLEET_SOURCE === "api" ? smartStopApi.fleet : null;
const routeFromHash = () => Object.hasOwn(pageNames, location.hash.slice(1)) ? location.hash.slice(1) : "beranda";

export default function Portal({ name, category, onLogout, fleetSource = configuredFleetSource }) {
  const student = category === "pelajar";
  const label = student ? "Pelajar" : "Umum";
  const pages = { ...pageNames, tiket: "Tiket " + category };
  const [page, setPage] = useState(routeFromHash);
  const [trip, setTrip] = useState({ from: outboundStops[0], to: outboundStops.at(-1) });
  const [ticketDraft, setTicketDraft] = useState(() => createTicketDraft({ name, trip: { from: outboundStops[0], to: outboundStops.at(-1) } }));
  const [reverse, setReverse] = useState(false);
  const [order, setOrder] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [reports, setReports] = useState([]);
  const [fleet, setFleet] = useState(() => fleetSource ? [] : createDemoFleet());
  const [fleetStatus, setFleetStatus] = useState(fleetSource ? "loading" : "demo");
  const [fleetError, setFleetError] = useState("");
  const [fleetRetry, setFleetRetry] = useState(0);
  const [monitoredBus, setMonitoredBus] = useState("4");
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [mapFocus, setMapFocus] = useState(null);
  const heading = useRef(null);
  useEffect(() => {
    setTicketDraft(current => ({ ...current, from: trip.from, to: trip.to, ...(name ? { ownerName: name } : {}) }));
  }, [trip.from, trip.to, name]);
  useEffect(() => {
    if (!fleetSource) return;
    let active = true;
    let timer;
    let controller;
    setSimulationRunning(false);
    async function refresh() {
      controller = new AbortController();
      try {
        const snapshot = await fleetSource.snapshot(controller.signal);
        const records = normalizeFleetSnapshot(snapshot);
        if (!active) return;
        setFleet(records);
        setMonitoredBus(current => records.some(bus => bus.id === current) ? current : records[0]?.id || "");
        setFleetError("");
        setFleetStatus(records.length ? "ready" : "empty");
      } catch (error) {
        if (!active || error.name === "AbortError") return;
        setFleetStatus("error");
        setFleetError(error.message || "Data armada belum dapat dimuat.");
      } finally {
        if (active) timer = setTimeout(refresh, 15000);
      }
    }
    refresh();
    return () => { active = false; clearTimeout(timer); controller?.abort(); };
  }, [fleetSource, fleetRetry]);
  useEffect(() => {
    if (!simulationRunning || fleetSource) return;
    const timer = setInterval(() => {
      if (!document.hidden) setFleet(advanceDemoFleet);
    }, 4000);
    return () => clearInterval(timer);
  }, [simulationRunning, fleetSource]);
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
  function openMap(id = monitoredBus, stopName) {
    const bus = fleet.find(item => item.id === id) || fleet[0];
    if (!bus) { location.hash = "peta"; return; }
    const position = busLocation(bus);
    setMonitoredBus(bus.id);
    setMapFocus({ direction: bus.direction, stop: stopName || position.direction.stops[Math.min(position.lastIndex + 2, position.direction.stops.length - 1)] });
    location.hash = "peta";
  }
  const tracking = { fleet, monitoredBus, onSelectBus: setMonitoredBus, simulationRunning, isDemo: !fleetSource,
    fleetError, onRetry: () => setFleetRetry(value => value + 1),
    onToggleSimulation: () => { if (!fleetSource) setSimulationRunning(value => !value); }, onOpenMap: openMap };
  if (["beranda", "jadwal", "peta"].includes(page) && !fleet.length) {
    return <div className="landing fleet-data-state"><SiteHeader name={name} category={category} /><div className="fleet-data-empty" role="status"><p className="tracking-eyebrow">LAPORAN ARMADA</p><h1>{fleetStatus === "loading" ? "Memuat data armada…" : fleetStatus === "empty" ? "Belum ada armada aktif" : "Data armada belum tersedia"}</h1><p>{fleetError || "Status perjalanan akan muncul setelah laporan supir tersedia di server."}</p><button className="tracking-map-link" onClick={() => setFleetRetry(value => value + 1)}>Muat ulang data</button></div></div>;
  }
  if (page === "beranda" || page === "jadwal") {
    return <Landing name={name} category={category} trip={trip} setTrip={setTrip} onChooseCorridor={setReverse} {...tracking} />;
  }
  if (page === "peta") {
    return <StopMap name={name} category={category} {...tracking} focus={mapFocus} onBook={ticket => {
      setTrip({ from: ticket.from, to: ticket.to });
      setReceipt(ticket);
    }} />;
  }
  if (page === "koridor") return <CorridorPage name={name} category={category} initialReverse={reverse} {...tracking} />;
  if (page === "infrastruktur") return <InfrastructurePage name={name} category={category} fleet={fleet} isDemo={!fleetSource} />;
  if (page === "tiket") return <TicketPage name={name} category={category} draft={ticketDraft} setDraft={setTicketDraft} setTrip={setTrip} onReview={record => { setOrder(record); location.hash = "pembayaran"; }} />;
  if (page === "pembayaran" || page === "struk") return <TicketCheckout key={page} name={name} category={category} page={page} order={order} receipt={receipt} onComplete={record => { setReceipt(record); setOrder(null); location.hash = "struk"; }} />;
  return <div className="portal portal-secondary">
    <SiteHeader name={name} category={category} activePage={page} />
    <div className="portal-body" key={page}>
      <p className="context">Purbalingga ↔ Purwokerto <span>Data contoh</span></p>
      {page !== "beranda" && <a href="#beranda">← Beranda</a>}
      <h1 ref={heading} tabIndex="-1">{pages[page]}</h1>
      {page === "lapor" && <form className="surface" onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);setReports([...reports,{stop:data.get("stop"),issue:data.get("issue")}]);e.currentTarget.reset();}}>
        <h2>Laporan halte</h2><label>Lokasi<select name="stop">{stops.map(s=><option key={s}>{s}</option>)}</select></label><label>Kendala<textarea name="issue" required maxLength="1000" rows="3"/></label>
        <button className="go">Simpan laporan demo</button><div role="status">{reports.length>0 && <h3>Laporan demo tersimpan sementara</h3>}{reports.map((r,i)=><p key={i}><strong>{r.stop}</strong> · {r.issue}</p>)}</div></form>}
      {page === "profil" && <article className="surface">{name ? <><h2>{name}</h2><p>Akun {label} · sesi demo</p><a href="#struk">Lihat tiket terakhir →</a><p><button className="outline" onClick={onLogout}>Keluar</button></p></> : <a href="#masuk">Login untuk melihat profil</a>}</article>}
    </div><footer>SmartStop <span>Pesan · Naik · Sampai</span></footer>
  </div>;
}
