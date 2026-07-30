import { Link } from "react-router-dom";
import { Icon } from "../atoms/Icon";

export function Breadcrumb({ to, trail }: { to: string; trail: string[] }) {
  return (
    <Link
      to={to}
      className="mb-6 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.1em] text-on-surface-variant hover:text-primary"
    >
      <Icon className="text-[18px]">arrow_back</Icon>
      {trail.join(" / ")}
    </Link>
  );
}
