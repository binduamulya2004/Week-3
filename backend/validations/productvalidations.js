const Joi = require('joi');

const productSchema = Joi.object({
    product_name: Joi.string().trim().min(1).required().messages({
        'string.empty': 'Product name cannot be empty',
        'any.required': 'Product name is required'
    }),
    vendors: Joi.string().trim().required().messages({
        'string.empty': 'Vendors cannot be empty',
        'any.required': 'Vendors are required'
    }),
    category_name: Joi.string().trim().required().messages({
        'string.empty': 'Category name cannot be empty',
        'any.required': 'Category name is required'
    }),
    unit_price: Joi.number().positive().required().messages({
        'number.base': 'Unit price must be a number',
        'number.positive': 'Unit price must be greater than zero',
        'any.required': 'Unit price is required'
    }),
    quantity_in_stock: Joi.number().integer().min(0).required().messages({
        'number.base': 'Quantity must be a number',
        'number.min': 'Quantity cannot be negative',
        'any.required': 'Quantity is required'
    })
}).unknown(true);  // Allow extra fields

const normalizeCase = (value) => value.trim().toLowerCase();

const validateProduct = (data) => {
    // Normalize vendors and category_name before validation
    if (data.vendors) data.vendors = normalizeCase(data.vendors);
    if (data.category_name) data.category_name = normalizeCase(data.category_name);

    return productSchema.validate(data, { abortEarly: false });
};

module.exports = { validateProduct };
