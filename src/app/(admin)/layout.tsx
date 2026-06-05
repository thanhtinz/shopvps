"use client";
import Sidebar from "@/components/layout/AdminSidebar";
import AppShell from "@/components/layout/AppShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell sidebar={(close) => <Sidebar onClose={close} />} padding={28}>
      {children}
    </AppShell>
  );
}
