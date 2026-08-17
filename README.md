# Sara Site

Static site for Sara built with [Hugo](https://gohugo.io/).

## Content

Generally, edit content in:

- The pages are in `site/content/`. (There is one markdown file per page.)
- Some config stuff is in `site/hugo.toml`.

Images are in:

- `site/static/images/` (pictures on site)
- `site/static/svgs/` (for the science art)

Don't worry about auto-generated content:

- `site/public/` (the generated site, which is what gets deployed)
- `site/resources/` (the generated resources, like resized images)

## Usage

Development

```sh
hugo server -D
```

Production

```sh
hugo
```

### Formatting

This project uses [mise](https://mise.jdx.dev/) to manage and run formatting tools:

- **`gotmplfmt`**: Formats Go/Hugo template files in `site/themes/my-theme/layouts/`.
- **`oxfmt`**: Formats JS, CSS, and configuration files (like `site/hugo.toml`).

To format all layout templates and assets in one command:

```sh
mise run fmt
```

`oxfmt` configuration and exclusion rules are defined in `.oxfmtrc.json`.
