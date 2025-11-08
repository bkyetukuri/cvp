// srv/server.js
const cds = require('@sap/cds');
const cors = require('cors');

require('./cron-etl');  // ensure cron-etl.js runs on startup

cds.on('bootstrap', (app) => {

  // Enable CORS globally
  app.use(cors({
    origin: 'https://anand-pag--inc--vendorportal-kzhz391l-vpd-cvp-app-router.cfapps.us10-001.hana.ondemand.com',  // or restrict to specific frontend domain
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

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