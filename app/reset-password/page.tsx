'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ResetPasswordForm } from '@/components/reset-password-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isValidToken, setIsValidToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // طباعة الهاش للتصحيح
    console.log('Hash:', window.location.hash);

    // إضافة تأخير صغير للتأكد من تحميل الهاش بالكامل
    setTimeout(() => {
      // التحقق من وجود رمز في عنوان URL
      const hash = window.location.hash.substring(1);
      const query = new URLSearchParams(hash);
      const accessToken = query.get('access_token');
      const refreshToken = query.get('refresh_token');

      console.log('Access Token:', accessToken ? 'موجود' : 'غير موجود');
      console.log('Refresh Token:', refreshToken ? 'موجود' : 'غير موجود');

      if (!accessToken || !refreshToken) {
        toast({
          variant: 'destructive',
          title: 'رابط غير صالح',
          description: 'الرابط الذي استخدمته غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.',
        });
        setIsValidToken(false);
      } else {
        setIsValidToken(true);
      }

      setIsLoading(false);
    }, 500);
  }, [toast]);

  if (isLoading) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center p-4">
              <p>جاري التحقق من صلاحية الرابط...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">رابط غير صالح</h2>
              <p className="text-muted-foreground">
                الرابط الذي استخدمته غير صالح أو منتهي الصلاحية.
              </p>
              <Button asChild className="mt-4">
                <Link href="/forgot-password">طلب رابط جديد</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
