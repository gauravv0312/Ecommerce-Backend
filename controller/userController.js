const User = require('../models/user');
const BigPromise = require('../middleware/bigPromise');
const CustomError  =require('../utils/customError');
const CookieToken = require('../utils/cookieToken');
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary');
const mailHelper = require('../utils/emailHelper')
const crypto = require('crypto');
const { user } = require('../routes/user');
exports.signup=BigPromise(async(req,res,next)=>{
 
    // let result;
   if(!req.files){
     return next(new CustomError("photo is required for signup",400))
   }

   const{name,email,password} = req.body;
   if(!email || !name || !password){
    return next(new CustomError('Name ,email and password are required',400));
};

   let file = req.files.photo
    const result = await cloudinary.v2.uploader.upload(file.tempFilePath,{
        folder: "users",
        width: 150,
        crop: "scale"
    });

    const user = await User.create({
        name,
        email,
        password,
        photo: {
            id: result.public_id,
            secure_url: result.secure_url,
        }
    });

   CookieToken(user,res);
});

exports.login = BigPromise(async(req,res,next)=>{
    const {email,password} =req.body;

    // check for presence of email and pasword

    if(!email || !password)
    {
        return next(new CustomError('please provide emial and password',400));
    }
// checking the user in DB
    const user =await User.findOne({email}).select("+password");
//  
    if(!user){
        return next(new CustomError('Email and Password .........does not match or correct',400));
    }
// match the pasword
    const isPasswordCorrect = await user.isValidatePassword(password);

    if(!isPasswordCorrect){
        return next(new CustomError('Password does not match or correct',400));
    }
    // if all goes good and we send the token
    CookieToken(user,res);
});

exports.logout = BigPromise(async(req,res,next)=>{
  res.cookie("token",null,{
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: "Logout Success",
  });
});

exports.forgetPassword = BigPromise(async(req,res,next)=>{
    const{email} = req.body;
    const user = await User.findOne({email})
    if(!user){
        return next(new CustomError('Email not found'));
    }  

    // get token from user model methods
    const forgotToken = user.getForgotPasswordToken();

    // save user fields in db
    await user.save({validateBeforeSave: false})
// create a url
    const myUrl = `${req.protocol}://${req.get(
        "host"
      )}/api/v1/password/reset/${forgotToken}`;;
//  craft a meesage
    const message = `Copy paste this link in your URL and hit enter \n\n ${myUrl}`;
// attempt to send mail
    try {
        await mailHelper({
         email: user.email,
         subject: "at Your Price -- Password reset email",
         message
        });
// json respone if email is success
        res.status(200).json({
            success: true,
            message : "Email sent Successfully"
        })

    } catch (error) {
        // reset user fields if things goes worng
        user.forgotPasswordToken = undefined
        user.forgotPasswordExpiry = undefined
        await user.save({validateBeforeSave: false})
// send error response
        return next(new CustomError(error.message,500))
    }
});

exports.passwordReset = BigPromise(async(req,res,next)=>{
    const token = req.params.token;

    const encryToken = crypto.createHash('sha256').update(token).digest('hex');
    console.log(encryToken);
    const user = await User.findOne({
        encryToken,
        forgotPasswordExpiry: {$gt: Date.now()},
    });
    
    
    if(!user){
        return next(new CustomError('Token is invalid or expired',400));
    }

    if(req.body.password!== req.body.confirmPassword)
    {
        return next(new CustomError('Password and confirm password do not match',400));
    }

    user.password = req.body.password;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    await user.save();
// send a json response or send token
    CookieToken(user,res);
});

exports.getLoggedInuserDetails = BigPromise(async(req,res,next)=>{
    const user  = await User.findById(req.user.id);
    res.status(200).json({
        success: true,
        user,
    });
})

exports.changePassword = BigPromise(async(req,res,next)=>{
    const userId = req.user.id;
    const user = await User.findById(userId).select('+password')

    const isOldPasswordCorrect= await user.isValidatePassword(req.body.oldPassword);

    if(!isOldPasswordCorrect){
        return next(new CustomError('old password is incorrect',400));
    }
    user.password = req.body.password

    await user.save();

    CookieToken(user,res);
})