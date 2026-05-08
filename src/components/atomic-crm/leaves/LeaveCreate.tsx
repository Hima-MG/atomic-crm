import { CreateBase, Form } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { FormToolbar } from "../layout/FormToolbar";
import { LeaveInputs } from "./LeaveInputs";

export const LeaveCreate = () => (
  <CreateBase redirect="list">
    <div className="mt-2 flex lg:mr-72">
      <div className="flex-1">
        <Form defaultValues={{ status: "pending" }}>
          <Card>
            <CardContent>
              <h2 className="text-lg font-semibold mb-4">Apply for Leave</h2>
              <LeaveInputs />
              <FormToolbar />
            </CardContent>
          </Card>
        </Form>
      </div>
    </div>
  </CreateBase>
);
