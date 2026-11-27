import test from "node:test";
import assert from "node:assert/strict";
import { createTicketDraft, createTicketOrder, validateTicketDraft, cardFileError, todayWib, departureIsPast } from "../src/ticketModel.js";
import { createDemoFleet, advanceDemoFleet, arrivalAt, ticketQuote } from "../src/fleet.js";
import { normalizeFleetSnapshot } from "../src/services/fleetAdapter.js";
import { createApiClient, createSmartStopApi, ApiError } from "../src/services/smartstopApi.js";

const now = new Date("2026-11-27T13:00:00Z");
const trip = { from: "Terminal Bulupitu", to: "Terminal Bukateja" };
const validCard = { name: "kartu-contoh.png", type: "image/png", size: 1200 };
const draft = () => createTicketDraft({ name: "Penumpang Uji", trip }, now);

test("departure dates follow WIB and skip today's finished demo schedule", () => {
  assert.equal(todayWib(new Date("2026-11-27T18:00:00Z")), "2026-11-28");
  assert.equal(draft().date, "2026-11-28");
  assert.equal(departureIsPast("2026-11-28", "06:00", now), false);
  assert.equal(departureIsPast("2027-02-30", "06:00", now), true);
  assert.equal(departureIsPast("2026-11-27", "15:00", now), true);
});

test("group student booking requires every companion's name and card, max five people", () => {
  const record = { ...draft(), companions: [{ id: "friend", name: "Teman Uji", file: null }] };
  assert.match(validateTicketDraft(record, "pelajar", now)["file-0"], /kartu pelajar/);
  assert.deepEqual(validateTicketDraft(record, "umum", now), {});
  record.companions[0].file = validCard;
  assert.deepEqual(validateTicketDraft(record, "pelajar", now), {});
  record.companions = Array.from({ length: 5 }, () => ({ name: "Teman", file: validCard }));
  assert.match(validateTicketDraft(record, "pelajar", now).quantity, /5 tiket/);
});

test("invalid file types, empty files and oversized cards cannot pass client checks", () => {
  assert.equal(cardFileError(validCard), "");
  assert.ok(cardFileError({ ...validCard, type: "application/javascript" }));
  assert.ok(cardFileError({ ...validCard, name: "kartu.svg" }));
  assert.ok(cardFileError({ ...validCard, size: 0 }));
  assert.ok(cardFileError({ ...validCard, size: 5 * 1024 * 1024 + 1 }));
});

test("same-stop and reversed same-direction bookings are rejected", () => {
  assert.ok(validateTicketDraft({ ...draft(), to: trip.from }, "umum", now).route);
  assert.ok(validateTicketDraft({ ...draft(), from: "Depo Pelita", to: "SPBU Candimas" }, "umum", now).route);
});

test("student group total uses all people and preserves pending card status", () => {
  const record = { ...draft(), companions: [{ name: "Teman", file: validCard }] };
  const order = createTicketOrder(record, "pelajar");
  assert.equal(order.quantity * order.fare, 4000);
  assert.equal(order.status, "reserved");
  assert.equal(order.passengers[1].studentCard.verification, "pending");
  assert.equal(Object.hasOwn(order.passengers[1].studentCard, "contents"), false);
  const fleet = createDemoFleet();
  const before = structuredClone(fleet);
  createTicketOrder(record, "umum");
  assert.deepEqual(fleet, before, "a reservation must not add onboard passengers");
});

test("map booking rejects passed stops, full buses and oversized groups", () => {
  const fleet = createDemoFleet();
  const bus = fleet.find(item => item.id === "4");
  const quote = props => ticketQuote({ bus, from: "Terminal Jompo", to: "Terminal Bukateja", quantity: 1, category: "umum", ...props });
  assert.equal(quote({}).eligible, true);
  assert.equal(quote({ from: "SPBU Candimas" }).eligible, false);
  assert.equal(quote({ quantity: 6 }).eligible, false);
  assert.equal(quote({ bus: { ...bus, passengers: bus.capacity } }).eligible, false);
  const advanced = advanceDemoFleet([{ ...bus, stopPosition: 22.95 }])[0];
  assert.equal(advanced.stopPosition, 23);
  assert.equal(bus.stopPosition, 6.35);
});

const apiRecord = { id: "vehicle-a", number: "21", code: "TJ-21", direction: "bukateja", currentStopIndex: 6,
  passengers: 22, capacity: 40, movement: "at_stop", reportedAt: "2026-11-27T12:30:00Z",
  arrivals: [{ stopIndex: 8, state: "approaching", minutes: 4 }] };

test("driver reports do not invent an ETA when the server did not supply one", () => {
  const [bus] = normalizeFleetSnapshot({ buses: [apiRecord] });
  assert.equal(arrivalAt(bus, 6).state, "arrived");
  assert.equal(arrivalAt(bus, 5).state, "passed");
  assert.equal(arrivalAt(bus, 8).minutes, 4);
  assert.equal(arrivalAt(bus, 7).state, "unavailable");
  assert.equal(bus.id, "vehicle-a");
  assert.deepEqual(normalizeFleetSnapshot({ buses: [] }), []);
});

test("invalid API snapshots cannot silently render impossible passenger counts", () => {
  assert.throws(() => normalizeFleetSnapshot({ buses: [{ ...apiRecord, passengers: 41 }] }));
  assert.throws(() => normalizeFleetSnapshot({ buses: [apiRecord, apiRecord] }));
  assert.throws(() => normalizeFleetSnapshot({ buses: [{ ...apiRecord, currentStopIndex: 99 }] }));
});

test("API client sends JSON and abort signal, unwraps data and reports server failures", async () => {
  let request;
  const signal = new AbortController().signal;
  const client = createApiClient({ baseURL: "https://api.example.test/api/", fetchImpl: async (url, options) => {
    request = { url, ...options };
    return { ok: true, status: 200, json: async () => ({ data: { buses: [apiRecord] } }) };
  } });
  const api = createSmartStopApi(client);
  assert.equal((await api.fleet.snapshot(signal)).buses.length, 1);
  assert.equal(request.url, "https://api.example.test/api/armada");
  assert.equal(request.signal, signal);
  await api.driver.reportStatus({ tripId: "trip-a", stopIndex: 6, movement: "at_stop", eventId: "unique-event" });
  assert.equal(request.credentials, "include");
  assert.equal(JSON.parse(request.body).tripId, "trip-a");
  const failing = createApiClient({ fetchImpl: async () => ({ ok: false, status: 403, json: async () => ({ message: "Akses ditolak" }) }) });
  await assert.rejects(failing.request("admin/akun"), error => error instanceof ApiError && error.status === 403);
});
