# webgme-json
## Purpose
This project intends to provide a simple JSON domain where users can create/import/export JSON content. It allows for typing and instantiating JSON to help with creating small changes in objects.
The short-term future is going to bring specialized visualizer that leverages the type-instance relationship and allows for more control. Additionally, potential text based editing will be available... (however using the import/export functions it can already be done, but might be too cumbersome).

## Installation
First, install the webgme-json following:
- [NodeJS](https://nodejs.org/en/) (LTS recommended)
- [MongoDB](https://www.mongodb.com/)

Second, start mongodb locally by running the `mongod` executable in your mongodb installation (you may need to create a `data` directory or set `--dbpath`).

Then, run `webgme start` from the project root to start . Finally, navigate to `http://localhost:8888` to start using webgme-json!


