import express from 'express';
import { ProductController } from '../controllers/productController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import { validateProduct, validateProductUpdate } from '../middleware/validation.js';

const router = express.Router();
const productController = new ProductController();

/**
 * @route   POST /api/v1/products
 * @desc    Add a new product
 * @access  Private (Admin only)
 */
router.post('/', requireAdmin, validateProduct, productController.addProduct);

/**
 * @route   GET /api/v1/products
 * @desc    List all products with optional filtering and pagination
 * @access  Public
 * @query   ?includeInactive=true&search=keyword&page=1&limit=10
 */
router.get('/', productController.listAllProducts);

/**
 * @route   GET /api/v1/products/all
 * @desc    List all products without pagination limits
 * @access  Public
 * @query   ?includeInactive=true&search=keyword
 */
router.get('/all', productController.listAllProductsNoLimit);

/**
 * @route   GET /api/v1/products/filter
 * @desc    Filter products with advanced filtering options
 * @access  Public
 * @query   ?search=keyword&minPrice=10&maxPrice=100&includeInactive=false&sortBy=name&sortOrder=asc&limit=20
 */
router.get('/filter', productController.filterProducts);

/**
 * @route   GET /api/v1/products/search/code/:proCode
 * @desc    Search products by product code
 * @access  Public
 */
router.get('/search/code/:proCode', productController.searchByCode);

/**
 * @route   GET /api/v1/products/search
 * @desc    Advanced product search with suggestions
 * @access  Public
 * @query   ?query=apple&searchBy=name&suggestions=true
 */
router.get('/search', productController.searchProducts);  // ✅ Added this line

/**
 * @route   GET /api/v1/products/:identifier
 * @desc    Get a particular product by ID or Product Code
 * @access  Public
 * @query   ?byCode=true (to search by product code instead of ID)
 */
router.get('/:identifier', productController.getProduct);

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Edit/Update an existing product
 * @access  Private (Admin only)
 */
router.put('/:id', requireAdmin, validateProductUpdate, productController.editProduct);

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Delete a product (soft delete by default)
 * @access  Private (Admin only)
 * @query   ?permanent=true (for hard delete)
 */
router.delete('/:id', requireAdmin, productController.deleteProduct);

/**
 * @route   PATCH /api/v1/products/:id/restore
 * @desc    Restore a soft-deleted product
 * @access  Private (Admin only)
 */
router.patch('/:id/restore', requireAdmin, productController.restoreProduct);

export default router;
