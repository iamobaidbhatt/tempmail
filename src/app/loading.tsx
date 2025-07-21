import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, FileText, Inbox } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="flex items-center gap-2 p-4 border-b shrink-0">
        <Mail className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Mail Veil</h1>
      </header>

      <div className="p-4 space-y-3 border-b">
        <Skeleton className="h-10 rounded-lg w-full max-w-md" />
        <div className="flex items-center gap-2">
           <Skeleton className="h-9 w-24" />
           <Skeleton className="h-9 w-36" />
        </div>
      </div>

      <div className="grid md:grid-cols-[350px_1fr] flex-1 overflow-hidden">
        <div className="border-r flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Inbox className="h-5 w-5" />
              Inbox
            </h2>
          </div>
          <div className="p-4 space-y-2 overflow-y-auto">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-3">
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground bg-muted/20">
            <FileText className="w-16 h-16 mb-4" />
            <h2 className="text-xl font-semibold">Select an email</h2>
            <p className="max-w-xs">Choose an email from the inbox to read its content and generate an AI summary.</p>
        </div>
      </div>
    </div>
  );
}
