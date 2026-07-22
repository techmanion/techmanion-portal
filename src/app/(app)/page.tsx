import { redirect } from "next/navigation";

// v1 home is the employee directory (decisions.md D6).
export default function HomePage() {
  redirect("/employees");
}
