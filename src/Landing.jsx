import React, { useEffect, useRef, useState } from "react";
import { corridor, findJourney, routeDirections, rupiah } from "./transit.js";
import { arrivalAt, busLocation } from "./fleet.js";
import BusStatus, { BusSymbol, SimulationToggle, FleetFeedNotice } from "./BusStatus.jsx";
import bukatejaPhoto from "../assets/koridor-bukateja.png";
import bulupituPhoto from "../assets/koridor-bulupitu.png";
import { BusPicker, StopPicker } from "./RoutePickers.jsx";
import "./landing.css";

const navigation = [
  ["jadwal", "Jadwal & rute"], ["peta", "Peta halte"], ["koridor", "Koridor bus"],
  ["infrastruktur", "Infrastruktur"], ["tiket", "Tiket"], ["lapor", "Lapor"]
];

export function SiteHeader({ name, category, activePage }) {
  const [expanded, setExpanded] = useState(false);
  const [scrolled, setScrolled] = useState(() => window.scrollY > 24);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    const closeMenu = () => setExpanded(false);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("hashchange", closeMenu);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("hashchange", closeMenu);
    };
  }, []);
  return <header className={"site-header" + (scrolled ? " is-scrolled" : "")}>
    <a className="site-brand" href="#beranda" aria-label="SmartStop · beranda">
      <span className="brand-symbol" aria-hidden="true">⑂</span>
      <span>Smart<span>Stop</span></span>
    </a>
    <button className="menu-toggle" aria-expanded={expanded} aria-controls="site-navigation"
      onClick={() => setExpanded(!expanded)}>Menu <span aria-hidden="true">{expanded ? "−" : "+"}</span></button>
    <nav id="site-navigation" className={expanded ? "site-navigation is-open" : "site-navigation"} aria-label="Navigasi utama">
      {navigation.map(([path, text]) => <a key={path} href={"#" + path} aria-current={activePage === path ? "page" : undefined} onClick={() => setExpanded(false)}>{text}</a>)}
    </nav>
    <a className="site-account" href={name ? "#profil" : "#masuk"}>
      <span className="person-icon" aria-hidden="true" />
      <span>{name ? (category === "pelajar" ? "Pelajar" : "Umum") : "Login"}</span>
    </a>
  </header>;
}

function RoutePlanner({ trip, setTrip, category }) {
  const journey = findJourney(trip.from, trip.to);
  const fare = category === "pelajar" ? corridor.studentFare : corridor.generalFare;
  function update(key, value) {
    setTrip({ ...trip, [key]: value });
  }
  return <div className="route-planner">
    <div className="planner-heading"><span aria-hidden="true">⑂</span> Cari rute & pembelian tiket</div>
    <div className="planner-divider" />
    <div className="planner-fields">
      {[["from", "Halte keberangkatan"], ["to", "Halte tujuan akhir"]].map(([key, label]) =>
        <StopPicker key={key} variant={key} label={label} value={trip[key]}
          otherValue={trip[key === "from" ? "to" : "from"]} onChange={value => update(key, value)} />)}
    </div>
    {journey ? <a className="journey-result" href="#tiket" aria-label={"Pilih tiket " + category + " dari " + trip.from + " ke " + trip.to}>
      <span className="route-code">{journey.id === "bukateja" ? "1A" : "1B"}</span>
      <div><h2>{trip.from} → {trip.to} <span className="direct-label">Langsung</span></h2>
        <p>{Math.max(0, journey.stops.length - 2)} halte perantara · Tarif {category} {rupiah(fare)}</p></div>
      <span className="result-arrow" aria-hidden="true">→</span>
    </a> : <div className="journey-empty" role="status">
      {trip.from === trip.to ? "Pilih halte keberangkatan dan tujuan yang berbeda." : "Belum ada lintasan langsung untuk pilihan ini dalam data contoh. Coba halte lain."}
    </div>}
  </div>;
}

function DepartureBoard({ fleet, onOpenMap, isDemo = true }) {
  const [filter, setFilter] = useState("semua");
  const featured = ["4", "8", "11", "2"].map(id => fleet.find(bus => bus.id === id)).filter(Boolean);
  const records = [...featured, ...fleet.filter(bus => !featured.some(item => item.id === bus.id))].filter(bus => filter === "semua" || bus.direction === filter).slice(0, 4);
  return <section className="landing-section departures-section" aria-labelledby="departures-heading" data-reveal>
    <div className="section-heading">
      <div><h2 id="departures-heading">Pantau armada,<br />rencanakan perjalanan.</h2>
        <p>Lihat ringkasan posisi bus, lalu buka Peta Halte untuk estimasi tiba dan pemesanan tiket.</p></div>
      <button className="tracking-map-link" onClick={() => onOpenMap()}>Lihat peta halte</button>
    </div>
    <div className="departure-tools">
      <select aria-label="Filter armada" value={filter} onChange={event => setFilter(event.target.value)}>
        <option value="semua">Semua armada</option>
        <option value="bukateja">Arah Bukateja</option>
        <option value="bulupitu">Arah Bulupitu</option>
      </select>
      <span id="arrival-demo">{isDemo ? "Data contoh · integrasi server menyusul" : "Berdasarkan laporan supir"}</span>
    </div>
    <div className="departure-board" aria-describedby="arrival-demo">
      <div className="board-topline"><p>Ringkasan armada <span className="board-station">| Bulupitu ↔ Bukateja</span></p><span>Halte berikutnya</span></div>
      <div className="departure-rows">{records.map((bus, index) => {
        const position = busLocation(bus);
        return <article className="departure-row" key={bus.id}>
          <span className={"bus-code" + (index === 0 ? " next-bus" : "")}>{bus.code}</span>
          <div className="departure-destination"><h3>{position.direction.title}</h3><p>Terakhir: {position.lastStop} · {bus.passengers}/{bus.capacity} penumpang</p><button className="board-map-link" onClick={() => onOpenMap(bus.id)}>Lihat posisi bus</button></div>
          <div className="departure-estimate"><strong className={index === 0 ? "next-estimate" : ""}>{position.atTerminal ? "TIBA DI TERMINAL" : arrivalAt(bus, position.nextIndex).label.toUpperCase()}</strong><p>{position.nextStop}</p></div>
        </article>;
      })}</div>
      {!records.length && <p className="board-footnote">Belum ada armada untuk arah pilihan.</p>}
      <div className="board-footnote"><p>{isDemo ? "Posisi dan waktu adalah data simulasi." : "Posisi menunjukkan halte terakhir yang dilaporkan supir."}</p>
        <span>{isDemo ? "Estimasi simulasi" : "Pembaruan berkala"}</span></div>
    </div>
  </section>;
}

function CorridorCatalog({ onChooseCorridor }) {
  const photos = [bukatejaPhoto, bulupituPhoto];
  return <section className="landing-section catalog-section" aria-labelledby="catalog-heading" data-reveal>
    <div className="section-heading">
      <div><h2 id="catalog-heading">Katalog koridor & arteri<br />utama</h2>
        <p>Pilihan lintasan operasional Trans Jateng yang menghubungkan simpul vital<br className="desktop-break" /> Kabupaten Banyumas dan Purbalingga.</p></div>
      <a className="all-routes" href="#koridor">Semua rute</a>
    </div>
    <div className="corridor-cards">{routeDirections.map((direction, index) =>
      <a className="corridor-card" key={direction.id} href="#koridor" onClick={() => onChooseCorridor(index === 1)}>
        <img src={photos[index]} width={index ? 550 : 522} height={index ? 201 : 219}
          loading="lazy" alt={"Bus Trans Jateng · " + direction.title} />
        <div className="corridor-card-copy"><h3>{direction.title}</h3>
          <p><strong>Urutan lintasan:</strong> {direction.description}</p>
          <div>Panjang lintasan: ~{direction.lengthKm} km <span aria-hidden="true">↗</span></div>
        </div>
      </a>)}</div>
  </section>;
}

function Capabilities() {
  return <section className="landing-section capabilities-section" aria-labelledby="capabilities-heading" data-reveal>
    <div><h2 id="capabilities-heading">Kapabilitas <span>utama</span><br />SmartStop.</h2>
      <p>Mudah mencari halte terdekat dan mengetahui kedatangan bus</p></div>
    <div className="capability-list">
      <details open name="capability">
        <summary><span className="capability-number">01</span><h3>Real-Time Telemetry & Schedule Sync</h3></summary>
        <p>Berlaku tarif untuk 1× jalan: Rp4.000 (Umum) dan Rp2.000 (Pelajar & Buruh).</p>
      </details>
      <details name="capability">
        <summary><span className="capability-number">02</span><div><small>Dynamic nodes</small><h3>Interactive Route Mapping & Node Alerts</h3></div></summary>
        <p>Telusuri urutan halte pada kedua arah perjalanan. <a href="#peta">Lihat peta halte →</a></p>
      </details>
      <details name="capability">
        <summary><span className="capability-number">03</span><div><small className="report-tag">Pelaporan cepat</small><h3>Citizen Feedback & Discrepancy Reporting</h3></div></summary>
        <p>Sampaikan kondisi halte atau kendala perjalanan. <a href="#lapor">Buat laporan →</a></p>
      </details>
    </div>
  </section>;
}

function CorridorSchematic({ direction, bus, selected, onSelect, onChooseBus, onOpenMap }) {
  const viewport = useRef(null);
  const [first, last] = [direction.stops[0], direction.stops.at(-1)];
  const position = bus ? busLocation(bus) : null;
  const activeIndex = position?.lastIndex ?? -1;
  const progressPercent = position?.percent ?? 0;
  const progress = Math.round(progressPercent);
  const currentStop = position?.lastStop;

  useEffect(() => {
    const container = viewport.current;
    if (!container) return;
    function showCurrentStop() {
      const node = container.querySelector('[data-bus-position]');
      if (!node) return;
      const item = node.getBoundingClientRect();
      const visible = container.getBoundingClientRect();
      if (item.left >= visible.left + 12 && item.right <= visible.right - 12) return;
      container.scrollTo({
        left: Math.max(0, container.scrollLeft + item.left - visible.left + item.width / 2 - container.clientWidth / 2),
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"
      });
    }
    showCurrentStop();
    if (!("ResizeObserver" in window)) return;
    const observer = new ResizeObserver(showCurrentStop);
    observer.observe(container);
    return () => observer.disconnect();
  }, [bus?.id, bus?.stopPosition]);

  return <article className={"schematic-card " + direction.id} data-reveal aria-label={direction.heading}>
    <div className="schematic-labels"><h3>{direction.heading}</h3>
      <span>{direction.stops.length} titik singgah · {direction.title}</span></div>
    <div className="route-progress-summary">
      <div><small>{bus ? "Terakhir dilewati · " + bus.code : "Lintasan arah lainnya"}</small><strong>{currentStop || direction.title}</strong>{bus && <small>Menuju {position.nextStop}</small>}</div>
      {bus ? <div><strong>{progress}%</strong><small>Progres bus · {bus.source === "api" ? "laporan supir" : "simulasi"}</small></div> : <button className="tracking-map-link secondary" disabled={!onChooseBus} onClick={onChooseBus}>{onChooseBus ? "Pilih bus arah ini" : "Belum ada bus aktif"}</button>}
    </div>
    <div className="timeline-viewport" ref={viewport} role="region" aria-label={"Skema horizontal " + direction.title} tabIndex="0">
      <div className="timeline-route" style={{ "--stop-count": direction.stops.length }}>
        <div className="route-progress-track" role={bus ? "progressbar" : undefined} aria-label={bus ? "Progres " + bus.code : undefined}
          aria-valuemin={bus ? 0 : undefined} aria-valuemax={bus ? 100 : undefined} aria-valuenow={bus ? progress : undefined}
          aria-valuetext={bus ? "Terakhir melewati " + currentStop + ", menuju " + position.nextStop : undefined}>
          <span className="route-progress-fill" style={{ width: progressPercent + "%" }} />
        </div>
        {bus && <div className="timeline-bus-track"><span data-bus-position className="timeline-bus-marker" style={{ left: progressPercent + "%" }}><BusSymbol />{bus.code}</span></div>}
        <ol className="stop-timeline">{direction.stops.map((stop, index) =>
          <li key={stop} style={{ "--stop-index": Math.min(index, 11) }}
            data-state={index < activeIndex ? "complete" : index === activeIndex ? "current" : "upcoming"}>
            <button aria-label={"Halte " + index + ", " + stop} aria-current={index === activeIndex ? "step" : undefined}
              aria-pressed={selected?.direction === direction.id && selected.name === stop} onClick={() => onSelect({ direction: direction.id, name: stop })}>
              <span>{index}</span><strong>{stop}</strong>
            </button>
            {index === 0 && <small>Awal<br />keberangkatan</small>}
            {index === direction.stops.length - 1 && <small>Akhir<br />perjalanan</small>}
          </li>)}</ol>
      </div>
    </div>
    <p className="timeline-help">Ikon bus mengikuti {bus?.source === "api" ? "laporan supir" : "data simulasi"}. Pilih halte untuk melihat detail; geser untuk melihat seluruh lintasan.</p>
    {selected?.direction === direction.id && <div className="schematic-stop-detail"><div><small>Halte dipilih</small><strong>{selected.name}</strong></div><button className="tracking-map-link secondary" disabled={!onOpenMap} onClick={() => onOpenMap?.(selected.name)}>Pantau bus di halte ini</button></div>}
    <div className="complete-stops"><h4><span aria-hidden="true">▢</span> Daftar utuh {direction.stops.length} halte ({first} → {last})</h4>
      <ol className="stop-grid">{direction.stops.map((stop, index) =>
        <li key={stop}><button onClick={() => onSelect({ direction: direction.id, name: stop })} aria-pressed={selected?.direction === direction.id && selected.name === stop}>
          <span className={index === 0 || index === direction.stops.length - 1 ? "terminal-node" : ""}>{index}</span>
          <span>{stop}</span>
        </button></li>)}</ol>
    </div>
  </article>;
}

function Schematics({ fleet, monitoredBus, onSelectBus, simulationRunning, onToggleSimulation, onOpenMap, isDemo = true }) {
  const bus = fleet.find(item => item.id === monitoredBus) || fleet[0];
  const [selected, setSelected] = useState(null);
  return <section className="landing-section schematic-section" aria-labelledby="schematic-heading">
    <div className="schematic-heading"><h2 id="schematic-heading" data-reveal>Skematik koridor</h2>
      <BusPicker value={bus.id} options={fleet} onChange={onSelectBus} /></div>
    <p className="schematic-selection" role="status">
      Pantau posisi bus dan halte berikutnya. {isDemo ? "Data contoh untuk demonstrasi." : "Posisi berdasarkan laporan halte dari supir."}
    </p>
    <div className="schematic-monitor"><BusStatus bus={bus} /><div className="schematic-monitor-actions"><SimulationToggle isDemo={isDemo} running={simulationRunning} onToggle={onToggleSimulation} /><button className="tracking-map-link" onClick={() => onOpenMap(bus.id)}>Pantau & pesan tiket</button></div></div>
    {[...routeDirections].sort((a, b) => Number(b.id === bus.direction) - Number(a.id === bus.direction)).map(direction => {
      const directionBus = fleet.find(item => item.direction === direction.id);
      return <CorridorSchematic key={direction.id} direction={direction} bus={bus.direction === direction.id ? bus : null} selected={selected} onSelect={setSelected}
        onChooseBus={directionBus ? () => onSelectBus(directionBus.id) : undefined} onOpenMap={directionBus ? name => onOpenMap(bus.direction === direction.id ? bus.id : directionBus.id, name) : undefined} />;
    })}
  </section>;
}

export function SiteFooter() {
  return <footer className="landing-footer">
    <div className="footer-slogan" data-reveal>“Perjalanan lebih <span>mudah</span>,<br />waktu lebih <span>teratur.</span>”</div>
    <div className="footer-glow" />
    <div className="footer-columns">
      <div><h3><span aria-hidden="true">▤</span> Koridor & halte</h3>
        <p>Jaringan terintegrasi armada bus kota dan informasi perjalanan untuk mobilitas yang lebih teratur.</p>
        <a href="#koridor">Jelajahi koridor →</a></div>
      <div><h3><span aria-hidden="true">♧</span> Bantuan & dispatcher</h3>
        <p>Bantuan untuk kendala transaksi, laporan halte, atau keterlambatan.</p>
        <a href="#lapor">Sampaikan laporan →</a><small>Status integrasi: data contoh</small></div>
      <div><h3><span aria-hidden="true">⌘</span> Konektivitas kota</h3>
        <p>Ikuti informasi perjalanan dan kondisi halte di wilayah Banyumas dan Purbalingga.</p>
        <a href="#peta">Temukan halte →</a></div>
    </div>
    <div className="footer-bottom"><p>© 2026 SmartStop Municipal Mobility. All rights reserved.</p>
      <a href="#jadwal">Jadwal & informasi layanan ↑</a></div>
  </footer>;
}

export default function Landing({ name, category, trip, setTrip, onChooseCorridor, ...tracking }) {
  const root = useRef(null);
  useEffect(() => {
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.06, rootMargin: "0px 0px -30px 0px" });
    root.current.querySelectorAll("[data-reveal]").forEach(element => {
      if (element.getBoundingClientRect().top < innerHeight) return;
      element.classList.add("await-reveal");
      observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);
  return <div id="beranda" className={"landing landing-" + category} data-category={category} ref={root}>
    <a className="skip" href="#pencarian" onClick={event => {
      event.preventDefault();
      root.current.querySelector(".planner-fields button").focus();
    }}>Langsung ke pencarian rute</a>
    <SiteHeader name={name} category={category} />
    <div id="jadwal" className="landing-hero">
      <div className="hero-content">
        <h1>Perjalanan <span>teratur,</span><br />mobilitas tanpa <em>friksi.</em></h1>
        <div id="pencarian"><RoutePlanner trip={trip} setTrip={setTrip} category={category} /></div>
        <p className="hero-description">Temukan halte, ikuti perkembangan perjalanan bus,<br className="desktop-break" /> dan rencanakan perjalananmu dalam satu tempat.</p>
      </div>
    </div>
    <div className="landing-content">
      <FleetFeedNotice {...tracking} />
      <DepartureBoard {...tracking} />
      <CorridorCatalog onChooseCorridor={onChooseCorridor} />
      <Capabilities />
      <Schematics {...tracking} />
    </div>
    <SiteFooter />
  </div>;
}
