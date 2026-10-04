-- Retailer POS v2: online-only Supabase architecture.
-- PostgreSQL is the source of truth. The browser does not perform authoritative inventory or sale writes.

create extension if not exists pgcrypto;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency text not null default 'GHS',
  tax_rate numeric(7,4) not null default 0 check (tax_rate >= 0),
  receipt_footer text,
  low_stock_threshold integer not null default 10 check (low_stock_threshold >= 0),
  preset text not null default 'classic-blue',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete restrict,
  name text not null,
  email text not null,
  role text not null default 'cashier' check (role in ('owner','admin','manager','cashier','inventory_manager','accountant')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_business_email_key on public.profiles(business_id, lower(email));

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  name text not null,
  sku text,
  barcode text,
  category text,
  cost_price numeric(12,2) not null default 0 check (cost_price >= 0),
  selling_price numeric(12,2) not null default 0 check (selling_price >= 0),
  quantity integer not null default 0 check (quantity >= 0),
  reorder_level integer not null default 10 check (reorder_level >= 0),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists products_business_sku_key on public.products(business_id, lower(sku)) where sku is not null and sku <> '';
create unique index if not exists products_business_barcode_key on public.products(business_id, barcode) where barcode is not null and barcode <> '';
create index if not exists products_business_name_idx on public.products(business_id, name);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  name text not null,
  phone text,
  email text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  invoice_number text not null,
  cashier_id uuid not null references public.profiles(id),
  subtotal numeric(12,2) not null default 0,
  discount_percent numeric(7,4) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  tax_rate numeric(7,4) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  payment_method text not null default 'cash' check (payment_method in ('cash','card','mobile')),
  status text not null default 'completed' check (status in ('completed','voided','refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists sales_business_invoice_key on public.sales(business_id, invoice_number);
create index if not exists sales_business_created_idx on public.sales(business_id, created_at desc);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,
  quantity integer not null check (quantity > 0),
  price numeric(12,2) not null check (price >= 0),
  cost_price numeric(12,2) not null default 0 check (cost_price >= 0),
  subtotal numeric(12,2) not null check (subtotal >= 0)
);

create index if not exists sale_items_sale_idx on public.sale_items(sale_id);
create index if not exists sale_items_product_idx on public.sale_items(product_id);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  product_id uuid not null references public.products(id),
  type text not null,
  quantity integer not null check (quantity <> 0),
  before_quantity integer not null,
  after_quantity integer not null check (after_quantity >= 0),
  reference_id uuid,
  reference_type text,
  note text,
  actor_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists inventory_business_created_idx on public.inventory_movements(business_id, created_at desc);
create index if not exists inventory_product_created_idx on public.inventory_movements(product_id, created_at desc);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  actor_id uuid references public.profiles(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.business_settings (
  id integer primary key check (id = 1),
  business_id uuid not null references public.businesses(id) on delete restrict,
  business_name text not null default 'My Retail Shop',
  currency text not null default 'GHS',
  tax_rate numeric(7,4) not null default 0,
  receipt_footer text,
  low_stock_threshold integer not null default 10,
  preset text not null default 'classic-blue',
  updated_at timestamptz not null default now()
);

create schema if not exists private;

create or replace function private.current_business_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $
  select business_id
  from public.profiles
  where id = (select auth.uid()) and active = true
  limit 1
$;

revoke all on function private.current_business_id() from public;
grant execute on function private.current_business_id() to authenticated;

create or replace function public.create_sale(p_sale jsonb, p_items jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_business uuid := private.current_business_id();
  v_user uuid := auth.uid();
  v_sale_id uuid;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
begin
  if v_business is null or v_user is null then raise exception 'Not authorized'; end if;
  v_sale_id := coalesce((p_sale->>'id')::uuid, gen_random_uuid());

  if exists (select 1 from sales where id = v_sale_id and business_id = v_business) then
    return jsonb_build_object('ok', true, 'duplicate', true, 'sale_id', v_sale_id);
  end if;

  insert into sales (id,business_id,invoice_number,cashier_id,subtotal,discount_percent,discount_amount,tax_rate,tax_amount,total,payment_method,created_at,updated_at)
  values (v_sale_id,v_business,p_sale->>'invoice_number',v_user,coalesce((p_sale->>'subtotal')::numeric,0),coalesce((p_sale->>'discount')::numeric,0),coalesce((p_sale->>'discount_amount')::numeric,0),coalesce((p_sale->>'tax_rate')::numeric,0),coalesce((p_sale->>'tax_amount')::numeric,0),coalesce((p_sale->>'total')::numeric,0),coalesce(p_sale->>'payment_method','cash'),coalesce((p_sale->>'created_at')::timestamptz,now()),now());

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::integer;
    if v_qty is null or v_qty <= 0 then raise exception 'Invalid sale quantity'; end if;

    select * into v_product from products
      where id = (v_item->>'product_id')::uuid and business_id = v_business and archived = false
      for update;
    if not found then raise exception 'Product unavailable'; end if;
    if v_product.quantity < v_qty then raise exception 'Insufficient stock for %', v_product.name; end if;

    insert into sale_items (id,sale_id,product_id,product_name,quantity,price,cost_price,subtotal)
    values (coalesce((v_item->>'id')::uuid,gen_random_uuid()),v_sale_id,v_product.id,v_product.name,v_qty,coalesce((v_item->>'price')::numeric,v_product.selling_price),v_product.cost_price,coalesce((v_item->>'subtotal')::numeric,0));

    update products set quantity = quantity - v_qty, updated_at = now() where id = v_product.id;

    insert into inventory_movements (business_id,product_id,type,quantity,before_quantity,after_quantity,reference_id,reference_type,actor_id)
    values (v_business,v_product.id,'SALE',-v_qty,v_product.quantity,v_product.quantity-v_qty,v_sale_id,'sale',v_user);
  end loop;

  insert into audit_logs (business_id,action,entity_type,entity_id,actor_id,metadata)
  values (v_business,'CREATE_SALE','sale',v_sale_id::text,v_user,jsonb_build_object('invoice_number',p_sale->>'invoice_number','total',p_sale->>'total'));

  return jsonb_build_object('ok',true,'duplicate',false,'sale_id',v_sale_id);
end;
$$;

create or replace function public.adjust_inventory(p_product_id uuid, p_delta integer, p_type text default 'ADJUSTMENT', p_note text default '')
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_business uuid := private.current_business_id();
  v_user uuid := auth.uid();
  v_product public.products%rowtype;
  v_before integer;
  v_after integer;
  v_id uuid := gen_random_uuid();
begin
  if v_business is null or v_user is null then raise exception 'Not authorized'; end if;
  if p_delta = 0 then raise exception 'Inventory adjustment cannot be zero'; end if;

  select * into v_product from products where id=p_product_id and business_id=v_business and archived=false for update;
  if not found then raise exception 'Product unavailable'; end if;

  v_before := v_product.quantity;
  v_after := v_before + p_delta;
  if v_after < 0 then raise exception 'Inventory cannot become negative'; end if;

  update products set quantity=v_after, updated_at=now() where id=v_product.id;
  insert into inventory_movements(business_id,product_id,type,quantity,before_quantity,after_quantity,note,actor_id)
  values(v_business,v_product.id,p_type,p_delta,v_before,v_after,p_note,v_user);
  insert into audit_logs(business_id,action,entity_type,entity_id,actor_id,metadata)
  values(v_business,'INVENTORY_ADJUST','product',v_product.id::text,v_user,jsonb_build_object('delta',p_delta,'type',p_type,'note',p_note));

  return jsonb_build_object('ok',true,'product_id',v_product.id,'quantity',v_after);
end;
$$;

alter table public.businesses enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.audit_logs enable row level security;
alter table public.business_settings enable row level security;

create policy "members can view business" on public.businesses for select to authenticated using (id = private.current_business_id());
create policy "members can view profiles" on public.profiles for select to authenticated using (business_id = private.current_business_id());
create policy "members can view products" on public.products for select to authenticated using (business_id = private.current_business_id());
create policy "managers can manage products" on public.products for all to authenticated using (business_id = private.current_business_id()) with check (business_id = private.current_business_id());
create policy "members can view customers" on public.customers for select to authenticated using (business_id = private.current_business_id());
create policy "members can manage customers" on public.customers for insert to authenticated with check (business_id = private.current_business_id());
create policy "members can update customers" on public.customers for update to authenticated using (business_id = private.current_business_id()) with check (business_id = private.current_business_id());
create policy "members can view sales" on public.sales for select to authenticated using (business_id = private.current_business_id());
create policy "members can view sale items" on public.sale_items for select to authenticated using (exists (select 1 from sales s where s.id=sale_id and s.business_id=private.current_business_id()));
create policy "members can view inventory" on public.inventory_movements for select to authenticated using (business_id = private.current_business_id());
create policy "members can view audit" on public.audit_logs for select to authenticated using (business_id = private.current_business_id());
create policy "members can view settings" on public.business_settings for select to authenticated using (business_id = private.current_business_id());
create policy "admins can update settings" on public.business_settings for update to authenticated using (business_id = private.current_business_id()) with check (business_id = private.current_business_id());

revoke all on function public.create_sale(jsonb,jsonb) from public;
revoke all on function public.adjust_inventory(uuid,integer,text,text) from public;
grant execute on function public.create_sale(jsonb,jsonb) to authenticated;
grant execute on function public.adjust_inventory(uuid,integer,text,text) to authenticated;

insert into public.businesses (id, name, currency)
values ('00000000-0000-0000-0000-000000000001', 'My Retail Shop', 'GHS')
on conflict (id) do nothing;

insert into public.business_settings (id, business_id, business_name, currency, tax_rate, receipt_footer, low_stock_threshold, preset)
values (1, '00000000-0000-0000-0000-000000000001', 'My Retail Shop', 'GHS', 0, 'Thank you for shopping with us!', 10, 'classic-blue')
on conflict (id) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business uuid := '00000000-0000-0000-0000-000000000001';
  v_role text := 'cashier';
begin
  if not exists (select 1 from public.profiles) then
    v_role := 'owner';
  end if;

  insert into public.profiles (id, business_id, name, email, role)
  values (
    new.id,
    v_business,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    v_role
  )
  on conflict (id) do update
    set email = excluded.email, name = excluded.name;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

revoke all on function public.handle_new_user() from public;
