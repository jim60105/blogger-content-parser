import fs from 'fs';
import xml2js from 'xml2js';
import path from 'path';
import { decode } from 'html-entities';
import slugify from 'slugify';
import { NodeHtmlMarkdown } from 'node-html-markdown';

// 讀取 XML 文件
function readXmlFile(filePath) {
    return fs.readFileSync(filePath, 'utf-8');
}

// 解析 XML 內容
async function parseXml(xmlContent) {
    const parser = new xml2js.Parser();
    return await parser.parseStringPromise(xmlContent);
}

// 從 entry 中提取所需信息
function extractEntryInfo(entry) {
    const rawContent = entry.content[0]._;
    // 使用 html-entities 的 decode 函數將 HTML 實體進行解碼
    const content = decode(rawContent);

    // e.g. https://blog.maki0419.com/2021/12/fortigate-passthrough-youtube.html
    const alternateLink = entry.link.find(
        (link) => link.$.rel === 'alternate' && link.$.type === 'text/html'
    );
    const slug = alternateLink ? path.basename(alternateLink.$.href, '.html') : null;

    // 解析 Front Matter
    // 這裡我是使用 Zola 的 Front Matter 格式，因為我要遷移到 Zola
    // https://www.getzola.org/documentation/content/page/
    const title = entry.title[0]._;
    const description = '';

    const publishedDate = new Date(entry.published[0]);
    const date = publishedDate.toISOString();

    const updatedDate = new Date(entry.updated[0]);
    const updated = updatedDate.toISOString();

    const draft = entry['app:control']?.[0]?.['app:draft']?.[0] === 'yes';

    const url = alternateLink ? new URL(alternateLink.$.href).pathname : null;

    const categories = entry.category
        .filter((category) => category.$.scheme === 'http://www.blogger.com/atom/ns#')
        .map((category) => category.$.term);

    return { content, slug, title, description, date, updated, draft, url, categories };
}

function removeFooter(content, footer) {
    return content.replace(`<div class="blogger-post-footer">${footer}</div>`, '');
}

function buildFrontMatter(post) {
    return `+++
title = "${post.title}"
description = "${post.description}"
date = ${post.date}
updated = ${post.updated}
draft = ${post.draft}
aliases = ["${post.url}"]

[taxonomies]
tags = [${post.categories.map((category) => `"${category}"`).join(', ')}]
+++
`;
}

// 將內容寫入文件
async function writeContentToFile(content, slug, outputDir) {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const filePath = path.join(outputDir, `${slug}.md`);
    return fs.writeFile(filePath, content, 'utf8', (err) => {
        if (err) {
            console.error('Error writing file:', err);
        }
    });
}

// 主函數
async function main(inputFile, outputDir) {
    if (!inputFile || !outputDir) {
        console.log('Usage: node xml-content-extractor.js <inputFile> <outputDir>');
        process.exit(1);
    }

    try {
        const xmlContent = readXmlFile(inputFile);
        const parsedXml = await parseXml(xmlContent);
        // Get posts
        const entries = parsedXml.feed.entry.filter(
            (entry) =>
                entry.content &&
                entry.link &&
                entry.title &&
                // 留言數，僅文章有這個屬性
                (typeof entry['thr:total'] === 'Array' || entry['thr:total'] instanceof Array)
        );

        // Get footer
        const footer = parsedXml.feed.entry
            .filter(
                (entry) =>
                    (typeof entry['id'][0] === 'string' || entry['id'][0] instanceof String) &&
                    entry['id'][0].endsWith('BLOG_POST_FEED_FOOTER')
            )
            .map((entry) => entry.content[0]._)[0];

        entries.forEach(async (entry) => {
            const post = extractEntryInfo(entry);
            if (!post.content) {
                console.log('Skipping entry due to missing content');
                return;
            }

            const slug = path.win32
                .normalize(post.slug || slugify(post.title) || entry.id[0].split(':').pop())
                .replace(/"/g, '');

            const content = removeFooter(post.content, footer);
            const frontMatter = buildFrontMatter(post);

            const section = post.categories[0] || 'uncategorized';

            await writeContentToFile(frontMatter + content, slug, `${outputDir}/${section}`);

            const markdown = NodeHtmlMarkdown.translate(content);
            await writeContentToFile(frontMatter + markdown, slug, `${outputDir}_md/${section}`);
            console.log(`File saved: ${slug}`);
        });

        console.log('處理完成。輸出文件已保存到 ' + outputDir + ' 目錄。');
    } catch (error) {
        console.error('發生錯誤：', error);
    }
}

main(process.argv[2], process.argv[3]);
