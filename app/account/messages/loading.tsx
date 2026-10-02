import { AccountSurfaceLoading } from "../../../components/account/surface-loading";
// No fixed route: this boundary also covers /account/messages/[id], so it must
// follow the address being opened (conversation shimmer, not the inbox one).
export default function Loading() { return <AccountSurfaceLoading />; }
