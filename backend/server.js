const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('./routes');
const sharp = require('sharp'); 
const { decryptMiddleware, encryptMiddleware } = require('./middleware/jwt/cryptoMiddleware');

dotenv.config();
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true })); 

// Decrypt all incoming requests
app.use(decryptMiddleware);


// Routes
app.use('/api', routes);


// Encrypt all outgoing responses
app.use(encryptMiddleware);


// Global Error Handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
