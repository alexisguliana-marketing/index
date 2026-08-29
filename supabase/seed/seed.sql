-- Reference data for local development. Keep in sync with
-- packages/config/src/taxonomies.ts — that TypeScript file is the source of
-- truth for slugs/labels; this file just mirrors it into Postgres.

insert into public.task_categories (slug, label, sort_order) values
  ('venue', 'Lieu', 1),
  ('catering', 'Traiteur', 2),
  ('photography', 'Photographie', 3),
  ('video', 'Vidéo', 4),
  ('music', 'Musique', 5),
  ('decoration', 'Décoration', 6),
  ('flowers', 'Fleurs', 7),
  ('dress', 'Robe', 8),
  ('suit', 'Costume', 9),
  ('beauty', 'Beauté', 10),
  ('invitations', 'Invitations', 11),
  ('transport', 'Transport', 12),
  ('accommodation', 'Hébergement', 13),
  ('ceremony', 'Cérémonie', 14),
  ('administrative', 'Administratif', 15),
  ('other', 'Autre', 16)
on conflict (slug) do nothing;

insert into public.vendor_categories (slug, label, parent_id) values
  ('photographer', 'Photographe', null),
  ('videographer', 'Vidéaste', null),
  ('caterer', 'Traiteur', null),
  ('dj', 'DJ', null),
  ('musician', 'Musicien', null),
  ('florist', 'Fleuriste', null),
  ('decorator', 'Décorateur', null),
  ('wedding_planner', 'Wedding planner', null),
  ('venue', 'Lieu de réception', null),
  ('bridal_wear', 'Robe', null),
  ('groom_wear', 'Costume', null),
  ('jewelry', 'Bijouterie', null),
  ('hair', 'Coiffure', null),
  ('makeup', 'Maquillage', null),
  ('pastry', 'Pâtisserie', null),
  ('transport', 'Transport', null),
  ('rental', 'Location', null),
  ('entertainment', 'Animation', null),
  ('stationery', 'Papeterie', null),
  ('other', 'Autre', null),
  ('wedding', 'Mariage', null),
  ('ceremony', 'Cérémonie', null),
  ('reception', 'Réception', null),
  ('engagement', 'Fiançailles', null)
on conflict (slug) do nothing;
