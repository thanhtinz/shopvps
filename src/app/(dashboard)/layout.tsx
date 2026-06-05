"use client";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import AppShell from "@/components/layout/AppShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell sidebar={(close) => <Sidebar onClose={close} />} header={<Header />} padding={24}>
      {children}
    </AppShell>
  );
}
