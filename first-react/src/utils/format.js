const cedi = new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" });

export const formatPrice = (value) => cedi.format(Number(value || 0));

export const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Africa/Accra",
      }).format(new Date(value))
    : "";