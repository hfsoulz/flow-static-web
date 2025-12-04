# About flow-static-web

flow-static-web is a custom Node.js based cli tool which is used to generate
the static luflow.net website available at [https://www.luflow.net](https://www.luflow.net).

# Installation

Install Node.js (using Debian GNU/Linux):

```sh
sudo apt install nodejs npm
```

Install Node.js (using Arch Linux):

```sh
sudo pacman -S nodejs npm
```

For other platforms see: [https://nodejs.org/en](https://nodejs.org/en)

Install Node.js packages needed for the cli tool:

```sh
npm install
```

# Generate the website

```sh
node app
```

The output can be found in the '**output**' folder.

# Serve locally

Install servez globally:

```sh
npm install -g servez
```

Run the following command to serve locally:

```sh
servez output
```

Then, visit the following url in a web browser:

http://localhost:8080/

You can stop the server pressing CTRL+c.

# LICENSE

See the file 'LICENSE' for license information.

# Graphics

Public domain 2015 Luis Felipe López Acevedo and Andreas Widen 2025.

All the graphics in this directory are dedicated to the public domain, except
for the luflow.net logo (navigation bar logo to the left), which can be used
under the Creative Commons Attribution-ShareAlike 4.0 International License.
