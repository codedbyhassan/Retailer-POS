/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {'admin' | 'cashier'} role
 * @property {boolean} active
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} name
 * @property {string} sku
 * @property {string} barcode
 * @property {string} category
 * @property {number} costPrice
 * @property {number} sellingPrice
 * @property {number} quantity
 * @property {number} reorderLevel
 * @property {boolean} archived
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} SaleItem
 * @property {string} id
 * @property {string} saleId
 * @property {string} productId
 * @property {string} productName
 * @property {number} quantity
 * @property {number} price
 * @property {number} subtotal
 */

/**
 * @typedef {Object} Sale
 * @property {string} id
 * @property {string} invoiceNumber
 * @property {string} cashierId
 * @property {string} cashierName
 * @property {number} total
 * @property {number} subtotal
 * @property {number} taxAmount
 * @property {number} discountAmount
 * @property {'CASH' | 'MOBILE_MONEY' | 'CARD'} paymentMethod
 * @property {string} createdAt
 * @property {SaleItem[]} items
 * @property {'pending' | 'synced'} status
 */

/**
 * @typedef {Object} InventoryLog
 * @property {string} id
 * @property {string} productId
 * @property {string} productName
 * @property {'IN' | 'OUT' | 'ADJUST'} type
 * @property {number} quantity
 * @property {string} reason
 * @property {string} createdAt
 */

/**
 * @typedef {Object} BusinessSettings
 * @property {string} businessName
 * @property {string} currency
 * @property {string} currencySymbol
 * @property {number} taxRate
 * @property {string} receiptFooter
 */

/**
 * @typedef {Object} SyncQueueItem
 * @property {string} id
 * @property {'CREATE_PRODUCT' | 'UPDATE_PRODUCT' | 'ARCHIVE_PRODUCT' | 'ADJUST_STOCK' | 'CREATE_SALE'} action
 * @property {any} payload
 * @property {'pending' | 'synced'} status
 * @property {string} createdAt
 */
