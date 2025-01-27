const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();
const authenticate = require('../middleware/jwt/authenticate');
const jwtAuth = require('../middleware/jwt/jwtAuth');
const multer = require('multer');
const mailController=require('../controllers/mailControllers');

// Set up multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage: storage });

// router.post('/signup', authController.signup);
// router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);



router.get('/user-details', authenticate, authController.getUserDetails);
router.post('/upload-profile-photo', jwtAuth, upload.single('profile_pic'), authController.uploadProfilePhoto);
router.get('/vendors/count', authenticate, authController.getVendorCount);
router.get('/products', authenticate, authController.getProducts);

//add product
router.post('/products', upload.single('profile_pic'), authController.addProduct);
router.get('/categories', authenticate, authController.getCategories); // New route for retrieving categories
router.get('/vendors', authenticate, authController.getVendors); // New route for retrieving vendors
router.post('/upload-product-image', upload.single('product_image'), authController.uploadProductImage);

//in table edit
router.put('/products/:productId', upload.single('product_image'), authController.updateProduct);

//delete product
router.delete('/products/:productId', authController.deleteProduct);


//cart routes
router.post('/move-to-cart',authenticate, authController.moveToCart);
router.get('/cart', authenticate, authController.getCartItems);
router.post('/cart/update', authenticate, authController.updateCartItemQuantity);
router.delete('/delete-cart-item/:cartId', authenticate, authController.deleteCartItem);


//upload files 

router.post('/upload', authenticate,upload.single('file'), authController.uploadFile);
// Route to get the list of uploaded files
router.get('/files',authenticate,authController.getUploadedFiles);
router.post('/download',authenticate, authController.downloadFiles);



// Import routes
router.post('/import', authenticate, upload.single('file'), authController.importFile);



router.post('/forgot-password',mailController.forgotPassword);

router.post('/reset-password/:id/:accessToken',mailController.resetPassword);


router.put('/update-cart-quantity', authenticate, authController.updateCartQty)

module.exports = router;


/**
 * @swagger
 * components:
 *   schemas:
 *     SignupRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           description: User's email address
 *         password:
 *           type: string
 *           description: User's password
 *     SignupResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *         userId:
 *           type: string
 *           description: ID of the created user
 */

/**
 * @swagger
 * /signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SignupResponse'
 */
router.post('/signup', authController.signup);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Log in a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: User's email
 *               password:
 *                 type: string
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token
 */
router.post('/login', authController.login);
