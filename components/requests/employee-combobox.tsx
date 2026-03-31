"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { searchUsers } from "@/lib/actions/user";

interface EmployeeOption {
  id: string;
  name: string;
  lastname: string;
  email: string;
  department: {
    name: string;
  } | null;
}

export function EmployeeCombobox({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedUser, setSelectedUser] = useState<EmployeeOption | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await searchUsers({
        query: search,
        selectedUserId: value,
      });

      if (!isMounted) {
        return;
      }

      if (res.success && res.data) {
        setUsers(res.data.items);
        setNextCursor(res.data.nextCursor);

        if (res.data.selectedUser) {
          setSelectedUser(res.data.selectedUser);
        } else if (!value) {
          setSelectedUser(null);
        }
      }

      setLoading(false);
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [search, value]);

  async function loadMore() {
    if (!nextCursor || loadingMore) {
      return;
    }

    setLoadingMore(true);
    const res = await searchUsers({
      query: search,
      cursor: nextCursor,
    });

    if (res.success && res.data) {
      const data = res.data;
      setUsers((current) => {
        const existingIds = new Set(current.map((user) => user.id));
        const appended = data.items.filter((user) => !existingIds.has(user.id));
        return [...current, ...appended];
      });
      setNextCursor(data.nextCursor);
    }

    setLoadingMore(false);
  }

  const selectedLabel = selectedUser
    ? `${selectedUser.name} ${selectedUser.lastname}`
    : "Select employee...";

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    const container = listRef.current;
    if (!container) {
      return;
    }

    const canScroll = container.scrollHeight > container.clientHeight;
    if (!canScroll) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    container.scrollTop += event.deltaY;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search employee by name/email..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList
            ref={listRef}
            onWheelCapture={handleWheel}
          >
            <CommandEmpty>
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                "No employee found."
              )}
            </CommandEmpty>
            <CommandGroup>
              {!loading && users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.id}
                  onSelect={() => {
                    setSelectedUser(user);
                    onChange(user.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === user.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{user.name} {user.lastname}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.email} {user.department ? ` - ${user.department.name}` : ""}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {nextCursor && !loading && (
              <div className="border-t p-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-center"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load more"}
                </Button>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
