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
import { type Language, languages } from "@/lib/content";
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
	return (
		<div className="flex flex-col h-full max-w-5xl mx-auto w-full">
			<div className="border-b px-6 py-8">
				<div className="max-w-3xl">
					<h1 className="text-4xl font-bold tracking-tight">Settings</h1>
					<p className="text-muted-foreground mt-3 text-lg">
						Manage your account, billing, and preferences
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
							Account
						</TabsTrigger>
						<TabsTrigger
							value="billing"
							className="flex items-center gap-2 text-sm font-medium"
						>
							<CreditCard className="size-4" />
							Billing
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
	const me = useMe();
	const [newImage, setNewImage] = useState<File>();
	const [isUploading, setIsUploading] = useState(false);
	const getUploadUrl = useMutation(api.user.getUploadUrl);
	const updateUser = useMutation(api.user.updateUser);
	const handleUpload = async () => {
		if (!newImage) {
			toast.error("No image selected");
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
					toast.error("Avatar upload failed");
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
				toast.error("Failed to upload vatar");
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
				loading: "Updating profile...",
				success: "Profile updated!",
				error: "Failed to update profile",
			});
		},
	});

	return (
		<div className="space-y-8">
			<Card>
				<CardHeader>
					<CardTitle>Profile Picture</CardTitle>
					<CardDescription>
						Upload a photo to personalize your account
					</CardDescription>
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
								Upload Photo
							</Button>
						)}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Language Preference</CardTitle>
					<CardDescription>
						Choose your preferred language for the interface
					</CardDescription>
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
					<CardTitle>Account Settings</CardTitle>
					<CardDescription>
						Manage your personal information and privacy
					</CardDescription>
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
											Display Name
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
											Account Visibility
										</FieldLegend>
										<FieldDescription className="text-sm">
											Control who can add you to conversations
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
															Public
														</FieldTitle>
														<FieldDescription className="text-sm mt-1">
															Anyone can add you to new conversations
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
															Private
														</FieldTitle>
														<FieldDescription className="text-sm mt-1">
															You won't appear in search or be added to new
															chats
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
								Save Changes
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
	const { checkout } = useCustomer();
	return (
		<Card>
			<CardHeader>
				<CardTitle>Plan Details</CardTitle>
				<CardDescription>
					Information about your current subscription plan.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-2">
						<h3 className="font-semibold text-lg">{product.name}</h3>
						{product.name === "Free" && (
							<Button
								variant={"secondary"}
								onClick={async () => {
									await checkout({
										productId: "pro",
										dialog: CheckoutDialog,
									});
								}}
							>
								Upgrade
							</Button>
						)}
					</div>
					<Badge
						variant={product.status === "active" ? "default" : "destructive"}
						className="capitalize"
					>
						{product.status}
					</Badge>
				</div>
				{product.current_period_end && (
					<p className="text-sm text-muted-foreground mt-4">
						Renews on{" "}
						{new Date(product.current_period_end * 1000).toLocaleDateString()}
					</p>
				)}
				{product.trial_ends_at && (
					<p className="text-sm text-muted-foreground mt-4">
						Trial ends on{" "}
						{new Date(product.trial_ends_at * 1000).toLocaleDateString()}
					</p>
				)}
			</CardContent>
		</Card>
	);
}

function FeatureUsage({
	features,
}: {
	features: Record<string, CustomerFeature>;
}) {
	if (Object.keys(features).length === 0) {
		return null;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Feature Usage</CardTitle>
				<CardDescription>
					Your usage for the current billing period.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{Object.entries(features).map(([key, feature]) => (
					<div key={key}>
						<div className="flex justify-between items-center mb-1">
							<span className="text-sm font-medium">
								{feature.balance} messages left till{" "}
								{formatDateTime(feature.next_reset_at ?? new Date())}
							</span>
						</div>
						<div className="w-full bg-muted rounded-full h-2.5">
							<div
								className="bg-primary h-2.5 rounded-full"
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
					</div>
				))}
			</CardContent>
		</Card>
	);
}

function BillingInfo({ invoices }: { invoices?: CustomerInvoice[] }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Billing Information</CardTitle>
				<CardDescription>
					Manage your payment method and view your invoices.
				</CardDescription>
			</CardHeader>
			<CardContent></CardContent>
			{invoices && invoices.length > 0 && (
				<>
					<CardHeader>
						<CardTitle>Invoices</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="divide-y divide-border">
							{invoices.map((invoice) => (
								<li
									key={invoice.stripe_id}
									className="flex justify-between items-center py-3"
								>
									<div>
										<p className="font-medium">
											{new Date(invoice.created_at * 1000).toLocaleDateString()}
										</p>
										<p className="text-sm text-muted-foreground">
											{invoice.total / 100} {invoice.currency.toUpperCase()}
										</p>
									</div>
									<a
										href={invoice.hosted_invoice_url}
										target="_blank"
										rel="noopener noreferrer"
										className="text-sm font-medium text-primary hover:underline"
									>
										View PDF
									</a>
								</li>
							))}
						</ul>
					</CardContent>
				</>
			)}
		</Card>
	);
}
