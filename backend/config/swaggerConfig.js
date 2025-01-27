const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {//Contains metadata about your API:
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'Documentation for the backend API endpoints',
    },
    servers: [
      {
        url: 'http://localhost:3000/api', // Replace with your API base URL
      },
    ],
  },
  apis: ['./routes/authRoutes.js'], // Path to your route files for documentation
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = { swaggerUi, swaggerSpec };

console.log(require('path').resolve('./routes/auth.Routes.js'));
