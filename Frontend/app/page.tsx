import LoginForm from "@/components/loginForm";

export default function Page() {
  return (
    <main
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundImage: "url('/images/login-bg.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Backdrop overlay */}
      <div 
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          zIndex: 0
        }} 
      />
      
      {/* BULLETPROOF POSITIONING OVERRIDE */}
      <div
        style={{
          position: "absolute",
          right: "10%",           /* Pushes it 10% away from the right screen edge */
          top: "50%",            /* Centers it vertically */
          transform: "translateY(-50%)", /* Perfect alignment tweak */
          zIndex: 10,
          width: "100%",
          maxWidth: "450px",     /* Keeps the card standard size */
          padding: "0 20px",
        }}
      >
        <LoginForm />
      </div>
    </main>
  );
}