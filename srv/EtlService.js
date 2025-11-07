const cds = require('@sap/cds');

module.exports = async function () {
  const {
    SrvOrder_H,
    SrvOrder_I,
    SrvOrderPartner_H,
    SrvOrderPartner_I,
    SrvOrderAppt_H,
    SrvOrderAppt_I,
    SrvOrderText_H,
    SrvOrderText_I,
    ETL_Log
  } = cds.entities('stg');

  const {
    SORD_H,
    SORD_I,
    SORD_Partner,
    SORD_Appt,
    SORD_Text
  } = cds.entities('txn');

  //const { ETL_Log } = cds.entities('txn.ETL_Log'); 
  const LOG = cds.log('etl');

  // Helper: standardized log insertion
  async function insertLog(tx, { msgID, orderID, msgCreatedDate, status, message }) {
    await tx.run(
      INSERT.into(ETL_Log).entries({
        ID: cds.utils.uuid(),
        msgID,
        orderID,
        msgCreatedDate,
        status,
        message,
        runTimestamp: new Date()
      })
    );
  }

  // ----------------------------------------------------
  // Action Handler: runETL
  // ----------------------------------------------------
  this.on('runETL', async (req) => {
    const db = await cds.connect.to('db');
    const tx = db.transaction(req);

    let successCount = 0;
    let failCount = 0;
    let insUpd = "";

    try {
      // 1️ Get latest message per orderID (unprocessed only)
      const latestOrders = await tx.run(
        SELECT.from(SrvOrder_H)
          .columns(
            { ref: ['orderID'] },
            { func: 'max', args: [{ ref: ['msgCreatedDate'] }], as: 'latestMsgDate' }
          )
          .where({ processedFlag: false })
          .groupBy('orderID')
      );

      if (!latestOrders.length) {
        LOG.info('No new records found for ETL.');
        return 'No unprocessed service orders found.';
      }

      LOG.info(`Found ${latestOrders.length} unprocessed orders.`);

      // 2 Process each latest header
      for (const o of latestOrders) {
        const header = await tx.run(
          SELECT.one.from(SrvOrder_H).where({
            orderID: o.orderID,
            msgCreatedDate: o.latestMsgDate
          })
        );

        if (!header) continue;

        try {
          // 3️ Upsert Header (HANA-safe version)
          const existing = await tx.run(
            SELECT.one.from(SORD_H).where({ orderID: header.orderID })
          );

          if (existing) {
            await tx.run(
              UPDATE(SORD_H)
                .set({
                  ordSource: 'SO',
                  LastUpdatedTSFromS4: header.msgCreatedDate,
                  orderType: header.orderType,
                  salesOrganization: header.salesOrganization,
                  distributionChannel: header.distributionChannel,
                  division: header.division,
                  salesOffice: header.salesOffice,
                  salesGroup: header.salesGroup,
                  description: header.description,
                  language: header.language,
                  soldToParty: header.soldToParty,
                  soldToPartyName: header.soldToPartyName,
                  serviceParty: header.serviceParty,
                  servicePartyName: header.servicePartyName,
                  requestType: header.requestType,
                  serviceType: header.serviceType,
                  serviceSubType: header.serviceSubType,
                  priority: header.priority,
                  fnaStatus: header.fnaStatus,
                  confirmationNeeded: header.confirmationNeeded,
                  requestedStartDateTime: header.requestedStartDateTime,
                  requestedEndDateTime: header.requestedEndDateTime,
                  documentDataTimestamp: header.documentDataTimestamp,
                  customerPO: header.customerPO,
                  customerRef10: header.customerRef10,
                  customerName3: header.customerName3
                })
                .where({ orderID: header.orderID })
            );
                insUpd = 'UPDATED';
          } else {
            await tx.run(
              INSERT.into(SORD_H).entries({
                orderID: header.orderID,
                ordSource: 'SO',
                LastUpdatedTSFromS4: header.msgCreatedDate,
                orderType: header.orderType,
                salesOrganization: header.salesOrganization,
                distributionChannel: header.distributionChannel,
                division: header.division,
                salesOffice: header.salesOffice,
                salesGroup: header.salesGroup,
                description: header.description,
                language: header.language,
                soldToParty: header.soldToParty,
                soldToPartyName: header.soldToPartyName,
                serviceParty: header.serviceParty,
                servicePartyName: header.servicePartyName,
                requestType: header.requestType,
                serviceType: header.serviceType,
                serviceSubType: header.serviceSubType,
                priority: header.priority,
                fnaStatus: header.fnaStatus,
                confirmationNeeded: header.confirmationNeeded,
                requestedStartDateTime: header.requestedStartDateTime,
                requestedEndDateTime: header.requestedEndDateTime,
                documentDataTimestamp: header.documentDataTimestamp,
                customerPO: header.customerPO,
                customerRef10: header.customerRef10,
                customerName3: header.customerName3
              })
            );
              insUpd = 'INSERTED';
          }

          /*
          // 4️ Delete existing children
          await Promise.all([
            tx.run(DELETE.from(SORD_Text).where({ orderID: header.orderID })),
            tx.run(DELETE.from(SORD_Appt).where({ orderID: header.orderID })),
            tx.run(DELETE.from(SORD_Partner).where({ orderID: header.orderID })),
            tx.run(DELETE.from(SORD_I).where({ orderID: header.orderID }))
          ]);
          */
          await tx.run(DELETE.from(SORD_Text).where({ orderID: header.orderID }));
          await tx.run(DELETE.from(SORD_Appt).where({ orderID: header.orderID }));
          await tx.run(DELETE.from(SORD_Partner).where({ orderID: header.orderID }));
          await tx.run(DELETE.from(SORD_I).where({ orderID: header.orderID }));

          // 5️ Items (bulk insert)
          const items = await tx.run(SELECT.from(SrvOrder_I).where({ parent_ID: header.ID }));
          if (items.length) {
            await tx.run(
              INSERT.into(SORD_I).entries(
                items.map(i => ({
                  orderID: header.orderID,
                  itemNo: i.itemNo,
                  parentItem: i.parentItem,
                  product: i.product,
                  productDesc: i.productDesc,
                  language: i.language,
                  quantity: i.quantity,
                  quantityUnit: i.quantityUnit,
                  itemCategory: i.itemCategory,
                  isOpen: i.isOpen,
                  isReleased: i.isReleased,
                  isCompleted: i.isCompleted,
                  isRejected: i.isRejected,
                  userStatus: i.userStatus,
                  fnaStatus: i.fnaStatus,
                  confirmationNeeded: i.confirmationNeeded,
                  frequency: i.frequency,
                  materialGroup2: i.materialGroup2,
                  materialGroup2Desc: i.materialGroup2Desc
                }))
              )
            );
          }

          // 6 Header Partners
          const partners = await tx.run(SELECT.from(SrvOrderPartner_H).where({ parent_ID: header.ID }));
          if (partners.length) {
            await tx.run(
              INSERT.into(SORD_Partner).entries(
                partners.map(p => ({
                  orderID: header.orderID,
                  itemNo: 0,
                  partnerFunction: p.partnerFunction,
                  partnerNumber: p.partnerNumber,
                  partnerName: p.partnerName,
                  isMainPartner: p.isMainPartner,
                  numberType: p.numberType,
                  functionCategory: p.functionCategory,
                  houseNumber: p.houseNumber,
                  streetName: p.streetName,
                  cityName: p.cityName,
                  region: p.region,
                  postalCode: p.postalCode,
                  country: p.country,
                  dialCode: p.dialCode,
                  phoneNumber: p.phoneNumber,
                  phoneExtension: p.phoneExtension,
                  emailAddress: p.emailAddress
                }))
              )
            );
          }

          // 7 Item Partners
          if (items.length) {
            const itemIDs = items.map(i => i.ID);
            const itemPartners = await tx.run(
              SELECT.from(SrvOrderPartner_I).where({ parent_ID: { in: itemIDs } })
            );
            if (itemPartners.length) {
              await tx.run(
                INSERT.into(SORD_Partner).entries(
                  itemPartners.map(p => {
                    const parentItem = items.find(i => i.ID === p.parent_ID);
                    return {
                      orderID: header.orderID,
                      itemNo: parentItem?.itemNo || 0,
                      partnerFunction: p.partnerFunction,
                      partnerNumber: p.partnerNumber,
                      partnerName: p.partnerName,
                      isMainPartner: p.isMainPartner,
                      numberType: p.numberType,
                      functionCategory: p.functionCategory,
                      houseNumber: p.houseNumber,
                      streetName: p.streetName,
                      cityName: p.cityName,
                      region: p.region,
                      postalCode: p.postalCode,
                      country: p.country,
                      dialCode: p.dialCode,
                      phoneNumber: p.phoneNumber,
                      phoneExtension: p.phoneExtension,
                      emailAddress: p.emailAddress
                    };
                  })
                )
              );
            }
          }

          // 8 Header Appointments
          const appts = await tx.run(SELECT.from(SrvOrderAppt_H).where({ parent_ID: header.ID }));
          let plannedFromDateTime, plannedFromTimeZone, plannedToDateTime, plannedToTimeZone;
          if (appts.length) {
            await tx.run(
              INSERT.into(SORD_Appt).entries(
                appts.map(a => ({
                  orderID: header.orderID,
                  itemNo: 0,
                  apptType: a.apptType,
                  apptStartDateTime: a.apptStartDateTime,
                  apptStartTimeZone: a.apptStartTimeZone,
                  apptEndDateTime: a.apptEndDateTime,
                  apptEndTimeZone: a.apptEndTimeZone
                }))
              )
            );

            for (const a of appts) {
              if (a.apptType === 'SPLA_PLANFR') {
                plannedFromDateTime = a.apptStartDateTime;
                plannedFromTimeZone = a.apptStartTimeZone;
              }
              if (a.apptType === 'SPLA_PLANTO') {
                plannedToDateTime = a.apptEndDateTime;
                plannedToTimeZone = a.apptEndTimeZone;
              }
            }

            if (plannedFromDateTime || plannedToDateTime) {
              await tx.run(
                UPDATE(SORD_H)
                  .set({
                    plannedFromDateTime,
                    plannedFromTimeZone,
                    plannedToDateTime,
                    plannedToTimeZone
                  })
                  .where({ orderID: header.orderID })
              );
            }
          }

          // 9 Item Appointments
          if (items.length) {
            const itemIDs = items.map(i => i.ID);
            const itemAppts = await tx.run(
              SELECT.from(SrvOrderAppt_I).where({ parent_ID: { in: itemIDs } })
            );
            if (itemAppts.length) {
              await tx.run(
                INSERT.into(SORD_Appt).entries(
                  itemAppts.map(a => {
                    const parentItem = items.find(i => i.ID === a.parent_ID);
                    return {
                      orderID: header.orderID,
                      itemNo: parentItem?.itemNo || 0,
                      apptType: a.apptType,
                      apptStartDateTime: a.apptStartDateTime,
                      apptStartTimeZone: a.apptStartTimeZone,
                      apptEndDateTime: a.apptEndDateTime,
                      apptEndTimeZone: a.apptEndTimeZone
                    };
                  })
                )
              );
            }
          }

          //10 Texts (header + items)
          const [headerTexts, allItems] = await Promise.all([
            tx.run(SELECT.from(SrvOrderText_H).where({ parent_ID: header.ID })),
            tx.run(SELECT.from(SrvOrder_I).where({ parent_ID: header.ID }))
          ]);

          const itemTextMap = {};
          if (allItems.length) {
            const itemIDs = allItems.map(i => i.ID);
            const itemTexts = await tx.run(
              SELECT.from(SrvOrderText_I).where({ parent_ID: { in: itemIDs } })
            );
            for (const it of itemTexts) {
              itemTextMap[it.parent_ID] ??= [];
              itemTextMap[it.parent_ID].push(it);
            }
          }

          const textEntries = [
            ...headerTexts.map(t => ({
              orderID: header.orderID,
              itemNo: 0,
              longTextTypeID: t.longTextTypeID,
              text: t.text,
              language: t.language
            })),
            ...allItems.flatMap(i =>
              (itemTextMap[i.ID] || []).map(it => ({
                orderID: header.orderID,
                itemNo: i.itemNo,
                longTextTypeID: it.longTextTypeID,
                text: it.text,
                language: it.language
              }))
            )
          ];

          if (textEntries.length) {
            await tx.run(INSERT.into(SORD_Text).entries(textEntries));
          }

          // 11 Mark as processed + log success
          await tx.run(
            UPDATE(SrvOrder_H).set({ processedFlag: true }).where({ ID: header.ID })
          );

          await insertLog(tx, {
            msgID: header.msgID,
            orderID: header.orderID,
            msgCreatedDate: header.msgCreatedDate,
            status: insUpd,
            message: 'Order processed successfully'
          });

          successCount++;
        } catch (err) {
          failCount++;
          LOG.error(`Failed processing order ${header.orderID}: ${err.message}`);
          await insertLog(tx, {
            msgID: header.msgID,
            orderID: header.orderID,
            msgCreatedDate: header.msgCreatedDate,
            status: 'FAILED',
            message: err.message
          });
        }
      }

      await tx.commit();
      const summary = `ETL completed: ${successCount} success, ${failCount} failed`;
      LOG.info(summary);
      return summary;
    } catch (err) {
      await tx.rollback();
      LOG.error('ETL failed: ' + err.message);
      throw err;
    }
  });
};
