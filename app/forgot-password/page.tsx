import { ArrowRight } from 'lucide-react';

import Link from 'next/link';

import { ForgotPasswordForm } from '@/components/forgot-password-form';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="container flex h-16 items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <img src="/placeholder.svg?height=32&width=32" alt="شعار" className="h-8 w-8" />
          <span>نظام حضور معهد راية</span>
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowRight className="ml-2 h-4 w-4" />
              العودة للرئيسية
            </Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 container flex items-center justify-center py-10">
        <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-lg border">
          <ForgotPasswordForm />
        </div>
      </main>
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-center gap-4 md:flex-row md:gap-8">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} معهد راية. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
    </div>
  );
}
