const CryptoJS = require('crypto-js');

// Load secret key and IV from environment variables
const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key-1234567890123456'; // Must be 32 bytes

// Function to encrypt data
function encryptData(data) {
  const encrypted = CryptoJS.AES.encrypt(
    JSON.stringify(data),SECRET_KEY
  );
  const encryptedString = encrypted.toString();
  console.log('Encrypted Payload (Frontend):', encryptedString); // Log the encrypted payload
  return encryptedString

}

function decryptData(encryptedData) {
    const decrypted = CryptoJS.AES.decrypt(
        encryptedData,SECRET_KEY
      );
      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedText);
  }
// Middleware to decrypt request payload
function decryptMiddleware(req, res, next) {
  try {
    if (req.body && req.body.encryptedPayload) {
        console.log('Encrypted Payload (Backend):', req.body.encryptedPayload);
      req.body = decryptData(req.body.encryptedPayload); // Replace req.body with the decrypted data
      console.log('Decrypted Payload (Backend):', req.body);
    }
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Decryption error:', error.message);
    res.status(400).json({ message: 'Invalid encrypted payload' });
  }
}

// Middleware to encrypt response payload
function encryptMiddleware(req, res, next) {
  const originalSend = res.send; // Backup original `res.send` method

  res.send = function (data) {
    try {
      const encryptedData = encryptData(JSON.parse(data));
      originalSend.call(this, JSON.stringify({ encryptedPayload: encryptedData }));
    } catch (error) {
      console.error('Encryption error:', error.message);
      originalSend.call(this, data); // Fallback to sending raw data if encryption fails
    }
  };

  next(); // Proceed to the next middleware
}

module.exports = { decryptMiddleware, encryptMiddleware };
