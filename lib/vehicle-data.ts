export interface Vehicle {
  id: string;
  slug: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  transmission: "Manual" | "Automatik";
  fuelType: "Diesel" | "Benzin" | "Hybrid" | "Elektro" | "LPG";
  bodyType: "Sedan" | "SUV" | "Kombi" | "Coupe" | "Cabriolet" | "Kleinwagen" | "Van";
  powerHp: number;
  color: string;
  firstRegistration: string;
  tu: string;
  au: string;
  damageHistory: "Unfallfrei" | "Mit Schaden";
  taxable: "Ja" | "Nein";
  description: string;
  images: string[];
  features: string[];
}

export const MOCK_VEHICLES: Vehicle[] = [
  {
    id: "v1",
    slug: "bmw-330i-2023",
    brand: "BMW",
    model: "330i",
    year: 2023,
    mileage: 8500,
    price: 52000,
    transmission: "Automatik",
    fuelType: "Benzin",
    bodyType: "Sedan",
    powerHp: 258,
    color: "Schwarz",
    firstRegistration: "01/2023",
    tu: "01/2028",
    au: "01/2025",
    damageHistory: "Unfallfrei",
    taxable: "Ja",
    description:
      "Hochwertiger BMW 330i in hervorragendem Zustand. Vollständige Wartungshistorie, alle Inspektionen durchgeführt. Premium-Interieur mit Lederausstattung.",
    images: [
      "https://picsum.photos/seed/kfzrbm-1/1000/750",
      "https://picsum.photos/seed/kfzrbm-2/1000/750",
      "https://picsum.photos/seed/kfzrbm-3/1000/750",
    ],
    features: [
      "Leder",
      "Panoramadach",
      "LED-Scheinwerfer",
      "Navigationssystem",
      "Klimaautomatik",
      "Keyless Go",
      "Bluetooth",
    ],
  },
  {
    id: "v2",
    slug: "mercedes-c-class-2022",
    brand: "Mercedes-Benz",
    model: "C-Class",
    year: 2022,
    mileage: 25000,
    price: 58000,
    transmission: "Automatik",
    fuelType: "Diesel",
    bodyType: "Sedan",
    powerHp: 200,
    color: "Grau",
    firstRegistration: "03/2022",
    tu: "03/2027",
    au: "03/2024",
    damageHistory: "Unfallfrei",
    taxable: "Ja",
    description:
      "Eleganter Mercedes-Benz C-Class mit Diesel-Engine. Sehr sparsam im Verbrauch, perfekt für Vielfahrer.",
    images: [
      "https://picsum.photos/seed/kfzrbm-4/1000/750",
      "https://picsum.photos/seed/kfzrbm-5/1000/750",
    ],
    features: [
      "AMG-Line",
      "Distronic Plus",
      "Stühle mit Massagefunktion",
      "360°-Kamera",
      "Panoramadach",
    ],
  },
  {
    id: "v3",
    slug: "audi-a4-2023",
    brand: "Audi",
    model: "A4",
    year: 2023,
    mileage: 12000,
    price: 48000,
    transmission: "Automatik",
    fuelType: "Benzin",
    bodyType: "Sedan",
    powerHp: 190,
    color: "Weiß",
    firstRegistration: "02/2023",
    tu: "02/2028",
    au: "02/2025",
    damageHistory: "Unfallfrei",
    taxable: "Nein",
    description:
      "Neuwertiger Audi A4 mit minimaler Laufleistung. Sorgfältig gepflegt, alle Service-Arbeiten erledigt.",
    images: [
      "https://picsum.photos/seed/kfzrbm-8/1000/750",
      "https://picsum.photos/seed/kfzrbm-9/1000/750",
    ],
    features: ["Virtual Cockpit", "Metallic-Lackierung", "LED-Beleuchtung", "Tempomat"],
  },
  {
    id: "v4",
    slug: "tesla-model-3-2023",
    brand: "Tesla",
    model: "Model 3",
    year: 2023,
    mileage: 5000,
    price: 55000,
    transmission: "Automatik",
    fuelType: "Elektro",
    bodyType: "Sedan",
    powerHp: 272,
    color: "Grau",
    firstRegistration: "05/2023",
    tu: "05/2028",
    au: "05/2025",
    damageHistory: "Unfallfrei",
    taxable: "Ja",
    description:
      "Hochmoderner Tesla Model 3 mit neuester Autopilot-Technologie. Extrem sparsam, umweltfreundlich.",
    images: [
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1000&h=750&fit=crop",
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1000&h=750&fit=crop",
    ],
    features: [
      "Autopilot",
      "Supercharger-Zugang",
      "Glass Roof",
      "Induktives Laden",
      "OTA-Updates",
    ],
  },
  {
    id: "v5",
    slug: "porsche-911-2022",
    brand: "Porsche",
    model: "911",
    year: 2022,
    mileage: 18000,
    price: 95000,
    transmission: "Automatik",
    fuelType: "Benzin",
    bodyType: "Coupe",
    powerHp: 385,
    color: "Rot",
    firstRegistration: "06/2022",
    tu: "06/2027",
    au: "06/2024",
    damageHistory: "Unfallfrei",
    taxable: "Ja",
    description:
      "Traumhafter Porsche 911 in klassischem Rot. Premium-Ausstattung, gepflegter Zustand, vielen Extras.",
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1000&h=750&fit=crop",
      "https://picsum.photos/seed/kfzrbm-8/1000/750",
    ],
    features: [
      "Sport-Lenkrad",
      "Carbon-Innenteile",
      "Burmester-Sound",
      "Keramikbremsen",
      "Adaptive Suspension",
    ],
  },
  {
    id: "v6",
    slug: "volkswagen-passat-2021",
    brand: "Volkswagen",
    model: "Passat",
    year: 2021,
    mileage: 45000,
    price: 35000,
    transmission: "Automatik",
    fuelType: "Diesel",
    bodyType: "Kombi",
    powerHp: 150,
    color: "Schwarz",
    firstRegistration: "09/2021",
    tu: "09/2026",
    au: "09/2023",
    damageHistory: "Unfallfrei",
    taxable: "Ja",
    description:
      "Zuverlässiger VW Passat Kombi mit großem Kofferraum. Ideal für Familie und Geschäftsfahrten.",
    images: [
      "https://picsum.photos/seed/kfzrbm-9/1000/750",
    ],
    features: ["Kombi", "großer Kofferraum", "Anhängerkupplung", "IQ.Light LED"],
  },
  {
    id: "v7",
    slug: "skoda-superb-2023",
    brand: "Skoda",
    model: "Superb",
    year: 2023,
    mileage: 3000,
    price: 42000,
    transmission: "Automatik",
    fuelType: "Benzin",
    bodyType: "Sedan",
    powerHp: 190,
    color: "Blau",
    firstRegistration: "04/2023",
    tu: "04/2028",
    au: "04/2025",
    damageHistory: "Unfallfrei",
    taxable: "Nein",
    description:
      "Moderner Skoda Superb mit hochwertiger Ausstattung. Zuverlässigkeit und Qualität zu fairem Preis.",
    images: [
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1000&h=750&fit=crop",
      "https://picsum.photos/seed/kfzrbm-8/1000/750",
    ],
    features: ["Infotainment", "Leichte Alloys", "Spurhalter", "Müdigkeitserkennung"],
  },
  {
    id: "v8",
    slug: "audi-q5-2022",
    brand: "Audi",
    model: "Q5",
    year: 2022,
    mileage: 32000,
    price: 62000,
    transmission: "Automatik",
    fuelType: "Diesel",
    bodyType: "SUV",
    powerHp: 286,
    color: "Grau",
    firstRegistration: "07/2022",
    tu: "07/2027",
    au: "07/2024",
    damageHistory: "Unfallfrei",
    taxable: "Ja",
    description:
      "Robuster Audi Q5 mit Allradantrieb. Premium-SUV mit hohem Fahrkomfort und Geländetauglichkeit.",
    images: [
      "https://picsum.photos/seed/kfzrbm-8/1000/750",
      "https://picsum.photos/seed/kfzrbm-9/1000/750",
    ],
    features: ["Quattro AWD", "Air Suspension", "Matrix LED", "Panoramadach"],
  },
];
