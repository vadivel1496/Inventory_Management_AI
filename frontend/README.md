# Inventory Management System - Frontend

This is the Angular frontend for the Inventory Management System.

## Features

- **Authentication**: Login/logout functionality with JWT tokens
- **Dashboard**: Overview of inventory statistics and recent activities
- **Product Management**: CRUD operations for products with filtering and search
- **Category Management**: Manage product categories
- **Stock Management**: Track stock movements and inventory levels
- **Analytics**: Charts and reports for inventory insights
- **User Management**: Admin-only user management (for admin users)

## Technology Stack

- **Angular 17**: Frontend framework
- **Angular Material**: UI component library
- **TypeScript**: Programming language
- **RxJS**: Reactive programming
- **Chart.js**: Data visualization
- **Nginx**: Web server for production

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Angular CLI

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:4200`.

## Build

To build the application for production:

```bash
npm run build
```

The built files will be in the `dist/inventory-frontend` directory.

## Docker

To run the frontend with Docker:

```bash
# Build the image
docker build -t inventory-frontend .

# Run the container
docker run -p 4200:80 inventory-frontend
```

## Project Structure

```
src/
├── app/
│   ├── components/          # Angular components
│   │   ├── auth/           # Authentication components
│   │   ├── dashboard/      # Dashboard components
│   │   ├── products/       # Product management
│   │   ├── categories/     # Category management
│   │   ├── stock/          # Stock management
│   │   ├── analytics/      # Analytics and reports
│   │   └── shared/         # Shared components
│   ├── services/           # API services
│   ├── models/             # TypeScript interfaces
│   ├── guards/             # Route guards
│   └── interceptors/       # HTTP interceptors
├── environments/           # Environment configurations
└── assets/                # Static assets
```

## API Integration

The frontend communicates with the backend API through HTTP services. All API calls include JWT authentication tokens automatically.

## Development

### Adding New Components

1. Generate a new component:
```bash
ng generate component components/feature-name
```

2. Add the component to the appropriate module
3. Add routing if needed

### Adding New Services

1. Generate a new service:
```bash
ng generate service services/service-name
```

2. Implement the service methods
3. Inject the service where needed

## Testing

Run the test suite:

```bash
npm test
```

## Deployment

The application is configured for deployment with Docker. The production build is served by Nginx for optimal performance.

## Environment Configuration

Update the environment files to configure API endpoints:

- `src/environments/environment.ts` - Development
- `src/environments/environment.prod.ts` - Production

## Contributing

1. Follow Angular style guide
2. Use TypeScript strict mode
3. Write unit tests for new features
4. Update documentation as needed 