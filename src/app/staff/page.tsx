import type { Metadata } from "next";
import { StaffDashboard } from "@/components/staff/StaffDashboard";

export const metadata: Metadata = {
  title: "Staff Monitor",
};

export default function StaffPage() {
  return (
    <main className="min-h-screen">
      <StaffDashboard />
    </main>
  );
}
