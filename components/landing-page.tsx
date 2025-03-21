'use client';

import { useUser } from '@/providers/userContext';
import LOGO from '@/public/LOGO.png';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, ChevronRight, Menu, Moon, Sun, X } from 'lucide-react';

import { useEffect, useState } from 'react';

import { useTheme } from 'next-themes';
import Image from 'next/image';
import Link from 'next/link';

import { LoginForm } from '@/components/login-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, supabase, userDetails } = useUser();

  // Typing effect state
  const [typedText, setTypedText] = useState('');
  const fullText = 'نظام حضور متكامل لمعهد راية';
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  const { data: currentUser, isLoading: isUserLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data?.user || null;
    },
    enabled: !!supabase,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Determine if user is logged in based on both context and query
  const isLoggedIn = !!user || !!currentUser;

  // Typing effect implementation
  useEffect(() => {
    if (typedText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setTypedText(fullText.slice(0, typedText.length + 1));
      }, 100); // Slower typing for heading (100ms)

      return () => clearTimeout(timeout);
    } else {
      setIsTypingComplete(true);
    }
  }, [typedText, fullText]);

  useEffect(() => {
    if (theme === 'system' || !theme) {
      setTheme('light');
      localStorage.setItem('theme', 'light');
    }
  }, [theme, setTheme]);

  const features = [
    {
      title: 'تتبع الحضور بسهولة',
      description: 'سجل حضور الطلاب بنقرة واحدة وتتبع الإحصائيات في الوقت الفعلي',
    },
    {
      title: 'تقارير مفصلة',
      description: 'احصل على تقارير مفصلة عن حضور الطلاب والدورات التدريبية',
    },
    {
      title: 'واجهة سهلة الاستخدام',
      description: 'واجهة مستخدم بسيطة وسهلة الاستخدام للطلاب والدكاترة',
    },
    {
      title: 'تسجيل الحضور بالمسح بالباركود',
      description: 'تسجيل حضور الطلاب في الدورات التدريبية باستخدام الباركود ورمز الجلسة',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* الشريط العلوي */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Image src={LOGO} alt="شعار" className="h-8 w-8" />
            <Link href={'/'}>نظام حضور معهد راية</Link>
          </div>

          {/* قائمة التنقل للشاشات الكبيرة */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              المميزات
            </Link>
            <Link
              href="#about"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              عن النظام
            </Link>
            <Link
              href="#contact"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              اتصل بنا
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'system' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {!isLoggedIn && !isUserLoading && (
              <>
                <Button onClick={() => setShowLogin(true)}>تسجيل الدخول</Button>
                <Button variant="outline" asChild>
                  <Link href="/signup">إنشاء حساب</Link>
                </Button>
              </>
            )}
          </nav>

          {/* زر القائمة للشاشات الصغيرة */}
          <div className="flex md:hidden items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>

      {/* القائمة المتحركة للشاشات الصغيرة */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-background md:hidden"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b">
                <Link href={'/'} className="font-bold text-xl">
                  نظام حضور معهد راية
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <nav className="flex flex-col p-4 space-y-4">
                <Link
                  href="#features"
                  className="p-2 hover:bg-muted rounded-md transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  المميزات
                </Link>
                <Link
                  href="#about"
                  className="p-2 hover:bg-muted rounded-md transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  عن النظام
                </Link>
                <Link
                  href="#contact"
                  className="p-2 hover:bg-muted rounded-md transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  اتصل بنا
                </Link>

                {!isLoggedIn && !isUserLoading && (
                  <>
                    <Button
                      onClick={() => {
                        setShowLogin(true);
                        setMobileMenuOpen(false);
                      }}
                    >
                      تسجيل الدخول
                    </Button>
                    <Button variant="outline" asChild onClick={() => setMobileMenuOpen(false)}>
                      <Link href="/signup">إنشاء حساب</Link>
                    </Button>
                  </>
                )}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* نافذة تسجيل الدخول */}
      <AnimatePresence>
        {showLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-background rounded-lg shadow-lg w-full max-w-md"
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-2"
                onClick={() => setShowLogin(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6 text-center">تسجيل الدخول</h2>
                <LoginForm />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* القسم الرئيسي */}
      <section className="w-[95%] mx-auto py-12 md:py-24 lg:py-32">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center max-lg:text-center">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl text-[#c7b66d]  font-bold tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl min-h-[4rem] my-8">
                {typedText}
                {!isTypingComplete && <span className="animate-pulse">|</span>}
              </h1>
              <p className="max-w-[600px] max-lg:mx-auto text-muted-foreground md:text-xl max-lg:text-center">
                نظام إلكتروني متكامل لتسجيل ومتابعة حضور الطلاب في المحاضرات والدورات التدريبية
              </p>
              <Button
                variant="outline"
                size="lg"
                className="  min-w-[250px] border-[#908556] hover:bg-[#90855671] my-8"
                asChild
              >
                <Link
                  href={`${
                    userDetails?.role === 'student'
                      ? 'student-dash'
                      : userDetails?.role === 'doctor'
                        ? '/doctor-dash'
                        : '/signup'
                  }`}
                >
                  انضم إلينا الآن
                </Link>
              </Button>
            </div>

            {!isLoggedIn && !isUserLoading && (
              <div className="flex flex-col sm:flex-row gap-4 max-lg:justify-center max-lg:my-4 ">
                <Button size="lg" asChild>
                  <Link href="/signup">
                    ابدأ الآن
                    <ChevronRight className="mr-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" onClick={() => setShowLogin(true)}>
                  تسجيل الدخول
                </Button>
              </div>
            )}
          </div>
          <div className="flex justify-center">
            <motion.img
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              src="/main2.png"
              alt="صورة توضيحية"
              className="rounded-lg shadow-lg"
              width={700}
              height={600}
            />
          </div>
        </div>
      </section>

      {/* قسم المميزات */}
      <section id="features" className="container py-12 md:py-24 lg:py-32 bg-muted/50 rounded-lg">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-5xl">
            مميزات النظام
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            نظام حضور معهد راية يوفر العديد من المميزات التي تسهل عملية تسجيل ومتابعة حضور الطلاب
          </p>
        </div>
        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2  md:grid-cols-2 lg:grid-cols-4 mt-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full">
                <CardContent className="p-6">
                  <CheckCircle className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground mt-2">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* قسم عن النظام */}
      <section id="about" className="container py-12 md:py-24 lg:py-32">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
          <div className="flex justify-center">
            <motion.img
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              src="/main.png"
              alt="صورة توضيحية"
              className="rounded-lg shadow-lg"
              width={700}
              height={500}
            />
          </div>
          <div className="flex flex-col justify-center space-y-4">
            <Link
              href={'/'}
              className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl"
            >
              عن نظام حضور معهد راية
            </Link>
            <p className="text-muted-foreground md:text-lg">
              تم تطوير نظام حضور معهد راية لتسهيل عملية تسجيل ومتابعة حضور الطلاب في المحاضرات
              والدورات التدريبية. يوفر النظام واجهة سهلة الاستخدام للطلاب والدكاترة، ويتيح إمكانية
              استخراج تقارير مفصلة عن حضور الطلاب.
            </p>
            <p className="text-muted-foreground md:text-lg">
              يمكن للدكاترة تسجيل حضور الطلاب بسهولة، ومتابعة نسب الحضور والغياب، واستخراج تقارير
              مفصلة. كما يمكن للطلاب متابعة سجل حضورهم والاطلاع على نسب الحضور الخاصة بهم.
            </p>
            <div>
              <Button variant="outline" size="lg" asChild>
                <Link
                  href={`${
                    userDetails?.role === 'student'
                      ? 'student-dash'
                      : userDetails?.role === 'doctor'
                        ? '/doctor-dash'
                        : '/signup'
                  }`}
                >
                  انضم إلينا الآن
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* قسم اتصل بنا */}
      <section id="contact" className="container py-12 md:py-24 lg:py-32 bg-muted/50 rounded-lg">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-5xl">اتصل بنا</h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            إذا كان لديك أي استفسار أو اقتراح، يرجى التواصل معنا
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Button size="lg" asChild>
              <Link href="mailto:info@raya.edu">راسلنا عبر البريد الإلكتروني</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="tel:+201234567890">اتصل بنا</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* تذييل الصفحة */}
      <footer className="border-t py-6 md:py-8">
        <div className="container flex flex-col items-center justify-center gap-4 md:flex-row md:gap-8">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} معهد راية. جميع الحقوق محفوظة.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              سياسة الخصوصية
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              شروط الاستخدام
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
