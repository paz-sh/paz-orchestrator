#!/bin/bash -e

PAZ_IP=${DOCKER_HOST:-$(ip route get 1 | awk '{print $NF;exit}')}

echo PAZ_IP $PAZ_IP
if [[ -z ${DOCKER_HOST} ]]; then
  PAZ_IP=$(ip route get 1 | awk '{print $NF;exit}')
  sed -E "s/(ETCD_ADVERTISE_CLIENT_URLS)=.*/\1=http:\/\/${PAZ_IP}:2379/g" -i docker-compose-local.yml
else
  # DOCKER_HOST set so assume OSX
  PAZ_IP=$(echo $DOCKER_HOST | cut -d: -f2 | cut -d/ -f3)
  sed -e "s/(ETCD_ADVERTISE_CLIENT_URLS)=.*/\1=http:\/\/${PAZ_IP}:2379/g" -i'' docker-compose-local.yml
fi

docker-compose pull ; docker-compose build && docker-compose up -d && sleep 3 && lab && docker-compose stop
