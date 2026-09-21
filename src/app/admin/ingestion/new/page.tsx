import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { IngestionUploadForm } from "@/components/ingestion/IngestionUploadForm";

export const dynamic = "force-dynamic";

export default async function NewIngestionBatchPage() {
  await requireRole(["TEACHER", "ADMIN"]);
  const supabase = await createClient();

  const { data: subjects } = await supabase.from("subjects").select("id, name").order("name");
  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, subject_id, name")
    .order("order_index");

  const taxonomy = (subjects || []).map((s) => ({
    id: s.id,
    name: s.name,
    chapters: (chapters || [])
      .filter((c) => c.subject_id === s.id)
      .map((c) => ({ id: c.id, name: c.name })),
  }));

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <IngestionUploadForm taxonomy={taxonomy} />
    </div>
  );
}
