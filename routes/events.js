var express = require("express");
const { authenticateToken } = require("../controller/usercontroller");
const { getEventDataByEO, getEventDataById, getAllEventData, addNewEvent } = require("../controller/eventcontroller");
var router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @openapi
 * /events/allevent:
 *   get:
 *     summary: Ambil semua event
 *     tags: [Event]
 *     responses:
 *       200:
 *         description: Berhasil mengambil semua data event
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "12345"
 *                   name:
 *                     type: string
 *                     example: "Music Festival"
 *                   date:
 *                     type: string
 *                     format: date
 *                     example: "2025-09-15"
 */
router.get("/allevent", getAllEventData, function (req, res, next) {
  res.json(req.events);
});

/**
 * @openapi
 * /events/eventbyid/{id}:
 *   get:
 *     summary: Ambil event berdasarkan ID
 *     tags: [Event]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID dari event
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detail event ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "12345"
 *                 name:
 *                   type: string
 *                   example: "Music Festival"
 *                 date:
 *                   type: string
 *                   format: date
 *                   example: "2025-09-15"
 *       404:
 *         description: Event tidak ditemukan
 */
router.get("/eventbyid/:id", getEventDataById, function (req, res, next) {
  res.json(req.event);
});

/**
 * @openapi
 * /events/eventbyeo/{id}:
 *   get:
 *     summary: Ambil semua event berdasarkan Event Organizer (EO)
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []   # karena pakai authenticateToken (JWT)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID Event Organizer
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Daftar event oleh EO berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "67890"
 *                   name:
 *                     type: string
 *                     example: "Startup Conference"
 *                   eoId:
 *                     type: string
 *                     example: "EO123"
 *       401:
 *         description: Unauthorized, token tidak valid
 */
router.get("/eventbyeo/:id", authenticateToken, getEventDataByEO, function (req, res, next) {
  res.json(req.events);
});

/**
 * @openapi
 * /events/addevent:
 *   post:
 *     summary: Add a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - description
 *               - category
 *               - price
 *               - date
 *               - poster
 *               - contact_person
 *               - close_registration
 *             properties:
 *               name:
 *                 type: string
 *                 example: Music Festival 2025
 *               address:
 *                 type: string
 *                 example: Jakarta Convention Center
 *               description:
 *                 type: string
 *                 example: Annual international music festival
 *               mapping:
 *                 type: string
 *                 format: binary
 *                 description: Optional event mapping file (PDF/Image/etc.)
 *               category:
 *                 type: string
 *                 example: Concert
 *               price:
 *                 type: number
 *                 example: 50000
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2025-12-31
 *               poster:
 *                 type: string
 *                 format: binary
 *                 description: Event poster image
 *               contact_person:
 *                 type: string
 *                 example: +628123456789
 *               close_registration:
 *                 type: string
 *                 format: date
 *                 example: 2025-12-25
 *     responses:
 *       201:
 *         description: Event created successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to add new event
 */
router.post(
  "/addevent",
  authenticateToken,
  upload.fields([
    { name: "poster", maxCount: 1 },
    { name: "mapping", maxCount: 1 },
  ]),
  addNewEvent
);
router.post("/add", authenticateToken, addNewEvent);


module.exports = router;