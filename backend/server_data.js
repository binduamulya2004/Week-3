const express = require("express");
const { faker } = require("@faker-js/faker");
const XLSX = require("xlsx");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;
// Predefined vendor names
const vendors = [
    "Amazon", "Blinkit", "Flipkart", "BigBasket", "Reliance", "Myntra", 
    "InstaMart", "Zepto", "Ajio", "Meesho", "Nykaa", 
    "Snapdeal", "FirstCry", "Pepperfry", "Swiggy", "Zomato", "UberEats"
  ];
  
  // Predefined category names
  const categories = [
    "Electronics", "Food", "Clothing", "Stationery", "Furniture", 
    "HomeAppliances", "BeautyAndCare", "Toys", "Books", 
    "SportsAndFitness", "Automobiles", "Jewelery", "Medicines", 
    "PetSupplies", "BabyCare", "Grocery", "OfficeSupplies"
  ];
  
// Function to generate sample product data
function generateProducts(num) {
  const products = [];
  for (let i = 0; i < num; i++) {
    products.push({
      product_name: faker.commerce.productName(),
      category_name: categories[Math.floor(Math.random() * categories.length)], // Pick a random category
      unit_price: faker.commerce.price(100, 5000, 2),
      quantity_in_stock: faker.number.int({ min: 1, max: 100 }),
      description: faker.commerce.productDescription(),
      status: faker.datatype.boolean() ? 1 : 0, // 1 for active, 0 for inactive
      vendorName: vendors[Math.floor(Math.random() * vendors.length)], // Pick a random vendor
    });
  }
  return products;
}

// API Route to Generate and Serve XLSX File
app.get("/generate-sample-data", (req, res) => {
  const numRecords = req.query.records ? parseInt(req.query.records) : 10000; // Default 10,000

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
  res.download(filePath, "products_data.xlsx", (err) => {
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
