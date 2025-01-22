exports.up = function(knex) {
    return knex.schema.createTable('refresh_tokens', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.string('token').notNullable();
      table.foreign('user_id').references('user_id').inTable('users').onDelete('CASCADE');
      table.timestamps(true, true);
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('refresh_tokens');
  };