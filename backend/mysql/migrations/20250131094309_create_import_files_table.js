exports.up = function (knex) {
    return knex.schema.createTable('import_files', function (table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.string('file_url').notNullable();
      table.string('file_name').notNullable();
      table.enum('status', ['pending', 'completed', 'error']).defaultTo('pending');
      table.string('error_file_url').nullable(); // Stores S3 URL of the error file if any
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.foreign('user_id').references('users.id').onDelete('CASCADE');
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable('import_files');
  };
  