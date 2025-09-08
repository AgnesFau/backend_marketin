var express = require("express");
const {
  getProductByUMKMId,
  addProduct,
} = require("../controller/productcontroller");
const { authenticateToken } = require("../controller/usercontroller");
var router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @openapi
 * /products/productsbyumkm/{id}:
 *   get:
 *     summary: Get all products by umkm id
 *     tags: [Product]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the UMKM
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Daftar produk oleh UMKM berhasil diambil
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
  "/productsbyumkm/:id",
  getProductByUMKMId,
  function (req, res, next) {
    res.json(req.products);
  }
);

/**
 * @openapi
 * /products/addproducts:
 *   post:
 *     summary: Add new product for authenticated UMKM
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []   
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Nasi Goreng Spesial"
 *               price:
 *                 type: number
 *                 example: 25000
 *               description:
 *                 type: string
 *                 example: "Nasi goreng dengan topping ayam dan telur"
 *               category:
 *                 type: string
 *                 example: "Makanan"
 *               productsphoto:
 *                 type: string
 *                 format: binary
 *                 description: Foto produk yang diupload
 *     responses:
 *       201:
 *         description: Produk berhasil ditambahkan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product added successfully"
 *                 product:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "abc123"
 *                     name:
 *                       type: string
 *                       example: "Nasi Goreng Spesial"
 *                     price:
 *                       type: number
 *                       example: 25000
 *                     description:
 *                       type: string
 *                       example: "Nasi goreng dengan topping ayam dan telur"
 *                     category:
 *                       type: string
 *                       example: "Makanan"
 *                     productsphoto:
 *                       type: string
 *                       format: binary
 *                     expiredAt:
 *                       type: string
 *                       format: date-time
 */
router.post(
  "/addproducts",
  authenticateToken,
  upload.fields([{ name: "productsphoto", maxCount: 1 }]),
  addProduct
);

module.exports = router;
