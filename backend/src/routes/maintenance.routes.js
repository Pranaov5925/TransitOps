const { Router } = require("express");
const ctrl = require("../controllers/maintenance.controller");
const router = Router();

router.get("/", ctrl.getAll);
router.post("/", ctrl.create);
router.post("/:id/close", ctrl.close);

module.exports = router;
