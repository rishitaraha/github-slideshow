# SQL DB Management

## Description
This project contains various SQL scripts for the management and hardening of DB servers,



## Usage
> Change all the Databases names & schema names as per the environment.

> For the scripts to run properly, the files should be run with super user privileges (commonly `postgres` root user).

### [ra-sql-privileges.sql](./ra-sql-privileges.sql)
There are 4 users created apart from root postgres user:
  - `ra_dev_user`:
    - This role is for developers, if they want to access DB.
    - It does't have create DB or objects in public schema.
  - `ra_app_user`:
    - This role will be used by our applications.
  - `ra_app_migrate_user`:
    - This role will be used by django to migrate.
  - `ra_test_user`:
    - This role is used by the gitlab runner test to create a temporary test DB and then run tests using it.

The alter commands for various objects to change default privileges helps provide other user roles to default access to new objects created by another user.
### [change_ownership.sql](./change_ownership.sql)
- The procedures in this file will change the ownership of all the Table, sequences, views & functions to `ra_app_migrate_user`.

## License
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Acknowledgments
- [Postgresql docs: GRANT](https://www.postgresql.org/docs/current/sql-grant.html)
- [Managing rights in postgres](https://wiki.postgresql.org/images/d/d1/Managing_rights_in_postgresql.pdf)
- [Postgresql: Better security for Django Applications](https://dev.to/matthewhegarty/postgresql-better-security-for-django-applications-3c7m)
