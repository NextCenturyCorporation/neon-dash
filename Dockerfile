FROM nginx:alpine

## From 'builder' stage copy over the artifacts in dist folder to default nginx public folder
COPY /dist /var/www
RUN echo $'server {\n\
  listen 80;\n\
  server_name neon-ui;\n\
  root /var/www;\n\
  index index.html;\n\
  location / {\n\
    try_files $uri /index.html;\n\
  }\n\
  location /neon {\n\
    proxy_pass http://neonserver;\n\
  }\n\
  }' > /etc/nginx/conf.d/default.conf;
