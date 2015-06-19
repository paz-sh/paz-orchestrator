#!/bin/bash -e

PAZ_IP=${DOCKER_HOST:-$(ip route get 1 | awk '{print $NF;exit}')}

echo PAZ_IP $PAZ_IP
sed -E "s/(ETCD_ADDR|ETCD_PEER_ADDR)=([^:]+)/\1=${PAZ_IP}/g" -i.bak docker-compose.yml

docker-compose build && docker-compose up -d && sleep 3 && lab && docker-compose stop
