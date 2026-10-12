-- Generated from full_water_zones.csv
-- Taumata Arowai / Auckland water supply zones seed data
-- Review before running against production. This script inserts scheme and zone records.
-- The CSV has 80 rows and 45 distinct supply IDs.
-- Six rows have missing coordinates; the schema's NOT NULL constraints are relaxed below
-- so those records can be imported without inventing coordinates.

BEGIN;

-- Allow source rows with unavailable coordinates to be represented honestly as NULL.
ALTER TABLE water_supply_zones ALTER COLUMN supply_latitude DROP NOT NULL;
ALTER TABLE water_supply_zones ALTER COLUMN supply_longitude DROP NOT NULL;

-- Create one scheme per distinct Supply ID. Existing records are updated idempotently.
INSERT INTO water_supply_schemes (supply_id, supply_name, supplier_name, region)
VALUES
    ('WAH002', 'Waharau Regional Park', 'Watercare Services Limited', 'Auckland'),
    ('PAP001', 'Papakura', 'Watercare Services Limited', 'Auckland'),
    ('WAI222', 'Waitawa Regional Park', 'Watercare Services Limited', 'Auckland'),
    ('BUR004', 'Burnside Road', 'Watercare Services Limited', 'Auckland'),
    ('MUR008', 'Muriwai Regional Park', 'Watercare Services Limited', 'Auckland'),
    ('TAW001', 'Tawharanui Regional Park', 'Watercare Services Limited', 'Auckland'),
    ('KIN002', 'Kingseat Community', 'Watercare Services Limited', 'Auckland'),
    ('MAH003', 'Mahurangi Regional Park', 'Watercare Services Limited', 'Auckland'),
    ('BOM003', 'Bombay', 'Watercare Services Limited', 'Auckland'),
    ('HUI006', 'Huia Village', 'Watercare Services Limited', 'Auckland'),
    ('HEL005', 'Helensville/Parakai', 'Watercare Services Limited', 'Auckland'),
    ('AUC003', 'Auckland', 'Watercare Services Limited', 'Auckland'),
    ('SNE002', 'Snells/Algies', 'Watercare Services Limited', 'Auckland'),
    ('MUR011', 'Muriwai', 'Watercare Services Limited', 'Auckland'),
    ('WAI214', 'Waiuku', 'Watercare Services Limited', 'Auckland'),
    ('KEN006', 'Kennedy Point Bore', 'Watercare Services Limited', 'Auckland'),
    ('WAR006', 'Warkworth', 'Watercare Services Limited', 'Auckland'),
    ('WEL004', 'Wellsford/Te Hana', 'Watercare Services Limited', 'Auckland'),
    ('BEA300', 'Beachlands Networks', 'Watercare Services Limited', 'Auckland'),
    ('OMA015', 'Omana Regional Park', 'Watercare Services Limited', 'Auckland'),
    ('KAI051', 'Kaipara Air Weapons Range', 'Watercare Services Limited', 'Auckland'),
    ('PIN003', 'Pine Harbour', 'Watercare Services Limited', 'Auckland'),
    ('BLA013', 'Blackwood Park Services', 'Watercare Services Limited', 'Auckland'),
    ('ONE005', 'Accommodation at 3-7 Fourth Avenue and 27 The Strand', 'Watercare Services Limited', 'Auckland'),
    ('MAR007', 'Martins Bay Holiday Camp', 'Watercare Services Limited', 'Auckland'),
    ('NEW008', 'New Zealand Steel Potable Water Supply', 'Watercare Services Limited', 'Auckland'),
    ('BOM002', 'Bombay Motorway Services', 'Watercare Services Limited', 'Auckland'),
    ('KEN005', 'Kensington Park', 'Watercare Services Limited', 'Auckland'),
    ('SCA002', 'Scandrett Regional Park', 'Watercare Services Limited', 'Auckland'),
    ('SUN002', 'Sunset Heights', 'Watercare Services Limited', 'Auckland'),
    ('SHA002', 'Shakespear Regional Park', 'Watercare Services Limited', 'Auckland'),
    ('DEF001', 'Devonport Naval Base', 'Watercare Services Limited', 'Auckland'),
    ('VIL001', 'Village Fields Subdivision', 'Watercare Services Limited', 'Auckland'),
    ('WHA018', 'Whangateau Camping Ground', 'Watercare Services Limited', 'Auckland'),
    ('MIL008', 'Mill Bay', 'Watercare Services Limited', 'Auckland'),
    ('PAK017', 'Pakiri Beach Holiday Park', 'Watercare Services Limited', 'Auckland'),
    ('AWH300', 'Awhitu Regional Park', 'Watercare Services Limited', 'Auckland'),
    ('PIH300', 'Piha Domain Campground', 'Watercare Services Limited', 'Auckland'),
    ('SIN300', 'Sinclair Park', 'Watercare Services Limited', 'Auckland'),
    ('MOT021', 'Home Bay, Motutapu Island Campsite', 'Watercare Services Limited', 'Auckland'),
    ('WAI197', 'Glenbrook Irrigation Company Limited', 'Watercare Services Limited', 'Auckland'),
    ('TAP007', 'Tapapakanga Regional Park', 'Watercare Services Limited', 'Auckland'),
    ('TEA025', 'Te Arai Links', 'Watercare Services Limited', 'Auckland'),
    ('KAR024', 'Karaka Village', 'Watercare Services Limited', 'Auckland'),
    ('HAR005', 'Haranui Whanau Water Supply Incorporated', 'Watercare Services Limited', 'Auckland')
ON CONFLICT (supply_id) DO UPDATE SET
    supply_name = EXCLUDED.supply_name,
    region = EXCLUDED.region,
    updated_at = NOW();

-- Import each CSV row as a water supply zone.
-- Source categories are mapped to the schema enum: urban area -> Urban; rural categories -> Rural.
-- Unknown source categories use the schema's default (Urban); review these classifications if needed.
INSERT INTO water_supply_zones
    (zone_id, zone_name, supply_id, urban_rural, zone_population, supply_latitude, supply_longitude)
VALUES
    ('WAH002A1', 'Waharau Regional Park', 'WAH002', 'Urban'::urban_rural_type, 400, -37.041259765625, 175.293350219727),
    ('PAP001PC', 'Papakura City', 'PAP001', 'Urban'::urban_rural_type, 44194, NULL, NULL),
    ('PAP001RH', 'Red Hill', 'PAP001', 'Urban'::urban_rural_type, 4115, NULL, NULL),
    ('PAP001TA', 'Takanini', 'PAP001', 'Urban'::urban_rural_type, 23814, NULL, NULL),
    ('WAI222A1', 'Waitawa Regional Park', 'WAI222', 'Urban'::urban_rural_type, 400, -36.9398956298828, 175.145919799805),
    ('BUR004BU', 'Burnside Road', 'BUR004', 'Urban'::urban_rural_type, 352, NULL, NULL),
    ('MUR008A1', 'Muriwai Regional Park', 'MUR008', 'Urban'::urban_rural_type, 400, -36.8230323791504, 174.440551757813),
    ('TAW001A1', 'Tawharanui Regional Park', 'TAW001', 'Urban'::urban_rural_type, 400, -36.3741645812988, 174.820983886719),
    ('KIN002KH', 'Kingseat Community', 'KIN002', 'Rural'::urban_rural_type, 400, -37.1406517028809, 174.799530029297),
    ('MAH003A1', 'Mahurangi Regional Park', 'MAH003', 'Urban'::urban_rural_type, 400, -36.5110206604004, 174.72184753418),
    ('BOM003BO', 'Bombay', 'BOM003', 'Urban'::urban_rural_type, 609, -37.1814041137695, 174.994338989258),
    ('HUI006HV', 'Huia Village', 'HUI006', 'Urban'::urban_rural_type, 597, -36.9911003112793, 174.566436767578),
    ('HEL005HP', 'Helensville/Parakai', 'HEL005', 'Urban'::urban_rural_type, 4579, -36.6817626953125, 174.455307006836),
    ('AUC003GN', 'Glen Eden/New Lynn', 'AUC003', 'Urban'::urban_rural_type, 61464, -37.19257, 174.90111),
    ('AUC003HW', 'HBC/Waiwera', 'AUC003', 'Urban'::urban_rural_type, 35272, -37.19257, 174.90111),
    ('AUC003HT', 'Hilltop', 'AUC003', 'Urban'::urban_rural_type, 1255, -37.19257, 174.90111),
    ('AUC003HH', 'High Head', 'AUC003', 'Urban'::urban_rural_type, 7189, -37.19257, 174.90111),
    ('AUC003AZ', 'Anzac', 'AUC003', 'Urban'::urban_rural_type, 4562, -37.19257, 174.90111),
    ('AUC003AU', 'Auckland', 'AUC003', 'Urban'::urban_rural_type, 280912, -37.19257, 174.90111),
    ('AUC003AA', 'Auckland Airport', 'AUC003', 'Urban'::urban_rural_type, 984, -37.19257, 174.90111),
    ('AUC003BU', 'Buckland', 'AUC003', 'Urban'::urban_rural_type, 997, -37.19257, 174.90111),
    ('AUC003HO', 'Howick/Pakuranga', 'AUC003', 'Urban'::urban_rural_type, 99873, -37.19257, 174.90111),
    ('AUC003CB', 'Central Business Dist.Auckland', 'AUC003', 'Urban'::urban_rural_type, 19309, -37.19257, 174.90111),
    ('AUC003CL', 'Clarks/Waiau Beach', 'AUC003', 'Urban'::urban_rural_type, 1434, -37.19257, 174.90111),
