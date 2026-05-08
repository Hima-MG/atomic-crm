import { DragDropContext, type OnDragEndResponder } from "@hello-pangea/dnd";
import isEqual from "lodash/isEqual";
import {
  useDataProvider,
  useListContext,
  useNotify,
  type DataProvider,
} from "ra-core";
import { useEffect, useRef, useState } from "react";
import type { Student, StudentStage } from "../types";
import { StudentKanbanColumn } from "./StudentKanbanColumn";
import { STAGE_CHOICES } from "./StudentInputs";

type StudentsByStage = Record<string, Student[]>;

const STAGES = STAGE_CHOICES.map((s) => s.id) as StudentStage[];

const getStudentsByStage = (students: Student[]): StudentsByStage => {
  const byStage: StudentsByStage = {};
  for (const stage of STAGES) byStage[stage] = [];
  for (const s of students) {
    const stage = STAGES.includes(s.stage as StudentStage)
      ? s.stage
      : STAGES[0];
    byStage[stage] = [...(byStage[stage] ?? []), s];
  }
  for (const stage of STAGES) {
    byStage[stage] = byStage[stage].sort((a, b) => a.index - b.index);
  }
  return byStage;
};

export const StudentKanban = () => {
  const { data: unordered, isPending, refetch } = useListContext<Student>();
  const dataProvider = useDataProvider();
  const notify = useNotify();

  const [byStage, setByStage] = useState<StudentsByStage>(
    getStudentsByStage([]),
  );

  // keep a snapshot for rollback on persist failure
  const prevByStage = useRef<StudentsByStage>(byStage);

  useEffect(() => {
    if (!unordered) return;
    const next = getStudentsByStage(unordered);
    if (!isEqual(next, byStage)) {
      setByStage(next);
      prevByStage.current = next;
    }
    // Intentional: only run when unordered data changes from the server
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unordered]);

  if (isPending) return null;

  const onDragEnd: OnDragEndResponder = (result) => {
    const { destination, source } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const srcStage = source.droppableId;
    const dstStage = destination.droppableId;
    const moved = byStage[srcStage][source.index];
    if (!moved) return;

    // Optimistic local update
    const optimistic = buildNewByStage(
      byStage,
      srcStage,
      dstStage,
      source.index,
      destination.index,
      moved,
    );
    const snapshot = prevByStage.current;
    prevByStage.current = optimistic;
    setByStage(optimistic);

    // Persist — roll back if it fails
    persistStudentStage(moved, dstStage, destination.index, dataProvider)
      .then(() => {
        refetch();
      })
      .catch(() => {
        // Roll back to the state before the drag
        setByStage(snapshot);
        prevByStage.current = snapshot;
        notify("Could not update lead stage. Please try again.", {
          type: "error",
        });
      });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <StudentKanbanColumn
            key={stage}
            stage={stage}
            students={byStage[stage] ?? []}
          />
        ))}
      </div>
    </DragDropContext>
  );
};

// Pure helper — builds the next byStage map after a drag
const buildNewByStage = (
  current: StudentsByStage,
  srcStage: string,
  dstStage: string,
  srcIndex: number,
  dstIndex: number,
  moved: Student,
): StudentsByStage => {
  const srcCol = [...current[srcStage]];
  srcCol.splice(srcIndex, 1);

  if (srcStage === dstStage) {
    srcCol.splice(dstIndex, 0, moved);
    return { ...current, [srcStage]: srcCol };
  }

  const dstCol = [...(current[dstStage] ?? [])];
  dstCol.splice(dstIndex, 0, moved);
  return { ...current, [srcStage]: srcCol, [dstStage]: dstCol };
};

const persistStudentStage = (
  student: Student,
  newStage: string,
  newIndex: number,
  dataProvider: DataProvider,
): Promise<void> =>
  dataProvider
    .update("students", {
      id: student.id,
      data: { stage: newStage, index: newIndex },
      previousData: student,
    })
    .then(() => undefined);
