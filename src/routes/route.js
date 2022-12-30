const express = require("express");
const router = express.Router()
const { authentication,authorisation } = require("../middleware/auth")

const userController = require("../controllers/userController")
const productController = require("../controllers/productController")
const cartController = require("../controllers/cartController")
const orderController = require("../controllers/orderController")

// ------------------------< USERS >-------------------------//

router.post("/register",userController.createUser);
router.post("/login", userController.userLogin);
router.get("/user/:userId/profile",authentication,userController.getUser)
router.put("/user/:userId/profile",authentication,authorisation,userController.updateuserDetails)

// ------------------------< PRODUCTS >-------------------------//
router.post("/products",productController.createProduct);
router.get("/products/:productId", productController.getProductById);
router.get("/products",productController.getProductsByFilter);
router.put("/products/:productId",productController.updateProducts)
router.delete("/products/:productId", productController.deleteProductById);


// ------------------------< Cart >---------------------------------//

router.post("/users/:userId/cart",authentication,authorisation,cartController.createCart)//authentication
router.put("/users/:userId/cart",authentication,authorisation,cartController.updateCart)
router.get("/users/:userId/cart",authentication,authorisation,cartController.getCart)
router.delete("/users/:userId/cart",authentication,authorisation,cartController.deleteCart)

// ------------------------< Order >---------------------------------//
router.post("/users/:userId/orders",authentication,authorisation,orderController.createOrder)//authentication
router.put("/users/:userId/orders",authentication,authorisation,orderController.updateOrder)


router.all("/*", function (req, res) {
    res.status(404).send({ msg: "invalid http request" })
})
module.exports = router;