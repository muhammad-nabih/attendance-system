"use client"

import { useState, useEffect } from "react"
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
  search: z.string().optional(),
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
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [filteredStudents, setFilteredStudents] = useState<any[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      search: "",
    },
  })

  // Fetch all students when dialog opens
  useEffect(() => {
    if (open) {
      fetchAllStudents()
    }
  }, [open])

  // Watch for search input changes and apply debounced filtering
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "search") {
        // Clear any existing timeout
        if (searchTimeout) {
          clearTimeout(searchTimeout)
        }

        // Set a new timeout for debouncing
        const timeout = setTimeout(() => {
          filterStudents(value.search || "")
        }, 300) // 300ms delay

        setSearchTimeout(timeout)
      }
    })

    return () => subscription.unsubscribe()
  }, [form.watch, allStudents])

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

  async function fetchAllStudents() {
    setIsLoading(true)

    try {
      // Get all students
      const { data: students, error: searchError } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("role", "student")
        .limit(100)

      if (searchError) throw searchError

      // Get existing students in the course
      const { data: existingStudents, error: existingError } = await supabase
        .from("course_students")
        .select("student_id")
        .eq("course_id", courseId)

      if (existingError) throw existingError

      // Filter out students who are already in the course
      const existingIds = existingStudents.map((s) => s.student_id)
      const availableStudents = students.filter((s) => !existingIds.includes(s.id))

      setAllStudents(availableStudents)
      setFilteredStudents(availableStudents)
    } catch (error: any) {
      console.error("Error fetching students:", error)
      toast({
        variant: "destructive",
        title: "خطأ في جلب البيانات",
        description: error.message || "حدث خطأ أثناء جلب قائمة الطلاب",
      })
    } finally {
      setIsLoading(false)
    }
  }

  function filterStudents(searchTerm: string) {
    if (!searchTerm.trim()) {
      setFilteredStudents(allStudents)
      return
    }

    const lowerSearchTerm = searchTerm.toLowerCase()
    const filtered = allStudents.filter(
      (student) =>
        student.name.toLowerCase().includes(lowerSearchTerm) || student.email.toLowerCase().includes(lowerSearchTerm),
    )

    setFilteredStudents(filtered)
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
      setFilteredStudents([])
      setAllStudents([])
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>إضافة طلاب إلى الدورة</DialogTitle>
          <DialogDescription>
            اختر الطلاب الذين تريد إضافتهم إلى الدورة. يمكنك استخدام البحث لتصفية القائمة
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="search"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تصفية الطلاب (اختياري)</FormLabel>
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
          </div>
        </Form>

        <ScrollArea className="h-[300px] rounded-md border p-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredStudents.length > 0 ? (
            <div className="space-y-2">
              {filteredStudents.map((student) => (
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
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {allStudents.length > 0 ? "لا توجد نتائج مطابقة للبحث" : "لا يوجد طلاب متاحين للإضافة"}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">تم اختيار {selectedStudents.length} من الطلاب</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedStudents([])}
            disabled={selectedStudents.length === 0}
          >
            إلغاء الاختيار
          </Button>
        </div>

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

