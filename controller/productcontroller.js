const { db, admin } = require("../database/firebase");
const supabase = require("../database/supabase");

async function getProductByUMKMId(req, res, next) {
  try {
    const umkmId = req.params.id;

    const userDoc = await db
      .collection("users")
      .where("uid", "==", umkmId)
      .get();
    if (userDoc.empty) {
      return res.status(404).json({ error: "UMKM not found" });
    }

    console.log("User Data:", userDoc.docs[0].data());
    const userData = userDoc.docs[0].data();
    console.log("Product IDs:", userData.list_product);

    const productIds = (userData.list_product || []).filter(
      (id) => typeof id === "string" && id.trim() !== ""
    );

    if (productIds.length === 0) {
      return res.status(404).json({ error: "No products found for this UMKM" });
    }

    const productPromises = productIds.map(async (productId) => {
      const productDoc = await db.collection("products").doc(productId).get();
      if (productDoc.exists) {
        return {
          id: productDoc.id,
          ...productDoc.data(),
        };
      }
      return null;
    });

    const products = (await Promise.all(productPromises)).filter(Boolean);

    req.products = products;
    next();
  } catch (error) {
    console.error("Error fetching products by UMKM:", error);
    res.status(500).json({ error: "Failed to fetch products by UMKM" });
  }
}

async function addProduct(req, res, next) {
  try {
    const umkmId = req.user.uid;
    const { name, price, description, expiryDate } = req.body;

    if (!umkmId) {
      return res.status(400).json({ error: "UMKM ID is required" });
    }

    const userDoc = await db
      .collection("users")
      .where("uid", "==", umkmId)
      .get();
    if (userDoc.empty) {
      return res.status(404).json({ error: "UMKM not found" });
    }

    const userRef = userDoc.docs[0].ref;

    const productData = {
      name,
      price,
      description,
      createdAt: new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
    };

    let productPhoto = null;
    if (req.files && req.files.productsphoto) {
      const productsphoto = req.files.productsphoto[0];
      const { data, error: uploadError } = await supabase.storage
        .from("products")
        .upload(
          `photoproduct/${productsphoto.originalname}`,
          productsphoto.buffer,
          {
            contentType: productsphoto.mimetype,
            upsert: true,
          }
        );

      if (uploadError) throw uploadError;

      productPhoto = supabase.storage.from("products").getPublicUrl(data.path)
        .data.publicUrl;
    }

    const productRef = await db.collection("products").add({
      ...productData,
      productPhoto,
    });

    await userRef.update({
      list_product: admin.firestore.FieldValue.arrayUnion(productRef.id),
    });

    res.status(201).json({
      message: "Product added successfully",
      product: { id: productRef.id, ...productData },
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ error: "Failed to add product" });
  }
}

module.exports = { getProductByUMKMId, addProduct };
