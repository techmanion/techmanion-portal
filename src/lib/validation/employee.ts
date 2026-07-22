import { z } from "zod";

/** Treat blank strings from form fields as "not provided". */
const emptyToUndef = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const optionalText = z.preprocess(emptyToUndef, z.string().trim().optional());
const optionalDate = z.preprocess(emptyToUndef, z.coerce.date().optional());

/**
 * Employee create/update input, parsed straight from FormData (all values
 * arrive as strings). Enum values mirror the Prisma schema. `startingSalary`
 * is a major-unit string used only on create (seeds a HIRE SalaryRevision).
 */
export const employeeSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  cnic: z.string().trim().min(1, "CNIC is required"),
  dateOfBirth: z.coerce.date({ error: "Date of birth is required" }),

  email: z.preprocess(emptyToUndef, z.email("Enter a valid email").optional()),
  phone: optionalText,
  address: optionalText,
  emergencyContactName: optionalText,
  emergencyContactPhone: optionalText,

  type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"], {
    error: "Employment type is required",
  }),
  designationId: z.string().min(1, "Designation is required"),
  departmentId: z.string().min(1, "Department is required"),

  joiningDate: z.coerce.date({ error: "Joining date is required" }),
  probationEndDate: optionalDate,
  confirmationDate: optionalDate,

  accessLog: optionalText,

  startingSalary: z.preprocess(
    emptyToUndef,
    z
      .string()
      .refine((v) => Number.isFinite(Number(v)) && Number(v) >= 0, {
        message: "Enter a valid amount",
      })
      .optional(),
  ),
  currency: z.preprocess(emptyToUndef, z.string().default("PKR")),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;
