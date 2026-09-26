"use client";
import type { ComponentProps } from "react";
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
export function NavigationButton({
  onClick,
  ...props
}: ComponentProps<typeof SidebarMenuButton>) {
  const { setOpenMobile } = useSidebar();
  return (
    <SidebarMenuButton
      {...props}
      onClick={(event) => {
        onClick?.(event);
        setOpenMobile(false);
      }}
    />
  );
}
