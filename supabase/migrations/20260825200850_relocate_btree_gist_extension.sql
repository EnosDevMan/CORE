-- Keep extension-owned objects out of the API-exposed public schema.
-- Existing installations move btree_gist; fresh/incomplete environments can
-- create it directly in the dedicated extensions schema.
create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;
alter extension btree_gist set schema extensions;
