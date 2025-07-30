
import { upload } from "../middlewares/multer.js"; 
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
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
export { router };
