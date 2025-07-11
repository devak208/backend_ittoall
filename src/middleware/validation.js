import Joi from 'joi';

// Validation schemas
const schemas = {
  registerDevice: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    androidId: Joi.string().min(10).max(100).required().messages({
      'string.min': 'Android ID must be at least 10 characters long',
      'string.max': 'Android ID must not exceed 100 characters',
      'any.required': 'Android ID is required',
    }),
    notes: Joi.string().max(500).optional(),
  }),

  approveDevice: Joi.object({
    actionBy: Joi.string().max(255).optional().default('admin'),
    notes: Joi.string().max(500).optional(),
  }),

  extendApproval: Joi.object({
    additionalDays: Joi.number().integer().min(1).max(365).optional().default(3),
    actionBy: Joi.string().max(255).optional().default('admin'),
    notes: Joi.string().max(500).optional(),
  }),

  disableDevice: Joi.object({
    actionBy: Joi.string().max(255).optional().default('admin'),
    notes: Joi.string().max(500).optional(),
  }),

  rejectDevice: Joi.object({
    actionBy: Joi.string().max(255).optional().default('admin'),
    notes: Joi.string().max(500).optional(),
  }),

  androidIdParam: Joi.object({
    androidId: Joi.string().min(10).max(100).required().messages({
      'string.min': 'Android ID must be at least 10 characters long',
      'string.max': 'Android ID must not exceed 100 characters',
      'any.required': 'Android ID is required',
    }),
  }),

  // Product validation schemas
  product: Joi.object({
    proCode: Joi.string().min(1).max(50).required().messages({
      'string.min': 'Product code must be at least 1 character long',
      'string.max': 'Product code must not exceed 50 characters',
      'any.required': 'Product code is required',
    }),
    productName: Joi.string().min(1).max(255).required().messages({
      'string.min': 'Product name must be at least 1 character long',
      'string.max': 'Product name must not exceed 255 characters',
      'any.required': 'Product name is required',
    }),
    price: Joi.number().positive().precision(2).required().messages({
      'number.positive': 'Price must be a positive number',
      'any.required': 'Price is required',
    }),
    description: Joi.string().max(1000).optional().allow(''),
  }),

  productUpdate: Joi.object({
    proCode: Joi.string().min(1).max(50).optional().messages({
      'string.min': 'Product code must be at least 1 character long',
      'string.max': 'Product code must not exceed 50 characters',
    }),
    productName: Joi.string().min(1).max(255).optional().messages({
      'string.min': 'Product name must be at least 1 character long',
      'string.max': 'Product name must not exceed 255 characters',
    }),
    price: Joi.number().positive().precision(2).optional().messages({
      'number.positive': 'Price must be a positive number',
    }),
    description: Joi.string().max(1000).optional().allow(''),
    isActive: Joi.boolean().optional(),
  }).min(1),
};

// Validation middleware factory
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = source === 'params' ? req.params : req.body;
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorDetails,
      });
    }

    // Update request with validated data
    if (source === 'params') {
      req.params = value;
    } else {
      req.body = value;
    }

    next();
  };
};

// Export validation schemas
export const validationSchemas = schemas;

// Product validation middleware
export const validateProduct = validate(schemas.product);
export const validateProductUpdate = validate(schemas.productUpdate);
