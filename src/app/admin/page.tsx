"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { showAdminNotification } from "@/lib/admin/notifications";
import {
  getCustomerWorkflowAction,
  type CustomerWorkflowAction,
} from "@/lib/admin/customer-workflow";

const attentionCategories = [
  {
    category: "billing_issue",
    href: "/admin/customers?filter=billing_issue",
    title: "Billing issues",
    description: "Payment or service-access problems requiring a decision.",
    tone: "danger",
  },
  {
    category: "new_request",
    href: "/admin/customers?filter=new_request",
    title: "New requests",
    description: "New inquiries that need review and a quote.",
    tone: "warning",
  },
  {
    category: "setup_pending",
    href: "/admin/customers?filter=setup_pending",
    title: "Setup pending",
    description: "Customers completing details, terms, or payment.",
    tone: "info",
  },
  {
    category: "material_pending",
    href: "/admin/customers?filter=material_pending",
    title: "Material pending",
    description: "Paid customers whose material still needs review.",
    tone: "warning",
  },
  {
    category: "needs_device",
    href: "/admin/customers?filter=needs_device",
    title: "Device allocation",
    description: "Content-ready customers without assigned hardware.",
    tone: "warning",
  },
  {
    category: "needs_playlist",
    href: "/admin/customers?filter=needs_playlist",
    title: "Playlist content",
    description: "Assigned displays that do not have playable content.",
    tone: "danger",
  },
  {
    category: "ready_to_activate",
    href: "/admin/customers?filter=ready_to_activate",
    title: "Final activation",
    description: "Prepared displays waiting for the final service check.",
    tone: "info",
  },
] as const;

type AdminCustomer = {
  id: string;
  name: string;
  email: string | null;
  status: string | null;
  payment_status: string | null;
  service_access_status: string | null;
  created_at: string | null;
  devices?: {
    id: string;
    device_code: string;
    playlists?: { count: number }[];
  }[];
};

type AdminNotification = {
  id: string;
  customer_id: string | null;
  event_type: string;
  title: string;
  message: string;
  priority: string;
  read_at: string | null;
  resolved_at: string | null;
  resolution_event_type: string | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
  customers?:
    | {
    name: string | null;
      }
    | Array<{
        name: string | null;
      }>
    | null;
};

export default function AdminHomePage() {
  const [customerCount, setCustomerCount] = useState(0);
  const [displayCount, setDisplayCount] = useState(0);
  const [newMaterialCount, setNewMaterialCount] = useState(0);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingNotification, setSavingNotification] = useState(false);
  const [showMarkAllReadFlow, setShowMarkAllReadFlow] = useState(false);
  const [markAllReadReason, setMarkAllReadReason] = useState("");

  const needsDisplayCount = customers.filter((customer) => {
    const displayCount = customer.devices?.length || 0;
    return (
      ["content_received", "active"].includes(customer.status || "") &&
      displayCount === 0
    );
  }).length;

  const needsPlaylistCount = customers.filter((customer) => {
    return (
      ["content_received", "active"].includes(customer.status || "") &&
      customer.devices?.some(
        (device) => (device.playlists?.[0]?.count || 0) === 0,
      )
    );
  }).length;

  const activeCustomerCount = customers.filter(
    (customer) => customer.status === "active",
  ).length;
  const newRequestCount = customers.filter(
    (customer) => customer.status === "new_request",
  ).length;
  const paidCustomerCount = customers.filter(
    (customer) => customer.status === "paid",
  ).length;
  const contentPendingCount = customers.filter(
    (customer) => customer.status === "content_pending",
  ).length;
  const contentReceivedCount = customers.filter(
    (customer) => customer.status === "content_received",
  ).length;
  const suspendedCustomerCount = customers.filter(
    (customer) => customer.status === "suspended",
  ).length;
  const unreadNotificationCount = notifications.filter(
    (notification) => !notification.read_at && !notification.resolved_at,
  ).length;
  const readyCustomerCount = customers.filter((customer) => {
    const displayCount = customer.devices?.length || 0;
    const hasDisplayWithoutPlaylist = customer.devices?.some(
      (device) => (device.playlists?.[0]?.count || 0) === 0,
    );

    return (
      customer.status === "active" &&
      displayCount > 0 &&
      !hasDisplayWithoutPlaylist
    );
  }).length;

  const managedCustomerCount = customers.filter((customer) =>
    ["paid", "content_pending", "content_received", "active"].includes(
      customer.status || "",
    ),
  ).length;
  const setupCompletion =
    managedCustomerCount === 0
      ? 0
      : Math.round((readyCustomerCount / managedCustomerCount) * 100);
  const customerActionItems = customers
    .map((customer) => {
      const firstDeviceWithoutPlaylist = customer.devices?.find(
        (device) => (device.playlists?.[0]?.count || 0) === 0,
      );
      const action = getCustomerWorkflowAction({
        id: customer.id,
        status: customer.status,
        paymentStatus: customer.payment_status,
        serviceAccessStatus: customer.service_access_status,
        deviceCount: customer.devices?.length || 0,
        firstDeviceCode: customer.devices?.[0]?.device_code,
        firstDeviceWithoutPlaylistCode: firstDeviceWithoutPlaylist?.device_code,
      });

      return action ? { customer, action } : null;
    })
    .filter(
      (item): item is { customer: AdminCustomer; action: CustomerWorkflowAction } =>
        Boolean(item),
    )
    .sort((left, right) => {
      const priority = { urgent: 0, high: 1, normal: 2 };
      const priorityDifference =
        priority[left.action.priority] - priority[right.action.priority];
      if (priorityDifference !== 0) return priorityDifference;

      return dateValue(left.customer.created_at) - dateValue(right.customer.created_at);
    });
  const customerWorkQueue = customerActionItems.slice(0, 8);
  const attentionCategoryCounts = customerActionItems.reduce<
    Record<CustomerWorkflowAction["category"], number>
  >(
    (counts, item) => ({
      ...counts,
      [item.action.category]: counts[item.action.category] + 1,
    }),
    {
      billing_issue: 0,
      new_request: 0,
      setup_pending: 0,
      material_pending: 0,
      needs_device: 0,
      needs_playlist: 0,
      ready_to_activate: 0,
    },
  );
  const activeAttentionCategories = attentionCategories.filter(
    (item) => attentionCategoryCounts[item.category] > 0,
  );
  const attentionCount = customerActionItems.length;

  const loadStats = async () => {
    setLoading(true);

    const { count: devices } = await supabase
      .from("devices")
      .select("*", { count: "exact", head: true });

    const { count: newMaterials } = await supabase
      .from("customer_display_assets")
      .select("*", { count: "exact", head: true })
      .eq("status", "new");

    const { data: notificationData, error: notificationError } = await supabase
      .from("admin_notifications")
      .select(
        "id, customer_id, event_type, title, message, priority, read_at, resolved_at, resolution_event_type, created_at, metadata, customers(name)",
      )
      .order("created_at", { ascending: false })
      .limit(5);

    const { data, error } = await supabase.from("customers").select(`
      id,
      name,
      email,
      status,
      payment_status,
      service_access_status,
      created_at,
      devices(
        id,
        device_code,
        playlists(count)
      )
    `);

    if (error) {
      console.error("Load dashboard customer stats error:", error);
      setCustomers([]);
      setCustomerCount(0);
    } else {
      const nextCustomers = (data || []) as AdminCustomer[];
      setCustomers(nextCustomers);
      setCustomerCount(nextCustomers.length);
    }
    setDisplayCount(devices || 0);
    setNewMaterialCount(newMaterials || 0);
    if (notificationError) {
      console.warn("Load admin notifications error:", notificationError.message);
      setNotifications([]);
    } else {
      setNotifications((notificationData || []) as AdminNotification[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStats();
  }, []);

  const updateNotification = async (
    action: "mark_read" | "mark_unread" | "mark_all_read",
    notificationId?: string,
  ) => {
    const reason =
      action === "mark_all_read" ? markAllReadReason.trim() : "";

    if (action === "mark_all_read" && (!reason || reason.length < 5)) {
      showAdminNotification(
        "error",
        "A reason of at least 5 characters is required.",
      );
      return;
    }

    setSavingNotification(true);

    const response = await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, notificationId, reason }),
    });
    const result = await response.json();

    if (!response.ok) {
      showAdminNotification(
        "error",
        result.error || "Could not update notification.",
      );
      setSavingNotification(false);
      return;
    }

    await loadStats();
    if (action === "mark_all_read") {
      setMarkAllReadReason("");
      setShowMarkAllReadFlow(false);
    }
    showAdminNotification("success", "Notification updated.");
    setSavingNotification(false);
  };

  return (
    <div className="admin-dashboard-page">
      <div className="admin-page-header admin-dashboard-header">
        <div>
          <h1 className="admin-title">Overview</h1>
          <p className="admin-subtitle">
            Review everything requiring action in one prioritized list.
          </p>
        </div>

        <div className="admin-dashboard-header-actions">
          <div className="admin-status-chip admin-status-chip-system">
            <span className="admin-status-dot admin-status-success" />
            {loading ? "Syncing" : "Live status"}
          </div>

          <button onClick={loadStats} className="admin-button-primary">
            Refresh
          </button>
        </div>
      </div>

      <section
        className="admin-card admin-work-queue admin-attention-center"
        aria-labelledby="attention-heading"
      >
        <div className="admin-work-queue-header">
          <div>
            <p className="admin-operation-kicker">Attention</p>
            <h2 id="attention-heading" className="admin-card-title">
              Needs attention
            </h2>
            <p className="admin-muted">
              Start with the first customer. Tasks are ordered by urgency and waiting time.
            </p>
          </div>
          <div className="admin-work-queue-commands">
            <span className="admin-attention-total">
              {loading ? "..." : attentionCount} active
            </span>
            <Link href="/admin/customers" className="admin-button-primary">
              View all customers
            </Link>
          </div>
        </div>

        {!loading && activeAttentionCategories.length > 0 && (
          <div className="admin-attention-summary" aria-label="Attention categories">
            {activeAttentionCategories.map((item) => (
              <ActionCard
                key={item.category}
                href={item.href}
                title={item.title}
                description={item.description}
                count={attentionCategoryCounts[item.category]}
                tone={item.tone}
                loading={false}
              />
            ))}
          </div>
        )}

        {!loading && customerWorkQueue.length > 0 && (
          <div className="admin-attention-list-heading">
            <div>
              <strong>Prioritized customer tasks</strong>
              <span>Open a task to continue at the correct workflow step.</span>
            </div>
            <span>
              Showing {customerWorkQueue.length} of {attentionCount}
            </span>
          </div>
        )}

        {loading ? (
          <p className="admin-muted admin-work-queue-empty">Loading attention list...</p>
        ) : customerWorkQueue.length ? (
          <div className="admin-work-queue-list">
            {customerWorkQueue.map(({ customer, action }) => (
              <article key={customer.id} className="admin-work-queue-item">
                <div className={`admin-work-priority admin-work-priority-${action.priority}`}>
                  {action.priority === "urgent" ? "Urgent" : action.priority === "high" ? "Next" : "Follow up"}
                </div>
                <div className="admin-work-customer">
                  <strong>{customer.name}</strong>
                  <span>{customer.email || "No contact email"}</span>
                </div>
                <div className="admin-work-action-copy">
                  <span>Step {action.stage} - {action.stageLabel}</span>
                  <strong>{action.title}</strong>
                  <small>{action.description}</small>
                </div>
                <div className="admin-work-age">
                  <span>Waiting</span>
                  <strong>{formatWaitingTime(customer.created_at)}</strong>
                </div>
                <Link href={action.href} className="admin-button-primary">
                  Open next step
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-work-queue-empty">
            <strong>No active customer tasks</strong>
            <span>New requests, billing issues, and delivery work will appear here.</span>
          </div>
        )}
      </section>

      <div className="admin-dashboard-kpis">
        <StatCard
          label="Total customers"
          value={customerCount}
          loading={loading}
          tone="neutral"
          meta="Registered accounts"
        />

        <StatCard
          label="Total displays"
          value={displayCount}
          loading={loading}
          tone="neutral"
          meta="Registered screens"
        />

        <StatCard
          label="Setup complete"
          value={`${setupCompletion}%`}
          loading={loading}
          tone="success"
          meta={`${readyCustomerCount} active of ${managedCustomerCount} paid customers`}
        />
      </div>

      <details className="admin-card admin-dashboard-details">
        <summary>
          <span>
            <strong>Operational details</strong>
            <small>Account, setup, and material totals</small>
          </span>
          <span className="admin-details-action">Show details</span>
        </summary>
        <div className="admin-dashboard-grid admin-dashboard-grid-details">
        <section className="admin-dashboard-panel">
          <h2 className="admin-card-title admin-dashboard-panel-title">Account health</h2>

          <div className="admin-status-list">
            <StatusRow label="Active" value={activeCustomerCount} tone="success" />
            <StatusRow label="New requests" value={newRequestCount} tone="warning" />
            <StatusRow label="Paid" value={paidCustomerCount} tone="info" />
            <StatusRow label="Material pending" value={contentPendingCount} tone="warning" />
            <StatusRow label="Material received" value={contentReceivedCount} tone="info" />
            <StatusRow
              label="Suspended"
              value={suspendedCustomerCount}
              tone="danger"
            />
          </div>
        </section>

        <section className="admin-dashboard-panel">
          <h2 className="admin-card-title admin-dashboard-panel-title">Setup health</h2>

          <div className="admin-progress-block">
            <div className="admin-progress-header">
              <span>Ready customers</span>
              <strong>{loading ? "..." : `${setupCompletion}%`}</strong>
            </div>
            <div className="admin-progress-track">
              <div
                className="admin-progress-value"
                style={{ width: `${setupCompletion}%` }}
              />
            </div>
          </div>

          <div className="admin-status-list admin-status-list-compact">
            <StatusRow label="Ready" value={readyCustomerCount} tone="success" />
            <StatusRow
              label="Ready for device allocation"
              value={needsDisplayCount}
              tone="warning"
            />
            <StatusRow
              label="Needs playlist content"
              value={needsPlaylistCount}
              tone="danger"
            />
          </div>
        </section>

        <section className="admin-dashboard-panel">
          <h2 className="admin-card-title admin-dashboard-panel-title">Material review</h2>
          <div className="admin-status-list">
            <StatusRow label="New material" value={newMaterialCount} tone="warning" />
            <StatusRow label="Customer tasks" value={attentionCount} tone="info" />
          </div>
        </section>

        </div>
      </details>

        <section className="admin-card admin-dashboard-panel admin-dashboard-notification-center">
          <div className="admin-dashboard-panel-heading">
            <h2 className="admin-card-title admin-dashboard-panel-title">Notifications</h2>
            <button
              type="button"
              onClick={() => setShowMarkAllReadFlow((current) => !current)}
              disabled={savingNotification || unreadNotificationCount === 0}
              className="admin-button-secondary"
            >
              Mark all read
            </button>
          </div>
          {showMarkAllReadFlow && (
            <div className="admin-inline-flow">
              <label>
                <span>Reason for marking all admin notifications as read</span>
                <textarea
                  value={markAllReadReason}
                  onChange={(event) => setMarkAllReadReason(event.target.value)}
                  rows={2}
                />
              </label>
              <div className="admin-inline-flow-actions">
                <button
                  type="button"
                  className="admin-button-primary"
                  disabled={savingNotification || !markAllReadReason.trim()}
                  onClick={() => updateNotification("mark_all_read")}
                >
                  {savingNotification ? "Saving..." : "Confirm all read"}
                </button>
                <button
                  type="button"
                  className="admin-button-secondary"
                  disabled={savingNotification}
                  onClick={() => {
                    setShowMarkAllReadFlow(false);
                    setMarkAllReadReason("");
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
          <div className="admin-status-list">
            <StatusRow label="Unread" value={unreadNotificationCount} tone="warning" />
          </div>

          <div className="admin-dashboard-notification-list">
            {notifications.length ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`admin-dashboard-notification ${
                    notification.resolved_at
                      ? "admin-dashboard-notification-resolved"
                      : notification.read_at
                      ? "admin-dashboard-notification-read"
                      : "admin-dashboard-notification-unread"
                  }`}
                >
                  <Link
                    href={notificationHref(notification)}
                    className="admin-dashboard-notification-link"
                  >
                    <strong>
                      {notification.title}
                    </strong>
                    <span className="admin-dashboard-notification-message">
                      {notificationCustomerName(notification)
                        ? `${notificationCustomerName(notification)} - `
                        : ""}
                      {notification.message}
                    </span>
                    <span className="admin-dashboard-notification-meta">
                      {notification.resolved_at
                        ? `Resolved ${new Date(notification.resolved_at).toLocaleString("sv-SE")}`
                        : `${notification.priority} | ${notification.read_at
                        ? `Read ${new Date(notification.read_at).toLocaleString("sv-SE")}`
                        : "Unread"}`}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      updateNotification(
                        notification.read_at ? "mark_unread" : "mark_read",
                        notification.id,
                      )
                    }
                    disabled={savingNotification}
                    className="admin-button-secondary admin-dashboard-notification-action"
                  >
                    {notification.read_at ? "Mark unread" : "Mark read"}
                  </button>
                </div>
              ))
            ) : (
              <p className="admin-muted admin-dashboard-notification-empty">No notifications yet.</p>
            )}
          </div>
        </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  loading,
  tone,
  meta,
  href,
}: {
  label: string;
  value: number | string;
  loading: boolean;
  tone: "neutral" | "success" | "warning";
  meta: string;
  href?: string;
}) {
  const content = (
    <>
      <span className={`admin-stat-icon admin-stat-${tone}`} />
      <p className="admin-stat-label">{label}</p>
      <p className="admin-stat-value">{loading ? "..." : value}</p>
      <p className="admin-stat-meta">{meta}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="admin-card admin-stat-card">
        {content}
      </Link>
    );
  }

  return <div className="admin-card admin-stat-card">{content}</div>;
}

function notificationCustomerName(notification: AdminNotification) {
  const customer = Array.isArray(notification.customers)
    ? notification.customers[0]
    : notification.customers;

  return customer?.name || "";
}

function notificationHref(notification: AdminNotification) {
  if (notification.event_type.startsWith("visitor_contact_")) {
    return "/admin/contact-inquiries";
  }
  if (notification.event_type.includes("email")) {
    return "/admin/email-events";
  }
  if (
    notification.event_type.includes("payment") ||
    notification.event_type.includes("invoice") ||
    notification.event_type.includes("subscription") ||
    notification.event_type.includes("refund")
  ) {
    return notification.customer_id
      ? `/admin/customers/${notification.customer_id}?section=orders`
      : "/admin/orders";
  }
  if (notification.customer_id) {
    return `/admin/customers/${notification.customer_id}`;
  }
  return "/admin";
}

function dateValue(value: string | null) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function formatWaitingTime(value: string | null) {
  if (!value) return "Unknown";
  const elapsedMs = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return "Today";
  const hours = Math.floor(elapsedMs / (60 * 60 * 1000));
  if (hours < 24) return hours <= 1 ? "1 hour" : `${hours} hours`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day" : `${days} days`;
}

function StatusRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  return (
    <div className="admin-status-row">
      <span className={`admin-status-dot admin-status-${tone}`} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ActionCard({
  href,
  title,
  description,
  count,
  tone,
  loading,
}: {
  href: string;
  title: string;
  description: string;
  count: number;
  tone: "warning" | "danger" | "info";
  loading: boolean;
}) {
  return (
    <Link href={href} className={`admin-action-card admin-action-${tone}`}>
      <div>
        <p className="admin-priority-title">{title}</p>
        <p className="admin-priority-description">{description}</p>
      </div>
      <span>{loading ? "..." : count}</span>
    </Link>
  );
}
