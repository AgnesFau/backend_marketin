var express = require("express");
const { authenticateToken } = require("../controller/usercontroller");
const {
  getEventDataByEO,
  getEventDataById,
  getAllEventData,
  addNewEvent,
  updateEvent,
  cancelEvent,
} = require("../controller/eventcontroller");
var router = express.Router();
const multer = require("multer");
const {
  addProposal,
  getAllProposalByEO,
  updateProposalStatus,
} = require("../controller/proposalcontroller");
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

/**
 * @openapi
 * /events/editevent/{id}:
 *   put:
 *     summary: Update existing event
 *     description: Update event details, including optional poster and mapping files.
 *     tags:
 *       - Events
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the event to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Music Festival 2025"
 *               address:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 example: '{"VIP": 600000, "Regular": 300000}'
 *               date:
 *                 type: string
 *                 format: date-time
 *               contact_person:
 *                 type: string
 *               close_registration:
 *                 type: string
 *                 format: date-time
 *               poster:
 *                 type: string
 *                 format: binary
 *               mapping:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Event successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 address:
 *                   type: string
 *                 description:
 *                   type: string
 *                 category:
 *                   type: object
 *                 date:
 *                   type: string
 *                 contact_person:
 *                   type: string
 *                 close_registration:
 *                   type: string
 *                 poster:
 *                   type: string
 *                 mapping:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 */
router.put(
  "/editevent/:id",
  authenticateToken,
  upload.fields([
    { name: "poster", maxCount: 1 },
    { name: "mapping", maxCount: 1 },
  ]),
  updateEvent
);

/**
 * @openapi
 * /events/cancelevent/{id}:
 *   put:
 *     summary: Cancel event
 *     description: Mark an existing event as cancelled (status updated to "cancelled").
 *     tags:
 *       - Events
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the event to cancel
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event successfully cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                   example: "cancelled"
 *                 cancelledAt:
 *                   type: string
 *                   format: date-time
 */
router.put("/cancelevent/:id", authenticateToken, cancelEvent);

/**
 * @openapi
 * /events/addproposal:
 *   post:
 *     summary: Add proposal for an event
 *     description: Upload proposal with event ID and struk file. Requires Bearer Token.
 *     tags:
 *       - Proposal
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               eventId:
 *                 type: string
 *                 description: ID of the event
 *               struk:
 *                 type: string
 *                 format: binary
 *                 description: Receipt file (struk)
 *     responses:
 *       201:
 *         description: Proposal added successfully
 */
router.post(
  "/addproposal",
  authenticateToken,
  upload.fields([{ name: "struk", maxCount: 1 }]),
  addProposal
);

/**
 * @swagger
 * /events/getallproposal:
 *   get:
 *     summary: Get all proposals
 *     description: Retrieve all proposals with UMKM and event details
 *     tags: [Proposal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Proposal retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Proposal ID
 *                   example: "proposal123"
 *                 event_id:
 *                   type: string
 *                   description: Event ID
 *                   example: "event456"
 *                 umkm_id:
 *                   type: string
 *                   description: UMKM ID
 *                   example: "umkm789"
 *                 status:
 *                   type: string
 *                   description: Proposal status
 *                   enum: [pending, approved, rejected]
 *                   example: "pending"
 *                 proposal_date:
 *                   type: string
 *                   format: date-time
 *                   description: Proposal submission date
 *                   example: "2024-01-15T10:30:00Z"
 *                 description:
 *                   type: string
 *                   description: Proposal description
 *                   example: "Proposal untuk ikut serta dalam pameran UMKM"
 *                 umkm:
 *                   type: object
 *                   description: UMKM details
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "umkm789"
 *                     name:
 *                       type: string
 *                       example: "Toko Bakso Malang"
 *                     email:
 *                       type: string
 *                       example: "bakso@example.com"
 *                     phone:
 *                       type: string
 *                       example: "+6281234567890"
 *                     address:
 *                       type: string
 *                       example: "Jl. Malang Raya No. 123"
 *                 event:
 *                   type: object
 *                   description: Event details
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "event456"
 *                     title:
 *                       type: string
 *                       example: "Pameran UMKM Jakarta 2024"
 *                     description:
 *                       type: string
 *                       example: "Pameran untuk promosi produk UMKM"
 *                     start_date:
 *                       type: string
 *                       format: date
 *                       example: "2024-03-15"
 *                     end_date:
 *                       type: string
 *                       format: date
 *                       example: "2024-03-17"
 *                     location:
 *                       type: string
 *                       example: "JCC Senayan"
 *                     eo_id:
 *                       type: string
 *                       example: "eo123"
 */
router.get(
  "/getallproposal",
  authenticateToken,
  getAllProposalByEO,
  (req, res) => {
    res.json(req.proposals);
  }
);

/**
 * @openapi
 * /events/accoptorreject/{id}:
 *   put:
 *     summary: Update proposal status (accept/reject)
 *     description: EO dapat mengubah status proposal dari `pending` menjadi `accepted` atau `rejected` dengan memberikan alasan.
 *     tags:
 *       - Proposal
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID dari event
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, rejected]
 *                 description: Status baru proposal
 *               description:
 *                 type: string
 *                 description: Alasan menerima atau menolak proposal
 *             example:
 *               status: accepted
 *               description: "Proposal sesuai dengan kriteria event"
 *     responses:
 *       200:
 *         description: Proposal status berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Proposal ID
 *                 status:
 *                   type: string
 *                 description:
 *                   type: string
 *                   nullable: true
 */
router.put("/accoptorreject/:id", authenticateToken, updateProposalStatus);

module.exports = router;
