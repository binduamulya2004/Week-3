exports.up = function (knex) {
    return knex.schema
        .createTable('carts', (table) => {
            table.increments('id').primary();
            table.integer('user_id').unsigned().notNullable();
            table.integer('product_id').unsigned().notNullable();
            table.integer('vendor_id').unsigned().notNullable();
            table.integer('quantity').notNullable().defaultTo(1);
            table.timestamps(true, true);

            // Foreign key constraints
            table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
            table.foreign('product_id').references('product_id').inTable('products').onDelete('CASCADE');
            table.foreign('vendor_id').references('vendor_id').inTable('vendors').onDelete('CASCADE');

            // Unique constraint
            table.unique(['user_id', 'product_id', 'vendor_id']);
        });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('carts');
};
