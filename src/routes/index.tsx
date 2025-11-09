import * as Sentry from "@sentry/tanstackstart-react";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
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
import { type Language, languages, useTranslations } from "@/lib/content";

export const Route = createFileRoute("/")({
	component: RouteComponent,
	errorComponent: ({ error }) => {
		useEffect(() => {
			Sentry.captureException(error);
		}, [error]);

		return (
			<div className="flex flex-col items-center justify-center min-h-screen p-4">
				<div className="max-w-md text-center">
					<h1 className="text-2xl font-semibold mb-4">Something went wrong</h1>
					<p className="text-muted-foreground mb-4">
						We've been notified and are looking into it.
					</p>
					<Button onClick={() => window.location.reload()}>Reload page</Button>
				</div>
			</div>
		);
	},
});

const languageSchema = z.object({
	language: z.enum(["en", "es", "fr", "de", "zh", "ja"], {
		message: "Please select a language",
	}),
});

function RouteComponent() {
	const [lang, setLang] = useLocalStorage<{ language: Language }>(
		"lang",
		{ language: "en" },
		{ initializeWithValue: true },
	);
	const navigate = useNavigate();
	const t = useTranslations();
	const form = useForm({
		defaultValues: lang,
		validators: {
			onSubmit: languageSchema,
		},
		onSubmit: async () => {
			navigate({ to: "/app" });
		},
	});

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<div className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
				<Logo className="size-24" />
				<div className="space-y-3">
					<h1 className="text-5xl font-semibold tracking-tight lg:text-6xl">
						{t.index.title}
					</h1>
					<p className="text-lg text-muted-foreground lg:text-xl">
						{t.index.description}
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
										{t.index.chooseLanguage}
									</FieldLabel>
									<Select
										name={field.name}
										value={field.state.value}
										onValueChange={(e) => {
											setLang({ language: e as Language });
											field.handleChange(e as Language);
										}}
									>
										<SelectTrigger id={field.name} aria-invalid={isInvalid}>
											<SelectValue placeholder={t.index.english} />
										</SelectTrigger>
										<SelectContent position="item-aligned">
											{languages.map((lang) => (
												<SelectItem key={lang.value} value={lang.value}>
													{lang.label} {lang.flag}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FieldDescription>
										{t.index.languageDescription}
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
						{form.state.isSubmitting ? <Spinner /> : t.index.getStarted}
					</Button>
				</form>
			</div>
		</div>
	);
}
