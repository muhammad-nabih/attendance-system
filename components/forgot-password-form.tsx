'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Check, Loader2 } from 'lucide-react';
import * as z from 'zod';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

import { createClient } from '@/lib/supabase/client';

const formSchema = z.object({
  email: z.string().email({
    message: 'يرجى إدخال بريد إلكتروني صحيح',
  }),
});

type ForgotPasswordFormValues = z.infer<typeof formSchema>;

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const supabase = createClient();
  const [emailSent, setEmailSent] = useState(false);

  const resetPasswordMutation = useMutation({
    mutationFn: async (values: ForgotPasswordFormValues) => {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      });

      if (error) throw error;

      return true;
    },
    onSuccess: () => {
      setEmailSent(true);
      toast({
        title: 'تم إرسال رابط إعادة تعيين كلمة المرور',
        description: 'يرجى التحقق من بريدك الإلكتروني للحصول على تعليمات إعادة تعيين كلمة المرور',
      });
    },
    onError: (error: Error) => {
      console.error('Reset password error:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في إرسال رابط إعادة تعيين كلمة المرور',
        description:
          error.message ||
          'حدث خطأ أثناء إرسال رابط إعادة تعيين كلمة المرور، يرجى المحاولة مرة أخرى',
      });
    },
  });

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  function onSubmit(values: ForgotPasswordFormValues) {
    resetPasswordMutation.mutate(values);
  }

  if (emailSent) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-3">
            <Check className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">تم إرسال البريد الإلكتروني</h2>
        <p className="text-muted-foreground">
          تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. يرجى التحقق من بريدك
          الإلكتروني واتباع التعليمات لإعادة تعيين كلمة المرور الخاصة بك.
        </p>
        <p className="text-muted-foreground">
          إذا لم تستلم البريد الإلكتروني، يرجى التحقق من مجلد البريد العشوائي أو المحاولة مرة أخرى.
        </p>
        <Button asChild className="mt-4">
          <Link href="/">العودة إلى الصفحة الرئيسية</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">نسيت كلمة المرور</h2>
        <p className="text-muted-foreground mt-2">
          أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>البريد الإلكتروني</FormLabel>
                <FormControl>
                  <Input placeholder="example@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={resetPasswordMutation.isPending}>
            {resetPasswordMutation.isPending ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري إرسال رابط إعادة التعيين...
              </>
            ) : (
              'إرسال رابط إعادة التعيين'
            )}
          </Button>
        </form>
      </Form>
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          تذكرت كلمة المرور؟{' '}
          <Link href="/" className="text-primary hover:underline">
            العودة إلى تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
