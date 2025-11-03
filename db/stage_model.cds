namespace stg;

using { cuid } from '@sap/cds/common';
// ============================================================
// ============================================================
//  STAGING TABLES (Raw Payload Layer - No Managed Fields)
// ============================================================
// ============================================================

@cds.persistence.name: 'STG_SRVORDER_H'
@cds.persistence.indexes: [
    {
        name    : 'IDX_SOH_MSGID',
        unique  : false,
        elements: ['msgID']
    },
    {
        name    : 'IDX_SOH_ORDID',
        unique  : false,
        elements: ['orderID']
    }
]
entity SrvOrder_H : cuid {
    msgID                  : String(32);
    orderID                : String(35);
    msgCreatedDate         : Timestamp;
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
    confirmationNeeded     : String;
    requestedStartDateTime : Timestamp;
    requestedEndDateTime   : Timestamp;
    documentDataTimestamp  : Timestamp;
    customerPO             : String;
    customerRef10          : String;
    customerName3          : String;

    items                  : Composition of many SrvOrder_I
                                 on items.parent = $self;
    partners               : Composition of many SrvOrderPartner_H
                                 on partners.parent = $self;
    appointments           : Composition of many SrvOrderAppt_H
                                 on appointments.parent = $self;
    texts                  : Composition of many SrvOrderText_H
                                 on texts.parent = $self;

}

@cds.persistence.name: 'STG_SRVORDER_I'
@cds.persistence.indexes: [
    {
        name    : 'IDX_SOI_ORDID',
        unique  : false,
        elements: ['parent_ID']
    }
]
entity SrvOrder_I : cuid {
    parent             : Association to SrvOrder_H;
    itemNo             : Integer;
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

    texts              : Composition of many SrvOrderText_I
                             on texts.parent = $self;
}

@cds.persistence.name: 'STG_SRVORDERPARTNER_H'
@cds.persistence.indexes: [
    {
        name    : 'IDX_SOHP_ORDID',
        unique  : false,
        elements: ['parent_ID']
    }
]
entity SrvOrderPartner_H : cuid {
    parent           : Association to SrvOrder_H;
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

@cds.persistence.name: 'STG_SRVORDERAPPT_H'
@cds.persistence.indexes: [
    {
        name    : 'IDX_SOHA_ORDID',
        unique  : false,
        elements: ['parent_ID']
    }
]
entity SrvOrderAppt_H : cuid {

    parent            : Association to SrvOrder_H;
    apptType          : String;
    apptStartDateTime : Timestamp;
    apptStartTimeZone : String(3);
    apptEndDateTime   : Timestamp;
    apptEndTimeZone   : String(3);
}

@cds.persistence.name: 'STG_SRVORDERTEXT_H'
@cds.persistence.indexes: [
    {
        name    : 'IDX_SOHT_ORDID',
        unique  : false,
        elements: ['parent_ID']
    }
]
entity SrvOrderText_H : cuid {

    parent         : Association to SrvOrder_H;
    longTextTypeID : String(5);
    text           : String;
    language       : String(9);
}

@cds.persistence.name: 'STG_SRVORDERTEXT_I'
@cds.persistence.indexes: [
    {
        name    : 'IDX_SOIT_ORDID',
        unique  : false,
        elements: ['parent_ID']
    }
]
entity SrvOrderText_I : cuid {

    parent         : Association to SrvOrder_I;
    longTextTypeID : String(5);
    text           : String;
    language       : String(9);
}
