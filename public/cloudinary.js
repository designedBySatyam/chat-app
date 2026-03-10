const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dyqtudx0r",
  api_key: "YOUR_API_KEY",
  api_secret: "YOUR_API_SECRET"
});

module.exports = cloudinary;