import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { AttendanceRecord } from '../api/attendanceApi';

interface AttendanceState {
  selectedCourseId: string | null;
  selectedDate: string | null;
  records: AttendanceRecord[];
}

const initialState: AttendanceState = {
  selectedCourseId: null,
  selectedDate: null,
  records: [],
};

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    setSelectedCourse: (state, action: PayloadAction<string>) => {
      state.selectedCourseId = action.payload;
    },
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload;
    },
    setAttendanceRecords: (state, action: PayloadAction<AttendanceRecord[]>) => {
      state.records = action.payload;
    },
  },
});

export const { setSelectedCourse, setSelectedDate, setAttendanceRecords } = attendanceSlice.actions;
export default attendanceSlice.reducer;
