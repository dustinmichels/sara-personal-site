# Sara Site

Static site for Sara built with [Hugo](https://gohugo.io/).

## Editing content

Generally, edit content in:

- The pages are in `site/content/`. (There is one markdown file per page.)
- Some config stuff is in `site/hugo.toml`.

Images are in:

- `site/assets/images/` (pictures on site)
- `site/static/svgs/` (for the science art)

Don't worry about auto-generated content:

- `site/public/` (the generated site, which is what gets deployed)
- `site/resources/` (the generated resources, like resized images)

## Development

To install dev dependencies (hugo, gotmplfmt, and oxfmt), run, first:

> Install [mise](https://mise.jdx.dev/installing-mise.html)

then run:

```sh
mise install
```

To run the development server, run:

```sh
mise dev

# or,
cd site && hugo server -D
```

To format code with gotmplfmt and oxfmt, run:

```sh
mise run fmt
```

To build the site for production:

```sh
mise run build
```
