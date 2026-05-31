import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  label: string;
  onClick?: () => void;
  variant?: "desktop" | "mobile";
}

const NAV_LINK_BASE =
  "relative inline-block hover:translate-y-[-1px] active:translate-y-[0px] transition-transform duration-200" +
  " after:absolute after:left-0 after:h-[2px] after:w-full after:bg-[#2f6f78] after:scale-x-0 after:origin-left after:transition-transform after:duration-200" +
  " hover:after:scale-x-100 focus-visible:translate-y-[-1px] focus-visible:after:scale-x-100 focus-visible:outline-none";

export function NavLink({ href, label, onClick, variant = "desktop" }: NavLinkProps) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        NAV_LINK_BASE,
        variant === "desktop" ? "after:bottom-[-4px]" : "py-2 after:bottom-1",
      )}
    >
      {label}
    </a>
  );
}
