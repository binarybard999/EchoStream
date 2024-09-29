// backend/utils/videoConverter.js
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static"; // Use static binary
import path from "path";

ffmpeg.setFfmpegPath(ffmpegStatic);

export const convertVideo = (inputPath, outputQuality, outputFilename) => {
    return new Promise((resolve, reject) => {
        const outputPath = path.join(
            process.cwd(),
            "public",
            "temp",
            outputFilename
        );

        ffmpeg(inputPath)
            .outputOptions([
                `-vf scale=${outputQuality}`,
                "-c:v libx264",
                "-crf 28",
            ])
            .save(outputPath)
            .on("end", () => resolve(outputPath))
            .on("error", reject);
    });
};
