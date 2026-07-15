import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const suspendedError =
    error === "suspended"
      ? "Il tuo account è stato bloccato da un amministratore. Contattalo per riattivarlo."
      : undefined;

  return <LoginForm suspendedError={suspendedError} />;
}
