-- Разрешаем админам удалять заявки партнёров
CREATE POLICY "Admins can delete partner applications"
ON public.partner_applications
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));