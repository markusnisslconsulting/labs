# Security policy

- Report vulnerabilities to **contact@markusnissl.com** (PGP on
  request). Do not open a public issue for a vulnerability.
- Response window: 5 working days for a first assessment.
- Scope: the labs site, the design system packages and the Storybook
  build. The deployed sites contain no user accounts and no stored
  secrets; report anything beyond that with reproduction steps.
- Dependencies are audited weekly (GitHub Action
  `Dependency audit`); high/critical findings in production
  dependencies block.
