import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express()

app.use(cors({ // jaha jaha app.use ka use hoga iska matlab koi middleware aa raha h 
    origin : process.env.CORS_ORIGIN,
    credentials : true 
}))

app.use(express.json({limit : "16kb"})) // json se wo data le raha h jo form bharne pr recieve hoga 

app.use(express.urlencoded({extended : true, limit : "16kb"})) // url se jab koi data aata h toh usko handle krne ke liye urlencoded ka use kiya h extended is optional  

app.use(express.static("public")) // pdf and images 

app.use(cookieParser())


export {app}