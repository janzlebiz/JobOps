insert into public.job_sources (name, source_type, base_url, enabled, access_method)
values
  ('upwork', 'marketplace', 'https://www.upwork.com', true, 'official_api'),
  ('freelancer', 'marketplace', 'https://www.freelancer.com', true, 'official_api'),
  ('onlinejobs_ph', 'job_board', 'https://www.onlinejobs.ph', true, 'authorized_feed'),
  ('demo_seed', 'demo', 'https://example.invalid', true, 'demo_seed')
on conflict (name) do nothing;

insert into public.skill_catalog (canonical_name, aliases, category)
values
  ('Excel', array['Microsoft Excel', 'Spreadsheets', 'XLSX'], 'spreadsheet_operations'),
  ('Google Sheets', array['Sheets', 'GSheets'], 'spreadsheet_operations'),
  ('SQL', array['PostgreSQL', 'MySQL', 'SQLite'], 'database_operations'),
  ('Inventory Management', array['Inventory', 'SKU', 'Stock Control'], 'inventory_operations'),
  ('Data Cleaning', array['Data Cleanup', 'Deduplication', 'Data QA'], 'quality_operations')
on conflict (canonical_name) do nothing;
