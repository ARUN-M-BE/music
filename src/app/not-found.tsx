import Link from "next/link";
import { Music2, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-full max-w-md p-8 rounded-3xl bg-card border border-border shadow-2xl space-y-6">
        <div className="size-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
          <Music2 className="size-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-display font-bold text-foreground">404 - Not Found</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            The page or resource you are looking for does not exist or has been moved.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 h-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-transform active:scale-95 shadow-md"
        >
          <ArrowLeft className="size-3.5" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}
