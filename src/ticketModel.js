import { corridor, findJourney } from "./transit.js";

export function todayWib(now = new Date()) {
  const values = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now).map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function departureIsPast(date, time, now = new Date()) {
  const timestamp = Date.parse(`${date}T${time}:00+07:00`);
  return !Number.isFinite(timestamp) || todayWib(new Date(timestamp)) !== date || timestamp <= now.getTime();
}

export function createTicketDraft({ name, trip }, now = new Date()) {
  let date = todayWib(now);
  const times = corridor.departures.filter(time => !departureIsPast(date, time, now));
  if (!times.length) date = todayWib(new Date(now.getTime() + 86400000));
  return { ...trip, ownerName: name || "", date, time: times[0] || corridor.departures[0], companions: [] };
}

export function cardFileError(file) {
  if (!file) return "Pilih kartu pelajar untuk penumpang ini.";
  if (!/\.(jpe?g|png|pdf)$/i.test(file.name) || !["image/jpeg", "image/png", "application/pdf"].includes(file.type)) return "Gunakan file JPG, PNG, atau PDF.";
  if (file.size < 1 || file.size > 5 * 1024 * 1024) return "Ukuran file harus lebih dari 0 dan maksimal 5 MB.";
  return "";
}

export function validateTicketDraft(draft, category, now = new Date()) {
  const errors = {};
  if (!findJourney(draft.from, draft.to)) errors.route = "Pilih halte tujuan setelah keberangkatan pada lintasan yang sama.";
  if (!draft.ownerName?.trim()) errors.ownerName = "Isi nama penumpang utama.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date) || departureIsPast(draft.date, draft.time, now)) errors.departure = "Pilih tanggal dan jam keberangkatan yang belum lewat.";
  if (!corridor.departures.includes(draft.time)) errors.departure = "Pilih jam dari jadwal contoh yang tersedia.";
  if (draft.companions.length > 4) errors.quantity = "Maksimal 5 tiket dalam satu pesanan.";
  draft.companions.forEach((companion, index) => {
    if (!companion.name?.trim()) errors[`name-${index}`] = "Isi nama lengkap teman.";
    if (category === "pelajar") {
      const fileError = cardFileError(companion.file);
      if (fileError) errors[`file-${index}`] = fileError;
    }
  });
  return errors;
}

// Shape ready for a future server quote. Files stay in memory until upload is integrated.
// The backend must derive fares and verification eligibility from the authenticated user.
export function createTicketOrder(draft, category) {
  const fare = category === "pelajar" ? corridor.studentFare : corridor.generalFare;
  const journey = findJourney(draft.from, draft.to);
  return { from: draft.from, to: draft.to, date: draft.date, time: draft.time, direction: journey.id,
    quantity: 1 + draft.companions.length, fare, category, serviceFee: 0, source: "demo", status: "reserved",
    passengers: [{ name: draft.ownerName.trim(), isOwner: true }, ...draft.companions.map(item => ({ name: item.name.trim(), isOwner: false,
      studentCard: item.file ? { name: item.file.name, size: item.file.size, type: item.file.type, verification: "pending" } : null }))] };
}

export function formatTicketDate(date) {
  const value = new Date(date + "T12:00:00+07:00");
  if (!Number.isFinite(value.getTime()) || todayWib(value) !== date) return "Pilih tanggal";
  return value.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
}
