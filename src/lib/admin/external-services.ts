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
    category: "Domain and DNS",
    description:
      "Manages ownership of the screenia.se domain and the DNS records that connect Screenia's services.",
    example:
      "Update a Vercel domain record or the MX and TXT records used by Zoho Mail and Resend.",
    href: "https://customerzone.loopia.se/",
    actionLabel: "Open Loopia",
  },
  {
    name: "Zoho Mail",
    shortLabel: "ZO",
    category: "Customer mailbox",
    description:
      "Hosts the service@screenia.se inbox and sent mail used for direct customer communication.",
    example:
      "Read a customer's reply about an order, answer it, and keep the conversation in the Screenia mailbox.",
    href: "https://mail.zoho.eu/zm/#mail/folder/inbox",
    actionLabel: "Open Zoho Mail",
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
