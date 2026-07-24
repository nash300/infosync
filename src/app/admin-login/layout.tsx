import { privatePageMetadata } from "@/lib/seo";

export const metadata = {
  ...privatePageMetadata,
  title: "Admininloggning",
};

export default function AdminLoginLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
