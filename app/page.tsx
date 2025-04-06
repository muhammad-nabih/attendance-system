import { redirect } from 'next/navigation';

import { LandingPage } from '@/components/landing-page';

export default async function HomePage() {

  return <LandingPage />;
}
