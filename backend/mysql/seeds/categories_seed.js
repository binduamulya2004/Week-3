exports.seed = function (knex) {
  // Delete entries from dependent table first
  return knex('products')
    .del()
    .then(() => {
      // Then delete entries from categories
      return knex('categories').del();
    })
    .then(() => {
      // Insert new data into categories
      return knex('categories').insert([
        { category_id: 1, category_name: 'Foods', description: 'All types of food items', status: 1 },
        { category_id: 2, category_name: 'Electronics', description: 'Electronic devices and gadgets', status: 1 },
        { category_id: 3, category_name: 'Clothing', description: 'Apparel and accessories', status: 1 },
        { category_id: 4, category_name: 'Furniture', description: 'Home and office furniture', status: 1 },
        { category_id: 5, category_name: 'Stationery', description: 'Office and school supplies', status: 1 },
      ]);
    });
};
