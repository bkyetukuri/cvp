namespace txn;

using {cuid, managed} from '@sap/cds/common';

// ============================================================
// ============================================================
//  APPLICATION TABLES (Processed Data - Managed Fields)
// ============================================================
// ============================================================

@cds.persistence.name: 'TXN_SORD_H'
entity SORD_H : managed {
    key ordSource              : String(2) default 'SO';
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
        plannedFromDateTime    : Timestamp;
        plannedToDateTime      : Timestamp;
        plannedFromTimeZone    : String(3);
        plannedToTimeZone      : String(3);
        printed                : Boolean;

        items                  : Composition of many SORD_I
                                     on items.orderID = $self.orderID;
        partners               : Composition of many SORD_Partner
                                     on  partners.orderID = $self.orderID
                                     and partners.itemNo  = 0;
        appointments           : Composition of many SORD_Appt
                                     on  appointments.orderID = $self.orderID
                                     and appointments.itemNo  = 0;
        texts                  : Composition of many SORD_Text
                                     on  texts.orderID = $self.orderID
                                     and texts.itemNo  = 0;
        communication          : Composition of many SORD_Comm 
                                     on communication.orderID = $self.orderID;

}

@cds.persistence.name: 'TXN_SORD_I'
entity SORD_I : managed {
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
        confirmationNeeded : Boolean;
        frequency          : String;
        materialGroup2     : String(3);
        materialGroup2Desc : String(40);

        partners            : Composition of many SORD_Partner
                                on  partners.orderID = $self.orderID
                                and partners.itemNo  = $self.itemNo;
        appointments        : Composition of many SORD_Appt
                                on  appointments.orderID = $self.orderID
                                and appointments.itemNo  = $self.itemNo;
        texts              : Composition of many SORD_Text
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
entity SORD_Partner : cuid, managed  {
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
entity SORD_Appt : managed {
    key orderID           : String(35);
    key itemNo            : Integer;
    key apptType          : String;
        apptStartDateTime : Timestamp;
        apptStartTimeZone : String(3);
        apptEndDateTime   : Timestamp;
        apptEndTimeZone   : String(3);
}

@cds.persistence.name: 'TXN_SORD_TEXT'
entity SORD_Text : managed {
    key orderID        : String(35);
    key itemNo         : Integer;
    key longTextTypeID : String(5);
        text           : String;
        language       : String(9);
}

@cds.persistence.name: 'TXN_SORD_COMM'
entity SORD_Comm : managed {
    key orderID        : String(35);
        messages       : String;
}