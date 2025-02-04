const db = require('../mysql/connection');

module.exports = {
  async createUser(userData) {
    return db('users').insert(userData);
  },
  async findByEmail(email) {
    return db('users').where({ email }).first();
  },
  async findEmail(email) {
  return db('users')
    .select('user_id', 'username', 'email', 'profile_pic') // Include profile photo
    .where({ email })
    .first();
},

  async findByUsername(username) {
    return db('users').where({ username }).first();
  },
  async updateProfilePic(email, url) {
    return db('users').where({ email }).update({ profile_pic: url });
  },
  async findById(id) {
    return knex('users').where({ user_id: id }).first();
  },

  async storeRefreshToken(userId, refreshToken) {
    return knex('refresh_tokens').insert({ user_id: userId, token: refreshToken });
  },

  async getRefreshToken(userId) {
    return knex('refresh_tokens').where({ user_id: userId }).first();
  },

  async deleteRefreshToken(userId) {
    return knex('refresh_tokens').where({ user_id: userId }).del();
  },
  // Example of querying users based on their role (for admin purposes or role-specific logic)
  async findByRole(role) {
    return db('users').where({ role });
  },
};
