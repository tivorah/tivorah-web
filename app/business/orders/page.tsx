import { ItemOrders } from "../../../components/orders/item-orders";
export const metadata = { title: "Your orders · Tivorah" };
export default function Page() {
  return <ItemOrders role="seller" />;
}
