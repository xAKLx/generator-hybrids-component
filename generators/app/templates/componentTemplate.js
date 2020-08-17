import { html, define } from "hybrids";

export const <%= camelCase %> = {
  render: () => 
  html`
    My component named <%= name %>
  `,
};

define("<%= componentName %>", <%= camelCase %>); /* eslint-disable-line */