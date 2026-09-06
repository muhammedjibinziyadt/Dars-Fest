"use server";

import { cookies } from "next/headers";
import {
  festoryUsersCol,
  festoryPostsCol,
  festoryCommentsCol,
  docsToData,
  docToData,
} from "@/lib/models";
import { adminDb } from "@/lib/firebase-admin";
import { createSessionToken, verifySessionToken, verifyFirebaseAuthToken } from "@/lib/auth";
import { FESTORY_COOKIE, SESSION_MAX_AGE } from "@/lib/config";
import type { FestoryUser, FestoryPost, FestoryComment } from "@/lib/types";
import { redirect } from "next/navigation";

export interface LoginState {
  error?: string;
  success?: boolean;
}

export async function loginWithGoogle(
  credential: string,
  phone?: string,
  teamId?: string,
  customName?: string
): Promise<LoginState> {
  try {
    let email: string | undefined;
    let name: string | undefined;
    let sub: string | undefined;
    let picture: string | undefined;

    // Try Firebase ID token verification first, fallback to standard payload
    const firebaseDecoded = await verifyFirebaseAuthToken(credential);
    if (firebaseDecoded && firebaseDecoded.email) {
      email = firebaseDecoded.email;
      name = firebaseDecoded.name;
      sub = firebaseDecoded.sub;
      picture = firebaseDecoded.picture;
    } else {
      // Try Google Auth Library fallback if applicable
      const { OAuth2Client } = await import("google-auth-library");
      const { GOOGLE_CLIENT_ID } = await import("@/lib/config");
      const client = new OAuth2Client(GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (payload?.email) {
        email = payload.email;
        name = payload.name;
        sub = payload.sub;
        picture = payload.picture;
      }
    }

    if (!email) {
      return { error: "Google verification failed" };
    }

    const snap = await festoryUsersCol.where("email", "==", email).limit(1).get();
    let festoryUser = !snap.empty ? (snap.docs[0].data() as FestoryUser) : null;
    let docId = !snap.empty ? snap.docs[0].id : "";

    // LOGIN MODE (No Phone provided)
    if (!phone) {
      if (!festoryUser) {
        return { error: "Account not found. Please Sign Up." };
      }
    }
    // SIGN UP / UPDATE MODE (Phone provided)
    else {
      const existingPhoneSnap = await festoryUsersCol.where("phoneNumber", "==", phone).limit(1).get();
      if (!existingPhoneSnap.empty) {
        const existingUser = existingPhoneSnap.docs[0].data() as FestoryUser;
        if (existingUser.email !== email) {
          return { error: "This phone number is already registered." };
        }
      }

      if (!festoryUser) {
        docId = crypto.randomUUID();
        festoryUser = {
          id: docId,
          name: customName || name || email.split("@")[0],
          email: email,
          googleId: sub,
          phoneNumber: phone,
          teamId: teamId || "General",
          image: picture,
          isBanned: false,
        };
        await festoryUsersCol.doc(docId).set(festoryUser);
      } else {
        const updates: Partial<FestoryUser> = {
          phoneNumber: phone,
        };
        if (!festoryUser.googleId && sub) updates.googleId = sub;
        if (teamId) updates.teamId = teamId;
        if (customName) updates.name = customName;
        if (!festoryUser.image && picture) updates.image = picture;

        await festoryUsersCol.doc(docId).update(updates);
        festoryUser = { ...festoryUser, ...updates };
      }
    }

    if (festoryUser.isBanned) {
      return { error: "Access Denied. You have been banned." };
    }

    const sessionPayload = {
      id: festoryUser.id,
      name: festoryUser.name,
      teamId: festoryUser.teamId,
      studentId: festoryUser.studentId || "",
      role: "festory_user",
      image: festoryUser.image,
    };

    const jwt = await createSessionToken(sessionPayload);
    const cookieStore = await cookies();
    cookieStore.set(FESTORY_COOKIE, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
  } catch (error: any) {
    console.error("Google Login Error:", error);
    return { error: "Login failed. Please try again." };
  }

  redirect("/festory/feed");
}

export async function getFestorySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(FESTORY_COOKIE)?.value;

  if (!token) return null;

  const payload = await verifySessionToken<{
    id: string;
    studentId: string;
    name: string;
    teamId: string;
    role: string;
    image?: string;
  }>(token);

  if (!payload || payload.role !== "festory_user") return null;

  if (!payload.image) {
    const doc = await festoryUsersCol.doc(payload.id).get();
    if (doc.exists) {
      const user = doc.data() as FestoryUser;
      if (user.image) {
        payload.image = user.image;
      }
    }
  }

  return payload;
}

export async function getFestoryPosts() {
  const [postsSnap, usersSnap] = await Promise.all([
    festoryPostsCol.orderBy("createdAt", "desc").limit(50).get(),
    festoryUsersCol.get(),
  ]);

  const posts = docsToData<FestoryPost>(postsSnap);
  const users = docsToData<FestoryUser>(usersSnap);
  const userMap = new Map(users.map((u) => [u.id, u]));

  return posts.map((post) => {
    const user = userMap.get(post.userId);
    return {
      id: post.id,
      userId: post.userId,
      userName: user ? user.name : post.userName,
      userImage: user ? user.image : undefined,
      userTeamId: user ? user.teamId : post.userTeamId,
      type: post.type as "text" | "image" | "audio" | "poll",
      content: post.content,
      mediaUrl: post.mediaUrl,
      likes: Array.isArray(post.likes) ? post.likes : [],
      pollOptions: Array.isArray(post.pollOptions)
        ? post.pollOptions.map((opt: any) => ({
            id: opt.id,
            text: opt.text,
            votes: Array.isArray(opt.votes) ? opt.votes : [],
          }))
        : undefined,
      commentsCount: post.commentsCount || 0,
      createdAt: new Date(post.createdAt).toISOString(),
    };
  });
}

export async function createFestoryPost(prevState: any, formData: FormData) {
  try {
    const session = await getFestorySession();
    if (!session) return { error: "Unauthorized" };

    const content = formData.get("content") as string;
    const type = formData.get("type") as "text" | "image" | "audio" | "poll";
    const file = formData.get("file") as File | null;
    const pollOptions = formData.get("pollOptions") as string | null;

    if (!content && type === "text") return { error: "Content is required" };
    if (type !== "text" && type !== "poll" && !file) return { error: "File is required for image/audio posts" };
    if (type !== "text" && type !== "poll" && file && file.size > 3 * 1024 * 1024) return { error: "File size too large (max 3MB)" };
    if (type === "poll" && !pollOptions) return { error: "Poll options are required" };

    const doc = await festoryUsersCol.doc(session.id).get();
    if (!doc.exists || (doc.data() as FestoryUser).isBanned) return { error: "You are banned from posting." };

    let mediaUrl = "";
    if (file && type !== "text" && type !== "poll") {
      try {
        const { uploadFile } = await import("@/lib/upload");
        mediaUrl = await uploadFile(file, type);
      } catch (err) {
        console.error("Upload failed", err);
        return { error: "Failed to upload media" };
      }
    }

    const postId = crypto.randomUUID();
    const newPost: FestoryPost = {
      id: postId,
      userId: session.id,
      userName: session.name,
      userTeamId: session.teamId,
      type: type || "text",
      content: content || "",
      mediaUrl: mediaUrl,
      likes: [],
      pollOptions: type === "poll" ? JSON.parse(pollOptions!) : undefined,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
    };

    await festoryPostsCol.doc(postId).set(newPost);

    return { success: true };
  } catch (error: any) {
    console.error("Post Error:", error);
    return { error: "Failed to create post" };
  }
}

export async function voteFestoryPoll(postId: string, optionId: string) {
  try {
    const session = await getFestorySession();
    if (!session) return { error: "Unauthorized" };

    const doc = await festoryPostsCol.doc(postId).get();
    if (!doc.exists) return { error: "Post not found" };

    const post = doc.data() as FestoryPost;
    if (post.type !== "poll" || !post.pollOptions) return { error: "Not a poll" };

    const pollOptions = post.pollOptions.map((o: any) => {
      const votes = Array.isArray(o.votes) ? [...o.votes] : [];
      if (o.id !== optionId) {
        const idx = votes.indexOf(session.id);
        if (idx > -1) votes.splice(idx, 1);
      } else {
        const idx = votes.indexOf(session.id);
        if (idx > -1) {
          votes.splice(idx, 1);
        } else {
          votes.push(session.id);
        }
      }
      return { ...o, votes };
    });

    await festoryPostsCol.doc(postId).update({ pollOptions });

    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Failed to vote" };
  }
}

export async function triggerAudioBomb(_soundId: string) {
  const session = await getFestorySession();
  if (!session) return { error: "Unauthorized" };

  const doc = await festoryUsersCol.doc(session.id).get();
  if (!doc.exists || (doc.data() as FestoryUser).isBanned) return { error: "Banned" };

  return { success: true };
}

export async function deleteFestoryPost(postId: string) {
  try {
    const session = await getFestorySession();
    if (!session) return { error: "Unauthorized" };

    const doc = await festoryPostsCol.doc(postId).get();
    if (!doc.exists) return { error: "Not found" };

    const post = doc.data() as FestoryPost;
    if (post.userId !== session.id) return { error: "Forbidden" };

    if (post.mediaUrl) {
      try {
        const { deleteFile } = await import("@/lib/upload");
        await deleteFile(post.mediaUrl);
      } catch (e) {}
    }

    const batch = adminDb.batch();
    batch.delete(festoryPostsCol.doc(postId));

    const commentsSnap = await festoryCommentsCol.where("postId", "==", postId).get();
    commentsSnap.docs.forEach((d) => batch.delete(d.ref));

    await batch.commit();

    return { success: true };
  } catch (e) {
    return { error: "Failed to delete" };
  }
}

export async function updateFestoryProfile(formData: FormData) {
  try {
    const session = await getFestorySession();
    if (!session) return { error: "Unauthorized" };

    const name = formData.get("name") as string;
    const file = formData.get("file") as File | null;

    const doc = await festoryUsersCol.doc(session.id).get();
    if (!doc.exists) return { error: "User not found" };

    const user = doc.data() as FestoryUser;
    const updates: Partial<FestoryUser> = {};

    if (name && name.trim().length > 0) {
      updates.name = name.trim();
    }

    if (file && file.size > 0) {
      if (file.size > 3 * 1024 * 1024) {
        return { error: "Image too large (Max 3MB)" };
      }
      if (user.image && user.image.startsWith("/uploads/festory/")) {
        try {
          const { deleteFile } = await import("@/lib/upload");
          await deleteFile(user.image);
        } catch (e) {}
      }

      const { uploadFile } = await import("@/lib/upload");
      const imageUrl = await uploadFile(file, "image");
      updates.image = imageUrl;
    }

    await festoryUsersCol.doc(session.id).update(updates);

    const sessionPayload = {
      id: user.id,
      name: updates.name || user.name,
      teamId: user.teamId,
      studentId: user.studentId || "",
      role: "festory_user",
      image: updates.image || user.image,
    };

    const jwt = await createSessionToken(sessionPayload);
    const cookieStore = await cookies();
    cookieStore.set(FESTORY_COOKIE, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Failed to update profile" };
  }
}

export async function logoutFestory() {
  const cookieStore = await cookies();
  cookieStore.delete(FESTORY_COOKIE);
  redirect("/festory");
}

export async function toggleFestoryLike(postId: string) {
  try {
    const session = await getFestorySession();
    if (!session) return { error: "Unauthorized" };

    const doc = await festoryPostsCol.doc(postId).get();
    if (!doc.exists) return { error: "Post not found" };

    const post = doc.data() as FestoryPost;
    const likes = Array.isArray(post.likes) ? [...post.likes] : [];

    const index = likes.indexOf(session.id);
    if (index > -1) {
      likes.splice(index, 1);
    } else {
      likes.push(session.id);
    }

    await festoryPostsCol.doc(postId).update({ likes });

    return { success: true, likes };
  } catch (e) {
    console.error(e);
    return { error: "Failed to like" };
  }
}

export async function addFestoryComment(postId: string, content: string, parentId?: string) {
  try {
    const session = await getFestorySession();
    if (!session) return { error: "Unauthorized" };
    if (!content.trim()) return { error: "Empty comment" };

    const userDoc = await festoryUsersCol.doc(session.id).get();
    if (!userDoc.exists || (userDoc.data() as FestoryUser).isBanned) return { error: "Banned" };
    const user = userDoc.data() as FestoryUser;

    const postDoc = await festoryPostsCol.doc(postId).get();
    if (!postDoc.exists) return { error: "Post not found" };
    const post = postDoc.data() as FestoryPost;

    const commentId = crypto.randomUUID();
    const comment: FestoryComment = {
      id: commentId,
      postId,
      userId: session.id,
      userName: session.name,
      userImage: user.image,
      content: content.trim(),
      parentId: parentId || undefined,
      createdAt: new Date().toISOString(),
    };

    const batch = adminDb.batch();
    batch.set(festoryCommentsCol.doc(commentId), comment);
    batch.update(festoryPostsCol.doc(postId), {
      commentsCount: (post.commentsCount || 0) + 1,
    });

    await batch.commit();

    return {
      success: true,
      comment,
    };
  } catch (e) {
    console.error(e);
    return { error: "Failed to comment" };
  }
}

export async function getFestoryComments(postId: string) {
  try {
    const snap = await festoryCommentsCol
      .where("postId", "==", postId)
      .get();

    const comments = docsToData<FestoryComment>(snap);
    return comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (e) {
    return [];
  }
}

export async function updateFestoryPost(postId: string, newContent: string) {
  try {
    const session = await getFestorySession();
    if (!session) return { error: "Unauthorized" };

    const doc = await festoryPostsCol.doc(postId).get();
    if (!doc.exists) return { error: "Post not found" };

    const post = doc.data() as FestoryPost;
    if (post.userId !== session.id) return { error: "Forbidden" };
    if (post.type !== "text") return { error: "Only text posts can be edited" };

    if (new Date().getTime() - new Date(post.createdAt).getTime() > 60000) {
      return { error: "Edit time limit exceeded (1 minute)" };
    }

    await festoryPostsCol.doc(postId).update({ content: newContent });

    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Failed to update post" };
  }
}
