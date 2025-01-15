# Analytics Engine

A microservice for the analytics of geo special data.

## Requirements

- Linux/Mac/Windows with at least 2 GB memory
- Docker Engine v20.x and docker-compose v1.29.x

## Getting started

Login to Aereo DEV AWS with your credentials

```bash
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 375718637410.dkr.ecr.ap-south-1.amazonaws.com
```

To run a specific operation, create a `.env.${operation_name}` file in the `env_files` directory and update the `docker-compose.yml` file to use it.

The development server can be brought up with

```bash
sudo docker-compose up
```


Run this in the base directory where `docker-compose.yml` file is present.

This command will spin the container.

If for some reason you need to rebuild your images then use this command.

```bash
sudo docker-compose up --build
```

## For Development

Before starting the development on the repo. Please run the following command to install the necessary pre-commit hook for git, for proper formatting of code.

```bash
pre-commit install
```

## Run Test

```bash
coverage run -m  pytest -v && coverage report -m
```

## Upgrade Packages (Dependency Update)

```bash
pip list --format=freeze | grep -v '^\-e' | cut -d = -f 1  | xargs -n1 pip install -U
```

```bash
pip freeze > requirements.txt
```
