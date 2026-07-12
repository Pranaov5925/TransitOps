CREATE TABLE IF NOT EXISTS auth_users (
  id          VARCHAR(36)  PRIMARY KEY,
  email       VARCHAR(255) NOT NULL UNIQUE,
  passwordHash VARCHAR(255) NOT NULL,
  role        VARCHAR(50)  NOT NULL,
  createdAt   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updatedAt   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
  id          VARCHAR(36)  PRIMARY KEY,
  regNumber   VARCHAR(50)  NOT NULL UNIQUE,
  model       VARCHAR(100) NOT NULL,
  `type`      VARCHAR(50)  NOT NULL,
  capacityKg  DOUBLE       NOT NULL,
  odometer    DOUBLE       NOT NULL,
  cost        DOUBLE       NOT NULL,
  revenue     DOUBLE       NOT NULL DEFAULT 0,
  `status`    VARCHAR(20)  NOT NULL DEFAULT 'Available',
  region      VARCHAR(50)  NOT NULL,
  createdAt   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updatedAt   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drivers (
  id              VARCHAR(36)  PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  licenseNumber   VARCHAR(50)  NOT NULL,
  licenseCategory VARCHAR(10)  NOT NULL,
  licenseExpiry   VARCHAR(20)  NOT NULL,
  contact         VARCHAR(50)  NOT NULL,
  safetyScore     DOUBLE       NOT NULL,
  `status`        VARCHAR(20)  NOT NULL DEFAULT 'Available',
  createdAt       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updatedAt       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trips (
  id          VARCHAR(36)  PRIMARY KEY,
  code        VARCHAR(10)  NOT NULL UNIQUE,
  source      VARCHAR(100) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  vehicleId   VARCHAR(36)  NOT NULL,
  driverId    VARCHAR(36)  NOT NULL,
  cargoKg     DOUBLE       NOT NULL,
  distanceKm  DOUBLE       NOT NULL,
  `status`    VARCHAR(20)  NOT NULL DEFAULT 'Draft',
  createdAt   VARCHAR(20)  NOT NULL,
  fuelUsedL   DOUBLE       NULL,
  FOREIGN KEY (vehicleId) REFERENCES vehicles(id),
  FOREIGN KEY (driverId)  REFERENCES drivers(id),
  INDEX idx_vehicleId (vehicleId),
  INDEX idx_driverId  (driverId)
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id        VARCHAR(36)  PRIMARY KEY,
  vehicleId VARCHAR(36)  NOT NULL,
  `type`    VARCHAR(100) NOT NULL,
  cost      DOUBLE       NOT NULL,
  `date`    VARCHAR(20)  NOT NULL,
  `status`  VARCHAR(20)  NOT NULL DEFAULT 'Open',
  createdAt TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicleId) REFERENCES vehicles(id),
  INDEX idx_ml_vehicleId (vehicleId)
);

CREATE TABLE IF NOT EXISTS fuel_logs (
  id        VARCHAR(36)  PRIMARY KEY,
  vehicleId VARCHAR(36)  NOT NULL,
  liters    DOUBLE       NOT NULL,
  cost      DOUBLE       NOT NULL,
  `date`    VARCHAR(20)  NOT NULL,
  createdAt TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicleId) REFERENCES vehicles(id),
  INDEX idx_fl_vehicleId (vehicleId)
);

CREATE TABLE IF NOT EXISTS expenses (
  id        VARCHAR(36)  PRIMARY KEY,
  vehicleId VARCHAR(36)  NOT NULL,
  kind      VARCHAR(50)  NOT NULL,
  amount    DOUBLE       NOT NULL,
  `date`    VARCHAR(20)  NOT NULL,
  note      TEXT         NULL,
  createdAt TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicleId) REFERENCES vehicles(id),
  INDEX idx_ex_vehicleId (vehicleId)
);
