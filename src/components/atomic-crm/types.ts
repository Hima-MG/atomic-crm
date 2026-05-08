import type { Identifier, RaRecord } from "ra-core";
import type { ComponentType } from "react";

import type {
  COMPANY_CREATED,
  CONTACT_CREATED,
  CONTACT_NOTE_CREATED,
  DEAL_CREATED,
  DEAL_NOTE_CREATED,
} from "./consts";

export type SignUpData = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
};

export type SalesFormData = {
  avatar?: string;
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  administrator: boolean;
  disabled: boolean;
};

export type Sale = {
  first_name: string;
  last_name: string;
  administrator: boolean;
  avatar?: RAFile;
  disabled?: boolean;
  user_id: string;

  /**
   * This is a copy of the user's email, to make it easier to handle by react admin
   * DO NOT UPDATE this field directly, it should be updated by the backend
   */
  email: string;

  /**
   * This is used by the fake rest provider to store the password
   * DO NOT USE this field in your code besides the fake rest provider
   * @deprecated
   */
  password?: string;
} & Pick<RaRecord, "id">;

export type Company = {
  name: string;
  logo: RAFile;
  sector: string;
  size: 1 | 10 | 50 | 250 | 500;
  linkedin_url: string;
  website: string;
  phone_number: string;
  address: string;
  zipcode: string;
  city: string;
  state_abbr: string;
  sales_id?: Identifier;
  created_at: string;
  description: string;
  revenue: string;
  tax_identifier: string;
  country: string;
  context_links?: string[];
  nb_contacts?: number;
  nb_deals?: number;
} & Pick<RaRecord, "id">;

export type EmailAndType = {
  email: string;
  type: "Work" | "Home" | "Other";
};

export type PhoneNumberAndType = {
  number: string;
  type: "Work" | "Home" | "Other";
};

export type Contact = {
  first_name: string;
  last_name: string;
  title: string;
  company_id?: Identifier | null;
  email_jsonb: EmailAndType[];
  avatar?: Partial<RAFile>;
  linkedin_url?: string | null;
  first_seen: string;
  last_seen: string;
  has_newsletter: boolean;
  tags: number[];
  gender: string;
  sales_id?: Identifier;
  status: string;
  background: string;
  phone_jsonb: PhoneNumberAndType[];
  nb_tasks?: number;
  company_name?: string;
} & Pick<RaRecord, "id">;

export type ContactNote = {
  contact_id: Identifier;
  text: string;
  date: string;
  sales_id: Identifier;
  status: string;
  attachments?: AttachmentNote[];
} & Pick<RaRecord, "id">;

export type Deal = {
  name: string;
  company_id: Identifier;
  contact_ids: Identifier[];
  category: string;
  stage: string;
  description: string;
  amount: number;
  created_at: string;
  updated_at: string;
  archived_at?: string;
  expected_closing_date: string;
  sales_id: Identifier;
  index: number;
} & Pick<RaRecord, "id">;

export type DealNote = {
  deal_id: Identifier;
  text: string;
  date: string;
  sales_id: Identifier;
  attachments?: AttachmentNote[];

  // This is defined for compatibility with `ContactNote`
  status?: undefined;
} & Pick<RaRecord, "id">;

export type Tag = {
  id: number;
  name: string;
  color: string;
};

export type Task = {
  contact_id: Identifier;
  type: string;
  text: string;
  due_date: string;
  done_date?: string | null;
  sales_id?: Identifier;
} & Pick<RaRecord, "id">;

export type ActivityCompanyCreated = {
  type: typeof COMPANY_CREATED;
  company_id: Identifier;
  company: Company;
  sales_id: Identifier;
  date: string;
} & Pick<RaRecord, "id">;

export type ActivityContactCreated = {
  type: typeof CONTACT_CREATED;
  company_id: Identifier;
  sales_id?: Identifier;
  contact: Contact;
  date: string;
} & Pick<RaRecord, "id">;

export type ActivityContactNoteCreated = {
  type: typeof CONTACT_NOTE_CREATED;
  sales_id?: Identifier;
  contactNote: ContactNote;
  date: string;
} & Pick<RaRecord, "id">;

export type ActivityDealCreated = {
  type: typeof DEAL_CREATED;
  company_id: Identifier;
  sales_id?: Identifier;
  deal: Deal;
  date: string;
};

export type ActivityDealNoteCreated = {
  type: typeof DEAL_NOTE_CREATED;
  sales_id?: Identifier;
  dealNote: DealNote;
  date: string;
};

export type Activity = RaRecord &
  (
    | ActivityCompanyCreated
    | ActivityContactCreated
    | ActivityContactNoteCreated
    | ActivityDealCreated
    | ActivityDealNoteCreated
  );

export interface RAFile {
  src: string;
  title: string;
  path?: string;
  rawFile: File;
  type?: string;
}

export type AttachmentNote = RAFile;

export interface LabeledValue {
  value: string;
  label: string;
}

export type DealStage = LabeledValue;

export interface NoteStatus extends LabeledValue {
  color: string;
}

export interface ContactGender {
  value: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

// ============================================================
// Civilezy EMS Types
// ============================================================

export type StudentStage =
  | "new-lead"
  | "contacted"
  | "interested"
  | "follow-up"
  | "joined"
  | "closed";

export type Student = {
  full_name: string;
  phone?: string;
  email?: string;
  qualification?: string; // ITI | Diploma | BTech | Surveyor
  interested_course?: string;
  lead_source?: string;
  counselor_id?: Identifier | null;
  follow_up_date?: string | null;
  stage: StudentStage;
  notes?: string;
  index: number;
  created_at: string;
  updated_at: string;
} & Pick<RaRecord, "id">;

export type EmployeeStatus = "active" | "inactive";
export type EmployeeDepartment =
  | "Management"
  | "HR"
  | "IT Team"
  | "Digital Marketing Team"
  | "Content Creator Team"
  | "Accounts";

export type Employee = {
  name: string;
  department: EmployeeDepartment;
  role?: string;
  phone?: string;
  email?: string;
  joining_date?: string;
  salary?: number;
  status: EmployeeStatus;
  created_at: string;
  updated_at: string;
} & Pick<RaRecord, "id">;

export type AttendanceStatus = "present" | "absent" | "half-day" | "leave";

export type Attendance = {
  employee_id: Identifier;
  date: string;
  check_in?: string;
  check_out?: string;
  working_hours?: number;
  status: AttendanceStatus;
  created_at: string;
} & Pick<RaRecord, "id">;

export type LeaveType = "annual" | "sick" | "casual" | "other";
export type LeaveStatus = "pending" | "approved" | "rejected";

export type Leave = {
  employee_id: Identifier;
  leave_type: LeaveType;
  reason?: string;
  start_date: string;
  end_date: string;
  status: LeaveStatus;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
} & Pick<RaRecord, "id">;

export type DailyTaskStatus = "pending" | "under-review" | "completed";

export type DailyTask = {
  employee_id: Identifier;
  category: string;
  task_title: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  total_time?: number;
  submission_date: string;
  status: DailyTaskStatus;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
} & Pick<RaRecord, "id">;
