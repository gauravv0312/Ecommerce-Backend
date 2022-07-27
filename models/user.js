const mongoose  =require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: [true,"Please provide a name"],
        maxlength: [40,"Name should be under 40 characters"],
    },
    email:{
        type: String,
        required: [true,"Please provide a email"],
        validate: [validator.isEmail,"Please enter email in correct format"],
        unique: true,
    },
    name:{
        type: String,
        required: [true,"Please provide a name"],
        maxlength: [40,"Name should be under 40 characters"],
    },
    password:{
        type: String,
        required: [true,"Please provide a password"],
        minlength: [6,"Name should be atleast 6 characters"],
        select: false,
    },
    role:{
        type: String,
        default : 'user'
    },
    photo:{
        id:{
            type: String,
            required: true
        },
        secure_url:{
            type: String,
            required: true
        }
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
    createdAt:{
        type: Date,
        default: Date.now
    },
});

// encryption password before save
userSchema.pre('save',async function(next){
    if(!this.isModified('password')){
        return next();
    }
    this.password = await bcrypt.hash(this.password,10);
});

// validate the password with passed on user password
userSchema.methods.isValidatePassword = async function(usersendPassword){
      return await bcrypt.compare(usersendPassword,this.password);
};

// create and return jwt token
userSchema.methods.getJwtToken = function(){
    return jwt.sign({id: this._id},process.env.JWT_SECRET,{
       expiresIn: process.env.JWT_EXPIRY
    });
};

// generate forgot password token (string)

userSchema.methods.getForgotPasswordToken = function(){
    // generate a long and random string
    const forgetToken = crypto.randomBytes(20).toString('hex')

    // getting a hash -make sure to get hash on backend

    this.forgotPasswordToken = crypto.createHash('sha256').update(forgetToken).digest('hex');

    // time of token
    this.forgotPasswordToken = Date.now() + 20*60*1000;
    return forgetToken;
}

module.exports = mongoose.model('User',userSchema);