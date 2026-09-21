import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getIngestionBatchDetail } from "@/lib/ingestion/actions";
import { BatchReviewWorkspace } from "@/components/ingestion/BatchReviewWorkspace";

export const dynamic = "force-dynamic";

interface IngestionBatchDetailPageProps {
  params: Promise<{
    batchId: string;
  }>;
}

export default async function IngestionBatchDetailPage({
  params,
}: IngestionBatchDetailPageProps) {
  await requireRole(["TEACHER", "ADMIN"]);
  const resolvedParams = await params;
  const batchDetail = await getIngestionBatchDetail(resolvedParams.batchId);

  if (!batchDetail) {
    notFound();
  }

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
      <BatchReviewWorkspace
        batch={batchDetail.batch}
        initialItems={batchDetail.items}
        taxonomy={taxonomy}
      />
    </div>
  );
}
