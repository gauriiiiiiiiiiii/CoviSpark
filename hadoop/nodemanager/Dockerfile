# NodeManager with python3 so Hadoop Streaming can run mapper.py / reducer.py.
# The base image is Debian 9 (stretch), whose packages now live on archive.debian.org.
FROM bde2020/hadoop-nodemanager:2.0.0-hadoop3.2.1-java8
RUN echo "deb http://archive.debian.org/debian stretch main" > /etc/apt/sources.list \
 && apt-get -o Acquire::Check-Valid-Until=false update \
 && apt-get install -y --no-install-recommends --allow-unauthenticated python3 \
 && rm -rf /var/lib/apt/lists/*
