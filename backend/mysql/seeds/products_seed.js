// exports.seed = function(knex) {
//   return knex('products').del() // Delete existing entries
//     .then(function () {
//       return knex('products').insert([
//         { product_name: 'Maggie', category_id: 1, quantity_in_stock: 100, unit_price: 20.00, product_image: 'maggie.jpg', status: 1, unit: '1 pack' },
//         { product_name: 'Bread', category_id: 1, quantity_in_stock: 50, unit_price: 15.00, product_image: 'bread.jpg', status: 1, unit: '1 loaf' },
//         { product_name: 'Eggs', category_id: 1, quantity_in_stock: 200, unit_price: 5.00, product_image: 'eggs.jpg', status: 1, unit: '1 dozen' },
//         { product_name: 'Perfumes', category_id: 2, quantity_in_stock: 30, unit_price: 1000.00, product_image: 'perfumes.jpg', status: 1, unit: '1 bottle' },
//         { product_name: 'Shampoos', category_id: 2, quantity_in_stock: 80, unit_price: 500.00, product_image: 'shampoos.jpg', status: 1, unit: '1 bottle' }
//       ]);
//     });
// };

exports.seed = function (knex) {
  return knex('products')
    .del() // Delete existing entries
    .then(function () {
      return knex('products').insert([
        { product_name: 'Maggie', category_id: 1, quantity_in_stock: 100, unit_price: 20.00, product_image: 'maggie.jpg', status: 1, unit: '1 pack' },
        { product_name: 'Bread', category_id: 1, quantity_in_stock: 50, unit_price: 15.00, product_image: 'bread.jpg', status: 1, unit: '1 loaf' },
        { product_name: 'Eggs', category_id: 1, quantity_in_stock: 200, unit_price: 5.00, product_image: 'eggs.jpg', status: 1, unit: '1 dozen' },
        { product_name: 'Laptop', category_id: 2, quantity_in_stock: 20, unit_price: 55000.00, product_image: 'laptop.jpg', status: 1, unit: '1 piece' },
        { product_name: 'Smartphone', category_id: 2, quantity_in_stock: 30, unit_price: 15000.00, product_image: 'smartphone.jpg', status: 1, unit: '1 piece' },
        { product_name: 'Jeans', category_id: 3, quantity_in_stock: 60, unit_price: 1200.00, product_image: 'jeans.jpg', status: 1, unit: '1 pair' },
        { product_name: 'T-shirt', category_id: 3, quantity_in_stock: 90, unit_price: 600.00, product_image: 'tshirt.jpg', status: 1, unit: '1 piece' },
        { product_name: 'Office Chair', category_id: 4, quantity_in_stock: 15, unit_price: 3000.00, product_image: 'office_chair.jpg', status: 1, unit: '1 piece' },
        { product_name: 'Bookshelf', category_id: 4, quantity_in_stock: 10, unit_price: 5000.00, product_image: 'bookshelf.jpg', status: 1, unit: '1 piece' },
        { product_name: 'Notebook', category_id: 5, quantity_in_stock: 200, unit_price: 50.00, product_image: 'notebook.jpg', status: 1, unit: '1 piece' },
        { product_name: 'Pen', category_id: 5, quantity_in_stock: 500, unit_price: 10.00, product_image: 'pen.jpg', status: 1, unit: '1 piece' },
        // Additional 10 rows
        { product_name: 'Chips', category_id: 1, quantity_in_stock: 120, unit_price: 10.00, product_image: 'chips.jpg', status: 1, unit: '1 pack' },
        { product_name: 'Milk', category_id: 1, quantity_in_stock: 80, unit_price: 25.00, product_image: 'milk.jpg', status: 1, unit: '1 liter' },
        { product_name: 'Refrigerator', category_id: 2, quantity_in_stock: 5, unit_price: 30000.00, product_image: 'refrigerator.jpg', status: 1, unit: '1 piece' },
        { product_name: 'TV', category_id: 2, quantity_in_stock: 8, unit_price: 40000.00, product_image: 'tv.jpg', status: 1, unit: '1 piece' },
        { product_name: 'Jacket', category_id: 3, quantity_in_stock: 20, unit_price: 2500.00, product_image: 'jacket.jpg', status: 1, unit: '1 piece' },
        { product_name: 'Cap', category_id: 3, quantity_in_stock: 50, unit_price: 300.00, product_image: 'cap.jpg', status: 1, unit: '1 piece' },
        { product_name: 'Dining Table', category_id: 4, quantity_in_stock: 5, unit_price: 20000.00, product_image: 'dining_table.jpg', status: 1, unit: '1 piece' },
        { product_name: 'Wardrobe', category_id: 4, quantity_in_stock: 8, unit_price: 15000.00, product_image: 'wardrobe.jpg', status: 1, unit: '1 piece' },
        { product_name: 'Stapler', category_id: 5, quantity_in_stock: 100, unit_price: 100.00, product_image: 'stapler.jpg', status: 1, unit: '1 piece' },
        { product_name: 'Eraser', category_id: 5, quantity_in_stock: 300, unit_price: 5.00, product_image: 'eraser.jpg', status: 1, unit: '1 piece' },
      ]);
    });
};
