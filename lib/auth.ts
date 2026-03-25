import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "pitchr_session";
const SESSION_TTL_DAYS = 14;

function getExpiresAt() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);
  return expiresAt;
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = getExpiresAt();

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt <= new Date()) {
    cookieStore.delete(SESSION_COOKIE);
    if (session) {
      await prisma.session.delete({ where: { token } });
    }
    return null;
  }

  return session.user;
}

export async function requireSession() {
  const user = await getSessionUser();

  if (user) {
    return user;
  }

  const demoUser = await prisma.user.upsert({
    where: { email: "user@pitchr.dev" },
    update: {},
    create: {
      email: "user@pitchr.dev",
      name: "Demo User",
      role: "USER",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=DemoUser",
    },
  });

  await createSession(demoUser.id);
  return demoUser;
}

export async function requireSessionOrRedirect() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/");
  }
  return user;
}
