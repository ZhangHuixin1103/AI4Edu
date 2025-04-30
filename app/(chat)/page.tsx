import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { Chat } from '@/components/chat';
import { defaultModel } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';

import { auth } from '../(auth)/auth';

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect('/api/auth/guest');
  }

  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('Llama-3.3');

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          selectedChatModel={defaultModel}
          selectedVisibilityType="private"
          isReadonly={false}
          session={session}
        />
        <DataStreamHandler id={id} />
      </>
    );
  }

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        selectedChatModel={modelIdFromCookie.value}
        selectedVisibilityType="public"
        isReadonly={false}
        session={session}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
