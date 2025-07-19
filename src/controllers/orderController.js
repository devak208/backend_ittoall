import { db } from '../database/connection.js';
import { orders, orderItems } from '../database/schemas/orders.js';
import { products } from '../database/schemas/products.js';
import { eq, and, desc, asc, inArray } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { users } from '../database/schemas/auth.js';

export class OrderController {
  /**
   * Create a new order
   * @route POST /api/v1/orders
   */
  createOrder = async (req, res, next) => {
    try {
      let { userId, phoneNumber, items } = req.body;

      // Extract user ID from authentication token if available
      if (req.user && req.user.id) {
        console.log('✅ Authenticated user found:', req.user.email);
        // If user is authenticated, use their ID from the token
        userId = req.user.id;
        
        // Validate that the user exists in the database
        const userExists = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        
        if (userExists.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'User not found',
          });
        }
      } else {
        console.log('⚠️ No authenticated user found, proceeding with guest checkout');
      }

      // Validation
      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required',
        });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Order must contain at least one item',
        });
      }

      // Generate a unique order number (timestamp-based)
      const orderNumber = `ORD-${Date.now()}`;
      
      // Calculate total amount
      let totalAmount = 0;
      
      // Verify products and calculate totals
      const orderItemsData = [];
      const productIds = items.map(item => item.productId);
      
      // Fetch all products in one query - include inactive products too
      // This ensures we can still create orders with products that might be inactive
      const productsList = await db
        .select()
        .from(products)
        .where(inArray(products.id, productIds));
      
      // Create a map for quick lookup
      const productsMap = {};
      productsList.forEach(product => {
        productsMap[product.id] = product;
      });
      
      // Validate each item and prepare order items data
      for (const item of items) {
        const product = productsMap[item.productId];
        
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Product with ID ${item.productId} not found`,
          });
        }
        
        if (!item.quantity || item.quantity <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Quantity must be greater than zero',
          });
        }
        
        const itemTotal = parseFloat(product.price) * item.quantity;
        totalAmount += itemTotal;
        
        // Store complete product data in order items to preserve it
        // even if the product is later deleted or modified
        orderItemsData.push({
          productId: product.id,
          productCode: product.proCode,
          productName: product.productName,
          quantity: item.quantity,
          unitPrice: product.price,
          totalPrice: itemTotal.toFixed(2),
        });
      }
      
      // Use transaction to ensure data consistency
      let newOrder;
      let newOrderItems;
      
      await db.transaction(async (tx) => {
        // Insert the order
        const [orderResult] = await tx
          .insert(orders)
          .values({
            userId: userId || null,
            phoneNumber,
            orderNumber,
            totalAmount: totalAmount.toFixed(2),
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .execute();
        
        const orderId = orderResult.insertId;
        
        // Insert order items
        const orderItemsWithOrderId = orderItemsData.map(item => ({
          ...item,
          orderId,
          createdAt: new Date(),
        }));
        
        await tx
          .insert(orderItems)
          .values(orderItemsWithOrderId)
          .execute();
        
        // Fetch the newly created order with its items
        const [orderData] = await tx
          .select()
          .from(orders)
          .where(eq(orders.id, orderId));
        
        const orderItemsResult = await tx
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, orderId));
        
        newOrder = orderData;
        newOrderItems = orderItemsResult;
      });
      
      // Format the response
      const orderResponse = {
        ...newOrder,
        items: newOrderItems,
      };
      
      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: orderResponse,
      });
    } catch (error) {
      console.error('Error creating order:', error);
      next(error);
    }
  };

  /**
   * Get all orders with pagination
   * @route GET /api/v1/orders
   */
  getAllOrders = async (req, res, next) => {
    try {
      const { page = 1, limit = 10, userId, phoneNumber, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
      
      // Build where conditions
      const whereConditions = [];
      
      if (userId) {
        whereConditions.push(eq(orders.userId, userId));
      }
      
      if (phoneNumber) {
        whereConditions.push(eq(orders.phoneNumber, phoneNumber));
      }
      
      // Combine conditions
      const whereClause = whereConditions.length > 0 
        ? and(...whereConditions) 
        : undefined;
      
      // Calculate pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // Determine sort field and direction
      const sortField = orders[sortBy] || orders.createdAt;
      const sortDirection = sortOrder === 'asc' ? asc : desc;
      
      // Get orders with pagination
      const allOrders = await db
        .select()
        .from(orders)
        .where(whereClause)
        .limit(parseInt(limit))
        .offset(offset)
        .orderBy(sortDirection(sortField));
      
      // Get total count for pagination
      const [{ count: totalCount }] = await db
        .select({ count: sql`COUNT(*)` })
        .from(orders)
        .where(whereClause);
      
      // Fetch order items and user details for each order
      const ordersWithItemsAndUser = await Promise.all(
        allOrders.map(async (order) => {
          // Get order items
          const items = await db
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, order.id));
          
          // Get user details if userId exists
          let userDetails = null;
          if (order.userId) {
            const userResult = await db
              .select({
                id: users.id,
                name: users.name,
                email: users.email,
                emailVerified: users.emailVerified,
                image: users.image,
                role: users.role,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt
              })
              .from(users)
              .where(eq(users.id, order.userId))
              .limit(1);
            
            if (userResult.length > 0) {
              userDetails = userResult[0];
            }
          }
          
          return {
            ...order,
            items,
            user: userDetails // Add user details to the response
          };
        })
      );
      
      res.json({
        success: true,
        data: ordersWithItemsAndUser,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Error getting orders:', error);
      next(error);
    }
  };

  /**
   * Get order by ID
   * @route GET /api/v1/orders/:id
   */
  getOrderById = async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Get order
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, id))
        .limit(1);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }
      
      // Get order items
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      
      // Get user details if userId exists
      let userDetails = null;
      if (order.userId) {
        const [user] = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            emailVerified: users.emailVerified,
            image: users.image,
            role: users.role,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt
          })
          .from(users)
          .where(eq(users.id, order.userId))
          .limit(1);
        
        if (user) {
          userDetails = user;
        }
      }
      
      // Format response
      const orderResponse = {
        ...order,
        items,
        user: userDetails // Add user details to the response
      };
      
      res.json({
        success: true,
        data: orderResponse,
      });
    } catch (error) {
      console.error('Error getting order:', error);
      next(error);
    }
  };

  /**
   * Get orders by user ID
   * @route GET /api/v1/orders/user/:userId
   */
  getOrdersByUser = async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      // Get user details first
      const [userDetails] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          emailVerified: users.emailVerified,
          image: users.image,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (!userDetails) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }
      
      // Calculate pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // Get orders for user with pagination
      const userOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.userId, userId))
        .limit(parseInt(limit))
        .offset(offset)
        .orderBy(desc(orders.createdAt));
      
      // Get total count for pagination
      const [{ count: totalCount }] = await db
        .select({ count: sql`COUNT(*)` })
        .from(orders)
        .where(eq(orders.userId, userId));
      
      // Fetch order items for each order
      const ordersWithItems = await Promise.all(
        userOrders.map(async (order) => {
          const items = await db
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, order.id));
          
          return {
            ...order,
            items,
            user: userDetails // Add user details to each order
          };
        })
      );
      
      res.json({
        success: true,
        data: ordersWithItems,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Error getting orders by user:', error);
      next(error);
    }
  };

  /**
   * Get orders by phone number
   * @route GET /api/v1/orders/phone/:phoneNumber
   */
  getOrdersByPhone = async (req, res, next) => {
    try {
      const { phoneNumber } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      // Calculate pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // Get orders for phone number with pagination
      const phoneOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.phoneNumber, phoneNumber))
        .limit(parseInt(limit))
        .offset(offset)
        .orderBy(desc(orders.createdAt));
      
      // Get total count for pagination
      const [{ count: totalCount }] = await db
        .select({ count: sql`COUNT(*)` })
        .from(orders)
        .where(eq(orders.phoneNumber, phoneNumber));
      
      // Fetch order items and user details for each order
      const ordersWithItemsAndUser = await Promise.all(
        phoneOrders.map(async (order) => {
          // Get order items
          const items = await db
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, order.id));
          
          // Get user details if userId exists
          let userDetails = null;
          if (order.userId) {
            const [user] = await db
              .select({
                id: users.id,
                name: users.name,
                email: users.email,
                emailVerified: users.emailVerified,
                image: users.image,
                role: users.role,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt
              })
              .from(users)
              .where(eq(users.id, order.userId))
              .limit(1);
            
            if (user) {
              userDetails = user;
            }
          }
          
          return {
            ...order,
            items,
            user: userDetails // Add user details to the response
          };
        })
      );
      
      res.json({
        success: true,
        data: ordersWithItemsAndUser,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Error getting orders by phone:', error);
      next(error);
    }
  };

  /**
   * Get orders for the currently authenticated user
   * @route GET /api/v1/orders/my-orders
   */
  getMyOrders = async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;
      
      // Calculate pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // Get orders for the authenticated user with pagination
      const userOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.userId, userId))
        .limit(parseInt(limit))
        .offset(offset)
        .orderBy(desc(orders.createdAt));
      
      // Get total count for pagination
      const [{ count: totalCount }] = await db
        .select({ count: sql`COUNT(*)` })
        .from(orders)
        .where(eq(orders.userId, userId));
      
      // Get user details
      const [userDetails] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          emailVerified: users.emailVerified,
          image: users.image,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      // Fetch order items for each order
      const ordersWithItems = await Promise.all(
        userOrders.map(async (order) => {
          const items = await db
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, order.id));
          
          return {
            ...order,
            items,
            user: userDetails // Add user details to each order
          };
        })
      );
      
      res.json({
        success: true,
        data: ordersWithItems,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Error getting my orders:', error);
      next(error);
    }
  };
}