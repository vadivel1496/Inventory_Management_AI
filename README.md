# Inventory Management System

A comprehensive inventory management system with a Node.js/Express backend API and Angular frontend.

## Features

### Backend API
- **Authentication**: JWT-based authentication with role-based access control
- **Product Management**: CRUD operations for products with categories and suppliers
- **Stock Management**: Track stock movements and inventory levels
- **Category Management**: Organize products by categories
- **Analytics**: Dashboard analytics and reporting
- **User Management**: Admin and user roles with different permissions
- **API Documentation**: Swagger/OpenAPI documentation

### Frontend (Angular)
- **Modern UI**: Material Design with Angular Material components
- **Responsive Design**: Mobile-friendly interface
- **Authentication**: Login/logout with JWT token management
- **Dashboard**: Real-time inventory overview and statistics
- **Product Management**: Complete product lifecycle management
- **Stock Tracking**: Visual stock status and movement tracking
- **Analytics**: Charts and reports for business insights
- **User Management**: Admin interface for user management

## Technology Stack

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **PostgreSQL**: Database
- **JWT**: Authentication
- **Swagger**: API documentation
- **Jest**: Testing framework

### Frontend
- **Angular 17**: Frontend framework
- **Angular Material**: UI component library
- **TypeScript**: Programming language
- **RxJS**: Reactive programming
- **Chart.js**: Data visualization
- **Nginx**: Production web server

## Project Structure

```
Inventory_AI/
├── src/                    # Backend source code
│   ├── app.js             # Main application file
│   ├── database/          # Database configuration and migrations
│   ├── middleware/        # Express middleware
│   ├── routes/            # API routes
│   ├── tests/             # Backend tests
│   └── utils/             # Utility functions
├── frontend/              # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/    # Angular components
│   │   │   ├── services/      # API services
│   │   │   ├── models/        # TypeScript interfaces
│   │   │   ├── guards/        # Route guards
│   │   │   └── interceptors/  # HTTP interceptors
│   │   └── environments/      # Environment configurations
│   ├── Dockerfile         # Frontend Docker configuration
│   └── nginx.conf         # Nginx configuration
├── docker-compose.yml     # Docker orchestration
├── Dockerfile            # Backend Docker configuration
└── README.md             # This file
```

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL (for local development)

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd Inventory_AI
```

2. Start all services:
```bash
docker-compose up -d
```

3. Access the applications:
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api-docs
- **Database Admin**: http://localhost:8081

### Local Development

#### Backend Setup
1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp env.example .env
# Edit .env with your configuration
```

3. Start the database:
```bash
docker-compose up postgres -d
```

4. Run migrations and seed data:
```bash
npm run migrate
npm run seed
```

5. Start the development server:
```bash
npm run dev
```

#### Frontend Setup
1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/users` - Get all users (admin only)
- `PUT /api/v1/auth/users/:id` - Update user (admin only)
- `DELETE /api/v1/auth/users/:id` - Delete user (admin only)

### Products
- `GET /api/v1/products` - Get products with filtering
- `GET /api/v1/products/:id` - Get product by ID
- `POST /api/v1/products` - Create new product
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Delete product

### Categories
- `GET /api/v1/categories` - Get all categories
- `GET /api/v1/categories/:id` - Get category by ID
- `POST /api/v1/categories` - Create new category
- `PUT /api/v1/categories/:id` - Update category
- `DELETE /api/v1/categories/:id` - Delete category

### Stock Management
- `POST /api/v1/stock/products/:id` - Update stock quantity
- `GET /api/v1/stock/movements` - Get stock movements
- `GET /api/v1/stock/products/:id/history` - Get product stock history

### Analytics
- `GET /api/v1/analytics/dashboard` - Get dashboard analytics
- `GET /api/v1/analytics/categories` - Get category distribution
- `GET /api/v1/analytics/products/top` - Get top products
- `GET /api/v1/analytics/trends/monthly` - Get monthly trends

## Default Credentials

- **Admin User**: admin@inventory.com / admin123
- **Database**: inventory_db / inventory_user / inventory_pass

## Development

### Backend Development
- Run tests: `npm test`
- Run tests with coverage: `npm run test:coverage`
- Run tests in watch mode: `npm run test:watch`

### Frontend Development
- Run tests: `npm test`
- Build for production: `npm run build`
- Lint code: `npm run lint`

## Deployment

### Production Deployment
1. Build the Docker images:
```bash
docker-compose build
```

2. Set production environment variables
3. Deploy using Docker Compose or your preferred container orchestration

### Environment Variables

#### Backend
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 3000)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT signing secret
- `JWT_EXPIRES_IN`: JWT token expiration
- `CORS_ORIGIN`: Allowed CORS origins

#### Frontend
- `API_URL`: Backend API URL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
