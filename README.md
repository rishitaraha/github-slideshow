# Rainbow API Engine

Django based API server to be consumed by frontend on the user end.

## Requirements

- Linux/Mac/Windows with at least 2 GB memory
- Docker Engine v20.x and docker-compose v1.29.x

## Getting started

The development server can be brought up with

```bash
sudo docker-compose up
```

Run this in the base directory where `docker-compose.yml` file is present.

This command will spin two containers. On is the Django API and second is the Postgres db container.

Once the services are up. You can access the API using http://127.0.0.1

If for some reason you need to rebuild your images then use this command.

```bash
sudo docker-compose up --build
```

### [How to Manage Database?](./setup/db/README.md)

## For Development

Before starting the development on the repo. Please run the following command to install the necessary pre-commit hook for git, for proper formatting of code.

```bash
pre-commit install
```

## Run Test

```bash
coverage run --concurrency=multiprocessing manage.py test --parallel -v 2 && coverage combine && coverage report -m
```

## Upgrade Packages (Dependency Update)

```bash
pip list --format=freeze | grep -v '^\-e' | cut -d = -f 1  | xargs -n1 pip install -U
```

```bash
pip freeze > requirements.txt
```
