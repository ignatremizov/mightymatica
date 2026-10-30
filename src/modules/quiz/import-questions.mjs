// Repeatable local import. The preservation tree is read-only.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function parseQuestionXml(xml) {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error("XML entities are not supported");
  const decode = (value) => value.replace(/&(?:amp|lt|gt|quot|apos);/g, (entity) =>
    ({ "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'" })[entity]);
  const field = (body, tag) => {
    const match = body.match(new RegExp(`<${tag}>([^<]*)</${tag}>`, "u"));
    if (!match) throw new Error(`Missing or unsupported ${tag}`);
    return decode(match[1]);
  };
  const questions = [...xml.matchAll(/<Q>([\s\S]*?)<\/Q>/g)].map((match) => {
    const answer = Number(field(match[1], "answer"));
    if (!Number.isInteger(answer) || answer < 1 || answer > 4) throw new Error("Invalid answer index");
    return {
      question: field(match[1], "question"),
      originalAnswer: answer - 1,
      choices: [1, 2, 3, 4].map((index) => field(match[1], `choice_${index}`)),
    };
  });
  if (!questions.length) throw new Error("No questions");
  if (field(xml, "Random").toLowerCase() !== "no") throw new Error("Unexpected random order");
  return { title: field(xml, "Title"), questions };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = process.argv[2];
  if (!root) throw new Error("Usage: node import-questions.mjs ARCHIVE_RAW_SITE");
  const data = Object.fromEntries([
    ["quiz-permutations", "setup.xml"],
    ["quiz-permutations-more", "Millionaire-Perm-more/setup.xml"],
  ].map(([id, source]) => [id, { source, ...parseQuestionXml(readFileSync(`${root}/${source}`, "utf8")) }]));
  writeFileSync(new URL("./questions.json", import.meta.url), `${JSON.stringify(data, null, 2)}\n`);
}
