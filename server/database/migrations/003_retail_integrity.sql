-- Retail integrity hardening.
-- Run after 002_phase1_integrity.sql.

ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(7,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(7,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS cashier_email TEXT,
  ADD COLUMN IF NOT EXISTS cashier_name TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE sale_items
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS product_name TEXT;

CREATE TABLE IF NOT EXISTS sync_idempotency (
  idempotency_key TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  request_id TEXT NOT NULL,
  response JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_cashier ON sales(cashier_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);

CREATE OR REPLACE FUNCTION apply_inventory_adjustment_atomic(
  p_log JSONB,
  p_actor_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_product RECORD;
  v_delta INTEGER;
  v_log_id TEXT;
BEGIN
  v_log_id := COALESCE(p_log->>'id', 'inv_' || gen_random_uuid()::text);
  v_delta := (p_log->>'quantity')::INTEGER;

  IF v_delta IS NULL OR v_delta = 0 THEN
    RAISE EXCEPTION 'Inventory adjustment quantity cannot be zero';
  END IF;

  SELECT id, name, quantity
    INTO v_product
    FROM products
   WHERE id = p_log->>'product_id'
     AND archived = FALSE
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product % is unavailable', p_log->>'product_id';
  END IF;

  IF v_product.quantity + v_delta < 0 THEN
    RAISE EXCEPTION 'Inventory cannot become negative for %. Available: %, adjustment: %',
      v_product.name, v_product.quantity, v_delta;
  END IF;

  INSERT INTO inventory_logs (
    id, product_id, type, quantity, reference_id, reference_type, created_at
  ) VALUES (
    v_log_id,
    v_product.id,
    COALESCE(p_log->>'type', 'ADJUSTMENT'),
    v_delta,
    p_log->>'reference_id',
    COALESCE(p_log->>'reference_type', 'inventory_adjustment'),
    COALESCE((p_log->>'created_at')::TIMESTAMPTZ, NOW())
  )
  ON CONFLICT (id) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM inventory_logs WHERE id = v_log_id AND product_id = v_product.id) THEN
    RAISE EXCEPTION 'Failed to record inventory adjustment';
  END IF;

  UPDATE products
     SET quantity = quantity + v_delta,
         updated_at = NOW()
   WHERE id = v_product.id;

  INSERT INTO audit_logs (id, action, entity_type, entity_id, actor_id, metadata)
  VALUES (
    'inventory_' || v_log_id,
    'INVENTORY_ADJUST',
    'product',
    v_product.id,
    p_actor_id,
    jsonb_build_object('delta', v_delta, 'type', p_log->>'type', 'log_id', v_log_id)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN jsonb_build_object(
    'ok', true,
    'product_id', v_product.id,
    'new_quantity', v_product.quantity + v_delta,
    'log_id', v_log_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION apply_sale_atomic(p_sale JSONB, p_items JSONB)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_sale_id TEXT;
  v_item JSONB;
  v_product RECORD;
  v_quantity INTEGER;
BEGIN
  INSERT INTO sales (
    id, invoice_number, cashier_id, cashier_email, cashier_name,
    subtotal, discount_percent, discount_amount, tax_rate, tax_amount,
    total, payment_method, created_at, updated_at
  ) VALUES (
    p_sale->>'id',
    p_sale->>'invoice_number',
    p_sale->>'cashier_id',
    p_sale->>'cashier_email',
    p_sale->>'cashier_name',
    COALESCE((p_sale->>'subtotal')::NUMERIC, 0),
    COALESCE((p_sale->>'discount')::NUMERIC, 0),
    COALESCE((p_sale->>'discount_amount')::NUMERIC, 0),
    COALESCE((p_sale->>'tax_rate')::NUMERIC, 0),
    COALESCE((p_sale->>'tax_amount')::NUMERIC, 0),
    COALESCE((p_sale->>'total')::NUMERIC, 0),
    COALESCE(p_sale->>'payment_method', 'cash'),
    COALESCE((p_sale->>'created_at')::TIMESTAMPTZ, NOW()),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING
  RETURNING id INTO v_sale_id;

  IF v_sale_id IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'is_duplicate', true, 'sale_id', p_sale->>'id');
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := (v_item->>'quantity')::INTEGER;
    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid sale quantity';
    END IF;

    SELECT id, name, quantity, cost_price
      INTO v_product
      FROM products
     WHERE id = v_item->>'product_id'
       AND archived = FALSE
     FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % is unavailable', v_item->>'product_id';
    END IF;

    IF v_product.quantity < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for %. Available: %, requested: %',
        v_product.name, v_product.quantity, v_quantity;
    END IF;

    INSERT INTO sale_items (id, sale_id, product_id, quantity, price, cost_price, subtotal, product_name)
    VALUES (
      v_item->>'id',
      p_sale->>'id',
      v_item->>'product_id',
      v_quantity,
      COALESCE((v_item->>'price')::NUMERIC, 0),
      COALESCE((v_item->>'cost_price')::NUMERIC, v_product.cost_price, 0),
      COALESCE((v_item->>'subtotal')::NUMERIC, 0),
      COALESCE(v_item->>'product_name', v_product.name)
    );

    UPDATE products
       SET quantity = quantity - v_quantity,
           updated_at = NOW()
     WHERE id = v_product.id;

    INSERT INTO inventory_logs (
      id, product_id, type, quantity, reference_id, reference_type, created_at
    ) VALUES (
      'sale_' || (p_sale->>'id') || '_' || (v_item->>'product_id'),
      v_product.id,
      'SALE',
      -v_quantity,
      p_sale->>'id',
      'sale',
      COALESCE((p_sale->>'created_at')::TIMESTAMPTZ, NOW())
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;

  INSERT INTO audit_logs (id, action, entity_type, entity_id, actor_id, metadata, created_at)
  VALUES (
    'sale_' || (p_sale->>'id'),
    'CREATE_SALE',
    'sale',
    p_sale->>'id',
    p_sale->>'cashier_id',
    jsonb_build_object(
      'invoice_number', p_sale->>'invoice_number',
      'total', p_sale->>'total',
      'payment_method', p_sale->>'payment_method',
      'item_count', jsonb_array_length(p_items)
    ),
    COALESCE((p_sale->>'created_at')::TIMESTAMPTZ, NOW())
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'is_duplicate', false, 'sale_id', v_sale_id);
END;
$$;
