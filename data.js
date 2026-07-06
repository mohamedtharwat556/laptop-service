/**
 * In-memory data storage for development
 * Replaces Supabase when not connected
 */

const data = {
  users: [
    {
      id: 1,
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      name: 'System Administrator',
      email: 'admin@yas.com',
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      username: 'employee',
      password: 'emp123',
      role: 'employee',
      name: 'Customer Service',
      email: 'service@yas.com',
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      username: 'technician',
      password: 'tech123',
      role: 'technician',
      name: 'Senior Technician',
      email: 'tech@yas.com',
      createdAt: new Date().toISOString()
    }
  ],
  requests: [
    {
      id: 1,
      requestNumber: 'REQ-001',
      fullName: 'Ahmed Hassan',
      phone: '01012345678',
      laptopBrand: 'Dell',
      laptopModel: 'XPS 15',
      problemDescription: 'Laptop not turning on',
      status: 'Received',
      priority: 'High',
      adminReply: '',
      estimatedCompletionDate: '',
      cost: 0,
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      requestNumber: 'REQ-002',
      fullName: 'Fatima Ali',
      phone: '01098765432',
      laptopBrand: 'HP',
      laptopModel: 'Pavilion',
      problemDescription: 'Screen display issue',
      status: 'Under Maintenance',
      priority: 'Medium',
      adminReply: 'Screen replacement in progress',
      estimatedCompletionDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      cost: 500,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      requestNumber: 'REQ-003',
      fullName: 'Mohammed Ibrahim',
      phone: '01156789012',
      laptopBrand: 'Lenovo',
      laptopModel: 'ThinkPad',
      problemDescription: 'Hard drive failure',
      status: 'Waiting Parts',
      priority: 'High',
      adminReply: 'New SSD on order',
      estimatedCompletionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      cost: 1200,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  products: [
    {
      id: 1,
      name: 'Dell XPS 15',
      category: 'Laptops',
      price: 1499,
      description: 'High-performance laptop with Intel i7, 16GB RAM, 512GB SSD',
      image: 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=Dell+XPS+15',
      stock: 10,
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      name: 'HP Pavilion Gaming',
      category: 'Laptops',
      price: 899,
      description: 'Gaming laptop with Ryzen 5, 8GB RAM, 256GB SSD',
      image: 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=HP+Pavilion',
      stock: 15,
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      name: '65W Laptop Charger',
      category: 'Chargers',
      price: 45,
      description: 'Universal laptop charger with multiple tips',
      image: 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=Charger',
      stock: 50,
      createdAt: new Date().toISOString()
    },
    {
      id: 4,
      name: 'Wireless Mouse',
      category: 'Accessories',
      price: 25,
      description: 'Ergonomic wireless mouse with precision tracking',
      image: 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=Mouse',
      stock: 100,
      createdAt: new Date().toISOString()
    },
    {
      id: 5,
      name: 'Mechanical Keyboard',
      category: 'Accessories',
      price: 79,
      description: 'RGB mechanical keyboard with cherry switches',
      image: 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=Keyboard',
      stock: 30,
      createdAt: new Date().toISOString()
    }
  ],
  orders: [
    {
      id: 1,
      orderNumber: 'ORD-001',
      customerId: 1,
      total: 1524,
      status: 'Completed',
      items: [
        { productId: 1, quantity: 1, price: 1499 },
        { productId: 3, quantity: 1, price: 25 }
      ],
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      orderNumber: 'ORD-002',
      customerId: 2,
      total: 899,
      status: 'Pending',
      items: [
        { productId: 2, quantity: 1, price: 899 }
      ],
      createdAt: new Date().toISOString()
    }
  ]
};

module.exports = data;
