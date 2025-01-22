const knex = require('../mysql/connection');

module.exports = {
  async storeRefreshToken(userId, token) {
    await knex('refresh_tokens').insert({ user_id: userId, token });
  },

  async findRefreshToken(token) {
    return await knex('refresh_tokens').where('token', token).first();
  },

  async deleteRefreshToken(token) {
    await knex('refresh_tokens').where('token', token).del();
  },
};