const { Router } = require("express");
const ctrl = require("../controllers/vehicle.controller");
const router = Router();

router.get("/", ctrl.getAll);
router.post("/", ctrl.create);
router.patch("/:id", ctrl.update);
router.put("/:id", ctrl.update);
router.post("/:id/recharge", ctrl.recharge);
router.delete("/:id", ctrl.remove);

module.exports = router;
