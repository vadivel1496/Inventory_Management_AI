# Product Requirements Document (PRD)
## Simple Inventory Management API

### Executive Summary

The Simple Inventory Management API is a comprehensive backend solution designed to provide robust inventory management capabilities through a RESTful API. The system is built with Node.js and Express.js, utilizing PostgreSQL for data persistence, and is designed to integrate seamlessly with an Angular frontend application.

**Key Objectives:**
- Provide complete CRUD operations for inventory items and categories
- Implement real-time stock tracking with automated alerts
- Offer advanced search and filtering capabilities
- Ensure data security through JWT authentication
- Maintain comprehensive audit trails
- Support containerized deployment with Docker

**Target Users:**
- Inventory managers and warehouse staff
- Frontend developers integrating with Angular applications
- System administrators managing the deployment

**Success Metrics:**
- API response time < 200ms for standard operations
- 99.9% uptime for production deployment
- Complete test coverage for all endpoints
- Zero data loss through proper backup strategies

---

### Technical Architecture

#### Technology Stack
- **Backend Framework:** Node.js with Express.js
- **Database:** PostgreSQL 15+
- **API Documentation:** Swagger/OpenAPI 3.0
- **Database Management:** Adminer
- **Containerization:** Docker with docker-compose
- **Authentication:** JWT (JSON Web Tokens)
- **Validation:** Joi for request validation
- **Testing:** Jest with Supertest
- **Logging:** Winston

#### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Angular       │    │   Node.js       │    │   PostgreSQL    │
│   Frontend      │◄──►│   Express API   │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Adminer       │
                       │   (DB Admin)    │
                       └─────────────────┘
```

#### Docker Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose                           │
├─────────────────┬─────────────────┬─────────────────────────┤
│   app:3000      │   postgres:5432 │   adminer:8080         │
│   Node.js API   │   PostgreSQL    │   Database Admin       │
└─────────────────┴─────────────────┴─────────────────────────┘
```

---

### API Specifications

#### Base URL
- Development: `http://localhost:3000/api/v1`
- Production: `https://api.inventory.com/api/v1`

#### Authentication
All endpoints (except login/register) require JWT authentication via Authorization header:
```
Authorization: Bearer <jwt_token>
```

#### Response Format
All API responses follow a consistent format:
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": []
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Endpoint Specifications

##### Authentication Endpoints

**POST /auth/login**
- **Description:** Authenticate user and return JWT token
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "token": "jwt_token_here",
      "user": {
        "id": 1,
        "email": "user@example.com",
        "name": "John Doe",
        "role": "admin"
      }
    }
  }
  ```

**POST /auth/register**
- **Description:** Register new user
- **Request Body:**
  ```json
  {
    "name": "John Doe",
    "email": "user@example.com",
    "password": "password123",
    "role": "user"
  }
  ```

##### Product Management Endpoints

**GET /products**
- **Description:** Get paginated list of products
- **Query Parameters:**
  - `page` (number): Page number (default: 1)
  - `limit` (number): Items per page (default: 10, max: 100)
  - `search` (string): Search by name or SKU
  - `category` (number): Filter by category ID
  - `minPrice` (number): Minimum price filter
  - `maxPrice` (number): Maximum price filter
  - `inStock` (boolean): Filter by stock availability
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "products": [...],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 100,
        "pages": 10
      }
    }
  }
  ```

**GET /products/:id**
- **Description:** Get product by ID
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "name": "Product Name",
      "description": "Product description",
      "sku": "SKU123",
      "category": {
        "id": 1,
        "name": "Electronics"
      },
      "price": 99.99,
      "quantity": 50,
      "supplier": {
        "name": "Supplier Name",
        "email": "supplier@example.com"
      },
      "lowStockThreshold": 10,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

**POST /products**
- **Description:** Create new product
- **Request Body:**
  ```json
  {
    "name": "Product Name",
    "description": "Product description",
    "sku": "SKU123",
    "categoryId": 1,
    "price": 99.99,
    "quantity": 50,
    "supplier": {
      "name": "Supplier Name",
      "email": "supplier@example.com",
      "phone": "+1234567890"
    },
    "lowStockThreshold": 10
  }
  ```

**PUT /products/:id**
- **Description:** Update product
- **Request Body:** Same as POST /products

**DELETE /products/:id**
- **Description:** Delete product (soft delete)

##### Category Management Endpoints

**GET /categories**
- **Description:** Get all categories
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "Electronics",
        "description": "Electronic products",
        "productCount": 25
      }
    ]
  }
  ```

**POST /categories**
- **Description:** Create new category
- **Request Body:**
  ```json
  {
    "name": "Category Name",
    "description": "Category description"
  }
  ```

**PUT /categories/:id**
- **Description:** Update category

**DELETE /categories/:id**
- **Description:** Delete category (if no products associated)

##### Stock Management Endpoints

**POST /products/:id/stock**
- **Description:** Update stock quantity
- **Request Body:**
  ```json
  {
    "quantity": 10,
    "type": "in", // "in" or "out"
    "reason": "Purchase order received",
    "reference": "PO-12345"
  }
  ```

**GET /products/low-stock**
- **Description:** Get products below low stock threshold
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "Product Name",
        "quantity": 5,
        "lowStockThreshold": 10
      }
    ]
  }
  ```

**GET /stock-movements**
- **Description:** Get stock movement history
- **Query Parameters:**
  - `productId` (number): Filter by product
  - `type` (string): "in" or "out"
  - `startDate` (string): Start date filter
  - `endDate` (string): End date filter

##### Search and Analytics Endpoints

**GET /products/search**
- **Description:** Advanced search with multiple criteria
- **Query Parameters:**
  - `q` (string): Search query
  - `fields` (string): Comma-separated fields to search

**GET /analytics/dashboard**
- **Description:** Get dashboard analytics
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "totalProducts": 1000,
      "totalValue": 50000.00,
      "lowStockItems": 15,
      "outOfStockItems": 5,
      "recentMovements": [...]
    }
  }
  ```

---

### Database Design

#### Database Schema

**Users Table**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Categories Table**
```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Products Table**
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    supplier_name VARCHAR(255),
    supplier_email VARCHAR(255),
    supplier_phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Stock Movements Table**
```sql
CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('in', 'out')),
    reason TEXT,
    reference VARCHAR(255),
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Audit Logs Table**
```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Indexes
```sql
-- Performance indexes
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
```

---

### Security Requirements

#### Authentication & Authorization
- JWT-based authentication with configurable expiration
- Role-based access control (admin, user)
- Password hashing using bcrypt
- Token refresh mechanism

#### Input Validation
- Request validation using Joi schemas
- SQL injection prevention through parameterized queries
- XSS protection through input sanitization
- Rate limiting on authentication endpoints

#### Data Protection
- HTTPS enforcement in production
- CORS configuration for Angular frontend
- Environment variable management
- Database connection encryption

#### Audit Trail
- Comprehensive logging of all CRUD operations
- User action tracking with timestamps
- Data change history preservation

---

### Testing Strategy

#### Unit Testing
- Jest framework for unit tests
- Test coverage target: 90%+
- Mock database connections
- Test all business logic functions

#### Integration Testing
- Supertest for API endpoint testing
- Test database setup/teardown
- Authentication flow testing
- Error handling validation

#### Test Categories
1. **Authentication Tests**
   - Login/register functionality
   - Token validation
   - Role-based access

2. **Product Management Tests**
   - CRUD operations
   - Validation rules
   - Search and filtering

3. **Stock Management Tests**
   - Stock updates
   - Low stock alerts
   - Movement tracking

4. **Error Handling Tests**
   - Invalid input handling
   - Database error scenarios
   - Authentication failures

---

### Deployment Guide

#### Development Environment

**Prerequisites:**
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

**Setup Steps:**
1. Clone repository
2. Copy `.env.example` to `.env` and configure
3. Run `docker-compose up -d`
4. Access API at `http://localhost:3000`
5. Access Adminer at `http://localhost:8080`

#### Production Environment

**Docker Configuration:**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/inventory
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=inventory
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

**Environment Variables:**
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Server
PORT=3000
NODE_ENV=production

# CORS
CORS_ORIGIN=https://your-frontend-domain.com
```

#### Monitoring & Logging
- Winston logging with file rotation
- Health check endpoint
- Database connection monitoring
- Error tracking and alerting

---

### API Documentation (Swagger/OpenAPI)

The complete Swagger documentation will be available at:
- Development: `http://localhost:3000/api-docs`
- Production: `https://api.inventory.com/api-docs`

The documentation includes:
- All endpoint definitions
- Request/response schemas
- Authentication requirements
- Example requests and responses
- Error codes and messages

---

### Angular Integration Considerations

#### Response Format Optimization
- Consistent data structure for Angular services
- Pagination metadata for list components
- Error handling compatible with Angular interceptors

#### CORS Configuration
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

#### Angular Service Structure
```typescript
// Example Angular service structure
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
```

---

### Timeline and Milestones

**Phase 1 (Week 1-2):**
- Basic project setup and Docker configuration
- Database schema implementation
- Core CRUD endpoints for products and categories

**Phase 2 (Week 3-4):**
- Authentication system implementation
- Stock management features
- Search and filtering capabilities

**Phase 3 (Week 5-6):**
- Audit trail implementation
- Comprehensive testing
- API documentation

**Phase 4 (Week 7-8):**
- Production deployment preparation
- Performance optimization
- Security hardening

---

### Risk Assessment

**Technical Risks:**
- Database performance with large datasets
- JWT token security vulnerabilities
- Docker container resource limitations

**Mitigation Strategies:**
- Database indexing and query optimization
- Regular security audits and token rotation
- Resource monitoring and scaling plans

---

### Success Criteria

1. **Functional Requirements:**
   - All CRUD operations working correctly
   - Authentication system secure and functional
   - Stock tracking accurate and real-time
   - Search and filtering performant

2. **Non-Functional Requirements:**
   - API response time < 200ms
   - 99.9% uptime in production
   - 90%+ test coverage
   - Complete API documentation

3. **Integration Requirements:**
   - Seamless Angular frontend integration
   - Docker deployment working correctly
   - Database persistence and backup strategies





