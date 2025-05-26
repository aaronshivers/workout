import { useState } from "react";
import { useAuth } from "./useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

export const FormSchema = z.object({
  email: z.string().email({
    message: "Invalid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

export const useLoginForm = () => {
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleLogin = async (data: z.infer<typeof FormSchema>) => {
    setError(null);
    try {
      await login(data);
    } catch (error: any) {
      setError(error.message || "Login failed. Please try again.");
      console.error("Login failed:", error);
    }
  };

  return { form, error, handleLogin };
};
