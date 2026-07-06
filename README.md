# YAS Laptop Service Center

A complete modern responsive web application for laptop service management, built with HTML5, CSS3, Vanilla JavaScript, and Node.js. Features a premium dark blue and white theme with glassmorphism design, supporting three user roles (Customer, Employee, Technician) and an Admin panel.

## Version 2.0 - Major Updates

### Technical Improvements
- **Enhanced API Structure**: RESTful endpoints for all resources (Users, Requests, Products, Orders, Categories, Stats)
- **MongoDB Integration**: Full Mongoose models with automatic fallback to JSON storage
- **Environment Configuration**: `.env` support for secure configuration management
- **Rate Limiting**: Built-in API rate limiting for security
- **Unit Testing**: Jest test suite with comprehensive API coverage
- **Request Logging**: Automatic request logging for debugging

### UI/UX Enhancements
- **Dark Mode Toggle**: System-wide dark/light mode with localStorage persistence
- **Advanced Animations**: Scroll reveal, hover effects, and smooth transitions
- **Mobile Responsiveness**: Improved mobile menu with smooth animations
- **SEO Optimization**: Meta tags, Open Graph, Twitter cards, and sitemap
- **Accessibility**: Reduced motion support and high contrast mode

## Features

### Customer Features
- **Landing Page**: Beautiful hero section, services overview, why choose us, and contact information
- **Maintenance Request Submission**: Form to submit laptop repair requests with automatic request number generation
- **Request Tracking**: Track request status by phone number or request number with timeline and progress bar

### Employee Features (Customer Service)
- **Dashboard**: View statistics and manage maintenance requests
- **Request Management**: View, search, filter, and edit maintenance requests
- **Status Updates**: Update request status and add notes
- **Technician Assignment**: Send requests to technicians
- **Order Management**: View and manage purchase orders
- **Product Management**: Edit product information and stock

### Technician Features
- **Dashboard**: View assigned requests and statistics
- **Request Processing**: Accept/reject requests, update maintenance status
- **Technical Reports**: Add technical notes, cost estimates, and completion dates
- **Parts Management**: Log replacement parts used
- **Completion**: Mark requests as ready and return to customer service

### Admin Features
- **Dashboard**: Comprehensive statistics with Chart.js visualizations
- **User Management**: Create, edit, and delete user accounts
- **Product Management**: Full CRUD operations for products
- **Category Management**: Manage product categories
- **Statistics**: View total requests, open requests, completed requests, revenue, and more
- **Charts**: Visual representations of data (requests, revenue, products)

## Technology Stack

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Custom styling with glassmorphism effects, advanced animations
- **Vanilla JavaScript**: No frameworks or libraries (except Chart.js for admin charts)
- **LocalStorage**: Client-side data persistence
- **Font Awesome**: Icons
- **Google Fonts**: Tajawal, Cairo, Poppins typography
- **Chart.js**: Data visualization (Admin panel only)
- **Animate.css**: CSS animations library

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MongoDB + Mongoose**: Database with ODM (optional, falls back to JSON)
- **dotenv**: Environment variable management
- **cors**: Cross-origin resource sharing
- **express-rate-limit**: API rate limiting
- **bcryptjs**: Password hashing (for future authentication)
- **jsonwebtoken**: JWT tokens (for future authentication)

### Testing
- **Jest**: Testing framework
- **Supertest**: HTTP assertion library

## Project Structure

```
project/
├── index.html                    # Landing page
├── customer.html                 # Maintenance request form
├── track.html                    # Request tracking page
├── admin.html                    # Admin dashboard
├── server.js                     # Express server with API
├── package.json                  # Dependencies and scripts
├── .env                          # Environment variables
├── .env.example                  # Environment variables template
├── db.json                       # JSON database (fallback)
├── sitemap.xml                   # SEO sitemap
├── robots.txt                    # SEO robots file
├── jest.config.js                # Jest configuration
├── models/                       # Mongoose models
│   ├── User.js                   # User model
│   ├── Request.js                # Request model
│   ├── Product.js                # Product model
│   └── Order.js                  # Order model
├── css/
│   ├── style.css                 # Main styles
│   ├── dashboard.css             # Dashboard-specific styles
│   ├── responsive.css            # Responsive design
│   ├── ai-animations.css         # AI-powered animations
│   └── advanced-animations.css   # Advanced animation library
├── js/
│   ├── app.js                    # Shared utilities and functionality
│   ├── storage.js                # LocalStorage management
│   ├── customer.js               # Customer functionality
│   ├── admin.js                  # Admin panel
│   ├── darkmode.js               # Dark mode toggle
│   └── mobile-menu.js            # Mobile menu functionality
├── tests/                        # Test files
│   ├── server.test.js            # API tests
│   └── storage.test.js           # Storage utility tests
└── assets/
    ├── images/                    # Image assets
    └── icons/                     # Icon assets
```

## Installation

### Option 1: Static Mode (No Backend)
1. Clone or download the project
2. Open `index.html` in a web browser
3. No build process or dependencies required

### Option 2: Full Backend Mode
1. Clone or download the project
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure your settings
4. (Optional) Set up MongoDB and update `MONGODB_URI` in `.env`
5. Start the server: `npm start` or `npm run dev`
6. Open `http://localhost:3000` in your browser

### Running Tests
```bash
npm test
```

## Default Credentials

### Admin
- **Username**: admin
- **Password**: admin123

### Employee (Customer Service)
- **Username**: employee
- **Password**: emp123

### Technician
- **Username**: technician
- **Password**: tech123

## Usage Guide

### For Customers

1. **Submit a Repair Request**
   - Navigate to "Submit Request" from the home page
   - Fill in the form with your details and laptop information
   - Submit and note your request number (e.g., YAS-000001)

2. **Track Your Request**
   - Go to "Track Request"
   - Enter your phone number or request number
   - View current status, timeline, and estimated completion date

3. **Shop for Products**
   - Browse the online store
   - Filter by category or search for products
   - Add items to cart
   - Proceed to checkout and place order

### For Employees

1. **Login**
   - Go to employee login page
   - Enter credentials (employee/emp123)
   - Access dashboard

2. **Manage Requests**
   - View all maintenance requests
   - Search and filter by status or priority
   - Click on a request to view details
   - Update status, add notes, or send to technician

3. **Manage Orders**
   - View customer purchase orders
   - Track order status

4. **Manage Products**
   - View all products
   - Edit product details and stock

### For Technicians

1. **Login**
   - Go to technician login page
   - Enter credentials (technician/tech123)
   - Access dashboard

2. **Process Requests**
   - View assigned requests
   - Accept or reject requests
   - Update maintenance status
   - Add technical reports and cost estimates
   - Log replacement parts
   - Mark as completed when ready

### For Admins

1. **Access Admin Panel**
   - Go to admin.html (auto-logs in as admin)
   - View comprehensive dashboard statistics

2. **Manage Users**
   - Create new user accounts
   - Edit existing users
   - Delete users (except yourself)

3. **Manage Products**
   - Add new products
   - Edit product details
   - Delete products

4. **View Statistics**
   - Request status distribution (doughnut chart)
   - Revenue trends (line chart)
   - Products by category (bar chart)

## Design Features

- **Glassmorphism**: Modern glass-like card effects with blur and transparency
- **Dark Mode/Light Mode**: Toggle between themes
- **Responsive Design**: Mobile-first approach, works on all devices
- **Smooth Animations**: Hover effects, transitions, and loading states
- **Toast Notifications**: User-friendly feedback messages
- **Modal Windows**: For forms and confirmations
- **Professional Typography**: Poppins font for clean readability
- **Color Palette**: Premium dark blue and white theme

## Data Storage

All data is stored in the browser's LocalStorage, including:
- Users and authentication
- Maintenance requests
- Products and categories
- Orders and cart items
- User preferences (dark mode)

**Note**: Data persists only in the browser. Clearing browser data will reset the application.

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Modern mobile browsers

## Customization

### Changing Colors

Edit CSS variables in `css/style.css`:

```css
:root {
    --primary-blue: #1e3a8a;
    --secondary-blue: #3b82f6;
    --light-blue: #60a5fa;
    --dark-blue: #0f172a;
    /* ... more variables */
}
```

### Adding New Products

Products can be added through the Admin panel or by modifying the default data in `js/storage.js`.

### Modifying Request Status Flow

Edit the status flow in the relevant JavaScript files (customer.js, employee.js, technician.js).

## Security Notes

This is a client-side demonstration application. For production use:
- Implement server-side authentication
- Use secure database storage
- Add input sanitization
- Implement CSRF protection
- Use HTTPS
- Add rate limiting

## API Endpoints

### Health & Data
- `GET /api/health` - Health check
- `GET /api/data` - Get all data (legacy)
- `POST /api/data` - Save/merge all data (legacy)

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get specific user
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Requests
- `GET /api/requests` - Get all requests
- `GET /api/requests/:id` - Get specific request
- `POST /api/requests` - Create new request
- `PUT /api/requests/:id` - Update request
- `DELETE /api/requests/:id` - Delete request

### Products
- `GET /api/products` - Get all products (supports category & search filters)
- `GET /api/products/:id` - Get specific product
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get specific order
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order

### Categories & Cart
- `GET /api/categories` - Get all categories
- `GET /api/cart` - Get cart items
- `POST /api/cart` - Save cart items

### Statistics
- `GET /api/stats` - Get application statistics

## New Features in v2.0

### Dark Mode
- Toggle between dark and light themes
- Persists preference in localStorage
- Respects system color scheme preference
- Smooth transitions between modes

### Advanced Animations
- Scroll reveal animations for sections
- Hover effects on cards and buttons
- Smooth page transitions
- Loading skeletons for better UX
- Reduced motion support for accessibility

### Mobile Improvements
- Responsive mobile menu with smooth animations
- Touch-friendly interface
- Optimized layouts for all screen sizes
- Improved navigation on small screens

### SEO Enhancements
- Meta tags for search engines
- Open Graph tags for social media
- Twitter Card support
- XML sitemap
- robots.txt configuration

## Future Enhancements

- Email notifications
- SMS alerts for status updates
- Payment gateway integration
- File upload for device images
- Advanced reporting and analytics
- Multi-language support
- Customer reviews and ratings
- Real-time chat support
- Mobile app (React Native)

## License

This project is for demonstration purposes. Feel free to use and modify as needed.

## Support

For issues or questions, please refer to the code comments or contact the development team.

---

**YAS Laptop Service Center** - Professional Laptop Repair & Services
