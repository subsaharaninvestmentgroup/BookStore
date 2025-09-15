import { redirect } from 'next/navigation';

export default function CatchAllPage() {
  // Redirect all unmatched routes to the frontstore
  redirect('/store');
}