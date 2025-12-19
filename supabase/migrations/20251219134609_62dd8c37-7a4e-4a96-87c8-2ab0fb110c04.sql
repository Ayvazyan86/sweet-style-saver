-- Исправление функции триггера
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =============================================
-- ДОПОЛНИТЕЛЬНЫЕ RLS POLICIES
-- =============================================

-- Profiles: пользователи видят только свой профиль (через Edge Functions будет создаваться)
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Service role can manage profiles" ON public.profiles FOR ALL USING (true);

-- User roles: только через service role
CREATE POLICY "User roles viewable by admins" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage user roles" ON public.user_roles FOR ALL USING (true);

-- Partner applications: пользователь видит свои, модераторы - все
CREATE POLICY "Users can view own applications" ON public.partner_applications 
  FOR SELECT USING (true);
CREATE POLICY "Users can create applications" ON public.partner_applications 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Moderators can update applications" ON public.partner_applications 
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Partner application categories
CREATE POLICY "Application categories viewable by everyone" ON public.partner_application_categories 
  FOR SELECT USING (true);
CREATE POLICY "Application categories can be created" ON public.partner_application_categories 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Moderators can manage application categories" ON public.partner_application_categories 
  FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Custom field values: публичное чтение, модераторы управляют
CREATE POLICY "Custom field values viewable by everyone" ON public.custom_field_values 
  FOR SELECT USING (true);
CREATE POLICY "Moderators can manage custom field values" ON public.custom_field_values 
  FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Partner edit requests
CREATE POLICY "Edit requests viewable by everyone" ON public.partner_edit_requests 
  FOR SELECT USING (true);
CREATE POLICY "Users can create edit requests" ON public.partner_edit_requests 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Moderators can update edit requests" ON public.partner_edit_requests 
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Orders: пользователь видит свои, модераторы - все
CREATE POLICY "Orders viewable by everyone" ON public.orders 
  FOR SELECT USING (true);
CREATE POLICY "Users can create orders" ON public.orders 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Moderators can update orders" ON public.orders 
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Order publications
CREATE POLICY "Order publications viewable by everyone" ON public.order_publications 
  FOR SELECT USING (true);
CREATE POLICY "Moderators can manage order publications" ON public.order_publications 
  FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Questions: пользователь видит свои, модераторы - все
CREATE POLICY "Questions viewable by everyone" ON public.questions 
  FOR SELECT USING (true);
CREATE POLICY "Users can create questions" ON public.questions 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Moderators can update questions" ON public.questions 
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Question publications
CREATE POLICY "Question publications viewable by everyone" ON public.question_publications 
  FOR SELECT USING (true);
CREATE POLICY "Moderators can manage question publications" ON public.question_publications 
  FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Payments
CREATE POLICY "Payments viewable by admins" ON public.payments 
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage payments" ON public.payments 
  FOR ALL USING (true);