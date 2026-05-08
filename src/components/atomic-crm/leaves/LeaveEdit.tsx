import { EditBase, Form, useEditContext } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { FormToolbar } from "../layout/FormToolbar";
import { LeaveInputs } from "./LeaveInputs";

const LeaveEditForm = () => {
  const { isPending } = useEditContext();
  if (isPending) return null;
  return (
    <Form>
      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold mb-4">Review Leave Request</h2>
          <LeaveInputs isAdmin />
          <FormToolbar />
        </CardContent>
      </Card>
    </Form>
  );
};

export const LeaveEdit = () => (
  <EditBase redirect="list" mutationMode="pessimistic">
    <div className="mt-2 flex lg:mr-72">
      <div className="flex-1">
        <LeaveEditForm />
      </div>
    </div>
  </EditBase>
);
