import path from 'node:path'
import { promises as fs } from 'fs'
import { UPLOADS_DIR } from '../../config/multer.config'

export const deleteUploadedAsset = async (fileName: string) => {
    // Must match multer.config's storage destination (process.cwd()-based).
    // This used to resolve relative to __dirname (the source/dist tree),
    // which never pointed at the same directory multer actually wrote to —
    // uploaded files were never cleaned up and just accumulated on disk.
    const filePath = path.join(UPLOADS_DIR, fileName);
    await fs.unlink(filePath);
}
