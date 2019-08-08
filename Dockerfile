FROM nginx:alpine

## From 'builder' stage copy over the artifacts in dist folder to default nginx public folder
COPY /dist /var/www
COPY nginx-dockerized.conf /etc/nginx/conf.d/default.conf
COPY nginx-docker-htpasswd /etc/nginx/htpasswd

RUN /bin/sh -c 'sed -i -e "s/host: localhost/host: elasticsearch/" /var/www/app/config/config.yaml'
