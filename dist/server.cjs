var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server/index.js
var import_express8 = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_vite = require("vite");

// server/routes/authRoutes.js
var import_express = __toESM(require("express"), 1);

// server/config/db.js
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var DB_FILE = import_path.default.join(process.cwd(), "server_db.json");
var DEFAULT_DATA = {
  users: [
    {
      id: "usr_admin",
      name: "Amina Diallo",
      email: "admin@retailer.com",
      role: "admin",
      passwordHash: "admin123",
      active: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "usr_cashier",
      name: "Kofi Mensah",
      email: "cashier@retailer.com",
      role: "cashier",
      passwordHash: "cashier123",
      active: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  ],
  products: [
    {
      id: "prod_1",
      name: "Soap (Anti-bacterial)",
      sku: "SKU-SOAP-01",
      barcode: "1001",
      category: "Hygiene",
      costPrice: 0.8,
      sellingPrice: 1.5,
      quantity: 50,
      reorderLevel: 10,
      archived: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "prod_2",
      name: "Rice (Jasmine 1kg)",
      sku: "SKU-RICE-01",
      barcode: "1002",
      category: "Food",
      costPrice: 2,
      sellingPrice: 3.5,
      quantity: 20,
      reorderLevel: 8,
      archived: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "prod_3",
      name: "Cooking Oil 1L",
      sku: "SKU-OIL-01",
      barcode: "1003",
      category: "Food",
      costPrice: 4.5,
      sellingPrice: 6.8,
      quantity: 12,
      reorderLevel: 5,
      archived: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "prod_4",
      name: "Fresh Milk 1L",
      sku: "SKU-MILK-01",
      barcode: "1004",
      category: "Dairy",
      costPrice: 1.2,
      sellingPrice: 2.2,
      quantity: 5,
      reorderLevel: 10,
      archived: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "prod_5",
      name: "Bread (Whole Wheat)",
      sku: "SKU-BREAD-01",
      barcode: "1005",
      category: "Bakery",
      costPrice: 0.9,
      sellingPrice: 1.8,
      quantity: 15,
      reorderLevel: 5,
      archived: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  ],
  sales: [],
  inventoryLogs: [
    {
      id: "log_init_1",
      productId: "prod_1",
      productName: "Soap (Anti-bacterial)",
      type: "IN",
      quantity: 50,
      reason: "Initial Inventory Stocking",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "log_init_2",
      productId: "prod_2",
      productName: "Rice (Jasmine 1kg)",
      type: "IN",
      quantity: 20,
      reason: "Initial Inventory Stocking",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "log_init_3",
      productId: "prod_3",
      type: "IN",
      productName: "Cooking Oil 1L",
      quantity: 12,
      reason: "Initial Inventory Stocking",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "log_init_4",
      productId: "prod_4",
      productName: "Fresh Milk 1L",
      type: "IN",
      quantity: 5,
      reason: "Initial Inventory Stocking",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "log_init_5",
      productId: "prod_5",
      productName: "Bread (Whole Wheat)",
      type: "IN",
      quantity: 15,
      reason: "Initial Inventory Stocking",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  ],
  settings: {
    businessName: "Retailer Commerce",
    currency: "GHS",
    currencySymbol: "\u20B5",
    taxRate: 15,
    receiptFooter: "Thank you for shopping with us."
  }
};
var ServerDatabase = class {
  constructor() {
    this.data = { ...DEFAULT_DATA };
    this.load();
  }
  load() {
    try {
      if (import_fs.default.existsSync(DB_FILE)) {
        const fileContent = import_fs.default.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(fileContent);
      } else {
        this.save();
      }
    } catch (e) {
      console.error("Error loading server DB, using default data:", e);
      this.data = { ...DEFAULT_DATA };
    }
  }
  save() {
    try {
      import_fs.default.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("Error saving server DB to file:", e);
    }
  }
  getUsers() {
    return this.data.users;
  }
  getProducts() {
    return this.data.products;
  }
  getSales() {
    return this.data.sales;
  }
  getInventoryLogs() {
    return this.data.inventoryLogs;
  }
  getSettings() {
    return this.data.settings;
  }
  updateSettings(settings) {
    this.data.settings = settings;
    this.save();
  }
  addUser(user) {
    this.data.users.push(user);
    this.save();
  }
  updateUser(updatedUser) {
    this.data.users = this.data.users.map((u) => u.id === updatedUser.id ? updatedUser : u);
    this.save();
  }
  addProduct(product) {
    this.data.products.push(product);
    this.save();
  }
  updateProduct(updatedProduct) {
    this.data.products = this.data.products.map((p) => p.id === updatedProduct.id ? updatedProduct : p);
    this.save();
  }
  addSale(sale) {
    this.data.sales.push(sale);
    sale.items.forEach((item) => {
      const prod = this.data.products.find((p) => p.id === item.productId);
      if (prod) {
        prod.quantity = Math.max(0, prod.quantity - item.quantity);
        prod.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        this.data.inventoryLogs.push({
          id: `log_sale_${sale.id}_${item.productId}`,
          productId: item.productId,
          productName: prod.name,
          type: "OUT",
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
    const prod = this.data.products.find((p) => p.id === log.productId);
    if (prod) {
      prod.quantity = Math.max(0, prod.quantity + log.quantity);
      prod.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    this.save();
  }
};
var serverDb = new ServerDatabase();

// server/controllers/authController.js
var login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  const user = serverDb.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  if (!user.active) {
    return res.status(403).json({ error: "This account has been deactivated" });
  }
  res.json({
    token: `token_${user.id}`,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
};
var logout = (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
};
var getCurrentUser = (req, res) => {
  const user = req.user;
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
};
var getUsers = (req, res) => {
  const users = serverDb.getUsers().map(({ passwordHash, ...rest }) => rest);
  res.json(users);
};
var createUser = (req, res) => {
  const { name, email, role, password, active } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Name, email, password and role are required" });
  }
  const exists = serverDb.getUsers().some((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "Email already exists" });
  }
  const newUser = {
    id: `usr_${Date.now()}`,
    name,
    email: email.toLowerCase(),
    role,
    passwordHash: password,
    active: active !== void 0 ? active : true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  serverDb.addUser(newUser);
  const { passwordHash, ...safeUser } = newUser;
  res.status(201).json(safeUser);
};
var updateUser = (req, res) => {
  const targetUserId = req.params.id;
  const existing = serverDb.getUsers().find((u) => u.id === targetUserId);
  if (!existing) {
    return res.status(404).json({ error: "User not found" });
  }
  const { name, email, role, password, active } = req.body;
  const updated = {
    ...existing,
    name: name || existing.name,
    email: email ? email.toLowerCase() : existing.email,
    role: role || existing.role,
    passwordHash: password || existing.passwordHash,
    active: active !== void 0 ? active : existing.active
  };
  serverDb.updateUser(updated);
  const { passwordHash, ...safeUser } = updated;
  res.json(safeUser);
};

// server/middleware/authMiddleware.js
var authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }
  const user = serverDb.getUsers().find((u) => u.id === token || `token_${u.id}` === token);
  if (!user || !user.active) {
    return res.status(403).json({ error: "Invalid or deactivated user token" });
  }
  req.user = user;
  next();
};

// server/middleware/roleMiddleware.js
var requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied: Admin role required" });
  }
  next();
};

// server/routes/authRoutes.js
var router = import_express.default.Router();
router.post("/auth/login", login);
router.post("/auth/logout", logout);
router.get("/auth/me", authenticateToken, getCurrentUser);
router.get("/users", authenticateToken, requireAdmin, getUsers);
router.post("/users", authenticateToken, requireAdmin, createUser);
router.put("/users/:id", authenticateToken, requireAdmin, updateUser);
var authRoutes_default = router;

// server/routes/productRoutes.js
var import_express2 = __toESM(require("express"), 1);

// server/services/productService.js
var getAllProducts = () => {
  return serverDb.getProducts();
};
var createProduct = (payload, createdAt) => {
  const newProd = {
    id: payload.id || `prod_${Date.now()}`,
    name: payload.name,
    sku: payload.sku,
    barcode: payload.barcode,
    category: payload.category || "General",
    costPrice: Number(payload.costPrice),
    sellingPrice: Number(payload.sellingPrice),
    quantity: Number(payload.quantity || 0),
    reorderLevel: Number(payload.reorderLevel || 5),
    archived: false,
    createdAt: createdAt || (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  serverDb.addProduct(newProd);
  serverDb.addInventoryLog({
    id: `log_sync_${payload.id || Date.now()}`,
    productId: newProd.id,
    productName: newProd.name,
    type: "IN",
    quantity: newProd.quantity,
    reason: "Product Created (Offline Sync)",
    createdAt: createdAt || (/* @__PURE__ */ new Date()).toISOString()
  });
  return newProd;
};
var updateProduct = (payload) => {
  const existing = serverDb.getProducts().find((p) => p.id === payload.id);
  if (existing) {
    const updated = {
      ...existing,
      name: payload.name || existing.name,
      sku: payload.sku || existing.sku,
      barcode: payload.barcode || existing.barcode,
      category: payload.category || existing.category,
      costPrice: payload.costPrice !== void 0 ? Number(payload.costPrice) : existing.costPrice,
      sellingPrice: payload.sellingPrice !== void 0 ? Number(payload.sellingPrice) : existing.sellingPrice,
      reorderLevel: payload.reorderLevel !== void 0 ? Number(payload.reorderLevel) : existing.reorderLevel,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    serverDb.updateProduct(updated);
    return updated;
  }
  return null;
};
var archiveProduct = (id) => {
  const existing = serverDb.getProducts().find((p) => p.id === id);
  if (existing) {
    existing.archived = true;
    existing.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    serverDb.updateProduct(existing);
    return existing;
  }
  return null;
};

// server/controllers/productController.js
var getProducts = (req, res) => {
  try {
    const products = getAllProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve products" });
  }
};

// server/routes/productRoutes.js
var router2 = import_express2.default.Router();
router2.get("/", getProducts);
var productRoutes_default = router2;

// server/routes/inventoryRoutes.js
var import_express3 = __toESM(require("express"), 1);

// server/services/inventoryService.js
var getInventoryLogs = () => {
  return serverDb.getInventoryLogs();
};
var addInventoryLog = ({ productId, type, quantity, reason, createdAt }) => {
  const prod = serverDb.getProducts().find((p) => p.id === productId);
  if (!prod) {
    return null;
  }
  const log = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    productId,
    productName: prod.name,
    type,
    quantity: Number(quantity),
    reason: reason || "Manual adjustment",
    createdAt: createdAt || (/* @__PURE__ */ new Date()).toISOString()
  };
  serverDb.addInventoryLog(log);
  return log;
};

// server/controllers/inventoryController.js
var getInventory = (req, res) => {
  try {
    const logs = getInventoryLogs();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve inventory logs" });
  }
};
var adjustStock = (req, res) => {
  try {
    const { productId, type, quantity, reason, createdAt } = req.body;
    if (!productId || !type || quantity === void 0) {
      return res.status(400).json({ error: "Product ID, type, and quantity are required" });
    }
    const log = addInventoryLog({ productId, type, quantity, reason, createdAt });
    if (!log) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: "Failed to adjust stock" });
  }
};

// server/routes/inventoryRoutes.js
var router3 = import_express3.default.Router();
router3.get("/", authenticateToken, getInventory);
router3.post("/", authenticateToken, adjustStock);
var inventoryRoutes_default = router3;

// server/routes/salesRoutes.js
var import_express4 = __toESM(require("express"), 1);

// server/services/salesService.js
var getSales = () => {
  return serverDb.getSales();
};
var createSale = (user, saleData) => {
  const {
    id,
    invoiceNumber,
    total,
    subtotal,
    taxAmount,
    discountAmount,
    paymentMethod,
    items,
    createdAt
  } = saleData;
  const saleId = id || `sale_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newSale = {
    id: saleId,
    invoiceNumber: invoiceNumber || `INV-${Date.now().toString().slice(-8)}`,
    cashierId: user.id,
    cashierName: user.name,
    total: Number(total),
    subtotal: Number(subtotal),
    taxAmount: Number(taxAmount || 0),
    discountAmount: Number(discountAmount || 0),
    paymentMethod: paymentMethod || "CASH",
    createdAt: createdAt || (/* @__PURE__ */ new Date()).toISOString(),
    items: items.map((item) => ({
      id: item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      saleId,
      productId: item.productId,
      productName: item.productName || "Unknown Product",
      quantity: Number(item.quantity),
      price: Number(item.price),
      subtotal: Number(item.subtotal)
    }))
  };
  serverDb.addSale(newSale);
  return newSale;
};

// server/controllers/salesController.js
var getSales2 = (req, res) => {
  try {
    const sales = getSales();
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve sales" });
  }
};
var createSale2 = (req, res) => {
  try {
    const user = req.user;
    const saleData = req.body;
    if (!saleData.items || !Array.isArray(saleData.items) || saleData.items.length === 0) {
      return res.status(400).json({ error: "At least one sale item is required" });
    }
    const newSale = createSale(user, saleData);
    res.status(201).json(newSale);
  } catch (error) {
    res.status(500).json({ error: "Failed to process sale" });
  }
};

// server/validators/saleValidator.js
var validateSale = (req, res, next) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "At least one sale item is required" });
  }
  for (const item of items) {
    if (!item.productId || item.quantity === void 0 || item.price === void 0) {
      return res.status(400).json({ error: "Each sale item must have a productId, quantity, and price" });
    }
    if (isNaN(Number(item.quantity)) || Number(item.quantity) <= 0) {
      return res.status(400).json({ error: "Quantity must be a positive number" });
    }
  }
  next();
};

// server/routes/salesRoutes.js
var router4 = import_express4.default.Router();
router4.get("/", authenticateToken, getSales2);
router4.post("/", authenticateToken, validateSale, createSale2);
var salesRoutes_default = router4;

// server/routes/reportRoutes.js
var import_express5 = __toESM(require("express"), 1);

// server/controllers/reportController.js
var getReportSummary = (req, res) => {
  try {
    const products = serverDb.getProducts();
    const sales = serverDb.getSales();
    const logs = serverDb.getInventoryLogs();
    const totalSalesValue = sales.reduce((sum, s) => sum + s.total, 0);
    const totalCostOfGoods = sales.reduce((sum, s) => {
      let cost = 0;
      s.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        cost += (prod ? prod.costPrice : item.price * 0.6) * item.quantity;
      });
      return sum + cost;
    }, 0);
    res.json({
      totalSales: sales.length,
      totalRevenue: totalSalesValue,
      totalCostOfGoods,
      netProfit: totalSalesValue - totalCostOfGoods,
      totalProducts: products.length,
      inventoryLogsCount: logs.length
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate report summary" });
  }
};

// server/routes/reportRoutes.js
var router5 = import_express5.default.Router();
router5.get("/", authenticateToken, getReportSummary);
var reportRoutes_default = router5;

// server/routes/syncRoutes.js
var import_express6 = __toESM(require("express"), 1);

// server/services/syncService.js
var processSyncQueue = (user, queue) => {
  const syncedIds = [];
  const sortedQueue = [...queue].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  for (const item of sortedQueue) {
    try {
      const { id, action, payload, createdAt } = item;
      if (action === "CREATE_PRODUCT") {
        const barcodeExists = serverDb.getProducts().some((p) => p.barcode === payload.barcode && !p.archived);
        const skuExists = serverDb.getProducts().some((p) => p.sku === payload.sku && !p.archived);
        if (!barcodeExists && !skuExists) {
          createProduct(payload, createdAt);
        }
      } else if (action === "UPDATE_PRODUCT") {
        updateProduct(payload);
      } else if (action === "ARCHIVE_PRODUCT") {
        archiveProduct(payload.id);
      } else if (action === "ADJUST_STOCK") {
        const existing = serverDb.getProducts().find((p) => p.id === payload.productId);
        if (existing) {
          addInventoryLog({
            productId: payload.productId,
            type: payload.type,
            quantity: Number(payload.quantity),
            reason: payload.reason || "Offline stock adjustment",
            createdAt: createdAt || (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      } else if (action === "CREATE_SALE") {
        const saleExists = serverDb.getSales().some((s) => s.id === payload.id || s.invoiceNumber === payload.invoiceNumber);
        if (!saleExists) {
          createSale(user, payload);
        }
      }
      syncedIds.push(id);
    } catch (err) {
      console.error(`[SyncEngine] Error syncing item ${item.id}:`, err);
    }
  }
  serverDb.save();
  return syncedIds;
};

// server/controllers/syncController.js
var syncQueue = (req, res) => {
  try {
    const user = req.user;
    const { queue } = req.body;
    if (!queue || !Array.isArray(queue)) {
      return res.status(400).json({ error: "Invalid sync payload" });
    }
    console.log(`[SyncEngine] Processing ${queue.length} items from ${user.name} (${user.role})`);
    const syncedIds = processSyncQueue(user, queue);
    res.json({
      success: true,
      syncedIds,
      serverProducts: serverDb.getProducts(),
      serverSettings: serverDb.getSettings(),
      serverUsers: serverDb.getUsers().map(({ passwordHash, ...rest }) => rest),
      serverSales: serverDb.getSales(),
      serverInventoryLogs: serverDb.getInventoryLogs()
    });
  } catch (error) {
    console.error("[SyncEngine] Critical failure processing sync request:", error);
    res.status(500).json({ error: "Failed to process sync queue" });
  }
};

// server/routes/syncRoutes.js
var router6 = import_express6.default.Router();
router6.post("/", authenticateToken, syncQueue);
var syncRoutes_default = router6;

// server/routes/settingsRoutes.js
var import_express7 = __toESM(require("express"), 1);

// server/controllers/settingsController.js
var getSettings = (req, res) => {
  try {
    const settings = serverDb.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve settings" });
  }
};
var updateSettings = (req, res) => {
  try {
    const { businessName, currency, currencySymbol, taxRate, receiptFooter } = req.body;
    const settings = {
      businessName: businessName || "Retailer Shop",
      currency: currency || "USD",
      currencySymbol: currencySymbol || "$",
      taxRate: taxRate !== void 0 ? Number(taxRate) : 15,
      receiptFooter: receiptFooter || ""
    };
    serverDb.updateSettings(settings);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Failed to update settings" });
  }
};

// server/routes/settingsRoutes.js
var router7 = import_express7.default.Router();
router7.get("/", getSettings);
router7.post("/", authenticateToken, requireAdmin, updateSettings);
var settingsRoutes_default = router7;

// server/utils/logger.js
var requestLogger = (req, res, next) => {
  console.log(`[Server] ${req.method} ${req.url}`);
  next();
};

// server/index.js
async function startServer() {
  const app = (0, import_express8.default)();
  const PORT = 3e3;
  app.use(import_express8.default.json());
  app.use(import_express8.default.urlencoded({ extended: true }));
  app.use(requestLogger);
  app.use("/api", authRoutes_default);
  app.use("/api/products", productRoutes_default);
  app.use("/api/inventory", inventoryRoutes_default);
  app.use("/api/sales", salesRoutes_default);
  app.use("/api/reports", reportRoutes_default);
  app.use("/api/sync", syncRoutes_default);
  app.use("/api/settings", settingsRoutes_default);
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express8.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Full-stack Retailer app running on port ${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("[Server] Failed to start server:", err);
});
//# sourceMappingURL=server.cjs.map
