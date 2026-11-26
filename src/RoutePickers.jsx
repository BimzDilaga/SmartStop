import React, { useState } from "react";
import PickerDialog from "./PickerDialog.jsx";
import { corridor, routeDirections } from "./transit.js";
import bukatejaPhoto from "../assets/koridor-bukateja.png";
import bulupituPhoto from "../assets/koridor-bulupitu.png";
import "./pickers.css";

// Visual fixtures only. Actual fleet records and photos will come from the backend.
const buses = Array.from({ length: 14 }, (_, index) => ({
  id: String(index + 1),
  number: String(index + 1).padStart(2, "0"),
  direction: routeDirections[index % 2],
  photo: index % 2 === 0 ? bukatejaPhoto : bulupituPhoto
}));

function stopLabel(stop) {
  if (stop === "Terminal Bulupitu") return "Terminal Bulupitu (Purwokerto)";
  if (stop === "Terminal Bukateja") return "Bukateja (Purbalingga)";
  return stop;
}

export function StopPicker({ value, otherValue, label, variant, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const results = corridor.stops.filter(stop => stopLabel(stop).toLocaleLowerCase("id").includes(query.trim().toLocaleLowerCase("id")));
  return <>
    <button type="button" className={"stop-field stop-trigger stop-" + variant}
      aria-label={label} aria-haspopup="dialog" aria-expanded={open}
      onClick={() => { setQuery(""); setOpen(true); }}>
      <span>{label}</span>
      <span className="stop-trigger-value"><span>{stopLabel(value)}</span><span aria-hidden="true">⌄</span></span>
    </button>
    <PickerDialog open={open} onClose={() => setOpen(false)} title={label}
      description="Cari nama halte, lalu pilih titik singgah perjalananmu." className="stop-dialog">
      {close => <>
        <div className="stop-search">
          <label className="visually-hidden" htmlFor={"search-stop-" + variant}>Cari halte</label>
          <input data-initial-focus id={"search-stop-" + variant} type="search" placeholder="Cari halte atau terminal…"
            value={query} onChange={event => setQuery(event.target.value)} autoComplete="off" />
          <p role="status">{results.length} halte ditemukan</p>
        </div>
        <div className="picker-content stop-options">
          {results.length ? <ul>{results.map(stop => <li key={stop}>
            <button type="button" disabled={stop === otherValue} aria-pressed={stop === value}
              onClick={() => { onChange(stop); close(); }}>
              <span className="stop-option-icon" aria-hidden="true">◎</span>
              <span><strong>{stopLabel(stop)}</strong><small>
                {stop === otherValue ? "Sudah dipakai sebagai halte pasangan" : stop === value ? "Pilihan saat ini" : "Koridor Purwokerto–Bukateja"}
              </small></span>
              {stop === value && <span className="option-check" aria-hidden="true">✓</span>}
            </button>
          </li>)}</ul> : <div className="picker-empty"><strong>Halte belum ditemukan</strong><p>Coba kata yang lebih singkat, misalnya “Sokaraja”.</p></div>}
        </div>
      </>}
    </PickerDialog>
  </>;
}

export function BusPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const current = buses.find(bus => bus.id === value) || buses[0];
  const chosen = buses.find(bus => bus.id === draft) || current;
  return <>
    <button className="bus-picker-trigger" type="button" aria-haspopup="dialog" aria-expanded={open}
      aria-label={"Pilih bus, Bus " + current.number} onClick={() => { setDraft(value); setOpen(true); }}>
      <img src={current.photo} alt="" width="48" height="40" />
      <span><small>Pilih armada</small><strong>Bus {current.number}</strong></span><span aria-hidden="true">⌄</span>
    </button>
    <PickerDialog open={open} onClose={() => setOpen(false)} title="Pilih armada bus"
      description="Pilih bus untuk melihat skema koridornya." className="bus-dialog">
      {close => <>
        <div className="picker-content bus-picker-body">
          <article className="bus-preview">
            <div className="bus-preview-photo"><img key={chosen.photo} src={chosen.photo} alt={"Bus Trans Jateng · " + chosen.direction.title} />
              <span>Koridor 1</span></div>
            <div className="bus-preview-copy" key={chosen.id}>
              <p className="bus-preview-caption">Armada pilihan</p><h3>Bus {chosen.number}</h3>
              <p>{chosen.direction.title}</p>
              <div className="bus-route-label"><span aria-hidden="true">◎</span><span>{chosen.direction.stops[0]}</span></div>
              <div className="bus-route-label"><span aria-hidden="true">↓</span><span>{chosen.direction.stops.at(-1)}</span></div>
              <small>Foto dan armada contoh untuk pratinjau.</small>
            </div>
          </article>
          <div className="bus-grid" aria-label="Daftar armada">{buses.map(bus =>
            <button type="button" key={bus.id} aria-label={"Bus " + bus.number}
              aria-pressed={bus.id === draft} onClick={() => setDraft(bus.id)}>
              <img src={bus.photo} alt="" width="120" height="64" loading="lazy" />
              <span><strong>Bus {bus.number}</strong><span className="bus-option-check" aria-hidden="true">{bus.id === draft ? "✓" : "↗"}</span></span>
            </button>)}</div>
        </div>
        <div className="picker-footer"><div role="status"><small>Armada dipilih</small><strong>Bus {chosen.number}</strong></div>
          <button className="picker-confirm" type="button" onClick={() => { onChange(chosen.id); close(); }}>Gunakan Bus {chosen.number} <span aria-hidden="true">→</span></button>
        </div>
      </>}
    </PickerDialog>
  </>;
}
