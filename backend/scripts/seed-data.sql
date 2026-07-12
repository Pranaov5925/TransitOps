-- ============================================================
-- TransitOps Seed Data
-- Run this AFTER schema.sql has been executed.
-- All data matches frontend mock-data.ts exactly.
-- Password for all users: demo1234
-- ============================================================

-- Auth Users (password: demo1234)
INSERT INTO auth_users (id, email, passwordHash, role) VALUES
  ('u1', 'alex@transitops.co',       '$2a$10$hB8BjLjcGSDEUmFtSkcSgeCIOm4/xZUc7cITPj3KQGFbUdi3yKJo6', 'Fleet Manager'),
  ('u2', 'dispatcher@transitops.co',  '$2a$10$hB8BjLjcGSDEUmFtSkcSgeCIOm4/xZUc7cITPj3KQGFbUdi3yKJo6', 'Dispatcher'),
  ('u3', 'safety@transitops.co',      '$2a$10$hB8BjLjcGSDEUmFtSkcSgeCIOm4/xZUc7cITPj3KQGFbUdi3yKJo6', 'Safety Officer'),
  ('u4', 'finance@transitops.co',     '$2a$10$hB8BjLjcGSDEUmFtSkcSgeCIOm4/xZUc7cITPj3KQGFbUdi3yKJo6', 'Financial Analyst');

-- Vehicles
INSERT INTO vehicles (id, regNumber, model, `type`, capacityKg, odometer, cost, `status`, region) VALUES
  ('v1', 'GCU-11602', 'Van-05',   'Van',   500,  47000,  620000,  'Available', 'North'),
  ('v2', 'GCU-BM19',  'Truck-11', 'Truck', 5000, 128000, 3120000, 'On Trip',   'South'),
  ('v3', 'GCU-BM50',  'Van-08',   'Van',   800,  12000,  725000,  'In Shop',   'East'),
  ('v4', 'GCU-11629', 'Truck-06', 'Truck', 8000, 210000, 4500000, 'Retired',   'West'),
  ('v5', 'GCU-BM09',  'Van-02',   'Van',   600,  33000,  580000,  'Available', 'North');

-- Drivers
INSERT INTO drivers (id, name, licenseNumber, licenseCategory, licenseExpiry, contact, safetyScore, `status`) VALUES
  ('d1', 'Alex Reyes', 'DL-8823901', 'C', '2027-03-14', '+91 98220 11045', 92, 'Available'),
  ('d2', 'Maya Iyer',  'DL-7712208', 'B', '2026-11-02', '+91 90881 33210', 88, 'On Trip'),
  ('d3', 'Priya Nair', 'DL-4433118', 'C', '2025-08-11', '+91 99123 44980', 76, 'Off Duty'),
  ('d4', 'Ravi Kumar', 'DL-9911002', 'D', '2024-12-01', '+91 90000 11111', 61, 'Suspended');

-- Trips
INSERT INTO trips (id, code, source, destination, vehicleId, driverId, cargoKg, distanceKm, `status`, createdAt, fuelUsedL) VALUES
  ('t1', 'TR001', 'Warehouse A', 'Depot 12',  'v2', 'd2', 3800, 210, 'Dispatched', '2025-07-08', NULL),
  ('t2', 'TR002', 'Warehouse B', 'Retail 04', 'v1', 'd1', 420,  88,  'Completed',  '2025-07-06', 11),
  ('t3', 'TR003', 'Warehouse A', 'Retail 09', 'v5', 'd3', 300,  45,  'Draft',      '2025-07-11', NULL);

-- Maintenance Logs
INSERT INTO maintenance_logs (id, vehicleId, `type`, cost, `date`, `status`) VALUES
  ('m1', 'v3', 'Oil Change',    3500,  '2025-07-05', 'Open'),
  ('m2', 'v2', 'Tire Rotation', 12000, '2025-06-14', 'Closed');

-- Fuel Logs
INSERT INTO fuel_logs (id, vehicleId, liters, cost, `date`) VALUES
  ('f1', 'v1', 44, 4620, '2025-07-06'),
  ('f2', 'v2', 88, 9240, '2025-07-04'),
  ('f3', 'v5', 30, 3150, '2025-07-01');

-- Expenses
INSERT INTO expenses (id, vehicleId, kind, amount, `date`, note) VALUES
  ('e1', 'v2', 'Toll',    850, '2025-07-08', 'NH-48'),
  ('e2', 'v1', 'Parking', 120, '2025-07-06', NULL);
