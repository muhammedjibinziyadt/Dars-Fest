"use server";

import { festoryUsersCol, festoryPostsCol, festoryCommentsCol, docsToData } from "@/lib/models";
import { adminDb } from "@/lib/firebase-admin";
import type { FestoryUser, FestoryPost } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function getFestoryAdminUsers() {
  const [usersSnap, postsSnap] = await Promise.all([
    festoryUsersCol.orderBy("createdAt", "desc").get(),
    festoryPostsCol.get(),
  ]);

  const users = docsToData<FestoryUser>(usersSnap);
  const posts = docsToData<FestoryPost>(postsSnap);

  const enrichedUsers = users.map((user) => {
    const postCount = posts.filter((p) => p.userId === user.id).length;
    return {
      ...user,
      postCount,
    };
  });

  return enrichedUsers;
}

export async function toggleFestoryUserBan(userId: string) {
  const doc = await festoryUsersCol.doc(userId).get();
  if (!doc.exists) return { error: "User not found" };

  const user = doc.data() as FestoryUser;
  const newIsBanned = !user.isBanned;

  await festoryUsersCol.doc(userId).update({ isBanned: newIsBanned });

  revalidatePath("/admin/festory");
  return { success: true, isBanned: newIsBanned };
}

export async function getFestoryAdminPosts() {
  const snap = await festoryPostsCol.orderBy("createdAt", "desc").get();
  return docsToData<FestoryPost>(snap);
}

export async function deleteFestoryPostAdmin(postId: string) {
  const batch = adminDb.batch();

  batch.delete(festoryPostsCol.doc(postId));

  const commentsSnap = await festoryCommentsCol.where("postId", "==", postId).get();
  commentsSnap.docs.forEach((doc) => batch.delete(doc.ref));

  await batch.commit();

  revalidatePath("/admin/festory");
  return { success: true };
}
