function parse(header) {
  const code = (header || '').split(/:\s*basic\s+/i)[1];

  if (!code) {
    return undefined
  }
  const decoded = Buffer.from(code, 'base64').toString();
  let out = {};

  decoded.replace(/^([^:]*):(.*)$/, (all, user, password) => {
    out.user = user;
    out.password = password;
  });

  return Object.keys(out).length ? out : undefined;
}

function requestAuth(event, callback) {
  const body = 'Unauthorized';
  const response = {
    status: '401',
    statusDescription: 'Unauthorized',
    body: body,
    headers: {
      'www-authenticate': [{key: 'WWW-Authenticate', value: 'Basic'}]
    },
  };
  return callback(null, response);
}

exports.handler = async (event, context, callback) => {
  const [{cf}] = event.Records;
  const {headers} = cf.request;
  const authHeader = Array.isArray(headers.authorization) ? headers.authorization[0].value : undefined;
  const values = parse(authHeader);
  if (!authHeader || !values || !(values.user === 'username' && values.password === 'password')) {
    requestAuth(event, callback);
    return;
  }
  const {eventType} = cf.config;
  if (eventType && eventType.endsWith('response')) {
    return callback(null, cf.response);
  } else {
    return callback(null, cf.request);
  }
};