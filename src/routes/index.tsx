import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useLocalStorage } from "usehooks-ts";
import { z } from "zod";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@/components/ui/field";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

const languageSchema = z.object({
	language: z.enum(["en", "es", "fr", "de", "zh", "ja"], {
		message: "Please select a language",
	}),
});

function RouteComponent() {
	const [lang, setLang] = useLocalStorage(
		"lang",
		{ language: "en" },
		{ initializeWithValue: false },
	);
	const navigate = useNavigate();
	const form = useForm({
		defaultValues: lang,
		validators: {
			onSubmit: languageSchema,
		},
		onSubmit: async ({ value }) => {
			setLang(value);
			navigate({ to: "/app" });
		},
	});

	const languages = [
		{ value: "en", label: "English" },
		{ value: "es", label: "Español" },
		{ value: "fr", label: "Français" },
		{ value: "de", label: "Deutsch" },
		{ value: "zh", label: "中文" },
		{ value: "ja", label: "日本語" },
	] as const;

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<div className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
				<Logo className="size-24" />
				<div className="space-y-3">
					<h1 className="text-5xl font-semibold tracking-tight lg:text-6xl">
						Speak the world's language. Instantly
					</h1>
					<p className="text-lg text-muted-foreground lg:text-xl">
						Welcome to chat.efobi.dev. Select your default language and click
						continue to get started
					</p>
				</div>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
					className="w-full max-w-md space-y-6"
				>
					<form.Field name="language">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field orientation={"responsive"} data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>
										Select your default language to continue
									</FieldLabel>
									<Select
										name={field.name}
										value={field.state.value}
										onValueChange={field.handleChange}
									>
										<SelectTrigger id={field.name} aria-invalid={isInvalid}>
											<SelectValue placeholder="English" />
										</SelectTrigger>
										<SelectContent position="item-aligned">
											{languages.map((lang) => (
												<SelectItem key={lang.value} value={lang.value}>
													{lang.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FieldDescription>
										For best results, select the language you're fluent with
									</FieldDescription>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>
					<Button
						className="w-full"
						size="lg"
						disabled={form.state.isSubmitting}
						variant={"secondary"}
					>
						{form.state.isSubmitting ? <Spinner /> : "Start chatting"}
					</Button>
				</form>
			</div>
		</div>
	);
}
