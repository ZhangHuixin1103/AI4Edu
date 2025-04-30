import type { ComponentProps } from 'react';

import { Button } from '@/components/ui/button';
import { type SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { MenuIcon } from '@/components/icons';

export function SidebarToggle({
  className,
}: ComponentProps<typeof SidebarTrigger>) {
  const { toggleSidebar } = useSidebar();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          data-testid="sidebar-toggle-button"
          onClick={toggleSidebar}
          variant="outline"
          className="md:px-2 md:h-fit"
        >
          <MenuIcon size={16} />
        </Button>
      </TooltipTrigger>
      <TooltipContent align="start">Sidebar</TooltipContent>
    </Tooltip>
  );
}
