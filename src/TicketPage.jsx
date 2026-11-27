import React, { useRef, useState } from "react";
import ServiceLayout, { DemoNote, ServiceIcon } from "./ServiceLayout.jsx";
import { StopPicker } from "./RoutePickers.jsx";
import { corridor, findJourney, rupiah } from "./transit.js";
import { cardFileError, createTicketOrder, departureIsPast, formatTicketDate, todayWib, validateTicketDraft } from "./ticketModel.js";

function TicketSteps({ step }) {
  return <ol className="ticket-steps" aria-label="Tahap pemesanan tiket">{["Pemesanan tiket", "Pembayaran", "Struk tiket"].map((text, index) => <li key={text} aria-current={step === index + 1 ? "step" : undefined} className={step > index + 1 ? "is-complete" : ""}><span>{step > index + 1 ? <ServiceIcon name="check" /> : index + 1}</span><strong>{text}</strong></li>)}</ol>;
}

function RouteSummary({ order }) {
  return <div className="ticket-route-summary"><div><span className="ticket-stop-dot" /><strong>{order.from}</strong></div><p>Koridor 1 · {order.direction === "bulupitu" ? "arah Bulupitu" : "arah Bukateja"}</p><div><span className="ticket-stop-dot destination" /><strong>{order.to}</strong></div><div className="ticket-date-line"><ServiceIcon name="calendar" /><span>{formatTicketDate(order.date)} · {order.time} WIB</span></div></div>;
}

function PriceBreakdown({ quantity, fare, category }) {
  return <><p className="ticket-small-label">RINCIAN BIAYA</p><dl className="ticket-costs"><div><dt>Tiket {category === "pelajar" ? "pelajar" : "umum"} utama</dt><dd>{rupiah(fare)}</dd></div>{quantity > 1 && <div><dt>Tiket teman ({quantity - 1} orang)</dt><dd>{rupiah((quantity - 1) * fare)}</dd></div>}<div><dt>Biaya layanan simulasi</dt><dd>Rp0</dd></div></dl><div className="ticket-total"><div><strong>TOTAL SIMULASI</strong><span>{quantity} tiket perjalanan</span></div><strong>{rupiah(quantity * fare)}</strong></div></>;
}

function FormSectionHeading({ icon, title, children }) {
  return <div className="ticket-section-heading"><span className="ticket-section-icon"><ServiceIcon name={icon} /></span><div><h2>{title}</h2><p>{children}</p></div></div>;
}

export default function TicketPage({ name, category, draft, setDraft, setTrip, onReview }) {
  const student = category === "pelajar";
  const fare = student ? corridor.studentFare : corridor.generalFare;
  const [errors, setErrors] = useState({});
  const errorSummary = useRef(null);
  const journey = findJourney(draft.from, draft.to);
  const quantity = draft.companions.length + 1;
  function update(values) {
    setDraft(current => ({ ...current, ...values }));
    setErrors({});
    if (values.from || values.to) setTrip(current => ({ ...current, ...(values.from ? { from: values.from } : {}), ...(values.to ? { to: values.to } : {}) }));
  }
  function updateCompanion(index, values) {
    update({ companions: draft.companions.map((item, at) => at === index ? { ...item, ...values } : item) });
  }
  function chooseFile(index, event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const error = cardFileError(file);
    if (error) { event.target.value = ""; setErrors(current => ({ ...current, [`file-${index}`]: error })); return; }
    updateCompanion(index, { file });
  }
  function review(event) {
    event.preventDefault();
    const issues = validateTicketDraft(draft, category);
    setErrors(issues);
    if (Object.keys(issues).length) { requestAnimationFrame(() => errorSummary.current?.focus()); return; }
    onReview(createTicketOrder(draft, category));
  }
  const summary = { ...draft, direction: journey?.id || "bukateja" };
  return <ServiceLayout name={name} category={category} page="tiket">
    <TicketSteps step={1} />
    <div className="ticket-hero"><div><p className="service-eyebrow">LAYANAN PERJALANAN SMARTSTOP</p><h1 tabIndex="-1">Pesan tiket perjalanan.</h1><p>Pilih rute, tentukan jadwal, dan siapkan perjalananmu bersama teman.</p></div><span className="ticket-hero-icon"><ServiceIcon name="bus" /></span><span className="ticket-hero-stage"><ServiceIcon name="ticket" />Pilih & detail tiket</span></div>
    <div className="ticket-workspace"><div className="ticket-form-column">
      <div className="ticket-account-banner"><span className="ticket-section-icon"><ServiceIcon name={student ? "shield" : "ticket"} /></span><div><h2>{student ? "Perjalanan dengan tarif pelajar." : "Perjalanan untuk semua."}</h2><p>{student ? <>Contoh tarif <strong>{rupiah(fare)}/orang</strong>. Status verifikasi akun dan kartu pelajar akan mengikuti pemeriksaan operator.</> : <>Contoh tarif <strong>{rupiah(fare)}/orang</strong>. Tentukan halte naik dan tujuan dalam lintasan yang sama.</>}</p></div><div className="ticket-fare-badge"><small>TARIF {student ? "PELAJAR" : "UMUM"}</small><strong>{rupiah(fare)}</strong><span>Per orang · simulasi</span></div></div>
      <form id="ticket-form" noValidate onSubmit={review}>
        {!!Object.keys(errors).length && <div className="ticket-errors" ref={errorSummary} tabIndex="-1" role="alert"><strong>Periksa kembali pesananmu.</strong><ul>{Object.entries(errors).map(([key, message]) => <li key={key}>{message}</li>)}</ul></div>}
        <section className="ticket-form-card" data-reveal><FormSectionHeading icon="route" title="Detail perjalanan">Tentukan rute dan jadwal keberangkatan.</FormSectionHeading><div className="ticket-fields"><StopPicker value={draft.from} otherValue={draft.to} label="Halte asal" variant="ticket-from" onChange={from => update({ from })} /><StopPicker value={draft.to} otherValue={draft.from} label="Halte tujuan" variant="ticket-to" onChange={to => update({ to })} /><label className="ticket-field"><span><ServiceIcon name="calendar" />Tanggal keberangkatan</span><input type="date" min={todayWib()} value={draft.date} aria-invalid={Boolean(errors.departure)} onChange={event => { const date = event.target.value; const first = corridor.departures.find(time => !departureIsPast(date, time)); update({ date, time: first || corridor.departures[0] }); }} required /></label><label className="ticket-field"><span><ServiceIcon name="clock" />Jam keberangkatan (WIB)</span><span className="ticket-select-wrap"><select value={draft.time} onChange={event => update({ time: event.target.value })} aria-invalid={Boolean(errors.departure)}>{corridor.departures.map(time => <option key={time} value={time} disabled={departureIsPast(draft.date, time)}>{time}{departureIsPast(draft.date, time) ? " · sudah lewat" : ""}</option>)}</select><span aria-hidden="true">⌄</span></span></label></div><div className="ticket-route-info"><ServiceIcon name="info" /><p>{journey ? <><strong>{journey.stops.length - 1} segmen halte</strong> · {journey.title}. Jadwal menggunakan data contoh.</> : "Belum ada lintasan langsung. Pilih pasangan halte lain."}</p></div></section>
        <section className="ticket-form-card" data-reveal><FormSectionHeading icon="ticket" title="Tiket Anda">Data penumpang utama pada pesanan ini.</FormSectionHeading><div className="ticket-owner"><span className="owner-avatar">{(name || draft.ownerName || "P").trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase()}</span><div>{name ? <><h3>{name}</h3><span className="service-tag">{student ? "Akun pelajar · demo" : "Akun umum · demo"}</span></> : <label className="ticket-field"><span>Nama penumpang utama</span><input value={draft.ownerName} onChange={event => update({ ownerName: event.target.value })} placeholder="Nama sesuai identitas" maxLength={100} autoComplete="name" aria-invalid={Boolean(errors.ownerName)} required /></label>}</div><div className="owner-fare"><small>BIAYA TIKET</small><strong>{rupiah(fare)}</strong></div></div>{!name && <p className="ticket-helper">Sedang mencoba tanpa akun. <a href="#masuk">Masuk untuk menggunakan profilmu.</a></p>}</section>
        <section className="ticket-form-card" data-reveal><div className="ticket-friends-heading"><FormSectionHeading icon="seat" title="Tambah tiket teman">Satu pesanan untuk perjalanan bersama.</FormSectionHeading><div className="ticket-counter" role="group" aria-label="Jumlah teman"><span>Teman</span><button type="button" aria-label="Kurangi tiket teman" disabled={!draft.companions.length} onClick={() => update({ companions: draft.companions.slice(0, -1) })}>−</button><output aria-live="polite">{draft.companions.length}</output><button type="button" aria-label="Tambah tiket teman" disabled={draft.companions.length >= 4} onClick={() => update({ companions: [...draft.companions, { id: crypto.randomUUID(), name: "", file: null }] })}>+</button></div></div><div className="ticket-route-info"><ServiceIcon name="info" /><p>Maksimal <strong>5 tiket per pesanan</strong>. Saat ini {quantity} tiket{quantity < 5 ? " · bisa tambah " + (5 - quantity) + " teman lagi." : " · batas pesanan tercapai."}</p></div>
          {!draft.companions.length && <div className="ticket-friends-empty"><ServiceIcon name="seat" /><p>Ajak teman perjalananmu.</p><span>Gunakan tombol + untuk menambahkan tiket.</span></div>}
          <div className="ticket-companions">{draft.companions.map((companion, index) => <fieldset className="ticket-companion" key={companion.id}><legend>Tiket teman {index + 1}</legend><div className="companion-status"><span className="service-tag">{student ? companion.file ? "File dipilih · belum diverifikasi" : "Kartu pelajar diperlukan" : "Tarif umum"}</span><button className="service-text-button" type="button" aria-label={"Hapus tiket teman " + (index + 1)} onClick={() => update({ companions: draft.companions.filter(item => item.id !== companion.id) })}>Hapus</button></div><div className="companion-fields"><label className="ticket-field"><span>Nama lengkap teman</span><input value={companion.name} onChange={event => updateCompanion(index, { name: event.target.value })} placeholder="Nama sesuai identitas" maxLength={100} autoComplete="off" required aria-invalid={Boolean(errors[`name-${index}`])} /></label>{student && <div className="student-card-picker"><span className="ticket-field-label">Kartu pelajar teman {index + 1}</span><label className={"student-card-dropzone" + (companion.file ? " has-file" : "")}><ServiceIcon name={companion.file ? "file" : "upload"} /><strong>{companion.file?.name || "Pilih file kartu pelajar"}</strong><span>{companion.file ? (companion.file.size / 1024).toFixed(0) + " KB · klik untuk mengganti" : "JPG, PNG, atau PDF · maks. 5 MB"}</span><input className="student-file-input" type="file" accept=".jpg,.jpeg,.png,.pdf" aria-label={"Unggah kartu pelajar teman " + (index + 1)} aria-invalid={Boolean(errors[`file-${index}`])} onChange={event => chooseFile(index, event)} /></label>{errors[`file-${index}`] && <p className="ticket-field-error">{errors[`file-${index}`]}</p>}</div>}</div>{student && <p className="ticket-helper"><ServiceIcon name="shield" />File hanya dipilih di perangkat. Pengunggahan dan pemeriksaan kartu menunggu integrasi operator.</p>}</fieldset>)}</div>
        </section>
      </form>
    </div><aside className="ticket-summary"><div className="ticket-summary-title"><div><h2>Ringkasan pesanan</h2><p>Detail rute & total perjalanan</p></div><ServiceIcon name="ticket" /></div><RouteSummary order={summary} /><PriceBreakdown quantity={quantity} fare={fare} category={category} /><button className="service-button ticket-continue" type="submit" form="ticket-form">Lanjutkan ke pembayaran</button><DemoNote>Simulasi frontend. Tidak ada transaksi uang atau tiket operasional yang diterbitkan.</DemoNote></aside></div>
  </ServiceLayout>;
}

export function TicketCheckout({ name, category, page, order, receipt, onComplete }) {
  const [method, setMethod] = useState("qris");
  const completed = useRef(false);
  const step = page === "struk" ? 3 : 2;
  const record = page === "struk" ? receipt : order;
  if (!record) return <ServiceLayout name={name} category={category} page={page}><TicketSteps step={step} /><div className="service-empty"><ServiceIcon name="ticket" /><h1 tabIndex="-1">{page === "struk" ? "Belum ada tiket perjalanan." : "Pilih perjalananmu dahulu."}</h1><p>Mulai dari halaman pemesanan untuk menentukan halte dan jadwal.</p><a className="service-button" href="#tiket">Pesan tiket</a></div></ServiceLayout>;
  const normalized = { ...record, date: record.date || todayWib(), direction: record.direction || findJourney(record.from, record.to)?.id };
  const passengers = record.passengers || [{ name: name || "Penumpang demo", isOwner: true }];
  function finish() {
    if (completed.current) return;
    if (record.date && departureIsPast(record.date, record.time)) return;
    completed.current = true;
    onComplete({ ...record, id: "DEMO-" + Date.now().toString(36).toUpperCase(), paymentMethod: method, status: "reserved", source: "demo" });
  }
  return <ServiceLayout name={name} category={category} page={page}><TicketSteps step={step} /><div className={"ticket-checkout-hero " + (step === 3 ? "is-success" : "")}><span className="checkout-hero-icon"><ServiceIcon name={step === 3 ? "check" : "shield"} /></span><div><p className="service-eyebrow">{step === 3 ? "BUKTI SIMULASI PERJALANAN" : "TINJAU SEBELUM MELANJUTKAN"}</p><h1 tabIndex="-1">{step === 3 ? "Perjalananmu sudah disiapkan." : "Satu langkah menuju perjalananmu."}</h1><p>{step === 3 ? "Simpan rincian perjalanan contoh ini untuk mencoba alur SmartStop." : "Periksa kembali halte, jadwal, dan penumpang sebelum menyelesaikan simulasi."}</p></div></div>
    <div className="ticket-workspace checkout-workspace"><div><section className="ticket-form-card"><FormSectionHeading icon="route" title="Rincian perjalanan">{step === 3 ? record.id || "Tiket contoh" : "Pastikan pilihan perjalanan sudah sesuai."}</FormSectionHeading><RouteSummary order={normalized} /><div className="ticket-passenger-list"><h3>Penumpang ({record.quantity} orang)</h3>{passengers.map((passenger, index) => <div key={index}><span className="ticket-section-icon"><ServiceIcon name="ticket" /></span><div><strong>{passenger.name}</strong><span>{passenger.isOwner ? "Penumpang utama" : "Teman perjalanan"}{passenger.studentCard ? " · pemeriksaan kartu oleh operator" : ""}</span></div><span className="service-tag">{record.category === "pelajar" ? "Pelajar" : "Umum"}</span></div>)}</div>{step === 2 && <a className="service-text-button" href="#tiket">Ubah detail pesanan</a>}</section>
      {step === 2 ? <section className="ticket-form-card"><FormSectionHeading icon="shield" title="Metode pembayaran contoh">Pratinjau pilihan pembayaran. Tidak terhubung ke penyedia pembayaran.</FormSectionHeading><fieldset className="payment-methods"><legend className="visually-hidden">Pilih metode pembayaran simulasi</legend>{[["qris", "QRIS", "Kode pembayaran akan disediakan server."], ["bank", "Transfer bank", "Nomor pembayaran akan disediakan server."]].map(([id, label, text]) => <label key={id} className={method === id ? "is-selected" : ""}><input type="radio" name="paymentMethod" value={id} checked={method === id} onChange={() => setMethod(id)} /><ServiceIcon name={id === "qris" ? "ticket" : "shield"} /><span><strong>{label}</strong><span>{text}</span></span></label>)}</fieldset><DemoNote>Belum ada instruksi pembayaran nyata. Gunakan tombol Selesaikan simulasi untuk mencoba alur struk.</DemoNote></section> : <div className="ticket-receipt-note"><ServiceIcon name="info" /><div><strong>Tiket contoh · belum berlaku untuk naik bus.</strong><p>QR tiket dan status pembayaran resmi akan diterbitkan server. Pemesanan belum menambah jumlah penumpang di dalam bus.</p></div></div>}
    </div><aside className="ticket-summary"><div className="ticket-summary-title"><div><h2>{step === 3 ? "Struk perjalanan" : "Total pesanan"}</h2><p>{step === 3 ? "Status: reservasi simulasi" : "Tinjau rincian biaya"}</p></div><ServiceIcon name="ticket" /></div><PriceBreakdown quantity={record.quantity} fare={record.fare} category={record.category || category} />{step === 2 ? <><button className="service-button ticket-continue" disabled={Boolean(record.date && departureIsPast(record.date, record.time))} onClick={finish}>Selesaikan simulasi</button>{record.date && departureIsPast(record.date, record.time) && <p className="ticket-field-error">Jadwal telah lewat. Ubah waktu perjalanan dahulu.</p>}</> : <><button className="service-button ticket-continue" onClick={() => window.print()}>Cetak struk contoh</button><a className="service-button secondary ticket-continue" href="#peta">Lihat status bus</a><a className="service-text-button" href="#tiket">Buat pesanan baru</a></>}<DemoNote>Tarif, ketersediaan, dan konfirmasi pembayaran final akan mengikuti hasil server.</DemoNote></aside></div>
  </ServiceLayout>;
}
