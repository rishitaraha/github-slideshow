-- Change Ownership of Tables.
DO
LANGUAGE plpgsql
$$
DECLARE
  stmt text;
BEGIN
  FOR stmt IN
    WITH temp as (
    SELECT 'ALTER TABLE '|| schemaname || '."' || tablename ||'" OWNER TO ra_app_migrate_user' as command
    FROM pg_tables WHERE NOT schemaname IN ('pg_catalog', 'information_schema')
    ORDER BY schemaname, tablename )
    SELECT command from temp
  LOOP
    EXECUTE stmt;
  END LOOP;
END;
$$;

-- Change Ownership of Sequences.
DO
LANGUAGE plpgsql
$$
DECLARE
  stmt text;
BEGIN
  FOR stmt IN
    WITH temp as (
    SELECT 'ALTER SEQUENCE '|| sequence_schema || '."' || sequence_name ||'" OWNER TO ra_app_migrate_user;' as command
    FROM information_schema.sequences WHERE NOT sequence_schema IN ('pg_catalog', 'information_schema')
    ORDER BY sequence_schema, sequence_name)
    select command from temp
  LOOP
    EXECUTE stmt;
  END LOOP;
END;
$$;

-- Change Ownership of Views.
DO
LANGUAGE plpgsql
$$
DECLARE
  stmt text;
BEGIN
  FOR stmt IN
    WITH temp as (
    SELECT 'ALTER VIEW '|| table_schema || '."' || table_name ||'" OWNER TO ra_app_migrate_user;' as command
    FROM information_schema.views WHERE NOT table_schema IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema, table_name)
    select command from temp
  LOOP
    EXECUTE stmt;
  END LOOP;
END;
$$;

-- Change Ownership of Functions.
DO
LANGUAGE plpgsql
$$
DECLARE
    stmt text;
BEGIN
    FOR stmt IN
    WITH temp as(
    SELECT 'alter function '||nsp.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||') owner to ra_app_migrate_user;' as command
    FROM pg_proc p
    JOIN pg_namespace nsp ON p.pronamespace = nsp.oid
    WHERE NOT  nsp.nspname IN ('pg_catalog', 'information_schema'))
    SELECT command FROM temp
    LOOP
    EXECUTE stmt;
    END LOOP;
END;
$$;
