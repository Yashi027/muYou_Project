
import { upload } from "../middlewares/multer.js"; // adjust path as needed
import { registerUser } from "../controllers/user.controller.js";
import { Router } from "express";

const router = Router();

router.post(
  "/register",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverimage", maxCount: 1 }
  ]),
  registerUser
);

export { router };
