const userModel = require('../models/userModel')
const bcrypt = require("bcrypt")
const { uploadFile } = require("../aws/awsConfig");
const { isEmpty, isValidName, isValidEmail, isValidPhone, isValidStreet, isValidPincode, isValidCity, isValidObjectId } = require("../validator/validator");
const jwt = require("jsonwebtoken");

const createUser = async function (req, res) {
  try {
    let data = req.body;
    console.log(data)
    let files = req.files;
    console.log(files)
    if (Object.keys(data).length == 0 && (!files || files.length == 0)) {
      return res.status(400).send({ status: "false", message: "All fields are mandatory" });
    }
    let { fname, lname, email, phone, password, address, profileImage } = data;
    if (!isEmpty(fname)) {
      return res.status(400).send({ status: "false", message: "fname must be present" });
    }
    if (!isEmpty(lname)) {
      return res.status(400).send({ status: "false", message: "lname must be present" });
    }
    if (!isEmpty(email)) {
      return res.status(400).send({ status: "false", message: "email must be present" });
    }
    if (!isEmpty(phone)) {
      return res.status(400).send({ status: "false", message: "phone number must be present" });
    }
    if (!isEmpty(password)) {
      return res.status(400).send({ status: "false", message: "password must be present" });
    }
    if (!isEmpty(address)) {
      return res.status(400).send({ status: "false", message: "Address must be present" });
    }

    if (!isValidName(lname)) {
      return res.status(400).send({ status: "false", message: "last name must be in alphabetical order" });
    }
    if (!isValidPhone(phone)) {
      return res.status(400).send({ status: "false", message: "Provide a valid phone number" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).send({ status: "false", message: "Provide a valid email" });
    }
    if (password.length < 8 || password.length > 15) {
      return res.status(400).send({ status: false, message: "Length of password is between 8 to 15 charcters" })
    }
    if (!isValidName(fname)) {
      return res.status(400).send({ status: "false", message: "first name must be in alphabetical order" });
    }

    // ------- Address Validation  --------
    if (address) {
      data.address = JSON.parse(data.address);
      const { shipping, billing } = req.body.address;
      if (!isEmpty(shipping)) {
        return res.status(400).send({ status: "false", message: "Shipping address must be present" });
      }
      if (shipping) {
        if (!isEmpty(shipping.street)) {
          return res.status(400).send({ status: "false", message: "Street must be present" });
        }
        if (!isEmpty(shipping.city)) {
          return res.status(400).send({ status: "false", message: "City must be present" });
        }
        if (!isEmpty(shipping.pincode)) {
          return res.status(400).send({ status: "false", message: "Pincode must be present" });
        }
        if (!isValidStreet(shipping.street)) {
          return res.status(400).send({ status: "false", message: "Street should include no. & alphabets only" });
        }
        if (!isValidName(shipping.city)) {
          return res.status(400).send({ status: "false", message: "City should include alphabets only" });
        }
        if (!isValidPincode(shipping.pincode)) {
          return res.status(400).send({ status: "false", message: "Pincode should be in digits and should be only upto 6 digits" });
        }
      }
      if (!isEmpty(billing)) {
        return res.status(400).send({ status: "false", message: "billing  address must be present" });
      }
      if (billing) {
        if (!isEmpty(billing.street)) {
          return res.status(400).send({ status: "false", message: "Street must be present" });
        }
        if (!isEmpty(billing.city)) {
          return res.status(400).send({ status: "false", message: "City must be present" });
        }
        if (!isEmpty(billing.pincode)) {
          return res.status(400).send({ status: "false", message: "Pincode must be present" });
        }
        if (!isValidStreet(billing.street)) {
          return res.status(400).send({ status: "false", message: "Street should include no. and alphabets only" });
        }
        if (!isValidName(billing.city)) {
          return res.status(400).send({ status: "false", message: "City should be in alphabetical order" });
        }
        if (!isValidPincode(billing.pincode)) {
          return res.status(400).send({ status: "false", message: "Pincode should be in digits and should be only upto 6 digits" });
        }
      }
    }
    const saltRounds = await bcrypt.genSalt(10);

    const hash = await bcrypt.hash(password, saltRounds);
    data.password = hash;

    let checkEmail = await userModel.findOne({ email });
    if (checkEmail) {
      return res.status(400).send({ status: "false", message: "Email is already in use" });
    }
    let checkPhone = await userModel.findOne({ phone });
    if (checkPhone) {
      return res.status(400).send({ status: "false", message: "Phone number is already in use" });
    }

    if (files.fieldname == 'profileImage') {
      return res.status(400).send({ status: false, message: "file name should be profile image" })
    }
    if (files.length == 1) {
      let profileImgUrl = await uploadFile(files[0])
      data.profileImage = profileImgUrl
    }

    let savedUser = await userModel.create(data);
    return res.status(201).send({
      status: true, message: "user has been created successfully", data: savedUser
    });
  } catch (error) {
    return res.status(500).send({ status: "false", msg: error.message });
  }
};
//=============user login====================//
const userLogin = async function (req, res) {
  try {
    let data = req.body

    let { email, password } = data

    if (Object.keys(data).length == 0) {
      return res.status(400).send({ status: false, message: "Please provide email and password" });
    }

    if (!email) {
      return res.status(400).send({ status: false, message: "Email must be present" });
    }

    if (!password) {
      return res.status(400).send({ status: false, message: "Password must be present" });
    }

    let checkEmail = await userModel.findOne({ email: email });
    if (!checkEmail) {
      return res.status(400).send({ status: false, message: "Please provide a correct Email" });
    }

    let checkPassword = await bcrypt.compare(password, checkEmail.password);
    if (!checkPassword) {
      return res.status(400).send({ status: false, message: "Please provide a correct password" });
    }

    const userData = await userModel.findOne({ email: email })
    if (!userData) { return res.status(400).send({ status: false, message: "Invalid Login Credentials! You need to register first." }) }

    let token = jwt.sign({
      userId: checkEmail._id.toString(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, //expires in 24 hr
    }, "group3Project5");
    res.setHeader("authorization", "bearerToken", token);
    return res.status(200).send({ status: true, message: "User Login Successful", data: { userId: checkEmail._id, token: token }, });
  }
  catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};
//==============Get User================//
const getUser = async function (req, res) {
  try {
    let userId = req.params.userId;

    if (!isValidObjectId(userId)) {
      return res.status(400).send({ status: false, msg: "Invalid userId" });
    }

    let checkData = await userModel.findOne({ _id: userId });
    if (!checkData) {
      return res.status(404).send({ status: false, message: "userId not exist" });
    }


    return res.status(200).send({
      status: true, message: "Users Profile Details", data: checkData
    });
  } catch (err) {
    return res.status(500).send({ status: false, msg: err.message });
  }
};

// ====================updateUser==========================//
const updateuserDetails = async function (req, res) {
  try {
    //--------------------------userId check---------------------//
    let userId = req.params.userId

    if (!userId || userId == "") {
      return res.status(400).send({ status: false, msg: "please enter userId" })
    }
    if (!isValidObjectId(userId)) {
      return res.status(400).send({ status: false, msg: "invalid  userId" })
    }
    let userIdDetail = await userModel.findById(userId)
    if (!userIdDetail) {
      return res.status(404).send({ status: false, msg: " userId doesn't exist" })
    }

    //--------------------------check body---------------------//
    let bodyData = req.body
    let files = req.files
    if (Object.keys(bodyData).length == 0 && (!files || files.length == 0)) {
      return res.status(400).send({ status: false, message: "pls provided body" })
    }



    //--------------------------destructure---------------------//
    let { fname, lname, email, phone, password, address, profileImage } = bodyData
    let updateData = {};

    //--------------------------fname check---------------------//
    if (fname) {
      if (!isEmpty(fname)) {
        return res.status(400).send({ status: false, message: "invalid fname" });
      }
      if (!isValidName(fname)) {
        return res.status(400).send({ status: false, message: "invalid fname" })
      }
      updateData["fname"] = fname;
    }

    //--------------------------lname check---------------------//
    if (lname) {
      if (!isEmpty(lname)) {
        return res.status(400).send({ status: false, message: "Invalid lname" });
      }
      if (!isValidName(lname)) {
        return res.status(400).send({ status: false, message: "invalid fname" })
      }
      updateData["lname"] = lname;
    }

    // ---------------------------profileimage---------------------------//
    if (files.fieldname == 'profileImage') {
      return res.status(400).send({ status: false, message: "file name should be profile image" })
    }
    if (files.length == 1) {
      let profileImgUrl = await uploadFile(files[0])
      bodyData.profileImage = profileImgUrl
      updateData["profileImage"] = profileImgUrl;
    }

    //--------------------------email check---------------------//
    if (email) {
      if (!isValidEmail(email)) {
        return res.status(400).send({ status: false, message: "Please enter valid a email " });
      }
      let duplicateEmail = await userModel.findOne({ email });
      if (duplicateEmail) {
        return res.status(400).send({ status: false, msg: "Email already exist" });
      }
      updateData["email"] = email;
    }

    //--------------------------password check---------------------//
    if (password) {
      if (!(password.length >= 8 && password.length <= 15)) {
        return res.status(400).send({ status: false, msg: "Password should be minimum 8 characters and maximum 15 characters", });
      }
      const saltRounds = await bcrypt.genSalt(10);
      console.log(saltRounds)
      const hash = await bcrypt.hash(password, saltRounds);
      bodyData.password = hash;
      updateData["password"] = hash;
    }
    //--------------------------phone check---------------------//
    if (phone) {
      if (!isValidPhone(phone)) {
        return res.status(400).send({ status: false, message: "Please enter a valid phone number" });
      }
      let duplicatePhone = await userModel.findOne({ phone });
      if (duplicatePhone) {
        return res.status(400).send({ status: false, msg: "Phone number already exist" });
      }
      updateData["phone"] = phone;
    }

    //-------------------------------------------address check----------------------------------------//
    if (address) {
      address = JSON.parse(address)

      //----------------------check shipping street-------------//
      if (address.shipping) {
        if (address.shipping.street) {
          if (!isEmpty(address.shipping.street)) {
            return res.status(400).send({ status: false, message: "street is not valid in shipping address" })
          }

        }
        updateData['address.shipping.street'] = address.shipping.street
      }
      //----------------------check shipping city-------------//
      if (address.shipping.city) {
        if (!isValidName(address.shipping.city)) {
          return res.status(400).send({ statsu: false, message: 'city is not valid in shipping address.' })
        }
        updateData['address.shipping.city'] = address.shipping.city
      }



      //----------------------check shipping pincode-------------//
      if (address.shipping.pincode) {
        if (!isValidPincode(address.shipping.pincode)) {
          return res.status(400).send({ status: false, message: ' Please provide a valid pincode in 6 digits' })
        }
        updateData['address.shipping.pincode'] = address.shipping.pincode
      }
    }

    //----------------------check billing street-------------//
    if (address.billing) {
      if (address.billing.street) {
        if (!isEmpty(address.billing.street)) {
          return res.status(400).send({ status: false, message: "street is not valid in billing address" })
        }
        updateData['address.billing.street'] = address.billing.street
      }

      //----------------------check billing city-------------//
      if (address.billing.city) {
        if (!isValidName(address.billing.city)) {
          return res.status(400).send({ status: false, message: "city is not valid in billing address" })
        }
        updateData['address.billing.city'] = address.billing.city

      }
      //----------------------check billing pincode-------------//
      if (address.billing.pincode) {
        if (!isValidPincode(address.billing.pincode)) {
          return res.status(400).send({ status: false, message: ' Please provide a valid pincode in 6 digits' })
        }
        updateData['address.billing.pincode'] = address.billing.pincode
      }
    }

    let result = await userModel.findByIdAndUpdate(userId, updateData, { new: true });
    res.status(200).send({ status: true, message: "User profile update", data: result });

  } catch (error) {
    console.log(error)
    return res.status(500).send({ status: false, message: error.message })
  }
}



module.exports = { createUser, userLogin, getUser, updateuserDetails };

