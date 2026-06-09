import { permanentRedirect } from "next/navigation";

export default function OldProductsPage() {
  permanentRedirect("/ru/products");
}
