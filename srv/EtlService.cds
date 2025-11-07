
using { stg as stg } from '../db/stage_model';
using { txn as txn } from '../db/schema';
using { managed} from '@sap/cds/common';

service ETLService @(path: 'EtlService', requires: 'authenticated-user') {
  @readonly
  action runETL() returns String;

}