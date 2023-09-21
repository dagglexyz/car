import { CarIndexedReader } from "@ipld/car/indexed-reader";
import { recursive as exporter } from "ipfs-unixfs-exporter";
import { pipeline } from "stream/promises";
import fs from "fs";
import archiver from "archiver";

export async function unpackAndArchive(filePath) {
	try {
		const reader = await CarIndexedReader.fromFile(filePath);
		const roots = await reader.getRoots();

		const entries = exporter(roots[0], {
			async get(cid) {
				const block = await reader.get(cid);
				return block.bytes;
			},
		});

		for await (const entry of entries) {
			let filePath = entry.path;
			if (entry.type === "file" || entry.type === "raw") {
				await pipeline(entry.content, fs.createWriteStream(filePath));
			} else if (entry.type === "directory") {
				await fs.promises.mkdir(entry.path, { recursive: true });
			}
		}

		let zipPath = roots[0].toString() + ".zip";
		await zipDirectory(roots[0].toString(), zipPath);
		fs.rmSync(roots[0].toString(), { recursive: true, force: true });
		return zipPath;
	} catch (error) {
		console.log(error.message);
	}
}

function zipDirectory(sourceDir, outPath) {
	const archive = archiver("zip", { zlib: { level: 9 } });
	const stream = fs.createWriteStream(outPath);

	return new Promise((resolve, reject) => {
		archive
			.directory(sourceDir, false)
			.on("error", (err) => reject(err))
			.pipe(stream);

		stream.on("close", () => resolve());
		archive.finalize();
	});
}
