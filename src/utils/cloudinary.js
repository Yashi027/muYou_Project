import { v2 as cloudinary } from 'cloudinary'
import fs from "fs";

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    });

    console.log("Uploaded to Cloudinary:", response.url);

    
    fs.unlinkSync(localFilePath);

    return response;

  } catch (error) {
    
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    console.error("Cloudinary upload error:", error);
    return null;
  }
}



// cloudinary.v2.uploader.upload("https://logos-download.com/wp-content/uploads/2016/03/Wikipedia_logo_logotype_emblem.png",
//    { public_id:"Wiki"},
//    function(error,result) { console.log(result);}
// );

export {uploadOnCloudinary}