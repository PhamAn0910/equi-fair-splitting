-- 1. Groups (Managed by the logged-in user)
CREATE TABLE public.groups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  currency text DEFAULT 'EUR',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- RLS policies for groups
CREATE POLICY "Users can view their own groups"
  ON public.groups FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own groups"
  ON public.groups FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own groups"
  ON public.groups FOR DELETE
  USING (auth.uid() = created_by);

-- 2. Members (Virtual users, just names & colors)
CREATE TABLE public.group_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid REFERENCES public.groups ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  avatar_color text NOT NULL,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for group_members (access through group ownership)
CREATE POLICY "Users can view members of their groups"
  ON public.group_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.groups WHERE groups.id = group_members.group_id AND groups.created_by = auth.uid()
  ));

CREATE POLICY "Users can add members to their groups"
  ON public.group_members FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.groups WHERE groups.id = group_members.group_id AND groups.created_by = auth.uid()
  ));

CREATE POLICY "Users can update members of their groups"
  ON public.group_members FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.groups WHERE groups.id = group_members.group_id AND groups.created_by = auth.uid()
  ));

CREATE POLICY "Users can delete members from their groups"
  ON public.group_members FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.groups WHERE groups.id = group_members.group_id AND groups.created_by = auth.uid()
  ));

-- 3. Expenses (The Bill)
CREATE TABLE public.expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid REFERENCES public.groups ON DELETE CASCADE NOT NULL,
  payer_member_id uuid REFERENCES public.group_members ON DELETE SET NULL,
  description text,
  total_amount numeric NOT NULL DEFAULT 0,
  receipt_image_url text,
  date date DEFAULT current_date,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS policies for expenses
CREATE POLICY "Users can view expenses of their groups"
  ON public.expenses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.groups WHERE groups.id = expenses.group_id AND groups.created_by = auth.uid()
  ));

CREATE POLICY "Users can create expenses in their groups"
  ON public.expenses FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.groups WHERE groups.id = expenses.group_id AND groups.created_by = auth.uid()
  ));

CREATE POLICY "Users can update expenses in their groups"
  ON public.expenses FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.groups WHERE groups.id = expenses.group_id AND groups.created_by = auth.uid()
  ));

CREATE POLICY "Users can delete expenses from their groups"
  ON public.expenses FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.groups WHERE groups.id = expenses.group_id AND groups.created_by = auth.uid()
  ));

-- 4. Expense Items (Parsed from OCR)
CREATE TABLE public.expense_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id uuid REFERENCES public.expenses ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  price numeric NOT NULL,
  quantity integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for expense_items
CREATE POLICY "Users can view expense items of their expenses"
  ON public.expense_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.expenses 
    JOIN public.groups ON groups.id = expenses.group_id 
    WHERE expenses.id = expense_items.expense_id AND groups.created_by = auth.uid()
  ));

CREATE POLICY "Users can create expense items"
  ON public.expense_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.expenses 
    JOIN public.groups ON groups.id = expenses.group_id 
    WHERE expenses.id = expense_items.expense_id AND groups.created_by = auth.uid()
  ));

CREATE POLICY "Users can update expense items"
  ON public.expense_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.expenses 
    JOIN public.groups ON groups.id = expenses.group_id 
    WHERE expenses.id = expense_items.expense_id AND groups.created_by = auth.uid()
  ));

CREATE POLICY "Users can delete expense items"
  ON public.expense_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.expenses 
    JOIN public.groups ON groups.id = expenses.group_id 
    WHERE expenses.id = expense_items.expense_id AND groups.created_by = auth.uid()
  ));

-- 5. Item Assignments (The Split Logic)
CREATE TABLE public.item_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id uuid REFERENCES public.expense_items ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES public.group_members ON DELETE CASCADE NOT NULL,
  share_fraction numeric DEFAULT 1.0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.item_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for item_assignments
CREATE POLICY "Users can view item assignments"
  ON public.item_assignments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.expense_items
    JOIN public.expenses ON expenses.id = expense_items.expense_id
    JOIN public.groups ON groups.id = expenses.group_id
    WHERE expense_items.id = item_assignments.item_id AND groups.created_by = auth.uid()
  ));

CREATE POLICY "Users can create item assignments"
  ON public.item_assignments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.expense_items
    JOIN public.expenses ON expenses.id = expense_items.expense_id
    JOIN public.groups ON groups.id = expenses.group_id
    WHERE expense_items.id = item_assignments.item_id AND groups.created_by = auth.uid()
  ));

CREATE POLICY "Users can update item assignments"
  ON public.item_assignments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.expense_items
    JOIN public.expenses ON expenses.id = expense_items.expense_id
    JOIN public.groups ON groups.id = expenses.group_id
    WHERE expense_items.id = item_assignments.item_id AND groups.created_by = auth.uid()
  ));

CREATE POLICY "Users can delete item assignments"
  ON public.item_assignments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.expense_items
    JOIN public.expenses ON expenses.id = expense_items.expense_id
    JOIN public.groups ON groups.id = expenses.group_id
    WHERE expense_items.id = item_assignments.item_id AND groups.created_by = auth.uid()
  ));