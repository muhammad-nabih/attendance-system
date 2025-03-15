"use client"

import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { BarChart3, Users, Calendar } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface CourseDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  course: any
  students: any[]
  attendanceStats: {
    present: number
    absent: number
    late: number
    total: number
    presentPercentage: number
  }
}

export function CourseDetailsDialog({
  open,
  onOpenChange,
  course,
  students,
  attendanceStats,
}: CourseDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{course.name}</DialogTitle>
          <DialogDescription>
           تم الانشاء {format(new Date(course.created_at), "yyyy/MM/dd")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">نسبة الحضور</CardTitle>
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceStats.presentPercentage}%</div>
                <Progress value={attendanceStats.presentPercentage} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">عدد الطلاب</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{students.length}</div>
                <p className="text-xs text-muted-foreground">طالب مسجل</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">المحاضرات</CardTitle>
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceStats.total}</div>
                <p className="text-xs text-muted-foreground">محاضرة</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>إحصائيات الحضور</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-success">{attendanceStats.present}</p>
                  <p className="text-sm text-muted-foreground">حضور</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-destructive">{attendanceStats.absent}</p>
                  <p className="text-sm text-muted-foreground">غياب</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-warning">{attendanceStats.late}</p>
                  <p className="text-sm text-muted-foreground">تأخير</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الطلاب المسجلين</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-3 border-b bg-muted/50 p-2 font-medium">
                  <div>الاسم</div>
                  <div>البريد الإلكتروني</div>
                  <div>معرف الطالب</div>
                </div>
                <div className="divide-y">
                  {students.map((student) => (
                    <div key={student.id} className="grid grid-cols-3 p-2">
                      <div>{student.name}</div>
                      <div className="text-muted-foreground">{student.email}</div>
                      <div className="font-mono text-xs">{student.id}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
