import Joi from 'joi';
import logger from '../utils/logger.js';

// Product validation schema
const productSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required(),
  sku: Joi.string().trim().min(1).max(50).required(),
  category: Joi.string().trim().min(1).max(100).required(),
  price: Joi.number().positive().precision(2).required(),
  quantity_in_stock: Joi.number().integer().min(0).default(0),
  reorder_level: Joi.number().integer().min(0).default(10),
  supplier_id: Joi.string().allow(null),
});

// User validation schema
const userSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('admin', 'cashier').default('cashier'),
});

// Login validation schema
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Sale validation schema
const saleSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      product_id: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required(),
      unit_price: Joi.number().positive().precision(2).required(),
    })
  ).min(1).required(),
  payment_method: Joi.string().valid('cash', 'card', 'check').required(),
  notes: Joi.string().allow(''),
});

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((d) => d.message).join(', ');
      logger.warn(`Validation error: ${messages}`, { path: req.path });
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details 
      });
    }

    req.validatedData = value;
    next();
  };
};

export const validateProduct = validate(productSchema);
export const validateUser = validate(userSchema);
export const validateLogin = validate(loginSchema);
export const validateSale = validate(saleSchema);
