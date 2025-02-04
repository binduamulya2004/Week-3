const express = require("express");
const { faker } = require("@faker-js/faker");
const XLSX = require("xlsx");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// Predefined vendor names
const vendors = [
  "Amazon", "Blinkit", "Swiggy", "Zomato"
];

// Predefined category names
const categories = [
  "Electronics", "Foods", "Clothing", "Stationery", "Furniture",
];

// Function to get 2-3 random vendors
function getRandomVendors() {
  const shuffledVendors = [...vendors].sort(() => 0.5 - Math.random()); // Shuffle vendors
  const numVendors = Math.floor(Math.random() * 2) + 2; // Get 2 or 3 vendors
  return shuffledVendors.slice(0, numVendors).join(", "); // Convert to comma-separated string
}

// Function to generate sample product data
function generateProducts(num) {
  const products = [];
  for (let i = 0; i < num; i++) {
    products.push({
      product_name: faker.commerce.productName(),
      category_name: categories[Math.floor(Math.random() * categories.length)], // Pick a random category
      unit_price: faker.commerce.price(100, 5000, 2),
      quantity_in_stock: faker.number.int({ min: 1, max: 1000 }),
      status: 1, // Set status as 1 for all products
      vendors: getRandomVendors(), // Convert array to string
    });
  }
  return products;
}

// API Route to Generate and Serve XLSX File
app.get("/generate-sample-data", (req, res) => {
  const numRecords = req.query.records ? parseInt(req.query.records) : 100; 

  // Generate data
  const productsData = generateProducts(numRecords);

  // Create an Excel workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(productsData);
  XLSX.utils.book_append_sheet(wb, ws, "Products");

  // Save file temporarily
  const filePath = "./products_data.xlsx";
  XLSX.writeFile(wb, filePath);

  // Send the file as a response
  res.download(filePath, "p_100.xlsx", (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Error generating file");
    }
    // Delete the file after sending it
    fs.unlinkSync(filePath);
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
