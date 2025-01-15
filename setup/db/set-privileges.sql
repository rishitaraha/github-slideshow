CREATE USER ra_dev_user WITH PASSWORD '********' LOGIN NOCREATEROLE NOCREATEDB NOSUPERUSER NOINHERIT CONNECTION LIMIT 10;

CREATE USER ra_app_user WITH PASSWORD '********' LOGIN NOCREATEROLE NOCREATEDB NOSUPERUSER NOINHERIT CONNECTION LIMIT 100;

CREATE USER ra_app_migrate_user ENCRYPTED PASSWORD '********' LOGIN NOCREATEROLE NOCREATEDB NOSUPERUSER NOINHERIT CONNECTION LIMIT 50;

CREATE USER tile_user WITH PASSWORD '********'  LOGIN NOCREATEROLE NOCREATEDB NOSUPERUSER NOINHERIT CONNECTION LIMIT 50;

CREATE USER analytics_engine_user WITH PASSWORD '********'  LOGIN NOCREATEROLE NOCREATEDB NOSUPERUSER NOINHERIT CONNECTION LIMIT 50;

-- postgres root user should not be used for non-administrative tasks.
-- It includes users & roles management, backup & restore, DB maintenance tasks, replication, load balancing etc.
-- Replace the postgres with the existing DB name.
GRANT CONNECT ON DATABASE postgres TO ra_dev_user;

GRANT CONNECT ON DATABASE postgres TO ra_app_user;

GRANT CONNECT ON DATABASE postgres TO ra_app_migrate_user;

GRANT CONNECT ON DATABASE db_name TO analytics_engine_user;

GRANT CONNECT ON DATABASE db_name TO tile_user;


-- Revoke rights from the PUBLIC role
REVOKE ALL PRIVILEGES ON DATABASE postgres FROM PUBLIC;

REVOKE ALL PRIVILEGES ON SCHEMA public FROM PUBLIC;


-- Revoke permission to create any object in the Database.
REVOKE CREATE ON DATABASE postgres FROM ra_app_user;

REVOKE CREATE ON DATABASE postgres FROM ra_dev_user;

REVOKE CREATE ON DATABASE postgres FROM ra_app_migrate_user;


-- For schemas, CREATE allows new objects to be created within the schema.
REVOKE CREATE ON SCHEMA public FROM ra_app_user;

REVOKE CREATE ON SCHEMA public FROM ra_dev_user;


-- Must have the USAGE on the schema containing the object to view the objects.
GRANT USAGE ON SCHEMA public TO ra_dev_user;

GRANT USAGE ON SCHEMA public TO ra_app_user;

GRANT USAGE ON SCHEMA public TO tile_user;

GRANT USAGE ON SCHEMA public TO analytics_engine_user;


-- Grant create temporary table permission.
-- Change the database name before run.
GRANT TEMPORARY ON DATABASE db_name TO ra_app_user;
GRANT TEMPORARY ON DATABASE db_name TO analytics_engine_user;


-- Migration required CREATE privilege in SCHEMA.
GRANT USAGE, CREATE ON SCHEMA public TO ra_app_migrate_user;


-- Only the Owner of objects has permission to DROP, MODIFY & ALTER it.
ALTER SCHEMA public OWNER TO ra_app_migrate_user;


-- Requires following permission to use, manipulate data,
-- TRIGGER Privilege allows creation of a trigger in Table/View, so only migration needs it.
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES ON ALL TABLES IN SCHEMA public TO ra_app_user;

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES ON ALL TABLES IN SCHEMA public TO ra_dev_user;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ra_app_migrate_user;


-- Requires USAGE and SELECT on Sequences.
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public  TO ra_app_user;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public  TO ra_dev_user;

GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ra_app_migrate_user;


-- EXECUTE allows calling a function or procedure, only migration can create a function/procedure.
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO ra_app_user;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO ra_dev_user;

GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO ra_app_migrate_user;


-- Allows executing a routine. Migration user can create one also.
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO ra_app_user;

GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO ra_dev_user;

GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO ra_app_migrate_user;


-- Setup default privileges to ease the management of rights for new objects created by migration role.
ALTER DEFAULT PRIVILEGES FOR USER ra_app_migrate_user IN SCHEMA public GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES ON TABLES TO ra_app_user;

ALTER DEFAULT PRIVILEGES FOR USER ra_app_migrate_user IN SCHEMA public GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES ON TABLES TO ra_dev_user;

ALTER DEFAULT PRIVILEGES FOR USER ra_app_migrate_user IN SCHEMA public GRANT SELECT ON SEQUENCES TO ra_app_user;

ALTER DEFAULT PRIVILEGES FOR USER ra_app_migrate_user IN SCHEMA public GRANT SELECT ON SEQUENCES TO ra_dev_user;

ALTER DEFAULT PRIVILEGES FOR USER ra_app_migrate_user IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO ra_app_user;

ALTER DEFAULT PRIVILEGES FOR USER ra_app_migrate_user IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO ra_dev_user;

ALTER DEFAULT PRIVILEGES FOR USER ra_app_migrate_user IN SCHEMA public GRANT EXECUTE ON ROUTINES TO ra_app_user;

ALTER DEFAULT PRIVILEGES FOR USER ra_app_migrate_user IN SCHEMA public GRANT EXECUTE ON ROUTINES TO ra_dev_user;


-- Tile user permission for tile server.
GRANT EXECUTE ON FUNCTION get_tile(UUID, INT, INT, INT) TO tile_user;
GRANT SELECT ON layer_manager_feature TO tile_user;

-- Analytics engine user permission for analytics engine.
GRANT EXECUTE ON FUNCTION bulk_update_features(features feature_type[]) TO analytics_engine_user;
GRANT EXECUTE ON FUNCTION get_features_by_layer(layer UUID) TO analytics_engine_user;
GRANT SELECT, UPDATE ON layer_manager_feature TO analytics_engine_user;
GRANT TEMPORARY ON DATABASE db_name TO analytics_engine_user;
