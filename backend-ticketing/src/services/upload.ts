/**
 * Upload Service
 *
 * Handles file uploads to R2 with validation.
 * Allowed formats: png, jpg, jpeg, webp
 * Max size: 8 MB
 */

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_SIZE = 8 * 1024 * 1024 // 8 MB

export interface UploadResult {
  filename: string
  path: string
  size: number
  contentType: string
}

export class UploadService {
  constructor(private bucket: R2Bucket) {}

  /**
   * Upload a banner image for an event.
   * Stores at: events/{event_uuid}/banner/{timestamp}_{originalName}
   */
  async uploadEventBanner(eventUuid: string, file: File): Promise<UploadResult> {
    this.validateFile(file)

    const ext = this.getExtension(file.name, file.type)
    const filename = `${Date.now()}_banner.${ext}`
    const path = `events/${eventUuid}/banner/${filename}`

    const arrayBuffer = await file.arrayBuffer()
    await this.bucket.put(path, arrayBuffer, {
      httpMetadata: { contentType: file.type },
    })

    return { filename, path, size: file.size, contentType: file.type }
  }

  /**
   * Delete an object from R2.
   */
  async deleteFile(path: string): Promise<void> {
    await this.bucket.delete(path)
  }

  /**
   * Get a file from R2 (for serving images).
   */
  async getFile(path: string): Promise<R2ObjectBody | null> {
    return await this.bucket.get(path)
  }

  // ─── Validation ────────────────────────────────────

  private validateFile(file: File): void {
    if (!file || !file.size) {
      throw new UploadError('No file provided', 400)
    }

    if (file.size > MAX_SIZE) {
      throw new UploadError(`File too large. Maximum size is ${MAX_SIZE / 1024 / 1024}MB`, 400)
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new UploadError(`Invalid file type: ${file.type}. Allowed: png, jpg, webp`, 400)
    }
  }

  private getExtension(fileName: string, mimeType: string): string {
    const mimeMap: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
    }
    return mimeMap[mimeType] || fileName.split('.').pop() || 'jpg'
  }
}

export class UploadError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = 'UploadError'
  }
}
