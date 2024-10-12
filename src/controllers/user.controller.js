import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler( async (req, res) => {
    console.log("Received request to register user");

    const { username, email, fullName, password } = req.body;
    console.log("User data received from frontend:", { username, email, fullName });

    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        console.log("Validation failed: Missing fields");
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });
    console.log("Checking if user exists:", { username, email });

    if (existedUser) {
        console.log("User already exists");
        throw new ApiError(409, "User already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;

    // const coverImageLocalPath = req.files?.coverImage?.coverImage[0]?.path; some issue with this code when I am trying to upload 
    // file in covert Image where as when I am not giving any entry in the coverImage attribute, my code is working fine
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path}
    // } // Another way of uploading coverImage as it is not a required field so here we are seprately checking that if coverImage exists
    console.log("Files uploaded to local storage:", { avatarLocalPath, coverImageLocalPath });

    if (!avatarLocalPath) {
        console.log("Avatar not found in request");
        throw new ApiError(400, "Avatar not found");
    }

    console.log("Uploading avatar to Cloudinary...");
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log("Avatar uploaded to Cloudinary:", avatar);

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    console.log("Cover image uploaded to Cloudinary:", coverImage);

    if (!avatar) {
        console.log("Avatar upload failed");
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({
        username: username.toLowerCase(),
        password,
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email
    });
    console.log("User created in the database:", user);

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    console.log("User found after creation:", createdUser);

    if (!createdUser) {
        console.log("User creation failed");
        throw new ApiError(500, "Something went wrong while registration");
    }

    console.log("Registration successful");
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );
});


export {registerUser}