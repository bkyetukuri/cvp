namespace stg;

using { stg as db } from '../db/stage_model.cds';

service SrvOrdStage @(path: 'SrvOrdStage', requires: 'authenticated-user') {

  /**
   * Root Header entity
   */
  entity Header as projection on db.SrvOrder_H;

  /**
   * Item-level details for each service order
   */
  entity Items as projection on db.SrvOrder_I;

  /**
   * Header Partner details associated with service orders
   */
  entity HeaderPartners as projection on db.SrvOrderPartner_H;

  /**
   * Items Partner details associated with service orders
   */
  entity ItemPartners as projection on db.SrvOrderPartner_I;

  /**
   *  Header Appointments details
   */
  entity HeaderAppointments as projection on db.SrvOrderAppt_H;

  /**
   *  Header Appointments details
   */
  entity ItemAppointments as projection on db.SrvOrderAppt_I;

  /**
   * Header-level text information
   */
  entity HeaderTexts as projection on db.SrvOrderText_H;

  /**
   * Item-level text information
   */
  entity ItemTexts as projection on db.SrvOrderText_I;

}