const express = require('express');
const proxy = require('express-http-proxy');
const app = express();
const path = require('path');

app.use(express.static('dist'));
app.use('/', proxy('neon-server.nc-demo.com', {
  filter: (req) => req.path.includes('/neon/'),
  proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
    proxyReqOpts.headers['Authorization'] = 'Basic ***REMOVED***';
    return proxyReqOpts;
  }
}));
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist/index.html'));
});

app.listen(4199);
