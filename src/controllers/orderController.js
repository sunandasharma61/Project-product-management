
const orderModel = require("../models/orderModel")
const cartModel = require("../models/cartModel")
const userModel = require("../models/userModel")
const validation = require("../validator/validator");

const { isEmpty, isValidObjectId,isValidStatus } = validation;

//=====================================> CREATE ORDER <=======================================//

const createOrder = async function (req, res){
    try {

        let userId = req.params.userId


        if(!isValidObjectId(userId)){
            return res.status(400).send({ status : false, message : "UserId is not valid"})
        }

        let findUser = await userModel.findOne({ _id:userId})
        if(!findUser){
            return res.status(400).send({ status : false, message : "This user is not found"})
        }

        let data = req.body

        if (Object.keys(data).length == 0){
            return res.status(400).send({ status: false, message: "Body cannot be empty" });
        }

        let {cartId} = data

        if(!isEmpty(cartId)){
            return res.status(400).send({ status : false, message : "cartId is mandatory"})
        }

        if(!isValidObjectId(cartId)){
            return res.status(400).send({ status : false, message : "CartId is not valid"})
        }

        let findCart = await cartModel.findOne({_id:cartId })
        if (!findCart) {
            return res.status(400).send({ status: false, message: "This cartId doesn't exist" })
        }

        const cartCheck = findCart.items.length
        if (cartCheck == 0) {
            return res.status(400).send({ message: "The cart is empty please add product to proceed your order" })
        }

        let { items, totalPrice, totalItems } = findCart

        let totalQuantity = 0
        let totalItem = items.length
        for (let i = 0; i < totalItem; i++) {
            totalQuantity = totalQuantity + Number(items[i].quantity)
        };

        let myOrder = { userId, items, totalPrice, totalItems, totalQuantity }

        let order = await orderModel.create(myOrder)
        await cartModel.findOneAndUpdate({ _id: cartId, userId:userId }, { items: [], totalItems: 0, totalPrice: 0 })

        return res.status(201).send({ status: true, message: 'Success', data: order });
    }
    catch (error) {
        res.status(500).send({ status : false, message : error.message})
    }
}

//---------------------------------update order-----------------------------------//

const updateOrder = async (req, res) => {

    try {

        let userId = req.params.userId
        let data = req.body

        let { orderId, status } = data

        if (!orderId) return res.status(400).send({ status: false, message: "Please enter OrderId ." })
        if (!isValidObjectId(orderId)) return res.status(400).send({ status: false, message: `This OrderId: ${orderId} is not valid!.` })


        if (!isValidStatus(status)) {
            return res.status(400).send({ status: false, message: "Please enter existing status(i.e 'pending', 'completed', 'cancled' )." })
        }

        let checkStatus = await orderModel.findOne({ _id: orderId, userId: userId })
        if (!checkStatus) { return res.status(404).send({ status: false, message: "Order doesn't exist with your UserID." }) }

    
        
        if (checkStatus.status == 'cancelled') { return res.status(400).send({ status: true, message: "Your Order already cancelled." }) }

       
        if (checkStatus.cancellable == false && status == 'cancelled') { return res.status(200).send({ status: true, message: "Your Order can't be cancel!" }) }

        
        let cartDetails = await cartModel.findOne({ userId: userId })
        if (!cartDetails) { return res.status(404).send({ status: false, message: "Cart doesn't exist!" }) }

        let orderUpdate = await orderModel.findByIdAndUpdate({ _id: orderId, userId: userId }, { status: status }, { new: true })

    
        return res.status(200).send({ status: true, message: "Success", data: orderUpdate })

    } catch (error) {

        return res.status(500).send({ status: false, error: error.message })
    }
}

module.exports = {createOrder,updateOrder};