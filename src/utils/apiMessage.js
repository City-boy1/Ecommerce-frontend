// Pull a readable message out of an axios error, with a fallback.
export default function apiMessage(error, fallback = "Something went wrong. Please try again.") {
  return error?.response?.data?.message || fallback;
}