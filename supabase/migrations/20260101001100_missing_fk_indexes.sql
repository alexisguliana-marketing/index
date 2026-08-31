-- Performance advisor (INFO): foreign key columns without a covering index.
-- Harmless on a brand-new, empty database, but every one of these is a join
-- or lookup path the app already uses (task/budget category lookups,
-- conversation/message fan-out, portfolio joins, etc.) — indexing them now
-- costs nothing and avoids a table scan once there's real data.
create index budget_items_category_id_idx on public.budget_items (category_id);
create index collection_items_media_id_idx on public.collection_items (media_id);
create index collections_wedding_id_idx on public.collections (wedding_id);
create index comments_author_user_id_idx on public.comments (author_user_id);
create index conversation_members_user_id_idx on public.conversation_members (user_id);
create index conversations_vendor_id_idx on public.conversations (vendor_id);
create index favorites_media_id_idx on public.favorites (media_id);
create index favorites_vendor_id_idx on public.favorites (vendor_id);
create index likes_user_id_idx on public.likes (user_id);
create index media_uploaded_by_user_id_idx on public.media (uploaded_by_user_id);
create index messages_attachment_media_id_idx on public.messages (attachment_media_id);
create index messages_sender_user_id_idx on public.messages (sender_user_id);
create index posts_author_user_id_idx on public.posts (author_user_id);
create index posts_author_vendor_id_idx on public.posts (author_vendor_id);
create index posts_wedding_id_idx on public.posts (wedding_id);
create index tasks_assignee_member_id_idx on public.tasks (assignee_member_id);
create index tasks_category_id_idx on public.tasks (category_id);
create index vendor_categories_parent_id_idx on public.vendor_categories (parent_id);
create index vendor_category_assignments_category_id_idx on public.vendor_category_assignments (category_id);
create index vendor_portfolio_items_category_id_idx on public.vendor_portfolio_items (category_id);
create index vendor_portfolio_items_media_id_idx on public.vendor_portfolio_items (media_id);
create index vendor_portfolio_items_service_id_idx on public.vendor_portfolio_items (service_id);
create index vendor_portfolio_items_wedding_id_idx on public.vendor_portfolio_items (wedding_id);
create index vendor_relationships_wedding_id_idx on public.vendor_relationships (wedding_id);
create index vendor_reviews_author_user_id_idx on public.vendor_reviews (author_user_id);
create index vendor_reviews_wedding_id_idx on public.vendor_reviews (wedding_id);
create index weddings_created_by_idx on public.weddings (created_by);
