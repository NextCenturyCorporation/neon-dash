FROM nginx:alpine

COPY /dist /var/www
COPY ./nginx.dash-only.conf /etc/nginx/conf.d/default.conf

