import { isTerminalCustomerWorkflow } from "./customer-workflow";

export type CustomerFilterSnapshot = {
  status: string | null;
  paymentStatus: string | null;
  serviceAccessStatus: string | null;
  deviceCount: number;
  hasDeviceWithoutPlaylist: boolean;
};

export function matchesCustomerFilter(
  customer: CustomerFilterSnapshot,
  filter: string,
) {
  if (filter === "all") return true;
  if (filter === "setup_pending") {
    return ["invited", "accepted_terms", "completed_profile"].includes(
      customer.status || "",
    );
  }
  if (filter === "material_pending") {
    return ["paid", "content_pending"].includes(customer.status || "");
  }
  if (filter === "needs_device") {
    return (
      ["content_received", "active"].includes(customer.status || "") &&
      customer.deviceCount === 0
    );
  }
  if (filter === "needs_playlist") {
    return (
      ["content_received", "active"].includes(customer.status || "") &&
      customer.hasDeviceWithoutPlaylist
    );
  }
  if (filter === "billing_issue") {
    if (
      isTerminalCustomerWorkflow({
        status: customer.status,
        paymentStatus: customer.paymentStatus,
        serviceAccessStatus: customer.serviceAccessStatus,
      })
    ) {
      return false;
    }
    return (
      customer.status === "suspended" ||
      customer.serviceAccessStatus === "suspended" ||
      ["failed", "payment_failed", "disputed"].includes(
        customer.paymentStatus || "",
      )
    );
  }
  if (filter === "ready_to_activate") {
    return (
      customer.status === "content_received" &&
      customer.deviceCount > 0 &&
      !customer.hasDeviceWithoutPlaylist
    );
  }
  if (filter === "closed") {
    return ["canceled", "cancelled", "refunded"].includes(
      customer.status || "",
    );
  }
  return customer.status === filter;
}
