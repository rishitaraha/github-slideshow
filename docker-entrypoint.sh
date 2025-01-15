#!/bin/bash -x
if [ "$ENVIRONMENT" != "test" ];then
    python manage.py migrate --database=default_with_migration_rights --noinput || exit 1
fi

# Adds reference/link of all static files to a single file.
python3 manage.py collectstatic --noinput --clear --link

exec "$@"
