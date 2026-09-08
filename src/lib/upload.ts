import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "festory");

export async function uploadFile(file: File, type: "image" | "audio"): Promise<string> {
    await mkdir(UPLOAD_DIR, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = type === "image" ? "webp" : file.name.split(".").pop() || "mp3";
    const filename = `${randomUUID()}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    if (type === "image") {
        // Compress image to WebP with high quality but low size
        await sharp(buffer)
            .resize(1080, 1080, { fit: "inside", withoutEnlargement: true }) // Max 1080p
            .webp({ quality: 80 }) // 80% quality is usually indistinguishable but lighter
            .toFile(filepath);
    } else {
        // Save audio directly (compression on client or handled by browser recording usually sufficient for voice notes < 1MB)
        // For production, using ffmpeg server-side would be better, but node-fs is simpler for MVP
        await writeFile(filepath, buffer);
    }

    return `/uploads/festory/${filename}`;
}

export async function deleteFile(fileUrl: string) {
    try {
        const filename = fileUrl.split("/").pop();
        if (!filename) return;
        const filepath = path.join(UPLOAD_DIR, filename);
        await unlink(filepath);
    } catch (error) {
        console.error("Failed to delete file:", error);
    }
}

const STUDENTS_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "students");

export async function uploadStudentPhoto(file: File): Promise<string> {
    await mkdir(STUDENTS_UPLOAD_DIR, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${randomUUID()}.webp`;
    const filepath = path.join(STUDENTS_UPLOAD_DIR, filename);

    // Compress & crop avatar to square WebP (400x400)
    await sharp(buffer)
        .resize(400, 400, { fit: "cover", position: "center" })
        .webp({ quality: 85 })
        .toFile(filepath);

    return `/uploads/students/${filename}`;
}

