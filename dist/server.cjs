var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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

// server/utils/auth.js
var auth_exports = {};
__export(auth_exports, {
  comparePassword: () => comparePassword,
  extractTokenFromHeader: () => extractTokenFromHeader,
  generateAccessToken: () => generateAccessToken,
  generateRefreshToken: () => generateRefreshToken,
  hashPassword: () => hashPassword,
  verifyToken: () => verifyToken
});
var import_bcryptjs, import_jsonwebtoken, JWT_SECRET, JWT_EXPIRY, REFRESH_TOKEN_EXPIRY, hashPassword, comparePassword, generateAccessToken, generateRefreshToken, verifyToken, extractTokenFromHeader;
var init_auth = __esm({
  "server/utils/auth.js"() {
    import_bcryptjs = __toESM(require("bcryptjs"), 1);
    import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
    JWT_SECRET = process.env.BETTER_AUTH_SECRET;
    JWT_EXPIRY = "15m";
    REFRESH_TOKEN_EXPIRY = "7d";
    if (!JWT_SECRET) {
      throw new Error("BETTER_AUTH_SECRET is not set in environment variables");
    }
    hashPassword = async (password) => {
      const salt = await import_bcryptjs.default.genSalt(10);
      return import_bcryptjs.default.hash(password, salt);
    };
    comparePassword = async (password, hash) => {
      return import_bcryptjs.default.compare(password, hash);
    };
    generateAccessToken = (userId, email, role) => {
      return import_jsonwebtoken.default.sign(
        { userId, email, role, type: "access" },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
      );
    };
    generateRefreshToken = (userId) => {
      return import_jsonwebtoken.default.sign(
        { userId, type: "refresh" },
        JWT_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
      );
    };
    verifyToken = (token, type = "access") => {
      try {
        const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
        if (decoded.type !== type) {
          throw new Error(`Invalid token type: expected ${type}, got ${decoded.type}`);
        }
        return decoded;
      } catch (error) {
        throw new Error(`Token verification failed: ${error.message}`);
      }
    };
    extractTokenFromHeader = (authHeader) => {
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
      }
      return authHeader.slice(7);
    };
  }
});

// server/index.js
var import_express8 = __toESM(require("express"), 1);
var import_path3 = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_config = require("dotenv-expand/config.js");

// server/routes/authRoutes.js
var import_express = __toESM(require("express"), 1);

// server/db/index.js
var import_node_postgres = require("drizzle-orm/node-postgres");
var import_pg = __toESM(require("pg"), 1);

// server/db/schema.js
var schema_exports = {};
__export(schema_exports, {
  inventoryLogRelations: () => inventoryLogRelations,
  inventoryLogs: () => inventoryLogs,
  products: () => products,
  saleRelations: () => saleRelations,
  sales: () => sales,
  sessionRelations: () => sessionRelations,
  sessions: () => sessions,
  syncLogRelations: () => syncLogRelations,
  syncLogs: () => syncLogs,
  userRelations: () => userRelations,
  users: () => users
});
var import_pg_core = require("drizzle-orm/pg-core");
var import_drizzle_orm = require("drizzle-orm");
var users = (0, import_pg_core.pgTable)("users", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  name: (0, import_pg_core.text)("name").notNull(),
  email: (0, import_pg_core.text)("email").notNull().unique(),
  passwordHash: (0, import_pg_core.text)("password_hash").notNull(),
  role: (0, import_pg_core.varchar)("role", { length: 50 }).notNull().default("cashier"),
  // admin, cashier, manager
  active: (0, import_pg_core.boolean)("active").notNull().default(true),
  createdAt: (0, import_pg_core.timestamp)("created_at").notNull().defaultNow(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").notNull().defaultNow()
});
var sessions = (0, import_pg_core.pgTable)("sessions", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  userId: (0, import_pg_core.text)("user_id").notNull(),
  refreshToken: (0, import_pg_core.text)("refresh_token").notNull(),
  expiresAt: (0, import_pg_core.timestamp)("expires_at").notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at").notNull().defaultNow()
});
var products = (0, import_pg_core.pgTable)("products", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  name: (0, import_pg_core.text)("name").notNull(),
  sku: (0, import_pg_core.varchar)("sku", { length: 100 }).notNull().unique(),
  barcode: (0, import_pg_core.varchar)("barcode", { length: 100 }),
  category: (0, import_pg_core.varchar)("category", { length: 100 }),
  costPrice: (0, import_pg_core.decimal)("cost_price", { precision: 10, scale: 2 }).notNull(),
  sellingPrice: (0, import_pg_core.decimal)("selling_price", { precision: 10, scale: 2 }).notNull(),
  quantity: (0, import_pg_core.integer)("quantity").notNull().default(0),
  reorderLevel: (0, import_pg_core.integer)("reorder_level").notNull().default(0),
  archived: (0, import_pg_core.boolean)("archived").notNull().default(false),
  createdAt: (0, import_pg_core.timestamp)("created_at").notNull().defaultNow(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").notNull().defaultNow()
});
var sales = (0, import_pg_core.pgTable)("sales", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  userId: (0, import_pg_core.text)("user_id").notNull(),
  items: (0, import_pg_core.text)("items").notNull(),
  // JSON array of sale items
  totalAmount: (0, import_pg_core.decimal)("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: (0, import_pg_core.varchar)("payment_method", { length: 50 }).notNull(),
  notes: (0, import_pg_core.text)("notes"),
  synced: (0, import_pg_core.boolean)("synced").notNull().default(false),
  syncedAt: (0, import_pg_core.timestamp)("synced_at"),
  createdAt: (0, import_pg_core.timestamp)("created_at").notNull().defaultNow(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").notNull().defaultNow()
});
var inventoryLogs = (0, import_pg_core.pgTable)("inventory_logs", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  productId: (0, import_pg_core.text)("product_id").notNull(),
  action: (0, import_pg_core.varchar)("action", { length: 50 }).notNull(),
  // 'purchase', 'sale', 'adjustment'
  quantity: (0, import_pg_core.integer)("quantity").notNull(),
  reference: (0, import_pg_core.text)("reference"),
  // sale_id or note
  createdAt: (0, import_pg_core.timestamp)("created_at").notNull().defaultNow()
});
var syncLogs = (0, import_pg_core.pgTable)("sync_logs", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  userId: (0, import_pg_core.text)("user_id").notNull(),
  action: (0, import_pg_core.varchar)("action", { length: 100 }).notNull(),
  status: (0, import_pg_core.varchar)("status", { length: 50 }).notNull(),
  // 'success', 'failed'
  changes: (0, import_pg_core.text)("changes"),
  // JSON of what changed
  error: (0, import_pg_core.text)("error"),
  createdAt: (0, import_pg_core.timestamp)("created_at").notNull().defaultNow()
});
var userRelations = (0, import_drizzle_orm.relations)(users, ({ many }) => ({
  sessions: many(sessions),
  sales: many(sales),
  syncLogs: many(syncLogs)
}));
var sessionRelations = (0, import_drizzle_orm.relations)(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id]
  })
}));
var saleRelations = (0, import_drizzle_orm.relations)(sales, ({ one }) => ({
  user: one(users, {
    fields: [sales.userId],
    references: [users.id]
  })
}));
var inventoryLogRelations = (0, import_drizzle_orm.relations)(inventoryLogs, ({ one }) => ({
  product: one(products, {
    fields: [inventoryLogs.productId],
    references: [products.id]
  })
}));
var syncLogRelations = (0, import_drizzle_orm.relations)(syncLogs, ({ one }) => ({
  user: one(users, {
    fields: [syncLogs.userId],
    references: [users.id]
  })
}));

// server/db/index.js
var { Pool } = import_pg.default;
var pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 3e4,
  connectionTimeoutMillis: 2e3
});
var db = (0, import_node_postgres.drizzle)(pool, { schema: schema_exports });

// server/controllers/authController.js
var import_drizzle_orm2 = require("drizzle-orm");
init_auth();

// server/utils/logger.js
var import_winston = __toESM(require("winston"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_fs = __toESM(require("fs"), 1);
var import_meta = {};
var __dirname = import_path.default.dirname((0, import_url.fileURLToPath)(import_meta.url));
var logDir = import_path.default.join(__dirname, "../../logs");
if (!import_fs.default.existsSync(logDir)) {
  import_fs.default.mkdirSync(logDir, { recursive: true });
}
var levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};
var colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white"
};
import_winston.default.addColors(colors);
var format = import_winston.default.format.combine(
  import_winston.default.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  import_winston.default.format.colorize({ all: true }),
  import_winston.default.format.printf((info) => {
    const { timestamp: timestamp2, level, message, ...args } = info;
    const ts = timestamp2.slice(0, 19).replace("T", " ");
    return `${ts} [${level}]: ${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ""}`;
  })
);
var transports = [
  // Console transport
  new import_winston.default.transports.Console(),
  // Error log file
  new import_winston.default.transports.File({
    filename: import_path.default.join(logDir, "error.log"),
    level: "error",
    format: import_winston.default.format.uncolorize()
  }),
  // Combined log file
  new import_winston.default.transports.File({
    filename: import_path.default.join(logDir, "combined.log"),
    format: import_winston.default.format.uncolorize()
  })
];
var logger = import_winston.default.createLogger({
  level: process.env.LOG_LEVEL || "debug",
  levels,
  format,
  transports
});
var logger_default = logger;
var requestLogger = (req, res, next) => {
  logger.http(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get("user-agent")
  });
  next();
};

// server/controllers/authController.js
var import_crypto = __toESM(require("crypto"), 1);
var login = async (req, res) => {
  try {
    const { email, password } = req.validatedData;
    const user = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.email, email.toLowerCase()));
    if (user.length === 0) {
      logger_default.warn(`Login attempt with non-existent email: ${email}`);
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const foundUser = user[0];
    if (!foundUser.active) {
      logger_default.warn(`Login attempt from deactivated user: ${foundUser.id}`);
      return res.status(403).json({ error: "This account has been deactivated" });
    }
    const passwordValid = await comparePassword(password, foundUser.password_hash);
    if (!passwordValid) {
      logger_default.warn(`Failed login attempt for user: ${foundUser.email}`);
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const accessToken = generateAccessToken(foundUser.id, foundUser.email, foundUser.role);
    const refreshToken = generateRefreshToken(foundUser.id);
    logger_default.info(`User logged in successfully: ${foundUser.email}`);
    res.json({
      accessToken,
      refreshToken,
      user: {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role
      }
    });
  } catch (error) {
    logger_default.error(`Login error: ${error.message}`);
    res.status(500).json({ error: "Login failed" });
  }
};
var refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required" });
    }
    const { verifyToken: verifyToken2 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
    const decoded = verifyToken2(refreshToken, "refresh");
    const user = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.id, decoded.userId));
    if (user.length === 0 || !user[0].active) {
      return res.status(403).json({ error: "User not found or deactivated" });
    }
    const foundUser = user[0];
    const newAccessToken = generateAccessToken(foundUser.id, foundUser.email, foundUser.role);
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    logger_default.error(`Token refresh error: ${error.message}`);
    res.status(401).json({ error: "Invalid refresh token" });
  }
};
var logout = (req, res) => {
  logger_default.info(`User logged out: ${req.user?.email}`);
  res.json({ success: true, message: "Logged out successfully" });
};
var getCurrentUser = (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      active: req.user.active
    }
  });
};
var getUsers = async (req, res) => {
  try {
    const allUsers = await db.select().from(users);
    const safeUsers = allUsers.map(({ password_hash, ...rest }) => rest);
    res.json(safeUsers);
  } catch (error) {
    logger_default.error(`Error fetching users: ${error.message}`);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};
var createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.validatedData;
    const existing = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.email, email.toLowerCase()));
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }
    const passwordHash = await hashPassword(password);
    const userId = `usr_${import_crypto.default.randomBytes(12).toString("hex")}`;
    await db.insert(users).values({
      id: userId,
      name,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      role: role || "cashier",
      active: true,
      created_at: /* @__PURE__ */ new Date(),
      updated_at: /* @__PURE__ */ new Date()
    });
    logger_default.info(`New user created: ${email}`);
    const newUser = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.id, userId));
    if (newUser.length > 0) {
      const { password_hash, ...safeUser } = newUser[0];
      return res.status(201).json(safeUser);
    }
  } catch (error) {
    logger_default.error(`Error creating user: ${error.message}`);
    res.status(500).json({ error: "Failed to create user" });
  }
};
var updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, password, active } = req.body;
    const existing = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.id, id));
    if (existing.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const updates = {
      name: name || existing[0].name,
      email: email ? email.toLowerCase() : existing[0].email,
      role: role || existing[0].role,
      active: active !== void 0 ? active : existing[0].active,
      updated_at: /* @__PURE__ */ new Date()
    };
    if (password) {
      updates.password_hash = await hashPassword(password);
    }
    await db.update(users).set(updates).where((0, import_drizzle_orm2.eq)(users.id, id));
    logger_default.info(`User updated: ${id}`);
    const updated = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.id, id));
    if (updated.length > 0) {
      const { password_hash, ...safeUser } = updated[0];
      return res.json(safeUser);
    }
  } catch (error) {
    logger_default.error(`Error updating user: ${error.message}`);
    res.status(500).json({ error: "Failed to update user" });
  }
};

// server/middleware/authMiddleware.js
init_auth();
var import_drizzle_orm3 = require("drizzle-orm");
var authenticateToken = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      logger_default.warn("Missing authentication token", { path: req.path });
      return res.status(401).json({ error: "Access token required" });
    }
    const decoded = verifyToken(token, "access");
    const user = await db.select().from(users).where((0, import_drizzle_orm3.eq)(users.id, decoded.userId));
    if (!user || user.length === 0) {
      logger_default.warn(`User not found for token`, { userId: decoded.userId });
      return res.status(403).json({ error: "User not found" });
    }
    if (!user[0].active) {
      logger_default.warn(`Inactive user attempted access`, { userId: decoded.userId });
      return res.status(403).json({ error: "User account is deactivated" });
    }
    req.user = user[0];
    req.token = decoded;
    next();
  } catch (error) {
    logger_default.error(`Authentication error: ${error.message}`);
    return res.status(401).json({ error: "Invalid token", details: error.message });
  }
};
var requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      logger_default.warn(`Unauthorized access attempt`, {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path
      });
      return res.status(403).json({
        error: "Insufficient permissions",
        requiredRoles: allowedRoles
      });
    }
    next();
  };
};
var requireAdmin = requireRole("admin");
var asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// server/validators/productValidator.js
var import_joi = __toESM(require("joi"), 1);
var productSchema = import_joi.default.object({
  name: import_joi.default.string().trim().min(1).max(255).required(),
  sku: import_joi.default.string().trim().min(1).max(50).required(),
  category: import_joi.default.string().trim().min(1).max(100).required(),
  price: import_joi.default.number().positive().precision(2).required(),
  quantity_in_stock: import_joi.default.number().integer().min(0).default(0),
  reorder_level: import_joi.default.number().integer().min(0).default(10),
  supplier_id: import_joi.default.string().allow(null)
});
var userSchema = import_joi.default.object({
  name: import_joi.default.string().trim().min(1).max(255).required(),
  email: import_joi.default.string().email().required(),
  password: import_joi.default.string().min(8).required(),
  role: import_joi.default.string().valid("admin", "cashier").default("cashier")
});
var loginSchema = import_joi.default.object({
  email: import_joi.default.string().email().required(),
  password: import_joi.default.string().required()
});
var saleSchema = import_joi.default.object({
  items: import_joi.default.array().items(
    import_joi.default.object({
      product_id: import_joi.default.string().required(),
      quantity: import_joi.default.number().integer().min(1).required(),
      unit_price: import_joi.default.number().positive().precision(2).required()
    })
  ).min(1).required(),
  payment_method: import_joi.default.string().valid("cash", "card", "check").required(),
  notes: import_joi.default.string().allow("")
});
var validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) {
      const messages = error.details.map((d) => d.message).join(", ");
      logger_default.warn(`Validation error: ${messages}`, { path: req.path });
      return res.status(400).json({
        error: "Validation failed",
        details: error.details
      });
    }
    req.validatedData = value;
    next();
  };
};
var validateProduct = validate(productSchema);
var validateUser = validate(userSchema);
var validateLogin = validate(loginSchema);
var validateSale = validate(saleSchema);

// server/routes/authRoutes.js
var router = import_express.default.Router();
router.post("/auth/login", validateLogin, asyncHandler(login));
router.post("/auth/refresh", asyncHandler(refreshAccessToken));
router.post("/auth/logout", authenticateToken, logout);
router.get("/auth/me", authenticateToken, getCurrentUser);
router.get("/users", authenticateToken, requireAdmin, asyncHandler(getUsers));
router.post("/users", authenticateToken, requireAdmin, validateUser, asyncHandler(createUser));
router.put("/users/:id", authenticateToken, requireAdmin, asyncHandler(updateUser));
var authRoutes_default = router;

// server/routes/productRoutes.js
var import_express2 = __toESM(require("express"), 1);

// server/controllers/productController.js
var import_drizzle_orm4 = require("drizzle-orm");
var getProducts = async (req, res) => {
  try {
    const allProducts = await db.select().from(products);
    res.json(allProducts);
  } catch (error) {
    logger_default.error(`Error fetching products: ${error.message}`);
    res.status(500).json({ error: "Failed to retrieve products" });
  }
};

// server/routes/productRoutes.js
var router2 = import_express2.default.Router();
router2.get("/", authenticateToken, asyncHandler(getProducts));
router2.post("/", authenticateToken, validateProduct, asyncHandler(getProducts));
var productRoutes_default = router2;

// server/routes/inventoryRoutes.js
var import_express3 = __toESM(require("express"), 1);

// server/config/db.js
var import_fs2 = __toESM(require("fs"), 1);
var import_path2 = __toESM(require("path"), 1);
var DB_FILE = import_path2.default.join(process.cwd(), "server_db.json");
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
      if (import_fs2.default.existsSync(DB_FILE)) {
        const fileContent = import_fs2.default.readFileSync(DB_FILE, "utf-8");
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
      import_fs2.default.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
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
    const sales2 = getSales();
    res.json(sales2);
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
var validateSale2 = (req, res, next) => {
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
router4.post("/", authenticateToken, validateSale2, createSale2);
var salesRoutes_default = router4;

// server/routes/reportRoutes.js
var import_express5 = __toESM(require("express"), 1);

// server/controllers/reportController.js
var getReportSummary = (req, res) => {
  try {
    const products2 = serverDb.getProducts();
    const sales2 = serverDb.getSales();
    const logs = serverDb.getInventoryLogs();
    const totalSalesValue = sales2.reduce((sum, s) => sum + s.total, 0);
    const totalCostOfGoods = sales2.reduce((sum, s) => {
      let cost = 0;
      s.items.forEach((item) => {
        const prod = products2.find((p) => p.id === item.productId);
        cost += (prod ? prod.costPrice : item.price * 0.6) * item.quantity;
      });
      return sum + cost;
    }, 0);
    res.json({
      totalSales: sales2.length,
      totalRevenue: totalSalesValue,
      totalCostOfGoods,
      netProfit: totalSalesValue - totalCostOfGoods,
      totalProducts: products2.length,
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

// server/services/productService.js
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

// server/middleware/roleMiddleware.js
var requireAdmin2 = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied: Admin role required" });
  }
  next();
};

// server/routes/settingsRoutes.js
var router7 = import_express7.default.Router();
router7.get("/", getSettings);
router7.post("/", authenticateToken, requireAdmin2, updateSettings);
var settingsRoutes_default = router7;

// server/middleware/securityMiddleware.js
var import_helmet = __toESM(require("helmet"), 1);
var import_express_rate_limit = __toESM(require("express-rate-limit"), 1);
var securityHeaders = (0, import_helmet.default)({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536e3,
    // 1 year
    includeSubDomains: true,
    preload: true
  }
});
var corsMiddleware = (req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:3000",
    "http://localhost:5173",
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ""
  ].filter(Boolean);
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
};
var apiLimiter = (0, import_express_rate_limit.default)({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 100,
  // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger_default.warn(`Rate limit exceeded`, { ip: req.ip });
    res.status(429).json({ error: "Too many requests" });
  }
});
var authLimiter = (0, import_express_rate_limit.default)({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 5,
  // limit each IP to 5 requests per windowMs
  message: "Too many authentication attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger_default.warn(`Auth rate limit exceeded`, { ip: req.ip });
    res.status(429).json({ error: "Too many authentication attempts" });
  }
});
var errorHandler = (err, req, res, next) => {
  logger_default.error(`Unhandled error: ${err.message}`, {
    path: req.path,
    method: req.method,
    stack: err.stack,
    userId: req.user?.id
  });
  const status = err.status || 500;
  const message = process.env.NODE_ENV === "production" ? "Internal server error" : err.message;
  res.status(status).json({
    error: message,
    status,
    ...process.env.NODE_ENV === "development" && { stack: err.stack }
  });
};
var notFoundHandler = (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    method: req.method
  });
};

// server/index.js
async function startServer() {
  const app = (0, import_express8.default)();
  const PORT = process.env.PORT || 3e3;
  app.use(securityHeaders);
  app.use(corsMiddleware);
  app.use(import_express8.default.json({ limit: "10mb" }));
  app.use(import_express8.default.urlencoded({ extended: true, limit: "10mb" }));
  app.use(requestLogger);
  app.use("/api/", apiLimiter);
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
  app.use("/api", authRoutes_default);
  app.use("/api/products", productRoutes_default);
  app.use("/api/inventory", inventoryRoutes_default);
  app.use("/api/sales", salesRoutes_default);
  app.use("/api/reports", reportRoutes_default);
  app.use("/api/sync", syncRoutes_default);
  app.use("/api/settings", settingsRoutes_default);
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    app.get("*", async (req, res, next) => {
      if (req.path.startsWith("/api/")) {
        return next();
      }
      try {
        let html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Retailer POS is an offline-first retail management system for point-of-sale, inventory control, and reporting." />
    <title>Retailer POS & Inventory System</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;
        html = await vite.transformIndexHtml(req.url, html);
        res.setHeader("Content-Type", "text/html");
        res.end(html);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = import_path3.default.join(process.cwd(), "dist");
    app.use(import_express8.default.static(distPath));
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api/")) {
        return res.status(404).json({ error: "Not Found" });
      }
      res.sendFile(import_path3.default.join(distPath, "index.html"));
    });
  }
  app.use("/api/", notFoundHandler);
  app.use(errorHandler);
  const server = app.listen(PORT, "0.0.0.0", () => {
    logger_default.info(`Full-stack Retailer POS running on port ${PORT}`);
  });
  process.on("SIGTERM", () => {
    logger_default.info("SIGTERM received, shutting down gracefully");
    server.close(() => {
      logger_default.info("Server closed");
      process.exit(0);
    });
  });
  process.on("SIGINT", () => {
    logger_default.info("SIGINT received, shutting down gracefully");
    server.close(() => {
      logger_default.info("Server closed");
      process.exit(0);
    });
  });
}
startServer().catch((err) => {
  logger_default.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});
//# sourceMappingURL=server.cjs.map
