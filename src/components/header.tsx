import { useAuth0 } from "@auth0/auth0-react";
import { useConvexAuth } from "convex/react";
import { LogOut, Moon, Sun } from "lucide-react";
import { Logo } from "./logo";
import { NewChat } from "./new";
import { useTheme } from "./theme";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button, buttonVariants } from "./ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Spinner } from "./ui/spinner";

export function Header() {

	const { isAuthenticated, isLoading } = useConvexAuth();

	const { loginWithRedirect } = useAuth0();

	return (

		<header className="fixed top-0 flex items-center justify-between border-b bg-background px-4 py-2 w-full z-20">

			<Logo />

			<div className="flex items-center gap-2 ml-auto">

				<NewChat />

				{isLoading ? (

					<Spinner />

				) : isAuthenticated ? (

					<UserButton />

				) : (

					<Button

						variant={"secondary"}

						onClick={() => loginWithRedirect()}

					></Button>

				)

			}

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
				{/* <DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={() => navigate('/settings')}
				>
					<Cog />
					Account Settings
				</DropdownMenuItem> */}
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
