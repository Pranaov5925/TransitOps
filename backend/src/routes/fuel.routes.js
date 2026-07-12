const { Router } = require("express");
const ctrl = require("../controllers/fuel.controller");
const router = Router();

router.get("/", ctrl.getAll);
router.post("/", ctrl.create);

module.exports = router;
