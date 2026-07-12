const { Router } = require("express");
const ctrl = require("../controllers/vehicle.controller");
const router = Router();

router.get("/", ctrl.getAll);
router.post("/", ctrl.create);
router.patch("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

module.exports = router;
