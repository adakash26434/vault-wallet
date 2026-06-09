import { format } from "date-fns";

export function formatCurrency(amount: number | undefined | null) {
  if (amount === undefined || amount === null) return "Rs. 0";
  return "Rs. " + new Intl.NumberFormat("en-IN").format(Math.round(amount));
}

export function formatDate(dateString: string | undefined | null) {
  if (!dateString) return "N/A";
  try {
    return format(new Date(dateString), "MMM dd, yyyy");
  } catch (e) {
    return "Invalid date";
  }
}
