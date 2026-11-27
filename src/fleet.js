import { corridor, routeDirections } from "./transit.js";

// Frontend snapshots only. stopPosition is a fractional stop index, not GPS data.
const overrides = {
  "1": { direction: "bukateja", stopPosition: 0, passengers: 8 },
  "6": { direction: "bulupitu", stopPosition: 0, passengers: 5 },
  "4": { direction: "bukateja", stopPosition: 6.35, passengers: 26, plate: "AA 1420 AB" },
  "8": { direction: "bulupitu", stopPosition: 5.6, passengers: 16, plate: "AA 1502 AB" },
  "11": { direction: "bukateja", stopPosition: 2.7, passengers: 8, plate: "AA 1618 AB" },
  "2": { direction: "bulupitu", stopPosition: 3.3, passengers: 20, plate: "AA 1409 AB" },
  "14": { direction: "bulupitu", stopPosition: 8.4, passengers: 40 }
};

export const fleetFixtures = Array.from({ length: 14 }, (_, index) => {
  const id = String(index + 1);
  return {
    id, number: id.padStart(2, "0"), code: "TJ-" + id.padStart(2, "0"),
    direction: index % 2 === 0 ? "bukateja" : "bulupitu",
    stopPosition: 1.2 + index * .67, passengers: 8 + (index * 3) % 30,
    capacity: 40, plate: "Armada contoh " + id, ...overrides[id]
  };
});

export const createDemoFleet = () => fleetFixtures.map(bus => ({ ...bus }));

export function advanceDemoFleet(fleet) {
  return fleet.map(bus => {
    const direction = routeDirections.find(item => item.id === bus.direction);
    return { ...bus, stopPosition: Math.min(direction.stops.length - 1, bus.stopPosition + .2) };
  });
}

export function busLocation(bus) {
  const direction = routeDirections.find(item => item.id === bus.direction);
  const position = Math.max(0, Math.min(direction.stops.length - 1, bus.stopPosition));
  const lastIndex = Math.floor(position);
  const nextIndex = Math.min(lastIndex + 1, direction.stops.length - 1);
  return {
    direction, position, lastIndex, nextIndex,
    lastStop: direction.stops[lastIndex], nextStop: direction.stops[nextIndex],
    percent: position / (direction.stops.length - 1) * 100,
    atTerminal: position === direction.stops.length - 1,
    available: Math.max(0, bus.capacity - bus.passengers)
  };
}

export function arrivalAt(bus, stopIndex) {
  if (stopIndex < 0) return { state: "unavailable", minutes: null, label: "Halte tidak dilalui" };
  if (bus.source === "api") {
    if (stopIndex < bus.stopPosition || (stopIndex === bus.stopPosition && bus.movement === "en_route")) return { state: "passed", minutes: null, label: "Sudah melewati halte" };
    const arrival = bus.arrivalByStop?.[stopIndex];
    if (arrival) return { ...arrival, label: arrival.state === "approaching" ? `± ${arrival.minutes} menit` : arrival.state === "arrived" ? "Tiba di halte" : arrival.state === "passed" ? "Sudah melewati halte" : "Estimasi belum tersedia" };
    if (stopIndex === bus.stopPosition && bus.movement === "at_stop") return { state: "arrived", minutes: 0, label: "Tiba di halte" };
    return { state: "unavailable", minutes: null, label: "Estimasi belum tersedia" };
  }
  const distance = stopIndex - bus.stopPosition;
  if (distance < -.15) return { state: "passed", minutes: null, label: "Sudah melewati halte" };
  if (distance <= .15) return { state: "arrived", minutes: 0, label: "Tiba di halte" };
  const minutes = Math.max(1, Math.ceil(distance * 1.8));
  return { state: "approaching", minutes, label: `± ${minutes} menit` };
}

export function ticketQuote({ bus, from, to, quantity, category }) {
  const { direction, available } = busLocation(bus);
  const first = direction.stops.indexOf(from);
  const last = direction.stops.indexOf(to);
  const arrival = arrivalAt(bus, first);
  const fare = category === "pelajar" ? corridor.studentFare : corridor.generalFare;
  let reason = "";
  if (first < 0 || last <= first) reason = "Pilih tujuan setelah halte keberangkatan pada arah yang sama.";
  else if (arrival.state === "passed") reason = "Bus ini sudah melewati halte keberangkatan. Pilih bus lain.";
  else if (arrival.state === "unavailable") reason = "Estimasi tiba belum tersedia. Tunggu pembaruan laporan armada.";
  else if (!available) reason = "Bus penuh. Pilih armada lain.";
  else if (!Number.isInteger(quantity) || quantity < 1 || quantity > Math.min(5, available)) reason = "Maksimal 5 penumpang per pesanan, mengikuti kapasitas yang tersedia.";
  return { eligible: !reason, reason, arrival, fare, total: fare * quantity, available, direction };
}
