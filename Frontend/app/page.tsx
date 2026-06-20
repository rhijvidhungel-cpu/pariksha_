import LoginForm from "@/components/loginForm";

export default function Page() {
  return (
    <main
      className="relative min-h-screen overflow-hidden bg-cover bg-center"
      style={{
        backgroundImage: "url('/images/login-bg.jpeg')",
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <LoginForm />
      </div>
    </main>
  );
}