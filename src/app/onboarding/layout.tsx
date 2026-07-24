import { privatePageMetadata } from "@/lib/seo";

export const metadata = {
  ...privatePageMetadata,
  title: "Kundregistrering",
};

export default function OnboardingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
