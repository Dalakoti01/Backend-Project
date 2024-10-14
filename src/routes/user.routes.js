import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from '../middlewares/multer.middleware.js'
import { loginUser,logoutUser,refreshAccessToken } from "../controllers/user.controller.js"
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

router.route("/refresh-token").post(refreshAccessToken)



export default router