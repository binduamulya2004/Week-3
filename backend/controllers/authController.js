const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { signupValidation } = require('../validations/userValidation');
const dotenv = require('dotenv');
const sharp = require('sharp');
const { S3Client, PutObjectCommand ,ListObjectsV2Command,GetObjectCommand} = require('@aws-sdk/client-s3');
const vendorModel = require('../models/vendorModel');
const productModel = require('../models/productModel');
const categoryModel = require('../models/categoryModel');
const knex = require('../mysql/connection');
const productToVendorModel = require('../models/productToVendor');
const cartsModel = require('../models/cartsModel');
const { log, Console } = require('console');
const { zipFiles } = require('./zipUtils');
const archiver = require('archiver');
const { decryptMiddleware, encryptMiddleware } = require('../middleware/jwt/cryptoMiddleware');

const refreshTokenModel = require('../models/refreshTokenModel');


dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    
  },
});

async function uploadToS3(fileBuffer, fileName, mimeType, userId) {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `bindu@AKV0796/${userId}/${fileName}`,
    Body: fileBuffer,
    ContentType: mimeType,
  };

  try {
    const command = new PutObjectCommand(params);
    const data = await s3.send(command);
    return `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw new Error('Failed to upload file to S3');
  }
}

function generateAccessToken(user) {
  return jwt.sign({ id: user.user_id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '150m' });
}

function generateRefreshToken(user) {
  return jwt.sign({ id: user.user_id, email: user.email }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}




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
      console.log(err);
      next(err);
    }
  },


  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      console.log('^^^^',email);
      console.log(password);
      const user = await userModel.findByEmail(email);
      if (!user) return res.status(400).json({ message: 'Invalid email or password' });

      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log(user.password);
      console.log(isValidPassword);
      if (!isValidPassword) return res.status(400).json({ message: 'Invalid email or password' });

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Store refresh token in the database
      await refreshTokenModel.storeRefreshToken(user.user_id, refreshToken);

      res.status(200).json({ accessToken, refreshToken, userId: user.user_id });
    } catch (err) {
      next(err);
    }
  },

  
  async refreshToken(req, res, next) {
    const { token } = req.body;
    if (!token) return res.status(401).json({ message: 'Refresh token is required' });

    try {
      const storedToken = await refreshTokenModel.findRefreshToken(token);
      if (!storedToken) return res.status(403).json({ message: 'Invalid refresh token' });

      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      const user = await userModel.findById(decoded.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const accessToken = generateAccessToken(user);
      res.status(200).json({ accessToken });
    } catch (err) {
      res.status(403).json({ message: 'Invalid or expired refresh token' });
    }
  },
  async logout(req, res, next) {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Refresh token is required' });

    try {
      await refreshTokenModel.deleteRefreshToken(token);
      res.status(200).json({ message: 'Logged out successfully' });
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


  //get products with search and pagination
  // async getProducts(req, res) {
  //   try {
  //     console.log('req.query:', req.query);
  //     const page = parseInt(req.query.page) || 1;
  //     const limit = parseInt(req.query.limit) || 10;
  //     const search = req.query.search || '';
  //     const columns = req.query.columns ? req.query.columns.split(',') : [];
  //     const offset = (page - 1) * limit;

  //     console.log('page:', page);
  //     console.log('limit:', limit);
  //     console.log('offset:', offset);
  //     console.log('columns:', columns);

  //     // Base query for products with necessary joins and filtering by status
  //     let query = knex('products')
  //       .join('categories', 'products.category_id', '=', 'categories.category_id')
  //       .leftJoin('product_to_vendor', 'products.product_id', '=', 'product_to_vendor.product_id')
  //       .leftJoin('vendors', 'product_to_vendor.vendor_id', '=', 'vendors.vendor_id')
  //       .where('products.status', '!=', 99); // Exclude products with status 99

  //     // Apply search term filter
  //     if (search) {
  //       if (columns.length > 0) {
  //         // Search within specific columns
  //         query = query.andWhere(function () {
  //           columns.forEach(column => {
  //             switch (column) {
  //               case 'product_name':
  //                 this.orWhere('products.product_name', 'like', `%${search}%`);
  //                 break;
  //               case 'category':
  //                 this.orWhere('categories.category_name', 'like', `%${search}%`);
  //                 break;
  //               case 'status':
  //                 const statusSearch = search.toLowerCase();
  //                 if (statusSearch.includes('available')) {
  //                   this.orWhere('products.status', '=', 1);
  //                 } else if (statusSearch.includes('out')) {
  //                   this.orWhere('products.status', '=', 2);
  //                 } else if (statusSearch.includes('low')) {
  //                   this.orWhere('products.status', '=', 3);
  //                 }
  //                 break;
  //               case 'vendors':
  //                 this.orWhere('vendors.vendor_name', 'like', `%${search}%`);
  //                 break;
  //               case 'quantity_in_stock':
  //                 if (!isNaN(search)) {
  //                   this.orWhere('products.quantity_in_stock', '=', parseInt(search));
  //                 }
  //                 break;
  //               case 'unit_price':
  //                 if (!isNaN(search)) {
  //                   this.orWhere('products.unit_price', '=', parseFloat(search));
  //                 }
  //                 break;
  //             }
  //           });
  //         });
  //       } else {
  //         // Search across all relevant columns if no specific columns are selected
  //         query = query.andWhere(function () {
  //           this.where('products.product_name', 'like', `%${search}%`)
  //             .orWhere('categories.category_name', 'like', `%${search}%`)
  //             .orWhere('vendors.vendor_name', 'like', `%${search}%`)
  //             .orWhere(function () {
  //               const statusSearch = search.toLowerCase();
  //               if (statusSearch.includes('available')) {
  //                 this.orWhere('products.status', '=', 1);
  //               } else if (statusSearch.includes('out')) {
  //                 this.orWhere('products.status', '=', 2);
  //               } else if (statusSearch.includes('low')) {
  //                 this.orWhere('products.status', '=', 3);
  //               }
  //             });
  //           if (!isNaN(search)) {
  //             this.orWhere('products.quantity_in_stock', '=', parseInt(search))
  //               .orWhere('products.unit_price', '=', parseFloat(search));
  //           }
  //         });
  //       }
  //     }

  //     // Execute the query to fetch all products
  //     const allProducts = await query;

  //     // Group vendors by product
  //     const groupedProducts = allProducts.reduce((acc, product) => {
  //       const { product_id, vendor_name, ...productData } = product;

  //       if (!acc[product_id]) {
  //         acc[product_id] = { ...productData, product_id,vendors: [] };
  //       }

  //       if (vendor_name) {
  //         acc[product_id].vendors.push(vendor_name);
  //       }

  //       return acc;
  //     }, {});

  //     // Convert the grouped products back to an array
  //     const productList = Object.values(groupedProducts);

  //     // Pagination in-memory
  //     const totalItems = productList.length;
  //     const paginatedProducts = productList.slice(offset, offset + limit);

  //     console.log('products array:', paginatedProducts);

  //     // Send the paginated products and total count back
  //     res.json({
  //       products: paginatedProducts,
  //       totalItems,
  //       totalPages: Math.ceil(totalItems / limit),
  //     });
  //   } catch (error) {
  //     console.error('Error fetching products:', error);
  //     res.status(500).json({ message: 'Error fetching products' });
  //   }
  // }

  

  //get products without search
  async getProducts(req, res) {
    try {
      console.log('req.query:', req.query);
        const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    console.log('limit:', limit);
    console.log('offset:', offset);

  

      // Get all records with necessary joins
      const allProducts = await knex('products')
        .join('categories', 'products.category_id', '=', 'categories.category_id')
        .leftJoin('product_to_vendor', 'products.product_id', '=', 'product_to_vendor.product_id')
        .leftJoin('vendors', 'product_to_vendor.vendor_id', '=', 'vendors.vendor_id')
        .select('products.*', 'categories.category_name', 'vendors.vendor_name')
        .where('products.status', 1)
        
       

      // Group vendors by product
      const groupedProducts = allProducts.reduce((acc, product) => {
        const { product_id, vendor_name, ...productData } = product;

        if (!acc[product_id]) {
          acc[product_id] = { ...product, vendors: [] };
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
      console.log(totalItems, 'totalItems');
      const paginatedProducts = productList.slice(offset, (offset + parseInt(limit)));
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
  },

  
  async addProduct(req, res, next) {
    try {
        // Extract and validate the payload structure
        const { productData, vendors } = req.body;

        if (!productData || !vendors || !Array.isArray(vendors)) {
            return res.status(400).json({ message: 'Invalid payload structure.' });
        }

        const { productName, category, quantity, unitPrice, unit, status } = productData;

        if (!productName || !category || !quantity || !unitPrice || !unit || !status) {
            return res.status(400).json({ message: 'Missing required product fields.' });
        }

        let productImage = null;

        // Handle product image upload if a file is provided
        if (req.file) {
            const processedImage = await sharp(req.file.buffer)
                .resize(50, 50)
                .toBuffer();

            const s3Params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `product_images/${Date.now()}_${req.file.originalname}`,
                Body: processedImage,
                ContentType: req.file.mimetype,
            };

            const command = new PutObjectCommand(s3Params);
            const s3Response = await s3.send(command);

            productImage = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Params.Key}`;
        }

        // Create product data for database insertion
        const productDataForDb = {
            product_name: productName,
            category_id: category,
            quantity_in_stock: quantity,
            unit_price: unitPrice,
            product_image: productImage,
            unit,
            status,
        };

        // Insert product data into the database
        const [productId] = await productModel.createProduct(productDataForDb);

        // Validate vendors array and create mappings
        if (vendors.length === 0) {
            return res.status(400).json({ message: 'At least one vendor must be selected.' });
        }

        const productToVendorData = vendors.map((vendorId) => ({
            product_id: productId,
            vendor_id: vendorId,
            status: 1, // Assuming status is 1 for active
        }));

        // Bulk insert into product-to-vendor mapping table
        await productModel.createProductToVendorBulk(productToVendorData);

        res.status(201).json({
            message: 'Product added successfully',
            product: { ...productDataForDb, product_id: productId, vendors },
        });
    } catch (err) {
        console.error('Error adding product:', err);
        next(err);
    }
}
,
  async getCategories(req, res, next) {
    try {
      const categories = await categoryModel.getAllCategories();
      res.status(200).json({ categories });
    } catch (err) {
      next(err);
    }
  },
  async getVendors(req, res, next) {
    try {
      const vendors = await vendorModel.getAllVendors();
      res.status(200).json({ vendors });
    } catch (err) {
      next(err);
    }
  },
   
  async uploadProductImage(req, res, next) {
    try {
      const { productId } = req.body; // Get product ID from request body
      const file = req.file;  // Get file from request

      if (!productId) {
        return res.status(400).json({ message: 'Product ID is required' });
      }

      // Process the image with Sharp (resize and format it)
      const processedImage = await sharp(file.buffer)
        .resize(50, 50)  // Resize to 50x50
        .toBuffer();

      // Upload image to AWS S3
      const s3Params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `product_images/${Date.now()}_${file.originalname}`, // File name in S3
        Body: processedImage,
        ContentType: file.mimetype,  // This makes the image publicly accessible
      };

      const command = new PutObjectCommand(s3Params);
      const s3Response = await s3.send(command);

      const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Params.Key}`;

      // Update product image URL in the database
      await productModel.updateProduct(productId, { product_image: fileUrl });

      res.status(200).json({ message: 'Product image uploaded and updated successfully!', url: fileUrl });
    } catch (err) {
      console.error('Error uploading product image:', err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  // Update product method
  async updateProduct(req, res, next) {
    try {
      const { productId } = req.params;
      const productData = req.body;
      console.log(productData, 'productData');

      const productObj = JSON.parse(JSON.stringify(productData))//deep copy of the original obj
      delete productObj.vendor_id
      console.log(productObj)
      // Start a transaction
      await knex.transaction(async (trx) => {
        // Update product data in the products table
        await trx('products').where('product_id', productId).update(productObj);

        // Handle image upload if a file is provided
        if (req.file) {
          const file = req.file;

          // Process the image with Sharp (resize and format it)
          const processedImage = await sharp(file.buffer)
            .resize(50, 50)  // Resize to 50x50
            .toBuffer();

          // Upload image to AWS S3
          const s3Params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `product_images/${Date.now()}_${file.originalname}`, // File name in S3
            Body: processedImage,
            ContentType: file.mimetype,  // This makes the image publicly accessible
          };

          const command = new PutObjectCommand(s3Params);
          await s3.send(command);

          const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Params.Key}`;

          // Update product image URL in the database
          await trx('products').where('product_id', productId).update({ product_image: fileUrl });
        }

        // Update product-to-vendor mapping if vendor_id has changed
        if (productData.vendor_id) {
          const productToVendorData = {
            product_id: productData.product_id,
            vendor_id: productData.vendor_id,
            status: 1, // Assuming status is 1 for active
          };

          const existing = await trx('product_to_vendor')
            .where('product_id', productData.product_id)
            .andWhere('vendor_id', productData.vendor_id)
            .first();

          if (existing) {
            // If the relationship already exists, update the status and timestamps
            await trx('product_to_vendor')
              .where('id', existing.id) // Use the primary key to locate the record
              .update({
                status: 1, // Set the status to active
                updated_at: trx.fn.now(), // Update the timestamp
              });
          } else {
            // If it's a new vendor for the product, insert a new row
            await trx('product_to_vendor').insert(productToVendorData);
          }

       
        }

        // Update category if necessary
        if (productData.category_id) {
          await trx('categories')
            .where('category_id', productData.category_id)
            .update({ status: 1 }); // Assuming `status: 1` means active

          // Update category_id in the products table
          await trx('products').where('product_id', productId).update({ category_id: productData.category_id });
        }

        // Update vendors if vendor data is passed
        if (productData.vendor_id) {
          const vendorData = {
            vendor_name: productData.vendor_name, // Assuming this field exists
            status: 1, // Example of updating vendor status
          };
          await trx('vendors').where('vendor_id', productData.vendor_id).update(vendorData);
        }
      });

      res.status(200).json({ message: 'Product updated successfully' });
    } catch (err) {
      console.error('Error updating product:', err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
  ,

  // Controller to soft delete product
  async deleteProduct(req, res, next) {
    console.log("******")
    const { productId } = req.params; // Get the product ID from request parameters
    console.log(productId, 'productId');

    try {
      // Start a transaction for atomic updates
      await knex.transaction(async (trx) => {
        // Update status in `products` table
        await trx('products')
          .where('product_id', productId)
          .update({ status: 99 });

        // Update status in `product_to_vendor` table
        await trx('product_to_vendor')
          .where('product_id', productId)
          .update({ status: 99 });
      });

      // Send success response
      return res
        .status(200)
        .json({ message: 'Product and related vendors deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      return res
        .status(500)
        .json({ message: 'Failed to delete product', error: error.message });
    }
  },

//cartcontrollers

  async moveToCart(req, res) {
  const products = req.body.products; // Assuming `products` is passed in the request body
    console.log("products: ", products);
    const user_id = req.user.id;
    console.log("userId: ", user_id);

    

  try {
    await knex.transaction(async (trx) => {
      for (const product of products) {
        // const { product_id, vendor_id, quantity } = product;
        const product_id=product.productId;
        const vendor_id=product.vendorId;
        const quantity=product.quantity;
        console.log('****',product_id);
        console.log("****", vendor_id);
        console.log("****", quantity);

         const user_id = req.user.id;
        // Insert or update the cart entry
        const existingCartItem = await trx('carts')
          .where({ user_id, product_id, vendor_id })
          .first();

        if (existingCartItem) {
          await trx('carts')
            .where({ id: existingCartItem.id })
            .update({ quantity: existingCartItem.quantity + quantity });
        } else {
          await trx('carts').insert({ user_id, product_id, vendor_id, quantity });
        }

        // Decrease the quantity in stock
        await trx('products')
          .where({ product_id })
          .decrement('quantity_in_stock', quantity);
      }
    });

    res.status(200).json({ message: 'Products moved to cart successfully.' });
  } catch (error) {
    console.error('Error moving products to cart:', error);
    res.status(500).json({ error: 'Failed to move products to cart.' });
  }
},

  async getCartItems(req, res) {
  try {
    const { page = 1, limit = 5 } = req.query;
   
    const offset = (page - 1) * limit;
    const userId = req.user.id;
    console.log("userId in cartitems : ", userId);

    // Fetch the total count of cart items for the user where quantity > 0 and product is available
    const totalItemsQuery = knex('carts')
      .count('* as total')
      .where('user_id', userId)
      .andWhere('quantity', '>', 0) // Ensure quantity is greater than 0
      .join('products', 'carts.product_id', '=', 'products.product_id')
      .andWhere('products.status', '=', 1) // Ensure the product is available
      .first();

    const cartItemsQuery = knex('carts')
  .join('products', 'carts.product_id', '=', 'products.product_id')
  .join('categories', 'products.category_id', '=', 'categories.category_id')
  .join('product_to_vendor', function () {
    this.on('products.product_id', '=', 'product_to_vendor.product_id')
      .andOn('carts.vendor_id', '=', 'product_to_vendor.vendor_id'); // Ensure cart's vendor matches
  })
  .join('vendors', 'product_to_vendor.vendor_id', '=', 'vendors.vendor_id')
  .select(
    'carts.id',
    'products.product_id',
    'products.product_name',
    'products.product_image',
    'categories.category_name',
    'vendors.vendor_name',
    'carts.quantity',
    'carts.quantity as initialQuantity',
    'products.quantity_in_stock'
  )
  .where('carts.user_id', userId)  // Replace userId with the actual user ID or a parameter
  .andWhere('carts.quantity', '>', 0) // Ensure quantity is greater than 0
  .andWhere('products.status', '=', 1) // Ensure the product is available
  .limit(limit) // Limit the number of results
  .offset(offset) // Offset the results for pagination
  .debug(); // Debugging to see the SQL query


    // Execute both queries in parallel
    const [totalResult, cartItems] = await Promise.all([totalItemsQuery, cartItemsQuery]);

     console.log('totalResult:', totalResult);
    console.log('cartItems:', cartItems);
   
    
    // If no cart items are found for the user, respond with an empty list
    if (!totalResult.total || cartItems.length === 0) {
      return res.status(200).json({
        success: true,
        total: 0,
        page: Number(page),
        limit: Number(limit),
        products: [],
      });
    }

    // Return the cart items and total count
    res.json({
      success: true,
      total: totalResult.total,
      page: Number(page),
      limit: Number(limit),
      products: cartItems,
    });
  } catch (error) {
    console.error('Error fetching cart items:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
},
  
async updateCartQty(req, res) {
  try {
    const { productId, diff } = req.body.payload; // Receive the product ID and diff from the request body
    const userId = req.user.id;


    console.log('Product ID:', productId);
    console.log('Difference:', diff);
    console.log(userId);

    // Start a transaction
    const trx = await knex.transaction();

    try {
      // Fetch the current product details from the products table
      const product = await trx('products').where('product_id', productId).first();
      if (!product) {
        throw { success: false, status: 404, error: 'Product not found', productId };
      }

      // Update the quantity_in_stock in the products table
      const newStock = product.quantity_in_stock - diff; // Add the diff to the stock
      if (newStock < 0) {
        throw { success: false, status: 400, error: 'Insufficient stock', productId };
      }
      console.log('newstock', newStock);

      await trx('products')
        .where('product_id', productId)
        .update({ quantity_in_stock: newStock });

      // Fetch the current cart item details
      const cartItem = await trx('carts')
        .where('product_id', productId)
        .andWhere('user_id', userId)
        .first();

      if (!cartItem) {
        throw { success: false, status: 404, error: 'Cart item not found', productId };
      }

      // Update the quantity in the cart table
      const updatedCartQuantity = cartItem.quantity + diff; // Reduce the quantity in the cart by the diff
      if (updatedCartQuantity < 0) {
        throw { success: false, status: 400, error: 'Invalid cart quantity', productId };
      }
      console.log('****',updatedCartQuantity);

      await trx('carts')
        .where('product_id', productId)
        .andWhere('user_id', userId)
        .update({ quantity: updatedCartQuantity });

      // Commit the transaction
      await trx.commit();

      return res.status(200).json({
        message: 'Cart and product updated successfully',
        productId,
        newStock,
        updatedCartQuantity,
      });
    } catch (error) {
      // Rollback the transaction on error
      await trx.rollback();
      console.error('Transaction error:', error);

      if (error.success === false) {
        return res.status(error.status).json({ error: error.error, productId: error.productId });
      }

      throw error; // Rethrow unexpected errors
    }
  } catch (error) {
    console.error('Error updating cart and product quantities:', error);
    return res.status(500).json({ error: 'Failed to update cart and product quantities' });
  }
}

,
  async updateCartItemQuantity(req, res) {

  try {
    const userId = req.user.id;
    console.log(req.user)
    const parsedData = req.body
    // Start a transaction
    const trx = await knex.transaction();

    try {
      for (const { productId, quantity } of parsedData.products) {
        console.log("Product_Id:", productId);
        console.log("quantity:", quantity);
        console.log("UserId:", userId);

        // Fetch current product details from the products table
        const product = await trx('products').where('product_id', productId).first();
        if (!product) {
          throw { success: false, status: 404, error: 'Product not found', productId };
        }

        // Calculate the new stock based on change in quantity
        const newStock = product.quantity_in_stock - quantity;
        if (newStock < 0) {
          throw { success: false, status: 400, error: 'Not enough stock available', productId };
        }

        // Fetch current cart item details
        const cartItem = await trx('carts')
          .where('product_id', productId)
          .andWhere('user_id', userId)
          .first();

        if (!cartItem) {
          throw { success: false, status: 404, error: 'Cart item not found', productId };
        }

        // Calculate the updated cart quantity
        const updatedCartQuantity = cartItem.quantity + quantity;

        if (updatedCartQuantity < 0) {
          throw { success: false, status: 400, error: 'Invalid cart quantity', productId };
        }

        // Update the quantity in the cart table
        await trx('carts')
          .where('product_id', productId)
          .andWhere('user_id', userId)
          .update({ quantity: updatedCartQuantity });

        // Update the product's stock in the products table
        await trx('products')
          .where('product_id', productId)
          .update({ quantity_in_stock: newStock });
      }

      // Commit the transaction if all operations succeed
      await trx.commit();

      return res.status(200).json({ message: 'Cart and product updated successfully' });
    } catch (error) {
      await trx.rollback();
      console.error('Transaction error:', error);

      if (error.success === false) {
        return res.status(error.status).json({ error: error.error, productId: error.productId });
      }

      throw error; // Rethrow unexpected errors
    }
  } catch (error) {
    console.error('Error in updating cart items and products:', error);
    return res.status(500).json({ error: 'Failed to update cart items and products' });
  }
},

  // Controller to delete a cart item and update product stock in one method
  async deleteCartItem(req, res) {
    const { cartId } = req.params;
    console.log("cartId: ", cartId);

    const trx = await knex.transaction(); // Start a transaction

    try {
      // Fetch the cart item to get product_id and quantity
      const cartItem = await trx('carts')
        .where('id', cartId)
        .first();

      if (!cartItem) {
        throw new Error('Cart item not found');
      }

      const { product_id, quantity } = cartItem;

      // Update the quantity in stock for the product
      await trx('products')
        .where('product_id', product_id)
        .increment('quantity_in_stock', quantity); // Add the quantity back to the product stock

      // Delete the cart item
      await trx('carts')
        .where('id', cartId)
        .del();

      // Commit the transaction
      await trx.commit();
      

      return res.status(200).json({ message: 'Cart item deleted successfully' });
      
    } catch (error) {
      // Rollback the transaction in case of an error
      await trx.rollback();
      console.error('Error during cart item deletion:', error);
      res.status(500).json({ message: 'Failed to delete cart item' });
    }
  },
 

// Upload file controller
async uploadFile(req, res) {
  const file = req.file;
  const userId = req.user.id;

  if (!file || !userId) {
    return res.status(400).json({ error: 'File or User ID missing' });
  }

  try {
    const fileName = `${file.originalname}`;
    let fileBuffer;

    // Check file type
if (file.mimetype.startsWith('image/')) {
  // Process image files using sharp
  fileBuffer = await sharp(file.buffer).resize(800, 800).toBuffer();
} else if (file.mimetype === 'application/pdf') {
  // For PDF, no resizing needed
  fileBuffer = file.buffer;
} else if (
  file.mimetype === 'application/vnd.ms-excel' || // For .xls
  file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // For .xlsx
) {
  // Handle Excel files
  fileBuffer = file.buffer; // If no transformation is required, just keep the buffer as is
} else {
  // Unsupported file type
  return res.status(400).json({ error: 'Unsupported file type' });
}

    // Upload to S3 (or any storage service)
    const fileUrl = await uploadToS3(fileBuffer, fileName, file.mimetype, userId);

    console.log('File details:', JSON.stringify(file)); // Serialize the object

    // Response
    res.status(200).json({
      message: 'File uploaded successfully',
      fileUrl,
      fileName: file.originalname,
      mimeType: file.mimetype,
      encoding: file.encoding,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
}
,

 
// Fetch uploaded files for a specific user from S3
 async getUploadedFiles(req, res) {
    const userId = req.user.id;
    console.log("userrrrrrrrrrrrrrrrrrrrrrrrrr", userId);
    if (!userId) return res.status(400).json({ error: 'User not authenticated' });

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Prefix: `bindu@AKV0796/${userId}/`,
    };

    try {
      const command = new ListObjectsV2Command(params);
      const data = await s3.send(command);

      const files = data.Contents.map(item => ({
        key: item.Key,
        lastModified: item.LastModified,
        size: item.Size,
        url: `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${item.Key}`,
        fileName: item.Key.split('/').pop(), // Extract the file name from the key
        lastModifiedFormatted: item.LastModified.toISOString() // Optional formatting
      }));


      console.log('Files in backenndddd:', JSON.stringify(files));

      res.status(200).json({ files });
    } catch (error) {
      console.error('Error fetching uploaded files:', error);
      res.status(500).json({ error: 'Failed to fetch uploaded files' });
    }
  },

 
 // Download files controller
  async downloadFiles(req, res) {
    const { fileNames } = req.body;
    const userId = req.user.id;

    if (!fileNames || !Array.isArray(fileNames) || fileNames.length === 0) {
      return res.status(400).json({ error: 'No file names provided' });
    }

    try {
      if (fileNames.length === 1) {
        // Download a single file
        const fileName = fileNames[0];
        const params = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `bindu@AKV0796/${userId}/${fileName}`,
        };

        const command = new GetObjectCommand(params);
        const data = await s3.send(command);

        res.setHeader('Content-Type', data.ContentType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        data.Body.pipe(res);
      } else {
          // Download multiple files as a zip
        const archive = archiver('zip', { zlib: { level: 9 } });
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="files.zip"');

        archive.pipe(res);

        for (const fileName of fileNames) {
          const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `bindu@AKV0796/${userId}/${fileName}`,
          };

          const command = new GetObjectCommand(params);
          const data = await s3.send(command);

          archive.append(data.Body, { name: fileName });
        }

        await archive.finalize();
      }
    } catch (error) {
        console.error('Error downloading files:', error);
      res.status(500).json({ error: 'Failed to download files' });
    }
  },



 // Import data controller
async importFile(req, res) {
  const products = req.body; // Assuming express.json() middleware handles JSON parsing

  if (!Array.isArray(products)) {
    return res.status(400).json({ error: 'Invalid JSON format: Expected an array' });
  }

  console.log("products: ", products);

  try {
    for (let product of products) {
      // Check if the category exists
      let category = await knex('categories').where('category_name', product.category_name).first();
      if (!category) {
        const [categoryId] = await knex('categories').insert({
          category_name: product.category_name,
          description: product.category_description || '',
          status: '1' // Active
        });
        category = { category_id: categoryId }; // Manually create the object
      }

      // Check if the vendor exists
      let vendor = await knex('vendors').where('vendor_name', product.vendorName).first();
      if (!vendor) {
        const [vendorId] = await knex('vendors').insert({
          vendor_name: product.vendorName,
          contact_name: product.vendor_contact_name || '',
          address: product.vendor_address || '',
          city: product.vendor_city || '',
          postal_code: product.vendor_postal_code || '',
          country: product.vendor_country || '',
          phone: product.vendor_phone || '',
          status: '1' // Active
        });
        vendor = { vendor_id: vendorId }; // Manually create the object
      }

      // Insert the product if it doesn't exist
      let existingProduct = await knex('products').where('product_name', product.product_name).first();
      if (!existingProduct) {
        const [productId] = await knex('products').insert({
          product_name: product.product_name,
          category_id: category.category_id, // Reference to category
          quantity_in_stock: product.quantity_in_stock || 0,
          unit_price: product.unit_price || 0,
          product_image: product.product_image || '',
          unit: product.unit || '',
          status: '1' // Active
        });
        existingProduct = { product_id: productId }; // Manually create the object
      }

      console.log("existing product", existingProduct);

      // Update or insert into product_to_vendor table
      const productVendorAssociation = await knex('product_to_vendor')
        .where({
          product_id: existingProduct.product_id,
          vendor_id: vendor.vendor_id
        })
        .first();

      if (!productVendorAssociation) {
        await knex('product_to_vendor').insert({
          product_id: existingProduct.product_id,
          vendor_id: vendor.vendor_id,
          status: '1' // Active
        });
      } else {
        // Optional: Update the status if the association already exists
        await knex('product_to_vendor')
          .where({
            product_id: existingProduct.product_id,
            vendor_id: vendor.vendor_id
          })
          .update({
            status: '1' // Active
          });
      }
    }

    res.status(200).json({ message: 'Data imported successfully' });
  } catch (error) {
    console.error('Error importing data:', error);
    res.status(500).json({ error: 'Error importing data' });
  }
}

};





