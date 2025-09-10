const { getAllEventData } = require("../controller/eventcontroller");
var express = require("express");
const { getAllUMKMData } = require("../controller/umkmcontroller");
var router = express.Router();

/**
 * @openapi
 * /umkm/allumkm:
 *   get:
 *     summary: Get all UMKM data
 *     description: Mengambil semua data UMKM dari database.
 *     tags:
 *       - UMKM
 *     responses:
 *       200:
 *         description: Berhasil mengambil data UMKM
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "umkm123"
 *                   name:
 *                     type: string
 *                     example: "UMKM Sukses Jaya"
 *                   owner:
 *                     type: string
 *                     example: "Budi"
 *                   address:
 *                     type: string
 *                     example: "Jl. Merdeka No. 10"
 */
router.get("/allumkm", getAllUMKMData, function (req, res, next) {
  res.json(req.umkm);
});

module.exports = router;
