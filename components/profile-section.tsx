"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Calendar, BarChart3 } from "lucide-react"
import { EditProfileDialog } from "@/components/dialogs/edit-profile-dialog"

interface ProfileSectionProps {
  user: any
  stats: {
    coursesCount: number
    totalLectures: number
    attendancePercentage: number
  }
  onUserUpdated?: () => void
}

export function ProfileSection({ user, stats, onUserUpdated }: ProfileSectionProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "U"
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 mt-6">
      <Card className="hover-card">
        <CardHeader>
          <CardTitle>المعلومات الشخصية</CardTitle>
          <CardDescription>عرض وتعديل معلوماتك الشخصية</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center mb-6">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} alt={user.name} />
              <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold">{user.name}</h2>
            <p className="text-muted-foreground">{user.email}</p>
            <Badge className="mt-2">{user.role === "student" ? "طالب" : "دكتور"}</Badge>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="font-medium">الاسم:</span>
              <span>{user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">البريد الإلكتروني:</span>
              <span>{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">نوع المستخدم:</span>
              <span>{user.role === "student" ? "طالب" : "دكتور"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">تاريخ الانضمام:</span>
              <span>{format(new Date(user.created_at || new Date()), "yyyy/MM/dd", { locale: ar })}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" className="w-full" onClick={() => setIsEditDialogOpen(true)}>
            تعديل المعلومات الشخصية
          </Button>
        </CardFooter>
      </Card>

      <Card className="hover-card">
        <CardHeader>
          <CardTitle>إحصائيات الحساب</CardTitle>
          <CardDescription>إحصائيات حسابك</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">
                {user.role === "student" ? "الدورات المسجلة" : "الدورات التي تُدرسها"}
              </h3>
              <div className="flex justify-between items-center">
                <span className="text-3xl font-bold">{stats.coursesCount}</span>
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">إجمالي المحاضرات</h3>
              <div className="flex justify-between items-center">
                <span className="text-3xl font-bold">{stats.totalLectures}</span>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            {user.role === "student" && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">نسبة الحضور الإجمالية</h3>
                <div className="flex justify-between items-center">
                  <span className="text-3xl font-bold">{stats.attendancePercentage}%</span>
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <EditProfileDialog
        user={user}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={onUserUpdated}
      />
    </div>
  )
}
