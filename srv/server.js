// srv/server.js
const cds = require('@sap/cds');

require('./cron-etl');  // ensure cron-etl.js runs on startup

cds.on('bootstrap', (app) => {
  app.get('/triggerETL', async (req, res) => {
    try {
      const srv = await cds.connect.to('ETLService');
      const result = await srv.send('runETL');
      res.status(200).send({
        status: 'SUCCESS',
        message: result || 'ETL executed successfully.'
      });
    } catch (err) {
      console.error('ETL trigger failed:', err);
      res.status(500).send({
        status: 'FAILED',
        message: err.message
      });
    }
  });
});

module.exports = cds.server;