import { v2 as cloudinary } from 'cloudinary'
import fs from "fs";

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) =>{
    try {
        if(!localFilePath) return null;

        const response = await cloudinary.v2.uploader.upload(localFilePath,{
            resource_type: "auto"
        })
        console.log("File has been uploaded successfully ", response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null;
    }
}


// cloudinary.v2.uploader.upload("https://logos-download.com/wp-content/uploads/2016/03/Wikipedia_logo_logotype_emblem.png",
//    { public_id:"Wiki"},
//    function(error,result) { console.log(result);}
// );

export {uploadOnCloudinary}