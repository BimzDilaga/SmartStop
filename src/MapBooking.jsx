import React, { useEffect, useState } from "react";
import PickerDialog from "./PickerDialog.jsx";
import { StopPicker } from "./RoutePickers.jsx";
import { ticketQuote } from "./fleet.js";
import { rupiah } from "./transit.js";

export default function MapBooking({ bus, direction, selected, onSelect, destination, onDestination, category, onBook }) {
  const [quantity, setQuantity] = useState(1);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  useEffect(() => { setQuantity(1); }, [bus.id]);
  const from = direction.stops[selected];
  const to = direction.stops[destination];
  const quote = ticketQuote({ bus, from, to, quantity, category });

  function confirm() {
    if (!quote.eligible) return;
    const now = new Date(Date.now() + quote.arrival.minutes * 60000);
    const ticket = {
      id: "DEMO-" + Date.now().toString(36).toUpperCase(), from, to, quantity,
      fare: quote.fare, busId: bus.id, busCode: bus.code,
      time: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })
    };
    onBook(ticket);
    setConfirmed(ticket);
  }

  return <div className="map-booking" id="map-booking">
    <div className="monitor-panel-heading"><div><p className="tracking-eyebrow">LANJUTKAN PERJALANAN</p><h2>Pesan tiket dari sini.</h2></div><span className="booking-category">{category === "pelajar" ? "Pelajar" : "Umum"}</span></div>
    <p className="booking-intro">Bus {bus.number} · {direction.title}</p>
    <div className="map-booking-fields"><StopPicker value={from} otherValue={to} variant="map-from" label="Halte naik" options={direction.stops.slice(0, -1)} onChange={name => onSelect(direction.stops.indexOf(name))} />
      <StopPicker value={to} otherValue={from} variant="map-to" label="Halte tujuan" options={direction.stops.slice(selected + 1)} disabled={selected === direction.stops.length - 1} onChange={name => onDestination(direction.stops.indexOf(name))} /></div>
    <div className="booking-quantity"><div><strong>Jumlah penumpang</strong><small>Maks. {Math.min(5, quote.available)} pada pratinjau ini</small></div><div role="group" aria-label="Jumlah penumpang"><button type="button" disabled={quantity <= 1} aria-label="Kurangi penumpang" onClick={() => setQuantity(value => value - 1)}>−</button><output aria-live="polite">{quantity}</output><button type="button" disabled={quantity >= Math.min(5, quote.available)} aria-label="Tambah penumpang" onClick={() => setQuantity(value => value + 1)}>+</button></div></div>
    <div className="booking-fare"><span>{rupiah(quote.fare)} × {quantity} penumpang</span><strong>{rupiah(quote.total)}</strong></div>
    {!quote.eligible && <p className="booking-warning" role="status">{quote.reason}</p>}
    <button type="button" className="map-primary-action booking-submit" disabled={!quote.eligible} onClick={() => { setConfirmed(null); setReviewOpen(true); }}>Tinjau & pesan tiket</button>
    <p className="booking-disclaimer">Pemesanan demo tanpa pembayaran. {bus.source === "api" ? "Kapasitas dan ETA mengikuti laporan server." : "Kapasitas dan ETA menggunakan data simulasi."} Ketersediaan saat naik dapat berubah.</p>
    <PickerDialog open={reviewOpen} onClose={() => setReviewOpen(false)} title={confirmed ? "Tiket demo berhasil dibuat" : "Tinjau perjalananmu"}
      description="Simulasi frontend. Tidak ada pembayaran atau pemesanan yang dikirim ke operator." className="map-ticket-dialog">
      {close => <div className="map-ticket-review">
        {confirmed ? <><div className="ticket-success-mark" aria-hidden="true">✓</div><p className="tracking-eyebrow">BUKTI SIMULASI</p><h3>{confirmed.id}</h3><p>{confirmed.from} → {confirmed.to}</p><dl><div><dt>Armada</dt><dd>{confirmed.busCode}</dd></div><div><dt>Estimasi berangkat</dt><dd>{confirmed.time} WIB</dd></div><div><dt>Penumpang</dt><dd>{confirmed.quantity} orang</dd></div><div><dt>Total simulasi</dt><dd>{rupiah(confirmed.fare * confirmed.quantity)}</dd></div></dl><p className="booking-warning">Tiket contoh ini tidak berlaku untuk perjalanan.</p><button className="map-primary-action booking-submit" onClick={close}>Selesai</button></> : <>
          <span className="booking-category">Bus {bus.number} · {bus.code}</span><h3>{from}</h3><p className="ticket-destination">Tujuan: <strong>{to}</strong></p><dl><div><dt>Estimasi tiba di halte naik</dt><dd>{quote.arrival.label}</dd></div><div><dt>Penumpang</dt><dd>{quantity} orang</dd></div><div><dt>Kategori</dt><dd>{category === "pelajar" ? "Pelajar" : "Umum"}</dd></div><div><dt>Total simulasi</dt><dd>{rupiah(quote.total)}</dd></div></dl>
          {!quote.eligible && <p className="booking-warning" role="status">{quote.reason}</p>}<div className="map-ticket-actions"><button className="map-secondary-action" onClick={close}>Ubah pilihan</button><button className="map-primary-action" disabled={!quote.eligible} onClick={confirm}>Konfirmasi tiket demo</button></div>
        </>}
      </div>}
    </PickerDialog>
  </div>;
}
