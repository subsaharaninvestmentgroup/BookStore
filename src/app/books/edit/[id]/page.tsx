
import { BookForm } from '@/components/dashboard/book-form';
import DashboardPage from '@/app/page';

export default function EditBookPage({ params }: { params: { id: string } }) {
  return (
    <DashboardPage>
        <BookForm bookId={params.id} />
    </DashboardPage>
  );
}
