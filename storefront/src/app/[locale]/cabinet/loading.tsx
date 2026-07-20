import SiteHeader from "@/components/landing/SiteHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-[#2c211b]/10 rounded-none ${className ?? ""}`}
    />
  );
}

export default function CabinetLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f4ebe6] text-[#2c211b] antialiased">
      <SiteHeader />
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-10 sm:py-16">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
      
        {/* Profile Card skeleton */}
        <section className="mb-10">
          <Skeleton className="h-3 w-24 mb-4" />
          <div className="bg-white rounded-none border border-[#2c211b]/8 p-6 sm:p-8 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <Skeleton className="w-5 h-5 mt-0.5 shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Skeleton className="w-5 h-5 mt-0.5 shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-44" />
                </div>
              </div>
            </div>
          </div>
        </section>
      
        {/* Orders Section skeleton */}
        <section>
          <Skeleton className="h-3 w-28 mb-4" />
          <div className="bg-white rounded-none border border-[#2c211b]/8 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2c211b]/6">
                    <th className="text-left px-6 py-4">
                      <Skeleton className="h-3 w-16" />
                    </th>
                    <th className="text-left px-6 py-4">
                      <Skeleton className="h-3 w-14" />
                    </th>
                    <th className="text-left px-6 py-4">
                      <Skeleton className="h-3 w-14" />
                    </th>
                    <th className="text-left px-6 py-4">
                      <Skeleton className="h-3 w-16" />
                    </th>
                    <th className="text-right px-6 py-4">
                      <Skeleton className="h-3 w-12 ml-auto" />
                    </th>
                    <th className="px-6 py-4">
                      <Skeleton className="h-3 w-16 ml-auto" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <tr
                      key={i}
                      className={`border-b border-[#2c211b]/4 ${i === 4 ? "border-b-0" : ""}`}
                    >
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Skeleton className="w-4 h-4" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-16 ml-auto" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-16 ml-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
      <SiteFooter />
    </div>
  );
}
