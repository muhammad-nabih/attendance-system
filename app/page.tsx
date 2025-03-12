import { redirect } from "next/navigation"

import { LandingPage } from "@/components/landing-page"

export default async function HomePage() {

  // عرض الصفحة الرئيسية للزوار
  return <LandingPage />
}
