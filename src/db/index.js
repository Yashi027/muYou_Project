import mongoose from "mongoose";

import { DB_NAME } from "../constants.js";

const connectDb = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
    console.log(`MongoDb connected`)
  } catch (error) {
    console.log("DB connection error",error);
    process.exit(1);
  }
}

export default connectDb;