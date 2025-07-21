import { AddressCard } from "@/components/address-card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import Link from "next/link";

export default function AddressGeneratorPage() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-sans">
       <header className="flex items-center justify-between gap-4 p-3 border-b border-border/80 shrink-0 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/">
                        <Mail className="h-6 w-6 text-primary" />
                        <span className="sr-only">Back to Mail</span>
                    </Link>
                </Button>
                <h1 className="text-xl font-bold tracking-tight">Address Generator</h1>
            </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center">
            <div className="w-full max-w-md">
                <AddressCard />
            </div>
        </main>
    </div>
  );
}
