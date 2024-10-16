import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import { json } from "express";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Somethinf went wrong while creating token");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  console.log("Received request to register user");

  const { username, email, fullName, password } = req.body;
  console.log("User data received from frontend:", {
    username,
    email,
    fullName,
  });

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    console.log("Validation failed: Missing fields");
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
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
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  // } // Another way of uploading coverImage as it is not a required field so here we are seprately checking that if coverImage exists
  console.log("Files uploaded to local storage:", {
    avatarLocalPath,
    coverImageLocalPath,
  });

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
    email,
  });
  console.log("User created in the database:", user);

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  console.log("User found after creation:", createdUser);

  if (!createdUser) {
    console.log("User creation failed");
    throw new ApiError(500, "Something went wrong while registration");
  }

  console.log("Registration successful");
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // Extract username, email, and password from the request body
  const { username, email, password } = req.body;
  console.log("Login request received. Email provided:", email); // Log email for debugging

  // Check if both username and email are missing
  if (!username && !email) {
    console.log("Validation failed: Missing username or email"); // Log missing credentials
    throw new ApiError(400, "Username or email is required");
  }

  // Try finding the user either by username or email
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  console.log("User search result:", user ? "User found" : "User not found"); // Log if the user was found

  // If no user is found, throw an error
  if (!user) {
    console.log("User not found in the database"); // Log if user doesn't exist
    throw new ApiError(404, "User not found");
  }

  // Check if the password is valid by calling the model's method
  const isPasswordValid = await user.isPasswordCorrect(password);
  console.log(
    "Password validation result:",
    isPasswordValid ? "Valid" : "Invalid"
  ); // Log password validation result

  // If password is incorrect, throw an error
  if (!isPasswordValid) {
    console.log("Invalid password provided"); // Log invalid password attempts
    throw new ApiError(401, "Invalid credentials");
  }

  // Generate access and refresh tokens for the user
  const { refreshToken, accessToken } =
    await generateAccessTokenAndRefreshToken(user._id);
  console.log("Tokens generated:", { accessToken, refreshToken }); // Log generated tokens

  // Fetch the user again, excluding the password and refreshToken fields
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  console.log("User details (without sensitive info):", loggedInUser); // Log sanitized user data

  // Options for the cookies (secure and HTTP-only)
  const options = {
    httpOnly: true, // Cookie is only accessible by the web server
    secure: true, // Cookie is sent only over HTTPS
  };

  // Send response: Set the access and refresh tokens in cookies, return user info
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, refreshToken, accessToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // clear the cookies
  // reset refresh token
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true, // By default, findByIdAndUpdate returns the old document before the update is applied. The option { new: true } 
                 //tells MongoDB to return the updated document instead, i.e., after the refreshToken is set to undefined.
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"));
});

const refreshAccessToken = asyncHandler ( async (req,res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if(!incomingRefreshToken){
    throw new ApiError(401,"No refresh token came")
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )

    

    const user = await User.findById(decodedToken?._id);

    if(!user){
      throw new ApiError(401,"Invalid Refresh Token")
    }

    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401,"Refresh Token is expired or not available for use")
    }

    const options = {
      httpOnly : true,
      secure : true
    }

    const {accessToken,newRefreshToken} = generateAccessTokenAndRefreshToken(user._id);

    return res.status(200)
              .cookie("accessToken",accessToken,options)
              .cookie("refreshToken",newRefreshToken,options)
              .json(
                new ApiResponse(200,{accessToken,refreshToken : newRefreshToken},
                  "Access Token Refreshed"
                )
              )


  } catch (error) {
    throw new ApiError(401,"error.message || Invalid refresh token")
  }
} )

const changeCurrentPassword = asyncHandler ( async(req,res) => {
  const {oldPassword,newPassword} = req.body

  // safe route h toh auth.middleware ki wajah se req.user accessable hoga
  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect){
    throw new ApiError(400, "Invalid old password")
  }

  user.password = newPassword
  await user.save({validateBeforeSave : false})

  return res.status(200)
            .json(
              new ApiResponse(200,{},"Password Changed Succefully")
            )
} )

const getCurrentUser = asyncHandler ( async (req,res) => {
  return res.status
            .json(
              new ApiResponse(
                200,
                req.user,
                "User fetched successfully"
              )
            )
} )

//Update Details : Note - Hamesha file(image,video etc) ki update ke liye alag aur fullName wagera ke
//                        liye alag function likho (Production Approach)

const updateAccountDetails = asyncHandler ( async(req,res) => {
  const {fullName,email} = req.body;
  if(!fullName || !email){
    throw new ApiError(400,"All Fields are required")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set : {
        fullName,
        email
      }
    },
    {new : true}
   
  )

  return res.status(200)
            .json(
              200,
              user,
              "Accounts Details Updated successfully "
            )
} )

const updateUserAvatar = asyncHandler( async(req,res) => {
  //multer middleware
  const localAvatarPath = req.file?.path
  if(!localAvatarPath){
    throw new ApiError(400,"Avatar is mandatory so kindly fill it")
  }

  const avatar = await uploadOnCloudinary(localAvatarPath);
  if(!avatar.url){
    throw new ApiError(400,"Error while uploading on avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set : {
        avatar : avatar.url
      }
    },
    {new : true}
  ).select("-password")

  return res.status(200)
            .json(
              new ApiResponse(
                200,
                user,
                "Avatar updated successfully"
              )
            )
  
} )

const updateUserCoverImage = asyncHandler( async(req,res) => {
  const localCoverImage = req.file?.path
  if(!localCoverImage){
    throw new ApiError(400,"Cover Image is not uploded")
  }

  const coverImage = await uploadOnCloudinary(localCoverImage);

  if(!coverImage.url){
    throw new ApiError(400,"Error while uploading Cover Image")
  }

  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set : {
        coverImage : coverImage.url
      }
    },
    {new : true}
  )

  return res.status
            .json(
              200,
              json(
                new ApiResponse(
                  200,
                  user,
                  "Cover Image updated successfully"
                )
              )
              
            )


} )

export {
   registerUser, loginUser, logoutUser,refreshAccessToken,changeCurrentPassword, getCurrentUser,
   updateAccountDetails,updateUserAvatar,updateUserCoverImage
  };
