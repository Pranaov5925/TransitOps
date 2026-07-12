const { Router } = require("express");
const ctrl = require("../controllers/trip.controller");
const router = Router();

router.get("/", ctrl.getAll);
router.post("/", ctrl.create);
router.post("/:id/dispatch", ctrl.dispatch);
router.post("/:id/complete", ctrl.complete);
router.post("/:id/cancel", ctrl.cancel);

module.exports = router;
