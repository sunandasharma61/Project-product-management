const cartModel = require("../models/cartModel");
const userModel = require("../models/userModel");
const productModel = require("../models/productModel");
const { isEmpty, isNumber, isValidObjectId } = require("../validator/validator");

//==================================create cart=============================//

const createCart = async function (req, res) {
    try {
        const userId = req.params.userId;
        const data = req.body;
        let quantity = data.quantity;
        const { productId, cartId } = data;

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "Put the productId you want to add to Cart" })
        }
        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "product id not valid id" })
        }

        if (!isNumber(quantity)) { quantity = 1 }
        const productDetails = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!productDetails) return res.status(404).send({ status: false, message: "No product Found" })

        let findCartId = await cartModel.findOne({ userId: userId });

        let newCart = false
        if (!cartId) {
            let theCarts = await cartModel.findOne({ userId: userId });
            if (theCarts) { return res.status(409).send({ status: false, message: `Cart is Already exists, put ${theCarts._id} this cartId in the body` }) };
            let cartCreate = {
                userId: userId,
                items: [],
                totalPrice: 0,
                totalItems: 0
            }
            var cartDetails = await cartModel.create(cartCreate)
            newCart = true
        }
        else {
            if (!isValidObjectId(cartId)) { return res.status(400).send({ status: false, message: "cart id not valid id" }) };
            var cartDetails = await cartModel.findOne({ _id: cartId })
            if (!cartDetails) { return res.status(404).send({ status: false, message: `Cart does not found, try with right cartId` }) };
            if (cartDetails.userId != userId) { return res.status(400).send({ status: false, message: `You are not owner of this Cart, please try with your  cartId` }) };
        }
        for (var i = 0; i < cartDetails.items.length; i++) {
            if (cartDetails.items[i].productId == productId) {
                cartDetails.items[i].quantity = cartDetails.items[i].quantity + quantity
                break;
            }
        }
        if (cartDetails.items.length == (i || 0)) {
            cartDetails.items.push({ productId: productId, quantity: quantity })
        }
        cartDetails.totalPrice = cartDetails.totalPrice + (productDetails.price * quantity)
        cartDetails.totalItems = cartDetails.items.length

        let cartData = await cartModel.findOneAndUpdate({ userId: userId }, { ...cartDetails }, { new: true }).select({ __v: 0 })
        if (newCart) {
            return res.status(201).send({ status: true, message: "Success", data: cartData })
        } else {
            return res.status(200).send({ status: true, message: "Success", data: cartData })

        }

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}
//============================< UPDATE CART >==============================//

const updateCart = async function (req, res) {
    try {
        let data = req.body
        let userId = req.params.userId

        if (!userId)
            return res.status(400).send({ status: false, message: "Please Provide userId in the path Params" })

        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, msg: "userId is not valid" })

        let checkUser = await userModel.findById(userId)
        if (!checkUser)
            return res.status(404).send({ status: false, msg: "user is not found" })

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "Body cannot be empty" });
        }

        let { productId, cartId, removeProduct } = data

        if (!cartId)
            return res.status(400).send({ status: false, msg: "plz provide cartId" })

        if (!isValidObjectId(cartId))
            return res.status(400).send({ status: false, message: " enter a valid cartId " })

        let findCart = await cartModel.findOne({ _id: cartId })

        if (!findCart)
            return res.status(404).send({ status: false, message: " cart not found" })
        if (!findCart.isDeleted == true) {
            return res.status(400).send({ status: false, msg: "cart was deleted" })
        }

        

        if (!productId)
            return res.status(400).send({ status: false, msg: "plz provide productId" })

        if (!isValidObjectId(productId))
            return res.status(400).send({ status: false, message: " enter a valid productId " });

        let findProduct = await productModel.findOne({ _id: productId, isDeleted: false })

        if (typeof removeProduct != "number")
            return res.status(400).send({ status: false, message: " removeProduct Value Should be Number " })

        if ((removeProduct !== 0 && removeProduct !== 1)) {
            return res.status(400).send({ status: false, message: "removeProduct value should be 0 or 1 only " })
        }

        let productPrice = findProduct.price
        let item = findCart.items

        if (item.length == 0)
            return res.status(404).send({ status: false, message: "cart is empty" })

        let productIndex = item.findIndex(loopVariable => loopVariable.productId.toString() == productId)

        if (productIndex > -1) {

            if (removeProduct == 1) {
                item[productIndex].quantity--
                findCart.totalPrice -= productPrice;

            } else if (removeProduct == 0) {
                let changePrice = item[productIndex].quantity * productPrice
                findCart.totalPrice -= changePrice
                item[productIndex].quantity = 0
            }
            if (item[productIndex].quantity == 0) {
                item.splice(productIndex, 1)
            }
        }
        if (productIndex == -1) {

            return res.status(404).send({ status: false, message: "productId not found in cart" })
        }

        findCart.totalItems = item.length
        await findCart.save()
        let find = await cartModel.findOne({ userId: userId })

        return res.status(200).send({ status: true, message: "Success", data: find })
    }

    catch (error) {

        res.status(500).send({ status: false, message: error.message })
    }
}
//==================< GETCART DATA >==========================//
const getCart = async function (req, res) {
    try {
        let userId = req.params.userId;

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "invalid userID" });
        }
        let checkUserId = await userModel.findOne({
            _id: userId
        });
        if (!checkUserId) {
            return res.status(404).send({ status: false, message: "user not found" });
        }
        let fetchData = await cartModel
            .findOne({
                userId: userId
            })
            .populate({
                path: "items",
                populate: {
                    path: "productId",
                    model: "products",
                    select: ["title", "price", "productImage"],
                }
            }).select("-items._id");

        if (!fetchData) {
            return res.status(404).send({ status: false, message: "cart not found" });
        }
        if (fetchData.items.length == 0) {
            return res.status(200).send({
                status: true,
                message: "Success",
                data: fetchData,
            });
        }
        return res
            .status(200)
            .send({ status: true, message: "Success", data: fetchData });
    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message });
    }
};

//==================< DELETE CART >==========================//

const deleteCart = async (req, res) => {
    try {
        let userId = req.params.userId

        if (!isEmpty(userId)) {
            return res.status(400).send({ status: false, message: "UserId is missing in params" })
        }

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "Invalid userId" });
        }

        let findUser = await userModel.findById({ _id: userId })
        if (!findUser) {
            return res.status(404).send({ status: false, message: "User not found" })
        }

        let items = [];
        let totalPrice = 0
        let totalItems = 0
        const cartGet = await cartModel.findOneAndUpdate({ userId: userId }, { items: items, totalPrice: totalPrice, totalItems: totalItems }, { new: true });
        return res.status(204).send({ status: +true, message: 'Successfully deleted', data: cartGet });
    }

    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}


module.exports = { createCart, getCart, deleteCart, updateCart }