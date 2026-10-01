// A minimal, deterministic ZIP writer: entries sorted by path, one fixed
// timestamp, fixed Unix permissions and maximum DEFLATE compression. The same
// files produce the same bytes on every machine running the same Node.js
// release, so an archive's SHA-256 identifies its contents.
import { Buffer } from "node:buffer";
import { crc32, deflateRawSync, constants } from "node:zlib";

/** 1980-01-01 00:00:00, the earliest DOS timestamp. */
const DOS_TIME = 0;
const DOS_DATE = (0 << 9) | (1 << 5) | 1;
const VERSION_MADE_BY_UNIX = (3 << 8) | 20;
const VERSION_NEEDED = 20;
const METHOD_DEFLATE = 8;
const METHOD_STORE = 0;
const UTF8_FLAG = 1 << 11;
const REGULAR_FILE_0644 = (0o100644 << 16) >>> 0;
const MAXIMUM_ENTRIES = 0xffff;
const MAXIMUM_BYTES = 0xffffffff;

/**
 * @param {ReadonlyArray<{ path: string; bytes: Uint8Array }>} files
 * @returns {Buffer}
 */
export function writeDeterministicZip(files) {
  const sorted = [...files].sort((left, right) =>
    left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
  );
  if (sorted.length > MAXIMUM_ENTRIES) {
    throw new RangeError("Too many entries for a ZIP without ZIP64.");
  }
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const file of sorted) {
    const name = Buffer.from(file.path, "utf8");
    const deflated = deflateRawSync(file.bytes, {
      level: constants.Z_BEST_COMPRESSION,
    });
    const stored = deflated.byteLength >= file.bytes.byteLength;
    const data = stored ? Buffer.from(file.bytes) : deflated;
    const checksum = crc32(file.bytes);
    if (file.bytes.byteLength > MAXIMUM_BYTES || offset > MAXIMUM_BYTES) {
      throw new RangeError("Archive too large for a ZIP without ZIP64.");
    }

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(VERSION_NEEDED, 4);
    local.writeUInt16LE(UTF8_FLAG, 6);
    local.writeUInt16LE(stored ? METHOD_STORE : METHOD_DEFLATE, 8);
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(data.byteLength, 18);
    local.writeUInt32LE(file.bytes.byteLength, 22);
    local.writeUInt16LE(name.byteLength, 26);
    local.writeUInt16LE(0, 28);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(VERSION_MADE_BY_UNIX, 4);
    central.writeUInt16LE(VERSION_NEEDED, 6);
    central.writeUInt16LE(UTF8_FLAG, 8);
    central.writeUInt16LE(stored ? METHOD_STORE : METHOD_DEFLATE, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(data.byteLength, 20);
    central.writeUInt32LE(file.bytes.byteLength, 24);
    central.writeUInt16LE(name.byteLength, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(REGULAR_FILE_0644, 38);
    central.writeUInt32LE(offset, 42);

    locals.push(local, name, data);
    centrals.push(central, name);
    offset += local.byteLength + name.byteLength + data.byteLength;
  }
  const directory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(sorted.length, 8);
  end.writeUInt16LE(sorted.length, 10);
  end.writeUInt32LE(directory.byteLength, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, end]);
}
