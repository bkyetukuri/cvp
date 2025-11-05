const cds = require('@sap/cds');
const express = require('express');

cds.on('bootstrap', app => {
  app.get('/triggerETL', async (req, res) => {
    const srv = await cds.connect.to('EtlService');
    const result = await srv.run(EtlService.runETL());
    res.send(result);
  });
});

module.exports = cds.server;
