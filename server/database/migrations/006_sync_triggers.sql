CREATE OR REPLACE FUNCTION record_sync_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_id TEXT;
  v_data JSONB;
BEGIN
  v_id := COALESCE(NEW.id, OLD.id);
  IF TG_OP = 'DELETE' THEN
    INSERT INTO sync_changes(entity_type, entity_id, operation, data)
    VALUES (TG_TABLE_NAME, v_id, 'delete', NULL);
    RETURN OLD;
  END IF;
  IF TG_TABLE_NAME IN ('customers', 'product_images') THEN
    v_data := NEW.data;
  ELSIF TG_TABLE_NAME = 'settings' THEN
    v_id := NEW.key;
    v_data := jsonb_build_object('key', NEW.key, 'value', NEW.value, 'updated_at', NEW.updated_at);
  ELSIF TG_TABLE_NAME = 'users' THEN
    v_data := to_jsonb(NEW) - 'password_hash' - 'password_salt' - 'password_algorithm';
  ELSE
    v_data := to_jsonb(NEW);
  END IF;
  INSERT INTO sync_changes(entity_type, entity_id, operation, data)
  VALUES (TG_TABLE_NAME, v_id, 'upsert', v_data);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_products ON products;
CREATE TRIGGER trg_sync_products AFTER INSERT OR UPDATE OR DELETE ON products FOR EACH ROW EXECUTE FUNCTION record_sync_change();
DROP TRIGGER IF EXISTS trg_sync_sales ON sales;
CREATE TRIGGER trg_sync_sales AFTER INSERT OR UPDATE OR DELETE ON sales FOR EACH ROW EXECUTE FUNCTION record_sync_change();
DROP TRIGGER IF EXISTS trg_sync_sale_items ON sale_items;
CREATE TRIGGER trg_sync_sale_items AFTER INSERT OR UPDATE OR DELETE ON sale_items FOR EACH ROW EXECUTE FUNCTION record_sync_change();
DROP TRIGGER IF EXISTS trg_sync_inventory_logs ON inventory_logs;
CREATE TRIGGER trg_sync_inventory_logs AFTER INSERT OR UPDATE OR DELETE ON inventory_logs FOR EACH ROW EXECUTE FUNCTION record_sync_change();
DROP TRIGGER IF EXISTS trg_sync_users ON users;
CREATE TRIGGER trg_sync_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION record_sync_change();
DROP TRIGGER IF EXISTS trg_sync_customers ON customers;
CREATE TRIGGER trg_sync_customers AFTER INSERT OR UPDATE OR DELETE ON customers FOR EACH ROW EXECUTE FUNCTION record_sync_change();
DROP TRIGGER IF EXISTS trg_sync_product_images ON product_images;
CREATE TRIGGER trg_sync_product_images AFTER INSERT OR UPDATE OR DELETE ON product_images FOR EACH ROW EXECUTE FUNCTION record_sync_change();
DROP TRIGGER IF EXISTS trg_sync_settings ON settings;
CREATE TRIGGER trg_sync_settings AFTER INSERT OR UPDATE OR DELETE ON settings FOR EACH ROW EXECUTE FUNCTION record_sync_change();

INSERT INTO sync_changes(entity_type, entity_id, operation, data)
SELECT 'products', id, 'upsert', to_jsonb(p) FROM products p
WHERE NOT EXISTS (SELECT 1 FROM sync_changes WHERE entity_type = 'products');
INSERT INTO sync_changes(entity_type, entity_id, operation, data)
SELECT 'sales', id, 'upsert', to_jsonb(s) FROM sales s
WHERE NOT EXISTS (SELECT 1 FROM sync_changes WHERE entity_type = 'sales');
INSERT INTO sync_changes(entity_type, entity_id, operation, data)
SELECT 'sale_items', id, 'upsert', to_jsonb(i) FROM sale_items i
WHERE NOT EXISTS (SELECT 1 FROM sync_changes WHERE entity_type = 'sale_items');
INSERT INTO sync_changes(entity_type, entity_id, operation, data)
SELECT 'inventory_logs', id, 'upsert', to_jsonb(i) FROM inventory_logs i
WHERE NOT EXISTS (SELECT 1 FROM sync_changes WHERE entity_type = 'inventory_logs');
INSERT INTO sync_changes(entity_type, entity_id, operation, data)
SELECT 'users', id, 'upsert', (to_jsonb(u) - 'password_hash' - 'password_salt' - 'password_algorithm') FROM users u
WHERE NOT EXISTS (SELECT 1 FROM sync_changes WHERE entity_type = 'users');
INSERT INTO sync_changes(entity_type, entity_id, operation, data)
SELECT 'customers', id, 'upsert', data FROM customers
WHERE NOT EXISTS (SELECT 1 FROM sync_changes WHERE entity_type = 'customers');
INSERT INTO sync_changes(entity_type, entity_id, operation, data)
SELECT 'product_images', id, 'upsert', data FROM product_images
WHERE NOT EXISTS (SELECT 1 FROM sync_changes WHERE entity_type = 'product_images');
INSERT INTO sync_changes(entity_type, entity_id, operation, data)
SELECT 'settings', key, 'upsert', jsonb_build_object('key', key, 'value', value, 'updated_at', updated_at)
FROM settings
WHERE NOT EXISTS (SELECT 1 FROM sync_changes WHERE entity_type = 'settings');
