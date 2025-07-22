
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import connectDb from "./db/index.js";
const app = express();

app.get("/", (req, res) => {
  res.send("API is working");
});

connectDb()
.then(()=>{
  app.listen(process.env.PORT||8000,()=>{
    console.log(`Server is running at port: ${process.env.PORT}`)
  })
})
.catch((err)=>{
  console.log("MONGODB connection failed!!",err);
})

