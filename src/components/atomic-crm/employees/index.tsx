import { EmployeeList } from "./EmployeeList";
import { EmployeeCreate } from "./EmployeeCreate";
import { EmployeeEdit } from "./EmployeeEdit";
import { EmployeeShow } from "./EmployeeShow";
import type { Employee } from "../types";

export default {
  list: EmployeeList,
  create: EmployeeCreate,
  edit: EmployeeEdit,
  show: EmployeeShow,
  recordRepresentation: (record: Employee) => record.name,
};
