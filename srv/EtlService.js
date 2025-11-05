const cds = require('@sap/cds')

module.exports = async function () {
  const {
    SrvOrder_H,
    SrvOrder_I,
    SrvOrderPartner_H,
    SrvOrderAppt_H,
    SrvOrderText_H,
    SrvOrderText_I
  } = cds.entities('stg')

  const {
    SORD_H,
    SORD_I,
    SORD_Partner,
    SORD_Appt,
    SORD_Text
  } = cds.entities('txn')

  const LOG = cds.log('etl')
  const { ETL_Log } = cds.entities('ETL_Log')


  this.on('runETL', async () => {
    const tx = cds.transaction()
    let successCount = 0, failCount = 0
    
    try {
      // ----------------------------------------------------
      // 1️⃣  Get latest message per orderID
      // ----------------------------------------------------
      const latestOrders = await SELECT `
      orderID,
      MAX(msgCreatedDate) as latestMsgDate
    `.from(SrvOrder_H)
     .where({ processedFlag: false })
     .groupBy('orderID')

      console.log(`Found ${latestOrders.length} unprocessed orders in staging.`)
      //LOG.info(`Found ${latestOrders.length} unprocessed orders in staging.`)


      // ----------------------------------------------------
      // 2️⃣  Loop through each latest record
      // ----------------------------------------------------
      for (const o of latestOrders) {

      const latestHeader = await SELECT.one.from(SrvOrder_H).where({
        orderID: o.orderID,
        msgCreatedDate: o.latestMsgDate
      })


      if (!latestHeader) continue

        // 3️⃣ UPSERT header into target
        await UPSERT.into(SORD_H).entries({
          //ordSource: 'SO',
          orderID: latestHeader.orderID,
          LastUpdatedTSFromS4: latestHeader.msgCreatedDate,
          orderType: latestHeader.orderType,
          salesOrganization: latestHeader.salesOrganization,
          distributionChannel: latestHeader.distributionChannel,
          division: latestHeader.division,
          salesOffice: latestHeader.salesOffice,
          salesGroup: latestHeader.salesGroup,
          description: latestHeader.description,
          language: latestHeader.language,
          soldToParty: latestHeader.soldToParty,
          soldToPartyName: latestHeader.soldToPartyName,
          serviceParty: latestHeader.serviceParty,
          servicePartyName: latestHeader.servicePartyName,
          requestType: latestHeader.requestType,
          serviceType: latestHeader.serviceType,
          serviceSubType: latestHeader.serviceSubType,
          priority: latestHeader.priority,
          fnaStatus: latestHeader.fnaStatus,
          confirmationNeeded: latestHeader.confirmationNeeded,
          requestedStartDateTime: latestHeader.requestedStartDateTime,
          requestedEndDateTime: latestHeader.requestedEndDateTime,
          documentDataTimestamp: latestHeader.documentDataTimestamp,
          customerPO: latestHeader.customerPO,
          customerRef10: latestHeader.customerRef10,
          customerName3: latestHeader.customerName3
          //printed: false
        })

        // ----------------------------------------------------
        // 4️⃣  Refresh child data (items, partners, appts, texts)
        // ----------------------------------------------------

        // Optional: delete existing children for this order before re-inserting
        await DELETE.from(SORD_I).where({ orderID: latestHeader.orderID })
        await DELETE.from(SORD_Partner).where({ orderID: latestHeader.orderID })
        await DELETE.from(SORD_Appt).where({ orderID: latestHeader.orderID })
        await DELETE.from(SORD_Text).where({ orderID: latestHeader.orderID })

        // 4.a Items
        const items = await SELECT.from(SrvOrder_I).where({ parent_ID: latestHeader.ID })
        for (const i of items) {
          await UPSERT.into(SORD_I).entries({
            orderID: latestHeader.orderID,
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
          })
        }

        // 4.b Partners
        const partners = await SELECT.from(SrvOrderPartner_H).where({ parent_ID: latestHeader.ID })
        for (const p of partners) {
          await UPSERT.into(SORD_Partner).entries({
            orderID: latestHeader.orderID,
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
          })
        }

        // 4.c Appointments

        let plannedFromDateTime, plannedFromTimeZone
        let plannedToDateTime, plannedToTimeZone

        const appts = await SELECT.from(SrvOrderAppt_H).where({ parent_ID: latestHeader.ID })
        for (const a of appts) {
          await UPSERT.into(SORD_Appt).entries({
            orderID: latestHeader.orderID,
            itemNo: 0,
            apptType: a.apptType,
            apptStartDateTime: a.apptStartDateTime,
            apptStartTimeZone: a.apptStartTimeZone,
            apptEndDateTime: a.apptEndDateTime,
            apptEndTimeZone: a.apptEndTimeZone
          })

          if (a.apptType === 'SPLA_PLANFR') {
            plannedFromDateTime = a.apptStartDateTime
            plannedFromTimeZone = a.apptStartTimeZone
          }

          if (a.apptType === 'SPLA_PLANTO') {
            plannedToDateTime = a.apptEndDateTime
            plannedToTimeZone = a.apptEndTimeZone
          }
        }

        // Update SORD_H with planned from/to info
        if (plannedFromDateTime || plannedToDateTime) {
          await UPDATE(SORD_H)
            .set({
              plannedFromDateTime,
              plannedFromTimeZone,
              plannedToDateTime,
              plannedToTimeZone
            })
            .where({ orderID: latestHeader.orderID })
        }
        


        // 4️⃣ Texts handling (Header + Item)
        // ---- 4.d Header Texts ----
        const headerTexts = await SELECT.from(SrvOrderText_H).where({ parent_ID: latestHeader.ID })
        for (const t of headerTexts) {
        await UPSERT.into(SORD_Text).entries({
            orderID: latestHeader.orderID,
            itemNo: null, // header-level → null
            longTextTypeID: t.longTextTypeID,
            text: t.text,
            language: t.language
        })
        }

        // ---- 4.e Item Texts ----
        const stgItems = await SELECT.from(SrvOrder_I).where({ parent_ID: latestHeader.ID })

        for (const i of stgItems) {
        const itemTexts = await SELECT.from(SrvOrderText_I).where({ parent_ID: i.ID })
        for (const it of itemTexts) {
            await UPSERT.into(SORD_Text).entries({
            orderID: latestHeader.orderID,
            itemNo: i.itemNo, 
            longTextTypeID: it.longTextTypeID,
            text: it.text,
            language: it.language
            })
        }
        }

        // Mark this staging record as processed
        await UPDATE(SrvOrder_H)
        .set({ processedFlag: true })
        .where({ ID: latestHeader.ID })
      }

      /*
      // Periodically purge old processed data
      await DELETE.from(SrvOrder_H)
      .where({ processedFlag: true })
      .and('msgCreatedDate <', new Date(Date.now() - 7*24*60*60*1000)); // older than 7 days
      */

      await tx.commit()
      return `ETL completed: ${latestOrders.length} orders processed and flagged.`
      //LOG.info(`Order ${latestHeader.orderID} (msgCreatedDate: ${latestHeader.msgCreatedDate}) processed successfully.`)

      // Write to ETL_Log
      await INSERT.into(ETL_Log).entries({
      msgID: latestHeader.msgID,
      orderID: latestHeader.orderID,
      msgCreatedDate: latestHeader.msgCreatedDate,
      status: 'SUCCESS',
      message: `${recordType} order processed successfully`
      })

    } catch (err) {
      await tx.rollback()
      console.error(err)
      //LOG.error(`Failed processing order ${latestHeader.orderID} (msgCreatedDate: ${latestHeader.msgCreatedDate}) — ${err.message}`)
      

      await INSERT.into(ETL_Log).entries({
      msgID: latestHeader.msgID,
      orderID: latestHeader.orderID,
      msgCreatedDate: latestHeader.msgCreatedDate,
      status: 'FAILED',
      message: err.message
      })

      return `ETL failed: ${err.message}`
    }
  })
}
