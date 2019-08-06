const express = require('express');
const proxy = require('express-http-proxy');
const app = express();
const path = require('path');

app.use(express.static('dist'));
app.use('/', proxy('loreleidemo.ddns.net', {
  filter: (req) => req.path.includes('/neon/'),
  proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
    proxyReqOpts.headers['Authorization'] = 'Basic bG9yZWxlaTp0aG9ydGhvcg==';
    return proxyReqOpts;
  }
}));
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist/index.html'));
});

app.listen(4199);