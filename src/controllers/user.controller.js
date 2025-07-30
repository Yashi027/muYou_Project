import {asyncHandlers} from "../utils/asyncHandlers.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";



const generateaccessandrefreshToken = async(userId) =>{
   try {
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

      user.refreshToken = refreshToken;
      await user.save({validateBeforeSave : false});

      return {accessToken, refreshToken}
   } catch (error) {
      throw new apiError(500,"Something went wrong while generating tokens");
   }
}

const registerUser = asyncHandlers( async(req,res)=>{
   const {username , fullname, email, password} = req.body;
   
   if(username === "")
    throw new apiError(400, "All fields are required")
   if(fullname === "")
    throw new apiError(400, "All fields are required")
   if(email === "")
    throw new apiError(400, "All fields are required")
   if(password === "")
    throw new apiError(400, "All fields are required")


   const existedUser = await User.findOne({
    $or : [{username},{email}]
   })

   if(existedUser)
    throw new apiError(409,"User already existswith same info");

   const avatarlocalpath = req.files?.avatar?.[0]?.path;
   //const coverimageLocalPath = req.files?.coverimage?.[0]?.path;

   let coverimageLocalPath;
   if(req.files && Array.isArray(req.files.coverimage) && req.files.coverimage.length > 0){
      coverimageLocalPath = req.files.coverimage[0].path;
   }

   console.log("Uploaded files:", req.files);
   console.log("Avatar file path:", req.files?.avatar?.[0]?.path);

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


const loginUser = asyncHandlers(async(req,res)=>{
       const {username, email, password} = req.body
       if(!username && !email )
         throw new apiError(400,'username or email is required');

       const user = await User.findOne({
         $or : [{username} , {email}]
       })

       if(!user)
         throw new apiError(404, "user not found");
      const isPasswordValid = await user.isPasswordCorrect(password)
      
      if(!isPasswordValid)
         throw  new apiError(401,"Please enter the valid user credentials")

      const {accessToken, refreshToken } = await generateaccessandrefreshToken(user._id)

      const loggedinUser = await User.findById(user._id).select("-password -refreshToken")

      const options = {
         httpOnly : true,
         secure : true
      }
      return res.status(200)
      .cookie("accessToken",accessToken,options)
      .cookie("refreshToken",refreshToken,options)
      .json(
         new apiResponse(200,{
            user: loggedinUser, accessToken, refreshToken
         }, " User logged In successfully")
      )
   })



   const logoutUser = asyncHandlers(async (req,res)=>{
      await User.findByIdAndUpdate(req.user._id,{
         $set:{
            refreshToken: undefined
         }
      },
         {
            new : true
         }
      )

      const options = {
         httpOnly : true,
         secure : true
      }

      return res.status(200)
      .clearCookie("accessToken",options)
      .clearCookie("refreshToken",options)
      .json(new apiResponse(200, {}, "User loggedout successfully"))
   })

export {registerUser, loginUser, logoutUser }