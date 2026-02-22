import Link from "next/link";
import type { User } from "next-auth";
import { signOut } from "next-auth/react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./common/dropdown-menu";

import { UserAvatar } from "../Components/user-avatar";

interface UserAccountNavProps extends React.HTMLAttributes<HTMLDivElement> {
  user: Pick<User, "name" | "image" | "email">;
}

export function UserAccountNav({
  user,
}: UserAccountNavProps) {
  return (
    <a href="/profile">
      <UserAvatar
        user={{ name: user.name ?? null, image: user.image ?? null }}
        className="w-8 h-8"
      />
    </a>
  )
}
