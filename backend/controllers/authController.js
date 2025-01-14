const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { signupValidation } = require('../validations/userValidation');
const dotenv = require('dotenv');
const sharp = require('sharp');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const vendorModel = require('../models/vendorModel');
const productModel = require('../models/productModel');
const knex = require('../mysql/connection');

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

module.exports = {
  async signup(req, res, next) {
    try {
      const { error } = signupValidation.validate(req.body);
      if (error) return res.status(400).json({ message: error.details[0].message });

      const { first_name, last_name, email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const username = `${first_name} ${last_name}`;

      await userModel.createUser({
        first_name,
        last_name,
        email,
        password: hashedPassword,
        username,
      });

      res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    console.log("******");
    try {
      console.log(req.body, 'req.body');
      const { email, password } = req.body;
      const user = await userModel.findByEmail(email);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log('isValidPassword:', isValidPassword);
      if (!isValidPassword) return res.status(401).json({ message: 'Invalid credentials' });

      const token = jwt.sign({ id: user.user_id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.status(200).json({ token, user });
    } catch (err) {
      next(err);
    }
  },

  async getUserDetails(req, res, next) {
    try {
      const user = await userModel.findEmail(req.user.email); // Fetch user by email from token
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Return only the required fields
      res.status(200).json({
        username: user.username,
        email: user.email,
        profile_pic: user.profile_pic || null,
      });
    } catch (err) {
      next(err);
    }
  },

  async uploadProfilePhoto(req, res, next) {
    try {
      const file = req.file;  // Get file from request

      // Process the image with Sharp (resize and format it)
      const processedImage = await sharp(file.buffer)
        .resize(200, 200)  // Resize to 200x200 or whatever size you need
        .toBuffer();

      // Upload image to AWS S3
      const s3Params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `profile_photos/${Date.now()}_${file.originalname}`, // File name in S3
        Body: processedImage,
        ContentType: file.mimetype,  // This makes the image publicly accessible
      };

      const command = new PutObjectCommand(s3Params);
      const s3Response = await s3.send(command);

      const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Params.Key}`;

      // Update user's profile pic URL in the database
      await userModel.updateProfilePic(req.user.email, fileUrl);

      res.status(200).json({ message: 'Profile picture updated successfully!', url: fileUrl });
    } catch (err) {
      next(err);
    }
  },
   async getVendorCount(req, res) {
    try {
      const count = await knex('vendors').count('vendor_id as count').first();
      res.json({ count: count.count });
    } catch (error) {
      console.error('Error fetching vendor count:', error);
      res.status(500).json({ message: 'Error fetching vendor count' });
    }
  },



async getVendorCount(req, res) {
    try {
      const count = await knex('vendors').count('vendor_id as count').first();
      res.json({ count: count.count });
    } catch (error) {
      console.error('Error fetching vendor count:', error);
      res.status(500).json({ message: 'Error fetching vendor count' });
    }
  },

//   async getProducts(req, res) {
//     try {
//       console.log('req.query:', req.query);
//       let { page = 1, limit = 10 } = req.query;

//       page = parseInt(page); // Ensure page is an integer
//       limit = parseInt(limit); // Ensure limit is an integer
//       const offset=(page-1)*limit;
       
//       console.log("page:", page);
//       console.log("limit:", limit);
//       console.log("offset:", offset);

//       // Get the total count of products
//       const totalItemsResult = await knex('products').count('* as totalItems').first();
//       const totalItems = totalItemsResult.totalItems;

//       console.log("totalItems", totalItems);
//       console.log("totalItemsResult", totalItemsResult);
      

//       // Get the products for the current page
//       const products = await knex('products')
//         .join('categories', 'products.category_id', '=', 'categories.category_id')
//         .leftJoin('product_to_vendor', 'products.product_id', '=', 'product_to_vendor.product_id')
//         .leftJoin('vendors', 'product_to_vendor.vendor_id', '=', 'vendors.vendor_id')
//         .select('products.*', 'categories.category_name', 'vendors.vendor_name')
//         .offset(offset)
//         .limit(limit);

//       // Group vendors by product
//       const groupedProducts = products.reduce((acc, product) => {
//         const { product_id, vendor_name, ...productData } = product;

//         if (!acc[product_id]) {
//           acc[product_id] = { ...productData, vendors: [] };
//         }

//         if (vendor_name) {
//           acc[product_id].vendors.push(vendor_name);
//         }

//         return acc;
//       }, {});

//       // Convert the grouped products back to an array
//       const productList = Object.values(groupedProducts);
//       console.log("products array:", productList);
      

//       // Send the products and total count back
//       res.json({
//         products: productList,
//         totalItems
//       });
//     } catch (error) {
//       console.error('Error fetching products:', error);
//       res.status(500).json({ message: 'Error fetching products' });
//     }
//   }
    


async getProducts(req, res) {
  try {
    console.log('req.query:', req.query);
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page); // Ensure page is an integer
    limit = parseInt(limit); // Ensure limit is an integer
    const offset = (page - 1) * limit;

    console.log('page:', page);
    console.log('limit:', limit);
    console.log('offset:', offset);

    // Get all records with necessary joins
    const allProducts = await knex('products')
      .join('categories', 'products.category_id', '=', 'categories.category_id')
      .leftJoin('product_to_vendor', 'products.product_id', '=', 'product_to_vendor.product_id')
      .leftJoin('vendors', 'product_to_vendor.vendor_id', '=', 'vendors.vendor_id')
      .select('products.*', 'categories.category_name', 'vendors.vendor_name');

    // Group vendors by product
    const groupedProducts = allProducts.reduce((acc, product) => {
      const { product_id, vendor_name, ...productData } = product;

      if (!acc[product_id]) {
        acc[product_id] = { ...productData, vendors: [] };
      }

      if (vendor_name) {
        acc[product_id].vendors.push(vendor_name);
      }

      return acc;
    }, {});

    // Convert the grouped products back to an array
    const productList = Object.values(groupedProducts);

    // Pagination in-memory
    const totalItems = productList.length;
    const paginatedProducts = productList.slice(offset, offset + limit);

    console.log('products array:', paginatedProducts);

    // Send the paginated products and total count back
    res.json({
      products: paginatedProducts,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
}

    
};



