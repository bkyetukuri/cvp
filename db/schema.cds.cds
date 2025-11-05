namespace txn;

using {cuid} from '@sap/cds/common';
// ============================================================
// ============================================================
//  STAGING TABLES (Raw Payload Layer - No Managed Fields)
// ============================================================
// ============================================================

@cds.persistence.name: 'TXN_SORD_H'
entity SORD_H {
    key ordSource              : String(2);
    key orderID                : String(35);
        LastUpdatedTSFromS4    : Timestamp;
        orderType              : String(4);
        salesOrganization      : String(4);
        distributionChannel    : String(2);
        division               : String(2);
        salesOffice            : String(4);
        salesGroup             : String(3);
        description            : String(40);
        language               : String(9);
        soldToParty            : String(10);
        soldToPartyName        : String(60);
        serviceParty           : String(10);
        servicePartyName       : String(60);
        requestType            : String;
        serviceType            : String;
        serviceSubType         : String;
        priority               : String(1);
        fnaStatus              : String(3);
        confirmationNeeded     : Boolean;
        requestedStartDateTime : Timestamp;
        requestedEndDateTime   : Timestamp;
        documentDataTimestamp  : Timestamp;
        customerPO             : String;
        customerRef10          : String;
        customerName3          : String;

        items                  : Composition of many SORD_I
                                     on items.orderID = $self.orderID;
        partners               : Composition of many SORDPartner
                                     on  partners.orderID = $self.orderID
                                     and partners.itemNo  = 0;
        appointments           : Composition of many SORDAppt
                                     on  appointments.orderID = $self.orderID
                                     and appointments.itemNo  = 0;
        texts                  : Composition of many SORDText
                                     on  texts.orderID = $self.orderID
                                     and texts.itemNo  = 0;

}

@cds.persistence.name: 'TXN_SORD_I'
entity SORD_I {
    key orderID            : String(35);
    key itemNo             : Integer;
        parentItem         : Integer;
        product            : String(40);
        productDesc        : String(40);
        language           : String(9);
        quantity           : Decimal(13, 3);
        quantityUnit       : String(3);
        itemCategory       : String(4);
        isOpen             : Boolean;
        isReleased         : Boolean;
        isCompleted        : Boolean;
        isRejected         : Boolean;
        userStatus         : String(5);
        fnaStatus          : String(3);
        confirmationNeeded : String;
        frequency          : String;
        materialGroup2     : String(3);
        materialGroup2Desc : String(40);

        texts              : Composition of many SORDText
                                 on  texts.orderID = $self.orderID
                                 and texts.itemNo  = $self.itemNo;
}

@cds.persistence.name   : 'TXN_SORD_PARTNER'
@cds.persistence.indexes: [{
    name    : 'IDX_TXN_SOHP_ORDID',
    unique  : false,
    elements: [
        'orderID',
        'itemNo',
        'partnerFunction',
        'partnerNumber'
    ]
}]
entity SORDPartner : cuid {
    orderID          : String(35);
    itemNo           : Integer;
    partnerFunction  : String(8);
    partnerNumber    : String(10);
    partnerName      : String(60);
    isMainPartner    : Boolean;
    numberType       : String(60);
    functionCategory : String(4);
    houseNumber      : String(10);
    streetName       : String(60);
    cityName         : String(40);
    region           : String(3);
    postalCode       : String(10);
    country          : String(3);
    dialCode         : String(10);
    phoneNumber      : String(10);
    phoneExtension   : String(10);
    emailAddress     : String(255);
}

@cds.persistence.name: 'TXN_SORD_APPT'
entity SORDAppt {
    key orderID           : String(35);
    key itemNo            : Integer;
    key apptType          : String;
        apptStartDateTime : Timestamp;
        apptStartTimeZone : String(3);
        apptEndDateTime   : Timestamp;
        apptEndTimeZone   : String(3);
}

@cds.persistence.name: 'TXN_SORD_TEXT'
entity SORDText {
    key orderID        : String(35);
    key itemNo         : Integer;
    key longTextTypeID : String(5);
        text           : String;
        language       : String(9);
}
