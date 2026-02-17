import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";
import MotionButton from "../../components/MotionButton.jsx";
import signinPhoto from "../../assets/picture2.webp";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const routeUserFromSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (session?.user) {
        const role = session.user.user_metadata?.role ?? "customer";
        navigate(role === "admin" ? "/admin" : "/dashboard", { replace: true });
      }
    };

    routeUserFromSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          const role = session.user.user_metadata?.role ?? "customer";
          navigate(role === "admin" ? "/admin" : "/dashboard", {
            replace: true,
          });
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email,
        password,
      },
    );

    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    const role = data?.user?.user_metadata?.role ?? "customer";
    setLoading(false);
    navigate(role === "admin" ? "/admin" : "/dashboard");
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);
    const redirectTo = `${window.location.origin}/login`;
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (googleError) {
      setGoogleLoading(false);
      setError(googleError.message);
    }
  };

  return (
    <section className="border border-[var(--ink)] bg-[#efefef]">
      <div className="grid min-h-[70vh] lg:grid-cols-[1fr_1.08fr]">
        <div className="border-b border-[var(--ink)] px-6 py-8 md:px-10 md:py-10 lg:border-b-0 lg:border-r lg:px-14 lg:py-14">
          <p className="text-[11px] font-black uppercase tracking-[0.32em] text-[var(--ink)]/65">
            Account
          </p>
          <h1 className="mt-3 text-4xl font-black uppercase leading-none md:text-5xl">
            Sign in
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--ink)]/75">
            Enter your account credentials to continue your beauty routine.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 max-w-xl space-y-5">
            <label className="block text-sm">
              <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-[var(--ink)]/75">
                Email address
              </span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full border border-[var(--ink)] bg-transparent px-4 py-3 text-sm outline-none"
                placeholder="Enter your email address"
                type="email"
                required
              />
            </label>

            <label className="block text-sm">
              <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-[var(--ink)]/75">
                Password
              </span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full border border-[var(--ink)] bg-transparent px-4 py-3 text-sm outline-none"
                placeholder="Enter your password"
                type="password"
                required
              />
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <MotionButton
              disabled={loading}
              className="mt-1 w-full border border-[var(--ink)] bg-black px-6 py-3 text-3xl font-black uppercase tracking-[0.08em] text-white disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Submit"}
            </MotionButton>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full border border-[var(--ink)] bg-white px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-[var(--ink)] disabled:opacity-60"
            >
              {googleLoading
                ? "Redirecting to Google..."
                : "Continue with Google"}
            </button>

            <Link
              to="/signup"
              className="block text-center text-[11px] font-black uppercase tracking-[0.2em] text-[var(--ink)]/70 transition hover:text-[var(--ink)]"
            >
              New here? Create an account
            </Link>
          </form>
        </div>

        <div className="hidden lg:block">
          <img
            src={signinPhoto}
            alt="Veloure beauty sign in visual"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}

export default Login;
