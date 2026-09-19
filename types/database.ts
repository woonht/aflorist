export interface StockMaster {
  StockCode: string;
  StockName: string;
  StockCategory: string | null;
  StockQuantity: number;
  UnitPrice: number;
  CreatedBy: string;
  CreatedOn: string;
  UpdatedBy: string | null;
  UpdatedOn: string | null;
  IsArchived: boolean;
}

export interface ItemMaster {
  ItemCode: string;
  ItemName: string;
  ItemCategory: string | null;
  ImageUrl: string | null;
  UnitPrice: number;
  ItemPrice: number;
  GridX: number | null;
  GridY: number | null;
  GridW: number | null;
  GridH: number | null;
  CreatedBy: string;
  CreatedOn: string;
  UpdatedBy: string | null;
  UpdatedOn: string | null;
  IsArchived: boolean;
}

export interface ItemDetails {
  Id: number;
  ItemCode: string;
  StockCode: string;
  Quantity: number;
  CreatedBy: string;
  CreatedOn: string;
  UpdatedBy: string | null;
  UpdatedOn: string | null;
  IsArchived: boolean;
}

export interface StatusLookup {
  StatusCode: string;
  Description: string | null;
  CreatedBy: string;
  CreatedOn: string;
  UpdatedBy: string | null;
  UpdatedOn: string | null;
  IsArchived: boolean;
}

export interface ExpenseMaster {
  Id: number;
  ReceiptImageUrl: string | null;
  ExpenseCategory: string | null;
  Description: string | null;
  Amount: number;
  CreatedBy: string;
  CreatedOn: string;
  UpdatedBy: string | null;
  UpdatedOn: string | null;
  IsArchived: boolean;
}

export interface SalesOrderHeader {
  OrderNumber: string;
  CustomerName: string;
  CustomerPhone: string;
  ShippingAddress: string | null;
  Postcode: string | null;
  SelfPickUp: boolean;
  DeliveryDate: string;
  StatusCode: string;
  CreatedBy: string;
  CreatedOn: string;
  UpdatedBy: string | null;
  UpdatedOn: string | null;
  IsArchived: boolean;
}

export interface SalesOrderDetail {
  SalesOrderDetailId: number;
  OrderNumber: string;
  ItemCode: string;
  ItemPrice: number;
  ItemQuantity: number;
  OrderPrice: number;
  StatusCode: string;
  CreatedBy: string;
  CreatedOn: string;
  UpdatedBy: string | null;
  UpdatedOn: string | null;
  IsArchived: boolean;
}