import { ApiError } from "../utils/ApiError.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import {User} from "../models/user.models.js"

export const verifyJwt = asyncHandler(async(req,res,next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        // The whole logic of if access token is not found is used when we are accessing the website from mobile so in that case it send 
        // the data in the form of header . You can read in jwt webtoken website how to acces these token there this Beare thing is explained
    
        if(!token){
            throw new ApiError(401,"Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            // NEXT VIDEO TODO DISCUSSION
            throw new ApiError(401,"Invalid ACCESS TOKEN")
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid token")
    }
    

})