exports.seed = function (knex) {
  return knex('product_to_vendor')
    .del() // Delete existing entries
    .then(function () {
      return knex('product_to_vendor').insert([
        // Product 85 (Maggie) is associated with multiple vendors
        { product_id: 85, vendor_id: 13, status: 1 },
        { product_id: 85, vendor_id: 14, status: 1 },
        { product_id: 85, vendor_id: 15, status: 1 },

        // Product 86 (Bread) is associated with multiple vendors
        { product_id: 86, vendor_id: 13, status: 1 },
        { product_id: 86, vendor_id: 16, status: 1 },

        // Product 87 (Eggs) is associated with multiple vendors
        { product_id: 87, vendor_id: 14, status: 1 },
        { product_id: 87, vendor_id: 15, status: 1 },

        // Product 88 (Laptop) is associated with multiple vendors
        { product_id: 88, vendor_id: 16, status: 1 },

        // Product 89 (Smartphone) is associated with multiple vendors
        { product_id: 89, vendor_id: 13, status: 1 },
        { product_id: 89, vendor_id: 14, status: 1 },

        // Product 90 (Jeans) is associated with multiple vendors
        { product_id: 90, vendor_id: 15, status: 1 },
        { product_id: 90, vendor_id: 16, status: 1 },

        // Product 91 (T-shirt) is associated with multiple vendors
        { product_id: 91, vendor_id: 13, status: 1 },
        { product_id: 91, vendor_id: 14, status: 1 },

        // Product 92 (Office Chair) is associated with multiple vendors
        { product_id: 92, vendor_id: 15, status: 1 },

        // Product 93 (Bookshelf) is associated with multiple vendors
        { product_id: 93, vendor_id: 16, status: 1 },

        // Product 94 (Notebook) is associated with multiple vendors
        { product_id: 94, vendor_id: 13, status: 1 },
        { product_id: 94, vendor_id: 15, status: 1 },

        // Product 95 (Pen) is associated with multiple vendors
        { product_id: 95, vendor_id: 14, status: 1 },
        { product_id: 95, vendor_id: 16, status: 1 },

        // Product 96 (Chips) is associated with multiple vendors
        { product_id: 96, vendor_id: 13, status: 1 },

        // Product 97 (Milk) is associated with multiple vendors
        { product_id: 97, vendor_id: 14, status: 1 },

        // Product 98 (Refrigerator) is associated with multiple vendors
        { product_id: 98, vendor_id: 15, status: 1 },

        // Product 99 (TV) is associated with multiple vendors
        { product_id: 99, vendor_id: 16, status: 1 },

        // Product 100 (Jacket) is associated with multiple vendors
        { product_id: 100, vendor_id: 13, status: 1 },
        { product_id: 100, vendor_id: 14, status: 1 },

        // Product 101 (Cap) is associated with multiple vendors
        { product_id: 101, vendor_id: 15, status: 1 },

        // Product 102 (Dining Table) is associated with multiple vendors
        { product_id: 102, vendor_id: 16, status: 1 },

        // Product 103 (Wardrobe) is associated with multiple vendors
        { product_id: 103, vendor_id: 13, status: 1 },

        // Product 104 (Stapler) is associated with multiple vendors
        { product_id: 104, vendor_id: 14, status: 1 }
      ]);
    });
};

