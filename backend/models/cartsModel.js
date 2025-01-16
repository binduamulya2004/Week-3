const knex = require('../mysql/connection');

const getAllCartItems = (userId) => {
  return knex('carts')
    .join('products', 'carts.product_id', '=', 'products.product_id')
    .join('vendors', 'carts.vendor_id', '=', 'vendors.vendor_id')
    .select(
      'carts.id',
      'carts.quantity',
      'products.product_id',
      'products.product_name',
      'products.product_image',
      'vendors.vendor_id',
      'vendors.vendor_name'
    )
    .where('carts.user_id', userId);
};

const getCartItemById = (cartId) => {
  return knex('carts')
    .join('products', 'carts.product_id', '=', 'products.product_id')
    .join('vendors', 'carts.vendor_id', '=', 'vendors.vendor_id')
    .select(
      'carts.id',
      'carts.quantity',
      'products.product_id',
      'products.product_name',
      'products.product_image',
      'vendors.vendor_id',
      'vendors.vendor_name'
    )
    .where('carts.id', cartId)
    .first();
};

const addItemToCart = (cartData) => {
  return knex('carts').insert(cartData);
};

const updateCartItem = (cartId, cartData) => {
  return knex('carts').where('id', cartId).update(cartData);
};

const deleteCartItem = (cartId) => {
  return knex('carts').where('id', cartId).del();
};

module.exports = {
  getAllCartItems,
  getCartItemById,
  addItemToCart,
  updateCartItem,
  deleteCartItem,
};