using { stg as stg } from '../db/stage_model';
using { txn as txn } from '../db/schema';
using { managed} from '@sap/cds/common';

service ETLService {
  @readonly
  action runETL() returns String;

    entity ETL_Log : managed {
    key ID              : UUID;
    orderID             : String(35);
    msgCreatedDate      : Timestamp;
    status              : String(10);      // SUCCESS | FAILED
    message             : String(500);
    runTimestamp        : Timestamp = CURRENT_TIMESTAMP;
    }
}