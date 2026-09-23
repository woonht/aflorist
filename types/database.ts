export interface StockMaster {
  stockcode: string;
  stockname: string;
  stockcategory: string | null;
  stockquantity: number;
  unitprice: number;
  createdby: string;
  createdon: string;
  updatedby: string | null;
  updatedon: string | null;
  isarchived: boolean;
}

export interface ItemMaster {
  itemcode: string;
  itemname: string;
  itemcategory: string | null;
  imageurl: string | null;
  unitprice: number;
  itemprice: number;
  gridx: number | null;
  gridy: number | null;
  gridw: number | null;
  gridh: number | null;
  createdby: string;
  createdon: string;
  updatedby: string | null;
  updatedon: string | null;
  isarchived: boolean;
}

export interface ItemDetails {
  id: number;
  itemcode: string;
  stockcode: string;
  quantity: number;
  createdby: string;
  createdon: string;
  updatedby: string | null;
  updatedon: string | null;
  isarchived: boolean;
}

export interface StatusLookup {
  statuscode: string;
  description: string | null;
  createdby: string;
  createdon: string;
  updatedby: string | null;
  updatedon: string | null;
  isarchived: boolean;
}

export interface ExpenseMaster {
  id: number;
  receiptimageurl: string | null;
  expensecategory: string | null;
  description: string | null;
  amount: number;
  createdby: string;
  createdon: string;
  updatedby: string | null;
  updatedon: string | null;
  isarchived: boolean;
}

export interface SalesOrderHeader {
  ordernumber: string;
  customername: string;
  customerphone: string;
  shippingaddress: string | null;
  postcode: string | null;
  selfpickup: boolean;
  deliverydate: string;
  statuscode: string;
  createdby: string;
  createdon: string;
  updatedby: string | null;
  updatedon: string | null;
  isarchived: boolean;
}

export interface SalesOrderDetail {
  salesorderdetailid: number;
  ordernumber: string;
  itemcode: string;
  itemprice: number;
  itemquantity: number;
  orderprice: number;
  statuscode: string;
  createdby: string;
  createdon: string;
  updatedby: string | null;
  updatedon: string | null;
  isarchived: boolean;
}