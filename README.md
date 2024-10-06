# Blogger Content Parser

A script designed to moving from Google Blogger to the static site generator (Zola).

Parse and extract content from Blogger backup XML files and convert it into Markdown format.

## Installation

Make sure you have [Node.js](https://nodejs.org/) 20+ installed on your system.

```bash
npm install
```

## Usage

### Getting the Blogger XML file

![blogger](https://github.com/user-attachments/assets/0695622a-2b07-469f-af47-6bf3ddf84b26)

## Parse the Blogger XML file

```bash
node xml-content-extractor.js <inputFile> <outputDir>
```

Replace `<inputFile>` with the path to your Blogger XML file and `<outputDir>` with the desired output directory.

Example

```bash
node xml-content-extractor.js blog-10-05-2024.xml output
```

This will parse `blog-10-05-2024.xml` and save the converted Markdown files in the `output` directory.

## License

<img src="https://github.com/user-attachments/assets/3c9ca468-0e2c-41b8-a1ab-9a91181eedfc" alt="gplv3" width="300" />

[GNU GENERAL PUBLIC LICENSE Version 3](LICENSE)

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
