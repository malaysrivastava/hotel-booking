const { createServer } = require('http');
const { createApp } = require('../../dist/frontend/server/main');

exports.handler = async (event, context) => {
  const app = createApp();
  const server = createServer(app);
  
  return new Promise((resolve, reject) => {
    server.listen(0, () => {
      resolve({
        statusCode: 200,
        body: JSON.stringify({
          message: 'Server is up and running!'
        })
      });
    });
  });
};
