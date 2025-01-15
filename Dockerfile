FROM python:3.9
ENV PYTHONUNBUFFERED=1

RUN apt-get update

RUN curl -sL https://sentry.io/get-cli/ | bash

RUN apt-get -y install --no-install-recommends awscli 
RUN pip install mbutil

WORKDIR /app

ADD ./requirements.txt /app
RUN pip install -r requirements.txt

RUN mkdir -p /app/files

ADD ./monitor.sh /app/
ADD ./main.py /app/
