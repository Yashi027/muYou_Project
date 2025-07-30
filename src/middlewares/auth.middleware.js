import { apiError } from "../utils/apiError";
import { asyncHandlers } from "../utils/asyncHandlers.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";


export const verifyJWT = asyncHandlers( async(req,res,next)=>{
    try {
        const token= req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer"," ")
        if(!token)
            throw new apiError(401, "Unauthorised request")
    
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user = User.findById(decodedToken._id).select("-password -refreshToken")
    
        if(!user)
            throw new apiError(401,"access token not defined")
        req.user = user;
        next()
    } catch (error) {
        throw new apiError(401,error?.message || "Invalid Access Token")
    }
})