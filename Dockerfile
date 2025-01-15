FROM osgeo/gdal:ubuntu-small-3.6.3
ENV PYTHONUNBUFFERED=1

# Doesn't interrupt for user input while installing packages.
ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /code
COPY ./requirements.txt /code/requirements.txt

# Installing build dependencies and needed tools.
RUN apt-get update \
    && buildDeps='python3-dev build-essential python3-pip' \
    && apt-get -y install --no-install-recommends $buildDeps\
    # Installing dependecy.
    && pip3 install --upgrade --no-cache-dir pip setuptools wheel \
    && pip3 install --no-cache-dir -r requirements.txt \
    # Uninstalling build tools.
    && apt-get clean && rm -rf /var/lib/apt/lists/* \
    && apt-get purge -y --auto-remove $buildDeps

# Setup.
COPY ./src /code/src
COPY ./log_config.json /code
COPY ./.coveragerc /code

# Starting server.
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000","--workers", "4","--log-config", "log_config.json", "--timeout-keep-alive", "60"]
