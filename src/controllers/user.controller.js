import {asyncHandlers} from "../utils/asyncHandlers.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"



const generateaccessandrefreshToken = async(userId) =>{
   try {
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

      if (!user) {
   throw new apiError(404, "User not found while generating tokens");
}

      user.refreshToken = refreshToken;
      await user.save({validateBeforeSave : false});

      return {accessToken, refreshToken}
   } catch (error) {
      console.log("token generation error:",error)
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


   const refreshAccessToken = asyncHandlers(async(req,res) => {
      const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

      if(!refreshAccessToken)
         throw new apiError(401,"Unauthorised request")

      try {
         const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)
         const user = User.findById(decodedToken?._id)
   
         if(!user)
            throw new apiError(401,"Invalid refresh token")
   
         if(incomingRefreshToken !== user.refreshToken)
            throw new apiError(401, "Refresh token is expired")
   
         const options = {
            httpOnly : true,
            secure : true
         }
         const {accessToken , newrefreshToken} = await generateaccessandrefreshToken(user._id)
   
         return res.status(200)
         .cookie("accessToken",accessToken,options)
         .cookie("refreshToken",newrefreshToken,options)
         .json(
            new apiResponse(200,{accessToken, refreshToken : newrefreshToken},"Access token refreshed")
         )
      } catch (error) {
         console.log("Refreshingtoken Error:",error)
         throw new apiError(401, error.message || "Invalid Refresh token")
      }
   })



   const changeCurrentPassword = asyncHandlers(async(req,res) => {
      const {oldpassword , newpassword} = req.body
      const user = await User.findById(req.user?._id)
      const isPasswordCorrect = await user.isPasswordCorrect(oldpassword)
      if(!isPasswordCorrect)
         throw new apiError(401,"Invalid old password")

      user.password = newpassword
      await user.save({validateBeforeSave: false})

      return res.status(200).json(new apiResponse(200,{},"Password changed successfully"))
   })


   const getcurrentUser = asyncHandlers(async(req,res) => {
      res.status(200).json(200,req.user,"User fetched successfully")
   })


   const updateAccountDetails = asyncHandlers(async(req,res) => {
      const {email} = req.body
      if(!email)
         throw new apiError(400,"Fill the required field")

      const user = await User.findByIdAndUpdate(req.user._id,{$set:{email}},{new: true}).select("-password")

      return res.status(200)
      .json(new apiResponse(200,user,"User details updated successfully"))
   })


   const updateAvatar = asyncHandlers(async(req,res) => {
      const avatarPath = req.file?.path

      if(!avatarPath)
         throw new apiError(400,"avatar Not found")

      const avatar = await uploadOnCloudinary(avatarPath)
      if(!avatar.url)
         throw new apiError(400,"Error while uploading avatar")
      const user = await User.findByIdAndUpdate(req.user?._id,{$set:{avatar: avatar.url}},{new: true}).select("-password")

      return res.status(200)
      .json(new apiResponse(200,user,"AvatarImage updated successfully"))
   })


   const updateCoverimage = asyncHandlers(async(req,res) => {
      const coverimagePath = req.file?.path

      if(!coverimagePath)
         throw new apiError(400,"CoverImage Not found")

      const coverimage = await uploadOnCloudinary(coverimagePath)
      if(!coverimage.url)
         throw new apiError(400,"Error while uploading coverImage")
      const user = await User.findByIdAndUpdate(req.user?._id,{$set:{coverimage: coverimage.url}},{new: true}).select("-password")

      return res.status(200)
      .json(new apiResponse(200,user,"CoverImage updated successfully"))
   })


   const getUserChannelProfile = asyncHandlers(async(req,res) => {
      const {username} = req.params
      if(!username)
         throw new apiError(400,"Username not defined")

      const channel = await User.aggregate([
         {
            $match:{
               username : username?.toLowerCase()
            }
         },{
            $lookup:{
               from: "subscriptions",
               localField:"_id",
               foreignField:"channel",
               as: "subscribers"
            }
         },{ 
            $lookup:{
               from: "subscriptions",
               localField:"_id",
               foreignField:"subscriber",
               as: "subscribedTo"
            
         }
         },{
            $addFields:{
               subscribersCount:{
                  $size:"$subscribers"
               },
               subscribedToCount:{
                  $size: "$subscribedTo"
               },
               isSubscribed:{
                  $cond: {
                     if: {$in : [req.user?._id , "$subscribers.subscriber"]},
                     then : true,
                     else: false
                  }
               }
            }
         },{
            $project:{
               fullname: 1,
               email: 1,
               avatar: 1,
               subscribersCount: 1,
               subscribedToCount: 1,
               isSubscribed: 1,
               coverimage: 1
            }
         }
      ])
      if(!channel?.length)
         throw new apiError(404,"Channel does not exist")
      console.log(channel)

      return res.status(200)
      .json(new apiResponse(200,channel[0],"User channel fetched successfully"))
   })


export {registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword,
    getcurrentUser, updateAccountDetails, updateAvatar, updateCoverimage, getUserChannelProfile }