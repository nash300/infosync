export type AdminExternalService = {
  name: string;
  shortLabel: string;
  category: string;
  description: string;
  example: string;
  href: string;
  actionLabel: string;
};

export const adminExternalServices: AdminExternalService[] = [
  {
    name: "Stripe",
    shortLabel: "ST",
    category: "Payments",
    description:
      "Handles customer checkout, recurring subscriptions, invoices, payment status, and refunds.",
    example:
      "A customer pays the first order in Stripe, then the monthly subscription starts after the trial.",
    href: "https://dashboard.stripe.com/",
    actionLabel: "Open Stripe",
  },
  {
    name: "Vercel",
    shortLabel: "VE",
    category: "Hosting",
    description:
      "Hosts screenia.se and runs each production deployment of the Screenia application.",
    example:
      "After a price change is published, check that the deployment is Ready or inspect its error logs.",
    href: "https://vercel.com/nadeesha7314-1449s-projects/screenia",
    actionLabel: "Open Vercel",
  },
  {
    name: "Supabase",
    shortLabel: "SU",
    category: "Database and accounts",
    description:
      "Stores Screenia's business data, authenticates users, and holds customer-uploaded files.",
    example:
      "A new customer profile, payment state, uploaded material, and audit history are saved here.",
    href: "https://supabase.com/dashboard/project/wcmhvldpelfhurlsuwwy",
    actionLabel: "Open Supabase",
  },
  {
    name: "Resend",
    shortLabel: "RE",
    category: "Transactional email",
    description:
      "Sends Screenia's transactional emails and records whether they were delivered, bounced, or failed.",
    example:
      "Send a request confirmation or secure onboarding link, then inspect its delivery status.",
    href: "https://resend.com/emails",
    actionLabel: "Open Resend",
  },
  {
    name: "Loopia",
    shortLabel: "LO",
    category: "Domain and mailbox",
    description:
      "Manages the screenia.se domain, DNS records, and Screenia email accounts.",
    example:
      "Update a DNS record for Vercel or manage an address such as service@screenia.se.",
    href: "https://customerzone.loopia.se/",
    actionLabel: "Open Loopia",
  },
  {
    name: "Gmail",
    shortLabel: "GM",
    category: "Inbox",
    description:
      "Provides the inbox used to inspect real customer-facing messages during email testing.",
    example:
      "Confirm that an onboarding email arrived, looks correct, and did not land in Spam.",
    href: "https://mail.google.com/",
    actionLabel: "Open Gmail",
  },
  {
    name: "GitHub",
    shortLabel: "GH",
    category: "Source code",
    description:
      "Stores Screenia's source code and keeps a reviewable history of every published change.",
    example:
      "Review the code and test results for a pricing update before it is deployed through Vercel.",
    href: "https://github.com/nash300/screenia",
    actionLabel: "Open GitHub",
  },
];
