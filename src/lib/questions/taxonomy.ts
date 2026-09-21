import { createClient } from "@/lib/supabase/server";
import { Subject, Chapter, Topic } from "@/types/database";

export interface TaxonomyHierarchy {
  subjects: (Subject & {
    chapters: (Chapter & {
      topics: Topic[];
    })[];
  })[];
}

/**
 * Fetch full taxonomy tree from the database.
 */
export async function getTaxonomyTree(): Promise<TaxonomyHierarchy> {
  const supabase = await createClient();

  const { data: subjects, error: subjErr } = await supabase
    .from("subjects")
    .select("*")
    .order("name", { ascending: true });

  const { data: chapters, error: chapErr } = await supabase
    .from("chapters")
    .select("*")
    .order("order_index", { ascending: true });

  const { data: topics, error: topErr } = await supabase
    .from("topics")
    .select("*")
    .order("order_index", { ascending: true });

  if (subjErr || !subjects) {
    return { subjects: [] };
  }

  const topicMap = new Map<string, Topic[]>();
  (topics || []).forEach((top) => {
    const list = topicMap.get(top.chapter_id) || [];
    list.push(top);
    topicMap.set(top.chapter_id, list);
  });

  const chapterMap = new Map<string, (Chapter & { topics: Topic[] })[]>();
  (chapters || []).forEach((chap) => {
    const list = chapterMap.get(chap.subject_id) || [];
    list.push({
      ...chap,
      topics: topicMap.get(chap.id) || [],
    });
    chapterMap.set(chap.subject_id, list);
  });

  const hierarchy = subjects.map((subj) => ({
    ...subj,
    chapters: chapterMap.get(subj.id) || [],
  }));

  return { subjects: hierarchy };
}
