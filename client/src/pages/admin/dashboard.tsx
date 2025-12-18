import { useState } from "react";
import { AdminLayout, AdminPersona } from "@/components/admin-layout";
import ContentManager from "./content-manager";
import UsageMonitor from "./usage-monitor";

export default function AdminDashboard() {
  const [persona, setPersona] = useState<AdminPersona>("content_admin");

  return (
    <AdminLayout persona={persona} onPersonaChange={setPersona}>
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {persona === "content_admin" ? (
          <ContentManager />
        ) : (
          <UsageMonitor />
        )}
      </div>
    </AdminLayout>
  );
}
