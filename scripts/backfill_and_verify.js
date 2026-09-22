const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (m) process.env[m[1]] = m[2];
});

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function computeDeterministicScore(items, testMarkingScheme, metadata) {
  let totalScore = 0;
  let maximumScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;
  let totalTimeSpentSeconds = 0;

  const questionResults = [];
  const subjectMap = new Map();
  const chapterMap = new Map();
  const topicMap = new Map();

  for (const item of items) {
    const marksCfg = item.marksConfig || testMarkingScheme;
    const isAttempted = Boolean(item.selectedOptionId);
    let isCorrect = null;
    let marksAwarded = 0;

    if (!isAttempted) {
      isCorrect = null;
      marksAwarded = marksCfg.unattempted || 0;
      unattemptedCount++;
    } else if (item.selectedOptionId === item.correctOptionId) {
      isCorrect = true;
      marksAwarded = marksCfg.correct;
      correctCount++;
    } else {
      isCorrect = false;
      marksAwarded = marksCfg.incorrect;
      incorrectCount++;
    }

    const maxMarks = marksCfg.correct;
    totalScore += marksAwarded;
    maximumScore += maxMarks;
    totalTimeSpentSeconds += item.timeSpentSeconds || 0;

    const res = {
      questionId: item.questionId,
      testQuestionId: item.testQuestionId,
      subjectId: item.subjectId,
      subjectName: item.subjectName,
      chapterId: item.chapterId,
      chapterName: item.chapterName,
      topicId: item.topicId || null,
      topicName: item.topicName || null,
      orderIndex: item.orderIndex,
      selectedOptionId: item.selectedOptionId,
      selectedOptionKey: item.selectedOptionKey,
      correctOptionId: item.correctOptionId,
      correctOptionKey: item.correctOptionKey,
      isCorrect,
      isAttempted,
      marksAwarded,
      maxMarks,
      timeSpentSeconds: item.timeSpentSeconds || 0,
      contentLatex: item.contentLatex,
      explanationLatex: item.explanationLatex,
    };

    questionResults.push(res);

    // Subject Grouping
    if (!subjectMap.has(item.subjectId)) {
      subjectMap.set(item.subjectId, { name: item.subjectName, items: [] });
    }
    subjectMap.get(item.subjectId).items.push(res);

    // Chapter Grouping
    if (!chapterMap.has(item.chapterId)) {
      chapterMap.set(item.chapterId, {
        name: item.chapterName,
        subjectName: item.subjectName,
        items: [],
      });
    }
    chapterMap.get(item.chapterId).items.push(res);

    // Topic Grouping
    if (item.topicId) {
      if (!topicMap.has(item.topicId)) {
        topicMap.set(item.topicId, {
          name: item.topicName || "General Topic",
          chapterName: item.chapterName,
          subjectName: item.subjectName,
          items: [],
        });
      }
      topicMap.get(item.topicId).items.push(res);
    }
  }

  const attemptedCount = correctCount + incorrectCount;
  const accuracyPercentage =
    attemptedCount > 0
      ? Math.round((correctCount / attemptedCount) * 10000) / 100
      : 0;

  function rollMetrics(itemList) {
    let score = 0;
    let maxScore = 0;
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;

    for (const it of itemList) {
      score += it.marksAwarded;
      maxScore += it.maxMarks;
      if (!it.isAttempted) unattempted++;
      else if (it.isCorrect) correct++;
      else incorrect++;
    }

    const att = correct + incorrect;
    const accuracy = att > 0 ? Math.round((correct / att) * 10000) / 100 : 0;

    return {
      totalQuestions: itemList.length,
      attempted: att,
      correct,
      incorrect,
      unattempted,
      score,
      maxScore,
      accuracy,
    };
  }

  const subjectBreakdown = [];
  for (const [sId, sData] of subjectMap.entries()) {
    subjectBreakdown.push({
      subjectId: sId,
      subjectName: sData.name,
      ...rollMetrics(sData.items),
    });
  }

  const chapterBreakdown = [];
  for (const [cId, cData] of chapterMap.entries()) {
    chapterBreakdown.push({
      chapterId: cId,
      chapterName: cData.name,
      subjectName: cData.subjectName,
      ...rollMetrics(cData.items),
    });
  }

  const topicBreakdown = [];
  for (const [tId, tData] of topicMap.entries()) {
    topicBreakdown.push({
      topicId: tId,
      topicName: tData.name,
      chapterName: tData.chapterName,
      subjectName: tData.subjectName,
      ...rollMetrics(tData.items),
    });
  }

  return {
    attemptId: metadata.attemptId,
    testId: metadata.testId,
    studentId: metadata.studentId,
    scoringVersion: "v1.0.0",
    totalScore,
    maximumScore,
    totalQuestions: items.length,
    attemptedCount,
    correctCount,
    incorrectCount,
    unattemptedCount,
    accuracyPercentage,
    totalTimeSpentSeconds,
    questionResults,
    subjectBreakdown,
    chapterBreakdown,
    topicBreakdown,
    calculatedAt: new Date().toISOString(),
  };
}

function classifyMistakeDeterministically(ctx) {
  if (ctx.is_correct === false) {
    if (ctx.time_spent_seconds < 15) {
      return {
        mistake_type: "CARELESS_ERROR",
        confidence: "HIGH",
        source: "RULE",
        rule_triggered: "RAPID_INCORRECT (<15s)",
        rationale: "Question was answered very rapidly and incorrectly, pointing to an avoidable rush or slip."
      };
    }
    if (ctx.time_spent_seconds > 180) {
      return {
        mistake_type: "CONCEPTUAL_ERROR",
        confidence: "HIGH",
        source: "RULE",
        rule_triggered: "PROLONGED_STRUGGLE (>180s)",
        rationale: "Extensive time spent before answering incorrectly indicates a fundamental concept struggle."
      };
    }
    if (ctx.is_marked_for_review) {
      return {
        mistake_type: "WRONG_ASSUMPTION",
        confidence: "MEDIUM",
        source: "RULE",
        rule_triggered: "FLAGGED_FOR_REVIEW_INCORRECT",
        rationale: "Student marked question for review and answered incorrectly, indicating doubt or hesitation."
      };
    }
    return {
      mistake_type: "CALCULATION_ERROR",
      confidence: "MEDIUM",
      source: "RULE",
      rule_triggered: "STANDARD_INCORRECT",
      rationale: "Standard incorrect attempt in normal time frame, likely arithmetic or algebraic error."
    };
  }

  if (!ctx.is_correct && ctx.is_visited && ctx.time_spent_seconds >= 30) {
    return {
      mistake_type: "TIME_PRESSURE",
      confidence: "MEDIUM",
      source: "RULE",
      rule_triggered: "TIME_TRAP_ABANDONED (>=30s unattempted)",
      rationale: "Spent substantial time analyzing question but abandoned without selecting an answer."
    };
  }

  return {
    mistake_type: "UNKNOWN",
    confidence: "LOW",
    source: "RULE",
    rule_triggered: "NONE",
    rationale: "No clear deterministic pattern."
  };
}

async function backfillAll() {
  console.log('Fetching all completed attempts...');
  const { data: attempts, error: aErr } = await supabase
    .from('attempts')
    .select('id, test_id, student_id, status, time_spent_seconds, tests(id, title, duration_minutes, marking_scheme)')
    .eq('status', 'SUBMITTED');

  if (aErr) {
    console.error('Error fetching attempts:', aErr);
    return;
  }

  console.log(`Found ${attempts.length} submitted attempts.`);

  for (const attempt of attempts) {
    console.log(`\nProcessing Attempt ${attempt.id}...`);

    const markingScheme = attempt.tests?.marking_scheme || {
      correct: 4,
      incorrect: -1,
      unattempted: 0,
    };

    // Fetch Test Questions
    const { data: testQuestions, error: tqErr } = await supabase
      .from("test_questions")
      .select(`
        id, question_id, section_id, order_index, marks, negative_marks, snapshot_data,
        questions (
          id, content_latex, explanation_latex, subject_id, chapter_id, topic_id, difficulty,
          subjects!questions_subject_id_fkey(name),
          chapters!questions_chapter_id_fkey(name),
          topics!questions_topic_id_fkey(name),
          question_options (id, option_key, content_latex, is_correct, order_index)
        )
      `)
      .eq("test_id", attempt.test_id)
      .order("order_index", { ascending: true });

    if (tqErr || !testQuestions) {
      console.error(`Failed to load test questions for attempt ${attempt.id}:`, tqErr);
      continue;
    }

    // Fetch Answers
    const { data: answers, error: ansErr } = await supabase
      .from("attempt_answers")
      .select("*")
      .eq("attempt_id", attempt.id);

    if (ansErr || !answers) {
      console.error(`Failed to load answers for attempt ${attempt.id}:`, ansErr);
      continue;
    }

    const studentAnswersMap = new Map();
    answers.forEach(a => {
      studentAnswersMap.set(a.question_id, a);
    });

    const scoringItems = testQuestions.map(tq => {
      const q = tq.questions;
      let options = q?.question_options || [];
      let contentLatex = q?.content_latex || "";
      let explanationLatex = q?.explanation_latex || null;

      if (tq.snapshot_data && tq.snapshot_data.options) {
        contentLatex = tq.snapshot_data.content_latex;
        explanationLatex = tq.snapshot_data.explanation_latex || null;
        options = tq.snapshot_data.options;
      }

      const correctOption = options.find(o => o.is_correct) || options[0];
      const studentAns = studentAnswersMap.get(tq.question_id);
      const selectedOpt = options.find(o => o.id === studentAns?.selected_option_id);

      return {
        questionId: tq.question_id,
        testQuestionId: tq.id,
        subjectId: q?.subject_id || "default-subject",
        subjectName: q?.subjects?.name || "General",
        chapterId: q?.chapter_id || "default-chapter",
        chapterName: q?.chapters?.name || "General Chapter",
        topicId: q?.topic_id || null,
        topicName: q?.topics?.name || null,
        difficulty: q?.difficulty || "MEDIUM",
        orderIndex: tq.order_index,
        marksConfig: {
          correct: Number(tq.marks) || markingScheme.correct,
          incorrect: Number(tq.negative_marks) || markingScheme.incorrect,
          unattempted: markingScheme.unattempted || 0,
        },
        correctOptionId: correctOption?.id || "",
        correctOptionKey: correctOption?.option_key || "A",
        selectedOptionId: studentAns?.selected_option_id || null,
        selectedOptionKey: selectedOpt?.option_key || null,
        timeSpentSeconds: studentAns?.time_spent_seconds || 0,
        contentLatex,
        explanationLatex,
        options: options.map(o => ({
          id: o.id,
          optionKey: o.option_key,
          contentLatex: o.content_latex,
          isCorrect: Boolean(o.is_correct),
        })),
      };
    });

    // Compute deterministic score
    const scoreReport = computeDeterministicScore(scoringItems, markingScheme, {
      attemptId: attempt.id,
      testId: attempt.test_id,
      studentId: attempt.student_id,
    });

    console.log(`Score Report computed: Total Score: ${scoreReport.totalScore}/${scoreReport.maximumScore}, Subjects: ${scoreReport.subjectBreakdown.length}, Topics: ${scoreReport.topicBreakdown.length}`);

    // Upsert into test_results
    const { data: existingTr } = await supabase
      .from("test_results")
      .select("id")
      .eq("attempt_id", attempt.id)
      .maybeSingle();

    const trPayload = {
      attempt_id: attempt.id,
      test_id: attempt.test_id,
      student_id: attempt.student_id,
      scoring_version: scoreReport.scoringVersion,
      total_score: scoreReport.totalScore,
      maximum_score: scoreReport.maximumScore,
      total_questions: scoreReport.totalQuestions,
      attempted_count: scoreReport.attemptedCount,
      correct_count: scoreReport.correctCount,
      incorrect_count: scoreReport.incorrectCount,
      unattempted_count: scoreReport.unattemptedCount,
      accuracy_percentage: scoreReport.accuracyPercentage,
      total_time_spent_seconds: scoreReport.totalTimeSpentSeconds,
      subject_breakdown: scoreReport.subjectBreakdown,
      chapter_breakdown: scoreReport.chapterBreakdown,
      topic_breakdown: scoreReport.topicBreakdown,
      calculated_at: scoreReport.calculatedAt,
    };

    if (existingTr) {
      await supabase.from("test_results").update(trPayload).eq("id", existingTr.id);
    } else {
      await supabase.from("test_results").insert(trPayload);
    }
    console.log(`Saved test_results successfully.`);

    // Update attempt_answers
    for (const qRes of scoreReport.questionResults) {
      await supabase
        .from("attempt_answers")
        .update({
          is_correct: qRes.isCorrect,
          marks_awarded: qRes.marksAwarded,
        })
        .eq("attempt_id", attempt.id)
        .eq("question_id", qRes.questionId);
    }

    // Update student_topic_stats
    for (const qRes of scoreReport.questionResults) {
      if (qRes.topicId && qRes.isAttempted) {
        const isCor = qRes.isCorrect === true;
        const { data: currentStats } = await supabase
          .from("student_topic_stats")
          .select("*")
          .eq("student_id", attempt.student_id)
          .eq("topic_id", qRes.topicId)
          .maybeSingle();

        const newAttempted = (currentStats?.total_attempted || 0) + 1;
        const newCorrect = (currentStats?.total_correct || 0) + (isCor ? 1 : 0);
        const newIncorrect = (currentStats?.total_incorrect || 0) + (isCor ? 0 : 1);
        const newAcc = Math.round((newCorrect / newAttempted) * 10000) / 100;

        const statPayload = {
          student_id: attempt.student_id,
          topic_id: qRes.topicId,
          total_attempted: newAttempted,
          total_correct: newCorrect,
          total_incorrect: newIncorrect,
          accuracy_percentage: newAcc,
          last_attempted_at: new Date().toISOString(),
        };

        if (currentStats) {
          await supabase.from("student_topic_stats").update(statPayload).eq("id", currentStats.id);
        } else {
          await supabase.from("student_topic_stats").insert(statPayload);
        }
      }
    }

    // Extract Mistakes
    const mistakesToInsert = [];
    const questionHistoryUpdates = [];

    for (let idx = 0; idx < scoringItems.length; idx++) {
      const item = scoringItems[idx];
      const ans = studentAnswersMap.get(item.questionId) || {};
      const isAttempted = Boolean(item.selectedOptionId);
      const isCorrect = item.selectedOptionId === item.correctOptionId;
      const isIncorrect = isAttempted && !isCorrect;
      const isDeliberatedUnattempted =
        !isAttempted && ans.is_visited === true && (ans.time_spent_seconds || 0) >= 30;

      questionHistoryUpdates.push({
        student_id: attempt.student_id,
        question_id: item.questionId,
        is_correct: isAttempted ? isCorrect : null,
        is_attempted: isAttempted,
      });

      if (!isIncorrect && !isDeliberatedUnattempted) {
        continue;
      }

      const ruleResult = classifyMistakeDeterministically({
        selected_option_id: item.selectedOptionId,
        is_correct: isCorrect,
        time_spent_seconds: item.timeSpentSeconds || 0,
        is_marked_for_review: ans.is_marked_for_review || false,
        is_visited: ans.is_visited || false,
        difficulty: item.difficulty,
        question_order_index: idx + 1,
        total_questions: scoringItems.length,
      });

      const evidence = {
        time_spent_seconds: item.timeSpentSeconds || 0,
        allocated_average_seconds: Math.round(
          ((attempt.tests?.duration_minutes || 180) * 60) / scoringItems.length
        ),
        selected_option_key: item.selectedOptionKey,
        correct_option_key: item.correctOptionKey,
        difficulty: item.difficulty,
        is_marked_for_review: ans.is_marked_for_review || false,
        is_unattempted: !isAttempted,
        rule_triggered: ruleResult.rule_triggered,
        rationale: ruleResult.rationale,
        audit_history: [
          {
            changed_at: new Date().toISOString(),
            previous_type: ruleResult.mistake_type,
            new_type: ruleResult.mistake_type,
            changed_by: "SYSTEM",
            source: ruleResult.source,
            notes: "Initial automated extraction",
          },
        ],
      };

      mistakesToInsert.push({
        attempt_answer_id: ans.id,
        student_id: attempt.student_id,
        question_id: item.questionId,
        attempt_id: attempt.id,
        test_id: attempt.test_id,
        subject_id: item.subjectId,
        chapter_id: item.chapterId,
        topic_id: item.topicId,
        mistake_type: ruleResult.mistake_type,
        classification_source: ruleResult.source,
        classification_confidence: ruleResult.confidence,
        classification_status: "SUGGESTED",
        resolution_status: "OPEN",
        evidence,
        updated_at: new Date().toISOString(),
      });
    }

    if (mistakesToInsert.length > 0) {
      console.log(`Processing ${mistakesToInsert.length} mistakes for attempt ${attempt.id}...`);
      for (const m of mistakesToInsert) {
        if (!m.attempt_answer_id) continue;
        const { data: existingM } = await supabase
          .from("mistakes")
          .select("id")
          .eq("attempt_answer_id", m.attempt_answer_id)
          .maybeSingle();

        if (existingM) {
          const { error: uErr } = await supabase
            .from("mistakes")
            .update(m)
            .eq("id", existingM.id);
          if (uErr) console.error("Error updating mistake:", uErr);
        } else {
          const { error: iErr } = await supabase
            .from("mistakes")
            .insert(m);
          if (iErr) console.error("Error inserting mistake:", iErr);
        }
      }
      console.log("Mistakes processed successfully.");
    }

    // Update question history
    for (const qh of questionHistoryUpdates) {
      const { data: existingQh } = await supabase
        .from("student_question_history")
        .select("*")
        .eq("student_id", qh.student_id)
        .eq("question_id", qh.question_id)
        .maybeSingle();

      const lastResult =
        qh.is_correct === true
          ? "CORRECT"
          : qh.is_correct === false
          ? "INCORRECT"
          : "UNATTEMPTED";

      if (existingQh) {
        await supabase
          .from("student_question_history")
          .update({
            times_attempted: existingQh.times_attempted + (qh.is_attempted ? 1 : 0),
            times_correct: existingQh.times_correct + (qh.is_correct === true ? 1 : 0),
            times_incorrect: existingQh.times_incorrect + (qh.is_correct === false ? 1 : 0),
            last_attempted_at: new Date().toISOString(),
            last_result: lastResult,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingQh.id);
      } else {
        await supabase.from("student_question_history").insert({
          student_id: qh.student_id,
          question_id: qh.question_id,
          times_attempted: qh.is_attempted ? 1 : 0,
          times_correct: qh.is_correct === true ? 1 : 0,
          times_incorrect: qh.is_correct === false ? 1 : 0,
          first_attempted_at: new Date().toISOString(),
          last_attempted_at: new Date().toISOString(),
          last_result: lastResult,
        });
      }
    }
  }

  console.log('\n--- BACKFILL COMPLETE ---');
}

backfillAll();
