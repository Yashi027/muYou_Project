
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import connectDb from "./db/index.js";
import { app } from "./app.js";


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

