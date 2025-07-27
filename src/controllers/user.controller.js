import {asyncHandlers} from "../utils/asyncHandlers.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandlers( async(req,res)=>{
   const {username , fullname, email, password} = req.body;
   console.log(username);
   if(username === "")
    throw new apiError(400, "All fields are required")
   if(fullname === "")
    throw new apiError(400, "All fields are required")
   if(email === "")
    throw new apiError(400, "All fields are required")
   if(password === "")
    throw new apiError(400, "All fields are required")


   const existedUser = User.findOne({
    $or : [{username},{email}]
   })

   if(existedUser)
    throw new apiError(409,"User already existswith same info");

   const avatarlocalpath = req.files?.avatar[0]?.path;
   const coverimageLocalPath = req.files?.coverimage[0]?.path;

   if(!avatarlocalpath)
    throw new apiError(400, "Avatar is required")

   const avatar = await uploadOnCloudinary(avatarlocalpath);
   const coverimage = await uploadOnCloudinary(coverimageLocalPath);

   if(!avatar)
    throw new apiError(400, "Avatar is required")


   const user = await User.create({
    username: username.toLowerCase(),
    fullname,
    email,
    password,
    avatar: avatar.url,
    coverimage: coverimage?.url || ""
   })

   const createdUser = await User.findById(user._id).select("-password -refreshToken")

   if(!createdUser){
    throw new apiError(500, "Something went wrong while registering the user")
   }

   return res.status(201).json(
    new apiResponse(200,createdUser,"User registered successfully")
   )


})

export {registerUser }