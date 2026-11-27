import React, { useEffect, useMemo, useRef, useState } from "react";
import { SiteFooter, SiteHeader } from "./Landing.jsx";
import { routeDirections } from "./transit.js";
import { arrivalAt, busLocation } from "./fleet.js";
import BusStatus, { BusSymbol, SimulationToggle, FleetFeedNotice } from "./BusStatus.jsx";
import MapBooking from "./MapBooking.jsx";
import "./stop-map.css";

// Display coordinates for the schematic only. These are not geographic positions.
// Keep the real map/coordinate integration in the backend team's scope.
const waypoints = {
  bukateja: [[0, 14, 77], [3, 31, 65], [8, 46, 51], [13, 64, 44], [18, 77, 32], [23, 88, 20]],
  bulupitu: [[0, 88, 20], [9, 64, 44], [14, 46, 51], [20, 31, 65], [26, 19, 48], [30, 13, 30], [34, 7, 42], [38, 8, 62], [43, 14, 77]]
};

function schematicPoints(direction) {
  const anchors = waypoints[direction.id];
  return direction.stops.map((name, index) => {
    const end = anchors.findIndex(anchor => anchor[0] >= index);
    const [last, x2, y2] = anchors[end];
    const [first, x1, y1] = anchors[Math.max(0, end - 1)];
    const ratio = last === first ? 0 : (index - first) / (last - first);
    return { name, index, x: x1 + (x2 - x1) * ratio, y: y1 + (y2 - y1) * ratio };
  });
}

function Icon({ name, ...props }) {
  const paths = {
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    layers: <><path d="m3 8 9-5 9 5-9 5-9-5Zm0 5 9 5 9-5M3 18l9 5 9-5" /></>,
    focus: <><circle cx="12" cy="12" r="6" /><path d="M12 2v5m0 10v5M2 12h5m10 0h5" /></>,
    bus: <><rect x="5" y="3" width="14" height="16" rx="3" /><path d="M5 12h14M8 19v2m8-2v2M8 16h.01M16 16h.01M9 6h6" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    access: <><circle cx="12" cy="4" r="1.5" /><path d="M5 9h14m-7-2v7m0 0-4 7m4-7 4 7" /></>,
    seat: <><path d="M7 3v10a3 3 0 0 0 3 3h9M5 19h14m-9-3v5m7-5v5" /><path d="M10 6v6h7" /></>
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}

function CorridorMap({ direction, points, selected, onSelect, buses, activeBus, onSelectBus }) {
  const [zoom, setZoom] = useState(1);
  const current = points[selected];
  const landmarks = waypoints[direction.id].map(anchor => anchor[0]);
  const markers = points.filter(point => landmarks.includes(point.index) || point.index === selected);
  const busPoints = buses.map(bus => {
    const location = busLocation(bus);
    const start = points[location.lastIndex];
    const end = points[location.nextIndex];
    const fraction = location.position - location.lastIndex;
    return { ...bus, x: start.x + (end.x - start.x) * fraction, y: start.y + (end.y - start.y) * fraction };
  });
  const centerX = zoom === 1 ? 0 : Math.max(100 * (1 - zoom), Math.min(0, 50 - current.x * zoom));
  const centerY = zoom === 1 ? 0 : Math.max(100 * (1 - zoom), Math.min(0, 50 - current.y * zoom));

  return <div className="stop-map-visual" aria-label="Skema interaktif koridor bus">
    <div className="map-canvas">
      <div className="map-drawing" style={{ transform: `translate(${centerX}%, ${centerY}%) scale(${zoom})` }}>
        <svg className="map-art" viewBox="0 0 1000 640" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <pattern id="map-grid" width="54" height="54" patternUnits="userSpaceOnUse"><path d="M54 0H0V54" fill="none" stroke="#dce9ed" strokeWidth="1" /></pattern>
            <linearGradient id="map-route" x1="0" y1="1" x2="1" y2="0"><stop stopColor="#087cab" /><stop offset="1" stopColor="#24b7e7" /></linearGradient>
          </defs>
          <rect width="1000" height="640" fill="#eff5f5" />
          <rect width="1000" height="640" fill="url(#map-grid)" />
          <path d="M410-30c-10 120 220 108 164 256S360 407 422 670" stroke="#d1eaf0" strokeWidth="34" fill="none" />
          <path d="M55 55h190v88H80ZM682 490h240v115H760ZM705 48h102v60H705Z" fill="#dfecdf" />
          <g fill="none" stroke="#fff" strokeWidth="13" strokeLinejoin="round">
            <path d="M-20 530 260 530 385 405 700 405 1020 165M-20 165h295l125 120h620M260-20v200l90 140v340M760-20v360l170 180v140M-20 380h240L520 100h500" />
          </g>
          <polyline points={points.map(point => `${point.x * 10},${point.y * 6.4}`).join(" ")} fill="none" stroke="#fff" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
          <polyline className="map-route-line" pathLength="1" points={points.map(point => `${point.x * 10},${point.y * 6.4}`).join(" ")} fill="none" stroke="url(#map-route)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          {points.map(point => <circle key={point.name} cx={point.x * 10} cy={point.y * 6.4} r={point.index === selected ? 8 : 4} fill="white" stroke="#078ab8" strokeWidth="2.5" />)}
        </svg>
        <span className="map-region region-purwokerto">Purwokerto</span>
        <span className="map-region region-sokaraja">Sokaraja</span>
        <span className="map-region region-purbalingga">Purbalingga</span>
        <span className="map-region region-bukateja">Bukateja</span>
        {markers.map(point => <button key={point.name}
          className={"map-pin" + (point.index === selected ? " is-selected" : "") + (point.x > 80 ? " label-left" : "")}
          style={{ left: point.x + "%", top: point.y + "%", "--map-zoom": zoom }}
          aria-label={"Pilih halte " + point.name} aria-pressed={point.index === selected}
          onClick={() => onSelect(point.index)}>
          <span className="map-pin-dot"><Icon name="pin" /></span>
          <span className="map-pin-label">{point.name}</span>
        </button>)}
        {busPoints.map(bus => <button key={bus.id} className={"map-bus-marker" + (bus.id === activeBus.id ? " is-active" : "")}
          style={{ left: bus.x + "%", top: bus.y + "%", "--map-zoom": zoom }} aria-label={"Pantau bus " + bus.number + ", " + bus.code}
          aria-pressed={bus.id === activeBus.id} onClick={() => onSelectBus(bus.id)}><BusSymbol /><strong>{bus.number}</strong>{bus.id === activeBus.id && <span>{bus.code}</span>}</button>)}
      </div>
    </div>
    <div className="map-corner-tag"><Icon name="layers" /><span>Skema koridor<strong>Bukan peta geografis</strong></span></div>
    <div className="map-zoom-tools" role="group" aria-label="Kontrol skema">
      <button aria-label="Perbesar skema" disabled={zoom >= 1.8} onClick={() => setZoom(value => Math.min(1.8, +(value + .2).toFixed(1)))}>+</button>
      <button aria-label="Perkecil skema" disabled={zoom <= 1} onClick={() => setZoom(value => Math.max(1, +(value - .2).toFixed(1)))}>−</button>
      <button aria-label="Atur ulang skema" onClick={() => setZoom(1)}><Icon name="focus" /></button>
    </div>
    <div className="map-bus-hud"><span className="map-hud-icon"><BusSymbol /></span><div><strong>{activeBus.code} · {activeBus.passengers}/{activeBus.capacity} penumpang</strong><span>{arrivalAt(activeBus, selected).label} · {activeBus.source === "api" ? "laporan supir" : "simulasi"}</span></div></div>
  </div>;
}

export default function StopMap({ name, category, fleet, monitoredBus, onSelectBus, simulationRunning, onToggleSimulation, focus, onBook, isDemo = true, fleetError, onRetry }) {
  const initialDirection = fleet.some(bus => bus.direction === focus?.direction) ? focus.direction : fleet.find(bus => bus.id === monitoredBus)?.direction || fleet[0]?.direction || "bukateja";
  const [directionId, setDirectionId] = useState(initialDirection);
  const [selected, setSelected] = useState(() => {
    const direction = routeDirections.find(item => item.id === initialDirection);
    const index = direction.stops.indexOf(focus?.stop);
    return index >= 0 ? index : initialDirection === "bukateja" ? 8 : 9;
  });
  const [destination, setDestination] = useState(() => routeDirections.find(item => item.id === initialDirection).stops.length - 1);
  const [query, setQuery] = useState("");
  const root = useRef(null);
  const direction = routeDirections.find(item => item.id === directionId);
  const buses = fleet.filter(bus => bus.direction === directionId);
  const activeBus = buses.find(bus => bus.id === monitoredBus) || buses[0];
  const orderedBuses = [...buses].sort((a, b) => (arrivalAt(a, selected).minutes ?? Infinity) - (arrivalAt(b, selected).minutes ?? Infinity));
  const points = useMemo(() => schematicPoints(direction), [direction]);
  const search = query.trim().toLocaleLowerCase("id-ID");
  const results = points.filter(point => point.name.toLocaleLowerCase("id-ID").includes(search));
  const stop = points[selected].name;
  const terminal = selected === 0 || selected === points.length - 1;

  useEffect(() => {
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: .08 });
    root.current?.querySelectorAll("[data-reveal]").forEach(element => {
      if (element.getBoundingClientRect().top < innerHeight) return;
      element.classList.add("await-reveal");
      observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  function changeDirection(id) {
    const available = fleet.filter(bus => bus.direction === id);
    if (!available.length) return;
    const next = routeDirections.find(item => item.id === id);
    const match = next.stops.indexOf(stop);
    const nextIndex = match < 0 ? id === "bukateja" ? 8 : 9 : match;
    setDirectionId(id);
    setSelected(nextIndex);
    setDestination(next.stops.length - 1);
    setQuery("");
    const best = [...available].filter(bus => bus.passengers < bus.capacity && arrivalAt(bus, nextIndex).minutes !== null).sort((a, b) => arrivalAt(a, nextIndex).minutes - arrivalAt(b, nextIndex).minutes)[0] || available[0];
    onSelectBus(best.id);
  }
  function selectStop(index) {
    setSelected(index);
    setDestination(current => current > index ? current : direction.stops.length - 1);
  }
  function showBooking() {
    root.current.querySelector("#map-booking")?.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }

  if (!activeBus) return <div className="landing stop-map-page" ref={root}><SiteHeader name={name} category={category} activePage="peta" /><div className="fleet-data-empty"><h1>Belum ada bus pada arah ini</h1><p>Laporan perjalanan akan tampil setelah armada tersedia.</p>{routeDirections.filter(item => fleet.some(bus => bus.direction === item.id)).map(item => <button className="tracking-map-link" key={item.id} onClick={() => changeDirection(item.id)}>{item.title}</button>)}</div><SiteFooter /></div>;

  return <div className="landing stop-map-page" ref={root}>
    <a className="skip" href="#map-stop-search" onClick={event => {
      event.preventDefault();
      root.current.querySelector("#map-stop-search").focus();
    }}>Langsung ke pencarian halte</a>
    <SiteHeader name={name} category={category} activePage="peta" />
    <div role="main">
    <div className="map-page-intro">
      <div className="map-page-container">
        <div className="map-breadcrumb"><a href="#beranda">Beranda</a><span>/</span><span>Peta halte</span></div>
        <div className="map-title-row"><div><p className="map-eyebrow">JELAJAHI KORIDOR 1</p>
          <h1>Pantau busnya.<br /><span>Atur perjalananmu.</span></h1>
          <p>Lihat posisi bus, perkiraan tiba, dan jumlah penumpang. Pilih halte, lalu pesan tiket dari sini.</p></div>
          <div className="map-route-summary"><Icon name="bus" /><div><strong>{buses.length} armada · {direction.title}</strong><span>{isDemo ? "Data simulasi" : "Posisi berdasarkan laporan supir"}</span></div></div>
        </div>
      </div>
    </div>

    <div className="map-page-container map-page-content">
      <FleetFeedNotice isDemo={isDemo} fleetError={fleetError} onRetry={onRetry} />
      <div className="map-workspace">
        <aside className="stop-explorer" aria-label="Pencarian halte">
          <div className="explorer-top"><div className="explorer-heading"><span className="explorer-icon"><Icon name="pin" /></span><div><h2>Temukan halte</h2><p>Pilih arah, lalu titik singgahmu.</p></div></div>
            <div className="direction-switch" role="group" aria-label="Arah perjalanan">
              {routeDirections.map(item => <button key={item.id} disabled={!fleet.some(bus => bus.direction === item.id)} aria-pressed={directionId === item.id} onClick={() => changeDirection(item.id)}>{item.id === "bukateja" ? "Ke Bukateja" : "Ke Bulupitu"}</button>)}
            </div>
            <label className="map-search-label" htmlFor="map-stop-search">Cari nama halte</label>
            <div className="map-search"><Icon name="search" /><input id="map-stop-search" type="search" placeholder="Contoh: Terminal Jompo" value={query} onChange={event => setQuery(event.target.value)} autoComplete="off" /></div>
            <div className="explorer-list-heading"><span role="status">{results.length} halte{search ? " ditemukan" : " pada lintasan"}</span><span>{directionId === "bukateja" ? "1A" : "1B"}</span></div>
          </div>
          <ol className="explorer-stop-list" aria-label={direction.title}>
            {results.map(point => <li key={point.name}><button className={point.index === selected ? "is-selected" : ""}
              aria-pressed={point.index === selected} onClick={() => selectStop(point.index)}>
              <span className="explorer-stop-index">{String(point.index + 1).padStart(2, "0")}</span>
              <span>{point.name}{(point.index === 0 || point.index === points.length - 1) && <small>{point.index === 0 ? "Awal lintasan" : "Akhir lintasan"}</small>}</span>
              {point.index === selected && <span className="stop-selected-check" aria-hidden="true">✓</span>}
            </button></li>)}
          </ol>
          {results.length === 0 && <div className="map-search-empty"><Icon name="search" /><strong>Halte belum ditemukan</strong><p>Coba nama lain atau ubah arah perjalanan.</p><button onClick={() => setQuery("")}>Hapus pencarian</button></div>}
          <div className="explorer-note"><Icon name="layers" /><span>Daftar halte menggunakan data contoh.</span></div>
        </aside>

        <div className="map-main-panel">
          <div className="map-panel-heading"><div><span className="map-route-code">{directionId === "bukateja" ? "1A" : "1B"}</span><div><h2>{direction.title}</h2><p>{points.length} halte · {buses.length} bus{isDemo ? " contoh" : ""}</p></div></div><SimulationToggle isDemo={isDemo} running={simulationRunning} onToggle={onToggleSimulation} /></div>
          <CorridorMap key={directionId} direction={direction} points={points} selected={selected} onSelect={selectStop} buses={buses} activeBus={activeBus} onSelectBus={onSelectBus} />
          <div className="stop-detail" id="selected-stop-detail">
            <div className="map-selected-stop-row"><div className="stop-detail-title" key={directionId + stop} aria-live="polite" aria-atomic="true"><span className="detail-pin"><Icon name="pin" /></span><div><p>{terminal ? "Terminal" : "Halte"} naik & pantauan · {selected + 1}/{points.length}</p><h3>{stop}</h3></div></div><button className="tracking-map-link" onClick={showBooking}>Pesan tiket</button></div>
            <BusStatus bus={activeBus} boardingIndex={selected} />
          </div>
        </div>
      </div>

      <div className="map-operations" data-reveal>
        <div className="map-fleet-panel"><div className="monitor-panel-heading"><div><p className="tracking-eyebrow">PILIH ARMADA</p><h2>Bus menuju halte pilihan</h2><p>{stop} · {direction.title}</p></div><span className="map-demo-badge">{isDemo ? "Simulasi" : "Laporan supir"}</span></div>
          <div className="map-fleet-list">{orderedBuses.map(bus => {
            const arrival = arrivalAt(bus, selected);
            const position = busLocation(bus);
            return <button key={bus.id} className={"fleet-option" + (bus.id === activeBus.id ? " is-selected" : "")} aria-label={"Pilih armada " + bus.code} aria-pressed={bus.id === activeBus.id} onClick={() => onSelectBus(bus.id)}>
              <span className="fleet-option-icon"><BusSymbol /><strong>{bus.code}</strong></span><span className="fleet-option-info"><strong>{arrival.state === "passed" ? "Sudah melewati halte naik" : "Menuju " + stop}</strong><span>Terakhir: {position.lastStop}</span><span className="fleet-capacity-label">{bus.passengers}/{bus.capacity} penumpang {position.available ? "· " + position.available + " kapasitas tersisa" : "· Penuh"}</span><span className="fleet-capacity-track"><i style={{ width: bus.passengers / bus.capacity * 100 + "%" }} /></span></span><span className={"fleet-option-eta " + arrival.state}>{arrival.label}<small>{bus.id === activeBus.id ? "Dipilih" : "Pilih bus"}</small></span>
            </button>;
          })}</div>
        </div>
        <MapBooking key={directionId} bus={activeBus} direction={direction} selected={selected} onSelect={selectStop} destination={destination} onDestination={setDestination} category={category} onBook={onBook} />
      </div>
      <div className="map-data-note"><Icon name="layers" /><p><strong>{isDemo ? "Mode demonstrasi. " : "Laporan perjalanan. "}</strong>{isDemo ? "Posisi bus, penumpang, dan ETA adalah simulasi. " : "Posisi menunjukkan halte terakhir yang dilaporkan supir. "}Skema menunjukkan urutan halte. Pemesanan masih berupa simulasi frontend.</p></div>
    </div>
    </div>
    <SiteFooter />
    <button className="map-mobile-booking" onClick={showBooking}><span><strong>{activeBus.code} · {arrivalAt(activeBus, selected).label}</strong><small>{activeBus.passengers}/{activeBus.capacity} penumpang · {isDemo ? "simulasi" : "laporan supir"}</small></span><span>Pesan tiket</span></button>
  </div>;
}
