const { Router } = require("express");
const ctrl = require("../controllers/analytics.controller");
const router = Router();

router.get("/vehicle-costs", ctrl.vehicleCosts);
router.get("/fuel-efficiency", ctrl.fuelEfficiency);
router.get("/roi", ctrl.roi);
router.get("/export.csv", ctrl.exportCsv);

module.exports = router;
