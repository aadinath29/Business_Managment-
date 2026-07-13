# Node.js + pg Pool Integration Guide

This guide outlines the best practices for integrating the generated PostgreSQL schema with a Node.js Express backend using the `pg` (node-postgres) library, completely avoiding ORMs.

## 1. Prerequisites

First, install the required dependencies:
```bash
npm install pg dotenv
npm install -D @types/pg
```

## 2. Environment Configuration

Create or update your `.env` file in the root of your `backend` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=kosqu_admin
DB_PASSWORD=your_secure_password
DB_NAME=lead_management_db

# Pool Configuration
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_CONN_TIMEOUT=2000
```

## 3. Recommended Folder Structure

Organize your database connection layer using the Repository Pattern to keep SQL queries out of your business logic (Services/Controllers).

```text
backend/
├── src/
│   ├── db/
│   │   ├── index.js          # Connection Pool singleton
│   │   ├── transactions.js   # Transaction helper utility
│   ├── repositories/
│   │   ├── leadRepository.js # Raw SQL for leads
│   │   ├── userRepository.js # Raw SQL for users
```

## 4. Connection Pool Implementation (`src/db/index.js`)

Never create a new connection per request. Export a singleton `Pool` instance:

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  
  // Connection Pool configuration
  max: parseInt(process.env.DB_POOL_MAX || '20', 10), // Maximum connections
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10), // Close idle clients
  connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONN_TIMEOUT || '2000', 10), // Return error after 2s if pool is full
});

// Centralized error handling for idle clients
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  // Query method for standard requests
  query: (text, params) => pool.query(text, params),
  
  // Expose pool to get a dedicated client for transactions
  getClient: () => pool.connect(),
};
```

## 5. Transactions Best Practices (`src/db/transactions.js`)

For operations that modify multiple tables (e.g., converting a lead to a project), use a transaction wrapper:

```javascript
const db = require('./index');

/**
 * Wraps a callback function in a database transaction
 * @param {Function} callback - Function receiving the connected client
 */
const withTransaction = async (callback) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    // ALWAYS release the client back to the pool
    client.release();
  }
};

module.exports = { withTransaction };
```

## 6. Using Repositories

Enforce multi-tenancy dynamically in all queries. Never trust client input for `tenant_id`.

```javascript
// src/repositories/leadRepository.js
const db = require('../db');

const getLeadsByTenant = async (tenantId) => {
  const sql = `
    SELECT id, name, company_name, status, budget 
    FROM leads 
    WHERE tenant_id = $1 AND deleted_at IS NULL
    ORDER BY created_at DESC
  `;
  const { rows } = await db.query(sql, [tenantId]);
  return rows;
};

module.exports = { getLeadsByTenant };
```

## 7. PostgreSQL Database Setup

Run these commands in your SQL client (e.g., `psql` or pgAdmin) to initialize the database before running your node application:

```sql
-- 1. Create the database
CREATE DATABASE lead_management_db;

-- 2. Connect to the database
\c lead_management_db

-- 3. Execute the schema script (Replace path)
\i '/path/to/backend/database/schema.sql'

-- 4. Execute the seed script (Replace path)
\i '/path/to/backend/database/seed.sql'
```

## 8. Error Handling Recommendations

Always catch PostgreSQL error codes specifically. Common codes:
- `23505`: Unique violation (e.g., duplicate email)
- `23503`: Foreign key violation
- `23502`: Not null violation

```javascript
try {
  await db.query('INSERT INTO ...');
} catch (error) {
  if (error.code === '23505') {
    throw new Error('A user with this email already exists.');
  }
  throw error;
}
```
