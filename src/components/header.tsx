import { useAuth0 } from "@auth0/auth0-react";
import { useConvexAuth } from "convex/react";
import { LogOut, Moon, Sun } from "lucide-react";
import { useLocalStorage } from "usehooks-ts";
import { type Language, languages, useTranslations } from "@/lib/content";
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
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
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
				)}
			</div>
		</header>
	);
}

function UserButton() {
	const t = useTranslations();
	const { user, logout } = useAuth0();
	const { setTheme } = useTheme();
	const [lang, setLang] = useLocalStorage<{ language: Language }>(
		"lang",
		{ language: "en" },
		{ initializeWithValue: true },
	);

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
						{t.common.dark}
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => setTheme("light")}>
						<Sun />
						{t.common.light}
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
				<DropdownMenuSub>
					<DropdownMenuSubTrigger>
						{languages.find((l) => l.value === lang.language)?.label}
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent>
						<DropdownMenuRadioGroup
							value={lang.language}
							onValueChange={(e) => setLang({ language: e as Language })}
						>
							{languages.map((language) => (
								<DropdownMenuRadioItem
									key={language.value}
									value={language.value}
								>
									{language.label}
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
					</DropdownMenuSubContent>
				</DropdownMenuSub>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={() =>
						logout({ logoutParams: { returnTo: window.location.origin } })
					}
					variant="destructive"
				>
					<LogOut />
					{t.common.signOut}
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
