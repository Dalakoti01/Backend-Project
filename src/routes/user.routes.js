import { Router } from "express";
import { 
    getCurrentUser,
     getCurrentUserChannelProfile,
      getWatchHistory,
       registerUser,
        updateAccountDetails,
         updateUserAvatar,
          updateUserCoverImage } from "../controllers/user.controller.js";
import {upload} from '../middlewares/multer.middleware.js'
import { loginUser,logoutUser,refreshAccessToken,changeCurrentPassword } from "../controllers/user.controller.js"
import { verifyJwt } from "../middlewares/auth.middleware.js";



const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name : "coverImage",
            maxCount : 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

//Secured Route

router.route("/logout").post(
    verifyJwt,
    logoutUser)

router.route("/refresh-token").post(refreshAccessToken) // verify Jwt is already done in refresh access token

router.route("/change-password").post(verifyJwt,changeCurrentPassword)

router.route("/current-user").get(verifyJwt,getCurrentUser)

router.route("/update-account").patch(verifyJwt,updateAccountDetails)

router.route("/update-avatar").patch(verifyJwt,upload.single("avatar"),updateUserAvatar)

router.route("/cover-image").patch(verifyJwt,upload.single("coverImage"),updateUserCoverImage)

router.route("/c/:username").get(verifyJwt,getCurrentUserChannelProfile) // user params se agar info aa rahi ho toh aese deal hoti h 

router.route("/history").get(verifyJwt,getWatchHistory)
export default router