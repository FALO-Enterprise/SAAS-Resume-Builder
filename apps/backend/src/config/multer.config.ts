/* eslint-disable */
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import type { Request } from 'express';

export const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

const MAX_AVATAR_SIZE = 1024 * 1024 * 5;

type ImageSignature = {
    ext: string;
    mimeType: string;
    matches: (buffer: Buffer) => boolean;
};

// Multer's default fileFilter only sees the client-supplied `mimetype`
// header, which is entirely attacker-controlled — a request can label a
// malicious .html/.svg payload as "image/png" and it sails straight
// through. These signatures let us check the actual bytes instead.
const IMAGE_SIGNATURES: ImageSignature[] = [
    {
        ext: '.jpg',
        mimeType: 'image/jpeg',
        matches: (buffer) =>
            buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
    },
    {
        ext: '.png',
        mimeType: 'image/png',
        matches: (buffer) =>
            buffer.length >= 8 &&
            buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
            buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a,
    },
    {
        ext: '.gif',
        mimeType: 'image/gif',
        matches: (buffer) =>
            buffer.length >= 6 &&
            (buffer.toString('ascii', 0, 6) === 'GIF89a' || buffer.toString('ascii', 0, 6) === 'GIF87a'),
    },
    {
        ext: '.webp',
        mimeType: 'image/webp',
        matches: (buffer) =>
            buffer.length >= 12 &&
            buffer.toString('ascii', 0, 4) === 'RIFF' &&
            buffer.toString('ascii', 8, 12) === 'WEBP',
    },
];

function detectImageType(buffer: Buffer): ImageSignature | null {
    return IMAGE_SIGNATURES.find((signature) => signature.matches(buffer)) ?? null;
}

/**
 * A storage engine that buffers the upload, sniffs its real file-format
 * signature from the actual bytes, rejects anything that doesn't match a
 * known image format, and writes it to disk under an extension WE derive
 * from the sniffed type — never the client-supplied filename/extension.
 * That closes the stored-XSS path where a spoofed upload (e.g. an .html
 * file labeled "image/png") could be served back by express.static with a
 * browser-executable Content-Type.
 */
class SniffedImageStorage implements multer.StorageEngine {
    _handleFile(
        _req: Request,
        file: Express.Multer.File,
        callback: (error?: any, info?: Partial<Express.Multer.File>) => void,
    ) {
        const chunks: Buffer[] = [];
        let size = 0;
        let settled = false;

        const finish = (error?: Error, info?: Partial<Express.Multer.File>) => {
            if (settled) return;
            settled = true;
            callback(error, info);
        };

        file.stream.on('data', (chunk: Buffer) => {
            if (settled) return;
            size += chunk.length;
            if (size > MAX_AVATAR_SIZE) {
                file.stream.destroy();
                finish(new Error('File is too large'));
                return;
            }
            chunks.push(chunk);
        });

        file.stream.on('error', (error: Error) => finish(error));

        file.stream.on('end', () => {
            if (settled) return;

            const buffer = Buffer.concat(chunks);
            const signature = detectImageType(buffer);

            if (!signature) {
                finish(new Error('the file type is not supported'));
                return;
            }

            const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${signature.ext}`;
            const destination = path.join(UPLOADS_DIR, uniqueName);

            fs.writeFile(destination, buffer)
                .then(() =>
                    finish(undefined, {
                        destination: UPLOADS_DIR,
                        filename: uniqueName,
                        path: destination,
                        size: buffer.length,
                        mimetype: signature.mimeType,
                    }),
                )
                .catch((error) => finish(error));
        });
    }

    _removeFile(_req: Request, file: Express.Multer.File, callback: (error: Error | null) => void) {
        fs.unlink(file.path)
            .then(() => callback(null))
            .catch(callback);
    }
}

export const multerUpload = multer({
    storage: new SniffedImageStorage(),
    limits: {
        fileSize: MAX_AVATAR_SIZE,
    },
});

export const uploadSingle = (fieldName: string) =>
    multerUpload.single(fieldName);
export const uploadMultiple = (fieldName: string, maxCount: number) =>
    multerUpload.array(fieldName, maxCount);
