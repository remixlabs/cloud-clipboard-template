import { connect, Connection } from '@planetscale/database';
import { Hono } from 'hono';

interface Bindings {
  PSCALE_HOST: string;
  PSCALE_USER: string;
  PSCALE_PASS: string;
}

interface RemixUser {
  email: string;
}

interface Config {
  host: string;
  username: string;
  password: string;
}

export const app = new Hono<{ Bindings: Bindings }>();

export async function connectDatabase(env: Bindings): Promise<Connection> {
  const config: Config = {
    host: env.PSCALE_HOST,
    username: env.PSCALE_USER,
    password: env.PSCALE_PASS,
  };
  return connect(config);
}

async function fetchRemixUser(authkey: string): Promise<string> {
  const init = {
    headers: {
      Authorization: authkey,
    },
  };
  const url = 'https://prod.remixlabs.com/a/x/profile';
  const remix_resp = await fetch(url, init);
  const remix_resp_body: RemixUser = await remix_resp.json();
  const email_id = remix_resp_body.email;
  if (!email_id) {
    throw new Error('Not authorized');
  }
  return email_id;
}

app.post('/create', async (c) => {
  const email_id = await fetchRemixUser(c.req.headers.get('Authorization')!);
  const conn = await connectDatabase(c.env);
  const bucket_id = crypto.randomUUID();
  await conn.execute('INSERT INTO buckets (user_id, bucket_id) VALUES (?,?)', [email_id, bucket_id]);
  return c.json({ success: true, message: 'Bucket created', data: {"bucket_id": bucket_id }}, 201);
});

app.post('/write/:bucketid', async (c) => {
  const conn = await connectDatabase(c.env);
  const bucket_id = c.req.param('bucketid');
  const body = await c.req.json();
  if (!body.records) {
    return c.text('Contents not found', 400);
  }
  let record_ids = [];
  for (const record of body.records) {
    let record_id = (record.record_id && record.record_id != '') ? record.record_id : crypto.randomUUID();
    await conn.execute('INSERT INTO records (bucket_id, record_id, user_id, contents) VALUES (?, ?, ?, ?)', [bucket_id, record_id, body.user, record.contents]);
    record_ids.push(record_id);
  }
  return c.json({success: true, message: `Record(s) written to bucket`, data: {record_ids: record_ids}}, 201);
});

app.get('/read_bucket/:bucketid', async (c) => {
  const conn = await connectDatabase(c.env);
  const bucket_id = c.req.param('bucketid');
  const filter_user_id = c.req.query('user_id');

  const filter_user_predicate = (filter_user_id != '')
                                ? 'AND user_id = ?'
                                : '';

  const query_params =  (filter_user_id != '')
                        ? [bucket_id, filter_user_id]
                        : [bucket_id];

  const r = await conn.execute('SELECT * FROM records WHERE bucket_id = ? ' + filter_user_predicate + ' ORDER BY bucket_id', query_params);
  return c.json({success: true, message: `Found ${r.rows.length} record(s) in bucket`, data: r.rows}, 200);
});

app.get('/read_bucket_count/:bucketid', async (c) => {
  const conn = await connectDatabase(c.env);
  const bucket_id = c.req.param('bucketid');
  const r = await conn.execute('SELECT COUNT(*) as record_count FROM records WHERE bucket_id = ?', [bucket_id]);
  return c.json({success: true, message: `Found ${r.rows[0].record_count} record(s) in bucket`, data: {record_count: r.rows[0].record_count}}, 200);
});

app.get('/read_record/:bucketid', async (c) => {
  const conn = await connectDatabase(c.env);
  const bucket_id = c.req.param('bucketid');
  const record_id = c.req.query('record_id');
  const r = await conn.execute('SELECT * FROM records WHERE bucket_id = ? AND record_id = ? ORDER BY created_at DESC LIMIT 1', [bucket_id, record_id]);
  return c.json({success: true, message: `Found ${r.rows.length} record(s)`, data: r.rows}, 200);
});

app.get('/read_records_from_id/:bucketid', async (c) => {
  const conn = await connectDatabase(c.env);
  const bucket_id = c.req.param('bucketid');
  const id = await c.req.query('id');
  const r = await conn.execute('SELECT * FROM records WHERE bucket_id = ? AND id > ?', [bucket_id, id]);
  return c.json({success: true, message: `Found ${r.rows.length} record(s)`, data: r.rows}, 200);
});

app.delete('/delete_buckets', async (c) => {
  const conn = await connectDatabase(c.env);
  const body = await c.req.json();
  await conn.transaction(async (tx) => {
    await tx.execute('DELETE FROM records WHERE bucket_id IN (?)', [body.bucket_ids]);
    await tx.execute('DELETE FROM buckets WHERE bucket_id IN (?)', [body.bucket_ids]);
  })
  return c.json({success: true, message: 'Bucket(s) deleted', data: {}}, 200);
});

app.delete('/delete_buckets_except', async (c) => {
  const conn = await connectDatabase(c.env);
  const body = await c.req.json();
  const user_id = c.req.query('user_id');
  if (user_id == '') {
    return c.text('User not found', 400);
  }
  await conn.transaction(async (tx) => {
    await tx.execute('DELETE FROM records WHERE bucket_id NOT IN (?) AND user_id = ?', [body.bucket_ids, user_id]);
    await tx.execute('DELETE FROM buckets WHERE bucket_id NOT IN (?) AND user_id = ?', [body.bucket_ids, user_id]);
  })
  return c.json({success: true, message: 'Bucket(s) deleted', data: {}}, 200);
});

app.delete('/delete_records/:bucketid', async (c) => {
  const conn = await connectDatabase(c.env);
  const bucket_id = c.req.param('bucketid');
  const body = await c.req.json();
  await conn.execute('DELETE FROM records WHERE bucket_id = ? and record_id IN (?)', [bucket_id, body.record_ids]);
  return c.json({success: true, message: 'Record(s) deleted', data: {}}, 200);
});

app.onError((err, c) => {
  console.error(err.message)
  return c.text(err.message, 500)
});

export default app;