import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        
        if (!file) {
            return NextResponse.json(
                { error: 'No file uploaded' },
                { status: 400 }
            );
        }


        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { error: 'File must be an image' },
                { status: 400 }
            );
        }


        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);


        const uploadsDir = path.join(process.cwd(), 'public/uploads');
        try {
            await mkdir(uploadsDir, { recursive: true });
        } catch (err) {
            console.log('Uploads directory already exists');
        }


        const timestamp = Date.now();
        const extension = path.extname(file.name);
        const filename = `recipe_${timestamp}${extension}`;
        const filepath = path.join(uploadsDir, filename);


        await writeFile(filepath, buffer);


        const fileUrl = `/uploads/${filename}`;
        
        return NextResponse.json({ 
            message: 'File uploaded successfully',
            url: fileUrl 
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}