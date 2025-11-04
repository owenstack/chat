import { Logo } from "./logo";
import { useAuth0 } from "@auth0/auth0-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useTheme } from "./theme";
import {
	DropdownMenu,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuContent,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	DropdownMenuGroup,
} from "./ui/dropdown-menu";
import { buttonVariants, Button } from "./ui/button";
import { useConvexAuth } from "convex/react";
import { Spinner } from "./ui/spinner";
import { Moon, Sun, LogOut } from "lucide-react";

export function Header() {
	const { isAuthenticated, isLoading } = useConvexAuth();
	const { loginWithRedirect } = useAuth0();
	return (
		<header className="fixed top-0 flex items-center justify-between border border-b px-4 py-2 w-full z-10">
			<Logo />
			<div className="ml-auto">
				{isLoading ? (
					<Spinner />
				) : isAuthenticated ? (
					<UserButton />
				) : (
					<Button
						variant={"secondary"}
						onClick={() => loginWithRedirect()}
					></Button>
				)}
			</div>
		</header>
	);
}

function UserButton() {
	const { user, logout } = useAuth0();
	const { setTheme } = useTheme();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				className={buttonVariants({ variant: "ghost", size: "icon-lg" })}
			>
				<UserAvatar />
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuLabel className="flex items-center gap-2 p-2">
					<UserAvatar className="size-8" />
					<div className="flex flex-col gap-0.5">
						<span className="font-medium">{user?.name}</span>
						<span className="text-xs text-muted-foreground">{user?.email}</span>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem onClick={() => setTheme("dark")}>
						<Moon />
						Dark
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => setTheme("light")}>
						<Sun />
						Light
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={() =>
						logout({ logoutParams: { returnTo: window.location.origin } })
					}
					variant="destructive"
				>
					<LogOut />
					Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function UserAvatar({ className }: { className?: string }) {
	const { user } = useAuth0();

	return (
		<Avatar className={className}>
			<AvatarImage src={user?.picture} alt={user?.name} />
			<AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
		</Avatar>
	);
}
