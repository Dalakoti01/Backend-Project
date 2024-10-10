import {asyncHandler} from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js';
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary"
import {ApiResponse} from "../utils/ApiResponse"

const registerUser = asyncHandler( async (req,res) => {
    // get all the data from frontend
    // validation - not empty
    //check if user already exists
    // check for images and avatar
    // upload them to cloudinary 
    // create user object for db
    // crate entry in db
    // remove passsword and refrsh token from response
    // check for user creation 
    // return res

    const {username,email,fullName,password} = req.body;
    console.log(email); // frontend se details aa gayi

    if(
        [fullName,username,email,password].some((field) => //validation ki empty field toh nahi aa gaya
        field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")  
    }

    const existedUser = User.findOne({
        $or : [{username},{email}] // check wheather user existed before or not 
    })

    if(existedUser){
        throw new ApiError(409,"user already registered ")
    }

    const avatarLocalPath =  req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar field is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar field is required")
    }

    const user = await User.create(
        {fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        username : username.toLowercase()
        passsword,
        email}
    )


    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registration ")
    }


    return res.status(201).json(
        new ApiResponse(200,createdUser,User registered successfully)
    )
    
})

export {registerUser} 