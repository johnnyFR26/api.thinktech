import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { put, del, list, head } from '@vercel/blob';
import { randomUUID } from 'crypto';
import { db } from '../lib/db';

export class FileController {
    async uploadOne(request: FastifyRequest, reply: FastifyReply) {
        try {
            const data = await request.file()

            if (!data) {
                return reply.status(400).send({ error: 'No file uploaded' });
            }

            const allowedMimeTypes = [
                   'image/jpeg',
                   'image/png',
                   'image/gif',
                   'image/webp',
                   'application/pdf',
                   'application/msword',
                   'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ]

            if (!allowedMimeTypes.includes(data.mimetype)) {
                return reply.status(400).send({ error: 'Invalid file type' });
            }

            const fileExtension = data.filename.split('.').pop()
            const uniqueFileName = `${randomUUID()}.${fileExtension}`

            const buffer = await data.toBuffer()

            const blob = await put(uniqueFileName, buffer, {
                access: 'public',
                contentType: data.mimetype,
                addRandomSuffix: false
            })

                  // Pegar campos adicionais do formulário
              const fields = data.fields as any;
              const userId = fields.userId?.value;
              const categoryId = fields.categoryId?.value;
               const description = fields.description?.value;

      // Salvar metadata no banco de dados
                 const fileRecord = await db.file.create({
                      data: {
                         originalName: data.filename,
                          storedName: uniqueFileName,
                        mimeType: data.mimetype,
                         size: buffer.length,
                         url: blob.url, // URL pública do Vercel Blob
                       blobPathname: blob.pathname, // Caminho para deletar depois
                       userId: userId || null,
                       categoryId: categoryId || null,
                      description: description || null
                }
              });

               return reply.status(201).send({
                 success: true,
                  fileId: fileRecord.id,
                  fileName: fileRecord.originalName,
                    fileUrl: blob.url,
                 downloadUrl: blob.downloadUrl,
                 size: fileRecord.size
              });
        } catch (error) {
            return reply.status(500).send({ error: 'Error uploading file' });
        }
    }
}