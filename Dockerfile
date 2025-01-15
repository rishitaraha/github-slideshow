# syntax=docker/dockerfile:1

# Official GDAL image as the base image.
FROM osgeo/gdal:ubuntu-small-3.6.3

# Doesn't interrupt for user input while installing packages.
ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /code
COPY requirements.txt /code/

# Installing important packages and external libaries.
# libpangocairo --> needed by weasyprint.
# python3-dev and build-essential ---> needed for building wheels.
# libpq-dev ---> needed for psycopg2
RUN apt-get update \
  && buildDeps='python3-dev build-essential python3-pip libpq-dev' \
  && apt-get -y install --no-install-recommends \
  $buildDeps postgis  libpangocairo-1.0-0 python3-fiona \
  # Install the necessary dependencies.
  && pip3 install --no-cache-dir --upgrade pip setuptools wheel \
  && pip3 install --no-cache-dir -r requirements.txt \
  # Decreases the size of the build-image.
  && apt -y autoremove $buildDeps\
  # This ensures that no recommended packages are installed, and that the cache is cleared at the end.
  && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY . /code/

EXPOSE 80

ADD docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod a+x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]

# Reference for lifespan issue with Django: https://stackoverflow.com/a/75480960
CMD ["uvicorn", "rainbow.asgi:application", "--host", "0.0.0.0", "--port", "80", "--workers", "3", "--log-config", "log_config.json","--timeout-keep-alive","300", "--lifespan", "off"]
