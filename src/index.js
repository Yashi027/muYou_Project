
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";

import express from "express";
const app = express();

app.get("/", (req, res) => {
  res.send("API is working");
});

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);

    app.on("error", (err) => {
      console.log("Error: ", err);
      throw err;
    });

    app.listen(process.env.PORT, () => {
      console.log(`App is listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.log("DB connection error",error);
    throw error;
  }
})();
