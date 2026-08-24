-- SQL script mean to delete s restaurant while the restaraunt is at its minimum level of input, and dependencies.
-- This script is to clean up the restaurant created during the checkmate platform integration when a failure occurs.
-- -------------------------------------------------------
BEGIN;

DELETE FROM public.restaurant_menu_layout WHERE restaurant_id = <ENTER_ID> RETURNING *;
DELETE FROM public.restaurant_addresses WHERE restaurant_id = <ENTER_ID> RETURNING *;
DELETE FROM public.restaurant_hours where restaurant_id = <ENTER_ID> RETURNING *;
DELETE FROM public.restaurants where restaurant_id = <ENTER_ID> RETURNING *;

END TRANSACTION;


BEGIN;

DELETE FROM public.modifier_to_modifier_group_link WHERE modifier_to_modifier_group_link.modifier_id IN (
  SELECT modifiers.modifier_id FROM public.modifiers WHERE restaurant_id = <ID>
);

DELETE FROM public.modifiers WHERE restaurant_id = <ID> RETURNING *;

DELETE FROM public.modifier_group_to_menu_item_link WHERE modifier_group_to_menu_item_link.modifier_group_id IN (
  SELECT modifier_groups.modifier_group_id FROM public.modifier_groups WHERE restaurant_id = <ID>
);

DELETE FROM public.modifier_groups WHERE restaurant_id = <ID> RETURNING *;

DELETE FROM public.menu_items WHERE menu_items.menu_section_id IN (
  SELECT menu_sections.menu_section_id FROM public.menu_sections WHERE menu_id IN (
    SELECT menus.menu_id FROM public.menus WHERE restaurant_id = <ID>
  )
);

DELETE FROM public.menu_sections WHERE menu_sections.menu_id IN (
  SELECT menus.menu_id FROM public.menus WHERE restaurant_id = <ID>
);

DELETE FROM public.menu_messages WHERE menu_messages.menu_id IN (
  SELECT menus.menu_id FROM public.menus WHERE restaurant_id = <ID>
);

DELETE FROM public.menu_hours WHERE menu_hours.menu_id IN (
  SELECT menus.menu_id FROM public.menus WHERE restaurant_id = <ID>
);

DELETE FROM public.menus WHERE restaurant_id = <ID> RETURNING *;

END TRANSACTION;
