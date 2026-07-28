import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface Utf8ByteSequenceValidatorInput {
  bytes: number[];
}

export const DEFAULT_UTF8_VALIDATOR_INPUT: Utf8ByteSequenceValidatorInput = {
  bytes: [0x68, 0x69, 0xf0, 0x9f, 0x9a, 0x80], // 'h', 'i', '🚀' (4-byte UTF-8)
};

export const UTF8_BYTE_SEQUENCE_VALIDATOR_CODE = `def validate_utf8_byte_sequence(bytes_input: list[int]) -> tuple[bool, list[tuple[str, list[int]]]]:
    idx = 0
    N = len(bytes_input)
    groups = []
    is_valid = True

    while idx < N:
        b0 = bytes_input[idx]

        if (b0 & 0x80) == 0:
            groups.append(("ASCII", [b0]))
            idx += 1
        elif (b0 & 0xE0) == 0xC0:
            if idx + 1 >= N or (bytes_input[idx + 1] & 0xC0) != 0x80:
                is_valid = False
                groups.append(("INVALID_2BYTE", [b0]))
                idx += 1
            else:
                groups.append(("2-BYTE", [b0, bytes_input[idx + 1]]))
                idx += 2
        elif (b0 & 0xF0) == 0xE0:
            if idx + 2 >= N or (bytes_input[idx + 1] & 0xC0) != 0x80 or (bytes_input[idx + 2] & 0xC0) != 0x80:
                is_valid = False
                groups.append(("INVALID_3BYTE", [b0]))
                idx += 1
            else:
                groups.append(("3-BYTE", [b0, bytes_input[idx + 1], bytes_input[idx + 2]]))
                idx += 3
        elif (b0 & 0xF8) == 0xF0:
            if idx + 3 >= N or (bytes_input[idx + 1] & 0xC0) != 0x80 or (bytes_input[idx + 2] & 0xC0) != 0x80 or (bytes_input[idx + 3] & 0xC0) != 0x80:
                is_valid = False
                groups.append(("INVALID_4BYTE", [b0]))
                idx += 1
            else:
                groups.append(("4-BYTE", [b0, bytes_input[idx + 1], bytes_input[idx + 2], bytes_input[idx + 3]]))
                idx += 4
        else:
            is_valid = False
            groups.append(("INVALID_LEAD_BYTE", [b0]))
            idx += 1

    return is_valid, groups`;

export const generateUtf8ValidatorSteps = (
  input: Utf8ByteSequenceValidatorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { bytes } = input;
  let stepIndex = 0;

  const hexFormat = (b: number) => `0x${b.toString(16).toUpperCase().padStart(2, "0")}`;

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: "Initialize UTF-8 Byte Sequence Validator (RFC 3629)",
      why: `Validating ${bytes.length} raw bytes: [${bytes.map(hexFormat).join(", ")}].`,
    },
    primarySnapshot: {
      kind: "array",
      elements: bytes.map((b, idx) => ({
        id: `b-${idx}`,
        value: b,
        label: hexFormat(b),
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        totalBytes: String(bytes.length),
        hexStream: bytes.map(hexFormat).join(" "),
        status: "Initialized",
      },
    },
    variables: { idx: 0, N: bytes.length, isValid: true, groupCount: 0 },
  });

  let idx = 0;
  let isValid = true;
  const groups: { type: string; byteList: number[] }[] = [];

  while (idx < bytes.length) {
    const b0 = bytes[idx];

    if ((b0 & 0x80) === 0) {
      const charStr = b0 >= 32 && b0 <= 126 ? `'${String.fromCharCode(b0)}'` : hexFormat(b0);
      groups.push({ type: "1-Byte ASCII", byteList: [b0] });
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 9,
        explanation: {
          what: `Byte ${hexFormat(b0)} at Index ${idx}: Valid 1-Byte ASCII (0x00..0x7F)`,
          why: `Lead bit pattern 0xxxxxxx matched (mask 0x80 is 0). ASCII character ${charStr}.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: bytes.map((b, i) => ({
            id: `b-${i}`,
            value: b,
            label: hexFormat(b),
            state:
              i === idx
                ? ("active" as ElementState)
                : i < idx
                  ? ("visited" as ElementState)
                  : ("default" as ElementState),
            pointers: i === idx ? [`ASCII ${charStr}`] : [],
          })),
        },
        auxiliaryState: {
          customState: {
            leadByte: hexFormat(b0),
            byteType: "1-Byte ASCII",
            char: charStr,
          },
        },
        variables: { idx, leadByte: hexFormat(b0), type: "ASCII", isValid },
      });
      idx += 1;
    } else if ((b0 & 0xe0) === 0xc0) {
      if (idx + 1 < bytes.length && (bytes[idx + 1] & 0xc0) === 0x80) {
        const seq = [b0, bytes[idx + 1]];
        groups.push({ type: "2-Byte Sequence", byteList: seq });
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 17,
          explanation: {
            what: `Bytes [${seq.map(hexFormat).join(", ")}] at Index ${idx}: Valid 2-Byte Sequence (110xxxxx 10xxxxxx)`,
            why: `Lead byte matches 110xxxxx (0xC0) and 1 continuation byte matches 10xxxxxx (0x80).`,
          },
          primarySnapshot: {
            kind: "array",
            elements: bytes.map((b, i) => ({
              id: `b-${i}`,
              value: b,
              label: hexFormat(b),
              state:
                i === idx || i === idx + 1
                  ? ("active" as ElementState)
                  : i < idx
                    ? ("visited" as ElementState)
                    : ("default" as ElementState),
              pointers: i === idx ? ["2-Byte Lead"] : i === idx + 1 ? ["Continuation"] : [],
            })),
          },
          auxiliaryState: { customState: { byteType: "2-Byte Sequence" } },
          variables: { idx, type: "2-Byte", isValid },
        });
        idx += 2;
      } else {
        isValid = false;
        groups.push({ type: "INVALID_2BYTE", byteList: [b0] });
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 14,
          explanation: {
            what: `Byte ${hexFormat(b0)} at Index ${idx}: Invalid 2-Byte Sequence`,
            why: `Expected continuation byte matching 10xxxxxx at index ${idx + 1}, but ${
              idx + 1 >= bytes.length
                ? "reached end of byte stream"
                : `found ${hexFormat(bytes[idx + 1])}`
            }.`,
          },
          primarySnapshot: {
            kind: "array",
            elements: bytes.map((b, i) => ({
              id: `b-${i}`,
              value: b,
              label: hexFormat(b),
              state:
                i === idx
                  ? ("error" as ElementState)
                  : i < idx
                    ? ("visited" as ElementState)
                    : ("default" as ElementState),
              pointers: i === idx ? ["Invalid 2-Byte Lead"] : [],
            })),
          },
          auxiliaryState: { customState: { byteType: "INVALID_2BYTE", status: "Error" } },
          variables: { idx, type: "INVALID_2BYTE", isValid: false },
        });
        idx += 1;
      }
    } else if ((b0 & 0xf0) === 0xe0) {
      if (
        idx + 2 < bytes.length &&
        (bytes[idx + 1] & 0xc0) === 0x80 &&
        (bytes[idx + 2] & 0xc0) === 0x80
      ) {
        const seq = [b0, bytes[idx + 1], bytes[idx + 2]];
        groups.push({ type: "3-Byte Sequence", byteList: seq });
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 25,
          explanation: {
            what: `Bytes [${seq.map(hexFormat).join(", ")}] at Index ${idx}: Valid 3-Byte Sequence (1110xxxx 10xxxxxx 10xxxxxx)`,
            why: `Lead byte matches 1110xxxx (0xE0) and 2 continuation bytes match 10xxxxxx (0x80).`,
          },
          primarySnapshot: {
            kind: "array",
            elements: bytes.map((b, i) => ({
              id: `b-${i}`,
              value: b,
              label: hexFormat(b),
              state:
                i >= idx && i <= idx + 2
                  ? ("active" as ElementState)
                  : i < idx
                    ? ("visited" as ElementState)
                    : ("default" as ElementState),
              pointers: i === idx ? ["3-Byte Lead"] : [],
            })),
          },
          auxiliaryState: { customState: { byteType: "3-Byte Sequence" } },
          variables: { idx, type: "3-Byte", isValid },
        });
        idx += 3;
      } else {
        isValid = false;
        groups.push({ type: "INVALID_3BYTE", byteList: [b0] });
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 22,
          explanation: {
            what: `Byte ${hexFormat(b0)} at Index ${idx}: Invalid 3-Byte Sequence`,
            why: `Lead byte 1110xxxx missing valid continuation bytes at index ${idx + 1} and ${idx + 2}.`,
          },
          primarySnapshot: {
            kind: "array",
            elements: bytes.map((b, i) => ({
              id: `b-${i}`,
              value: b,
              label: hexFormat(b),
              state:
                i === idx
                  ? ("error" as ElementState)
                  : i < idx
                    ? ("visited" as ElementState)
                    : ("default" as ElementState),
              pointers: i === idx ? ["Invalid 3-Byte Lead"] : [],
            })),
          },
          auxiliaryState: { customState: { byteType: "INVALID_3BYTE", status: "Error" } },
          variables: { idx, type: "INVALID_3BYTE", isValid: false },
        });
        idx += 1;
      }
    } else if ((b0 & 0xf8) === 0xf0) {
      if (
        idx + 3 < bytes.length &&
        (bytes[idx + 1] & 0xc0) === 0x80 &&
        (bytes[idx + 2] & 0xc0) === 0x80 &&
        (bytes[idx + 3] & 0xc0) === 0x80
      ) {
        const seq = [b0, bytes[idx + 1], bytes[idx + 2], bytes[idx + 3]];
        groups.push({ type: "4-Byte Emoji/Unicode", byteList: seq });
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 33,
          explanation: {
            what: `Bytes [${seq.map(hexFormat).join(", ")}] at Index ${idx}: Valid 4-Byte Unicode Sequence (11110xxx 10xxxxxx 10xxxxxx 10xxxxxx)`,
            why: `Valid 4-byte UTF-8 emoji / supplementary character sequence.`,
          },
          primarySnapshot: {
            kind: "array",
            elements: bytes.map((b, i) => ({
              id: `b-${i}`,
              value: b,
              label: hexFormat(b),
              state:
                i >= idx && i <= idx + 3
                  ? ("highlighted" as ElementState)
                  : i < idx
                    ? ("visited" as ElementState)
                    : ("default" as ElementState),
              pointers: i === idx ? ["4-Byte Emoji Lead"] : [],
            })),
          },
          auxiliaryState: { customState: { byteType: "4-Byte Emoji/Unicode" } },
          variables: { idx, type: "4-Byte", isValid },
        });
        idx += 4;
      } else {
        isValid = false;
        groups.push({ type: "INVALID_4BYTE", byteList: [b0] });
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 30,
          explanation: {
            what: `Byte ${hexFormat(b0)} at Index ${idx}: Invalid 4-Byte Sequence`,
            why: `Lead byte 11110xxx missing valid continuation bytes matching 10xxxxxx.`,
          },
          primarySnapshot: {
            kind: "array",
            elements: bytes.map((b, i) => ({
              id: `b-${i}`,
              value: b,
              label: hexFormat(b),
              state:
                i === idx
                  ? ("error" as ElementState)
                  : i < idx
                    ? ("visited" as ElementState)
                    : ("default" as ElementState),
              pointers: i === idx ? ["Invalid 4-Byte Lead"] : [],
            })),
          },
          auxiliaryState: { customState: { byteType: "INVALID_4BYTE", status: "Error" } },
          variables: { idx, type: "INVALID_4BYTE", isValid: false },
        });
        idx += 1;
      }
    } else {
      isValid = false;
      groups.push({ type: "INVALID_LEAD_BYTE", byteList: [b0] });
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 37,
        explanation: {
          what: `Byte ${hexFormat(b0)} at Index ${idx}: Illegal Lead Byte`,
          why: `Byte does not match any valid UTF-8 lead bit prefix (0x00-0x7F, 0xC0-0xDF, 0xE0-0xEF, 0xF0-0xF7).`,
        },
        primarySnapshot: {
          kind: "array",
          elements: bytes.map((b, i) => ({
            id: `b-${i}`,
            value: b,
            label: hexFormat(b),
            state:
              i === idx
                ? ("error" as ElementState)
                : i < idx
                  ? ("visited" as ElementState)
                  : ("default" as ElementState),
            pointers: i === idx ? ["Illegal Lead Byte"] : [],
          })),
        },
        auxiliaryState: { customState: { byteType: "INVALID_LEAD_BYTE", status: "Error" } },
        variables: { idx, type: "INVALID_LEAD_BYTE", isValid: false },
      });
      idx += 1;
    }
  }

  // Step Final: Complete
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 39,
    explanation: {
      what: `UTF-8 Validation Complete: Result = ${isValid ? "VALID UTF-8" : "INVALID UTF-8"}`,
      why: `Parsed ${groups.length} multi-byte character groups across ${bytes.length} total bytes.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: groups.map((g, rank) => ({
        id: `grp-${rank}`,
        value: rank,
        label: `${g.type} (${g.byteList.length}B)`,
        state: (g.type.startsWith("INVALID") ? "error" : "sorted") as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        isValid: String(isValid),
        characterGroups: groups.map((g) => `${g.type}`).join(" | "),
        status: "Completed",
      },
    },
    variables: { isValid, groupCount: groups.length, complete: true },
  });

  return steps;
};

export const utf8ByteSequenceValidator: AlgorithmDefinition<Utf8ByteSequenceValidatorInput> = {
  id: "utf8-byte-sequence-validator",
  title: "UTF-8 Byte Sequence Validator (RFC 3629)",
  topicIds: ["ml_tokenization", "bit_manipulation"],
  difficulty: "Medium",
  description:
    "Validates raw byte arrays against UTF-8 bit pattern specifications (RFC 3629). Checks lead byte bit prefixes (`0xxxxxxx` for 1-byte ASCII, `110xxxxx` for 2-byte, `1110xxxx` for 3-byte, `11110xxx` for 4-byte) and enforces continuation byte masks (`10xxxxxx`). Used by byte-level tokenizers (Tiktoken, SentencePiece) prior to subword parsing.\n\nInput Format:\n- bytes: Array of 8-bit integer byte values (0-255).\n\nOutput Format:\n- Returns tuple (isValidBoolean, decodedByteGroupsList).\n\nEdge Cases & Constraints:\n- Truncated continuation bytes or invalid lead byte: Marks sequence invalid.",
  constraints: ["0 <= bytes[i] <= 255."],
  examples: [
    {
      kind: "basic",
      title: "Valid Mixed ASCII & 4-Byte Emoji Sequence",
      inputDisplay: "bytes = [0x68, 0x69, 0xf0, 0x9f, 0x9a, 0x80] ('hi 🚀')",
      outputDisplay: "Result: Valid UTF-8 (2 ASCII bytes + 1 4-byte emoji)",
      input: DEFAULT_UTF8_VALIDATOR_INPUT,
      output: "Valid UTF-8",
      explanation:
        "Validates 1-byte ASCII ('h', 'i') and 4-byte Rocket Emoji (0xF0 0x9F 0x9A 0x80).",
    },
    {
      kind: "complex",
      title: "Invalid Continuation Byte",
      inputDisplay: "bytes = [0xf0, 0x00] (lead byte 0xF0 missing continuation bytes)",
      outputDisplay: "Result: Invalid UTF-8",
      input: { bytes: [0xf0, 0x00] },
      output: "Invalid UTF-8",
      explanation: "Continuation byte 0x00 fails mask 10xxxxxx (0x80).",
    },
    {
      kind: "negative",
      title: "Invalid Lead Byte (0xFF)",
      inputDisplay: "bytes = [0xff]",
      outputDisplay: "Result: Invalid UTF-8",
      input: { bytes: [0xff] },
      output: "Invalid UTF-8",
      explanation: "0xFF is illegal in RFC 3629 UTF-8 encoding.",
    },
  ],
  defaultInput: DEFAULT_UTF8_VALIDATOR_INPUT,
  code: UTF8_BYTE_SEQUENCE_VALIDATOR_CODE,
  timeComplexity: {
    best: "O(N)",
    average: "O(N)",
    worst: "O(N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "O(N) linear time single-pass scan across N bytes.",
    space: "O(N) auxiliary space for decoded character byte group tracking.",
  },
  topicGuide: {
    overview:
      "UTF-8 (Unicode Transformation Format - 8-bit, Ken Thompson & Rob Pike 1992) is the dominant character encoding of the web and deep learning. Byte-level tokenizers (Tiktoken, SentencePiece) require strict UTF-8 validation to avoid invalid byte sequence crashes during text generation.",
    sections: [
      {
        heading: "Core Concept & RFC 3629 Bit Masks",
        body: "1-byte ASCII (0x00..0x7F) uses lead bit 0. Multi-byte sequences use 110x (2-byte), 1110x (3-byte), or 11110x (4-byte) lead bits, followed by 10xxxxxx continuation bytes.",
      },
      {
        heading: "Security & Overlong Encoding Protection",
        body: "RFC 3629 forbids overlong encodings (e.g. encoding ASCII 0x41 using 2 bytes) and surrogate code points (0xD800..0xDFFF) to prevent security vulnerabilities.",
      },
      {
        heading: "Integration with Byte-Level BPE",
        body: "Byte-level BPE tokenizers validate UTF-8 boundaries to avoid splitting multi-byte UTF-8 emoji across chunk boundaries.",
      },
    ],
    keyTerms: [
      {
        term: "RFC 3629",
        definition: "IETF standard specification defining valid UTF-8 byte bit encodings.",
      },
      {
        term: "Lead Byte",
        definition:
          "Initial byte of a multi-byte UTF-8 sequence specifying total character byte length.",
      },
      {
        term: "Continuation Byte",
        definition: "Subsequent bytes in a UTF-8 sequence matching bit mask 10xxxxxx (0x80..0xBF).",
      },
    ],
  },
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "RFC 3629 UTF-8 Specification" }],
  generateSteps: generateUtf8ValidatorSteps,
};
