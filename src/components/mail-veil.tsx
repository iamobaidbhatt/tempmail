
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Email, EmailMessage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Mail, Copy, RefreshCw, FilePlus2, Inbox, FileText, Timer, Menu, Home, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { SummaryCard } from './summary-card';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import Link from 'next/link';
import { Switch } from './ui/switch';
import { Label } from './ui/label';


const API_BASE_URL_MAILGW = 'https://api.mail.gw';
const EMAIL_LIFESPAN_MINUTES = 20;

function generateRandomString(length: number): string {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export default function MailVeil() {
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [apiToken, setApiToken] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  const { toast } = useToast();
  const emailCountRef = useRef(0);
  const notificationSoundRef = useRef<HTMLAudioElement>(null);

  const playSound = useCallback(() => {
    if (soundEnabled && notificationSoundRef.current) {
      notificationSoundRef.current.currentTime = 0;
      notificationSoundRef.current.play().catch(error => {
        console.error("Audio play failed. User interaction might be required.", error);
      });
    }
  }, [soundEnabled]);

  const generateNewEmail = useCallback(async () => {
    setIsGenerating(true);
    setCurrentEmail(null);
    setEmails([]);
    setSelectedEmail(null);
    setApiToken(null);
    setAccountId(null);
    setExpiresAt(null);
    setTimeLeft('');
    emailCountRef.current = 0;

    try {
      const domainsRes = await fetch(`${API_BASE_URL_MAILGW}/domains`);
      if (!domainsRes.ok) throw new Error('Failed to fetch domains.');
      const domainsData = await domainsRes.json();
      
      const availableDomains: { domain: string }[] = domainsData['hydra:member'];
      if (!availableDomains || availableDomains.length === 0) {
        throw new Error('No available domains.');
      }
      
      const domain = availableDomains[Math.floor(Math.random() * availableDomains.length)].domain;

      const randomUser = generateRandomString(6);
      const newAddress = `${randomUser}@${domain}`;
      const password = generateRandomString(12);

      const accountRes = await fetch(`${API_BASE_URL_MAILGW}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: newAddress,
          password: password
        }),
      });
      if (!accountRes.ok) throw new Error('Failed to create account.');
      const accountData = await accountRes.json();
      setCurrentEmail(accountData.address);
      setAccountId(accountData.id);

      const newExpiresAt = new Date(new Date().getTime() + EMAIL_LIFESPAN_MINUTES * 60 * 1000);
      setExpiresAt(newExpiresAt);

      const tokenRes = await fetch(`${API_BASE_URL_MAILGW}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: accountData.address,
          password: password
        }),
      });
      if (!tokenRes.ok) throw new Error('Failed to get token.');
      const tokenData = await tokenRes.json();
      setApiToken(tokenData.token);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error Generating Email',
        description: 'Could not generate a new email address. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [toast]);
  
  const fetchInbox = useCallback(async () => {
    if (!currentEmail || !apiToken) return;
    setIsRefreshing(true);
    try {
      const response = await fetch(`${API_BASE_URL_MAILGW}/messages`, {
        headers: { 'Authorization': `Bearer ${apiToken}` }
      });
      if (!response.ok) return;
      const data = await response.json();
      const formattedEmails: Email[] = data['hydra:member'].map((email: any) => ({
        id: email.id,
        from: email.from?.address || 'Unknown Sender',
        subject: email.subject,
        date: email.createdAt,
      }));

      if (formattedEmails.length > emailCountRef.current && emailCountRef.current > 0) {
        playSound();
      }
      emailCountRef.current = formattedEmails.length;
      setEmails(formattedEmails);

    } catch (error) {
      // Fail silently on refresh
    } finally {
      setIsRefreshing(false);
    }
  }, [currentEmail, apiToken, playSound]);


  useEffect(() => {
    generateNewEmail();
  }, [generateNewEmail]);

  useEffect(() => {
    if (expiresAt) {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const distance = expiresAt.getTime() - now;

        if (distance < 0) {
          clearInterval(timer);
          setTimeLeft('Expired');
          toast({
            title: 'Email Expired',
            description: 'Generating a new temporary email address.',
          });
          generateNewEmail();
        } else {
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [expiresAt, toast, generateNewEmail]);


  useEffect(() => {
    if (currentEmail && apiToken) {
      fetchInbox(); // Initial fetch
      const interval = setInterval(fetchInbox, 3000); 
      return () => clearInterval(interval);
    }
  }, [currentEmail, apiToken, fetchInbox]);

  const handleSelectEmail = async (id: string) => {
    if (!currentEmail || !apiToken) return;
    setIsLoadingEmail(true);
    setSelectedEmail(null);
    try {
      const response = await fetch(`${API_BASE_URL_MAILGW}/messages/${id}`, {
        headers: { 'Authorization': `Bearer ${apiToken}` }
      });
      if (!response.ok) throw new Error('Failed to fetch email content.');
      const data = await response.json();
      const emailMessage: EmailMessage = {
        id: data.id,
        from: data.from?.address || 'Unknown Sender',
        to: data.to.map((t: any) => t.address).join(', '),
        subject: data.subject,
        date: data.createdAt,
        attachments: data.attachments,
        body: data.text,
        textBody: data.text,
        htmlBody: data.html && data.html.length > 0 ? data.html[0] : `<p>${data.text?.replace(/\n/g, '<br />')}</p>`,
      };
      setSelectedEmail(emailMessage);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not fetch email content.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const handleCopy = () => {
    if (!currentEmail) return;
    navigator.clipboard.writeText(currentEmail);
    toast({
      description: "Email address copied to clipboard!",
    });
  };

  const InboxSkeleton = () => (
    <div className="space-y-2 p-2">
      {[...Array(5)].map((_, i) => (
         <div key={i} className="p-3 rounded-lg space-y-2">
           <Skeleton className="h-4 w-2/3" />
           <Skeleton className="h-4 w-1/2" />
           <Skeleton className="h-3 w-1/4 mt-1" />
         </div>
      ))}
    </div>
  );

  const emailGeneratorSection = (
    <div className="p-4 space-y-3 border-b border-border/80">
      <div className="flex justify-between items-center gap-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Your Temporary Email</h2>
        {timeLeft && (
          <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full">
            <Timer className="w-3.5 h-3.5" />
            <span>{timeLeft}</span>
          </div>
        )}
      </div>
      <div className="flex flex-col items-start gap-3">
        {isGenerating ? (
          <Skeleton className="h-11 rounded-lg w-full" />
        ) : (
          <div className="flex items-center gap-2 p-1 pl-3 rounded-lg border bg-card w-full">
            <span className="font-mono text-sm text-primary font-semibold truncate" title={currentEmail || ''}>
              {currentEmail}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 shrink-0" onClick={handleCopy} disabled={!currentEmail}>
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy email address</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
       <div className='flex items-center justify-between'>
          <Button className="w-full mr-2" onClick={generateNewEmail} disabled={isGenerating}>
            <FilePlus2 className="mr-2 h-4 w-4" /> New Address
          </Button>
          <div className="flex items-center space-x-2">
            <Switch id="sound-mode" checked={soundEnabled} onCheckedChange={setSoundEnabled} />
            <Label htmlFor="sound-mode"><Bell className='w-4 h-4'/></Label>
          </div>
        </div>
    </div>
  );


  const inboxList = (
    <div className="flex flex-col flex-1">
      <div className="p-4 border-b border-border/80 flex justify-between items-center sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Inbox className="h-5 w-5" />
          Inbox
        </h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={fetchInbox} disabled={isRefreshing || !currentEmail}>
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Refresh Inbox</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="p-2 space-y-1.5 overflow-y-auto flex-1">
        {isRefreshing && emails.length === 0 ? <InboxSkeleton /> : null}
        {!isRefreshing && emails.length === 0 && (
          <div className="text-center py-20 text-muted-foreground text-sm flex flex-col items-center justify-center h-full">
            <Inbox className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50"/>
            <p className='font-medium'>Waiting for emails...</p>
            <p className='max-w-xs mx-auto'>Send an email to your address above and it will appear here.</p>
          </div>
        )}
        {emails.map((email) => (
          <Card
            key={email.id}
            className={cn(
              "cursor-pointer hover:bg-card/80 transition-colors duration-200 shadow-none border border-transparent",
              selectedEmail?.id === email.id && "border-primary bg-card"
            )}
            onClick={() => handleSelectEmail(email.id.toString())}
          >
            <CardContent className="p-3">
              <div className="flex justify-between items-start">
                <p className="font-semibold text-sm truncate pr-4 text-foreground">
                  {email.from}
                </p>
                  {selectedEmail?.id === email.id && <span className="w-2 h-2 rounded-full bg-primary inline-block flex-shrink-0 mt-1.5"></span>}
              </div>
              <p className="text-sm truncate text-muted-foreground">{email.subject}</p>
              <p className="text-xs text-muted-foreground mt-1">{format(new Date(email.date), "Pp")}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const emailView = (
    <>
      {isLoadingEmail && (
        <div className="p-6 space-y-6 animate-pulse">
          <Skeleton className="h-8 w-3/4 rounded-lg" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-5 w-1/4 rounded-md" />
            <Skeleton className="h-5 w-1/3 rounded-md" />
          </div>
          <Separator />
          <div className="space-y-3 mt-4">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
          </div>
        </div>
      )}

      {!isLoadingEmail && !selectedEmail && (
         <div className="flex-col h-full hidden md:flex items-center justify-center text-center p-8 text-muted-foreground bg-secondary/10">
           <FileText className="w-16 h-16 mb-4 text-muted-foreground/30" />
           <h2 className="text-xl font-semibold">Select an email to view</h2>
           <p className="max-w-xs mt-1 text-sm">Choose an email from the inbox to read its content and generate an AI summary.</p>
         </div>
      )}

      {!isLoadingEmail && selectedEmail && (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{selectedEmail.subject}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <div>From: <span className="font-medium text-foreground">{selectedEmail.from}</span></div>
              <div>To: <span className="font-medium text-foreground">{selectedEmail.to}</span></div>
              <span>{format(new Date(selectedEmail.date), "PPP p")}</span>
            </div>
          </div>
          
          <div className="space-y-6">
            <SummaryCard textBody={selectedEmail.textBody} />
          </div>

          <Card>
            <CardHeader>
                <h3 className="text-lg font-semibold">Email Content</h3>
            </CardHeader>
            <CardContent>
                <div
                    className="prose dark:prose-invert max-w-none text-sm prose-p:my-2 prose-blockquote:border-primary prose-blockquote:text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody || '' }}
                />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );

  return (
    <TooltipProvider>
      <audio ref={notificationSoundRef} src="/sounds/notification.mp3" preload="auto" />
      <div className="flex flex-col h-screen bg-background text-foreground font-sans">
        <header className="flex items-center justify-between gap-4 p-3 border-b border-border/80 shrink-0 bg-background/90 backdrop-blur-sm sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <Mail className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold tracking-tight">Mail Veil</h1>
            </div>

            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Open Tools</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 flex flex-col w-full max-w-sm">
                  <SheetHeader className="p-4 border-b">
                      <SheetTitle className="flex items-center gap-3">
                        <span className="text-xl font-bold tracking-tight">Mail Veil</span>
                      </SheetTitle>
                  </SheetHeader>
                  <div className="overflow-y-auto p-4">
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href="/address-generator">
                        <Home className="mr-2 h-4 w-4" />
                        Address Generator
                      </Link>
                    </Button>
                  </div>
                </SheetContent>
            </Sheet>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(350px,450px)_1fr] flex-1">
          <aside className="hidden md:flex flex-col border-r">
            {emailGeneratorSection}
            <div className="p-4 border-b">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/address-generator">
                  <Home className="mr-2 h-4 w-4" />
                  Address Generator
                </Link>
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {inboxList}
            </div>
          </aside>

          <main className="flex flex-col overflow-hidden">
             <div className="md:hidden flex flex-col flex-1 overflow-y-auto">
              {emailGeneratorSection}
              { selectedEmail === null ? inboxList : emailView}
            </div>
            <div className="hidden md:flex flex-1 overflow-y-auto">
              {emailView}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

    