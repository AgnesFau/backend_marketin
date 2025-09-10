var express = require("express");
const {
  getProductByUMKMId,
  addProduct,
  addMidnightSale,
  deleteMidnightSale,
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
 *               expiryDate :
 *                 type: string
 *                 format: date
 *                 description: Tanggal kedaluwarsa produk
 *                 example: "2023-12-31"
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
 *                     expiryDate:
 *                       type: string
 *                       format: date
 */
router.post(
  "/addproducts",
  authenticateToken,
  upload.fields([{ name: "productsphoto", maxCount: 1 }]),
  addProduct
);

/**
 * @swagger
 * /products/{id}/products:
 *   get:
 *     summary: Get products by UMKM ID (with optional fuzzy search)
 *     description: |
 *       Mengambil semua produk berdasarkan **UMKM ID**.
 *       Bisa ditambahkan query `q` untuk melakukan pencarian produk dengan **Levenshtein Distance** (typo-tolerant search).
 *     tags:
 *       - Product
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UMKM ID
 *       - in: query
 *         name: q
 *         required: false
 *         schema:
 *           type: string
 *         description: Kata kunci pencarian produk (contoh typo-tolerant search, misalnya `aple` untuk "Apple")
 *     responses:
 *       200:
 *         description: Daftar produk milik UMKM
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "abc123"
 *                       name:
 *                         type: string
 *                         example: "Apple"
 *                       price:
 *                         type: number
 *                         example: 10000
 *                       description:
 *                         type: string
 *                         example: "Fresh apple"
 *                       expiryDate:
 *                         type: string
 *                         example: "2025-12-31"
 *                       productPhoto:
 *                         type: string
 *                         example: "https://storage.supabase.co/products/apple.jpg"
 */
router.get("/:id/products", getProductByUMKMId, (req, res) => {
  res.json(req.products || []);
});

/**
 * @openapi
 * /products/{productId}/sale:
 *   put:
 *     summary: Add or update sale price for a product
 *     description: Update field `salePrice` pada produk tertentu milik UMKM.
 *     tags:
 *       - Product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID produk
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - salePrice
 *             properties:
 *               salePrice:
 *                 type: number
 *                 example: 8000
 *     responses:
 *       200:
 *         description: Sale price added to product successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Sale price added to product successfully"
 *                 productId:
 *                   type: string
 *                   example: "abc123"
 *                 salePrice:
 *                   type: number
 *                   example: 8000
 */
router.put("/:productId/sale", authenticateToken, addMidnightSale);

/**
 * @openapi
 * /products/{productId}/sale:
 *   delete:
 *     summary: Remove sale price from a product
 *     description: Hapus field `salePrice` dari produk tertentu milik UMKM.
 *     tags:
 *       - Product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID produk
 *     responses:
 *       200:
 *         description: Sale price removed from product successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Sale price removed from product successfully"
 *                 productId:
 *                   type: string
 *                   example: "abc123"
 */
router.delete("/:productId/sale", authenticateToken, deleteMidnightSale);

module.exports = router;
