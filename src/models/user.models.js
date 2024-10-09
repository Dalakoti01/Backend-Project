import mongoose , {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import jsonwebtoken from "jsonwebtoken";

const userSchema = new Schema(
    {
        username : {
            type : String,
            required : true,
            lowercase : true,
            unique : true,
            trim : true,
            index : true // index is used for inceasing optimization during searching something but if index will be used in bulk in our
                         // code then its optimization will decline
        },
        email : {
            type : String,
            required : true,
            lowercase : true,
            unique : true,
            trim : true,
    
        },

        password : {
            type : String,
            required : [true,"Password is required"],
           
        },
        fullName : {
            type : String,
            required : true,
            trim : true,
            index : true
        },
        avatar : {
            type : String, // cloudinary url
            required : true

        },

        coverImage : {
            type : String,
            required : true
        },
        watchHistory : [
            {
                type : Schema.Types.ObjectId,
                ref : "Video"
            }
        ],

        refreshToken : {
            type : String,
        }
    },{timestamps :true})


userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next();

    this.password = bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id : this._id,
            email : this.email,
            userName : this.userName,
            fullName : this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function (){
    return jwt.sign(
        {
            _id : this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User",userSchema)