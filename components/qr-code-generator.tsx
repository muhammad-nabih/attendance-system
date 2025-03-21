'use client';

import { Copy, Download, Loader2, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

import { createClient } from '@/lib/supabase/client';

interface QRCodeGeneratorProps {
  courses: any[];
  onSessionCreated?: () => void;
  userId?: string;
}

export function QRCodeGenerator({ courses, onSessionCreated, userId }: QRCodeGeneratorProps) {
  const { toast } = useToast();
  const supabase = createClient();
  const [selectedCourse, setSelectedCourse] = useState('');
  const [sessionNumber, setSessionNumber] = useState('');
  const [qrValue, setQrValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [expiryTime, setExpiryTime] = useState(30); // Default 30 minutes
  const qrCodeRef = useRef<SVGSVGElement>(null);

  const generateQRCode = async () => {
    if (!selectedCourse || !sessionNumber) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى اختيار الدورة ورقم المحاضرة',
      });
      return;
    }

    if (!userId) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'لم يتم العثور على معرف المستخدم',
      });
      return;
    }

    setIsLoading(true);

    try {
      // التحقق من وجود محاضرة بنفس الرقم لهذه الدورة
      const { data: existingSessions, error: checkError } = await supabase
        .from('sessions')
        .select('*')
        .eq('course_id', selectedCourse)
        .eq('session_number', Number.parseInt(sessionNumber))
        .eq('is_active', true);

      if (checkError) throw checkError;

      if (existingSessions && existingSessions.length > 0) {
        // المحاضرة موجودة، استخدم الرمز الخاص بها
        const session = existingSessions[0];
        setQrValue(session.code);
        setSessionId(session.id);

        toast({
          title: 'تم استخدام رمز موجود',
          description: `تم استخدام رمز QR للمحاضرة رقم ${sessionNumber} الموجودة مسبقاً`,
        });
      } else {
        // إنشاء محاضرة جديدة
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        const now = new Date();

        // حساب وقت انتهاء الصلاحية (الوقت الحالي + مدة الصلاحية بالدقائق)
        const expiryDate = new Date(now.getTime() + expiryTime * 60 * 1000);

        const { data: session, error: insertError } = await supabase
          .from('sessions')
          .insert({
            course_id: selectedCourse,
            session_number: Number.parseInt(sessionNumber),
            code,
            date: now.toISOString().split('T')[0],
            expires_at: expiryDate.toISOString(),
            is_active: true,
            created_by: userId,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setQrValue(code);
        setSessionId(session.id);

        toast({
          title: 'تم إنشاء رمز QR',
          description: `تم إنشاء رمز QR للمحاضرة رقم ${sessionNumber} بنجاح`,
        });

        // استدعاء الدالة المرجعية إذا تم توفيرها
        if (onSessionCreated) {
          onSessionCreated();
        }
      }
    } catch (error: any) {
      console.error('Error generating QR code:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في إنشاء رمز QR',
        description: error.message || 'حدث خطأ أثناء إنشاء رمز QR',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deactivateSession = async () => {
    if (!sessionId) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) throw error;

      setQrValue('');
      setSessionId('');

      toast({
        title: 'تم إيقاف المحاضرة',
        description: 'تم إيقاف المحاضرة بنجاح ولن يتمكن الطلاب من تسجيل الحضور',
      });

      // استدعاء الدالة المرجعية إذا تم توفيرها
      if (onSessionCreated) {
        onSessionCreated();
      }
    } catch (error: any) {
      console.error('Error deactivating session:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في إيقاف المحاضرة',
        description: error.message || 'حدث خطأ أثناء إيقاف المحاضرة',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // نسخ الكود إلى الحافظة
  const copyCodeToClipboard = () => {
    if (!qrValue) return;

    navigator.clipboard
      .writeText(qrValue)
      .then(() => {
        toast({
          title: 'تم النسخ',
          description: 'تم نسخ الرمز إلى الحافظة بنجاح',
        });
      })
      .catch(error => {
        console.error('Error copying code:', error);
        toast({
          variant: 'destructive',
          title: 'خطأ في النسخ',
          description: 'حدث خطأ أثناء نسخ الرمز إلى الحافظة',
        });
      });
  };

  // تنزيل رمز QR كصورة
  const downloadQRCode = () => {
    if (!qrCodeRef.current) return;

    const svg = qrCodeRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      // إنشاء رابط تنزيل
      const downloadLink = document.createElement('a');
      downloadLink.download = `qr-code-${qrValue}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  // مشاركة الرمز عبر وسائل التواصل الاجتماعي
  const shareCode = (platform: string) => {
    if (!qrValue) return;

    const courseName = courses.find(c => c.id === selectedCourse)?.name || 'الدورة';
    const text = `رمز الحضور للمحاضرة رقم ${sessionNumber} في ${courseName}: ${qrValue}`;

    let url = '';

    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent(`رمز الحضور للمحاضرة رقم ${sessionNumber}`)}&body=${encodeURIComponent(text)}`;
        break;
      default:
        // مشاركة عامة باستخدام Web Share API إذا كانت متوفرة
        if (navigator.share) {
          navigator
            .share({
              title: `رمز الحضور للمحاضرة رقم ${sessionNumber}`,
              text: text,
            })
            .catch(console.error);
          return;
        }
    }

    // فتح الرابط في نافذة جديدة
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>إنشاء رمز QR للحضور</CardTitle>
        <CardDescription>قم بإنشاء رمز QR للطلاب لتسجيل حضورهم للمحاضرة</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course">الدورة</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger id="course">
                  <SelectValue placeholder="اختر الدورة" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-number">رقم المحاضرة</Label>
              <Input
                id="session-number"
                type="number"
                min="1"
                value={sessionNumber}
                onChange={e => setSessionNumber(e.target.value)}
                placeholder="أدخل رقم المحاضرة"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry-time">مدة صلاحية الرمز (بالدقائق)</Label>
            <Input
              id="expiry-time"
              type="number"
              min="5"
              max="120"
              value={expiryTime}
              onChange={e => setExpiryTime(Number.parseInt(e.target.value) || 30)}
              placeholder="مدة صلاحية الرمز"
            />
            <p className="text-xs text-muted-foreground">
              بعد انتهاء هذه المدة، سيتم اعتبار الطلاب الذين لم يسجلوا حضورهم غائبين تلقائياً
            </p>
          </div>

          {qrValue ? (
            <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
              <QRCodeSVG ref={qrCodeRef} value={qrValue} size={200} />
              <div className="mt-4 flex items-center gap-2">
                <p className="text-lg font-bold">{qrValue}</p>
                <Button variant="ghost" size="icon" onClick={copyCodeToClipboard} title="نسخ الرمز">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => copyCodeToClipboard()}>
                  <Copy className="mr-2 h-4 w-4" />
                  نسخ الرمز
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadQRCode()}>
                  <Download className="mr-2 h-4 w-4" />
                  تنزيل QR
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Share2 className="mr-2 h-4 w-4" />
                      مشاركة
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => shareCode('whatsapp')}>
                      واتساب
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => shareCode('telegram')}>
                      تلجرام
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => shareCode('email')}>
                      البريد الإلكتروني
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => shareCode('other')}>
                      مشاركة أخرى
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                اطلب من الطلاب مسح رمز QR أو إدخال الرمز يدوياً لتسجيل حضورهم
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center p-8 border rounded-lg border-dashed">
              <p className="text-muted-foreground">قم بإنشاء رمز QR للمحاضرة</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {qrValue ? (
          <Button variant="destructive" onClick={deactivateSession} disabled={isLoading}>
            {isLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
            إيقاف المحاضرة
          </Button>
        ) : (
          <Button variant="outline" onClick={() => {}} disabled>
            إيقاف المحاضرة
          </Button>
        )}
        <Button onClick={generateQRCode} disabled={!selectedCourse || !sessionNumber || isLoading}>
          {isLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
          إنشاء رمز QR
        </Button>
      </CardFooter>
    </Card>
  );
}
