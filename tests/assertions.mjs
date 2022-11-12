import { entries } from "browser-stream-tar";

export const tars = {
  "test.tar": ["a.txt", "b.csv", "z.doc"],
  "bytes.tar": ["0.bytes", "1.bytes", "511.bytes", "512.bytes", "513.bytes"]
};

export async function assertTarStreamEntries(
  t,
  stream,
  entryNames = [],
  entryStream = async name => {}
) {
  let i = 0;
  for await (const entry of entries(stream)) {
    t.is(entry.name, entryNames[i], `[${i}].name`);

    await compareReadables(
      t,
      (await entryStream(entry.name)).getReader(),
      entry.stream.getReader(),
      `[${i}].stream`
    );

    i++;
  }
  t.is(i, entryNames.length);
}

async function readAll(reader) {
  let buffer = new Uint8Array();

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    const newBuffer = new Uint8Array(buffer.length + value.length);
    newBuffer.set(buffer);
    newBuffer.set(value, buffer.length);
    buffer = newBuffer;
  }

  return buffer;
}

async function compareReadables(t, a, b, message) {
  const [av, bv] = await Promise.all([readAll(a), readAll(b)]);
  t.deepEqual(av, bv, message);
}
