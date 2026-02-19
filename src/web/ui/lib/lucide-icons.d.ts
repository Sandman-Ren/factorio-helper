// Type declarations for lucide-react direct icon imports (avoid barrel file)
// Each icon module default-exports a React component with LucideProps.
declare module "lucide-react/dist/esm/icons/*" {
  import type { LucideIcon } from "lucide-react";
  const icon: LucideIcon;
  export default icon;
}
