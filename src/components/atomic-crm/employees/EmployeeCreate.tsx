import { CreateBase, Form } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { FormToolbar } from "../layout/FormToolbar";
import { EmployeeInputs } from "./EmployeeInputs";

export const EmployeeCreate = () => (
  <CreateBase redirect="list">
    <div className="mt-2 flex lg:mr-72">
      <div className="flex-1">
        <Form defaultValues={{ status: "active" }}>
          <Card>
            <CardContent>
              <h2 className="text-lg font-semibold mb-4">Add Employee</h2>
              <EmployeeInputs />
              <FormToolbar />
            </CardContent>
          </Card>
        </Form>
      </div>
    </div>
  </CreateBase>
);
