import { StudentList } from "./StudentList";
import { StudentCreate } from "./StudentCreate";
import { StudentEdit } from "./StudentEdit";
import { StudentShow } from "./StudentShow";
import type { Student } from "../types";

export default {
  list: StudentList,
  create: StudentCreate,
  edit: StudentEdit,
  show: StudentShow,
  recordRepresentation: (record: Student) => record.full_name,
};
