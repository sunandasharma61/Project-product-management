const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const {isValidObjectId} = require("../validator/validator")

const authentication = async function (req, res, next) {
    try {

        let bearToken = req.headers["authorization"];
        if (!bearToken) {
            return res.status(400).send({ status: false, message: "Token not present, login again " })
        };

        let token = bearToken.split(" ")[1];

        let decodedToken = jwt.verify(token, "group3Project5",function(err,decodedToken){
        if(err){
          return res.status(400).send({status:false,message:"Invalid token"})
        }else{
          req.userId = decodedToken.userId;
            next();
         }
        });

    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}

//====================================authorisation==========================================//

const authorisation = async function(req,res,next){
  try{
    const userId = req.params.userId
    if(!userId){
      return res.status(400).send({status:false,message:"enter userId"})
    }
    if(!isValidObjectId(userId)){
      return res.status(400).send({status:false,message:"userId is not valid"})
    }
    let tokenuserId = req.userId
    // let userdata = await userModel.findById(userId)
    if(tokenuserId!=userId){
      return res.status(403).send({status:false,message:"you aren't authorised user"})
    }
    else{
      next()
    }


  }
  catch(err){
return res.status(500).send({status:false,message:"internal server error",error:err.message})
  }
}



module.exports = { authentication ,authorisation}
