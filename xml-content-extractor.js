import fs from 'fs';
import xml2js from 'xml2js';
import path from 'path';
import { decode } from 'html-entities';
import slugify from 'slugify';
import { NodeHtmlMarkdown } from 'node-html-markdown';

function readXmlFile(filePath) {
    return fs.readFileSync(filePath, 'utf-8');
}

async function parseXml(xmlContent) {
    const parser = new xml2js.Parser();
    return await parser.parseStringPromise(xmlContent);
}

function extractEntryInfo(entry) {
    const rawContent = entry.content[0]._;
    const content = decode(rawContent);

    const alternateLink = entry.link.find(
        (link) => link.$.rel === 'alternate' && link.$.type === 'text/html'
    );
    const slug = alternateLink ? path.basename(alternateLink.$.href, '.html') : null;

    const title = entry.title[0]._;
    // There is no description in the Blogger XML
    const description = title;

    const publishedDate = new Date(entry.published[0]);
    const date = publishedDate.toISOString();

    const updatedDate = new Date(entry.updated[0]);
    const updated = updatedDate.toISOString();

    const draft = entry['app:control']?.[0]?.['app:draft']?.[0] === 'yes';

    const url = alternateLink ? new URL(alternateLink.$.href).pathname : null;

    const categories = entry.category
        .filter((category) => category.$.scheme === 'http://www.blogger.com/atom/ns#')
        .map((category) => category.$.term);

    const firstImage = content.match(/<img[^>]+src="([^">]+)"/);

    return { content, slug, title, description, date, updated, draft, url, categories, firstImage };
}

function removeFooter(content, footer) {
    return content.replace(`<div class="blogger-post-footer">${footer}</div>`, '');
}

// TODO: Modify according to your needs
// Here I am using Zola Front Matter format because I am migrating to Zola
// https://www.getzola.org/documentation/content/page/
function buildFrontMatter(post) {
    return `+++
title = "${post.title.replace(/"/g, '\\"')}"
description = "${post.description.replace(/"/g, '\\"')}"
date = ${post.date}
updated = ${post.updated}
draft = ${post.draft}
aliases = ["${post.url}"]

[taxonomies]
tags = [${post.categories.map((category) => `"${category}"`).join(', ')}]

[extra]
banner = "${post.firstImage ? post.firstImage[1] : ''}"
+++
`;
}

async function writeContentToFile(content, slug, outputDir) {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    let filePath = path.join(outputDir, `${slug}.md`);
    if (fs.existsSync(filePath)) {
        filePath = path.join(outputDir, `${slug}-${Math.random().toString(36).substring(7)}.md`);
    }
    return fs.writeFile(filePath, content, 'utf8', (err) => {
        if (err) {
            console.error('Error writing file:', err);
        }
    });
}

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

            // 將 Markdown 內容進行處理，去除每行開頭和結尾的多餘空格
            // 僅處理單獨存在的空格，不處理兩個以上的空格
            const cleanedMarkdown = markdown
                .split('\n')
                .map((line) => line.replace(/^ (?! )/, '').replace(/(?<! ) $/, ''))
                .join('\n');

            await writeContentToFile(
                frontMatter + cleanedMarkdown,
                slug,
                `${outputDir}_md/${section}`
            );
            console.log(`File saved: ${slug}`);
        });
    } catch (error) {
        console.error('發生錯誤：', error);
    }
}

main(process.argv[2], process.argv[3]);
