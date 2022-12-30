const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    fname: {
        type: String,
        trim: true,
        required: true
    },
    lname: {
        type: String,
        trim: true,
        required: true
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        required: true
    },
    profileImage: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minLen: 8,
        maxLen: 15,
        trim: true
    },
    address: {
        shipping: {
            street: {
                type: String,
                required: true,
                trim: true
            },
            city: {
                type: String,
                required: true,
                trim: true
            },
            pincode: {
                type: Number,
                required: true,
                trim: true
            }
        },

        billing: {
            street: {
                type: String,
                required: true,
                trim: true
            },
            city: {
                type: String,
                required: true,
                trim: true
            },
            pincode: {
                type: Number,
                required: true,
                trim: true
            }
        },
    },
    __v: { 
        type: Number,
         select: false
        }
    

}, { timestamps: true })



module.exports = mongoose.model('User', userSchema)
