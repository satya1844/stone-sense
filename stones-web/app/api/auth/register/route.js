import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getUsers, saveUsers, hashPassword, createSession } from "@/lib/auth";

export async function POST(req) {
  const body = await req.json();
  const { name, username, password, contact } = body || {};
  if (!name || !username || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const users = await getUsers();
  if (users.some((u) => u.username === username)) {
    return NextResponse.json({ error: "Username already exists" }, { status: 409 });
  }
  const user = {
    id: randomUUID(),
    name,
    username,
    contact: contact ?? "",
    password: hashPassword(password),
    role: "patient",
  };
  users.push(user);
  await saveUsers(users);
  await createSession(user);
  return NextResponse.json({ id: user.id, name: user.name, username: user.username });
}
