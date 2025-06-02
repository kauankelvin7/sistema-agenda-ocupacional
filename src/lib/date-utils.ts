
import { format, parseISO, isValid } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

const TIMEZONE = "America/Sao_Paulo";

/**
 * Formats a date to display format (DD/MM/YYYY) in São Paulo timezone
 */
export function formatDateToDisplay(date: string | number | Date): string {
  if (!date) return "";
  
  try {
    let dateObj: Date;
    
    if (typeof date === "string" && date.includes("/")) {
      const [day, month, year] = date.split("/");
      dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else if (typeof date === "string" && date.includes("-")) {
      dateObj = parseISO(date);
    } else if (typeof date === "number") {
      // Excel serial number conversion
      if (date > 100000) {
        dateObj = new Date(date);
      } else {
        dateObj = new Date((date - 25569) * 86400 * 1000);
      }
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === "string" && !isNaN(Number(date))) {
      const num = Number(date);
      if (num > 100000) {
        dateObj = new Date(num);
      } else {
        dateObj = new Date((num - 25569) * 86400 * 1000);
      }
    } else {
      return "";
    }

    if (!isValid(dateObj)) return "";

    // Convert to São Paulo timezone and format
    const zonedDate = toZonedTime(dateObj, TIMEZONE);
    return format(zonedDate, "dd/MM/yyyy");
  } catch (error) {
    return "";
  }
}

/**
 * Formats a date for input fields (YYYY-MM-DD) - ensuring no timezone shift
 */
export function formatDateForInput(date: string | number | Date): string {
  if (!date) return "";
  
  try {
    let dateObj: Date;
    
    if (typeof date === "string" && date.includes("/")) {
      const [day, month, year] = date.split("/");
      // Create date at noon to avoid timezone issues
      dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
    } else if (typeof date === "string" && date.includes("-")) {
      dateObj = parseISO(date);
    } else if (typeof date === "number") {
      if (date > 100000) {
        dateObj = new Date(date);
      } else {
        // Excel serial number - add 12 hours to avoid timezone shift
        dateObj = new Date((date - 25569) * 86400 * 1000 + (12 * 60 * 60 * 1000));
      }
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === "string" && !isNaN(Number(date))) {
      const num = Number(date);
      if (num > 100000) {
        dateObj = new Date(num);
      } else {
        // Excel serial number - add 12 hours to avoid timezone shift
        dateObj = new Date((num - 25569) * 86400 * 1000 + (12 * 60 * 60 * 1000));
      }
    } else {
      return "";
    }

    if (!isValid(dateObj)) return "";

    // Format directly without timezone conversion to avoid shifts
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    return "";
  }
}

/**
 * Converts date to ISO string maintaining São Paulo timezone
 */
export function formatDateToISO(date: string): string {
  if (!date) return "";
  
  try {
    if (date.includes("-") && date.length === 10) {
      return date;
    }
    
    if (date.includes("/")) {
      const [day, month, year] = date.split("/");
      // Create date at noon to avoid timezone issues
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
      const year_str = dateObj.getFullYear();
      const month_str = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day_str = String(dateObj.getDate()).padStart(2, '0');
      return `${year_str}-${month_str}-${day_str}`;
    }
    
    if (!isNaN(Number(date))) {
      const dateObj = new Date(Number(date));
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return date;
  } catch (error) {
    return "";
  }
}

/**
 * Gets current date in São Paulo timezone
 */
export function getCurrentDate(): Date {
  return toZonedTime(new Date(), TIMEZONE);
}

/**
 * Creates a date in São Paulo timezone
 */
export function createDateInTimezone(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  const localDate = new Date(year, month - 1, day, hour, minute);
  return fromZonedTime(localDate, TIMEZONE);
}

/**
 * Creates a date for blocking dates without timezone conversion issues - FIXED VERSION
 */
export function createDateForBlocking(dateString: string): string {
  if (!dateString) return "";
  
  try {
    // If it's already in YYYY-MM-DD format, return as is
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }
    
    // Parse YYYY-MM-DD input date directly without timezone conversion
    const dateObj = new Date(dateString + 'T12:00:00');
    if (!isValid(dateObj)) return "";
    
    // Use local date methods to avoid timezone shifts
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Error in createDateForBlocking:", error);
    return "";
  }
}

/**
 * Format date for display in blocked dates table - FIXED VERSION
 */
export function formatBlockedDateForDisplay(dateString: string): string {
  if (!dateString) return "";
  
  try {
    // Handle YYYY-MM-DD format directly without timezone conversion
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    
    // For other formats, parse with timezone at noon to avoid shifts
    const dateObj = new Date(dateString + 'T12:00:00');
    if (!isValid(dateObj)) return dateString;
    
    // Use local methods to avoid timezone shifts
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting blocked date:", error);
    return dateString;
  }
}
