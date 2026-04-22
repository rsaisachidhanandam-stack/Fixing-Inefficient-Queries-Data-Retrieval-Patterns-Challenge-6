const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query'], // Enable query logging as requested to debug N+1
});

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// FIX 01 & 03: GET /products — Pagination, Sorting, and Field Selection
app.get('/products', async (req, res) => {
  try {
    let { page = 1, limit = 10, sortBy = 'id', order = 'asc', fields } = req.query;

    // Parse pagination params
    page = parseInt(page);
    limit = parseInt(limit);
    
    // MAX_LIMIT guard
    const MAX_LIMIT = 100;
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;
    if (isNaN(page) || page < 1) return res.status(400).json({ error: 'Page must be greater than 0' });

    // FIX 03: Field Selection Implementation
    const allowedFields = ['id', 'name', 'description', 'price', 'category', 'stock', 'imageUrl', 'createdAt', 'updatedAt'];
    let select;
    
    if (fields) {
      const requestedFields = fields.split(',').map(f => f.trim());
      select = {};
      
      for (const field of requestedFields) {
        if (!allowedFields.includes(field)) {
          return res.status(400).json({ error: `Invalid field requested: ${field}` });
        }
        select[field] = true;
      }
    }

    // Dynamic sorting
    const orderBy = {};
    if (allowedFields.includes(sortBy)) {
      orderBy[sortBy] = order.toLowerCase() === 'desc' ? 'desc' : 'asc';
    } else {
      orderBy['id'] = 'asc';
    }

    // Prisma query
    const skip = (page - 1) * limit;
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        skip,
        take: limit,
        orderBy,
        select, // Apply field selection if defined
      }),
      prisma.product.count(),
    ]);

    // Return results with meta object
    res.json({
      data: products,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// FIX 02: GET /orders — The N+1 Query Disaster Refactored
app.get('/orders', async (req, res) => {
  try {
    // Single query with include to eliminate N+1
    const orders = await prisma.order.findMany({
      include: {
        user: true, // Fetch user details in the same query
      },
    });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
