var express = require("express");
const { authenticateToken } = require("../controller/usercontroller");
const {
  getEventDataByEO,
  getEventDataById,
  getAllEventData,
  addNewEvent,
} = require("../controller/eventcontroller");
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
 *       - bearerAuth: []
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
router.get(
  "/eventbyeo/:id",
  authenticateToken,
  getEventDataByEO,
  function (req, res, next) {
    res.json(req.events);
  }
);

/**
 * @openapi
 * /events/addnewevent:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Music Concert"
 *               address:
 *                 type: string
 *                 example: "Jakarta Convention Center"
 *               description:
 *                 type: string
 *                 example: "Konser musik terbesar tahun ini."
 *               category:
 *                 type: object
 *                 additionalProperties:
 *                   type: object
 *                   properties:
 *                     position:
 *                       type: string
 *                       example: "Cat 1"
 *                     price:
 *                       type: number
 *                       example: 500000
 *                 example:
 *                   cat1:
 *                     position: "Cat 1"
 *                     price: 500000
 *                   cat2:
 *                     position: "Cat 2"
 *                     price: 350000
 *                   cat3:
 *                     position: "Cat 3"
 *                     price: 200000
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-09-10T19:00:00Z"
 *               contact_person:
 *                 type: string
 *                 example: "08123456789"
 *               close_registration:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-09-09T23:59:59Z"
 *               poster:
 *                 type: string
 *                 format: binary
 *               mapping:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "abc123"
 *                 name:
 *                   type: string
 *                   example: "Music Concert"
 *                 address:
 *                   type: string
 *                   example: "Jakarta Convention Center"
 *                 description:
 *                   type: string
 *                   example: "Konser musik terbesar tahun ini."
 *                 mapping:
 *                   type: string
 *                   example: "https://storage.supabase.co/events/mappings/xxx.png"
 *                 category:
 *                   type: object
 *                 poster:
 *                   type: string
 *                   example: "https://storage.supabase.co/events/posters/xxx.png"
 *                 contact_person:
 *                   type: string
 *                   example: "08123456789"
 *                 close_registration:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-09-09T23:59:59Z"
 *                 eo_id:
 *                   type: string
 *                   example: "user123"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 */
router.post(
  "/addnewevent",
  authenticateToken,
  upload.fields([
    { name: "poster", maxCount: 1 },
    { name: "mapping", maxCount: 1 },
  ]),
  addNewEvent
);

module.exports = router;
