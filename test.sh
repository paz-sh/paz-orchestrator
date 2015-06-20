#!/bin/bash -e

PAZ_IP=${DOCKER_HOST:-$(ip route get 1 | awk '{print $NF;exit}')}

echo PAZ_IP $PAZ_IP
sed -E "s/(ETCD_ADVERTISE_CLIENT_URLS)=.*/\1=http:\/\/${PAZ_IP}:2379/g" -i.bak docker-compose.yml

docker-compose pull ; docker-compose build && docker-compose up -d && sleep 3 && lab && docker-compose stop
