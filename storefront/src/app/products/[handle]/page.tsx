import { permanentRedirect } from "next/navigation";

interface Props {
  params: Promise<{ handle: string }>;
}

export default async function OldProductDetailPage({ params }: Props) {
  const { handle } = await params;
  permanentRedirect(`/ru/products/${handle}`);
}
