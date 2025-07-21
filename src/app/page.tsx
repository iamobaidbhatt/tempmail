import MailVeil from '@/components/mail-veil';
import { Suspense } from 'react';
import Loading from './loading';

export default function Home() {
  return (
    <main>
      <Suspense fallback={<Loading />}>
        <MailVeil />
      </Suspense>
    </main>
  );
}
