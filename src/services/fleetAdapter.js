import { routeDirections } from "../transit.js";

// Validate the public API DTO before it reaches the map or home components.
// Positions represent the last driver-confirmed stop, not GPS coordinates.
export function normalizeFleetSnapshot(payload) {
  if (!payload || !Array.isArray(payload.buses)) throw new Error("Respons armada harus memiliki daftar buses.");
  const ids = new Set();
  return payload.buses.map(record => {
    const id = String(record.id ?? "");
    const direction = routeDirections.find(item => item.id === record.direction);
    if (!id || ids.has(id) || !direction) throw new Error("Identitas atau arah armada tidak valid.");
    ids.add(id);
    if (!Number.isInteger(record.currentStopIndex) || record.currentStopIndex < 0 || record.currentStopIndex >= direction.stops.length) throw new Error("Urutan halte laporan supir tidak valid.");
    if (!Number.isInteger(record.capacity) || record.capacity < 1 || !Number.isInteger(record.passengers) || record.passengers < 0 || record.passengers > record.capacity) throw new Error("Jumlah penumpang atau kapasitas tidak valid.");
    if (!["at_stop", "en_route", "finished"].includes(record.movement) || !Number.isFinite(Date.parse(record.reportedAt))) throw new Error("Status dan waktu laporan supir wajib tersedia.");
    const arrivalByStop = {};
    for (const arrival of record.arrivals || []) {
      if (!Number.isInteger(arrival.stopIndex) || arrival.stopIndex < 0 || arrival.stopIndex >= direction.stops.length) throw new Error("Halte estimasi tiba tidak valid.");
      if (!["approaching", "arrived", "passed", "unavailable"].includes(arrival.state)) throw new Error("Status estimasi tiba tidak valid.");
      if (arrival.state === "approaching" && (!Number.isInteger(arrival.minutes) || arrival.minutes < 1)) throw new Error("Estimasi tiba harus berupa menit positif.");
      arrivalByStop[arrival.stopIndex] = { state: arrival.state, minutes: arrival.state === "arrived" ? 0 : arrival.state === "approaching" ? arrival.minutes : null };
    }
    return { id, number: String(record.number || id).padStart(2, "0"), code: String(record.code || id),
      direction: record.direction, stopPosition: record.currentStopIndex, movement: record.movement,
      passengers: record.passengers, capacity: record.capacity, reportedAt: record.reportedAt,
      plate: String(record.plate || ""), arrivalByStop, source: "api" };
  });
}
