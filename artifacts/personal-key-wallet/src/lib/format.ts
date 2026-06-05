import { format } from "date-fns";

export function formatCurrency(amount: number | undefined | null) {
  if (amount === undefined || amount === null) return "NPR 0";
  return "NPR " + new Intl.NumberFormat("ne-NP").format(Math.round(amount));
}

export function formatDate(dateString: string | undefined | null) {
  if (!dateString) return "N/A";
  try {
    return format(new Date(dateString), "MMM dd, yyyy");
  } catch (e) {
    return "Invalid date";
  }
}
