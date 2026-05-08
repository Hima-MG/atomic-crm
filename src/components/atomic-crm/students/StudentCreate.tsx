import { CreateBase, Form, useGetIdentity } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { FormToolbar } from "../layout/FormToolbar";
import { StudentInputs } from "./StudentInputs";

export const StudentCreate = () => {
  const { identity } = useGetIdentity();
  if (!identity) return null;

  return (
    <CreateBase redirect="list">
      <div className="mt-2 flex lg:mr-72">
        <div className="flex-1">
          <Form defaultValues={{ stage: "new-lead", index: 0 }}>
            <Card>
              <CardContent>
                <h2 className="text-lg font-semibold mb-4">Add Student Lead</h2>
                <StudentInputs />
                <FormToolbar />
              </CardContent>
            </Card>
          </Form>
        </div>
      </div>
    </CreateBase>
  );
};
