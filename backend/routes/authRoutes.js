const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();
const authenticate = require('../middleware/jwt/authenticate');
const jwtAuth = require('../middleware/jwt/jwtAuth');
const multer = require('multer');

// Set up multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage: storage });

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/user-details', authenticate, authController.getUserDetails);
router.post('/upload-profile-photo', jwtAuth, upload.single('profile_pic'), authController.uploadProfilePhoto);
router.get('/vendors/count', authenticate, authController.getVendorCount);
router.get('/products', authenticate, authController.getProducts);


module.exports = router;

