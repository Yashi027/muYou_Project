
import { upload } from "../middlewares/multer.js"; 
import { changeCurrentPassword, getcurrentUser
  , getUserChannelProfile, getWatchHistory, loginUser
  , logoutUser, refreshAccessToken, registerUser,
   updateAccountDetails, updateAvatar, updateCoverimage } from "../controllers/user.controller.js";
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/register",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverimage", maxCount: 1 }
  ]),
  registerUser
);


router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT ,logoutUser)

router.route("/refresh_token").post(refreshAccessToken)

router.route("/change_password").post(verifyJWT,changeCurrentPassword)

router.route("/current_user").get(verifyJWT,getcurrentUser)

router.route("/update_account").patch(verifyJWT,updateAccountDetails)

router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateAvatar)

router.route("/cover_image").patch(verifyJWT,upload.single("coverimage"),updateCoverimage)

router.route("/c/:username").get(verifyJWT,getUserChannelProfile)

router.route("/watch_history").get(verifyJWT,getWatchHistory)
export { router };
