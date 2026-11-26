import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/inter/latin-800.css";
import loginPoster from "../assets/poster-29.png";
import registerPoster from "../assets/poster-30.png";
import studentPoster from "../assets/poster-31.png";
import recoveryPoster from "../assets/poster-32.png";
import Portal from "./Portal.jsx";
import AdminPanel from "./admin/AdminPanel.jsx";
import "../assets/index.css";

const screens = {
  masuk: ["Selamat datang kembali", "Masuk ke akunmu untuk melanjutkan.", "Masuk"],
  daftar: ["Buat akun SmartStop", "Daftar untuk memulai perjalananmu.", "Buat akun"],
  pulihkan: ["Pulihkan kata sandi", "Masukkan email yang terdaftar di SmartStop.", "Kirim tautan pemulihan"]
};

function currentMode() {
  const fragment = location.hash.slice(1);
  return Object.hasOwn(screens, fragment) ? fragment : "masuk";
}

function validateCard(event) {
  const input = event.target;
  const file = input.files[0];
  const invalid = file && (file.size > 5 * 1024 * 1024 || !/\.(png|jpe?g|pdf)$/i.test(file.name));
  input.setCustomValidity(invalid ? "Pilih JPG, PNG, atau PDF berukuran maksimal 5 MB." : "");
}

function Auth({ onEnter }) {
  const [mode, setMode] = useState(currentMode);
  const [visible, setVisible] = useState(false);
  const [student, setStudent] = useState(false);
  const [status, setStatus] = useState("");
  const panel = useRef(null);
  const previousMode = useRef(mode);
  const [heading, intro, action] = screens[mode];
  const register = mode === "daftar";
  const recover = mode === "pulihkan";
  const needsCard = register && student;

  useEffect(() => {
    function navigate() {
      if (location.hash === "#akun") return;
      setMode(currentMode());
      setVisible(false);
      setStatus("");
    }
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);

  useEffect(() => {
    document.title = action + " · SmartStop";
    if (previousMode.current === mode) return;
    previousMode.current = mode;
    panel.current.querySelector("h1").focus({ preventScroll: true });
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const offset = register ? 10 : -10;
    const animations = Array.from(panel.current.querySelectorAll("h1, #intro, form, .switch"), element =>
      element.animate([
        { opacity: 0.35, transform: "translateX(" + offset + "px)" },
        { opacity: 1, transform: "translateX(0)" }
      ], { duration: 240, easing: "cubic-bezier(.22,.8,.2,1)" })
    );
    return () => animations.forEach(animation => animation.cancel());
  }, [mode, action, register]);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("reveal");
        observer.unobserve(entry.target);
      }
    });
    for (const part of panel.current.querySelectorAll("h1, nav, form, .switch")) {
      if (part.getBoundingClientRect().top >= innerHeight) observer.observe(part);
    }
    return () => observer.disconnect();
  }, []);

  function submit(event) {
    event.preventDefault();
    if (recover) {
      setStatus("Mode demo: layanan email pemulihan belum terhubung.");
      return;
    }
    const email = event.currentTarget.querySelector("#email").value.trim().toLowerCase();
    let profile;
    if (register) {
      profile = { name: event.currentTarget.querySelector("#nama").value.trim(), category: student ? "pelajar" : "umum" };
    } else {
      profile = { name: "Penumpang", category: email === "pelajar@example.com" ? "pelajar" : "umum" };
    }
    onEnter(profile);
  }

  return <>
<a className="skip" href="#akun" onClick={event => { event.preventDefault(); panel.current.querySelector("h1").focus(); }}>Langsung ke formulir</a>
  <main>
    <div className="poster"><img src={recover ? recoveryPoster : needsCard ? studentPoster : register ? registerPoster : loginPoster} alt="Ilustrasi layanan bus SmartStop" /></div>
    <section id="akun" aria-labelledby="judul">
      <div className="panel" ref={panel}>
        <a className="back-home" href="#beranda">← Beranda</a>
        <h1 id="judul" tabIndex={-1}>{heading}</h1>
        <p id="intro">{intro}</p>
        <small>Mode demo · gunakan data contoh.</small>
        {mode === "masuk" && <details><summary>Coba akun demo</summary><p>Pelajar: pelajar@example.com<br/>Umum: umum@example.com<br/>Gunakan kata sandi contoh bebas.</p><p><a href="#admin">Pratinjau dashboard admin</a></p></details>}
        <nav aria-label="Pilihan akun"><a href="#masuk" aria-current={mode === "masuk" ? "page" : undefined}>Masuk</a><a href="#daftar" aria-current={register ? "page" : undefined}>Daftar</a></nav>
        <form id="formulir" onSubmit={submit}>
          <div id="profil" hidden={!register}>
            <label htmlFor="nama">Nama lengkap</label>
            <input id="nama" required={register} autoComplete="name" placeholder="Nama sesuai identitas" />
            <label htmlFor="jenis">Jenis akun</label>
            <select id="jenis" onChange={event => setStudent(event.target.selectedIndex === 1)}><option>Umum</option><option>Pelajar / Mahasiswa</option></select>
            <div id="verifikasi" hidden={!needsCard}>
              <label htmlFor="kartu">Kartu pelajar / mahasiswa</label>
              <input id="kartu" required={needsCard} disabled={!needsCard} onChange={validateCard} type="file" accept=".jpg,.jpeg,.png,.pdf" aria-describedby="format" />
              <small id="format">JPG, PNG, atau PDF · maks. 5 MB</small>
            </div>
          </div>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" placeholder="nama@email.com" required />
          <div id="sandi" hidden={recover}>
            <label htmlFor="password">Kata sandi</label>
            <div className="password"><input id="password" key={mode} disabled={recover} type={visible ? "text" : "password"} autoComplete={register ? "new-password" : "current-password"} required placeholder="Masukkan kata sandi" /><button id="lihat" type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>{visible ? "Sembunyikan" : "Lihat"}</button></div>
          </div>
          <a id="lupa" hidden={mode !== "masuk"} href="#pulihkan">Lupa kata sandi?</a>
          <button className="primary" id="kirim" type="submit">{action}</button>
          <p role="status" id="status">{status}</p>
        </form>
        <p className="switch" id="alternatif">{mode === "masuk" ? <>Belum punya akun? <a href="#daftar">Daftar sekarang</a></> : <a href="#masuk">Kembali masuk</a>}</p>
        
      </div>
    </section>
  </main>
  </>;
}

function App() {
  // This route is a frontend preview. Real admin authentication belongs to the backend.
  const [adminOpen, setAdminOpen] = useState(() => /^#admin(?:\/|$)/.test(location.hash));
  const [user, setUser] = useState(() => sessionStorage.getItem("smartstop.demoName"));
  const [category, setCategory] = useState(() => sessionStorage.getItem("smartstop.demoCategory") || "umum");
  const [authOpen, setAuthOpen] = useState(() => {
    // Old login bookmarks should also open the public homepage on a fresh visit.
    if (Object.hasOwn(screens, location.hash.slice(1))) {
      history.replaceState(history.state, "", location.pathname + location.search + "#beranda");
    }
    return false;
  });
  useEffect(() => {
    const update = () => {
      setAuthOpen(Object.hasOwn(screens, location.hash.slice(1)));
      setAdminOpen(/^#admin(?:\/|$)/.test(location.hash));
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  function enter({name, category}) {
    sessionStorage.setItem("smartstop.demoCategory", category);
    setCategory(category);
    sessionStorage.setItem("smartstop.demoName", name);
    location.hash = "beranda";
    setUser(name);
  }
  function leave() {
    sessionStorage.removeItem("smartstop.demoCategory");
    setCategory("umum");
    sessionStorage.removeItem("smartstop.demoName");
    location.hash = "beranda";
    setUser(null);
  }
  if (adminOpen) return <AdminPanel onExit={leave} />;
  return !user && authOpen ? <Auth onEnter={enter} /> : <Portal name={user} category={user ? category : "umum"} onLogout={leave} />;
}

createRoot(document.getElementById("root")).render(<App />);
