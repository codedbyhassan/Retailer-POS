import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'server_db.json');

const DEFAULT_DATA = {
  users: [
    {
      id: 'usr_admin',
      name: 'Amina Diallo',
      email: 'admin@retailer.com',
      role: 'admin',
      passwordHash: 'admin123',
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr_cashier',
      name: 'Kofi Mensah',
      email: 'cashier@retailer.com',
      role: 'cashier',
      passwordHash: 'cashier123',
      active: true,
      createdAt: new Date().toISOString()
    }
  ],
  products: [
    {
      id: 'prod_1',
      name: 'Soap (Anti-bacterial)',
      sku: 'SKU-SOAP-01',
      barcode: '1001',
      category: 'Hygiene',
      costPrice: 0.80,
      sellingPrice: 1.50,
      quantity: 50,
      reorderLevel: 10,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod_2',
      name: 'Rice (Jasmine 1kg)',
      sku: 'SKU-RICE-01',
      barcode: '1002',
      category: 'Food',
      costPrice: 2.00,
      sellingPrice: 3.50,
      quantity: 20,
      reorderLevel: 8,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod_3',
      name: 'Cooking Oil 1L',
      sku: 'SKU-OIL-01',
      barcode: '1003',
      category: 'Food',
      costPrice: 4.50,
      sellingPrice: 6.80,
      quantity: 12,
      reorderLevel: 5,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod_4',
      name: 'Fresh Milk 1L',
      sku: 'SKU-MILK-01',
      barcode: '1004',
      category: 'Dairy',
      costPrice: 1.20,
      sellingPrice: 2.20,
      quantity: 5,
      reorderLevel: 10,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod_5',
      name: 'Bread (Whole Wheat)',
      sku: 'SKU-BREAD-01',
      barcode: '1005',
      category: 'Bakery',
      costPrice: 0.90,
      sellingPrice: 1.80,
      quantity: 15,
      reorderLevel: 5,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  sales: [],
  inventoryLogs: [
    {
      id: 'log_init_1',
      productId: 'prod_1',
      productName: 'Soap (Anti-bacterial)',
      type: 'IN',
      quantity: 50,
      reason: 'Initial Inventory Stocking',
      createdAt: new Date().toISOString()
    },
    {
      id: 'log_init_2',
      productId: 'prod_2',
      productName: 'Rice (Jasmine 1kg)',
      type: 'IN',
      quantity: 20,
      reason: 'Initial Inventory Stocking',
      createdAt: new Date().toISOString()
    },
    {
      id: 'log_init_3',
      productId: 'prod_3',
      type: 'IN',
      productName: 'Cooking Oil 1L',
      quantity: 12,
      reason: 'Initial Inventory Stocking',
      createdAt: new Date().toISOString()
    },
    {
      id: 'log_init_4',
      productId: 'prod_4',
      productName: 'Fresh Milk 1L',
      type: 'IN',
      quantity: 5,
      reason: 'Initial Inventory Stocking',
      createdAt: new Date().toISOString()
    },
    {
      id: 'log_init_5',
      productId: 'prod_5',
      productName: 'Bread (Whole Wheat)',
      type: 'IN',
      quantity: 15,
      reason: 'Initial Inventory Stocking',
      createdAt: new Date().toISOString()
    }
  ],
  settings: {
    businessName: 'Retailer Commerce',
    currency: 'GHS',
    currencySymbol: '₵',
    taxRate: 15,
    receiptFooter: 'Thank you for shopping with us.'
  }
};

class ServerDatabase {
  constructor() {
    this.data = { ...DEFAULT_DATA };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        this.save();
      }
    } catch (e) {
      console.error('Error loading server DB, using default data:', e);
      this.data = { ...DEFAULT_DATA };
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving server DB to file:', e);
    }
  }

  getUsers() { return this.data.users; }
  getProducts() { return this.data.products; }
  getSales() { return this.data.sales; }
  getInventoryLogs() { return this.data.inventoryLogs; }
  getSettings() { return this.data.settings; }

  updateSettings(settings) {
    this.data.settings = settings;
    this.save();
  }

  addUser(user) {
    this.data.users.push(user);
    this.save();
  }

  updateUser(updatedUser) {
    this.data.users = this.data.users.map(u => u.id === updatedUser.id ? updatedUser : u);
    this.save();
  }

  addProduct(product) {
    this.data.products.push(product);
    this.save();
  }

  updateProduct(updatedProduct) {
    this.data.products = this.data.products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    this.save();
  }

  addSale(sale) {
    this.data.sales.push(sale);
    
    sale.items.forEach(item => {
      const prod = this.data.products.find(p => p.id === item.productId);
      if (prod) {
        prod.quantity = Math.max(0, prod.quantity - item.quantity);
        prod.updatedAt = new Date().toISOString();
        
        this.data.inventoryLogs.push({
          id: `log_sale_${sale.id}_${item.productId}`,
          productId: item.productId,
          productName: prod.name,
          type: 'OUT',
          quantity: -item.quantity,
          reason: `Sale ${sale.invoiceNumber}`,
          createdAt: sale.createdAt
        });
      }
    });
    this.save();
  }

  addInventoryLog(log) {
    this.data.inventoryLogs.push(log);
    
    const prod = this.data.products.find(p => p.id === log.productId);
    if (prod) {
      prod.quantity = Math.max(0, prod.quantity + log.quantity);
      prod.updatedAt = new Date().toISOString();
    }
    this.save();
  }
}

export const serverDb = new ServerDatabase();
