import { z } from "zod";

const THAI_PHONE_RE = /^(0\d{9}|\+66\d{9})$/;

export const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export const patientSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(100),
    middleName: z.string().trim().max(100).optional(),
    lastName: z.string().trim().min(1, "Last name is required").max(100),

    dateOfBirth: z
      .string()
      .min(1, "Date of birth is required")
      .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date")
      .refine((v) => {
        const d = new Date(v);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return d.getTime() <= today.getTime();
      }, "Date of birth cannot be in the future"),

    gender: z.enum(["male", "female", "other", "prefer_not_to_say"], {
      errorMap: () => ({ message: "Please select a gender" }),
    }),

    phone: z
      .string()
      .trim()
      .min(1, "Phone number is required")
      .refine(
        (v) => THAI_PHONE_RE.test(v.replace(/[\s-]/g, "")),
        "Enter a valid Thai phone (e.g. 0812345678 or +66812345678)",
      ),

    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Enter a valid email address"),

    address: z.string().trim().min(1, "Address is required").max(500),

    preferredLanguage: z
      .string()
      .trim()
      .min(1, "Preferred language is required")
      .max(100),
    nationality: z.string().trim().min(1, "Nationality is required").max(100),

    emergencyContactName: z.string().trim().max(100).optional(),
    emergencyContactRelationship: z.string().trim().max(100).optional(),

    religion: z.string().trim().max(100).optional(),
  })
  .superRefine((val, ctx) => {
    const hasName = !!val.emergencyContactName?.trim();
    const hasRel = !!val.emergencyContactRelationship?.trim();
    if (hasName && !hasRel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["emergencyContactRelationship"],
        message: "Add the relationship for this contact",
      });
    }
    if (hasRel && !hasName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["emergencyContactName"],
        message: "Add the contact's name",
      });
    }
  });

export type PatientFormValues = z.infer<typeof patientSchema>;

export type FieldType = "text" | "date" | "select" | "tel" | "email" | "textarea";
export type FieldSection = "identity" | "contact" | "background" | "emergency";

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

export interface FieldConfig {
  readonly name: keyof PatientFormValues;
  readonly label: string;
  readonly type: FieldType;
  readonly section: FieldSection;
  readonly required: boolean;
  readonly placeholder?: string;
  readonly autoComplete?: string;
  readonly options?: readonly SelectOption[];
  readonly fullWidth?: boolean;
}

export interface SectionConfig {
  readonly id: FieldSection;
  readonly title: string;
  readonly description?: string;
}

export const PATIENT_SECTIONS: readonly SectionConfig[] = [
  { id: "identity", title: "Identity" },
  { id: "contact", title: "Contact" },
  { id: "background", title: "Background" },
  { id: "emergency", title: "Emergency Contact", description: "Optional" },
] as const;

export const PATIENT_FIELDS: readonly FieldConfig[] = [
  {
    name: "firstName",
    label: "First name",
    type: "text",
    section: "identity",
    required: true,
    autoComplete: "given-name",
  },
  {
    name: "middleName",
    label: "Middle name",
    type: "text",
    section: "identity",
    required: false,
    autoComplete: "additional-name",
  },
  {
    name: "lastName",
    label: "Last name",
    type: "text",
    section: "identity",
    required: true,
    autoComplete: "family-name",
  },
  {
    name: "dateOfBirth",
    label: "Date of birth",
    type: "date",
    section: "identity",
    required: true,
    autoComplete: "bday",
  },
  {
    name: "gender",
    label: "Gender",
    type: "select",
    section: "identity",
    required: true,
    options: GENDER_OPTIONS,
  },
  {
    name: "phone",
    label: "Phone",
    type: "tel",
    section: "contact",
    required: true,
    placeholder: "0812345678",
    autoComplete: "tel",
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    section: "contact",
    required: true,
    placeholder: "name@example.com",
    autoComplete: "email",
  },
  {
    name: "address",
    label: "Address",
    type: "textarea",
    section: "contact",
    required: true,
    fullWidth: true,
    autoComplete: "street-address",
  },
  {
    name: "preferredLanguage",
    label: "Preferred language",
    type: "text",
    section: "background",
    required: true,
    placeholder: "e.g. Thai, English",
    autoComplete: "language",
  },
  {
    name: "nationality",
    label: "Nationality",
    type: "text",
    section: "background",
    required: true,
    placeholder: "e.g. Thai",
    autoComplete: "country-name",
  },
  {
    name: "religion",
    label: "Religion",
    type: "text",
    section: "background",
    required: false,
  },
  {
    name: "emergencyContactName",
    label: "Contact name",
    type: "text",
    section: "emergency",
    required: false,
    autoComplete: "name",
  },
  {
    name: "emergencyContactRelationship",
    label: "Relationship",
    type: "text",
    section: "emergency",
    required: false,
    placeholder: "e.g. Spouse, Parent",
  },
] as const;

export const PATIENT_FIELD_NAMES = PATIENT_FIELDS.map((f) => f.name);

export const EMPTY_PATIENT_VALUES: Record<keyof PatientFormValues, string> =
  PATIENT_FIELDS.reduce(
    (acc, f) => {
      acc[f.name] = "";
      return acc;
    },
    {} as Record<keyof PatientFormValues, string>,
  );
