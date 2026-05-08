import { useListContext } from "ra-core";
import { CreateButton } from "@/components/admin/create-button";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { SearchInput } from "@/components/admin/search-input";
import { SelectInput } from "@/components/admin/select-input";
import { FilterButton } from "@/components/admin/filter-form";
import { TopToolbar } from "../layout/TopToolbar";
import { StudentKanban } from "./StudentKanban";
import { STAGE_CHOICES, QUALIFICATION_CHOICES } from "./StudentInputs";

const filters = [
  <SearchInput source="q" alwaysOn />,
  <SelectInput
    source="stage"
    label="Stage"
    choices={STAGE_CHOICES}
    emptyText="All Stages"
    alwaysOn
  />,
  <SelectInput
    source="qualification"
    label="Qualification"
    choices={QUALIFICATION_CHOICES}
    emptyText="All"
  />,
];

const StudentListActions = () => (
  <TopToolbar>
    <FilterButton />
    <ExportButton />
    <CreateButton label="Add Lead" />
  </TopToolbar>
);

const StudentListContent = () => {
  const { data, isPending, filterValues } = useListContext();
  const hasFilters = filterValues && Object.keys(filterValues).length > 0;
  if (isPending) return null;
  if (!data?.length && !hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-2">
        <p className="text-lg font-medium">No student leads yet</p>
        <p className="text-sm">Click "Add Lead" to get started.</p>
      </div>
    );
  }
  return <StudentKanban />;
};

export const StudentList = () => (
  <List
    perPage={200}
    sort={{ field: "index", order: "ASC" }}
    filters={filters}
    actions={<StudentListActions />}
    pagination={null}
    title="Student Leads"
  >
    <StudentListContent />
  </List>
);
