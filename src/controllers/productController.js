import { db } from '../database/connection.js';
import { products } from '../database/schemas/products.js';
import { eq, like, and, count, lt, gt, lte, gte, or,desc, asc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';


export class ProductController {
  /**
   * Add a new product
   * @route POST /api/v1/products
   */
  addProduct = async (req, res, next) => {
    try {
      const { proCode, productName, price, description } = req.body;

      // Validation
      if (!proCode || !productName || !price) {
        return res.status(400).json({
          success: false,
          message: 'Product code, product name, and price are required',
        });
      }

      // Check if product code already exists
      const existingProduct = await db
        .select()
        .from(products)
        .where(eq(products.proCode, proCode))
        .limit(1);

      if (existingProduct.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Product with code '${proCode}' already exists`,
        });
      }

      // Use transaction for insert and fetch
      let newProduct;
      await db.transaction(async (tx) => {
        // Insert the product without specifying ID (let it auto-increment)
        await tx
          .insert(products)
          .values({
            proCode: proCode.trim(),
            productName: productName.trim(),
            price: price.toString(),
            description: description?.trim() || null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          
        // Fetch the newly inserted product by its proCode (which is unique)
        const result = await tx
          .select()
          .from(products)
          .where(eq(products.proCode, proCode.trim()))
          .limit(1);
          
        newProduct = result[0];
      });

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: newProduct,
      });
    } catch (error) {
      console.error('Error adding product:', error);
      next(error);
    }
  };

  /**
   * Edit/Update an existing product
   * @route PUT /api/v1/products/:id
   */
  editProduct = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { proCode, productName, price, description, isActive } = req.body;

      // Check if product exists
      const existingProduct = await db
        .select()
        .from(products)
        .where(and(eq(products.id, id), eq(products.isActive, true)))
        .limit(1);

      if (existingProduct.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      // If proCode is being updated, check for uniqueness
      if (proCode && proCode !== existingProduct[0].proCode) {
        const duplicateProCode = await db
          .select()
          .from(products)
          .where(and(eq(products.proCode, proCode), eq(products.isActive, true)))
          .limit(1);

        if (duplicateProCode.length > 0) {
          return res.status(409).json({
            success: false,
            message: `Product with code '${proCode}' already exists`,
          });
        }
      }

      // Prepare update data
      const updateData = {
        updatedAt: new Date(),
      };

      if (proCode !== undefined) updateData.proCode = proCode.trim();
      if (productName !== undefined) updateData.productName = productName.trim();
      if (price !== undefined) updateData.price = price.toString();
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (isActive !== undefined) updateData.isActive = isActive;

      // Use transaction for update and fetch
      let updatedProduct;
      await db.transaction(async (tx) => {
        // Update the product
        await tx
          .update(products)
          .set(updateData)
          .where(eq(products.id, id));
          
        // Fetch the updated product
        const result = await tx
          .select()
          .from(products)
          .where(eq(products.id, id))
          .limit(1);
          
        updatedProduct = result[0];
      });

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: updatedProduct,
      });
    } catch (error) {
      console.error('Error updating product:', error);
      next(error);
    }
  };

  /**
   * Delete a product (soft delete)
   * @route DELETE /api/v1/products/:id
   */
  deleteProduct = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { permanent } = req.query; // ?permanent=true for hard delete

      // Check if product exists
      const existingProduct = await db
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1);

      if (existingProduct.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      if (permanent === 'true') {
        // Hard delete - permanently remove from database
        await db.delete(products).where(eq(products.id, id));

        res.json({
          success: true,
          message: 'Product permanently deleted',
        });
      } else {
        // Soft delete - mark as inactive
        let deletedProduct;
        await db.transaction(async (tx) => {
          // Update the product to inactive
          await tx
            .update(products)
            .set({
              isActive: false,
              updatedAt: new Date(),
            })
            .where(eq(products.id, id));
            
          // Fetch the updated product
          const result = await tx
            .select()
            .from(products)
            .where(eq(products.id, id))
            .limit(1);
            
          deletedProduct = result[0];
        });

        res.json({
          success: true,
          message: 'Product deleted successfully',
          data: deletedProduct,
        });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      next(error);
    }
  };


  /**
   * List products with cursor-based pagination for infinite scroll
   * @route GET /api/v1/products
   */
  listAllProducts = async (req, res, next) => {
    try {
      const { 
        includeInactive = 'false', 
        search = '', 
        limit = 20,
        cursor = null,
        direction = 'next'
      } = req.query;
      
      // Build where conditions
      let whereConditions = [];
      
      // Include/exclude inactive products
      if (includeInactive !== 'true') {
        whereConditions.push(eq(products.isActive, true));
      }

      // Search functionality
      if (search) {
        whereConditions.push(
          // Search in product name or product code
          like(products.productName, `%${search}%`)
        );
      }

      // Add cursor condition for pagination if cursor is provided
      if (cursor) {
        try {
          // Decode the cursor (it's a base64 encoded string with format "proCode|id")
          const decodedString = Buffer.from(cursor, 'base64').toString();
          const [cursorProCode, cursorId] = decodedString.split('|');
          
          // Add condition based on direction
          if (direction === 'next') {
            // For "next" direction, get products with proCode < cursorProCode OR
            // (proCode = cursorProCode AND id < cursorId)
            whereConditions.push(
              or(
                lt(products.proCode, cursorProCode),
                and(
                  eq(products.proCode, cursorProCode),
                  lt(products.id, cursorId)
                )
              )
            );
          } else if (direction === 'prev') {
            // For "prev" direction, get products with proCode > cursorProCode OR
            // (proCode = cursorProCode AND id > cursorId)
            whereConditions.push(
              or(
                gt(products.proCode, cursorProCode),
                and(
                  eq(products.proCode, cursorProCode),
                  gt(products.id, cursorId)
                )
              )
            );
          }
        } catch (error) {
          console.error('Invalid cursor format:', error);
          // If cursor is invalid, ignore it and continue without cursor condition
        }
      }

      // Combine conditions
      const whereClause = whereConditions.length > 0 
        ? and(...whereConditions) 
        : undefined;

      // Get products with cursor-based pagination
      // Order by createdAt DESC for newest first (typical for infinite scroll)
      const orderDirection = direction === 'prev' ? 'asc' : 'desc';
      
      const allProducts = await db
  .select()
  .from(products)
  .where(whereClause)
  .limit(parseInt(limit) + 1)
  .orderBy(
    orderDirection === 'asc' ? products.proCode : desc(products.proCode),
    orderDirection === 'asc' ? products.id : desc(products.id)
  );

      // Check if there are more items
      const hasMore = allProducts.length > parseInt(limit);
      
      // Remove the extra item if there are more
      const resultsToReturn = hasMore ? allProducts.slice(0, parseInt(limit)) : allProducts;

      // Get the next cursor from the last item
      let nextCursor = null;
      let prevCursor = null;
      
      // Update cursor generation to use proCode and id
      if (resultsToReturn.length > 0) {
      // Next cursor combines proCode and id of the last item
      const lastItem = resultsToReturn[resultsToReturn.length - 1];
      nextCursor = Buffer.from(`${lastItem.proCode}|${lastItem.id}`).toString('base64');
      
      // Previous cursor combines proCode and id of the first item
      const firstItem = resultsToReturn[0];
      prevCursor = Buffer.from(`${firstItem.proCode}|${firstItem.id}`).toString('base64');
      }

      // If we're going backwards, reverse the results to maintain chronological order
      if (direction === 'prev') {
        resultsToReturn.reverse();
      }

      // Set cache control headers to prevent caching
      res.set('Cache-Control', 'no-store');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      res.json({
        success: true,
        data: resultsToReturn,
        pagination: {
          hasMore,
          nextCursor,
          prevCursor,
          count: resultsToReturn.length,
        },
        timestamp: new Date().getTime() // Add timestamp to ensure fresh responses
      });
    } catch (error) {
      console.error('Error listing products:', error);
      next(error);
    }
  };

  /**
   * List all products without pagination
   * @route GET /api/v1/products/all
   */
 listAllProductsNoLimit = async (req, res, next) => {
  try {
    const { 
      search = '', 
      minPrice, 
      maxPrice, 
      includeInactive = 'false', 
      sortBy = 'name', // 'name', 'code', 'price', 'created' 
      sortOrder = 'asc', // 'asc', 'desc' 
      limit = 'all', // Changed from 20 to 'all' to indicate no limit
      cursor = null, 
      direction = 'next' 
    } = req.query;

    // Build where conditions
    let whereConditions = [];

    // Include/exclude inactive products
    if (includeInactive !== 'true') {
      whereConditions.push(eq(products.isActive, true));
    }

    // Search functionality
    if (search) {
      whereConditions.push(
        like(products.productName, `%${search}%`)
      );
    }

    // Combine conditions
    const whereClause = whereConditions.length > 0
      ? and(...whereConditions)
      : undefined;

    // Fetch all products in ASC order (proCode, id)
    const allProducts = await db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(
        asc(products.proCode),
        asc(products.id)
      );

    // Set cache control headers to prevent caching
    res.set('Cache-Control', 'no-store');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.json({
      success: true,
      data: allProducts,
      count: allProducts.length,
      timestamp: new Date().getTime()
    });
  } catch (error) {
    console.error('Error listing all products:', error);
    next(error);
  }
};


  /**
   * Get a particular product by ID or Product Code
   * @route GET /api/v1/products/:identifier
   */
  getProduct = async (req, res, next) => {
    try {
      const { identifier } = req.params;
      const { byCode = 'false' } = req.query;

      let product;

      if (byCode === 'true') {
        // Search by product code
        product = await db
          .select()
          .from(products)
          .where(and(
            eq(products.proCode, identifier),
            eq(products.isActive, true)
          ))
          .limit(1);
      } else {
        // Search by ID
        product = await db
          .select()
          .from(products)
          .where(and(
            eq(products.id, identifier),
            eq(products.isActive, true)
          ))
          .limit(1);
      }

      if (product.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Product not found with ${byCode === 'true' ? 'code' : 'ID'}: ${identifier}`,
        });
      }

      res.json({
        success: true,
        data: product[0],
      });
    } catch (error) {
      console.error('Error getting product:', error);
      next(error);
    }
  };

  /**
   * Search products by product code
   * @route GET /api/v1/products/search/code/:proCode
   */
  searchByCode = async (req, res, next) => {
    try {
      const { proCode } = req.params;

      const product = await db
        .select()
        .from(products)
        .where(and(
          like(products.proCode, `%${proCode}%`),
          eq(products.isActive, true)
        ))
        .limit(10);

      res.json({
        success: true,
        data: product,
        count: product.length,
      });
    } catch (error) {
      console.error('Error searching products by code:', error);
      next(error);
    }
  };

  /**
   * Restore a soft-deleted product
   * @route PATCH /api/v1/products/:id/restore
   */
  restoreProduct = async (req, res, next) => {
    try {
      const { id } = req.params;

      // Check if product exists (including inactive ones)
      const existingProduct = await db
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1);

      if (existingProduct.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }
      // Check if product is already active
      if (existingProduct[0].isActive) {
        return res.status(400).json({
          success: false,
          message: 'Product is already active',
        });
      }

      // Use transaction for update and fetch
      let restoredProduct;
      await db.transaction(async (tx) => {
        // Update the product to active
        await tx
          .update(products)
          .set({
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(products.id, id));
          
        // Fetch the updated product
        const result = await tx
          .select()
          .from(products)
          .where(eq(products.id, id))
          .limit(1);
          
        restoredProduct = result[0];
      });

      res.json({
        success: true,
        message: 'Product restored successfully',
        data: restoredProduct,
      });
    } catch (error) {
      console.error('Error restoring product:', error);
      next(error);
    }
  };

    /**
   * Get the sort field based on the sortBy parameter
   * @private
   */
  getSortField = (sortBy) => {
    switch (sortBy) {
      case 'name':
        return products.productName;
      case 'code':
        return products.proCode;
      case 'price':
        return sql`CAST(${products.price} AS DECIMAL)`;
      case 'created':
        return products.createdAt;
      default:
        return products.productName;
    }
  };

  /**
   * Get the sort value from an item based on the sortBy parameter
   * @private
   */
  getSortValue = (item, sortBy) => {
    switch (sortBy) {
      case 'name':
        return item.productName;
      case 'code':
        return item.proCode;
      case 'price':
        return item.price;
      case 'created':
        return item.createdAt;
      default:
        return item.productName;
    }
  };

  /**
   * Build the order by clause based on sort parameters
   * @private
   */
  buildOrderByClause = (sortBy, sortOrder, direction) => {
    const sortField = this.getSortField(sortBy);
    const orderDirection = sortOrder === 'desc' ? desc : asc;
    
    // If direction is 'prev', we need to invert the sort order
    const finalOrderDirection = direction === 'prev' ? 
      (sortOrder === 'desc' ? asc : desc) : 
      orderDirection;
    
    return [
      finalOrderDirection(sortField),
      finalOrderDirection(products.id) // Secondary sort by ID for consistency
    ];
  };

  /**
   * Filter products with advanced filtering options
   * @route GET /api/v1/products/filter
   */
  filterProducts = async (req, res, next) => { 
    try { 
      const { 
        search = '', 
        minPrice, 
        maxPrice, 
        includeInactive = 'false', 
        sortBy = 'name', // 'name', 'code', 'price', 'created' 
        sortOrder = 'asc', // 'asc', 'desc' 
        limit = 20, 
        cursor = null, 
        direction = 'next' 
      } = req.query; 

      let whereConditions = []; 

      // Include/exclude inactive products 
      if (includeInactive !== 'true') { 
        whereConditions.push(eq(products.isActive, true)); 
      } 

      // Search functionality 
      if (search.trim()) { 
        whereConditions.push( 
          or( 
            like(products.productName, `%${search.trim()}%`), 
            like(products.proCode, `%${search.trim()}%`), 
            like(products.description, `%${search.trim()}%`) 
          ) 
        ); 
      } 

      // Price filtering 
      if (minPrice !== undefined && !isNaN(parseFloat(minPrice))) { 
        whereConditions.push( 
          gte(sql`CAST(${products.price} AS DECIMAL)`, parseFloat(minPrice)) 
        ); 
      } 

      if (maxPrice !== undefined && !isNaN(parseFloat(maxPrice))) { 
        whereConditions.push( 
          lte(sql`CAST(${products.price} AS DECIMAL)`, parseFloat(maxPrice)) 
        ); 
      } 

      // Cursor-based pagination 
      if (cursor) { 
        try { 
          const decodedString = Buffer.from(cursor, 'base64').toString(); 
          const [cursorValue, cursorId] = decodedString.split('|'); 
          
          // Build cursor condition based on sort field 
          let cursorCondition; 
          const sortField = this.getSortField(sortBy); 
          
          if (direction === 'next') { 
            cursorCondition = or( 
              lt(sortField, cursorValue), 
              and(eq(sortField, cursorValue), lt(products.id, cursorId)) 
            ); 
          } else { 
            cursorCondition = or( 
              gt(sortField, cursorValue), 
              and(eq(sortField, cursorValue), gt(products.id, cursorId)) 
            ); 
          } 
          
          whereConditions.push(cursorCondition); 
        } catch (error) { 
          console.error('Invalid cursor format:', error); 
        } 
      } 

      const whereClause = whereConditions.length > 0 
        ? and(...whereConditions) 
        : undefined; 

      // Build order by clause 
      const orderByClause = this.buildOrderByClause(sortBy, sortOrder, direction); 

      // Get filtered products 
      let query = db
        .select()
        .from(products)
        .where(whereClause)
        .orderBy(...orderByClause);

      // Initialize variables
      let hasMore = false;
      let filteredProducts;
      let resultsToReturn;

      // Apply limit only if not 'all'
      if (limit !== 'all') {
        query = query.limit(parseInt(limit) + 1);
        filteredProducts = await query;
        hasMore = filteredProducts.length > parseInt(limit);
        resultsToReturn = hasMore ? filteredProducts.slice(0, parseInt(limit)) : filteredProducts;
      } else {
        // When returning all products, there are no more results beyond what we've fetched
        filteredProducts = await query;
        resultsToReturn = filteredProducts;
      }
      
      // Generate cursors 
      let nextCursor = null; 
      let prevCursor = null; 
      
      if (resultsToReturn.length > 0) { 
        const lastItem = resultsToReturn[resultsToReturn.length - 1]; 
        const firstItem = resultsToReturn[0]; 
        
        const lastSortValue = this.getSortValue(lastItem, sortBy); 
        const firstSortValue = this.getSortValue(firstItem, sortBy); 
        
        nextCursor = Buffer.from(`${lastSortValue}|${lastItem.id}`).toString('base64'); 
        prevCursor = Buffer.from(`${firstSortValue}|${firstItem.id}`).toString('base64'); 
      } 

      // If going backwards, reverse results 
      if (direction === 'prev') { 
        resultsToReturn.reverse(); 
      } 

      // Get total count for the current filters (optional, can be expensive) 
      const totalCount = await db 
        .select({ count: count() }) 
        .from(products) 
        .where(whereClause); 

      res.json({ 
        success: true, 
        data: resultsToReturn, 
        pagination: { 
          hasMore, 
          nextCursor, 
          prevCursor, 
          count: resultsToReturn.length, 
          totalCount: totalCount[0]?.count || 0 
        }, 
        filters: { 
          search, 
          minPrice, 
          maxPrice, 
          includeInactive, 
          sortBy, 
          sortOrder 
        }, 
        timestamp: new Date().getTime() 
      }); 
    } catch (error) { 
      console.error('Error filtering products:', error); 
      next(error); 
    } 
  };

  /**
   * Generate search suggestions based on query
   * @private
   */
  generateSuggestions = async (query, includeInactive = 'false') => {
    try {
      // Build where conditions for suggestions
      let whereConditions = [];
      
      // Include/exclude inactive products
      if (includeInactive !== 'true') {
        whereConditions.push(eq(products.isActive, true));
      }
      
      // Get suggestions for product names starting with the query
      // This prioritizes suggestions that start with the query
      const nameSuggestions = await db
        .select({
          value: products.productName,
          type: sql`'name'`,
          id: products.id
        })
        .from(products)
        .where(
          and(
            like(products.productName, `${query}%`),
            ...whereConditions
          )
        )
        .limit(5)
        .orderBy(asc(products.productName));
      
      // Get suggestions for product codes starting with the query
      const codeSuggestions = await db
        .select({
          value: products.proCode,
          type: sql`'code'`,
          id: products.id
        })
        .from(products)
        .where(
          and(
            like(products.proCode, `${query}%`),
            ...whereConditions
          )
        )
        .limit(5)
        .orderBy(asc(products.proCode));
      
      // Combine and return unique suggestions
      const allSuggestions = [...nameSuggestions, ...codeSuggestions];
      
      // Remove duplicates based on value
      const uniqueSuggestions = allSuggestions.filter((suggestion, index, self) =>
        index === self.findIndex((s) => s.value === suggestion.value)
      );
      
      return uniqueSuggestions.slice(0, 10); // Return at most 10 suggestions
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [];
    }
  };

  /**
   * Advanced search with auto-suggestions
   * @route GET /api/v1/products/search
   */
  searchProducts = async (req, res, next) => {
    try {
      const { 
        query = '', 
        searchBy = 'all', // 'all', 'name', 'code', 'description'
        limit = 10,
        includeInactive = 'false',
        suggestions = 'true' // Enable/disable auto-suggestions
      } = req.query;

      if (!query.trim()) {
        return res.json({
          success: true,
          data: [],
          suggestions: [],
          count: 0,
        });
      }

      const trimmedQuery = query.trim();
      let whereConditions = [];

      // Include/exclude inactive products
      if (includeInactive !== 'true') {
        whereConditions.push(eq(products.isActive, true));
      }

      // Build search conditions based on searchBy parameter
      let searchConditions = [];

      switch (searchBy) {
        case 'name':
          searchConditions.push(
            like(products.productName, `%${trimmedQuery}%`)
          );
          break;
        case 'code':
          searchConditions.push(
            like(products.proCode, `%${trimmedQuery}%`)
          );
          break;
        case 'description':
          searchConditions.push(
            like(products.description, `%${trimmedQuery}%`)
          );
          break;
        default: // 'all'
          searchConditions.push(
            or(
              like(products.productName, `%${trimmedQuery}%`),
              like(products.proCode, `%${trimmedQuery}%`),
              like(products.description, `%${trimmedQuery}%`)
            )
          );
      }

      whereConditions.push(or(...searchConditions));

      const whereClause = and(...whereConditions);

      // Get search results
      const searchResults = await db
        .select()
        .from(products)
        .where(whereClause)
        .limit(parseInt(limit))
        .orderBy(
  sql`CASE 
    WHEN LOWER(${products.productName}) = LOWER(${trimmedQuery}) THEN 1
    WHEN LOWER(${products.proCode}) = LOWER(${trimmedQuery}) THEN 2
    WHEN LOWER(${products.productName}) LIKE LOWER(${trimmedQuery + '%'}) THEN 3
    WHEN LOWER(${products.proCode}) LIKE LOWER(${trimmedQuery + '%'}) THEN 4
    ELSE 5
  END`,
  asc(products.productName)
);


      // Generate auto-suggestions if enabled
      let suggestionResults  = [];
      if (req.query.suggestions === 'true' && trimmedQuery.length >= 2) {
  suggestionResults = await this.generateSuggestions(trimmedQuery, includeInactive);
}


      res.json({
        success: true,
        data: searchResults,
        suggestions:suggestionResults,
        count: searchResults.length,
        query: trimmedQuery,
        searchBy
      });
    } catch (error) {
      console.error('Error searching products:', error);
      next(error);
    }
  };

}
