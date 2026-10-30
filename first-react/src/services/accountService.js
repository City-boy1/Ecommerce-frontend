import { axiosPrivate } from "../api/axios";

// Buyer -> seller application. The server validates, creates the Store, upgrades
// the role and returns { user, store }. See README-EXTENSION.md section 8.
export const applyAsSeller = (payload) => axiosPrivate.post("/sellers/apply", payload).then((r) => r.data);