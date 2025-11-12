import * as Sentry from "@sentry/tanstackstart-react";
import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import type {
	CustomerFeature,
	CustomerInvoice,
	CustomerProduct,
} from "autumn-js";
import { useCustomer } from "autumn-js/react";
import { useMutation } from "convex/react";
import { CreditCard, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocalStorage } from "usehooks-ts";
import { z } from "zod";
import CheckoutDialog from "@/components/autumn/checkout-dialog";
import AvatarUpload from "@/components/file-upload/avatar-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldLabel,
	FieldLegend,
	FieldSet,
	FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Language, languages, useTranslations } from "@/lib/content";
import { formatDateTime } from "@/lib/helpers";
import { useMe } from "@/lib/hooks";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export const Route = createFileRoute("/app/settings")({
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
	component: RouteComponent,
});

function RouteComponent() {
	const t = useTranslations();

	return (
		<div className="flex flex-col h-full max-w-5xl mx-auto w-full">
			<div className="border-b px-6 py-8">
				<div className="max-w-3xl">
					<h1 className="text-4xl font-bold tracking-tight">
						{t.settings.title}
					</h1>
					<p className="text-muted-foreground mt-3 text-lg">
						{t.settings.subtitle}
					</p>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto px-6 py-8">
				<Tabs defaultValue="account" className="w-full max-w-3xl">
					<TabsList className="grid w-full grid-cols-2 h-11">
						<TabsTrigger
							value="account"
							className="flex items-center gap-2 text-sm font-medium"
						>
							<Settings className="size-4" />
							{t.settings.accountTab}
						</TabsTrigger>
						<TabsTrigger
							value="billing"
							className="flex items-center gap-2 text-sm font-medium"
						>
							<CreditCard className="size-4" />
							{t.settings.billingTab}
						</TabsTrigger>
					</TabsList>
					<TabsContent value="account" className="space-y-6 mt-8">
						<AccountTab />
					</TabsContent>
					<TabsContent value="billing" className="space-y-6 mt-8">
						<BillingTab />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}

function AccountTab() {
	const t = useTranslations();
	const me = useMe();
	const [newImage, setNewImage] = useState<File>();
	const [isUploading, setIsUploading] = useState(false);
	const getUploadUrl = useMutation(api.user.getUploadUrl);
	const updateUser = useMutation(api.user.updateUser);
	const handleUpload = async () => {
		if (!newImage) {
			toast.error(t.settings.noImageSelected);
			return;
		}
		toast.promise(async () => {
			setIsUploading(true);
			try {
				const postUrl = await getUploadUrl();
				const res = await fetch(postUrl, {
					method: "POST",
					headers: {
						"Content-Type": newImage.type,
					},
					body: newImage,
				});
				if (!res.ok) {
					toast.error(t.settings.avatarUploadFailed);
					Sentry.captureException({ uploadFailed: res.json() });
					return;
				}
				const { storageId } = (await res.json()) as {
					storageId: Id<"_storage">;
				};
				await updateUser({
					body: { avatar: storageId },
				});
			} catch (error) {
				toast.error(t.settings.avatarUploadError);
				Sentry.captureException(error);
			} finally {
				setNewImage(undefined);
				setIsUploading(false);
			}
		});
	};

	const [lang, setLang] = useLocalStorage<{ language: Language }>(
		"lang",
		{ language: "en" },
		{ initializeWithValue: true },
	);

	const formSchema = z.object({
		name: z
			.string()
			.min(2, "Name must be at least 2 characters")
			.max(50, "Name must be at most 50 characters"),
		accountType: z.enum(["private", "public"]),
	});

	const form = useForm({
		defaultValues: {
			name: me?.name ?? "",
			accountType: me?.accountType ?? "public",
		},
		validators: {
			onSubmit: formSchema,
		},
		onSubmit: async ({ value }) => {
			toast.promise(updateUser({ body: value }), {
				loading: t.settings.updatingProfile,
				success: t.settings.profileUpdated,
				error: t.settings.updateFailed,
			});
		},
	});

	return (
		<div className="space-y-8">
			<Card>
				<CardHeader>
					<CardTitle>{t.settings.profilePicture}</CardTitle>
					<CardDescription>{t.settings.uploadPhoto}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col sm:flex-row items-center gap-6">
						<AvatarUpload
							defaultAvatar={me?.avatar ?? ""}
							onFileChange={(file) => {
								const image = file?.file as File;
								setNewImage(image);
							}}
						/>
						{newImage && (
							<Button
								onClick={handleUpload}
								disabled={isUploading}
								type="button"
								size="lg"
							>
								{isUploading ? <Spinner className="size-4 mr-2" /> : null}
								{t.settings.uploadButton}
							</Button>
						)}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t.settings.languagePreference}</CardTitle>
					<CardDescription>{t.settings.languageDescription}</CardDescription>
				</CardHeader>
				<CardContent>
					<RadioGroup
						name="language"
						value={lang.language}
						onValueChange={(value) => setLang({ language: value as Language })}
						className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
					>
						{languages.map((language) => (
							<FieldLabel key={language.value} htmlFor={language.value}>
								<Field orientation={"horizontal"}>
									<FieldContent>
										<FieldTitle className="text-base">
											{language.flag} {language.label}
										</FieldTitle>
									</FieldContent>
									<RadioGroupItem value={language.value} id={language.value} />
								</Field>
							</FieldLabel>
						))}
					</RadioGroup>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t.settings.accountSettings}</CardTitle>
					<CardDescription>{t.settings.accountSettingsDesc}</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
						className="space-y-6"
					>
						<form.Field name="name">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field orientation={"vertical"} data-invalid={isInvalid}>
										<FieldLabel
											htmlFor={field.name}
											className="text-base font-semibold"
										>
											{t.settings.displayName}
										</FieldLabel>
										<Input
											aria-invalid={isInvalid}
											name={field.name}
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											autoComplete="name"
											className="max-w-md"
										/>
										<FieldDescription>
											Your full name as it appears to other users
										</FieldDescription>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>

						<form.Field name="accountType">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<FieldSet className="space-y-4">
										<FieldLegend className="text-base font-semibold">
											{t.settings.privacy}
										</FieldLegend>
										<FieldDescription className="text-sm">
											{t.settings.privacyDescription}
										</FieldDescription>
										<RadioGroup
											name={field.name}
											value={field.state.value}
											onValueChange={(value) =>
												field.handleChange(value as "private" | "public")
											}
											className="space-y-3"
										>
											<FieldLabel htmlFor="public">
												<Field
													orientation={"horizontal"}
													data-invalid={isInvalid}
												>
													<FieldContent className="flex-1">
														<FieldTitle className="text-base font-medium">
															{t.settings.publicAccount}
														</FieldTitle>
														<FieldDescription className="text-sm mt-1">
															{t.settings.publicDescription}
														</FieldDescription>
													</FieldContent>
													<RadioGroupItem
														value="public"
														id="public"
														aria-invalid={isInvalid}
													/>
												</Field>
											</FieldLabel>
											<FieldLabel htmlFor="private">
												<Field
													orientation={"horizontal"}
													data-invalid={isInvalid}
												>
													<FieldContent className="flex-1">
														<FieldTitle className="text-base font-medium">
															{t.settings.privateAccount}
														</FieldTitle>
														<FieldDescription className="text-sm mt-1">
															{t.settings.privateDescription}
														</FieldDescription>
													</FieldContent>
													<RadioGroupItem
														value="private"
														id="private"
														aria-invalid={isInvalid}
													/>
												</Field>
											</FieldLabel>
										</RadioGroup>
									</FieldSet>
								);
							}}
						</form.Field>

						<div className="flex justify-end pt-4">
							<Button
								type="submit"
								size="lg"
								disabled={form.state.isSubmitting}
								className="min-w-32"
							>
								{form.state.isSubmitting ? (
									<Spinner className="size-4 mr-2" />
								) : null}
								{t.settings.saveChanges}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

function BillingTab() {
	const { customer, isLoading } = useCustomer();

	if (isLoading || !customer) {
		return (
			<div className="flex items-center justify-center h-full">
				<Spinner />
			</div>
		);
	}

	const { products, features, invoices } = customer;
	const currentProduct = products.find((p) => p.is_default) || products[0];

	return (
		<div className="space-y-8">
			<PlanDetails product={currentProduct} />
			<FeatureUsage features={features} />
			<BillingInfo invoices={invoices} />
		</div>
	);
}

function PlanDetails({ product }: { product: CustomerProduct }) {
	const t = useTranslations();
	const { checkout } = useCustomer();
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-2xl">{t.settings.planDetails}</CardTitle>
				<CardDescription>{t.settings.planDetailsDesc}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="flex items-start justify-between">
					<div className="space-y-1">
						<div className="flex items-center gap-3">
							<h3 className="font-semibold text-2xl tracking-tight">
								{product.name}
							</h3>
							<Badge
								variant={
									product.status === "active" ? "default" : "destructive"
								}
								className="capitalize"
							>
								{product.status}
							</Badge>
						</div>
						{product.current_period_end && (
							<p className="text-sm text-muted-foreground">
								{t.settings.renewsOn}{" "}
								<span className="font-medium text-foreground">
									{new Date(
										product.current_period_end * 1000,
									).toLocaleDateString()}
								</span>
							</p>
						)}
						{product.trial_ends_at && (
							<p className="text-sm text-muted-foreground">
								{t.settings.trialEndsOn}{" "}
								<span className="font-medium text-foreground">
									{new Date(product.trial_ends_at * 1000).toLocaleDateString()}
								</span>
							</p>
						)}
					</div>
					{product.name === "Free" && (
						<Button
							size="lg"
							onClick={async () => {
								await checkout({
									productId: "pro",
									dialog: CheckoutDialog,
								});
							}}
						>
							{t.settings.upgradePlan}
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

function FeatureUsage({
	features,
}: {
	features: Record<string, CustomerFeature>;
}) {
	const t = useTranslations();

	if (Object.keys(features).length === 0) {
		return null;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-2xl">{t.settings.featureUsage}</CardTitle>
				<CardDescription>{t.settings.featureUsageDesc}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{Object.entries(features).map(([key, feature]) => (
					<div key={key} className="space-y-3">
						<div className="flex justify-between items-baseline">
							<span className="text-sm font-semibold tracking-tight">
								{t.settings.messagesFeature}
							</span>
							<span className="text-sm text-muted-foreground">
								<span className="font-medium text-foreground">
									{feature.balance?.toLocaleString()}
								</span>{" "}
								{t.settings.remaining}
							</span>
						</div>
						<div className="w-full bg-muted rounded-full h-3 overflow-hidden">
							<div
								className="bg-primary h-3 rounded-full transition-all duration-300"
								style={{
									width: `${
										feature?.usage_limit != null &&
										feature.usage_limit > 0 &&
										feature?.balance != null
											? (feature.balance / feature.usage_limit) * 100
											: 0
									}%`,
								}}
							/>
						</div>
						<p className="text-xs text-muted-foreground">
							{t.settings.resetsOn}{" "}
							<span className="font-medium text-foreground">
								{formatDateTime(feature.next_reset_at ?? new Date())}
							</span>
						</p>
					</div>
				))}
			</CardContent>
		</Card>
	);
}

function BillingInfo({ invoices }: { invoices?: CustomerInvoice[] }) {
	const t = useTranslations();

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-2xl">{t.settings.billingInfo}</CardTitle>
				<CardDescription>{t.settings.billingInfoDesc}</CardDescription>
			</CardHeader>
			<CardContent>
				{!invoices || invoices.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						{t.settings.noInvoices}
					</p>
				) : (
					<div className="space-y-4">
						<h3 className="text-lg font-semibold">
							{t.settings.recentInvoices}
						</h3>
						<div className="divide-y divide-border rounded-lg border">
							{invoices.map((invoice) => (
								<div
									key={invoice.stripe_id}
									className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
								>
									<div className="space-y-1">
										<p className="font-medium">
											{new Date(invoice.created_at * 1000).toLocaleDateString(
												"en-US",
												{
													year: "numeric",
													month: "long",
													day: "numeric",
												},
											)}
										</p>
										<p className="text-sm text-muted-foreground">
											${(invoice.total / 100).toFixed(2)}{" "}
											{invoice.currency.toUpperCase()}
										</p>
									</div>
									<a
										href={invoice.hosted_invoice_url}
										target="_blank"
										rel="noopener noreferrer"
										className="text-sm font-medium text-primary hover:underline"
									>
										{t.settings.viewInvoice}
									</a>
								</div>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
