"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2 } from "lucide-react"

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

const formSchema = z.object({
  name: z.string().min(2, {
    message: "يجب أن يكون اسم الدورة حرفين على الأقل",
  }),
})

interface AddCourseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddCourseDialog({ open, onOpenChange, onSuccess }: AddCourseDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      // Get the current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError) throw userError

      // Insert the new course
      const { error: courseError } = await supabase.from("courses").insert([
        {
          name: values.name,
          doctor_id: user?.id,
        },
      ])

      if (courseError) throw courseError

      toast({
        title: "تم إنشاء الدورة بنجاح",
        description: "تم إضافة الدورة الجديدة إلى قائمة دوراتك",
      })

      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      console.error("Error adding course:", error)
      toast({
        variant: "destructive",
        title: "خطأ في إنشاء الدورة",
        description: error.message || "حدث خطأ أثناء إنشاء الدورة، يرجى المحاولة مرة أخرى",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>إضافة دورة جديدة</DialogTitle>
          <DialogDescription>قم بإضافة دورة جديدة إلى قائمة الدورات التي تقوم بتدريسها</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم الدورة</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: برمجة الويب" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : (
                  "إنشاء الدورة"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

