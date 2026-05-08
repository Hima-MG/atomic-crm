import { EditBase, Form, useEditContext } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { FormToolbar } from "../layout/FormToolbar";
import { DailyTaskInputs } from "./DailyTaskInputs";

const DailyTaskEditForm = () => {
  const { isPending } = useEditContext();
  if (isPending) return null;
  return (
    <Form>
      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold mb-4">Review Task Report</h2>
          <DailyTaskInputs isAdmin />
          <FormToolbar />
        </CardContent>
      </Card>
    </Form>
  );
};

export const DailyTaskEdit = () => (
  <EditBase redirect="list" mutationMode="pessimistic">
    <div className="mt-2 flex lg:mr-72">
      <div className="flex-1">
        <DailyTaskEditForm />
      </div>
    </div>
  </EditBase>
);
