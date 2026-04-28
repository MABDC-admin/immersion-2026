import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

async function getFunctionErrorMessage(error: any, fallback: string) {
  const response = error?.context;

  if (response instanceof Response) {
    const text = await response.text();

    try {
      const parsed = JSON.parse(text);
      return parsed?.error || parsed?.message || fallback;
    } catch {
      return text || fallback;
    }
  }

  return error?.message || fallback;
}

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [companyName, setCompanyName] = useState("Immersion HRMS");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user && !isLoading) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    supabase
      .from("company_settings")
      .select("name, logo_url")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.name) setCompanyName(data.name);
        if (data?.logo_url) setLogoUrl(data.logo_url);
      });
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    const result = authSchema.safeParse({ email: cleanEmail, password: cleanPassword });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    const { error } = await signIn(cleanEmail, cleanPassword);
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Invalid email or password");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Welcome back!");
      navigate("/");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    const result = authSchema.safeParse({ email: cleanEmail, password: cleanPassword });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    const { error } = await signUp(email, password);
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("This email is already registered. Please sign in instead.");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Account created successfully! You can now sign in.");
      navigate("/");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = (resetEmail || email).trim();
    const result = z.string().email("Invalid email address").safeParse(cleanEmail);

    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsResettingPassword(true);

    try {
      const { data, error } = await supabase.functions.invoke("reset-user-password", {
        body: { email: cleanEmail },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`New password sent to ${cleanEmail}`);
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error: any) {
      toast.error(await getFunctionErrorMessage(error, "Failed to send new password"));
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          {logoUrl ? (
            <div className="mx-auto mb-4 w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center">
              <img src={logoUrl} alt={companyName} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="mx-auto mb-4 w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">IM</span>
            </div>
          )}
          <CardTitle className="text-2xl font-bold">{companyName}</CardTitle>
          <CardDescription>Work Immersion Program</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-1 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto px-0 text-sm"
                    onClick={() => {
                      setResetEmail(email);
                      setShowForgotPassword((current) => !current);
                    }}
                  >
                    Forgot password?
                  </Button>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              {showForgotPassword && (
                <form onSubmit={handleForgotPassword} className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email for password reset</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    A new Immersion Portal password will be sent to this email.
                  </p>
                  <Button type="submit" className="mt-4 w-full" disabled={isResettingPassword}>
                    {isResettingPassword ? "Sending password..." : "Send New Password"}
                  </Button>
                </form>
              )}
            </TabsContent>



          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
