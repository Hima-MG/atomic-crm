import { CreateBase, Form } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { FormToolbar } from "../layout/FormToolbar";
import { DailyTaskInputs } from "./DailyTaskInputs";

const TODAY = new Date().toISOString().slice(0, 10);

export const DailyTaskCreate = () => (
  <CreateBase redirect="list">
    <div className="mt-2 flex lg:mr-72">
      <div className="flex-1">
        <Form defaultValues={{ status: "pending", submission_date: TODAY }}>
          <Card>
            <CardContent>
              <h2 className="text-lg font-semibold mb-1">Add Task Entry</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Log what you worked on. Add one entry per task. Total time is
                auto-calculated from start &amp; end times.
              </p>
              <DailyTaskInputs />
              <FormToolbar />
            </CardContent>
          </Card>
        </Form>
      </div>
    </div>
  </CreateBase>
);
