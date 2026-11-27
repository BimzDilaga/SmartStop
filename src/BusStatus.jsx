import React from "react";
import { arrivalAt, busLocation } from "./fleet.js";
import bukatejaPhoto from "../assets/koridor-bukateja.png";
import bulupituPhoto from "../assets/koridor-bulupitu.png";
import "./tracking.css";

export function BusSymbol() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><rect x="5" y="3" width="14" height="16" rx="3" /><path d="M5 12h14M8 19v2m8-2v2M8 16h.01M16 16h.01M9 6h6" /></svg>;
}

export function SimulationToggle({ running, onToggle, isDemo = true }) {
  return <button className="simulation-toggle" type="button" aria-pressed={isDemo ? running : undefined} disabled={!isDemo} onClick={onToggle}>
    <span aria-hidden="true">{isDemo ? running ? "Ⅱ" : "▷" : "◎"}</span>{isDemo ? running ? "Jeda simulasi" : "Jalankan simulasi" : "Laporan supir"}
  </button>;
}

export function FleetFeedNotice({ isDemo, fleetError, onRetry }) {
  if (isDemo) return null;
  return <div className={"fleet-feed-notice" + (fleetError ? " is-error" : "")} role="status"><p>{fleetError ? "Pembaruan tertunda. Tampilan menggunakan laporan terakhir yang berhasil diterima. " + fleetError : "Status berdasarkan laporan supir. Pembaruan diminta setiap 15 detik."}</p>{fleetError && <button onClick={onRetry}>Coba lagi</button>}</div>;
}

export default function BusStatus({ bus, boardingIndex }) {
  const position = busLocation(bus);
  const arrival = arrivalAt(bus, boardingIndex ?? position.nextIndex);
  return <div className="bus-status-card">
    <div className="bus-status-identity"><img src={bus.direction === "bukateja" ? bukatejaPhoto : bulupituPhoto} alt={"Bus Trans Jateng, " + position.direction.title} width="124" height="80" />
      <div><p className="tracking-eyebrow">ARMADA DIPANTAU · {bus.source === "api" ? "LAPORAN SUPIR" : "SIMULASI"}</p><h3>Bus {bus.number} <span>{bus.code}</span></h3><p>{position.direction.title}</p></div>
      <span className={"tracking-status " + (position.available ? "" : "is-full")}>{position.available ? bus.source === "api" ? bus.movement === "at_stop" ? "Tiba di halte" : bus.movement === "finished" ? "Selesai" : "Menuju halte berikutnya" : position.atTerminal ? "Tiba di terminal" : position.position < .15 ? "Siap berangkat" : "Dalam perjalanan" : "Penuh"}</span>
    </div>
    <div className="bus-location-copy"><span>Terakhir dilaporkan di</span><strong>{position.lastStop}</strong><span>Berikutnya</span><strong>{position.nextStop}</strong>{bus.reportedAt && <><span>Waktu laporan</span><strong>{new Date(bus.reportedAt).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })} WIB</strong></>}</div>
    <div className="bus-status-metrics"><div><span>Penumpang</span><strong>{bus.passengers}<small> / {bus.capacity} orang</small></strong></div><div><span>{boardingIndex == null ? "Ke halte berikutnya" : "Tiba di halte pilihan"}</span><strong className={arrival.state === "passed" ? "has-passed" : ""}>{arrival.label}</strong></div><div><span>Progres lintasan</span><strong>{Math.round(position.percent)}<small>%</small></strong></div></div>
  </div>;
}
