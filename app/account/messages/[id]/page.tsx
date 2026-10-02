import { AccountMessages } from "../../../../components/account/messages";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <main className="product-page page-shell message-workspace message-thread-page"><AccountMessages id={id} /></main>; }
