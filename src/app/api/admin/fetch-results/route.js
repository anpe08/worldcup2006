import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { requireAdmin } from '@/lib/adminAuth';

function runScript(scriptPath, env) {
  return new Promise((resolve) => {
    const chunks = [];
    const child = spawn(process.execPath, [scriptPath], { cwd: process.cwd(), env });
    child.stdout.on('data', d => chunks.push(d.toString()));
    child.stderr.on('data', d => chunks.push(d.toString()));
    const timer = setTimeout(() => {
      child.kill();
      resolve({ ok: false, log: chunks.join('') + '\n[timeout after 30s]' });
    }, 30_000);
    child.on('close', code => {
      clearTimeout(timer);
      resolve({ ok: code === 0, log: chunks.join('') });
    });
  });
}

export async function POST(request) {
  const deny = requireAdmin(request);
  if (deny) return deny;

  const env = { ...process.env };
  const [results, goalscorers, groups] = await Promise.all([
    runScript(path.join(process.cwd(), 'scripts', 'fetch-results.mjs'), env),
    runScript(path.join(process.cwd(), 'scripts', 'fetch-goalscorers.mjs'), env),
    runScript(path.join(process.cwd(), 'scripts', 'fetch-groups.mjs'), env),
  ]);

  const ok = results.ok && goalscorers.ok && groups.ok;
  const log = `--- Match Results ---\n${results.log}\n--- Goalscorers ---\n${goalscorers.log}\n--- Group Rankings ---\n${groups.log}`;
  return NextResponse.json({ ok, log }, { status: ok ? 200 : 500 });
}
