
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import SimpleModal from "@/components/SimpleModal";
import { sendPasswordReset } from "@/services/auth-service";
import { Mail } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setIsLoading(true);
      console.log("Attempting login with:", values.email);
      const user = await signIn(values.email, values.password);
      
      if (!user) {
        toast({
          title: "Erro ao fazer login",
          description: "Credenciais inválidas. Por favor, tente novamente.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo de volta!",
      });
      
      console.log("User role:", user.role);
      // Redirect to the appropriate dashboard
      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/company/dashboard");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Ocorreu um erro ao tentar fazer login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await sendPasswordReset(forgotEmail);
      toast({
        title: "E-mail enviado!",
        description: "Se o endereço estiver correto, um link de redefinição foi enviado.",
      });
      setForgotOpen(false);
      setForgotEmail("");
    } catch (error: any) {
      toast({
        title: "Erro ao recuperar senha",
        description: error.message || "Ocorreu um erro ao tentar enviar o e-mail de redefinição.",
        variant: "destructive",
      });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-background">
      <div className="w-full max-w-md shadow-lg rounded-xl bg-white dark:bg-card px-6 py-8 space-y-6">
        <div className="flex justify-center mb-4">
          <img src="/uploads/logo.png" alt="Logo" className="h-16 w-16 rounded-full" />
        </div>
        {/* Modal de recuperação de senha */}
        <SimpleModal open={forgotOpen} onClose={() => setForgotOpen(false)} title="Recuperar senha">
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium" htmlFor="reset-email">
                E-mail
              </label>
              <div className="flex items-center gap-2">
                <Mail size={18} />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="Seu e-mail"
                  required
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  disabled={forgotLoading}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={forgotLoading}>
              {forgotLoading ? "Enviando..." : "Enviar link de redefinição"}
            </Button>
          </form>
        </SimpleModal>

        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">NovaAgenda</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="email@exemplo.com"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Senha
                        <button
                          type="button"
                          className="ml-2 text-xs text-primary underline hover:opacity-80"
                          tabIndex={-1}
                          onClick={() => setForgotOpen(true)}
                          aria-label="Esqueceu a senha?"
                        >
                          Esqueceu a senha?
                        </button>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="******"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <div className="text-center text-sm text-muted-foreground">
              Ainda não tem uma conta?{" "}
              <Link
                to="/register"
                className="text-primary underline-offset-4 hover:underline"
              >
                Registre-se
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
