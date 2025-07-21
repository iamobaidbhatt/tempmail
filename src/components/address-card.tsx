'use client';

import { useState } from 'react';
import { Home, Loader2, Wand2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getRandomAddress } from '@/lib/actions';
import type { Address } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { countries } from '@/lib/countries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from './ui/scroll-area';

export function AddressCard() {
  const [address, setAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('random');
  const { toast } = useToast();

  const handleGenerateAddress = async () => {
    setIsLoading(true);
    setAddress(null);

    const country = selectedCountry === 'random' ? undefined : selectedCountry;
    const result = await getRandomAddress({ country });

    setIsLoading(false);
    if (result.error) {
      toast({
        title: 'Address Generation Failed',
        description: result.error,
        variant: 'destructive',
      });
    } else if (result.address) {
      setAddress(result.address);
    }
  };

  const AddressDisplay = () => {
    if (!address) return null;
    return (
      <div className="text-sm text-foreground/90 font-mono">
        <p>{address.street}</p>
        <p>{address.city}, {address.state} {address.postalCode}</p>
        <p>{address.country}</p>
      </div>
    );
  };
  
  const LoadingSkeleton = () => (
    <div className="space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );


  return (
    <Card className="bg-transparent border-none shadow-none">
      <CardHeader className="p-0 mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
              <Home className="w-5 h-5 text-primary shrink-0" />
          </div>
          <div>
              <CardTitle className="text-base">Address Generator</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
          <div className="flex items-center gap-2 mb-3">
            <Select onValueChange={setSelectedCountry} defaultValue="random">
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-72">
                    <SelectItem value="random">Random Country</SelectItem>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
            </Select>
            <Button onClick={handleGenerateAddress} disabled={isLoading} variant="secondary" size="icon" className="shrink-0">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                <span className="sr-only">Generate</span>
            </Button>
          </div>
          {(address || isLoading) && (
            <div className="p-3 rounded-lg bg-card border">
              {isLoading && <LoadingSkeleton />}
              {address && <AddressDisplay />}
            </div>
          )}
      </CardContent>
    </Card>
  );
}
