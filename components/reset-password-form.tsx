'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Check, Loader2 } from 'lucide-react';
import * as z from 'zod';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

const formSchema = z
  .object({
    password: z.string().min(8, {
      message: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل',
    }),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'كلمات المرور غير متطابقة',
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof formSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [resetComplete, setResetComplete] = useState(false);
  const [tokens, setTokens] = useState<{
    accessToken: string;
    refreshToken: string;
  } | null>(null);

  useEffect(() => {
    // Add a small delay to ensure the hash is fully loaded
    setTimeout(() => {
      // Extract tokens from URL hash
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      console.log('ResetPasswordForm - Token extraction:', {
        accessToken: accessToken ? 'موجود' : 'غير موجود',
        refreshToken: refreshToken ? 'موجود' : 'غير موجود',
      });

      if (accessToken && refreshToken) {
        setTokens({ accessToken, refreshToken });
      } else {
        console.error('No valid tokens found in URL hash');
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: 'لم يتم العثور على رموز صالحة في الرابط. يرجى المحاولة مرة أخرى.',
        });
      }
    }, 500);
  }, [router, toast]);

  const updatePasswordMutation = useMutation({
    mutationFn: async (values: ResetPasswordFormValues) => {
      if (!tokens) {
        throw new Error('لم يتم العثور على رموز صالحة');
      }

      console.log('Attempting to set session with tokens...');

      // Set session using the tokens
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });

      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('فشل في تعيين الجلسة. يرجى المحاولة مرة أخرى.');
      }

      console.log('Session set successfully, updating password...');

      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        console.error('Update password error:', error);
        throw new Error('فشل في تحديث كلمة المرور. يرجى المحاولة مرة أخرى.');
      }

      console.log('Password updated successfully');
      return true;
    },
    onSuccess: () => {
      setResetComplete(true);
      toast({
        title: 'تم تغيير كلمة المرور بنجاح',
        description: 'يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة',
      });

      // Clean URL hash for added security
      window.history.replaceState({}, document.title, window.location.pathname);

      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push('/');
      }, 3000);
    },
    onError: (error: Error) => {
      console.error('Update password error:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في تغيير كلمة المرور',
        description: error.message || 'حدث خطأ أثناء تغيير كلمة المرور، يرجى المحاولة مرة أخرى',
      });
    },
  });

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  function onSubmit(values: ResetPasswordFormValues) {
    updatePasswordMutation.mutate(values);
  }

  if (resetComplete) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-3">
            <Check className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">تم تغيير كلمة المرور بنجاح</h2>
        <p className="text-muted-foreground">
          تم تغيير كلمة المرور الخاصة بك بنجاح. سيتم توجيهك إلى صفحة تسجيل الدخول.
        </p>
      </div>
    );
  }

  if (!tokens) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">خطأ</h2>
        <p className="text-muted-foreground">
          لم يتم العثور على رموز صالحة. يرجى المحاولة مرة أخرى.
        </p>
        <Button asChild>
          <Link href="/forgot-password">العودة إلى نسيت كلمة المرور</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">إعادة تعيين كلمة المرور</h2>
        <p className="text-muted-foreground mt-2">أدخل كلمة المرور الجديدة الخاصة بك</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>كلمة المرور الجديدة</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>تأكيد كلمة المرور</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={updatePasswordMutation.isPending}>
            {updatePasswordMutation.isPending ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري تغيير كلمة المرور...
              </>
            ) : (
              'تغيير كلمة المرور'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
