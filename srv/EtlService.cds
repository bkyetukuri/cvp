
service ETLService @(path: 'EtlService', requires: 'authenticated-user') {
  @readonly
  action runETL() returns String;

}