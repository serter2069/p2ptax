// Re-exports the client "My Requests" screen so specialist-mode users
// (isSpecialist=true, role=CLIENT) can access their own requests from the
// specialist tab group without duplicating code.
export { default } from "@/app/(tabs)/requests";
