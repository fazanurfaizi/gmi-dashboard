-- seed.sql
INSERT INTO dashboards (name, code, widgets, created_at, updated_at)
SELECT 'General Dashboard', 'default', '[]', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000
WHERE NOT EXISTS (
    SELECT 1 FROM dashboards WHERE code = 'default'
);