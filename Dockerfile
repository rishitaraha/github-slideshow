FROM 375718637410.dkr.ecr.ap-south-1.amazonaws.com/aereo-gis:latest
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
    && pip3 install docker \
    && pip3 install --upgrade --no-cache-dir pip setuptools wheel \
    && pip3 install --no-cache-dir -r requirements.txt \
    # Uninstalling build tools.
    && apt-get clean && rm -rf /var/lib/apt/lists/* \
    && apt-get purge -y --auto-remove $buildDeps

# Install Docker CLI tools
RUN curl -fsSL https://get.docker.com | sh \
&& rm -f /get-docker.sh

# Setup.
COPY ./src /code/src
COPY ./log_config.json /code
COPY ./.coveragerc /code

RUN mkdir -p /code/files
