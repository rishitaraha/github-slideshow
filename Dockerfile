FROM osgeo/gdal:ubuntu-small-3.6.0

RUN apt-get update

RUN apt-get -y install --no-install-recommends \
    python3-dev \
    python3-pip

RUN apt-get -y install --no-install-recommends awscli 

RUN pip3 install --upgrade pip setuptools wheel

WORKDIR /app

ADD ./requirements.txt /app
RUN pip install -r requirements.txt

RUN mkdir -p /app/files

ADD ./monitor.sh /app/
ADD ./main.py /app/
