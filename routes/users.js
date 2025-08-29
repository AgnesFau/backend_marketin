var express = require("express");
const {
  getUserData,
  authenticateToken,
} = require("../controller/usercontroller");
var router = express.Router();

/* GET users listing. */
/**
 * @openapi
 * /users/hello:
 *   get:
 *     description: "Returns a hello world message"
 *     responses:
 *       200:
 *         description: "A hello world message"
 */
router.get("/hello", function (req, res, next) {
  res.send("Hello World");
});

/* GET user profile */
/**
 * @openapi
 * /users/profile:
 *   get:
 *     summary: Get user profile data
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully get user data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uid:
 *                   type: string
 *                   example: "abc123uid"
 *                 email:
 *                   type: string
 *                   example: "user@example.com"
 *                 displayName:
 *                   type: string
 *                   example: "John Doe"
 *                 companyName:
 *                   type: string
 *                   example: "ACME Corp"
 *                 logoUrl:
 *                   type: string
 *                   example: "https://example.com/logo.png"
 *                 role:
 *                   type: string
 *                   example: "admin"
 *       401:
 *         description: Token invalid or not given
 *       403:
 *         description: Access denied
 *
 */
router.get("/profile", authenticateToken, getUserData, (req, res) => {
  res.json(req.user);
});

module.exports = router;
