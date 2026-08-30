-- §4 lists "ambiance" as a distinct creation-time field alongside "style"
-- (e.g. style = "champêtre", ambiance = "chaleureuse et festive"). Added as
-- its own migration since it was missed in the initial schema.
alter table public.weddings
  add column ambiance text;
