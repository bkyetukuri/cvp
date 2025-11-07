// srv/cron-etl.js
const cds = require('@sap/cds');
const cron = require('node-cron');
// const { v4: uuidv4 } = require('uuid');

const { uuid } = cds.utils;

// Reuse CAP's QL helpers explicitly in utility modules
const { INSERT } = cds.ql;

// System user used by the cron job (no JWT required)
const SYSTEM_USER = new cds.User({ id: 'system', roles: ['system'] });

/* ----------------------------------------------------------------------
 * ETL_Log writing is DISABLED per request.
 * The helper and all its call sites are commented out below.
 * ---------------------------------------------------------------------- */

// // Small helper to insert a log row into txn.ETL_Log
// async function writeLog(db, { status, message, msgID = 'CRON', orderID = null }) {
//   await db.run(
//     INSERT.into('txn.ETL_Log').entries({
//       ID: uuid(),
//       msgID,                  // 'CRON' for scheduler-level entries
//       orderID,                // null (scheduler-level), or set if you want
//       msgCreatedDate: new Date(),
//       status,                 // e.g., CRON_START / CRON_SUCCESS / CRON_FAILED
//       message,                // free text
//       runTimestamp: new Date()
//     })
//   );
// }

async function runETLInternal() {
  const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  // const db = await cds.connect.to('db'); // not needed while ETL_Log is disabled

  try {
    // // Log START
    // await writeLog(db, {
    //   status: 'CRON_START',
    //   message: `Scheduled ETL run started (runId=${runId})`
    // });
    console.log(`[CRON] START — Scheduled ETL run started (runId=${runId})`);

    // Execute ETL as system user to bypass JWT checks
    const etl = await cds.connect.to('ETLService');
    const result = await etl.tx({ user: SYSTEM_USER }).emit('runETL');

    // // Log SUCCESS (include handler's summary if any)
    // await writeLog(db, {
    //   status: 'CRON_SUCCESS',
    //   message: `ETL executed successfully (runId=${runId}) — ${result || 'no summary'}`
    // });
    console.log(`[CRON] SUCCESS — ETL executed (runId=${runId}) — ${result || 'no summary'}`);
  } catch (err) {
    const reason = err?.message || String(err);

    // // Log FAILURE with reason
    // await writeLog(db, {
    //   status: 'CRON_FAILED',
    //   message: `ETL failed (runId=${runId}) — ${reason}`
    // });
    console.error(`[CRON] FAILED — (runId=${runId}) — ${reason}`);
    console.error(err);
  }
}

// Schedule: every 15 min, Mon–Fri, 7 AM–7 PM EST (12–23 UTC)
cds.once('served', () => {
  cron.schedule('*/15 12-23 * * 1-5', runETLInternal, {
    timezone: 'America/New_York'
  });
  console.log('[CRON] ETL scheduler active: every 15 min, Mon–Fri, 7 AM–7 PM EST');

  // Optional: fire once on startup
  runETLInternal();
});