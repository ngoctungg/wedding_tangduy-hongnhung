let dbInitialized = false;

async function ensureDb(db) {
  if (dbInitialized) return;
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`
    )
    .run();
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC)`
    )
    .run();
  dbInitialized = true;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/comments') {
      try {
        await ensureDb(env.DB);
      } catch (err) {
        console.error('Database init error:', err);
      }

      if (request.method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT id, name, message, created_at AS createdAt FROM comments ORDER BY created_at DESC'
        ).all();
        return Response.json(results || [], {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store, must-revalidate',
          },
        });
      }

      if (request.method === 'DELETE') {
        const pin = request.headers.get('x-admin-pin') || 
          (request.headers.get('authorization')?.startsWith('Bearer ') ? request.headers.get('authorization').slice(7) : '');
        const expectedPin = env.ADMIN_PIN || '281126';
        if (!pin || pin !== expectedPin) {
          return Response.json({ error: 'Mã PIN quản trị không chính xác.' }, { status: 401 });
        }
        const id = url.searchParams.get('id');
        if (!id) return Response.json({ error: 'Thiếu ID lời chúc cần xoá.' }, { status: 400 });

        const res = await env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(id).run();
        if (res.meta.changes === 0) {
          return Response.json({ error: 'Không tìm thấy lời chúc.' }, { status: 404 });
        }
        return Response.json({ success: true, id }, { status: 200 });
      }

      if (request.method === 'POST') {
        try {
          const body = await request.json();
          const name = typeof body?.name === 'string' ? body.name.trim() : '';
          const message = typeof body?.message === 'string' ? body.message.trim() : '';

          if (!name || !message || name.length > 500 || message.length > 10000) {
            return Response.json(
              { error: 'Vui lòng nhập tên và lời chúc hợp lệ.' },
              { status: 400 }
            );
          }

          const comment = {
            id: crypto.randomUUID(),
            name,
            message,
            createdAt: new Date().toISOString(),
          };

          await env.DB.prepare(
            'INSERT INTO comments (id, name, message, created_at) VALUES (?, ?, ?, ?)'
          )
            .bind(comment.id, comment.name, comment.message, comment.createdAt)
            .run();

          return Response.json(comment, { status: 201 });
        } catch {
          return Response.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
        }
      }

      return new Response('Method Not Allowed', { status: 405 });
    }

    if (url.pathname === '/admin' || url.pathname === '/admin/') {
      url.pathname = '/admin.html';
      return env.ASSETS.fetch(new Request(url.toString(), request));
    }
    return env.ASSETS.fetch(request);
  },
};
