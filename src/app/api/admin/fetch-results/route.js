import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST() {
  const scriptPath = path.join(process.cwd(), 'scripts', 'fetch-results.mjs');
  const env = { ...process.env };

  return new Promise(resolve => {
    const chunks = [];
    const child = spawn(process.execPath, [scriptPath], {
      cwd: process.cwd(),
      env,
    });

    child.stdout.on('data', d => chunks.push(d.toString()));
    child.stderr.on('data', d => chunks.push(d.toString()));

    const timer = setTimeout(() => {
      child.kill();
      resolve(NextResponse.json({ ok: false, log: chunks.join('') + '\n[timeout after 30s]' }, { status: 500 }));
    }, 30_000);

    child.on('close', code => {
      clearTimeout(timer);
      resolve(NextResponse.json({ ok: code === 0, log: chunks.join('') }, { status: code === 0 ? 200 : 500 }));
    });
  });
}
