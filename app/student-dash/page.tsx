import { redirect } from 'next/navigation';

import { StudentDashboard } from '@/components/student-dashboard';

export default async function StudentDashPage() {
  return <StudentDashboard />;
}
