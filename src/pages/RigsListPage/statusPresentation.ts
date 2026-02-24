export type StatusValue = string | boolean | null | undefined;

export function getStatusClass(value: StatusValue, type: "boolean" | "state"): "ok" | "error" | "warning" {
  if (type === "boolean") {
    return value ? "ok" : "error";
  }

  if (type === "state" && typeof value === "string") {
    return value.toLowerCase() === "normal" || value.toLowerCase() === "closed" ? "ok" : "error";
  }

  return "warning";
}

export function getStatusIcon(key: string, value: StatusValue): string {
  switch (key) {
    case "bypass_state":
      return value === "closed" ? "pi pi-lock" : "pi pi-unlock";
    case "drive_state":
      return value === "normal" ? "pi pi-cog" : "pi pi-exclamation-triangle";
    case "daily_maintenance":
      return "pi pi-calendar";
    case "weekly_maintenance":
      return "pi pi-calendar-clock";
    case "monthly_maintenance":
      return "pi pi-moon";
    case "semiannual_maintenance":
      return "pi pi-sync";
    case "annual_maintenance":
      return "pi pi-star";
    default:
      return "pi pi-info-circle";
  }
}

export function formatStatusValue(value: StatusValue): string {
  if (typeof value === "boolean") {
    return value ? "Выполнено" : "Требуется";
  }

  if (typeof value === "string") {
    switch (value.toLowerCase()) {
      case "closed":
        return "Закрыт";
      case "open":
        return "Открыт";
      case "normal":
        return "Норма";
      case "error":
        return "Авария";
      default:
        return value;
    }
  }

  return String(value);
}
