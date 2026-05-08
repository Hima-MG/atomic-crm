import { Droppable } from "@hello-pangea/dnd";
import type { Student } from "../types";
import { StudentKanbanCard } from "./StudentKanbanCard";
import { STAGE_CHOICES } from "./StudentInputs";

const STAGE_HEADER_COLORS: Record<string, string> = {
  "new-lead": "border-blue-400 text-blue-700 dark:text-blue-300",
  contacted: "border-yellow-400 text-yellow-700 dark:text-yellow-300",
  interested: "border-purple-400 text-purple-700 dark:text-purple-300",
  "follow-up": "border-orange-400 text-orange-700 dark:text-orange-300",
  joined: "border-green-400 text-green-700 dark:text-green-300",
  closed: "border-gray-400 text-gray-600 dark:text-gray-400",
};

export const StudentKanbanColumn = ({
  stage,
  students,
}: {
  stage: string;
  students: Student[];
}) => {
  const label = STAGE_CHOICES.find((s) => s.id === stage)?.name ?? stage;
  const colorClass =
    STAGE_HEADER_COLORS[stage] ?? "border-gray-300 text-gray-600";

  return (
    <div className="flex-1 min-w-[180px] pb-8">
      <div
        className={`flex items-center justify-between px-1 pb-2 border-b-2 ${colorClass}`}
      >
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="text-xs font-medium bg-muted rounded-full px-2 py-0.5">
          {students.length}
        </span>
      </div>
      <Droppable droppableId={stage}>
        {(droppableProvided, snapshot) => (
          <div
            ref={droppableProvided.innerRef}
            {...droppableProvided.droppableProps}
            className={`flex flex-col rounded-xl mt-2 gap-2 min-h-[60px] ${
              snapshot.isDraggingOver ? "bg-muted/60" : ""
            }`}
          >
            {students.map((student, index) => (
              <StudentKanbanCard
                key={student.id}
                student={student}
                index={index}
              />
            ))}
            {droppableProvided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};
