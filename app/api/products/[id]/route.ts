import { NextResponse } from 'next/server';
import { updateProduct, deleteProduct } from '@/lib/notion';

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const data = await req.json();      // Product sin id
    const ok = await updateProduct({ ...data, id: params.id });
    if (!ok) throw new Error('Update failed');
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const ok = await deleteProduct(params.id);
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: 'Delete failed' }, { status: 500 });
} 