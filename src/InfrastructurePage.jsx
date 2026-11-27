import React, { useState } from "react";
import ServiceLayout, { DemoNote, ServiceIcon, ServiceStats } from "./ServiceLayout.jsx";
import { facilityFeatures } from "./serviceData.js";
import { corridor, routeDirections } from "./transit.js";
import { StopPicker } from "./RoutePickers.jsx";
import busPhoto from "../assets/koridor-bulupitu.png";

function ShelterIllustration({ active = "access", onSelect }) {
  return <div className={"shelter-illustration active-" + active}>
    <span className="illustration-label">ILUSTRASI FUNGSIONAL HALTE</span>
    <div className="shelter-scene" aria-hidden="true"><div className="scene-cloud cloud-one" /><div className="scene-cloud cloud-two" /><div className="scene-tree tree-one" /><div className="scene-tree tree-two" /><div className="shelter-roof" /><div className="shelter-wall" /><div className="shelter-post post-one" /><div className="shelter-post post-two" /><div className="shelter-sign">Smart<span>Stop</span><ServiceIcon name="bus" /></div><div className="shelter-bench" /><div className="shelter-info-board"><ServiceIcon name="map" /></div><div className="shelter-platform" /><div className="shelter-ramp" /><div className="shelter-guide" /><div className="shelter-road"><i /><i /><i /></div></div>
    {onSelect && <div className="shelter-hotspots" role="group" aria-label="Jelajahi bagian halte">{facilityFeatures.map(item => <button key={item.id} className={"hotspot-" + item.id} aria-label={item.title} aria-pressed={active === item.id} onClick={() => onSelect(item.id)}><ServiceIcon name={item.icon} /></button>)}</div>}
    <span className="illustration-caption">{facilityFeatures.find(item => item.id === active).title}</span>
  </div>;
}

function NetworkIllustration() {
  return <div className="network-illustration"><div className="network-grid" /><div className="network-core"><ServiceIcon name="network" /><strong>SmartStop</strong><span>Informasi perjalanan</span></div><div className="network-node node-driver"><ServiceIcon name="bus" /><span>Laporan supir</span></div><div className="network-node node-stop"><ServiceIcon name="pin" /><span>Halte pilihan</span></div><div className="network-node node-passenger"><ServiceIcon name="ticket" /><span>Tiket penumpang</span></div></div>;
}

export default function InfrastructurePage({ name, category, fleet, isDemo = true, facilities = null }) {
  const [active, setActive] = useState("access");
  const [stop, setStop] = useState("RRI");
  const facility = facilities?.find(item => item.stopName === stop);
  const totalStops = routeDirections.reduce((sum, item) => sum + item.stops.length, 0);
  const pillars = [
    { id: "shelter", label: "HALTE & TERMINAL", title: "Ruang singgah yang mudah diakses.", description: "Kenali area tunggu, papan rute, dan titik naik sebelum perjalanan. Fasilitas dapat berbeda pada setiap lokasi halte.", features: ["Ruang tunggu penumpang", "Informasi arah & lintasan", "Akses naik dan turun", "Kanopi peneduh"], footer: "Informasi per halte", visual: <ShelterIllustration /> },
    { id: "bus", label: "ARMADA BRT", title: "Mengenal armada perjalananmu.", description: "Lihat bus yang melayani koridor dan periksa jumlah penumpangnya sebelum naik melalui halaman Peta Halte.", features: ["Identitas armada", "Kapasitas penumpang", "Rute penugasan", "Status perjalanan"], footer: fleet.length + " armada " + (isDemo ? "contoh" : "dari server"), visual: <div className="infrastructure-bus-photo"><img src={busPhoto} alt="Ilustrasi armada bus Trans Jateng pada koridor Bulupitu–Bukateja" width="550" height="220" loading="lazy" /><span>Foto ilustrasi armada</span></div> },
    { id: "network", label: "JARINGAN INFORMASI", title: "Satu alur informasi perjalanan.", description: "Laporan halte dari supir menjadi acuan status bus. Penumpang dapat memilih halte naik, melihat estimasi tiba, dan menyiapkan tiket.", features: ["Pembaruan halte terakhir", "Jumlah penumpang", "Perkiraan tiba bila tersedia", "Pemesanan perjalanan"], footer: "Disiapkan untuk integrasi layanan", visual: <NetworkIllustration /> }
  ];
  return <ServiceLayout name={name} category={category} page="infrastruktur">
    <div className="service-page-heading infrastructure-intro"><div><p className="service-eyebrow">KENALI LAYANAN PERJALANANMU</p><h1 tabIndex="-1">Infrastruktur halte &<br /><span>jaringan cerdas.</span></h1><p>Kenali fasilitas titik singgah dan jaringan perjalanan Trans Jateng pada koridor Terminal Bulupitu–Terminal Bukateja melalui Sokaraja.</p></div><div className="service-intro-actions"><a className="service-button" href="#peta"><ServiceIcon name="map" />Lihat peta rute & halte</a><a className="service-button secondary" href="#beranda"><ServiceIcon name="bus" />Lihat status armada</a></div></div>
    <ServiceStats items={[
      { label: "TITIK PADA LINTASAN", value: totalStops + " Entri", description: "Termasuk titik asal kedua arah", icon: "shelter" },
      { label: "AKSESIBILITAS", value: "Per halte", description: "Ketersediaan perlu diverifikasi", icon: "access" },
      { label: "ARMADA TERDAFTAR", value: fleet.length + " Bus", description: isDemo ? "Berdasarkan data contoh" : "Berdasarkan laporan server", icon: "bus" },
      { label: "INFORMASI PERJALANAN", value: "Terpadu", description: "Rute, halte, status bus & tiket", icon: "network" }
    ]} />
    <section className="service-section"><p className="service-eyebrow">HALTE, ARMADA, DAN INFORMASI</p><h2>Tiga pilar perjalanan SmartStop.</h2><p className="service-description">Gambaran fasilitas dan informasi yang mendukung perjalananmu.</p><div className="infrastructure-pillars">{pillars.map(item => <article className="infrastructure-card" key={item.id} data-reveal><div className="pillar-heading"><span className="service-tag">{item.label}</span><ServiceIcon name={item.id} /></div>{item.visual}<h3>{item.title}</h3><p>{item.description}</p><div className="pillar-features"><small>INFORMASI & FASILITAS</small><ul>{item.features.map(feature => <li key={feature}><ServiceIcon name="check" />{feature}</li>)}</ul></div><div className="pillar-footer"><ServiceIcon name={item.id} /><span>{item.footer}</span></div></article>)}</div></section>
    <section className="service-section" data-reveal><p className="service-eyebrow">JELAJAHI BAGIAN HALTE</p><h2>Ruang tunggu hingga titik naik.</h2><p className="service-description">Pilih bagian ilustrasi untuk memahami fungsi fasilitas halte.</p><div className="facility-explainer"><div className="facility-accordion" role="group" aria-label="Bagian fasilitas halte">{facilityFeatures.map(item => <button key={item.id} aria-pressed={active === item.id} onClick={() => setActive(item.id)}><span className="facility-icon"><ServiceIcon name={item.icon} /></span><span><strong>{item.title}</strong><span>{item.description}</span><span className="facility-tags">{item.tags.map(tag => <small key={tag}>{tag}</small>)}</span></span></button>)}</div><div className="facility-interactive"><ShelterIllustration active={active} onSelect={setActive} /><p className="facility-illustration-note">Ilustrasi konseptual. Bentuk dan fasilitas di lapangan dapat berbeda.</p></div></div></section>
    <section className="service-section facility-checker" data-reveal><div><p className="service-eyebrow">PERSIAPKAN PERJALANANMU</p><h2>Periksa halte pilihan.</h2><p className="service-description">Informasi lokasi dan fasilitas akan mengikuti data operator untuk setiap halte.</p></div><div className="facility-checker-card"><StopPicker value={stop} label="Pilih halte atau terminal" variant="facility" options={corridor.stops} onChange={setStop} /><div className="facility-checker-result" role="status"><ServiceIcon name="shelter" /><div><h3>{stop}</h3><p>{facility?.description || "Detail fasilitas lokasi ini belum tersedia. Periksa kondisi halte dan titik naik sebelum berangkat."}</p><span className="service-tag">{facility?.verified ? "Diverifikasi operator" : "Menunggu data operator"}</span></div></div><a className="service-text-button" href="#lapor">Laporkan kondisi fasilitas</a></div></section>
    <DemoNote />
  </ServiceLayout>;
}
