"use client";

import ExamRoutineView from "@/components/ExamRoutineView";

export default function StudentExamRoutinePage() {
  return (
    <ExamRoutineView
      backHref="/dashboards/studentdashboard"
      backLabel="Back to Student Dashboard"
      title="Exam Routine"
    />
  );
}
