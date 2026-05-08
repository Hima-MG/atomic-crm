import { Draggable } from "@hello-pangea/dnd";
import { useRedirect } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Calendar } from "lucide-react";
import type { Student } from "../types";

export const StudentKanbanCard = ({
  student,
  index,
}: {
  student: Student;
  index: number;
}) => (
  <Draggable draggableId={String(student.id)} index={index}>
    {(provided, snapshot) => (
      <StudentCardContent
        provided={provided}
        snapshot={snapshot}
        student={student}
      />
    )}
  </Draggable>
);

const StudentCardContent = ({
  provided,
  snapshot,
  student,
}: {
  provided?: any;
  snapshot?: any;
  student: Student;
}) => {
  const redirect = useRedirect();
  const handleClick = () =>
    redirect(`/students/${student.id}/show`, undefined, undefined, undefined, {
      _scrollToTop: false,
    });

  return (
    <div
      className="cursor-pointer"
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      ref={provided?.innerRef}
      onClick={handleClick}
    >
      <Card
        className={`py-2 transition-all duration-200 ${
          snapshot?.isDragging
            ? "opacity-90 rotate-1 shadow-lg"
            : "shadow-sm hover:shadow-md"
        }`}
      >
        <CardContent className="px-3 space-y-1.5">
          <p className="text-sm font-semibold leading-tight">
            {student.full_name}
          </p>
          {student.qualification && (
            <p className="text-xs text-muted-foreground">
              {student.qualification}
              {student.interested_course
                ? ` · ${student.interested_course}`
                : ""}
            </p>
          )}
          <div className="flex flex-col gap-0.5">
            {student.phone && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                {student.phone}
              </span>
            )}
            {student.follow_up_date && (
              <span className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                <Calendar className="h-3 w-3" />
                {new Date(student.follow_up_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
