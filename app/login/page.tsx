import { Suspense } from "react";
import LoginClient from "./LoginClient";
import { Navbar } from "@/components/Navbar";

function LoginPageContent({ error }: { error: string | null }) {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <LoginClient errorParam={error} />
      </Suspense>
    </main>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const error = searchParams.error as string | null;
  return <LoginPageContent error={error} />;
}