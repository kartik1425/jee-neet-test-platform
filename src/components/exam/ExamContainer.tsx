"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ExamAttemptState, StudentExamQuestion } from "@/types/exam";
import { ExamHeader } from "./ExamHeader";
import { QuestionView } from "./QuestionView";
import { QuestionPalette } from "./QuestionPalette";
import { ExamFooter } from "./ExamFooter";
import { SubmitConfirmModal } from "./SubmitConfirmModal";
import { saveAnswerHeartbeatAction, submitExamAttemptAction } from "@/lib/exam/actions";

interface ExamContainerProps {
  initialState: ExamAttemptState;
  candidateName: string;
}

export function ExamContainer({ initialState, candidateName }: ExamContainerProps) {
  const router = useRouter();

  // Questions and Sections
  const questions = initialState.questions;
  const sections = Array.from(
    new Set(questions.map((q) => q.section_name || "General"))
  );

  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSection, setActiveSection] = useState<string>(
    questions[0]?.section_name || "General"
  );
  const [answers, setAnswers] = useState<ExamAttemptState["answers"]>(
    initialState.answers
  );
  const [remainingSeconds, setRemainingSeconds] = useState(
    initialState.remainingSeconds
  );
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const [isPaletteOpenMobile, setIsPaletteOpenMobile] = useState(false);

  const currentQuestion: StudentExamQuestion | undefined = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  // Track time spent per question
  const questionStartTimeRef = useRef<number>(Date.now());

  // 1. Authoritative Countdown Timer Effect
  useEffect(() => {
    if (remainingSeconds <= 0) {
      handleFinalSubmit(true);
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds]);

  // 2. Window Unload / Refresh Warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (initialState.status === "IN_PROGRESS" && !isSubmitting) {
        e.preventDefault();
        e.returnValue = "You have an ongoing test. Your answers are saved, but leaving may consume test time.";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [initialState.status, isSubmitting]);

  // 3. Autosave Heartbeat Function
  const persistAnswer = useCallback(
    async (
      questionId: string,
      selectedOptionId: string | null,
      isMarkedForReview: boolean
    ) => {
      const timeSpentNow = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);
      const prevSpent = answers[questionId]?.timeSpentSeconds || 0;

      await saveAnswerHeartbeatAction(initialState.attemptId, {
        questionId,
        selectedOptionId,
        isMarkedForReview,
        timeSpentSeconds: prevSpent + timeSpentNow,
      });
    },
    [initialState.attemptId, answers]
  );

  // 4. Action Handlers
  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion) return;

    setAnswers((prev) => {
      const updated = {
        ...prev,
        [currentQuestion.id]: {
          selectedOptionId: optionId,
          isMarkedForReview: prev[currentQuestion.id]?.isMarkedForReview || false,
          isVisited: true,
          timeSpentSeconds: prev[currentQuestion.id]?.timeSpentSeconds || 0,
        },
      };
      persistAnswer(
        currentQuestion.id,
        optionId,
        updated[currentQuestion.id].isMarkedForReview
      );
      return updated;
    });
  };

  const handleClearOption = () => {
    if (!currentQuestion) return;

    setAnswers((prev) => {
      const updated = {
        ...prev,
        [currentQuestion.id]: {
          selectedOptionId: null,
          isMarkedForReview: prev[currentQuestion.id]?.isMarkedForReview || false,
          isVisited: true,
          timeSpentSeconds: prev[currentQuestion.id]?.timeSpentSeconds || 0,
        },
      };
      persistAnswer(currentQuestion.id, null, updated[currentQuestion.id].isMarkedForReview);
      return updated;
    });
  };

  const handleSaveAndNext = () => {
    if (currentQuestion) {
      // Mark as visited
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          selectedOptionId: prev[currentQuestion.id]?.selectedOptionId || null,
          isMarkedForReview: false,
          isVisited: true,
          timeSpentSeconds: prev[currentQuestion.id]?.timeSpentSeconds || 0,
        },
      }));
      persistAnswer(
        currentQuestion.id,
        answers[currentQuestion.id]?.selectedOptionId || null,
        false
      );
    }

    if (currentIndex < questions.length - 1) {
      questionStartTimeRef.current = Date.now();
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleMarkForReviewAndNext = () => {
    if (currentQuestion) {
      setAnswers((prev) => {
        const currentSelected = prev[currentQuestion.id]?.selectedOptionId || null;
        const updated = {
          ...prev,
          [currentQuestion.id]: {
            selectedOptionId: currentSelected,
            isMarkedForReview: true,
            isVisited: true,
            timeSpentSeconds: prev[currentQuestion.id]?.timeSpentSeconds || 0,
          },
        };
        persistAnswer(currentQuestion.id, currentSelected, true);
        return updated;
      });
    }

    if (currentIndex < questions.length - 1) {
      questionStartTimeRef.current = Date.now();
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      questionStartTimeRef.current = Date.now();
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSelectQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      // Mark current as visited before switching
      if (currentQuestion && !answers[currentQuestion.id]) {
        setAnswers((prev) => ({
          ...prev,
          [currentQuestion.id]: {
            selectedOptionId: null,
            isMarkedForReview: false,
            isVisited: true,
            timeSpentSeconds: 0,
          },
        }));
      }
      questionStartTimeRef.current = Date.now();
      setCurrentIndex(index);
    }
  };

  const handleSelectSection = (sectionName: string) => {
    setActiveSection(sectionName);
    const targetIdx = questions.findIndex((q) => (q.section_name || "General") === sectionName);
    if (targetIdx !== -1) {
      handleSelectQuestion(targetIdx);
    }
  };

  const handleFinalSubmit = async (autoSubmitted = false) => {
    setIsSubmitting(true);
    try {
      await submitExamAttemptAction(initialState.attemptId, autoSubmitted);
      router.push(`/student`);
      router.refresh();
    } catch (err) {
      console.error("Submission error:", err);
      setIsSubmitting(false);
    }
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-sm font-semibold text-slate-600">No questions available in this test.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 h-screen overflow-hidden">
      {/* 1. Authoritative Exam Header */}
      <ExamHeader
        testTitle={initialState.testTitle}
        examType={initialState.examType}
        remainingSeconds={remainingSeconds}
        sections={sections}
        activeSection={currentQuestion.section_name || "General"}
        onSelectSection={handleSelectSection}
        candidateName={candidateName}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
        onToggleMobilePalette={() => setIsPaletteOpenMobile(true)}
      />

      {/* 2. Main Exam Arena */}
      <main className="flex-1 flex flex-col lg:flex-row gap-3 sm:gap-4 p-2 sm:p-4 overflow-hidden max-w-7xl w-full mx-auto">
        {/* Left: Question Presentation */}
        <QuestionView
          question={currentQuestion}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
          selectedOptionId={currentAnswer?.selectedOptionId || null}
          onSelectOption={handleSelectOption}
          onClearOption={handleClearOption}
          fontSize={fontSize}
        />

        {/* Right: NTA Question Palette */}
        <QuestionPalette
          questions={questions}
          currentIndex={currentIndex}
          answers={answers}
          onSelectQuestion={handleSelectQuestion}
          isOpenMobile={isPaletteOpenMobile}
          onCloseMobile={() => setIsPaletteOpenMobile(false)}
        />
      </main>

      {/* 3. Action Footer */}
      <ExamFooter
        currentIndex={currentIndex}
        totalQuestions={questions.length}
        onPrevious={handlePrevious}
        onSaveAndNext={handleSaveAndNext}
        onMarkForReviewAndNext={handleMarkForReviewAndNext}
        onClearResponse={handleClearOption}
        onSubmitClick={() => setIsSubmitModalOpen(true)}
        onToggleMobilePalette={() => setIsPaletteOpenMobile(true)}
      />

      {/* 4. Submission Confirmation Modal */}
      <SubmitConfirmModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirmSubmit={() => handleFinalSubmit(false)}
        isSubmitting={isSubmitting}
        questions={questions}
        answers={answers}
      />
    </div>
  );
}

