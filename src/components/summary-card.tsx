'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getSummary } from '@/lib/actions';

interface SummaryCardProps {
  textBody: string;
}

export function SummaryCard({ textBody }: SummaryCardProps) {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSummarize = async () => {
    setIsLoading(true);
    setError('');
    setSummary('');

    const result = await getSummary(textBody);

    setIsLoading(false);
    if (result.error) {
      setError(result.error);
      toast({
        title: 'Summarization Failed',
        description: result.error,
        variant: 'destructive',
      });
    } else if (result.summary) {
      setSummary(result.summary);
      toast({
        title: 'Summary Generated',
        description: 'AI has successfully summarized the email.',
      });
    }
  };

  return (
    <Card className="bg-gradient-to-br from-secondary/50 to-secondary/20 border-border/80">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="w-6 h-6 text-primary shrink-0" />
             </div>
             <div>
                <CardTitle className="text-lg">AI-Powered Summary</CardTitle>
                <CardDescription>Get the gist of long emails in seconds.</CardDescription>
             </div>
           </div>
          <Button onClick={handleSummarize} disabled={isLoading} variant="secondary">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Summarize Email'
            )}
          </Button>
        </div>
      </CardHeader>
      {(summary || error || isLoading) && (
        <CardContent>
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p>The AI is reading the email and crafting a summary...</p>
            </div>
          )}
          {summary && <p className="text-sm text-foreground/90 whitespace-pre-wrap">{summary}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      )}
    </Card>
  );
}
