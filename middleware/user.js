const BigPromise = require('../middleware/bigPromise');
const CustomError = require('../utils/customError');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

exports.isLoggedIn = BigPromise(async(req,res,next)=>{
    const token = req.cookies.token || req.header("Authorization").replace("Bearer ","");

    if(!token){
        return next(new CustomError("login first to access this page",401));
    }

    const decoded = jwt.verify(token,process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);
    next();
})