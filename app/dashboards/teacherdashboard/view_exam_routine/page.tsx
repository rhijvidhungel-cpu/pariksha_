"use client";

import ExamRoutineView from "@/components/ExamRoutineView";

export default function TeacherRoutinePage() {
  return (
    <ExamRoutineView
      backHref="/dashboards/teacherdashboard"
      backLabel="Back to Teacher Dashboard"
      title="Exam Routine"
    />
  );
}
