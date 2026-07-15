import { Card } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="max-w-3xl animate-pulse">
      <div className="mb-6">
        <div className="h-7 w-48 rounded bg-zinc-200" />
        <div className="mt-2 h-4 w-72 rounded bg-zinc-100" />
      </div>
      <Card className="mb-4">
        <div className="h-4 w-1/3 rounded bg-zinc-200" />
        <div className="mt-3 h-3 w-2/3 rounded bg-zinc-100" />
        <div className="mt-2 h-3 w-1/2 rounded bg-zinc-100" />
      </Card>
      <Card className="mb-4">
        <div className="h-4 w-1/4 rounded bg-zinc-200" />
        <div className="mt-3 h-3 w-3/4 rounded bg-zinc-100" />
        <div className="mt-2 h-3 w-2/3 rounded bg-zinc-100" />
      </Card>
      <Card>
        <div className="h-4 w-1/3 rounded bg-zinc-200" />
        <div className="mt-3 h-3 w-1/2 rounded bg-zinc-100" />
      </Card>
    </div>
  );
}
