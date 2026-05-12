-- initial_schema.sql

-- 1. Organizations (Companies)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Profiles (Users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),
  full_name TEXT,
  role TEXT DEFAULT 'OPERATOR',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Units (Branches)
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  is_main BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  uom TEXT DEFAULT 'UN',
  min_stock NUMERIC DEFAULT 0,
  weight_per_unit NUMERIC,
  meter_per_unit NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, sku)
);

-- 5. Stock Levels (Actual Quantity at Units)
CREATE TABLE stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) NOT NULL,
  unit_id UUID REFERENCES units(id) NOT NULL,
  quantity NUMERIC DEFAULT 0 CHECK (quantity >= 0),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, unit_id)
);

-- 6. Batches (Lotes)
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) NOT NULL,
  batch_number TEXT NOT NULL,
  initial_measurement NUMERIC,
  current_measurement NUMERIC,
  initial_weight NUMERIC,
  current_weight NUMERIC,
  uom TEXT,
  status TEXT DEFAULT 'AVAILABLE',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Movements
CREATE TABLE movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  unit_id UUID REFERENCES units(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  type TEXT NOT NULL, -- 'IN', 'OUT', 'ADJUST', 'TRANSFER'
  quantity NUMERIC NOT NULL,
  reason TEXT,
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Production Orders
CREATE TABLE production_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  unit_id UUID REFERENCES units(id) NOT NULL,
  po_number TEXT NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  target_quantity NUMERIC DEFAULT 0,
  produced_quantity NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'DRAFT',
  machine_id TEXT,
  operator_id UUID REFERENCES profiles(id),
  expected_loss_pct NUMERIC DEFAULT 0,
  actual_loss_qty NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

-- 9. Production Logs
CREATE TABLE production_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES production_orders(id) NOT NULL,
  type TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  measurement NUMERIC,
  weight NUMERIC,
  user_id UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS (Row Level Security) - Basic Helpers
CREATE OR REPLACE FUNCTION my_company_id() RETURNS UUID AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- Example RLS Policy for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see their company products" 
ON products FOR SELECT USING (company_id = my_company_id());

-- Policy for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'OWNER');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
