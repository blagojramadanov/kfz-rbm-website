-- Add sample vehicles for testing Inzahlungnahme (trade-in) workflow
-- These vehicles will be available for selection in the desired vehicle step

INSERT INTO vehicles (
  vin, brand, model, year, mileage, price, transmission, fuel_type,
  body_type, color_exterior, color_interior, engine_cc, power_hp,
  description, status, featured
) VALUES

-- Sample Vehicle 1: BMW 330i
(
  'WBADT43452G123456',
  'BMW',
  '330i',
  2023,
  12000,
  48500.00,
  'Automatik',
  'Benzin',
  'Sedan',
  'Schwarz',
  'Leder Grau',
  2998,
  258,
  'Wunderschöner BMW 330i Touring mit kompletter Ausstattung. Neu gekauft, Herstellergarantie bis 2026. Vollständige Service-Historie vorhanden. LED-Scheinwerfer, Panoramadach, 18-Zoll Leichtmetallräder, Klimaautomatik.',
  'available',
  TRUE
),

-- Sample Vehicle 2: Mercedes-Benz C-Class
(
  'WMEUF35K90E123457',
  'Mercedes-Benz',
  'C 300',
  2022,
  28000,
  42750.00,
  'Automatik',
  'Benzin',
  'Sedan',
  'Silber',
  'Leder Schwarz',
  1991,
  190,
  'Eleganter Mercedes-Benz C 300 mit werkseitigem Allradantrieb (4MATIC). Sehr gepflegter Zustand, Wartungsvertrag noch gültig. Tempomat, Navigation, Rückfahrkamera, Bi-Xenon Scheinwerfer.',
  'available',
  TRUE
),

-- Sample Vehicle 3: Audi A4
(
  'WAUZZZ8K3LN123458',
  'Audi',
  'A4 40 TDI',
  2021,
  45000,
  38900.00,
  'Automatik',
  'Diesel',
  'Sedan',
  'Dunkelbraun',
  'Stoff Grau',
  1968,
  190,
  'Sparsamer Audi A4 mit modernem Dieselmotor. Abgasnorm Euro 6d-TEMP. Audis Virtual Cockpit, MMI Navigation, Sitzbezüge beheizt, Spurhalteassistent.',
  'available',
  FALSE
),

-- Sample Vehicle 4: VW Golf
(
  'WVWZZZ3CZ9E123459',
  'Volkswagen',
  'Golf 8 TSI',
  2022,
  32500,
  26750.00,
  'Manuell',
  'Benzin',
  'Kompaktwagen',
  'Rot',
  'Stoff Schwarz',
  1498,
  130,
  'Zuverlässiger VW Golf mit modernem Dreizylinder-Benziner. IQ.DRIVE Paket mit Abstandsregelung und Spurassistent. Apple CarPlay/Android Auto, USB-C Ladebuchse.',
  'available',
  FALSE
),

-- Sample Vehicle 5: Volvo XC60
(
  'YV1LZ5956L2123460',
  'Volvo',
  'XC60 T6 AWD',
  2020,
  68000,
  45200.00,
  'Automatik',
  'Benzin (Hybrid)',
  'SUV',
  'Grau',
  'Leder Creme',
  1969,
  310,
  'Premium Volvo XC60 mit Hybrid-Antrieb für bessere Effizienz. Scandinavian Design, Luftfederung, Panoramadach, Volvo Sensus Entertainment System mit großem Touchscreen.',
  'available',
  TRUE
),

-- Sample Vehicle 6: Skoda Octavia
(
  'TMAZZ3EZ1J0123461',
  'Skoda',
  'Octavia 2.0 TDI',
  2023,
  8500,
  28900.00,
  'Automatik',
  'Diesel',
  'Kombi',
  'Weiß',
  'Stoff Dunkelgrau',
  1968,
  150,
  'Praktischer Skoda Octavia Combi mit modernem Dieselmotor. Großzügiger Kofferraum (640l). Neuwagen mit vollständiger Herstellergarantie. Digitales Cockpit, LED-Tagfahrlichter.',
  'available',
  FALSE
),

-- Sample Vehicle 7: Porsche 911 Carrera
(
  'WP0CB2A92LS123462',
  'Porsche',
  '911 Carrera',
  2019,
  92000,
  89500.00,
  'Automatik',
  'Benzin',
  'Coupe',
  'Graphitgrau',
  'Leder Schwarz',
  3498,
  370,
  'Legendärer Porsche 911 Carrera mit 3.5L Boxermotor. Schiebedach, Sportwagen-Paket, 20-Zoll Carrera S Räder. Vollständiger Service-Verlauf, Unfallfreiheit garantiert.',
  'available',
  TRUE
);

-- Add a comment to document these are test vehicles
COMMENT ON TABLE vehicles IS 'KFZ RBM inventory - sample vehicles added for testing Inzahlungnahme workflow';
