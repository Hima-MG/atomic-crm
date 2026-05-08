import { EditBase, Form, useEditContext } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { FormToolbar } from "../layout/FormToolbar";
import { StudentInputs } from "./StudentInputs";

const StudentEditForm = () => {
  const { isPending } = useEditContext();
  if (isPending) return null;
  return (
    <Form>
      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold mb-4">Edit Student Lead</h2>
          <StudentInputs />
          <FormToolbar />
        </CardContent>
      </Card>
    </Form>
  );
};

export const StudentEdit = () => (
  <EditBase redirect="list" mutationMode="pessimistic">
    <div className="mt-2 flex lg:mr-72">
      <div className="flex-1">
        <StudentEditForm />
      </div>
    </div>
  </EditBase>
);
