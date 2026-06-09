import { permanentRedirect } from "next/navigation";

export default function CheckoutSuccessPage() {
  permanentRedirect("/ru/checkout/success");
}
