// Frontend fixtures transcribed from the supplied SmartStop design.
// Replace these records with API responses when the backend is connected.
export const outboundStops = [
  'Terminal Bulupitu', 'SPBU Candimas', 'Depo Pelita', 'SMP N 1 Sokaraja',
  'Simpang 4 Klenteng 1', 'SMA N 1 Sokaraja 1', 'Bulog Klahang 1', 'Banjarsari',
  'Terminal Jompo', 'Fak. Teknik Unsoed 1', 'SMP N 2 Kalimanah 1', 'Selabaya 1',
  'SMK YPT 1', 'Terminal Purbalingga', 'Indokores', 'Usman Janatin',
  'Taman Gringsing 1', 'SMP N 2 Purbalingga 1', 'MAN Purbalingga 1',
  'Kedungmenjangan 1', 'Simpang 3 Bojong 1', 'Victoria', 'SMK N 1 Bukateja',
  'Terminal Bukateja'
];

export const inboundStops = [
  'Terminal Bukateja', 'SMA N 1 Bukateja', 'Victoria 2', 'Simpang 3 Bojong 2',
  'Kedungmenjangan 2', 'MAN Purbalingga 2', 'SMP N 2 Purbalingga 2',
  'Taman Gringsing 2', 'Simpang 3 Yuro', 'Terminal Purbalingga', 'SMK YPT 2',
  'Selabaya 2', 'SMP N 2 Kalimanah 2', 'Fak. Teknik Unsoed 2', 'Terminal Jompo',
  'Akper Yakpermas', 'Banjarsari 2', 'Bulog Klahang 2', 'SMA N 1 Sokaraja 2',
  'Simpang 4 Klenteng 2', 'SMP N 1 Sokaraja 2', 'SMP N 2 Sokaraja',
  'UMP Kampus II', 'RS Orthopedi', 'RS Margono Soekarjo', 'Simpang 4 Pancurawis',
  'Simpang 4 Karangbawang 1', 'Andhang Pangrenan 1', 'Bioskop Rajawali 1',
  'Bank Mandiri 1', 'RRI', 'SMP N 1 Purwokerto', 'Pratistha Harsa', 'Pasar Pon',
  'Pasar Manis', 'Bruderan', 'SMA N 1 Purwokerto', 'SMK N 2 Purwokerto',
  'Pasar Wage 1', 'Pasar Wage 2', 'Bioskop Rajawali 2', 'Andhang Pangrenan 2',
  'Simpang 4 Karangbawang 2', 'Terminal Bulupitu'
];

export const corridor = {
  name: 'Koridor 1',
  stops: [...new Set([...outboundStops, ...inboundStops])],
  departures: ['06:00', '07:30', '09:00', '12:30', '15:00'],
  generalFare: 4000,
  studentFare: 2000
};

export const routeDirections = [
  {
    id: 'bukateja', title: 'Arah Terminal Bukateja',
    heading: 'Jalur keberangkatan · Terminal Bulupitu → Terminal Bukateja',
    stops: outboundStops, lengthKm: 39,
    description: 'Terminal Bulupitu → Candimas → Depo Pelita → SMP 2 Sokaraja → RS Orthopedi → SMPN 1 Sokaraja → Sp. 4 Sokaraja (Klenteng) → Tugu Sokaraja → Bulog → Term. Jompo / Akper Yakpermas → Kel. Banjarsari → PT. Unsoed 1 → SMP Kalimanah 2 / SMK YPTI 1 → Indokores → Term. Purbalingga → Taman Usman Janatin → SMP N 2 PBG 2 → MAN PBG 1 → Sp. 3 Bojong 2 → SMK N 1 Bukateja → Terminal Bukateja.'
  },
  {
    id: 'bulupitu', title: 'Arah Terminal Bulupitu',
    heading: 'Jalur lingkar kota · Terminal Bukateja | Purwokerto | Terminal Bulupitu',
    stops: inboundStops, lengthKm: 39,
    description: 'Terminal Bukateja → SMAN 1 Bukateja → Sp. 3 Bojong 1 → MAN PBG 2 → SMP N 2 PBG 1 → Yuro Sp. 3 → SMP Kalimanah 1 / SMK YPTI 2 → PT. Unsoed 2 → Term. Jompo → SMPN 1 Sokaraja → Sp. 4 Sokaraja → RS Margono Soekarjo → Pancurawis → Shelter Transit Purwokerto (Karangbawang) → Andhang Pangrenan → Bioskop Rajawali → Bank Mandiri → SMAN 1 Purwokerto → SMP Bruderan → Pasar Manis → Pratistha Harsa → Terminal Bulupitu.'
  }
];

export const departures = [
  { id: 'TJ-04', direction: 'bukateja', title: 'Trans Jateng (Arah Bukateja)', via: 'RS Orthopedi — Sokaraja — Term. Purbalingga', minutes: 3, plate: 'AA 1420 AB', occupancy: 65 },
  { id: 'TJ-08', direction: 'bulupitu', title: 'Trans Jateng (Arah Terminal Purbalingga)', via: 'Candimas — Depo Pelita — Term. Jompo', minutes: 7, plate: 'AA 1502 AB', occupancy: 40 },
  { id: 'TJ-11', direction: 'bukateja', title: 'Trans Jateng (Arah Bukateja)', via: 'Bojong — MAN Purbalingga', minutes: 14, plate: 'AA 1618 AB', occupancy: 20 },
  { id: 'TJ-02', direction: 'bulupitu', title: 'Trans Jateng (Arah Terminal Bulupitu / PWT)', via: 'Pasar Manis — Pratistha Harsa — Bulupitu', minutes: 21, plate: 'AA 1409 AB', occupancy: 50 }
];

export function findJourney(from, to) {
  if (from === to) return null;
  for (const direction of routeDirections) {
    const first = direction.stops.indexOf(from);
    const last = direction.stops.indexOf(to);
    if (first !== -1 && last > first) {
      return { ...direction, stops: direction.stops.slice(first, last + 1) };
    }
  }
  return null;
}

export const rupiah = value => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0
}).format(value);
