"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const formSchema = z.object({
  search: z.string().min(1, {
    message: "يرجى إدخال اسم أو بريد إلكتروني للبحث",
  }),
})

interface AddStudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: string
  onSuccess?: () => void
}

export function AddStudentDialog({ open, onOpenChange, courseId, onSuccess }: AddStudentDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const supabase = createClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      search: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      // Search for students
      const { data: students, error: searchError } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("role", "student")
        .or(`name.ilike.%${values.search}%,email.ilike.%${values.search}%`)
        .limit(10)

      if (searchError) throw searchError

      // Get existing students in the course
      const { data: existingStudents, error: existingError } = await supabase
        .from("course_students")
        .select("student_id")
        .eq("course_id", courseId)

      if (existingError) throw existingError

      // Filter out students who are already in the course
      const existingIds = existingStudents.map((s) => s.student_id)
      const filteredStudents = students.filter((s) => !existingIds.includes(s.id))

      setSearchResults(filteredStudents)
    } catch (error: any) {
      console.error("Error searching students:", error)
      toast({
        variant: "destructive",
        title: "خطأ في البحث",
        description: error.message || "حدث خطأ أثناء البحث عن الطلاب",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function addSelectedStudents() {
    setIsLoading(true)

    try {
      // Add selected students to the course
      const studentsToAdd = selectedStudents.map((studentId) => ({
        course_id: courseId,
        student_id: studentId,
      }))

      const { error } = await supabase.from("course_students").insert(studentsToAdd)

      if (error) throw error

      toast({
        title: "تم إضافة الطلاب بنجاح",
        description: "تم إضافة الطلاب المحددين إلى الدورة",
      })

      form.reset()
      setSearchResults([])
      setSelectedStudents([])
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      console.error("Error adding students:", error)
      toast({
        variant: "destructive",
        title: "خطأ في إضافة الطلاب",
        description: error.message || "حدث خطأ أثناء إضافة الطلاب إلى الدورة",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>إضافة طلاب إلى الدورة</DialogTitle>
          <DialogDescription>ابحث عن الطلاب بالاسم أو البريد الإلكتروني لإضافتهم إلى الدورة</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="search"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>البحث عن طلاب</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="اكتب اسم أو بريد إلكتروني..." className="pr-9" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" variant="secondary" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري البحث...
                </>
              ) : (
                "بحث"
              )}
            </Button>
          </form>
        </Form>

        {searchResults.length > 0 && (
          <ScrollArea className="h-[200px] rounded-md border p-2">
            <div className="space-y-2">
              {searchResults.map((student) => (
                <div
                  key={student.id}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedStudents.includes(student.id) ? "bg-primary/10" : "hover:bg-muted"
                  }`}
                  onClick={() => toggleStudentSelection(student.id)}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`}
                        alt={student.name}
                      />
                      <AvatarFallback>{student.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                    </div>
                  </div>
                  <div
                    className={`h-4 w-4 rounded-full border ${
                      selectedStudents.includes(student.id) ? "bg-primary border-primary" : "border-input"
                    }`}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button onClick={addSelectedStudents} disabled={isLoading || selectedStudents.length === 0}>
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الإضافة...
              </>
            ) : (
              `إضافة ${selectedStudents.length} طلاب`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
