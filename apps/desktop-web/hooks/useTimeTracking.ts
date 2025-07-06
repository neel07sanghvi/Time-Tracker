import { useState, useEffect } from "react";
import { database } from "@time-tracker/api";
import { TimeEntry } from "@time-tracker/db";

export const useTimeTracking = (employeeId: string) => {
  const [activeTimeEntry, setActiveTimeEntry] = useState<TimeEntry | null>(
    null
  );
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [timer, setTimer] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadActiveTimeEntry();
    loadTodayEntries();
  }, [employeeId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimeEntry) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimeEntry]);

  const loadActiveTimeEntry = async () => {
    try {
      const { data, error } = await database.getActiveTimeEntry(employeeId);
      if (data && !error) {
        setActiveTimeEntry(data);
        const startTime = new Date(data.started_at).getTime();
        const now = new Date().getTime();
        setTimer(Math.floor((now - startTime) / 1000));
      } else {
        setActiveTimeEntry(null);
        setTimer(0);
      }
    } catch (error) {
      console.error("Error loading active time entry:", error);
    }
  };

  const loadTodayEntries = async () => {
    try {
      const { data, error } = await database.getTodayTimeEntries(employeeId);
      if (data && !error) {
        setTodayEntries(data);
      }
    } catch (error) {
      console.error("Error loading today's entries:", error);
    }
  };

  const startTimer = async (projectId: string, taskId: string) => {
    setLoading(true);
    try {
      const { data, error } = await database.startTimeEntry(
        employeeId,
        projectId,
        taskId
      );
      if (data && !error) {
        setActiveTimeEntry(data);
        setTimer(0);
        await loadTodayEntries();
        return { success: true };
      } else {
        return { success: false, error };
      }
    } catch (error) {
      console.error("Error starting timer:", error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const stopTimer = async () => {
    setLoading(true);
    try {
      const { data, error } = await database.stopTimeEntry(employeeId);
      if (data && !error) {
        setActiveTimeEntry(null);
        setTimer(0);
        await loadTodayEntries();
        return { success: true };
      } else {
        return { success: false, error };
      }
    } catch (error) {
      console.error("Error stopping timer:", error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const calculateTodayTotal = () => {
    return todayEntries.reduce((total, entry) => {
      if (entry.duration) {
        return total + entry.duration;
      }
      return total;
    }, 0);
  };

  return {
    activeTimeEntry,
    todayEntries,
    timer,
    loading,
    startTimer,
    stopTimer,
    calculateTodayTotal,
    refreshData: () => {
      loadActiveTimeEntry();
      loadTodayEntries();
    },
  };
};
