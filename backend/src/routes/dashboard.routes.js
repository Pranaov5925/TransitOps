const { Router } = require("express");
const ctrl = require("../controllers/dashboard.controller");
const router = Router();

router.get("/kpis", ctrl.getKpis);

module.exports = router;
