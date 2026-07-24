import { privatePageMetadata } from "@/lib/seo";

export const metadata = {
  ...privatePageMetadata,
  title: "Skärmvisning",
};

export default function DisplayLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
