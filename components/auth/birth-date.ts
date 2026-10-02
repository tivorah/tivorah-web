import { toDateValue } from "../ui/date-field";

// Date-of-birth rules shared by web sign-up screens; they match the mobile app
// (BirthDateField + SignupProfileStep): 1900 to today, opening about 25 years
// back, and 18+ only. The API still enforces the age rule itself.
export function birthDateProps() {
  const today = new Date();
  return {
    label: "Date of birth",
    placeholder: "Choose your date of birth",
    requiredMessage: "Choose your date of birth",
    min: "1900-01-01",
    max: toDateValue(today),
    openTo: toDateValue(new Date(today.getFullYear() - 25, today.getMonth(), 1)),
    validate: (value: string) => {
      const [year, month, day] = value.split("-").map(Number);
      const cutoff = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
      return new Date(year, month - 1, day) <= cutoff ? "" : "You must be 18 or older to use Tivorah";
    },
  };
}
