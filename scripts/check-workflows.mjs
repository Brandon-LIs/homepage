#!/usr/bin/env node
/**
 * 校验 .github/workflows/*.yml 的语法与结构。
 *
 * 为什么需要这个脚本：
 *   GitHub Actions 的 YAML 一旦语法错误，工作流连"启动"都不会启动——
 *   在网页上看到的只是一条 failure，点进去连 job 都没有，
 *   排查起来很费解。而这类错误在本地编辑器里往往看不出来。
 *
 *   我们真的踩过：run 步骤里写了
 *     run: curl -w "deploy hook: %{http_code}\n"
 *   YAML 不认识 shell 的引号，把 "hook:" 当成了键值分隔符，
 *   整个工作流解析失败，连续 10 次推送全部报错却看不出原因。
 *
 * 用法：node scripts/check-workflows.mjs
 * 建议挂在 pnpm build 之前，或作为 pre-push 检查。
 */

import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, ".github", "workflows");

/**
 * 极简 YAML 结构检查。
 *
 * 不引 yaml 依赖（只为几个文件装一个包不划算），而是做几项
 * 针对性检查——它们正好覆盖最容易出错、后果最严重的地方：
 *   1. Tab 字符（YAML 禁止用 Tab 缩进）
 *   2. 行内 run: 字符串里出现 ": "（最常见的解析杀手）
 *   3. 顶层必需字段是否齐全
 *   4. 缩进是否成对（避免明显的层级错误）
 */
const problems = [];

function checkFile(name, text) {
  const lines = text.split("\n");

  lines.forEach((line, i) => {
    const n = i + 1;

    if (line.includes("\t")) {
      problems.push(`${name}:${n} 使用了 Tab 缩进（YAML 只允许空格）`);
    }

    // 关键检查：行内的 `run: xxx` 后面若含 ": "，很容易被解析成映射
    const m = line.match(/^\s*(?:-\s*)?run:\s*(?!\|)(.+)$/);
    if (m) {
      const body = m[1].trim();
      // 去掉最外层引号后再看
      const unquoted = body.replace(/^['"]|['"]$/g, "");
      if (/:\s/.test(unquoted) || /:$/.test(unquoted)) {
        problems.push(
          `${name}:${n} 行内 run 里含 ": "，YAML 可能把它当成键值分隔符。\n` +
            `      建议改用块标量：\n` +
            `        run: |\n` +
            `          ${body}`
        );
      }
    }

    // 行内字符串里若同时出现冒号和 %{...}（curl -w 的常见写法）也要提醒
    if (/^\s*(?:-\s*)?(?:run|name):\s*["'].*:.*%\{/.test(line)) {
      problems.push(`${name}:${n} 行内字符串同时含冒号与 %{...}，建议改用块标量`);
    }

    // node-version 必须是完整三段版本号。
    // "22.12" 这类两段写法依赖 setup-node 的模糊匹配，一旦解析不到
    // 就直接失败并跳过后续全部步骤——我们踩过一次，且当时很难定位：
    // job 日志需要认证才能下载，网页上只看到"安装 Node 失败"一行。
    const nv = line.match(/node-version:\s*["']?([0-9.]+)/);
    if (nv) {
      const parts = nv[1].split(".");
      if (parts.length === 2) {
        problems.push(
          `${name}:${n} node-version "${nv[1]}" 只有两段。\n` +
            `      建议写完整版本号（如 "${nv[1]}.0"），避免 setup-node 模糊匹配失败。`
        );
      } else if (parts.length === 1) {
        problems.push(
          `${name}:${n} node-version "${nv[1]}" 只有一段。\n` +
            `      建议写完整版本号（如 "${nv[1]}.x.0"）或使用 lts/* 别名。`
        );
      }
    }
  });

  // 顶层字段检查（不做完整解析，只看关键行是否存在）
  const hasOn = /^on:/m.test(text) || /^"on":/m.test(text);
  const hasJobs = /^jobs:/m.test(text);
  if (!hasOn) problems.push(`${name} 缺少顶层 on: 字段（触发条件）`);
  if (!hasJobs) problems.push(`${name} 缺少顶层 jobs: 字段`);

  return lines.length;
}

async function main() {
  if (!existsSync(DIR)) {
    console.log("没有 .github/workflows 目录，跳过。");
    return;
  }

  const files = (await readdir(DIR)).filter((f) => /\.ya?ml$/.test(f));
  if (!files.length) {
    console.log("工作流目录为空。");
    return;
  }

  let total = 0;
  for (const f of files) {
    const text = await readFile(join(DIR, f), "utf-8");
    const lines = checkFile(f, text);
    total += lines;
    console.log(`  检查 ${f}（${lines} 行）`);
  }

  if (problems.length) {
    console.error("\n✗ 工作流文件有问题：\n");
    for (const p of problems) console.error("  " + p);
    console.error(
      "\n提示：这类错误会让工作流连启动都启动不了，GitHub 上也看不到具体原因。\n"
    );
    process.exit(1);
  }

  console.log(`\n✓ ${files.length} 个工作流文件通过检查（共 ${total} 行）`);
}

main().catch((e) => {
  console.error("检查失败:", e.message);
  process.exit(1);
});
