import { Database as DB } from '@/lib/database.types';

declare global {
  type Database = DB;
  type TBookings = DB['public']['Tables']['bookings']['Row'];
  type Tcourse_stduents = DB['public']['Tables']['course_students']['Row'];
  type Tcourses = DB['public']['Tables']['courses']['Row'];
  type Tattendance = DB['public']['Tables']['attendance']['Row'];
  type Tsessions = DB['public']['Tables']['sessions']['Row'];
  type Tusers = DB['public']['Tables']['users']['Row'];
}

export {};
