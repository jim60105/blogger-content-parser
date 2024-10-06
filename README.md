# Blogger Content Parser

A JavaScript project designed to parse and extract content from Blogger XML files and convert it into Markdown format.

## Installation

Make sure you have [Node.js](https://nodejs.org/) 20+ installed on your system.

```bash
npm install
```

## Usage

### Getting the Blogger XML file

Get the backup of your Blogger

## Parse the Blogger XML file

To run the parser, use the following command:

```bash
node xml-content-extractor.js <inputFile> <outputDir>
```

Replace `<inputFile>` with the path to your Blogger XML file and `<outputDir>` with the desired output directory.

## Example

```bash
node xml-content-extractor.js blog-10-05-2024.xml output
```

This will parse `blog-10-05-2024.xml` and save the converted Markdown files in the `output` directory.

## License

<img src="https://github.com/jim60105/docker-yt-dlp/assets/16995691/f33f8175-af23-4a8a-ad69-efd17a7625f4" alt="gplv3" width="300" />

[GNU GENERAL PUBLIC LICENSE Version 3](LICENSE)

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
