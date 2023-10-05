const { createReadStream, createWriteStream } = require('fs');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const sharp = require('sharp');
const crypto = require('crypto');
const path = require('path');

module.exports = async (req, res) => {
    try {
        const imageFile = req.files.image;

        // Generate a unique filename
        const randomString = crypto.randomBytes(8).toString('hex');
        const originalFilename = `${randomString}_${imageFile.name}`;
        const originalFilePath = path.join('/tmp', originalFilename);

        // Save the uploaded image
        const readStream = createReadStream(imageFile.path);
        const writeStream = createWriteStream(originalFilePath);
        readStream.pipe(writeStream);

        // Perform image processing using Python script
        const { stdout, stderr } = await exec(`python3 process_image.py ${originalFilePath}`);

        // Send the processed image as a response
        const processedImagePath = path.join('/tmp', 'processed_image.jpg');

        // Resize the processed image if necessary
        await sharp(processedImagePath)
            .resize(800) // You can adjust the size as needed
            .toFile(originalFilePath);

        const result = {
            originalImageUrl: `/tmp/${originalFilename}`,
            processedImageUrl: `/tmp/${originalFilename}`, // Change this if needed
        };

        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Image processing failed.' });
    }
};
