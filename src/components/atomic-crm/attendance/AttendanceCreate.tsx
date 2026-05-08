import { CreateBase, Form } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { FormToolbar } from "../layout/FormToolbar";
import { AttendanceInputs } from "./AttendanceInputs";

const TODAY = new Date().toISOString().slice(0, 10);

export const AttendanceCreate = () => (
  <CreateBase redirect="list">
    <div className="mt-2 flex lg:mr-72">
      <div className="flex-1">
        <Form defaultValues={{ status: "present", date: TODAY }}>
          <Card>
            <CardContent>
              <h2 className="text-lg font-semibold mb-4">Mark Attendance</h2>
              <AttendanceInputs />
              <FormToolbar />
            </CardContent>
          </Card>
        </Form>
      </div>
    </div>
  </CreateBase>
);
