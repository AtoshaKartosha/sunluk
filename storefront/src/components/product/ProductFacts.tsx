import type { ProductFact, ProductFactsLabels } from "./types";

interface ProductFactsProps {
  facts: ProductFact[];
  labels: ProductFactsLabels;
}

/** Renders structured product facts as a definition list. */
export function ProductFacts({ facts, labels }: ProductFactsProps) {
  if (facts.length === 0) return null;

  return (
    <div className="border-t border-[#2c211b]/10 pt-5">
      <h3 className="text-xs font-medium tracking-widest uppercase text-[#2c211b]/60 mb-3">
        {labels.heading}
      </h3>
      <dl className="space-y-2">
        {facts.map((f, i) => (
          <div key={i} className="flex justify-between text-xs">
            <dt className="text-[#2c211b]/50 uppercase tracking-wide">{f.label}</dt>
            <dd className="text-[#2c211b] font-medium">{f.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
