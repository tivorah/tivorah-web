import { ItemOrders } from "../../../components/orders/item-orders";
export const metadata = { title: "Your orders · Tivorah" };
export default function Page() {
  return <div className="product-page page-shell"><ItemOrders role="buyer" /></div>;
}
